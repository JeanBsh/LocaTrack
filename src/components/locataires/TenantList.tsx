"use client";

import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Tenant } from '@/types';
import Link from 'next/link';
import { Users, Phone, Mail, ShieldCheck, Loader2 } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

export default function TenantList() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeSnapshot: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user) {
                setLoading(false);
                return;
            }

            const q = query(collection(db, 'locataires'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
            unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                const tenantData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Tenant[];
                setTenants(tenantData);
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

    if (tenants.length === 0) {
        return (
            <div className="bg-surface rounded-xl border border-border">
                <EmptyState
                    icon={Users}
                    title="Aucun locataire"
                    description="Commencez par ajouter votre premier locataire pour gérer vos locations."
                    actionLabel="Ajouter un locataire"
                    onAction={() => window.location.href = '/locataires/nouveau'}
                />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tenants.map((tenant) => (
                <Link key={tenant.id} href={`/locataires/${tenant.id}`} className="block group">
                    <div className="bg-surface rounded-xl border border-border p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm">
                                    {tenant.personalInfo.firstName[0]}{tenant.personalInfo.lastName[0]}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-text-primary text-sm group-hover:text-slate-700 transition-colors">
                                        {tenant.personalInfo.firstName} {tenant.personalInfo.lastName}
                                    </h3>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                        tenant.status === 'ACTIF'
                                            ? 'bg-success-50 text-success-600'
                                            : 'bg-slate-100 text-text-tertiary'
                                    }`}>
                                        {tenant.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-text-secondary">
                            <div className="flex items-center gap-2">
                                <Mail size={14} className="text-text-tertiary" />
                                <span className="truncate">{tenant.personalInfo.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={14} className="text-text-tertiary" />
                                <span>{tenant.personalInfo.phone}</span>
                            </div>
                            {tenant.guarantors && tenant.guarantors.length > 0 && (
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-light">
                                    <ShieldCheck size={14} className="text-success-500" />
                                    <span className="text-xs font-medium text-text-tertiary">
                                        {tenant.guarantors.length} Garant(s)
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
