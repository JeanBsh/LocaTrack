'use client';

import { TrendingUp, Wallet, AlertCircle, Users, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Property, Lease } from '@/types';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const [stats, setStats] = useState({
        occupancyRate: 0,
        monthlyRevenue: 0,
        unpaidAmount: 0,
        unpaidCount: 0
    });
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push('/login');
                return;
            }

            const fetchStats = async () => {
                try {
                    // 1. Fetch properties for Occupancy Rate
                    const qProperties = query(collection(db, 'biens'), where('userId', '==', user.uid));
                    const propertiesSnapshot = await getDocs(qProperties);
                    const properties = propertiesSnapshot.docs.map(doc => doc.data() as Property);

                    const totalProperties = properties.length;
                    const occupiedProperties = properties.filter(p => p.status === 'OCCUPE').length;
                    const occupancyRate = totalProperties > 0 ? Math.round((occupiedProperties / totalProperties) * 100) : 0;

                    // 2. Fetch active leases for Monthly Revenue
                    const qLeases = query(collection(db, 'leases'), where('userId', '==', user.uid));
                    const leasesSnapshot = await getDocs(qLeases);
                    const leases = leasesSnapshot.docs.map(doc => doc.data() as Lease);

                    const monthlyRevenue = leases.reduce((acc, lease) => {
                        return acc + (lease.financials.currentRent || 0) + (lease.financials.currentCharges || 0);
                    }, 0);

                    // 3. Unpaid - Placeholder logic
                    const unpaidAmount = 0;
                    const unpaidCount = 0;

                    setStats({
                        occupancyRate,
                        monthlyRevenue,
                        unpaidAmount,
                        unpaidCount
                    });
                } catch (error) {
                    console.error("Error fetching dashboard stats:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchStats();
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="p-8 w-full max-w-7xl mx-auto flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="p-8 w-full max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
                    Tableau de Bord
                </h1>
                <p className="text-slate-500">
                    Vue d'ensemble de votre parc immobilier
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* KPI Card 1: Taux d'Occupation */}
                <div className="h-full">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3 h-full relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <div className="absolute top-0 right-0 p-3 opacity-10 transform translate-x-2 -translate-y-2">
                            <Users size={80} className="text-blue-600" />
                        </div>

                        <div className="flex justify-between items-start relative z-10">
                            <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
                                <Users size={20} />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                                Taux d'Occupation
                            </h3>
                            <p className="text-3xl font-bold text-slate-900 tracking-tight">
                                {stats.occupancyRate}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* KPI Card 2: Revenus Mensuels */}
                <div className="h-full">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3 h-full relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <div className="absolute top-0 right-0 p-3 opacity-10 transform translate-x-2 -translate-y-2">
                            <Wallet size={80} className="text-green-600" />
                        </div>

                        <div className="flex justify-between items-start relative z-10">
                            <div className="p-2.5 bg-green-50 rounded-lg text-green-600">
                                <Wallet size={20} />
                            </div>
                            <span className="text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                                Revenus Mensuels
                            </span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                                Loyers + Charges (Total Baux)
                            </h3>
                            <p className="text-3xl font-bold text-slate-900 tracking-tight">
                                {stats.monthlyRevenue.toLocaleString('fr-FR')} €
                            </p>
                        </div>
                    </div>
                </div>

                {/* KPI Card 3: Impayés */}
                <div className="h-full">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3 h-full relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <div className="absolute top-0 right-0 p-3 opacity-10 transform translate-x-2 -translate-y-2">
                            <AlertCircle size={80} className="text-red-600" />
                        </div>

                        <div className="flex justify-between items-start relative z-10">
                            <div className="p-2.5 bg-red-50 rounded-lg text-red-600">
                                <AlertCircle size={20} />
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${stats.unpaidCount > 0 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                                {stats.unpaidCount} dossiers
                            </span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                                Impayés
                            </h3>
                            <p className="text-3xl font-bold text-slate-900 tracking-tight">
                                {stats.unpaidAmount.toLocaleString('fr-FR')} €
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

