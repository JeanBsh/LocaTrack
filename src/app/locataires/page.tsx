'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, where, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Tenant, Lease, Property } from '@/types';
import Link from 'next/link';
import {
    Users, Loader2, Mail, Phone, Plus, ShieldCheck,
    Edit3, Trash2, Save, ChevronRight, MapPin, Building2, CreditCard, UserPlus, UserCheck
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import SlidePanel from '@/components/ui/SlidePanel';
import { useForm, useFieldArray } from 'react-hook-form';
import { useRouter } from 'next/navigation';

const statusStyles: Record<string, string> = {
    'ACTIF': 'bg-success-50 text-success-600',
    'ARCHIVE': 'bg-slate-100 text-text-tertiary',
};

const paymentLabels: Record<string, string> = {
    'VIREMENT': 'Virement',
    'CHEQUE': 'Chèque',
    'ESPECES': 'Espèces',
};

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [leases, setLeases] = useState<Lease[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    const { register, handleSubmit, reset, control } = useForm<Tenant>();
    const { fields: guarantorFields, append: appendGuarantor, remove: removeGuarantor } = useFieldArray({ control, name: 'guarantors' });
    const { fields: roommateFields, append: appendRoommate, remove: removeRoommate } = useFieldArray({ control, name: 'roommates' });

    useEffect(() => {
        let unsubTenants: (() => void) | undefined;
        let unsubLeases: (() => void) | undefined;
        let unsubProperties: (() => void) | undefined;

        const unsubAuth = onAuthStateChanged(auth, (user) => {
            if (!user) { setLoading(false); return; }

            const qT = query(collection(db, 'locataires'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
            unsubTenants = onSnapshot(qT, (snap) => {
                setTenants(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Tenant[]);
                setLoading(false);
            });

            const qL = query(collection(db, 'leases'), where('userId', '==', user.uid));
            unsubLeases = onSnapshot(qL, (snap) => {
                setLeases(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Lease[]);
            });

            const qP = query(collection(db, 'biens'), where('userId', '==', user.uid));
            unsubProperties = onSnapshot(qP, (snap) => {
                setProperties(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Property[]);
            });
        });

        return () => {
            unsubAuth();
            unsubTenants?.();
            unsubLeases?.();
            unsubProperties?.();
        };
    }, []);

    const getTenantProperty = (tenantId: string) => {
        const lease = leases.find(l => l.tenantId === tenantId);
        const property = lease ? properties.find(p => p.id === lease.propertyId) : null;
        return { lease, property };
    };

    const openPanel = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setIsEditing(false);
        reset(tenant);
    };

    const closePanel = () => {
        setSelectedTenant(null);
        setIsEditing(false);
    };

    const onSubmit = async (data: Tenant) => {
        if (!selectedTenant) return;
        setIsSaving(true);
        try {
            const docRef = doc(db, 'locataires', selectedTenant.id);
            const { id, ...updateData } = data;
            await updateDoc(docRef, updateData);
            setSelectedTenant({ ...data, id: selectedTenant.id });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating tenant:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedTenant) return;
        if (confirm('Êtes-vous sûr de vouloir supprimer ce locataire ?')) {
            try {
                await deleteDoc(doc(db, 'locataires', selectedTenant.id));
                closePanel();
            } catch (error) {
                console.error("Error deleting tenant:", error);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-slate-600" size={28} />
                    <p className="text-sm text-text-tertiary">Chargement des locataires...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full p-6 md:p-12 space-y-6">
            <PageHeader
                title="Locataires"
                description="Gérez vos locataires et leurs informations"
                action={
                    <Link
                        href="/locataires/nouveau"
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-sm font-medium text-sm"
                    >
                        <Plus size={16} /> Nouveau locataire
                    </Link>
                }
            />

            {tenants.length === 0 ? (
                <div className="bg-surface rounded-xl border border-border">
                    <EmptyState
                        icon={Users}
                        title="Aucun locataire"
                        description="Commencez par ajouter votre premier locataire pour gérer vos locations."
                        actionLabel="Ajouter un locataire"
                        onAction={() => router.push('/locataires/nouveau')}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tenants.map((tenant) => {
                        const { property } = getTenantProperty(tenant.id);
                        return (
                            <div
                                key={tenant.id}
                                onClick={() => openPanel(tenant)}
                                className="bg-surface rounded-xl border border-border p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer group"
                            >
                                {/* Top: avatar + name + status */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm flex-shrink-0">
                                            {tenant.personalInfo.firstName[0]}{tenant.personalInfo.lastName[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-text-primary group-hover:text-slate-700 transition-colors leading-tight">
                                                {tenant.personalInfo.firstName} {tenant.personalInfo.lastName}
                                            </p>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${statusStyles[tenant.status] || 'bg-slate-100 text-text-tertiary'}`}>
                                                {tenant.status === 'ACTIF' ? 'Actif' : 'Archivé'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact info */}
                                <div className="space-y-1.5 mb-4">
                                    <div className="flex items-center gap-2 text-xs text-text-tertiary">
                                        <Mail size={12} className="flex-shrink-0" />
                                        <span className="truncate">{tenant.personalInfo.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-text-tertiary">
                                        <Phone size={12} className="flex-shrink-0" />
                                        <span>{tenant.personalInfo.phone}</span>
                                    </div>
                                </div>

                                {/* Bottom: property + guarantors + chevron */}
                                <div className="flex items-center justify-between pt-3 border-t border-border-light">
                                    <div className="flex items-center gap-4 text-xs text-text-tertiary">
                                        {property ? (
                                            <div className="flex items-center gap-1">
                                                <Building2 size={12} />
                                                <span className="truncate max-w-[120px]">{property.denomination || property.address.city}</span>
                                            </div>
                                        ) : (
                                            <span className="text-text-tertiary italic">Aucun bien lié</span>
                                        )}
                                        {tenant.guarantors && tenant.guarantors.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                <ShieldCheck size={12} className="text-success-500" />
                                                {tenant.guarantors.length}
                                            </div>
                                        )}
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─── Slide Panel ──────────────────────────────────────────────── */}
            <SlidePanel
                open={!!selectedTenant}
                onClose={closePanel}
                title={isEditing ? 'Modifier le locataire' : 'Détail du locataire'}
                footer={selectedTenant && (
                    <div className="px-6 py-4 border-t border-border bg-surface flex items-center justify-between">
                        {isEditing ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => { setIsEditing(false); reset(selectedTenant); }}
                                    className="px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover rounded-lg transition-colors cursor-pointer"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit(onSubmit)}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                    Enregistrer
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 rounded-lg transition-colors cursor-pointer"
                                >
                                    <Trash2 size={14} /> Supprimer
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    <Edit3 size={14} /> Modifier
                                </button>
                            </>
                        )}
                    </div>
                )}
            >
                {selectedTenant && (() => {
                    const { property, lease } = getTenantProperty(selectedTenant.id);
                    return (
                        <div>
                            {/* Tenant Header */}
                            <div className="px-6 py-5 bg-surface-hover border-b border-border">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-base flex-shrink-0">
                                        {selectedTenant.personalInfo.firstName[0]}{selectedTenant.personalInfo.lastName[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-bold text-text-primary">
                                                {selectedTenant.personalInfo.firstName} {selectedTenant.personalInfo.lastName}
                                            </h3>
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[selectedTenant.status]}`}>
                                                {selectedTenant.status === 'ACTIF' ? 'Actif' : 'Archivé'}
                                            </span>
                                        </div>
                                        {property && (
                                            <div className="flex items-center gap-1.5 text-sm text-text-tertiary mt-1">
                                                <MapPin size={14} />
                                                {property.address.street}, {property.address.zipCode} {property.address.city}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-6 space-y-6">
                                {/* Informations personnelles */}
                                <div>
                                    <h4 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wider">Informations personnelles</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-text-tertiary mb-1.5">Prénom</label>
                                            <input
                                                disabled={!isEditing}
                                                {...register('personalInfo.firstName')}
                                                className="w-full px-3 py-2 border border-border rounded-lg text-sm disabled:bg-surface-hover disabled:text-text-secondary focus:outline-none focus:ring-2 focus:ring-slate-300"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-text-tertiary mb-1.5">Nom</label>
                                            <input
                                                disabled={!isEditing}
                                                {...register('personalInfo.lastName')}
                                                className="w-full px-3 py-2 border border-border rounded-lg text-sm disabled:bg-surface-hover disabled:text-text-secondary focus:outline-none focus:ring-2 focus:ring-slate-300"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-text-tertiary mb-1.5">Email</label>
                                            <input
                                                disabled={!isEditing}
                                                {...register('personalInfo.email')}
                                                className="w-full px-3 py-2 border border-border rounded-lg text-sm disabled:bg-surface-hover disabled:text-text-secondary focus:outline-none focus:ring-2 focus:ring-slate-300"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-text-tertiary mb-1.5">Téléphone</label>
                                            <input
                                                disabled={!isEditing}
                                                {...register('personalInfo.phone')}
                                                className="w-full px-3 py-2 border border-border rounded-lg text-sm disabled:bg-surface-hover disabled:text-text-secondary focus:outline-none focus:ring-2 focus:ring-slate-300"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Statut & Paiement */}
                                <div>
                                    <h4 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wider">Statut & Paiement</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-text-tertiary mb-1.5">Statut</label>
                                            <select
                                                disabled={!isEditing}
                                                {...register('status')}
                                                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface disabled:bg-surface-hover disabled:text-text-secondary focus:outline-none focus:ring-2 focus:ring-slate-300"
                                            >
                                                <option value="ACTIF">Actif</option>
                                                <option value="ARCHIVE">Archivé</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-text-tertiary mb-1.5">Mode de paiement</label>
                                            <select
                                                disabled={!isEditing}
                                                {...register('paymentMethod')}
                                                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface disabled:bg-surface-hover disabled:text-text-secondary focus:outline-none focus:ring-2 focus:ring-slate-300"
                                            >
                                                <option value="">Non défini</option>
                                                <option value="VIREMENT">Virement</option>
                                                <option value="CHEQUE">Chèque</option>
                                                <option value="ESPECES">Espèces</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Bien lié (read-only) */}
                                {!isEditing && property && lease && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wider">Bien lié</h4>
                                        <div className="bg-surface-hover rounded-lg p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-slate-200 text-slate-600">
                                                    <Building2 className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-text-primary">
                                                        {property.denomination || `${property.type} — ${property.address.city}`}
                                                    </p>
                                                    <p className="text-xs text-text-tertiary mt-0.5">
                                                        {property.address.street}, {property.address.zipCode} {property.address.city}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-border">
                                                <div>
                                                    <p className="text-xs text-text-tertiary">Loyer</p>
                                                    <p className="text-sm font-semibold text-text-primary">{(lease.financials?.currentRent || 0).toLocaleString('fr-FR')} €</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-text-tertiary">Charges</p>
                                                    <p className="text-sm font-semibold text-text-primary">{(lease.financials?.currentCharges || 0).toLocaleString('fr-FR')} €</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-text-tertiary">Dépôt</p>
                                                    <p className="text-sm font-semibold text-text-primary">{(lease.financials?.deposit || 0).toLocaleString('fr-FR')} €</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Garants */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Garants</h4>
                                        {isEditing && (
                                            <button
                                                type="button"
                                                onClick={() => appendGuarantor({ firstName: '', lastName: '', email: '', phone: '' })}
                                                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                                            >
                                                <Plus size={14} /> Ajouter
                                            </button>
                                        )}
                                    </div>
                                    {guarantorFields.length === 0 && !isEditing ? (
                                        <div className="bg-surface-hover rounded-lg p-4 text-center">
                                            <ShieldCheck className="h-5 w-5 text-text-tertiary mx-auto mb-1.5" />
                                            <p className="text-xs text-text-tertiary">Aucun garant enregistré</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {guarantorFields.map((field, index) => (
                                                <div key={field.id} className="bg-surface-hover rounded-lg p-4 relative">
                                                    {isEditing && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeGuarantor(index)}
                                                            className="absolute top-3 right-3 text-text-tertiary hover:text-danger-600 transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <input disabled={!isEditing} placeholder="Prénom" {...register(`guarantors.${index}.firstName`)} className="px-3 py-2 border border-border rounded-lg text-sm disabled:bg-surface disabled:text-text-secondary focus:outline-none focus:ring-2 focus:ring-slate-300" />
                                                        <input disabled={!isEditing} placeholder="Nom" {...register(`guarantors.${index}.lastName`)} className="px-3 py-2 border border-border rounded-lg text-sm disabled:bg-surface disabled:text-text-secondary focus:outline-none focus:ring-2 focus:ring-slate-300" />
                                                        <input disabled={!isEditing} placeholder="Email" {...register(`guarantors.${index}.email`)} className="px-3 py-2 border border-border rounded-lg text-sm disabled:bg-surface disabled:text-text-secondary focus:outline-none focus:ring-2 focus:ring-slate-300" />
                                                        <input disabled={!isEditing} placeholder="Téléphone" {...register(`guarantors.${index}.phone`)} className="px-3 py-2 border border-border rounded-lg text-sm disabled:bg-surface disabled:text-text-secondary focus:outline-none focus:ring-2 focus:ring-slate-300" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Co-locataires */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Co-locataires</h4>
                                        {isEditing && (
                                            <button
                                                type="button"
                                                onClick={() => appendRoommate({ firstName: '', lastName: '', email: '', phone: '' })}
                                                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                                            >
                                                <Plus size={14} /> Ajouter
                                            </button>
                                        )}
                                    </div>
                                    {roommateFields.length === 0 && !isEditing ? (
                                        <div className="bg-surface-hover rounded-lg p-4 text-center">
                                            <Users className="h-5 w-5 text-text-tertiary mx-auto mb-1.5" />
                                            <p className="text-xs text-text-tertiary">Aucun co-locataire</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {roommateFields.map((field, index) => (
                                                <div key={field.id} className="bg-surface-hover rounded-lg p-4 relative">
                                                    {isEditing && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeRoommate(index)}
                                                            className="absolute top-3 right-3 text-text-tertiary hover:text-danger-600 transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <input disabled={!isEditing} placeholder="Prénom" {...register(`roommates.${index}.firstName`)} className="px-3 py-2 border border-border rounded-lg text-sm disabled:bg-surface disabled:text-text-secondary focus:outline-none focus:ring-2 focus:ring-slate-300" />
                                                        <input disabled={!isEditing} placeholder="Nom" {...register(`roommates.${index}.lastName`)} className="px-3 py-2 border border-border rounded-lg text-sm disabled:bg-surface disabled:text-text-secondary focus:outline-none focus:ring-2 focus:ring-slate-300" />
                                                        <input disabled={!isEditing} placeholder="Email" {...register(`roommates.${index}.email`)} className="px-3 py-2 border border-border rounded-lg text-sm disabled:bg-surface disabled:text-text-secondary focus:outline-none focus:ring-2 focus:ring-slate-300" />
                                                        <input disabled={!isEditing} placeholder="Téléphone" {...register(`roommates.${index}.phone`)} className="px-3 py-2 border border-border rounded-lg text-sm disabled:bg-surface disabled:text-text-secondary focus:outline-none focus:ring-2 focus:ring-slate-300" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </SlidePanel>
        </div>
    );
}
