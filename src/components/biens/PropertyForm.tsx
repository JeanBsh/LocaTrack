'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import styles from './PropertyForm.module.css';
import { PropertyType, PropertyStatus } from '@/types';

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
    financials: {
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
            const documents = [];
            if (data.files && data.files.length > 0) {
                for (let i = 0; i < data.files.length; i++) {
                    const file = data.files[i];
                    const storageRef = ref(storage, `biens/${Date.now()}_${file.name}`);
                    const snapshot = await uploadBytes(storageRef, file);
                    const url = await getDownloadURL(snapshot.ref);
                    documents.push({
                        name: file.name,
                        url,
                        type: file.type
                    });
                }
            }

            // Remove files from data before saving to Firestore
            const { files, ...propertyData } = data;

            await addDoc(collection(db, 'biens'), {
                ...propertyData,
                documents,
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
        <div className={styles.container}>
            <form onSubmit={handleSubmit(onSubmit)} className={styles.formGrid}>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Identification du Bien</h2>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Type de Bien</label>
                    <select {...register('type', { required: true })} className={styles.select}>
                        <option value="Appartement">Appartement</option>
                        <option value="Maison">Maison</option>
                        <option value="Bureau">Bureau</option>
                        <option value="Local Commercial">Local Commercial</option>
                    </select>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Statut</label>
                    <select {...register('status', { required: true })} className={styles.select}>
                        <option value="DISPONIBLE">Disponible</option>
                        <option value="OCCUPE">Occupé</option>
                        <option value="TRAVAUX">En Travaux</option>
                    </select>
                </div>

                <div className={`${styles.field} ${styles.fullWidth}`}>
                    <label className={styles.label}>Adresse (Rue)</label>
                    <input {...register('address.street', { required: true })} className={styles.input} placeholder="123 Rue de la Paix" />
                    {errors.address?.street && <span className={styles.error}>Requis</span>}
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Code Postal</label>
                    <input {...register('address.zipCode', { required: true })} className={styles.input} placeholder="75000" />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Ville</label>
                    <input {...register('address.city', { required: true })} className={styles.input} placeholder="Paris" />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Pays</label>
                    <input {...register('address.country', { required: true })} className={styles.input} defaultValue="France" />
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Caractéristiques</h2>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Surface (m²)</label>
                    <input type="number" step="0.01" {...register('features.surface', { required: true, valueAsNumber: true })} className={styles.input} />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Nombre de pièces</label>
                    <input type="number" {...register('features.rooms', { required: true, valueAsNumber: true })} className={styles.input} />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Année de construction</label>
                    <input type="number" {...register('features.constructionYear', { required: true, valueAsNumber: true })} className={styles.input} />
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Informations Financières</h2>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Loyer de base (Hors Charges)</label>
                    <input type="number" step="0.01" {...register('financials.baseRent', { required: true, valueAsNumber: true })} className={styles.input} />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Provisions sur Charges</label>
                    <input type="number" step="0.01" {...register('financials.charges', { required: true, valueAsNumber: true })} className={styles.input} />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Dépôt de Garantie</label>
                    <input type="number" step="0.01" {...register('financials.deposit', { required: true, valueAsNumber: true })} className={styles.input} />
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Documents</h2>
                </div>

                <div className={`${styles.field} ${styles.fullWidth}`}>
                    <label className={styles.label}>Documents (Diagnostics, Plans...)</label>
                    <input type="file" multiple {...register('files')} className={styles.input} />
                </div>

                <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer le Bien'}
                </button>
            </form>
        </div>
    );
}
