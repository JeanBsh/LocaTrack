'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Property, Lease } from '@/types';
import {
    Loader2, TrendingUp, TrendingDown, Wallet, Receipt,
    Building2, ArrowUpRight, ArrowDownRight, PieChart, Plus, Minus
} from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/ui/PageHeader';
import CountUp from 'react-countup';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell
} from 'recharts';
import EmptyState from '@/components/ui/EmptyState';

// ─── Mock charges data ─────────────────────────────────────────────────────
const mockCharges = [
    { id: '1', label: 'Taxe foncière — T3 Marseille', amount: 1200, type: 'annuelle' as const, category: 'Taxes' },
    { id: '2', label: 'Assurance PNO — Tous biens', amount: 450, type: 'annuelle' as const, category: 'Assurance' },
    { id: '3', label: 'Travaux plomberie — Studio Lyon', amount: 380, type: 'ponctuelle' as const, category: 'Travaux' },
    { id: '4', label: 'Frais de gestion comptable', amount: 600, type: 'annuelle' as const, category: 'Gestion' },
    { id: '5', label: 'Remplacement chauffe-eau', amount: 850, type: 'ponctuelle' as const, category: 'Travaux' },
    { id: '6', label: 'Charges copropriété — T2 Paris', amount: 1800, type: 'annuelle' as const, category: 'Copropriété' },
];

const categoryColors: Record<string, string> = {
    'Taxes': 'bg-danger-50 text-danger-600',
    'Assurance': 'bg-warning-50 text-warning-600',
    'Travaux': 'bg-slate-100 text-slate-700',
    'Gestion': 'bg-primary-100 text-primary-700',
    'Copropriété': 'bg-success-50 text-success-600',
};

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload) return null;
    return (
        <div className="bg-white rounded-lg shadow-lg border border-border p-3 text-sm">
            <p className="font-semibold text-text-primary mb-1">{label}</p>
            {payload.map((entry: any, i: number) => (
                <p key={i} className="text-text-secondary">
                    {entry.name === 'revenus' ? 'Revenus' : 'Charges'}: {entry.value.toLocaleString('fr-FR')} €
                </p>
            ))}
        </div>
    );
}

