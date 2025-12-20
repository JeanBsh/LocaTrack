"use client";

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Property } from '@/types';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import styles from '@/components/biens/PropertyForm.module.css';
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface PropertyEditProps {
    propertyId: string;
}

export default function PropertyDetail({ propertyId }: PropertyEditProps) {
    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    const { register, handleSubmit, reset, formState: { errors } } = useForm<Property>();

    useEffect(() => {
        const fetchProperty = async () => {
            if (!propertyId) return;
            try {
                const docRef = doc(db, 'biens', propertyId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() } as Property;
                    setProperty(data);
                    reset(data);
                } else {
                    console.log("No such property!");
                    router.push('/biens');
                }
            } catch (error) {
                console.error("Error fetching property:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProperty();
    }, [propertyId, router, reset]);

    const onSubmit = async (data: Property) => {
        setIsSaving(true);
        try {
            const docRef = doc(db, 'biens', propertyId);
            // Ensure nested objects are explicitly passed if using partial update, 
            // but here we are sending the full structure back mostly.
            // Firestore update requires specific fields for nested if not merging, 
            // generally passing the whole object works if structure matches.
            // Removing id and undefined fields.
            const { id, ...updateData } = data;

            await updateDoc(docRef, updateData);
            setProperty({ ...data, id });
            setIsEditing(false);
            alert('Bien mis à jour avec succès');
        } catch (error) {
            console.error("Error updating property:", error);
            alert("Erreur lors de la mise à jour");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce bien ? Cette action est irréversible.')) {
            try {
                await deleteDoc(doc(db, 'biens', propertyId));
                router.push('/biens');
            } catch (error) {
                console.error("Error deleting property:", error);
                alert("Erreur lors de la suppression");
            }
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
    if (!property) return <div>Bien non trouvé</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <Link href="/biens" className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowLeft size={20} className="mr-2" /> Retour aux biens
                </Link>
                {!isEditing && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleDelete}
                            className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Trash2 size={18} /> Supprimer
                        </button>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Modifier
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            {isEditing ? 'Modifier le bien' : `${property.type} - ${property.address.city}`}
                        </h1>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${property.status === 'DISPONIBLE' ? 'bg-green-100 text-green-800' :
                        property.status === 'OCCUPE' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                        {property.status}
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Section Identification */}
                        <div className="md:col-span-2">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b">Identification</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Type de Bien</label>
                            <select disabled={!isEditing} {...register('type')} className="w-full p-2 border border-slate-200 rounded-lg bg-white disabled:bg-slate-50">
                                <option value="Appartement">Appartement</option>
                                <option value="Maison">Maison</option>
                                <option value="Bureau">Bureau</option>
                                <option value="Local Commercial">Local Commercial</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
                            <select disabled={!isEditing} {...register('status')} className="w-full p-2 border border-slate-200 rounded-lg bg-white disabled:bg-slate-50">
                                <option value="DISPONIBLE">Disponible</option>
                                <option value="OCCUPE">Occupé</option>
                                <option value="TRAVAUX">En Travaux</option>
                            </select>
                        </div>

                        {/* Section Adresse */}
                        <div className="md:col-span-2 mt-4">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b">Adresse</h3>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Rue</label>
                            <input disabled={!isEditing} {...register('address.street')} className="w-full p-2 border border-slate-200 rounded-lg disabled:bg-slate-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Code Postal</label>
                            <input disabled={!isEditing} {...register('address.zipCode')} className="w-full p-2 border border-slate-200 rounded-lg disabled:bg-slate-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ville</label>
                            <input disabled={!isEditing} {...register('address.city')} className="w-full p-2 border border-slate-200 rounded-lg disabled:bg-slate-50" />
                        </div>

                        {/* Section Caractéristiques */}
                        <div className="md:col-span-2 mt-4">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b">Caractéristiques</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Surface (m²)</label>
                            <input type="number" step="0.01" disabled={!isEditing} {...register('features.surface', { valueAsNumber: true })} className="w-full p-2 border border-slate-200 rounded-lg disabled:bg-slate-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Pièces</label>
                            <input type="number" disabled={!isEditing} {...register('features.rooms', { valueAsNumber: true })} className="w-full p-2 border border-slate-200 rounded-lg disabled:bg-slate-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Année Construction</label>
                            <input type="number" disabled={!isEditing} {...register('features.constructionYear', { valueAsNumber: true })} className="w-full p-2 border border-slate-200 rounded-lg disabled:bg-slate-50" />
                        </div>

                    </div>

                    {isEditing && (
                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => { setIsEditing(false); reset(property); }}
                                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Enregistrer
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
