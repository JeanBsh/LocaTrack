'use client';

import {
    TrendingUp, TrendingDown, Wallet, AlertCircle, Users, Loader2,
    Building2, Clock, AlertTriangle, FileText, ArrowRight, CalendarClock,
    CheckCircle2, Plus, ChevronRight
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Property, Lease, Tenant } from '@/types';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import CountUp from 'react-countup';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import PageHeader from '@/components/ui/PageHeader';
import Link from 'next/link';

// ─── Mock data for chart (revenue over 6 months) ──────────────────────────
const generateRevenueData = (monthlyRevenue: number) => {
    const months = ['Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar'];
    const base = monthlyRevenue || 2400;
    return months.map((month, i) => ({
        month,
        revenus: Math.round(base * (0.85 + Math.random() * 0.3)),
        charges: Math.round(base * (0.1 + Math.random() * 0.08)),
    }));
};

// ─── Mock alerts ───────────────────────────────────────────────────────────
const mockAlerts = [
    {
        id: '1',
        type: 'warning' as const,
        icon: AlertTriangle,
        title: 'Loyer en retard',
        description: 'M. Dupont — Appartement Rue de la Paix',
        time: 'Depuis 5 jours',
    },
    {
        id: '2',
        type: 'info' as const,
        icon: CalendarClock,
        title: 'Bail à renouveler',
        description: 'Mme Martin — Studio Centre-Ville',
        time: 'Expire dans 30 jours',
    },
    {
        id: '3',
        type: 'success' as const,
        icon: CheckCircle2,
        title: 'Paiement reçu',
        description: 'M. Bernard — Maison Les Lilas',
        time: 'Aujourd\'hui',
    },
];

// ─── Mock recent activity ──────────────────────────────────────────────────
const mockActivity = [
    { id: '1', icon: Wallet, text: 'Loyer encaissé — M. Bernard', detail: '850 €', time: 'Il y a 2h', color: 'text-success-600 bg-success-50' },
    { id: '2', icon: FileText, text: 'Quittance générée — Mme Martin', detail: 'Mars 2026', time: 'Il y a 5h', color: 'text-slate-600 bg-slate-100' },
    { id: '3', icon: Users, text: 'Nouveau locataire ajouté', detail: 'M. Lefebvre', time: 'Hier', color: 'text-slate-600 bg-slate-100' },
    { id: '4', icon: Building2, text: 'Bien mis à jour — T3 Marseille', detail: 'Statut: Occupé', time: 'Hier', color: 'text-warning-600 bg-warning-50' },
    { id: '5', icon: CheckCircle2, text: 'Bail signé — Studio Lyon', detail: '12 mois', time: 'Il y a 3 jours', color: 'text-success-600 bg-success-50' },
];

// ─── Custom chart tooltip ──────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload) return null;
    return (
        <div className="bg-white rounded-lg shadow-lg border border-border p-3 text-sm">
            <p className="font-semibold text-text-primary mb-1">{label}</p>
            {payload.map((entry: any, i: number) => (
                <p key={i} className="text-text-secondary">
                    <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
                    {entry.name === 'revenus' ? 'Revenus' : 'Charges'}: {entry.value.toLocaleString('fr-FR')} €
                </p>
            ))}
        </div>
    );
}

