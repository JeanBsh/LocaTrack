'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Property } from '@/types';
import Link from 'next/link';
import { Building2, Loader2, MapPin, Ruler, DoorOpen } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

const statusStyles: Record<string, string> = {
    'DISPONIBLE': 'bg-success-50 text-success-600',
    'OCCUPE': 'bg-slate-100 text-slate-700',
    'TRAVAUX': 'bg-warning-50 text-warning-600',
};

const statusLabels: Record<string, string> = {
    'DISPONIBLE': 'Disponible',
    'OCCUPE': 'Occupé',
    'TRAVAUX': 'Travaux',
};

export default function PropertyList() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeSnapshot: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user) {
                setLoading(false);
                return;
            }

            const q = query(collection(db, 'biens'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
            unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                const props = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-slate-600" size={28} />
            </div>
        );
    }

    if (properties.length === 0) {
        return (
            <div className="bg-surface rounded-xl border border-border">
                <EmptyState
                    icon={Building2}
                    title="Aucun bien immobilier"
                    description="Commencez par ajouter votre premier bien pour gérer votre parc immobilier."
                    actionLabel="Ajouter un bien"
                    onAction={() => window.location.href = '/biens/nouveau'}
                />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((property) => (
                <Link href={`/biens/${property.id}`} key={property.id} className="block group">
                    <div className="bg-surface rounded-xl border border-border p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                        <div className="flex items-start justify-between mb-3">
                            <span className="text-xs font-medium text-text-tertiary">{property.type}</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles[property.status] || 'bg-slate-100 text-slate-600'}`}>
                                {statusLabels[property.status] || property.status}
                            </span>
                        </div>

                        {property.denomination && (
                            <p className="text-base font-semibold text-text-primary mb-1 group-hover:text-slate-700 transition-colors">
                                {property.denomination}
                            </p>
                        )}

                        <div className="flex items-start gap-1.5 text-sm text-text-secondary mb-3">
                            <MapPin size={14} className="text-text-tertiary mt-0.5 flex-shrink-0" />
                            <div>
                                <p>{property.address.street}</p>
                                <p className="text-text-tertiary text-xs">{property.address.zipCode} {property.address.city}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-text-tertiary pt-3 border-t border-border-light">
                            <div className="flex items-center gap-1">
                                <Ruler size={12} />
                                {property.features.surface} m²
                            </div>
                            <div className="flex items-center gap-1">
                                <DoorOpen size={12} />
                                {property.features.rooms} pièce{property.features.rooms > 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
