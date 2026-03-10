'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, onSnapshot, query, where, doc, addDoc, deleteDoc, orderBy, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, auth, storage } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Tenant, Lease, Property, UserProfile } from '@/types';
import RentReceiptGenerator from '@/components/documents/RentReceiptGenerator';
import RentCertificateGenerator from '@/components/documents/RentCertificateGenerator';
import LeaseContractGenerator from '@/components/documents/LeaseContractGenerator';
import {
    Search, FileText, User, MapPin, AlertCircle, Loader2, Download,
    CheckSquare, Square, X, FolderOpen, Upload, File, FileImage, FileSpreadsheet,
    MoreVertical, Calendar, HardDrive, Trash2
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
import PageHeader from '@/components/ui/PageHeader';

// ─── Vault Document type ────────────────────────────────────────────────────
interface VaultDocument {
    id: string;
    name: string;
    type: string;
    size: number;
    storagePath: string;
    downloadUrl: string;
    uploadedAt: Date;
    userId: string;
}

function getFileType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'spreadsheet';
    return 'default';
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

const fileIconMap: Record<string, { icon: any; color: string }> = {
    pdf: { icon: FileText, color: 'text-danger-600 bg-danger-50' },
    image: { icon: FileImage, color: 'text-warning-600 bg-warning-50' },
    spreadsheet: { icon: FileSpreadsheet, color: 'text-success-600 bg-success-50' },
    default: { icon: File, color: 'text-slate-600 bg-slate-100' },
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

    // Vault state
    const [vaultDocuments, setVaultDocuments] = useState<VaultDocument[]>([]);
    const [vaultSearch, setVaultSearch] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let unsubscribeTenants: (() => void) | undefined;
        let unsubscribeLeases: (() => void) | undefined;
        let unsubscribeProperties: (() => void) | undefined;
        let unsubscribeProfile: (() => void) | undefined;
        let unsubscribeVault: (() => void) | undefined;

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

            const qVault = query(collection(db, 'vault-documents'), where('userId', '==', user.uid), orderBy('uploadedAt', 'desc'));
            unsubscribeVault = onSnapshot(qVault, (snapshot) => {
                setVaultDocuments(snapshot.docs.map(d => {
                    const data = d.data();
                    return {
                        id: d.id,
                        ...data,
                        uploadedAt: data.uploadedAt?.toDate?.() || new Date(),
                    } as VaultDocument;
                }));
            });
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeTenants) unsubscribeTenants();
            if (unsubscribeLeases) unsubscribeLeases();
            if (unsubscribeProperties) unsubscribeProperties();
            if (unsubscribeProfile) unsubscribeProfile();
            if (unsubscribeVault) unsubscribeVault();
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

    // ─── Vault handlers ──────────────────────────────────────────────────
    const handleVaultUpload = useCallback(async (files: FileList | File[]) => {
        const user = auth.currentUser;
        if (!user || files.length === 0) return;

        setIsUploading(true);
        try {
            for (const file of Array.from(files)) {
                if (file.size > 10 * 1024 * 1024) {
                    alert(`Le fichier "${file.name}" dépasse la limite de 10 Mo.`);
                    continue;
                }

                const storagePath = `vault/${user.uid}/${Date.now()}_${file.name}`;
                const storageRef = ref(storage, storagePath);
                await uploadBytes(storageRef, file);
                const downloadUrl = await getDownloadURL(storageRef);

                await addDoc(collection(db, 'vault-documents'), {
                    name: file.name,
                    type: getFileType(file.name),
                    size: file.size,
                    storagePath,
                    downloadUrl,
                    uploadedAt: Timestamp.now(),
                    userId: user.uid,
                });
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Une erreur est survenue lors de l\'upload.');
        } finally {
            setIsUploading(false);
        }
    }, []);

    const handleVaultDownload = useCallback(async (vaultDoc: VaultDocument) => {
        try {
            const link = document.createElement('a');
            link.href = vaultDoc.downloadUrl;
            link.target = '_blank';
            link.download = vaultDoc.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download error:', error);
        }
    }, []);

    const handleVaultDelete = useCallback(async (vaultDoc: VaultDocument) => {
        if (!confirm(`Supprimer "${vaultDoc.name}" ?`)) return;

        setDeletingId(vaultDoc.id);
        try {
            const storageRef = ref(storage, vaultDoc.storagePath);
            await deleteObject(storageRef);
            await deleteDoc(doc(db, 'vault-documents', vaultDoc.id));
        } catch (error) {
            console.error('Delete error:', error);
            alert('Une erreur est survenue lors de la suppression.');
        } finally {
            setDeletingId(null);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) {
            handleVaultUpload(e.dataTransfer.files);
        }
    }, [handleVaultUpload]);

    const filteredVaultDocuments = vaultDocuments.filter(d =>
        d.name.toLowerCase().includes(vaultSearch.toLowerCase())
    );

    const totalVaultSize = vaultDocuments.reduce((acc, d) => acc + d.size, 0);

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
        <div className="w-full p-6 md:p-12 pb-32 space-y-6">
            <PageHeader
                title="Documents"
                description="Générez et gérez vos documents administratifs"
            />

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filteredTenants.map(tenant => {
                            const { activeLease, property } = getTenantDetails(tenant);
                            const isSelected = selectedTenantIds.has(tenant.id);

                            return (
                                <div
                                    key={tenant.id}
                                    className={`relative bg-surface rounded-xl border transition-all duration-200 flex flex-col overflow-hidden ${
                                        isSelected
                                            ? 'border-slate-400 shadow-md ring-1 ring-slate-400'
                                            : 'border-border hover:shadow-md'
                                    }`}
                                >
                                    {/* Card Header with tenant info */}
                                    <div className="p-5 pb-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                    {tenant.personalInfo.firstName[0]}{tenant.personalInfo.lastName[0]}
                                                </div>
                                                <div>
                                                    <h2 className="text-sm font-semibold text-text-primary leading-tight">
                                                        {tenant.personalInfo.firstName} {tenant.personalInfo.lastName}
                                                    </h2>
                                                    {property ? (
                                                        <div className="flex items-center gap-1 mt-1 text-xs text-text-tertiary">
                                                            <MapPin size={11} className="flex-shrink-0" />
                                                            <span className="truncate max-w-[180px]">{property.address.city} · {property.type}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1 mt-1 text-xs text-danger-600">
                                                            <AlertCircle size={11} />
                                                            Aucun bail actif
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {activeLease && property && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleTenantSelection(tenant.id); }}
                                                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-slate-900 text-white shadow-sm'
                                                            : 'bg-surface-hover text-text-tertiary hover:text-text-secondary border border-border'
                                                    }`}
                                                >
                                                    <CheckSquare size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Document actions */}
                                    <div className="px-5 pb-5 flex-grow flex flex-col justify-end">
                                        {activeLease && property ? (
                                            <div className="space-y-2">
                                                <div className="bg-surface-hover rounded-lg p-3">
                                                    <RentReceiptGenerator
                                                        tenant={tenant}
                                                        property={property}
                                                        lease={activeLease}
                                                        ownerProfile={userProfile}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="bg-surface-hover rounded-lg p-3">
                                                        <RentCertificateGenerator
                                                            tenant={tenant}
                                                            property={property}
                                                            lease={activeLease}
                                                            ownerProfile={userProfile}
                                                        />
                                                    </div>
                                                    <div className="bg-surface-hover rounded-lg p-3">
                                                        <LeaseContractGenerator
                                                            tenant={tenant}
                                                            property={property}
                                                            lease={activeLease}
                                                            ownerProfile={userProfile}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-6 text-center bg-surface-hover rounded-lg border border-dashed border-border">
                                                <FileText className="h-5 w-5 text-text-tertiary mb-2" />
                                                <p className="text-xs text-text-tertiary font-medium">Associez un bail pour générer des documents</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {filteredTenants.length === 0 && (
                            <div className="col-span-full bg-surface rounded-xl border border-border">
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
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.xls,.xlsx,.csv,.doc,.docx"
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files) handleVaultUpload(e.target.files);
                            e.target.value = '';
                        }}
                    />

                    {/* Upload Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-10 mb-6 text-center transition-all cursor-pointer group ${
                            isDragging
                                ? 'border-slate-500 bg-slate-100 scale-[1.01]'
                                : 'border-border hover:border-slate-400 hover:bg-surface-hover/50'
                        }`}
                    >
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-slate-200 group-hover:scale-105 transition-all">
                            {isUploading ? (
                                <Loader2 className="h-6 w-6 text-slate-500 animate-spin" />
                            ) : (
                                <Upload className="h-6 w-6 text-slate-500" />
                            )}
                        </div>
                        <p className="text-sm font-semibold text-text-primary">
                            {isUploading ? 'Upload en cours...' : isDragging ? 'Déposez vos fichiers' : 'Glissez-déposez vos fichiers ici'}
                        </p>
                        <p className="text-xs text-text-tertiary mt-1.5">
                            ou <span className="text-slate-700 font-medium underline underline-offset-2 cursor-pointer">parcourir vos fichiers</span>
                        </p>
                        <p className="text-[11px] text-text-tertiary mt-2">
                            PDF, JPG, PNG, XLSX · max 10 Mo par fichier
                        </p>
                    </div>

                    {/* Storage info bar */}
                    <div className="flex items-center justify-between mb-5 bg-surface-hover rounded-lg px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-slate-200">
                                <HardDrive className="h-4 w-4 text-slate-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-text-primary">{vaultDocuments.length} document{vaultDocuments.length !== 1 ? 's' : ''}</p>
                                <p className="text-xs text-text-tertiary">{formatFileSize(totalVaultSize)} utilisés</p>
                            </div>
                        </div>
                        <div className="relative max-w-xs w-full hidden md:block">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-text-tertiary" />
                            </div>
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                className="block w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm bg-surface placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all"
                                value={vaultSearch}
                                onChange={(e) => setVaultSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Documents Table */}
                    {filteredVaultDocuments.length === 0 ? (
                        <div className="bg-surface rounded-xl border border-border">
                            <EmptyState
                                icon={FolderOpen}
                                title={vaultSearch ? 'Aucun document trouvé' : 'Votre coffre-fort est vide'}
                                description={vaultSearch ? 'Essayez avec un autre terme de recherche.' : 'Déposez vos fichiers pour les stocker en toute sécurité.'}
                            />
                        </div>
                    ) : (
                        <div className="bg-surface rounded-xl border border-border overflow-hidden">
                            {/* Table Header */}
                            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-surface-hover border-b border-border text-xs font-medium text-text-tertiary uppercase tracking-wider">
                                <div className="col-span-6">Document</div>
                                <div className="col-span-2">Taille</div>
                                <div className="col-span-2">Date</div>
                                <div className="col-span-2"></div>
                            </div>

                            {/* Table Rows */}
                            {filteredVaultDocuments.map((vaultDoc, idx) => {
                                const fileInfo = fileIconMap[vaultDoc.type] || fileIconMap.default;
                                const FileIcon = fileInfo.icon;
                                const isDeleting = deletingId === vaultDoc.id;
                                return (
                                    <div
                                        key={vaultDoc.id}
                                        className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-3.5 items-center hover:bg-surface-hover transition-colors group/row ${
                                            idx < filteredVaultDocuments.length - 1 ? 'border-b border-border-light' : ''
                                        } ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                                    >
                                        {/* Name */}
                                        <div className="md:col-span-6 flex items-center gap-3 min-w-0">
                                            <div className={`p-2 rounded-lg ${fileInfo.color} flex-shrink-0`}>
                                                <FileIcon className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm font-medium text-text-primary truncate">{vaultDoc.name}</span>
                                        </div>
                                        {/* Size */}
                                        <div className="md:col-span-2 text-xs text-text-tertiary">{formatFileSize(vaultDoc.size)}</div>
                                        {/* Date */}
                                        <div className="md:col-span-2 text-xs text-text-tertiary">
                                            {format(vaultDoc.uploadedAt, 'dd/MM/yyyy')}
                                        </div>
                                        {/* Actions */}
                                        <div className="md:col-span-2 flex justify-end gap-1">
                                            <button
                                                onClick={() => handleVaultDownload(vaultDoc)}
                                                className="p-1.5 rounded-lg hover:bg-slate-200 text-text-tertiary opacity-0 group-hover/row:opacity-100 transition-all cursor-pointer"
                                                title="Télécharger"
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleVaultDelete(vaultDoc)}
                                                className="p-1.5 rounded-lg hover:bg-danger-50 text-text-tertiary hover:text-danger-600 opacity-0 group-hover/row:opacity-100 transition-all cursor-pointer"
                                                title="Supprimer"
                                            >
                                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Bulk Action Sticky Bar */}
            <div className={`fixed bottom-0 left-0 right-0 bg-surface border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-transform duration-300 transform z-50 ${
                selectedTenantIds.size > 0 ? 'translate-y-0' : 'translate-y-full'
            }`}>
                <div className="w-full px-6 py-4 md:px-12">
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
