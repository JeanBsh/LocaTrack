'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Property } from '@/types';
import Link from 'next/link';
import {
    Building2, Loader2, MapPin, Ruler, DoorOpen, Plus, Calendar,
    Wallet, Edit3, Trash2, X, Save, ChevronRight
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import SlidePanel from '@/components/ui/SlidePanel';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

const statusStyles: Record<string, string> = {
    'DISPONIBLE': 'bg-success-50 text-success-600',
    'OCCUPE': 'bg-slate-800 text-white',
    'TRAVAUX': 'bg-warning-50 text-warning-600',
};

const statusLabels: Record<string, string> = {
    'DISPONIBLE': 'Disponible',
    'OCCUPE': 'Occupé',
    'TRAVAUX': 'Travaux',
};

export default function PropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    const { register, handleSubmit, reset } = useForm<Property>();

    useEffect(() => {
        let unsubscribeSnapshot: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user) {
                setLoading(false);
                return;
            }

            const q = query(collection(db, 'biens'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
            unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                const props = snapshot.docs.map(d => ({
                    id: d.id,
                    ...d.data()
                })) as Property[];
                setProperties(props);
                setLoading(false);
            });
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) unsubscribeSnapshot();
        };
    }, []);

    const openPanel = (property: Property) => {
        setSelectedProperty(property);
        setIsEditing(false);
        reset(property);
    };

    const closePanel = () => {
        setSelectedProperty(null);
        setIsEditing(false);
    };

    const onSubmit = async (data: Property) => {
        if (!selectedProperty) return;
        setIsSaving(true);
        try {
            const docRef = doc(db, 'biens', selectedProperty.id);
            const { id, ...updateData } = data;
            await updateDoc(docRef, updateData);
            setSelectedProperty({ ...data, id: selectedProperty.id });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating property:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedProperty) return;
        if (confirm('Êtes-vous sûr de vouloir supprimer ce bien ?')) {
            try {
                await deleteDoc(doc(db, 'biens', selectedProperty.id));
                closePanel();
            } catch (error) {
                console.error("Error deleting property:", error);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-slate-600" size={28} />
                    <p className="text-sm text-text-tertiary">Chargement des biens...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <PageHeader
                title="Mes Biens"
                description="Gérez votre parc immobilier"
                action={
                    <Link
                        href="/biens/nouveau"
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-sm font-medium text-sm"
                    >
                        <Plus size={16} /> Ajouter un bien
                    </Link>
                }
            />

            {properties.length === 0 ? (
                <div className="bg-surface rounded-xl border border-border">
                    <EmptyState
                        icon={Building2}
                        title="Aucun bien immobilier"
                        description="Commencez par ajouter votre premier bien pour gérer votre parc immobilier."
                        actionLabel="Ajouter un bien"
                        onAction={() => router.push('/biens/nouveau')}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {properties.map((property) => (
                        <div
                            key={property.id}
                            onClick={() => openPanel(property)}
                            className="bg-surface rounded-xl border border-border p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer group"
                        >
                            {/* Top row: type + status */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                                        <Building2 className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="text-xs font-medium text-text-tertiary">{property.type}</span>
                                </div>
                                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusStyles[property.status] || 'bg-slate-100 text-slate-600'}`}>
                                    {statusLabels[property.status] || property.status}
                                </span>
                            </div>

                            {/* Name */}
                            <p className="text-base font-semibold text-text-primary mb-1 group-hover:text-slate-700 transition-colors leading-tight">
                                {property.denomination || `${property.type} — ${property.address.city}`}
                            </p>

                            {/* Address */}
                            <div className="flex items-start gap-1.5 text-sm text-text-secondary mb-4">
                                <MapPin size={13} className="text-text-tertiary mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-text-tertiary leading-relaxed">
                                    {property.address.street}, {property.address.zipCode} {property.address.city}
                                </span>
                            </div>

                            {/* Bottom stats */}
                            <div className="flex items-center justify-between pt-3 border-t border-border-light">
                                <div className="flex items-center gap-4 text-xs text-text-tertiary">
                                    <div className="flex items-center gap-1">
                                        <Ruler size={12} />
                                        {property.features.surface} m²
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <DoorOpen size={12} />
                                        {property.features.rooms} p.
                                    </div>
                                    {property.features.constructionYear > 0 && (
                                        <div className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {property.features.constructionYear}
                                        </div>
                                    )}
                                </div>
                                <ChevronRight className="h-4 w-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ─── Slide Panel ──────────────────────────────────────────────── */}
            <SlidePanel
                open={!!selectedProperty}
                onClose={closePanel}
                title={isEditing ? 'Modifier le bien' : 'Détail du bien'}
            >
                {selectedProperty && (
                    <form onSubmit={handleSubmit(onSubmit)}>
                        {/* Property Header inside panel */}
                        <div className="px-6 py-5 bg-surface-hover border-b border-border">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-bold text-text-primary">
                                    {selectedProperty.denomination || `${selectedProperty.type} — ${selectedProperty.address.city}`}
                                </h3>
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[selectedProperty.status]}`}>
                                    {statusLabels[selectedProperty.status]}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-text-tertiary">
                                <MapPin size={14} />
                                {selectedProperty.address.street}, {selectedProperty.address.zipCode} {selectedProperty.address.city}
                            </div>
                        </div>

                        <div className="px-6 py-6 space-y-6">
                            {/* Identification */}
                            <div>
                                <h4 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wider">Identification</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-text-tertiary mb-1.5">Dénomination</label>
                                        <input
                                            disabled={!isEditing}
                                            {...register('denomination')}
                                            placeholder="Nom du bien"
                                            className="w-full px-3 py-2 border border-border rounded-lg text-sm disabled:bg-surface-hover disabled:text-text-secondary focus:outline-none focus:ring-2 focus:ring-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-text-tertiary mb-1.5">Type</label>
                                        <select disabled={!isEditing} {...register('type')} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface disabled:bg-surface-hover disabled:text-text-secondary focus:outline-none focus:ring-2 focus:ring-slate-300">
                                            <option value="Appartement">Appartement</option>
                                            <option value="Maison">Maison</option>
                                            <option value="Bureau">Bureau</option>
                                            <option value="Local Commercial">Local Commercial</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-text-tertiary mb-1.5">Statut</label>
                                        <select disabled={!isEditing} {...register('status')} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface disabled:bg-surface-hover disabled:text-text-secondary focus:outline-none focus:ring-2 focus:ring-slate-300">
                                            <option value="DISPONIBLE">Disponible</option>
                                            <option value="OCCUPE">Occupé</option>
                                            <option value="TRAVAUX">En Travaux</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Adresse */}
                            <div>
                                <h4 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wider">Adresse</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-text-tertiary mb-1.5">Rue</label>
                                        <input disabled={!isEditing} {...register('address.street')} className="w-full px-3 py-2 border border-border rounded-lg text-sm disabled:bg-surface-hover disabled:text-text-secondary focus:outline-none focus:ring-2 focus:ring-slate-300" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-text-tertiary mb-1.5">Code postal</label>
                                        <input disabled={!isEditing} {...register('address.zipCode')} className="w-full px-3 py-2 border border-border rounded-lg text-sm disabled:bg-surface-hover disabled:text-text-secondary focus:outline-none focus:ring-2 focus:ring-slate-300" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-text-tertiary mb-1.5">Ville</label>
                                        <input disabled={!isEditing} {...register('address.city')} className="w-full px-3 py-2 border border-border rounded-lg text-sm disabled:bg-surface-hover disabled:text-text-secondary focus:outline-none focus:ring-2 focus:ring-slate-300" />
                                    </div>
                                </div>
                            </div>

                            {/* Caractéristiques */}
                            <div>
                                <h4 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wider">Caractéristiques</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-text-tertiary mb-1.5">Surface (m²)</label>
                                        <input type="number" step="0.01" disabled={!isEditing} {...register('features.surface', { valueAsNumber: true })} className="w-full px-3 py-2 border border-border rounded-lg text-sm disabled:bg-surface-hover disabled:text-text-secondary focus:outline-none focus:ring-2 focus:ring-slate-300" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-text-tertiary mb-1.5">Pièces</label>
                                        <input type="number" disabled={!isEditing} {...register('features.rooms', { valueAsNumber: true })} className="w-full px-3 py-2 border border-border rounded-lg text-sm disabled:bg-surface-hover disabled:text-text-secondary focus:outline-none focus:ring-2 focus:ring-slate-300" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-text-tertiary mb-1.5">Année</label>
                                        <input type="number" disabled={!isEditing} {...register('features.constructionYear', { valueAsNumber: true })} className="w-full px-3 py-2 border border-border rounded-lg text-sm disabled:bg-surface-hover disabled:text-text-secondary focus:outline-none focus:ring-2 focus:ring-slate-300" />
                                    </div>
                                </div>
                            </div>

                            {/* Financier (read only summary) */}
                            {!isEditing && (
                                <div>
                                    <h4 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wider">Financier</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-surface-hover rounded-lg p-3">
                                            <p className="text-xs text-text-tertiary">Loyer</p>
                                            <p className="text-base font-semibold text-text-primary mt-0.5">
                                                {(selectedProperty.financials?.baseRent || 0).toLocaleString('fr-FR')} €
                                            </p>
                                        </div>
                                        <div className="bg-surface-hover rounded-lg p-3">
                                            <p className="text-xs text-text-tertiary">Charges</p>
                                            <p className="text-base font-semibold text-text-primary mt-0.5">
                                                {(selectedProperty.financials?.charges || 0).toLocaleString('fr-FR')} €
                                            </p>
                                        </div>
                                        <div className="bg-surface-hover rounded-lg p-3">
                                            <p className="text-xs text-text-tertiary">Dépôt</p>
                                            <p className="text-base font-semibold text-text-primary mt-0.5">
                                                {(selectedProperty.financials?.deposit || 0).toLocaleString('fr-FR')} €
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bottom actions */}
                        <div className="px-6 py-4 border-t border-border bg-surface flex items-center justify-between flex-shrink-0">
                            {isEditing ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => { setIsEditing(false); reset(selectedProperty); }}
                                        className="px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover rounded-lg transition-colors cursor-pointer"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
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
                    </form>
                )}
            </SlidePanel>
        </div>
    );
}
