'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Property } from '@/types';
import styles from './PropertyList.module.css';
import Link from 'next/link';

export default function PropertyList() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'biens'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const props = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Property[];
            setProperties(props);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) return <div>Chargement...</div>;

    return (
        <div className={styles.grid}>
            {properties.map((property) => (
                <Link href={`/biens/${property.id}`} key={property.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className={styles.card}>
                        <div className={styles.header}>
                            <span className={styles.type}>{property.type}</span>
                            <span className={`${styles.status} ${property.status === 'DISPONIBLE' ? styles.statusAvailable :
                                property.status === 'OCCUPE' ? styles.statusOccupied :
                                    styles.statusWork
                                }`}>
                                {property.status}
                            </span>
                        </div>

                        <div className={styles.address}>
                            {property.address.street}<br />
                            {property.address.zipCode} {property.address.city}
                        </div>

                        <div className={styles.details}>
                            <span>{property.features.surface} m²</span>
                            <span>•</span>
                            <span>{property.features.rooms} p.</span>
                        </div>


                    </div>
                </Link>
            ))}
        </div>
    );
}
