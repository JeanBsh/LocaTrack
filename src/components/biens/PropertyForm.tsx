'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { PropertyType, PropertyStatus } from '@/types';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';

interface PropertyFormData {
    type: PropertyType;
    address: {
        street: string;
        zipCode: string;
        city: string;
        country: string;
    };
    features: {
        surface: number;
        rooms: number;
        constructionYear: number;
    };
    status: PropertyStatus;
    financials?: {
        baseRent: number;
        charges: number;
        deposit: number;
    };
    files?: FileList;
}

export default function PropertyForm() {
    const { register, handleSubmit, formState: { errors } } = useForm<PropertyFormData>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const onSubmit = async (data: PropertyFormData) => {
        setIsSubmitting(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                alert("Vous devez être connecté pour créer un bien.");
                return;
            }

            const propertyData = {
                ...data,
                features: data.features,
                userId: user.uid,
                financials: {
                    baseRent: 0,
                    charges: 0,
                    deposit: 0
                }
            };

            await addDoc(collection(db, 'biens'), {
                ...propertyData,
                documents: [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            router.push('/biens');
        } catch (error) {
            console.error('Error adding document: ', error);
            alert('Erreur lors de la création du bien');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            {/* Header */}
            <div className="mb-8">
                <Link href="/biens" className="inline-flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-4">
                    <ArrowLeft size={20} className="mr-2" /> Retour aux biens
                </Link>
                <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
                    Nouveau Bien
                </h1>
                <p className="text-slate-500">
                    Ajoutez un nouveau bien à votre parc immobilier
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">

                {/* Section: Identification */}
                <div className="mb-8 pb-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 mb-6">Identification du Bien</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-700">Type de Bien</label>
                            <select
                                {...register('type', { required: true })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            >
                                <option value="Appartement">Appartement</option>
                                <option value="Maison">Maison</option>
                                <option value="Bureau">Bureau</option>
                                <option value="Local Commercial">Local Commercial</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-700">Statut</label>
                            <select
                                {...register('status', { required: true })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            >
                                <option value="DISPONIBLE">Disponible</option>
                                <option value="OCCUPE">Occupé</option>
                                <option value="TRAVAUX">En Travaux</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Section: Adresse */}
                <div className="mb-8 pb-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 mb-6">Adresse</h2>

                    <div className="space-y-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-700">Rue</label>
                            <input
                                {...register('address.street', { required: true })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                placeholder="123 Rue de la Paix"
                            />
                            {errors.address?.street && <span className="text-red-600 text-sm font-medium">Requis</span>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-700">Code Postal</label>
                                <input
                                    {...register('address.zipCode', { required: true })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                    placeholder="75000"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-700">Ville</label>
                                <input
                                    {...register('address.city', { required: true })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                    placeholder="Paris"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-700">Pays</label>
                                <input
                                    {...register('address.country', { required: true })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                    defaultValue="France"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section: Caractéristiques */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-900 mb-6">Caractéristiques</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-700">Surface (m²)</label>
                            <input
                                type="number"
                                step="0.01"
                                {...register('features.surface', { required: true, valueAsNumber: true })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-700">Nombre de pièces</label>
                            <input
                                type="number"
                                {...register('features.rooms', { required: true, valueAsNumber: true })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-700">Année de construction</label>
                            <input
                                type="number"
                                {...register('features.constructionYear', { required: true, valueAsNumber: true })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200">
                    <Link
                        href="/biens"
                        className="flex-1 sm:flex-initial px-6 py-3 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-center font-medium"
                    >
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 sm:flex-initial px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 shadow-sm"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Enregistrement...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Enregistrer le Bien
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
