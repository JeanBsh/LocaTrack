'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Tenant, Lease, Property, UserProfile } from '@/types';
import RentReceiptGenerator from '@/components/documents/RentReceiptGenerator';
import RentCertificateGenerator from '@/components/documents/RentCertificateGenerator';
import LeaseContractGenerator from '@/components/documents/LeaseContractGenerator';
import { Search, FileText, User, MapPin, AlertCircle, Loader2, Download, CheckSquare, Square, X } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { pdf } from '@react-pdf/renderer';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { convertImageToBase64 } from '@/lib/utils';
import { RentReceiptPdf } from '@/components/documents/RentReceiptPdf';
import { RentCertificatePdf } from '@/components/documents/RentCertificatePdf';
import { LeaseContractPdf } from '@/components/documents/LeaseContractPdf';

export default function DocumentsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [leases, setLeases] = useState<Lease[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Bulk Actions State
    const [selectedTenantIds, setSelectedTenantIds] = useState<Set<string>>(new Set());
    const [bulkMonth, setBulkMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [selectedDocTypes, setSelectedDocTypes] = useState<{
        receipt: boolean;
        certificate: boolean;
        lease: boolean;
    }>({
        receipt: true,
        certificate: false,
        lease: false,
    });
    const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);

    useEffect(() => {
        let unsubscribeTenants: (() => void) | undefined;
        let unsubscribeLeases: (() => void) | undefined;
        let unsubscribeProperties: (() => void) | undefined;
        let unsubscribeProfile: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user) {
                setLoading(false);
                return;
            }

            const qTenants = query(collection(db, 'locataires'), where('userId', '==', user.uid));
            unsubscribeTenants = onSnapshot(qTenants, (snapshot) => {
                const tenantsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tenant));
                tenantsData.sort((a, b) => {
                    const nameA = a.personalInfo?.lastName || '';
                    const nameB = b.personalInfo?.lastName || '';
                    return nameA.localeCompare(nameB);
                });
                setTenants(tenantsData);
            });

            const qLeases = query(collection(db, 'leases'), where('userId', '==', user.uid));
            unsubscribeLeases = onSnapshot(qLeases, (snapshot) => {
                setLeases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lease)));
            });

            const qProperties = query(collection(db, 'biens'), where('userId', '==', user.uid));
            unsubscribeProperties = onSnapshot(qProperties, (snapshot) => {
                setProperties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property)));
            });

            const profileRef = doc(db, 'profiles', user.uid);
            unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
                if (docSnap.exists()) {
                    setUserProfile(docSnap.data() as UserProfile);
                }
            });
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeTenants) unsubscribeTenants();
            if (unsubscribeLeases) unsubscribeLeases();
            if (unsubscribeProperties) unsubscribeProperties();
            if (unsubscribeProfile) unsubscribeProfile();
        };
    }, []);

    useEffect(() => {
        if (tenants.length > 0 || leases.length > 0 || properties.length > 0) {
            setLoading(false);
        }
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(timer);
    }, [tenants, leases, properties]);

    const getTenantDetails = (tenant: Tenant) => {
        const activeLease = leases.find(l => l.tenantId === tenant.id);
        const property = activeLease ? properties.find(p => p.id === activeLease.propertyId) : null;
        return { activeLease, property };
    };

    const filteredTenants = tenants.filter(tenant =>
        tenant.personalInfo.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.personalInfo.firstName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleTenantSelection = (tenantId: string) => {
        const newSelected = new Set(selectedTenantIds);
        if (newSelected.has(tenantId)) {
            newSelected.delete(tenantId);
        } else {
            newSelected.add(tenantId);
        }
        setSelectedTenantIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedTenantIds.size === filteredTenants.length) {
            setSelectedTenantIds(new Set());
        } else {
            const allIds = new Set(filteredTenants.map(t => t.id));
            setSelectedTenantIds(allIds);
        }
    };

    const handleBulkDownload = async () => {
        setIsGeneratingBulk(true);
        try {
            const zip = new JSZip();
            const [year, month] = bulkMonth.split('-');
            const periodDate = new Date(parseInt(year), parseInt(month) - 1, 1);

            // Prepare user profile images once
            let ownerInfo: any = undefined;
            if (userProfile) {
                let logoBase64 = userProfile.logoUrl;
                let signatureBase64 = userProfile.signatureUrl;

                if (userProfile.logoUrl?.startsWith('http')) {
                    const base64 = await convertImageToBase64(userProfile.logoUrl);
                    if (base64) logoBase64 = base64;
                }
                if (userProfile.signatureUrl?.startsWith('http')) {
                    const base64 = await convertImageToBase64(userProfile.signatureUrl);
                    if (base64) signatureBase64 = base64;
                }

                ownerInfo = {
                    name: userProfile.ownerInfo.name,
                    address: `${userProfile.ownerInfo.address}, ${userProfile.ownerInfo.zipCode} ${userProfile.ownerInfo.city}`, // For Lease
                    addressMultiLine: `${userProfile.ownerInfo.address}\n${userProfile.ownerInfo.zipCode} ${userProfile.ownerInfo.city}`, // For Receipt
                    signatureUrl: signatureBase64,
                    logoUrl: logoBase64,
                };
            }

            // Loop through selected tenants
            for (const tenantId of selectedTenantIds) {
                const tenant = tenants.find(t => t.id === tenantId);
                if (!tenant) continue;

                const { activeLease, property } = getTenantDetails(tenant);
                if (!activeLease || !property) continue;

                const nameSuffix = `${tenant.personalInfo.lastName}_${tenant.personalInfo.firstName}`;

                // Receipt
                if (selectedDocTypes.receipt) {
                    const blob = await pdf(
                        <RentReceiptPdf
                            tenant={tenant}
                            property={property}
                            lease={activeLease}
                            period={periodDate}
                            ownerInfo={ownerInfo ? {
                                name: ownerInfo.name,
                                address: ownerInfo.addressMultiLine,
                                signatureUrl: ownerInfo.signatureUrl,
                                logoUrl: ownerInfo.logoUrl
                            } : undefined}
                        />
                    ).toBlob();
                    zip.file(`Quittance_${format(periodDate, 'yyyy-MM')}_${nameSuffix}.pdf`, blob);
                }

                // Certificate
                if (selectedDocTypes.certificate) {
                    const blob = await pdf(
                        <RentCertificatePdf
                            tenant={tenant}
                            property={property}
                            lease={activeLease}
                            ownerName={ownerInfo?.name}
                            signatureUrl={ownerInfo?.signatureUrl}
                            logoUrl={ownerInfo?.logoUrl}
                        />
                    ).toBlob();
                    zip.file(`Attestation_${nameSuffix}.pdf`, blob);
                }

                // Lease
                if (selectedDocTypes.lease) {
                    const blob = await pdf(
                        <LeaseContractPdf
                            tenant={tenant}
                            property={property}
                            lease={activeLease}
                            ownerInfo={ownerInfo ? {
                                name: ownerInfo.name,
                                address: ownerInfo.address,
                                email: userProfile?.ownerInfo.email,
                                signatureUrl: ownerInfo.signatureUrl,
                                logoUrl: ownerInfo.logoUrl
                            } : undefined}
                        />
                    ).toBlob();
                    zip.file(`Bail_${nameSuffix}.pdf`, blob);
                }
            }

            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `Documents_LocaTrack_${format(new Date(), 'yyyyMMdd_HHmm')}.zip`);

        } catch (error) {
            console.error("Error bulk generating:", error);
            alert("Une erreur est survenue lors de la génération des documents.");
        } finally {
            setIsGeneratingBulk(false);
            setSelectedTenantIds(new Set()); // Reset selection after download
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-32">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Documents</h1>
                    <p className="text-slate-500">Générez et gérez les documents administratifs pour vos locataires.</p>
                </div>

                {/* Search and Select Actions */}
                <div className="flex gap-4 w-full md:w-auto">
                    {filteredTenants.length > 0 && (
                        <button
                            onClick={toggleSelectAll}
                            className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors"
                        >
                            {selectedTenantIds.size === filteredTenants.length && filteredTenants.length > 0 ? (
                                <CheckSquare size={18} className="mr-2 text-blue-600" />
                            ) : (
                                <Square size={18} className="mr-2 text-slate-400" />
                            )}
                            Tout sélectionner
                        </button>
                    )}

                    <div className="relative flex-grow md:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Tenants Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTenants.map(tenant => {
                    const { activeLease, property } = getTenantDetails(tenant);
                    const isSelected = selectedTenantIds.has(tenant.id);

                    return (
                        <div
                            key={tenant.id}
                            className={`relative bg-white rounded-2xl shadow-sm border transition-all duration-300 flex flex-col ${isSelected ? 'border-blue-500 shadow-blue-100 ring-1 ring-blue-500' : 'border-slate-100 hover:shadow-md'}`}
                        >
                            {/* Selection Checkbox Overlay */}
                            {activeLease && property && (
                                <div className="absolute top-4 right-4 z-10">
                                    <button
                                        onClick={() => toggleTenantSelection(tenant.id)}
                                        className={`p-1.5 rounded-lg transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-white text-slate-300 hover:text-slate-400 border border-slate-200'}`}
                                    >
                                        <CheckSquare size={20} />
                                    </button>
                                </div>
                            )}

                            {/* Card Header */}
                            <div className="bg-gradient-to-r from-slate-50 to-white p-5 border-b border-slate-100">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-200">
                                            {tenant.personalInfo.firstName[0]}{tenant.personalInfo.lastName[0]}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900 leading-tight">
                                                {tenant.personalInfo.firstName} {tenant.personalInfo.lastName}
                                            </h2>
                                            <span className="inline-flex items-center text-xs font-medium text-slate-500 mt-0.5">
                                                <User size={12} className="mr-1" /> Locataire
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {property ? (
                                    <div className="mt-4 p-3 bg-white/50 rounded-lg border border-slate-100 backdrop-blur-sm">
                                        <div className="flex items-center text-sm text-slate-700 font-medium mb-1">
                                            <MapPin size={14} className="text-blue-500 mr-1.5" />
                                            {property.address.street}
                                        </div>
                                        <div className="text-xs text-slate-500 pl-5">
                                            {property.address.zipCode} {property.address.city} • {property.type}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                                        <div className="flex items-center text-xs text-red-600">
                                            <AlertCircle size={14} className="mr-1.5" />
                                            Aucun bail actif
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Card Actions */}
                            <div className="p-5 flex-grow flex flex-col justify-end bg-white">
                                {activeLease && property ? (
                                    <div className="space-y-3">
                                        <RentReceiptGenerator
                                            tenant={tenant}
                                            property={property}
                                            lease={activeLease}
                                            ownerProfile={userProfile}
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <RentCertificateGenerator
                                                tenant={tenant}
                                                property={property}
                                                lease={activeLease}
                                                ownerProfile={userProfile}
                                            />
                                            <LeaseContractGenerator
                                                tenant={tenant}
                                                property={property}
                                                lease={activeLease}
                                                ownerProfile={userProfile}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <p className="text-sm text-slate-500 font-medium">Documents indisponibles</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {filteredTenants.length === 0 && (
                    <div className="col-span-full py-16 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                            <Search className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Aucun locataire trouvé</h3>
                        <p className="mt-1 text-slate-500">Essayez de modifier votre recherche ou ajoutez un nouveau locataire.</p>
                        <Link href="/locataires/nouveau" className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Ajouter un locataire
                        </Link>
                    </div>
                )}
            </div>

            {/* Bulk Action Sticky Bar */}
            <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-transform duration-300 transform ${selectedTenantIds.size > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="max-w-7xl mx-auto px-4 py-4 md:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">

                        {/* Selected Count */}
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-sm">
                                {selectedTenantIds.size} sélectionné{selectedTenantIds.size > 1 ? 's' : ''}
                            </div>
                            <button onClick={() => setSelectedTenantIds(new Set())} className="text-sm text-slate-500 hover:text-slate-800 flex items-center">
                                <X size={14} className="mr-1" /> Annuler
                            </button>
                        </div>

                        {/* Configuration Controls */}
                        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                            {/* Date Picker */}
                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                <span className="text-xs font-medium text-slate-500 uppercase">Période :</span>
                                <input
                                    type="month"
                                    className="bg-transparent border-none p-0 text-sm font-medium text-slate-700 focus:ring-0"
                                    value={bulkMonth}
                                    onChange={(e) => setBulkMonth(e.target.value)}
                                />
                            </div>

                            {/* Document Types */}
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedDocTypes.receipt}
                                        onChange={(e) => setSelectedDocTypes(prev => ({ ...prev, receipt: e.target.checked }))}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-slate-700">Quittance</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedDocTypes.certificate}
                                        onChange={(e) => setSelectedDocTypes(prev => ({ ...prev, certificate: e.target.checked }))}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-slate-700">Attestation</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedDocTypes.lease}
                                        onChange={(e) => setSelectedDocTypes(prev => ({ ...prev, lease: e.target.checked }))}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-slate-700">Bail</span>
                                </label>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleBulkDownload}
                            disabled={isGeneratingBulk || (!selectedDocTypes.receipt && !selectedDocTypes.certificate && !selectedDocTypes.lease)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
                        >
                            {isGeneratingBulk ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Génération...
                                </>
                            ) : (
                                <>
                                    <Download size={18} />
                                    Télécharger les documents
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