// ─── KPI Card Component ────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, suffix, trend, trendLabel, color, delay }: {
    icon: any;
    label: string;
    value: number;
    suffix?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendLabel?: string;
    color: 'primary' | 'success' | 'danger' | 'warning';
    delay: number;
}) {
    const colorMap = {
        primary: { bg: 'bg-primary-50', text: 'text-primary-600', icon: 'bg-primary-100 text-primary-600' },
        success: { bg: 'bg-success-50', text: 'text-success-600', icon: 'bg-success-100 text-success-600' },
        danger: { bg: 'bg-danger-50', text: 'text-danger-600', icon: 'bg-danger-100 text-danger-600' },
        warning: { bg: 'bg-warning-50', text: 'text-warning-600', icon: 'bg-warning-100 text-warning-600' },
    };
    const c = colorMap[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow duration-300"
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${c.icon}`}>
                    <Icon className="h-5 w-5" />
                </div>
                {trend && trendLabel && (
                    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                        trend === 'up' ? 'text-success-600 bg-success-50' :
                        trend === 'down' ? 'text-danger-600 bg-danger-50' :
                        'text-text-tertiary bg-slate-100'
                    }`}>
                        {trend === 'up' ? <TrendingUp className="h-3 w-3" /> :
                         trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
                        {trendLabel}
                    </div>
                )}
            </div>
            <p className="text-2xl font-bold text-text-primary tracking-tight">
                <CountUp end={value} duration={1.8} separator=" " decimals={0} />
                {suffix && <span className="text-lg ml-0.5">{suffix}</span>}
            </p>
            <p className="text-sm text-text-tertiary mt-1">{label}</p>
        </motion.div>
    );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────