export default function FinancePage() {
    const [loading, setLoading] = useState(true);
    const [properties, setProperties] = useState<Property[]>([]);
    const [leases, setLeases] = useState<Lease[]>([]);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push('/login');
                return;
            }

            const fetchData = async () => {
                try {
                    const qProperties = query(collection(db, 'biens'), where('userId', '==', user.uid));
                    const propertiesSnap = await getDocs(qProperties);
                    setProperties(propertiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property)));

                    const qLeases = query(collection(db, 'leases'), where('userId', '==', user.uid));
                    const leasesSnap = await getDocs(qLeases);
                    setLeases(leasesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lease)));
                } catch (error) {
                    console.error("Error fetching finance data:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-slate-600" size={28} />
                    <p className="text-sm text-text-tertiary">Chargement des finances...</p>
                </div>
            </div>
        );
    }

    // ─── Calculations ──────────────────────────────────────────────────────
    const monthlyRevenue = leases.reduce((acc, lease) => {
        return acc + (lease.financials.currentRent || 0) + (lease.financials.currentCharges || 0);
    }, 0);
    const annualRevenue = monthlyRevenue * 12;

    const totalCharges = mockCharges.reduce((acc, c) => acc + c.amount, 0);

    const netAnnual = annualRevenue - totalCharges;

    // Rentabilité brute = (loyers annuels / valeur totale des biens) * 100
    const totalPropertyValue = properties.reduce((acc, p) => {
        // Estimation basée sur le loyer (prix = loyer * 200 pour un rendement ~6%)
        return acc + ((p.financials.baseRent || 0) * 200);
    }, 0);
    const rentabiliteBrute = totalPropertyValue > 0
        ? ((annualRevenue / totalPropertyValue) * 100)
        : 0;
    const rentabiliteNette = totalPropertyValue > 0
        ? ((netAnnual / totalPropertyValue) * 100)
        : 0;

    // Chart data — revenus vs charges par mois (mock-based)
    const months = ['Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar'];
    const chartData = months.map((month) => ({
        month,
        revenus: Math.round(monthlyRevenue * (0.9 + Math.random() * 0.2)),
        charges: Math.round((totalCharges / 12) * (0.7 + Math.random() * 0.6)),
    }));

    // Revenue per property for breakdown
    const revenueByProperty = leases.map(lease => {
        const property = properties.find(p => p.id === lease.propertyId);
        return {
            name: property?.denomination || property?.address?.street || 'Bien inconnu',
            type: property?.type || '',
            rent: lease.financials.currentRent || 0,
            charges: lease.financials.currentCharges || 0,
            total: (lease.financials.currentRent || 0) + (lease.financials.currentCharges || 0),
        };
    });

    const hasData = leases.length > 0;

    if (!hasData) {
        return (
            <div className="w-full p-6 md:p-12">
                <PageHeader
                    title="Finance"
                    description="Suivi financier de votre parc immobilier"
                />
                <div className="bg-surface rounded-xl border border-border">
                    <EmptyState
                        icon={PieChart}
                        title="Aucune donnée financière"
                        description="Ajoutez des biens et créez des baux pour voir apparaître vos revenus, charges et rentabilité."
                        actionLabel="Ajouter un bien"
                        onAction={() => router.push('/biens/nouveau')}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full p-6 md:p-12 space-y-6">
            <PageHeader
                title="Finance"
                description="Suivi financier de votre parc immobilier"
            />

            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        icon: Wallet,
                        label: 'Revenus mensuels',
                        value: monthlyRevenue,
                        suffix: '€',
                        sub: `${annualRevenue.toLocaleString('fr-FR')} €/an`,
                        iconColor: 'bg-success-100 text-success-600',
                    },
                    {
                        icon: Receipt,
                        label: 'Charges annuelles',
                        value: totalCharges,
                        suffix: '€',
                        sub: `${Math.round(totalCharges / 12).toLocaleString('fr-FR')} €/mois`,
                        iconColor: 'bg-danger-100 text-danger-600',
                    },
                    {
                        icon: TrendingUp,
                        label: 'Rentabilité brute',
                        value: parseFloat(rentabiliteBrute.toFixed(1)),
                        suffix: '%',
                        sub: `Net: ${rentabiliteNette.toFixed(1)}%`,
                        iconColor: 'bg-success-100 text-success-600',
                    },
                    {
                        icon: Building2,
                        label: 'Résultat net annuel',
                        value: netAnnual,
                        suffix: '€',
                        sub: `${properties.length} bien${properties.length > 1 ? 's' : ''} · ${leases.length} bail${leases.length > 1 ? 'x' : ''}`,
                        iconColor: netAnnual >= 0 ? 'bg-success-100 text-success-600' : 'bg-danger-100 text-danger-600',
                    },
                ].map((kpi, idx) => {
                    const KpiIcon = kpi.icon;
                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: idx * 0.1 }}
                            className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-2.5 rounded-xl ${kpi.iconColor}`}>
                                    <KpiIcon className="h-5 w-5" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-text-primary tracking-tight">
                                <CountUp end={kpi.value} duration={1.5} separator=" " decimals={kpi.suffix === '%' ? 1 : 0} />
                                <span className="text-lg ml-0.5">{kpi.suffix}</span>
                            </p>
                            <p className="text-sm text-text-tertiary mt-1">{kpi.label}</p>
                            <p className="text-xs text-text-tertiary mt-0.5">{kpi.sub}</p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Chart + Revenue breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Bar Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="lg:col-span-2 bg-surface rounded-xl border border-border p-5"
                >
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-base font-semibold text-text-primary">Revenus vs Charges</h2>
                            <p className="text-xs text-text-tertiary mt-0.5">Comparaison mensuelle</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-text-tertiary">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                                Revenus
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-warning-500" />
                                Charges
                            </div>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="revenus" fill="#334155" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="charges" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Revenue per property */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="bg-surface rounded-xl border border-border p-5"
                >
                    <h2 className="text-base font-semibold text-text-primary mb-4">Revenus par bien</h2>
                    <div className="space-y-3">
                        {revenueByProperty.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-surface-hover">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
                                    <p className="text-xs text-text-tertiary">{item.type}</p>
                                </div>
                                <div className="text-right flex-shrink-0 ml-3">
                                    <p className="text-sm font-semibold text-text-primary">{item.total.toLocaleString('fr-FR')} €</p>
                                    <p className="text-xs text-text-tertiary">Loyer + charges</p>
                                </div>
                            </div>
                        ))}
                        {revenueByProperty.length === 0 && (
                            <p className="text-sm text-text-tertiary text-center py-4">Aucun bail actif</p>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Charges Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
                className="bg-surface rounded-xl border border-border"
            >
                <div className="flex items-center justify-between p-5 border-b border-border">
                    <div>
                        <h2 className="text-base font-semibold text-text-primary">Détail des charges</h2>
                        <p className="text-xs text-text-tertiary mt-0.5">Liste de toutes les dépenses</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors cursor-pointer">
                        <Plus className="h-4 w-4" />
                        Ajouter
                    </button>
                </div>

                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-surface-hover border-b border-border text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    <div className="col-span-5">Libellé</div>
                    <div className="col-span-2">Catégorie</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-3 text-right">Montant</div>
                </div>

                {mockCharges.map((charge, idx) => (
                    <div
                        key={charge.id}
                        className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-3.5 items-center hover:bg-surface-hover transition-colors ${
                            idx < mockCharges.length - 1 ? 'border-b border-border-light' : ''
                        }`}
                    >
                        <div className="md:col-span-5 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-danger-50 text-danger-600 flex-shrink-0">
                                <Minus className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-sm font-medium text-text-primary">{charge.label}</span>
                        </div>
                        <div className="md:col-span-2">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${categoryColors[charge.category] || 'bg-slate-100 text-slate-600'}`}>
                                {charge.category}
                            </span>
                        </div>
                        <div className="md:col-span-2 text-sm text-text-secondary capitalize">{charge.type}</div>
                        <div className="md:col-span-3 text-right">
                            <span className="text-sm font-semibold text-danger-600">
                                -{charge.amount.toLocaleString('fr-FR')} €
                            </span>
                        </div>
                    </div>
                ))}

                {/* Total */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-5 py-4 bg-surface-hover border-t border-border items-center">
                    <div className="md:col-span-9 text-sm font-semibold text-text-primary">Total des charges</div>
                    <div className="md:col-span-3 text-right">
                        <span className="text-base font-bold text-danger-600">
                            -{totalCharges.toLocaleString('fr-FR')} €
                        </span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
