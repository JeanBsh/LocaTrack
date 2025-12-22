"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { addDoc, collection, serverTimestamp, getDocs, doc, updateDoc, writeBatch, query, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Tenant, Property } from '@/types';
import { Plus, Trash2, Save, Loader2, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

// Extension du type pour le formulaire uniquement
interface TenantFormData extends Tenant {
    selectedPropertyId?: string;
    leaseDetails: {
        type: 'MEUBLE' | 'NON_MEUBLE';
        startDate: string;
        endDate?: string;
        duration: number;
        rent: number;
        charges: number;
        deposit: number;
    }
}

export default function TenantForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [properties, setProperties] = useState<Property[]>([]);

    // Chargement des biens existants
    useEffect(() => {
        const fetchProperties = async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                const q = query(collection(db, 'biens'), where('userId', '==', user.uid));
                const querySnapshot = await getDocs(q);
                const loadedProperties = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Property));
                setProperties(loadedProperties);
            } catch (error) {
                console.error("Erreur lors du chargement des biens", error);
            }
        };
        fetchProperties();
    }, []);

    const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<TenantFormData>({
        defaultValues: {
            status: 'ACTIF',
            guarantors: [],
            adminInfo: {
                birthDate: undefined, // Let the date input handle it
                idNumber: ''
            },
            leaseDetails: {
                duration: 36 // Durée par défaut 3 ans
            }
        }
    });

    const selectedPropertyId = watch('selectedPropertyId');

    // Mettre à jour les infos prévisionnelles quand un bien est choisi
    useEffect(() => {
        if (selectedPropertyId) {
            const property = properties.find(p => p.id === selectedPropertyId);
            if (property) {
                setValue('leaseDetails.rent', property.financials.baseRent);
                setValue('leaseDetails.charges', property.financials.charges);
                setValue('leaseDetails.deposit', property.financials.deposit);
            }
        }
    }, [selectedPropertyId, properties, setValue]);

    const { fields: guarantorFields, append: appendGuarantor, remove: removeGuarantor } = useFieldArray({
        control,
        name: "guarantors"
    });

    const { fields: roommateFields, append: appendRoommate, remove: removeRoommate } = useFieldArray({
        control,
        name: "roommates"
    });

    const onSubmit = async (data: TenantFormData) => {
        setIsSubmitting(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                alert("Vous devez être connecté.");
                return;
            }

            // 1. Création du Locataire
            const tenantRef = await addDoc(collection(db, 'locataires'), {
                personalInfo: data.personalInfo,
                adminInfo: data.adminInfo,
                guarantors: data.guarantors,
                roommates: data.roommates || [],
                status: data.status,
                userId: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // 2. Si un bien est sélectionné, création du Bail et mise à jour du bien
            if (data.selectedPropertyId) {
                // Création du Bail
                const leaseData = {
                    propertyId: data.selectedPropertyId,
                    tenantId: tenantRef.id,
                    userId: user.uid,
                    type: data.leaseDetails.type,
                    dates: {
                        start: new Date(data.leaseDetails.startDate),
                        duration: data.leaseDetails.duration,
                    },
                    financials: {
                        currentRent: data.leaseDetails.rent,
                        currentCharges: data.leaseDetails.charges,
                        deposit: data.leaseDetails.deposit,
                    },
                    indexation: {
                        baseIndex: 0,
                    },
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                };

                await addDoc(collection(db, 'leases'), leaseData);

                // Mise à jour du statut du Bien
                const propertyRef = doc(db, 'biens', data.selectedPropertyId);
                await updateDoc(propertyRef, {
                    status: 'OCCUPE'
                });
            }

            alert('Locataire créé avec succès !');
            router.push('/locataires');
        } catch (error) {
            console.error('Error adding tenant: ', error);
            alert('Erreur lors de la création du locataire');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto p-6">

            {/* Informations Personnelles */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-2">Informations Personnelles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
                        <input
                            {...register('personalInfo.firstName', { required: true })}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Jean"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                        <input
                            {...register('personalInfo.lastName', { required: true })}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Dupont"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            {...register('personalInfo.email', { required: true })}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="jean.dupont@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                        <input
                            type="tel"
                            {...register('personalInfo.phone', { required: true })}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="06 12 34 56 78"
                        />
                    </div>
                </div>
            </div>

            {/* Bail / Rattachement au bien */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 ring-1 ring-blue-100">
                <div className="flex items-center gap-2 mb-4 border-b pb-2">
                    <Home className="text-blue-600" size={24} />
                    <h2 className="text-xl font-semibold text-slate-800">Bail & Logement</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Bien Loué</label>
                        <select
                            {...register('selectedPropertyId')}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                        >
                            <option value="">Sélectionner un bien...</option>
                            {properties.map(property => (
                                <option key={property.id} value={property.id}>
                                    {property.type} - {property.address.street}, {property.address.city} ({property.status})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">Sélectionner le bien pour associer ce locataire et créer un bail.</p>
                    </div>

                    {selectedPropertyId && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Type de Location</label>
                                <select
                                    {...register('leaseDetails.type')}
                                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="NON_MEUBLE">Non Meublé (Nu)</option>
                                    <option value="MEUBLE">Meublé</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date d'entrée (Début Bail)</label>
                                <input
                                    type="date"
                                    {...register('leaseDetails.startDate', { required: !!selectedPropertyId })}
                                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Durée (Mois)</label>
                                <input
                                    type="number"
                                    {...register('leaseDetails.duration')}
                                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="36"
                                />
                            </div>

                            <div className="h-px bg-slate-100 md:col-span-2 my-2"></div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Loyer Mensuel (HC)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register('leaseDetails.rent', { valueAsNumber: true })}
                                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pl-8"
                                    />
                                    <span className="absolute left-3 top-2 text-slate-400">€</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {watch('leaseDetails.type') === 'MEUBLE' ? 'Charges (Forfait)' : 'Charges Mensuelles (Prov.)'}
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register('leaseDetails.charges', { valueAsNumber: true })}
                                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pl-8"
                                    />
                                    <span className="absolute left-3 top-2 text-slate-400">€</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Dépôt de Garantie</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register('leaseDetails.deposit', { valueAsNumber: true })}
                                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pl-8"
                                    />
                                    <span className="absolute left-3 top-2 text-slate-400">€</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Informations Administratives */}
            {/* Informations Administratives */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-2">Informations Administratives</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date de Naissance</label>
                        <input
                            type="date"
                            {...register('adminInfo.birthDate', { required: true })}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Numéro Pièce d'Identité</label>
                        <input
                            {...register('adminInfo.idNumber')}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="CNI ou Passeport"
                        />
                    </div>
                </div>
            </div>

            {/* Garants */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-xl font-semibold text-slate-800">Garants</h2>
                    <button
                        type="button"
                        onClick={() => appendGuarantor({ firstName: '', lastName: '', email: '', phone: '' })}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        <Plus size={16} /> Ajouter un garant
                    </button>
                </div>

                <div className="space-y-6">
                    {guarantorFields.map((field, index) => (
                        <div key={field.id} className="p-4 bg-slate-50 rounded-lg relative group">
                            <button
                                type="button"
                                onClick={() => removeGuarantor(index)}
                                className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Prénom</label>
                                    <input
                                        {...register(`guarantors.${index}.firstName` as const, { required: true })}
                                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Prénom du garant"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Nom</label>
                                    <input
                                        {...register(`guarantors.${index}.lastName` as const, { required: true })}
                                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Nom du garant"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                                    <input
                                        type="email"
                                        {...register(`guarantors.${index}.email` as const)}
                                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Email du garant"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Téléphone</label>
                                    <input
                                        type="tel"
                                        {...register(`guarantors.${index}.phone` as const)}
                                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Téléphone du garant"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    {guarantorFields.length === 0 && (
                        <p className="text-sm text-slate-400 italic text-center py-4">Aucun garant ajouté</p>
                    )}
                </div>
            </div>

            {/* Co-locataires */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-xl font-semibold text-slate-800">Co-locataires</h2>
                    <button
                        type="button"
                        onClick={() => appendRoommate({ firstName: '', lastName: '', email: '', phone: '' })}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        <Plus size={16} /> Ajouter un co-locataire
                    </button>
                </div>

                <div className="space-y-6">
                    {roommateFields.map((field, index) => (
                        <div key={field.id} className="p-4 bg-slate-50 rounded-lg relative group">
                            <button
                                type="button"
                                onClick={() => removeRoommate(index)}
                                className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Prénom</label>
                                    <input
                                        {...register(`roommates.${index}.firstName` as const, { required: true })}
                                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Prénom"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Nom</label>
                                    <input
                                        {...register(`roommates.${index}.lastName` as const, { required: true })}
                                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Nom"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                                    <input
                                        type="email"
                                        {...register(`roommates.${index}.email` as const)}
                                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Email"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Téléphone</label>
                                    <input
                                        type="tel"
                                        {...register(`roommates.${index}.phone` as const)}
                                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Téléphone"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    {roommateFields.length === 0 && (
                        <p className="text-sm text-slate-400 italic text-center py-4">Aucun co-locataire ajouté</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin" size={20} /> Enregistrement...
                        </>
                    ) : (
                        <>
                            <Save size={20} /> Enregistrer le Locataire
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