export default function Dashboard() {
    const [stats, setStats] = useState({
        occupancyRate: 0,
        monthlyRevenue: 0,
        unpaidAmount: 0,
        unpaidCount: 0,
        totalProperties: 0,
        totalTenants: 0,
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
                    const qProperties = query(collection(db, 'biens'), where('userId', '==', user.uid));
                    const propertiesSnapshot = await getDocs(qProperties);
                    const properties = propertiesSnapshot.docs.map(doc => doc.data() as Property);

                    const totalProperties = properties.length;
                    const occupiedProperties = properties.filter(p => p.status === 'OCCUPE').length;
                    const occupancyRate = totalProperties > 0 ? Math.round((occupiedProperties / totalProperties) * 100) : 0;

                    const qLeases = query(collection(db, 'leases'), where('userId', '==', user.uid));
                    const leasesSnapshot = await getDocs(qLeases);
                    const leases = leasesSnapshot.docs.map(doc => doc.data() as Lease);

                    const monthlyRevenue = leases.reduce((acc, lease) => {
                        return acc + (lease.financials.currentRent || 0) + (lease.financials.currentCharges || 0);
                    }, 0);

                    const qTenants = query(collection(db, 'locataires'), where('userId', '==', user.uid));
                    const tenantsSnapshot = await getDocs(qTenants);

                    const unpaidAmount = 0;
                    const unpaidCount = 0;

                    setStats({
                        occupancyRate,
                        monthlyRevenue,
                        unpaidAmount,
                        unpaidCount,
                        totalProperties,
                        totalTenants: tenantsSnapshot.size,
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
            <div className="flex justify-center items-center h-full min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-slate-600" size={28} />
                    <p className="text-sm text-text-tertiary">Chargement du tableau de bord...</p>
                </div>
            </div>
        );
    }

    const revenueData = generateRevenueData(stats.monthlyRevenue);

    return (
        <div className="w-full p-6 md:p-12 space-y-6">
            <PageHeader
                title="Tableau de Bord"
                description="Vue d'ensemble de votre parc immobilier"
            />

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    icon={Building2}
                    label="Taux d'occupation"
                    value={stats.occupancyRate}
                    suffix="%"
                    trend="up"
                    trendLabel="+5%"
                    color="primary"
                    delay={0}
                />
                <KpiCard
                    icon={Wallet}
                    label="Revenus mensuels"
                    value={stats.monthlyRevenue}
                    suffix="€"
                    trend="up"
                    trendLabel="+12%"
                    color="success"
                    delay={0.1}
                />
                <KpiCard
                    icon={AlertCircle}
                    label="Impayés"
                    value={stats.unpaidAmount}
                    suffix="€"
                    trend={stats.unpaidCount > 0 ? 'down' : 'neutral'}
                    trendLabel={`${stats.unpaidCount} dossier${stats.unpaidCount > 1 ? 's' : ''}`}
                    color={stats.unpaidCount > 0 ? 'danger' : 'success'}
                    delay={0.2}
                />
                <KpiCard
                    icon={Users}
                    label="Locataires actifs"
                    value={stats.totalTenants}
                    trend="neutral"
                    trendLabel={`${stats.totalProperties} bien${stats.totalProperties > 1 ? 's' : ''}`}
                    color="primary"
                    delay={0.3}
                />
            </div>

            {/* Chart + Alerts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Revenue Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="lg:col-span-2 bg-surface rounded-xl border border-border p-5"
                >
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-base font-semibold text-text-primary">Revenus & Charges</h2>
                            <p className="text-xs text-text-tertiary mt-0.5">Évolution sur 6 mois</p>
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
                        <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#334155" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#334155" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorCharges" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#94a3b8' }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#94a3b8' }}
                                tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="revenus"
                                stroke="#334155"
                                strokeWidth={2}
                                fill="url(#colorRevenus)"
                            />
                            <Area
                                type="monotone"
                                dataKey="charges"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                fill="url(#colorCharges)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Alerts / To-do */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="bg-surface rounded-xl border border-border p-5"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-text-primary">Alertes</h2>
                        <span className="text-xs text-text-tertiary bg-slate-100 px-2 py-0.5 rounded-full">
                            {mockAlerts.length}
                        </span>
                    </div>
                    <div className="space-y-3">
                        {mockAlerts.map((alert) => {
                            const AlertIcon = alert.icon;
                            const colorMap = {
                                warning: 'bg-warning-50 text-warning-600 border-warning-100',
                                info: 'bg-primary-50 text-primary-600 border-primary-100',
                                success: 'bg-success-50 text-success-600 border-success-100',
                            };
                            return (
                                <div
                                    key={alert.id}
                                    className={`flex items-start gap-3 p-3 rounded-lg border ${colorMap[alert.type]} cursor-pointer hover:shadow-sm transition-shadow`}
                                >
                                    <AlertIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium leading-tight">{alert.title}</p>
                                        <p className="text-xs opacity-75 mt-0.5 truncate">{alert.description}</p>
                                    </div>
                                    <span className="text-[10px] opacity-60 whitespace-nowrap mt-0.5">{alert.time}</span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>

            {/* Recent Activity + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.35 }}
                    className="lg:col-span-2 bg-surface rounded-xl border border-border p-5"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-text-primary">Activité récente</h2>
                        <button className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1">
                            Tout voir <ChevronRight className="h-3 w-3" />
                        </button>
                    </div>
                    <div className="space-y-1">
                        {mockActivity.map((item, idx) => {
                            const ActivityIcon = item.icon;
                            return (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-hover transition-colors group"
                                >
                                    <div className={`p-2 rounded-lg ${item.color} flex-shrink-0`}>
                                        <ActivityIcon className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-text-primary truncate">{item.text}</p>
                                        <p className="text-xs text-text-tertiary">{item.detail}</p>
                                    </div>
                                    <span className="text-xs text-text-tertiary whitespace-nowrap">{item.time}</span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="bg-surface rounded-xl border border-border p-5"
                >
                    <h2 className="text-base font-semibold text-text-primary mb-4">Actions rapides</h2>
                    <div className="space-y-2">
                        {[
                            { label: 'Ajouter un bien', href: '/biens/nouveau', icon: Building2, color: 'text-slate-700 bg-slate-100' },
                            { label: 'Ajouter un locataire', href: '/locataires/nouveau', icon: Users, color: 'text-success-600 bg-success-50' },
                            { label: 'Générer une quittance', href: '/documents', icon: FileText, color: 'text-warning-600 bg-warning-50' },
                        ].map((action) => {
                            const ActionIcon = action.icon;
                            return (
                                <Link
                                    key={action.href}
                                    href={action.href}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-slate-300 hover:bg-slate-50 transition-all group"
                                >
                                    <div className={`p-2 rounded-lg ${action.color}`}>
                                        <ActionIcon className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-medium text-text-primary group-hover:text-slate-900 transition-colors">
                                        {action.label}
                                    </span>
                                    <ArrowRight className="h-4 w-4 text-text-tertiary ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
