"use client";

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Tenant, Lease, Property } from '@/types';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { ArrowLeft, Loader2, Save, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import RentReceiptGenerator from '@/components/documents/RentReceiptGenerator';

interface TenantEditProps {
    tenantId: string;
}

export default function TenantDetail({ tenantId }: TenantEditProps) {
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [lease, setLease] = useState<Lease | null>(null);
    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    const { register, control, handleSubmit, reset } = useForm<Tenant>();

    // Field Arrays for dynamic sections
    const { fields: guarantorFields, append: appendGuarantor, remove: removeGuarantor } = useFieldArray({
        control,
        name: "guarantors"
    });

    const { fields: roommateFields, append: appendRoommate, remove: removeRoommate } = useFieldArray({
        control,
        name: "roommates"
    });

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user) {
                // router.push('/login'); // Optional, or let the parent/layout handle it.
                setLoading(false);
                return;
            }

            const fetchData = async () => {
                if (!tenantId) return;
                try {
                    // 1. Fetch Tenant
                    const tenantRef = doc(db, 'locataires', tenantId);
                    const tenantSnap = await getDoc(tenantRef); // This will fail if unauth, so we check auth first

                    if (tenantSnap.exists()) {
                        const tenantData = { id: tenantSnap.id, ...tenantSnap.data() } as Tenant;

                        // Verification que le locataire appartient bien à l'utilisateur connecté
                        if (tenantData.userId !== user.uid) {
                            console.error("Unauthorized access to tenant");
                            router.push('/locataires');
                            return;
                        }

                        setTenant(tenantData);
                        reset(tenantData);

                        // 2. Fetch Active Lease
                        const qLease = query(collection(db, 'leases'), where('tenantId', '==', tenantId));
                        const leaseSnapshot = await getDocs(qLease);

                        if (!leaseSnapshot.empty) {
                            const leaseDoc = leaseSnapshot.docs[0];
                            const leaseData = { id: leaseDoc.id, ...leaseDoc.data() } as Lease;
                            setLease(leaseData);

                            // 3. Fetch Property
                            if (leaseData.propertyId) {
                                const propRef = doc(db, 'biens', leaseData.propertyId);
                                const propSnap = await getDoc(propRef);
                                if (propSnap.exists()) {
                                    setProperty({ id: propSnap.id, ...propSnap.data() } as Property);
                                }
                            }
                        }
                    } else {
                        console.log("No such tenant!");
                        router.push('/locataires');
                    }
                } catch (error) {
                    console.error("Error fetching data:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        });

        return () => unsubscribeAuth();
    }, [tenantId, router, reset]);

    const onSubmit = async (data: Tenant) => {
        setIsSaving(true);
        try {
            const docRef = doc(db, 'locataires', tenantId);
            const { id, ...updateData } = data;

            await updateDoc(docRef, updateData);
            setTenant({ ...data, id });
            setIsEditing(false);
            alert('Locataire mis à jour avec succès');
        } catch (error) {
            console.error("Error updating tenant:", error);
            alert("Erreur lors de la mise à jour");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce locataire ? Cette action est irréversible.')) {
            try {
                await deleteDoc(doc(db, 'locataires', tenantId));
                router.push('/locataires');
            } catch (error) {
                console.error("Error deleting tenant:", error);
                alert("Erreur lors de la suppression");
            }
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
    if (!tenant) return <div>Locataire non trouvé</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <Link href="/locataires" className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowLeft size={20} className="mr-2" /> Retour aux locataires
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Information Personnelles */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b">Informations Personnelles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
                            <input disabled={!isEditing} {...register('personalInfo.firstName')} className="w-full p-2 border border-slate-200 rounded-lg disabled:bg-slate-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                            <input disabled={!isEditing} {...register('personalInfo.lastName')} className="w-full p-2 border border-slate-200 rounded-lg disabled:bg-slate-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input disabled={!isEditing} {...register('personalInfo.email')} className="w-full p-2 border border-slate-200 rounded-lg disabled:bg-slate-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                            <input disabled={!isEditing} {...register('personalInfo.phone')} className="w-full p-2 border border-slate-200 rounded-lg disabled:bg-slate-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
                            <select disabled={!isEditing} {...register('status')} className="w-full p-2 border border-slate-200 rounded-lg bg-white disabled:bg-slate-50">
                                <option value="ACTIF">Actif</option>
                                <option value="ARCHIVE">Archivé</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Co-locataires */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h3 className="text-lg font-semibold text-slate-800">Co-locataires</h3>
                        {isEditing && (
                            <button
                                type="button"
                                onClick={() => appendRoommate({ firstName: '', lastName: '', email: '', phone: '' })}
                                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                <Plus size={16} /> Ajouter
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {roommateFields.map((field, index) => (
                            <div key={field.id} className="p-4 bg-slate-50 rounded-lg relative group">
                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={() => removeRoommate(index)}
                                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input disabled={!isEditing} placeholder="Prénom" {...register(`roommates.${index}.firstName`)} className="p-2 border border-slate-200 rounded-lg disabled:bg-slate-100" />
                                    <input disabled={!isEditing} placeholder="Nom" {...register(`roommates.${index}.lastName`)} className="p-2 border border-slate-200 rounded-lg disabled:bg-slate-100" />
                                    <input disabled={!isEditing} placeholder="Email" {...register(`roommates.${index}.email`)} className="p-2 border border-slate-200 rounded-lg disabled:bg-slate-100" />
                                    <input disabled={!isEditing} placeholder="Téléphone" {...register(`roommates.${index}.phone`)} className="p-2 border border-slate-200 rounded-lg disabled:bg-slate-100" />
                                </div>
                            </div>
                        ))}
                        {roommateFields.length === 0 && <p className="text-gray-500 italic">Aucun co-locataire</p>}
                    </div>
                </div>

                {/* Garants */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h3 className="text-lg font-semibold text-slate-800">Garants</h3>
                        {isEditing && (
                            <button
                                type="button"
                                onClick={() => appendGuarantor({ firstName: '', lastName: '', email: '', phone: '' })}
                                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                <Plus size={16} /> Ajouter
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {guarantorFields.map((field, index) => (
                            <div key={field.id} className="p-4 bg-slate-50 rounded-lg relative group">
                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={() => removeGuarantor(index)}
                                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input disabled={!isEditing} placeholder="Prénom" {...register(`guarantors.${index}.firstName`)} className="p-2 border border-slate-200 rounded-lg disabled:bg-slate-100" />
                                    <input disabled={!isEditing} placeholder="Nom" {...register(`guarantors.${index}.lastName`)} className="p-2 border border-slate-200 rounded-lg disabled:bg-slate-100" />
                                    <input disabled={!isEditing} placeholder="Email" {...register(`guarantors.${index}.email`)} className="p-2 border border-slate-200 rounded-lg disabled:bg-slate-100" />
                                    <input disabled={!isEditing} placeholder="Téléphone" {...register(`guarantors.${index}.phone`)} className="p-2 border border-slate-200 rounded-lg disabled:bg-slate-100" />
                                </div>
                            </div>
                        ))}
                        {guarantorFields.length === 0 && <p className="text-gray-500 italic">Aucun garant</p>}
                    </div>
                </div>

                {/* Documents - Quittance */}
                {tenant && lease && property && (
                    <div className="mt-6">
                        <RentReceiptGenerator tenant={tenant} lease={lease} property={property} />
                    </div>
                )}

                {/* Actions */}
                {isEditing && (
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => { setIsEditing(false); reset(tenant); }}
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
    );
}
