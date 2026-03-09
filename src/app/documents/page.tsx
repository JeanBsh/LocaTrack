'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Tenant, Lease, Property, UserProfile } from '@/types';
import RentReceiptGenerator from '@/components/documents/RentReceiptGenerator';
import RentCertificateGenerator from '@/components/documents/RentCertificateGenerator';
import LeaseContractGenerator from '@/components/documents/LeaseContractGenerator';
import {
    Search, FileText, User, MapPin, AlertCircle, Loader2, Download,
    CheckSquare, Square, X, FolderOpen, Upload, File, FileImage, FileSpreadsheet,
    MoreVertical, Calendar, HardDrive
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { pdf } from '@react-pdf/renderer';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { RentReceiptPdf } from '@/components/documents/RentReceiptPdf';
import { RentCertificatePdf } from '@/components/documents/RentCertificatePdf';
import { LeaseContractPdf } from '@/components/documents/LeaseContractPdf';
import { motion } from 'framer-motion';
import EmptyState from '@/components/ui/EmptyState';

// ─── Mock data for Coffre-fort ─────────────────────────────────────────────
const mockVaultDocuments = [
    { id: '1', name: 'Bail_Dupont_2024.pdf', type: 'pdf', category: 'Bail', tenant: 'M. Dupont', size: '245 Ko', date: '15/01/2024' },
    { id: '2', name: 'Facture_Plomberie_Mars.pdf', type: 'pdf', category: 'Facture', tenant: '—', size: '128 Ko', date: '12/03/2024' },
    { id: '3', name: 'Etat_des_lieux_Martin.pdf', type: 'pdf', category: 'État des lieux', tenant: 'Mme Martin', size: '1.2 Mo', date: '01/09/2023' },
    { id: '4', name: 'Assurance_Habitation_2024.pdf', type: 'pdf', category: 'Assurance', tenant: '—', size: '890 Ko', date: '20/01/2024' },
    { id: '5', name: 'Diagnostics_T3_Marseille.pdf', type: 'pdf', category: 'Diagnostic', tenant: '—', size: '2.1 Mo', date: '05/06/2023' },
    { id: '6', name: 'Photo_Appartement_01.jpg', type: 'image', category: 'Photo', tenant: '—', size: '3.4 Mo', date: '10/08/2023' },
    { id: '7', name: 'Releve_Charges_2023.xlsx', type: 'spreadsheet', category: 'Comptabilité', tenant: '—', size: '56 Ko', date: '31/12/2023' },
];

const fileIconMap: Record<string, { icon: any; color: string }> = {
    pdf: { icon: FileText, color: 'text-danger-600 bg-danger-50' },
    image: { icon: FileImage, color: 'text-warning-600 bg-warning-50' },
    spreadsheet: { icon: FileSpreadsheet, color: 'text-success-600 bg-success-50' },
    default: { icon: File, color: 'text-slate-600 bg-slate-100' },
};

const categoryColors: Record<string, string> = {
    'Bail': 'bg-slate-100 text-slate-700',
    'Facture': 'bg-warning-50 text-warning-600',
    'État des lieux': 'bg-success-50 text-success-600',
    'Assurance': 'bg-primary-100 text-primary-700',
    'Diagnostic': 'bg-danger-50 text-danger-600',
    'Photo': 'bg-warning-50 text-warning-600',
    'Comptabilité': 'bg-success-50 text-success-600',
};

export default function DocumentsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [leases, setLeases] = useState<Lease[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'generation' | 'vault'>('generation');

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

            let ownerInfo: any = undefined;
            if (userProfile) {
                ownerInfo = {
                    name: userProfile.ownerInfo.name,
                    address: `${userProfile.ownerInfo.address}, ${userProfile.ownerInfo.zipCode} ${userProfile.ownerInfo.city}`,
                    addressMultiLine: `${userProfile.ownerInfo.address}\n${userProfile.ownerInfo.zipCode} ${userProfile.ownerInfo.city}`,
                    signatureUrl: userProfile.signatureBase64 || userProfile.signatureUrl,
                    logoUrl: userProfile.logoBase64 || userProfile.logoUrl,
                };
            }

            for (const tenantId of selectedTenantIds) {
                const tenant = tenants.find(t => t.id === tenantId);
                if (!tenant) continue;

                const { activeLease, property } = getTenantDetails(tenant);
                if (!activeLease || !property) continue;

                const nameSuffix = `${tenant.personalInfo.lastName}_${tenant.personalInfo.firstName}`;

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
            setSelectedTenantIds(new Set());
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-slate-600" size={28} />
                    <p className="text-sm text-text-tertiary">Chargement des documents...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">Documents</h1>
                    <p className="text-text-tertiary text-sm mt-1">Générez et gérez vos documents administratifs</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('generation')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                        activeTab === 'generation'
                            ? 'bg-white text-text-primary shadow-sm'
                            : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                >
                    <FileText className="h-4 w-4 inline-block mr-2 -mt-0.5" />
                    Génération
                </button>
                <button
                    onClick={() => setActiveTab('vault')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                        activeTab === 'vault'
                            ? 'bg-white text-text-primary shadow-sm'
                            : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                >
                    <FolderOpen className="h-4 w-4 inline-block mr-2 -mt-0.5" />
                    Coffre-fort
                </button>
            </div>

            {/* ─── TAB: Génération ─────────────────────────────────────────────── */}
            {activeTab === 'generation' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                    {/* Search + Select */}
                    <div className="flex gap-3 mb-6 w-full">
                        {filteredTenants.length > 0 && (
                            <button
                                onClick={toggleSelectAll}
                                className="flex items-center px-4 py-2 bg-surface border border-border rounded-lg hover:bg-surface-hover text-text-secondary font-medium transition-colors text-sm cursor-pointer"
                            >
                                {selectedTenantIds.size === filteredTenants.length && filteredTenants.length > 0 ? (
                                    <CheckSquare size={16} className="mr-2 text-slate-700" />
                                ) : (
                                    <Square size={16} className="mr-2 text-text-tertiary" />
                                )}
                                Tout sélectionner
                            </button>
                        )}
                        <div className="relative flex-grow max-w-xs">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-text-tertiary" />
                            </div>
                            <input
                                type="text"
                                placeholder="Rechercher un locataire..."
                                className="block w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm bg-surface placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Tenants Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredTenants.map(tenant => {
                            const { activeLease, property } = getTenantDetails(tenant);
                            const isSelected = selectedTenantIds.has(tenant.id);

                            return (
                                <div
                                    key={tenant.id}
                                    className={`relative bg-surface rounded-xl border transition-all duration-200 flex flex-col ${
                                        isSelected
                                            ? 'border-slate-400 shadow-md ring-1 ring-slate-400'
                                            : 'border-border hover:shadow-md'
                                    }`}
                                >
                                    {activeLease && property && (
                                        <div className="absolute top-4 right-4 z-10">
                                            <button
                                                onClick={() => toggleTenantSelection(tenant.id)}
                                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-slate-800 text-white'
                                                        : 'bg-surface text-text-tertiary hover:text-text-secondary border border-border'
                                                }`}
                                            >
                                                <CheckSquare size={18} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Card Header */}
                                    <div className="p-5 border-b border-border-light">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm">
                                                {tenant.personalInfo.firstName[0]}{tenant.personalInfo.lastName[0]}
                                            </div>
                                            <div>
                                                <h2 className="text-sm font-semibold text-text-primary leading-tight">
                                                    {tenant.personalInfo.firstName} {tenant.personalInfo.lastName}
                                                </h2>
                                                <span className="text-xs text-text-tertiary">Locataire</span>
                                            </div>
                                        </div>

                                        {property ? (
                                            <div className="mt-3 p-2.5 bg-surface-hover rounded-lg">
                                                <div className="flex items-center text-xs text-text-secondary font-medium">
                                                    <MapPin size={12} className="text-text-tertiary mr-1.5 flex-shrink-0" />
                                                    {property.address.street}
                                                </div>
                                                <div className="text-xs text-text-tertiary mt-0.5 pl-[18px]">
                                                    {property.address.zipCode} {property.address.city} · {property.type}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-3 p-2.5 bg-danger-50 rounded-lg">
                                                <div className="flex items-center text-xs text-danger-600">
                                                    <AlertCircle size={12} className="mr-1.5" />
                                                    Aucun bail actif
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Actions */}
                                    <div className="p-5 flex-grow flex flex-col justify-end">
                                        {activeLease && property ? (
                                            <div className="space-y-2.5">
                                                <RentReceiptGenerator
                                                    tenant={tenant}
                                                    property={property}
                                                    lease={activeLease}
                                                    ownerProfile={userProfile}
                                                />
                                                <div className="grid grid-cols-2 gap-2.5">
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
                                            <div className="flex flex-col items-center justify-center py-4 text-center bg-surface-hover rounded-lg border border-dashed border-border">
                                                <p className="text-xs text-text-tertiary font-medium">Documents indisponibles</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {filteredTenants.length === 0 && (
                            <div className="col-span-full">
                                <EmptyState
                                    icon={User}
                                    title="Aucun locataire trouvé"
                                    description="Ajoutez un locataire et liez-le à un bien pour pouvoir générer des documents."
                                    actionLabel="Ajouter un locataire"
                                    onAction={() => window.location.href = '/locataires/nouveau'}
                                />
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* ─── TAB: Coffre-fort ───────────────────────────────────────────── */}
            {activeTab === 'vault' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                    {/* Upload Zone */}
                    <div className="border-2 border-dashed border-border rounded-xl p-8 mb-6 text-center hover:border-slate-400 hover:bg-surface-hover transition-all cursor-pointer group">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3 group-hover:bg-slate-200 transition-colors">
                            <Upload className="h-5 w-5 text-text-tertiary" />
                        </div>
                        <p className="text-sm font-medium text-text-primary">
                            Glissez-déposez vos fichiers ici
                        </p>
                        <p className="text-xs text-text-tertiary mt-1">
                            ou <span className="text-slate-700 font-medium underline underline-offset-2">parcourir</span> · PDF, JPG, PNG, XLSX (max 10 Mo)
                        </p>
                    </div>

                    {/* Storage info */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <HardDrive className="h-4 w-4 text-text-tertiary" />
                            <span><strong>{mockVaultDocuments.length}</strong> documents · 8.1 Mo utilisés</span>
                        </div>
                        <div className="relative max-w-xs w-full hidden md:block">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-text-tertiary" />
                            </div>
                            <input
                                type="text"
                                placeholder="Rechercher un document..."
                                className="block w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm bg-surface placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all"
                            />
                        </div>
                    </div>

                    {/* Documents Table */}
                    <div className="bg-surface rounded-xl border border-border overflow-hidden">
                        {/* Table Header */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-surface-hover border-b border-border text-xs font-medium text-text-tertiary uppercase tracking-wider">
                            <div className="col-span-5">Document</div>
                            <div className="col-span-2">Catégorie</div>
                            <div className="col-span-2">Locataire</div>
                            <div className="col-span-1">Taille</div>
                            <div className="col-span-1">Date</div>
                            <div className="col-span-1"></div>
                        </div>

                        {/* Table Rows */}
                        {mockVaultDocuments.map((docItem, idx) => {
                            const fileInfo = fileIconMap[docItem.type] || fileIconMap.default;
                            const FileIcon = fileInfo.icon;
                            return (
                                <div
                                    key={docItem.id}
                                    className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-3.5 items-center hover:bg-surface-hover transition-colors cursor-pointer ${
                                        idx < mockVaultDocuments.length - 1 ? 'border-b border-border-light' : ''
                                    }`}
                                >
                                    {/* Name */}
                                    <div className="md:col-span-5 flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${fileInfo.color} flex-shrink-0`}>
                                            <FileIcon className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm font-medium text-text-primary truncate">{docItem.name}</span>
                                    </div>
                                    {/* Category */}
                                    <div className="md:col-span-2">
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${categoryColors[docItem.category] || 'bg-slate-100 text-slate-600'}`}>
                                            {docItem.category}
                                        </span>
                                    </div>
                                    {/* Tenant */}
                                    <div className="md:col-span-2 text-sm text-text-secondary">{docItem.tenant}</div>
                                    {/* Size */}
                                    <div className="md:col-span-1 text-xs text-text-tertiary">{docItem.size}</div>
                                    {/* Date */}
                                    <div className="md:col-span-1 text-xs text-text-tertiary">{docItem.date}</div>
                                    {/* Actions */}
                                    <div className="md:col-span-1 flex justify-end">
                                        <button className="p-1.5 rounded-lg hover:bg-slate-100 text-text-tertiary transition-colors cursor-pointer">
                                            <Download className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Bulk Action Sticky Bar */}
            <div className={`fixed bottom-0 left-0 right-0 bg-surface border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-transform duration-300 transform z-50 ${
                selectedTenantIds.size > 0 ? 'translate-y-0' : 'translate-y-full'
            }`}>
                <div className="max-w-7xl mx-auto px-4 py-4 md:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-200 text-slate-800 font-bold px-3 py-1 rounded-full text-sm">
                                {selectedTenantIds.size} sélectionné{selectedTenantIds.size > 1 ? 's' : ''}
                            </div>
                            <button onClick={() => setSelectedTenantIds(new Set())} className="text-sm text-text-tertiary hover:text-text-primary flex items-center cursor-pointer">
                                <X size={14} className="mr-1" /> Annuler
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                            <div className="flex items-center gap-2 bg-surface-hover px-3 py-1.5 rounded-lg border border-border">
                                <span className="text-xs font-medium text-text-tertiary uppercase">Période :</span>
                                <input
                                    type="month"
                                    className="bg-transparent border-none p-0 text-sm font-medium text-text-primary focus:ring-0"
                                    value={bulkMonth}
                                    onChange={(e) => setBulkMonth(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                {(['receipt', 'certificate', 'lease'] as const).map((type) => {
                                    const labels = { receipt: 'Quittance', certificate: 'Attestation', lease: 'Bail' };
                                    return (
                                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedDocTypes[type]}
                                                onChange={(e) => setSelectedDocTypes(prev => ({ ...prev, [type]: e.target.checked }))}
                                                className="rounded border-slate-300 text-slate-800 focus:ring-slate-500"
                                            />
                                            <span className="text-sm text-text-secondary">{labels[type]}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <button
                            onClick={handleBulkDownload}
                            disabled={isGeneratingBulk || (!selectedDocTypes.receipt && !selectedDocTypes.certificate && !selectedDocTypes.lease)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
                        >
                            {isGeneratingBulk ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    Génération...
                                </>
                            ) : (
                                <>
                                    <Download size={16} />
                                    Télécharger
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
