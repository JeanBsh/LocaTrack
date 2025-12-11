"use client";

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Tenant } from '@/types';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TenantForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, control, handleSubmit, formState: { errors } } = useForm<Tenant>({
        defaultValues: {
            status: 'ACTIF',
            guarantors: []
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "guarantors"
    });

    const onSubmit = async (data: Tenant) => {
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'locataires'), {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
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
                        onClick={() => append({ firstName: '', lastName: '', email: '', phone: '' })}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        <Plus size={16} /> Ajouter un garant
                    </button>
                </div>

                <div className="space-y-6">
                    {fields.map((field, index) => (
                        <div key={field.id} className="p-4 bg-slate-50 rounded-lg relative group">
                            <button
                                type="button"
                                onClick={() => remove(index)}
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
                    {fields.length === 0 && (
                        <p className="text-sm text-slate-400 italic text-center py-4">Aucun garant ajouté</p>
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
