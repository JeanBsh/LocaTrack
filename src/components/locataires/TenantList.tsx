"use client";

import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tenant } from '@/types';
import Link from 'next/link';
import { User, Phone, Mail, ShieldCheck, Loader2 } from 'lucide-react';

export default function TenantList() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'locataires'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tenantData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Tenant[];
            setTenants(tenantData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    if (tenants.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-100 shadow-sm">
                <User className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900">Aucun locataire</h3>
                <p className="mt-1 text-slate-500">Commencez par ajouter votre premier locataire.</p>
                <div className="mt-6">
                    <Link
                        href="/locataires/nouveau"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Ajouter un locataire
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map((tenant) => (
                <Link key={tenant.id} href={`/locataires/${tenant.id}`} className="block group">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
                                    {tenant.personalInfo.firstName[0]}{tenant.personalInfo.lastName[0]}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                        {tenant.personalInfo.firstName} {tenant.personalInfo.lastName}
                                    </h3>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tenant.status === 'ACTIF' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {tenant.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <Mail size={16} className="text-slate-400" />
                                <span className="truncate">{tenant.personalInfo.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={16} className="text-slate-400" />
                                <span>{tenant.personalInfo.phone}</span>
                            </div>
                            {tenant.guarantors && tenant.guarantors.length > 0 && (
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                                    <ShieldCheck size={16} className="text-green-500" />
                                    <span className="text-xs font-medium text-slate-500">
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
