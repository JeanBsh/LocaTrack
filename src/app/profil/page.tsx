'use client';

import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, auth, storage } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { UserProfile } from '@/types';
import { useForm } from 'react-hook-form';
import { User, Save, Loader2, CheckCircle, Building2, X, Image, PenTool } from 'lucide-react';

interface ProfileFormData {
    name: string;
    address: string;
    city: string;
    zipCode: string;
    email: string;
    phone: string;
}

export default function ProfilPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [profileExists, setProfileExists] = useState(false);

    // Image states
    const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [uploadingSignature, setUploadingSignature] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    const signatureInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormData>();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setLoading(false);
                return;
            }
            setUserId(user.uid);

            // Fetch existing profile
            const profileRef = doc(db, 'profiles', user.uid);
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
                const data = profileSnap.data() as UserProfile;
                setProfileExists(true);
                reset({
                    name: data.ownerInfo.name || '',
                    address: data.ownerInfo.address || '',
                    city: data.ownerInfo.city || '',
                    zipCode: data.ownerInfo.zipCode || '',
                    email: data.ownerInfo.email || '',
                    phone: data.ownerInfo.phone || '',
                });
                setSignatureUrl(data.signatureUrl || null);
                setLogoUrl(data.logoUrl || null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [reset]);

    const uploadImage = async (file: File, type: 'signature' | 'logo') => {
        if (!userId) return null;

        const isSignature = type === 'signature';
        isSignature ? setUploadingSignature(true) : setUploadingLogo(true);

        try {
            const storageRef = ref(storage, `profiles/${userId}/${type}_${Date.now()}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            // Update Firestore with the new URL
            const profileRef = doc(db, 'profiles', userId);
            const updateData = isSignature ? { signatureUrl: url } : { logoUrl: url };

            if (profileExists) {
                await updateDoc(profileRef, { ...updateData, updatedAt: new Date() });
            }

            isSignature ? setSignatureUrl(url) : setLogoUrl(url);
            return url;
        } catch (error) {
            console.error(`Erreur lors de l'upload de ${type}:`, error);
            return null;
        } finally {
            isSignature ? setUploadingSignature(false) : setUploadingLogo(false);
        }
    };

    const removeImage = async (type: 'signature' | 'logo') => {
        if (!userId) return;

        const isSignature = type === 'signature';
        const currentUrl = isSignature ? signatureUrl : logoUrl;

        try {
            // Delete from Storage if URL exists
            if (currentUrl) {
                try {
                    const storageRef = ref(storage, currentUrl);
                    await deleteObject(storageRef);
                } catch {
                    // File might not exist, continue anyway
                }
            }

            // Update Firestore
            const profileRef = doc(db, 'profiles', userId);
            const updateData = isSignature ? { signatureUrl: null } : { logoUrl: null };

            if (profileExists) {
                await updateDoc(profileRef, { ...updateData, updatedAt: new Date() });
            }

            isSignature ? setSignatureUrl(null) : setLogoUrl(null);
        } catch (error) {
            console.error(`Erreur lors de la suppression de ${type}:`, error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'signature' | 'logo') => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Veuillez sélectionner une image');
                return;
            }
            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('L\'image ne doit pas dépasser 2 Mo');
                return;
            }
            uploadImage(file, type);
        }
    };

    const onSubmit = async (data: ProfileFormData) => {
        if (!userId) return;

        setSaving(true);
        setSaved(false);

        const profileRef = doc(db, 'profiles', userId);
        const profileData = {
            id: userId,
            userId: userId,
            ownerInfo: {
                name: data.name,
                address: data.address,
                city: data.city,
                zipCode: data.zipCode,
                email: data.email || '',
                phone: data.phone || '',
            },
            signatureUrl: signatureUrl,
            logoUrl: logoUrl,
            updatedAt: new Date(),
        };

        try {
            if (profileExists) {
                await updateDoc(profileRef, profileData);
            } else {
                await setDoc(profileRef, {
                    ...profileData,
                    createdAt: new Date(),
                });
                setProfileExists(true);
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du profil:', error);
        } finally {
            setSaving(false);
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
        <div className="max-w-3xl mx-auto p-4 md:p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                        <User size={20} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mon Profil</h1>
                </div>
                <p className="text-slate-500">
                    Configurez vos informations de propriétaire. Ces informations seront utilisées dans les documents générés (quittances, contrats, attestations).
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Owner Info Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Section Header */}
                    <div className="bg-gradient-to-r from-slate-50 to-white p-5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            <h2 className="text-lg font-semibold text-slate-900">Informations du Propriétaire</h2>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            Ces informations apparaîtront sur tous vos documents officiels.
                        </p>
                    </div>

                    {/* Form Fields */}
                    <div className="p-6 space-y-5">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                                Nom complet / Raison sociale *
                            </label>
                            <input
                                type="text"
                                id="name"
                                {...register('name', { required: 'Le nom est requis' })}
                                className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm transition-all"
                                placeholder="Ex: Jean Dupont ou SCI Dupont"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                            )}
                        </div>

                        {/* Address */}
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">
                                Adresse *
                            </label>
                            <input
                                type="text"
                                id="address"
                                {...register('address', { required: "L'adresse est requise" })}
                                className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm transition-all"
                                placeholder="Ex: 123 Avenue de la République"
                            />
                            {errors.address && (
                                <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                            )}
                        </div>

                        {/* City and Zip Code */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="zipCode" className="block text-sm font-medium text-slate-700 mb-1">
                                    Code postal *
                                </label>
                                <input
                                    type="text"
                                    id="zipCode"
                                    {...register('zipCode', { required: 'Le code postal est requis' })}
                                    className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm transition-all"
                                    placeholder="Ex: 75011"
                                />
                                {errors.zipCode && (
                                    <p className="mt-1 text-sm text-red-600">{errors.zipCode.message}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1">
                                    Ville *
                                </label>
                                <input
                                    type="text"
                                    id="city"
                                    {...register('city', { required: 'La ville est requise' })}
                                    className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm transition-all"
                                    placeholder="Ex: Paris"
                                />
                                {errors.city && (
                                    <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Email and Phone */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                                    Email (optionnel)
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    {...register('email')}
                                    className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm transition-all"
                                    placeholder="Ex: contact@example.com"
                                />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                                    Téléphone (optionnel)
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    {...register('phone')}
                                    className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm transition-all"
                                    placeholder="Ex: 06 12 34 56 78"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signature & Logo Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-50 to-white p-5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <PenTool className="h-5 w-5 text-blue-600" />
                            <h2 className="text-lg font-semibold text-slate-900">Signature & Logo</h2>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            Ajoutez votre signature et votre logo pour personnaliser vos documents.
                        </p>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Signature Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-3">
                                    Signature
                                </label>
                                <input
                                    type="file"
                                    ref={signatureInputRef}
                                    onChange={(e) => handleFileChange(e, 'signature')}
                                    accept="image/*"
                                    className="hidden"
                                />
                                {signatureUrl ? (
                                    <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50">
                                        <img
                                            src={signatureUrl}
                                            alt="Signature"
                                            className="max-h-24 mx-auto object-contain"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage('signature')}
                                            className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => signatureInputRef.current?.click()}
                                        disabled={uploadingSignature}
                                        className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {uploadingSignature ? (
                                            <Loader2 className="h-8 w-8 mx-auto text-blue-500 animate-spin" />
                                        ) : (
                                            <>
                                                <PenTool className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                                                <p className="text-sm text-slate-600 font-medium">Cliquez pour ajouter</p>
                                                <p className="text-xs text-slate-400 mt-1">PNG, JPG (max 2 Mo)</p>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Logo Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-3">
                                    Logo
                                </label>
                                <input
                                    type="file"
                                    ref={logoInputRef}
                                    onChange={(e) => handleFileChange(e, 'logo')}
                                    accept="image/*"
                                    className="hidden"
                                />
                                {logoUrl ? (
                                    <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50">
                                        <img
                                            src={logoUrl}
                                            alt="Logo"
                                            className="max-h-24 mx-auto object-contain"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage('logo')}
                                            className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => logoInputRef.current?.click()}
                                        disabled={uploadingLogo}
                                        className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {uploadingLogo ? (
                                            <Loader2 className="h-8 w-8 mx-auto text-blue-500 animate-spin" />
                                        ) : (
                                            <>
                                                <Image className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                                                <p className="text-sm text-slate-600 font-medium">Cliquez pour ajouter</p>
                                                <p className="text-xs text-slate-400 mt-1">PNG, JPG (max 2 Mo)</p>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                Enregistrement...
                            </>
                        ) : saved ? (
                            <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Enregistré !
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Enregistrer
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-sm text-blue-800">
                    <strong>Note :</strong> Ces informations seront automatiquement insérées dans vos quittances de loyer,
                    attestations de domicile et contrats de location lors de leur génération. La signature et le logo apparaîtront sur vos documents PDF.
                </p>
            </div>
        </div>
    );
}
