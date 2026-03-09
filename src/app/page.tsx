'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Building2, FileText, PieChart, Users, Shield, Zap,
    ArrowRight, Check, ChevronRight, Star
} from 'lucide-react';

// ─── Features ──────────────────────────────────────────────────────────────
const features = [
    {
        icon: Building2,
        title: 'Gestion des biens',
        description: 'Centralisez tous vos biens immobiliers, suivez leur statut et leurs caractéristiques en un seul endroit.',
    },
    {
        icon: Users,
        title: 'Suivi des locataires',
        description: 'Gérez les informations de vos locataires, garants et colocataires. Suivez les baux actifs.',
    },
    {
        icon: FileText,
        title: 'Documents automatisés',
        description: 'Générez quittances de loyer, attestations et contrats de bail en PDF en quelques clics.',
    },
    {
        icon: PieChart,
        title: 'Suivi financier',
        description: 'Visualisez vos revenus, charges et rentabilité brute et nette avec des graphiques clairs.',
    },
    {
        icon: Shield,
        title: 'Coffre-fort numérique',
        description: 'Stockez et organisez tous vos documents importants : baux, factures, diagnostics, assurances.',
    },
    {
        icon: Zap,
        title: 'Alertes intelligentes',
        description: 'Soyez notifié des loyers en retard, baux à renouveler et paiements reçus automatiquement.',
    },
];

// ─── Pricing ───────────────────────────────────────────────────────────────
const plans = [
    {
        name: 'Gratuit',
        price: '0',
        description: 'Pour démarrer et tester la plateforme',
        features: [
            'Jusqu\'à 2 biens',
            'Gestion des locataires',
            'Génération de quittances',
            'Tableau de bord basique',
        ],
        cta: 'Commencer gratuitement',
        highlighted: false,
    },
    {
        name: 'Basic',
        price: '9',
        description: 'Pour les propriétaires avec plusieurs biens',
        features: [
            'Jusqu\'à 10 biens',
            'Toutes les fonctionnalités gratuites',
            'Coffre-fort documents',
            'Suivi financier complet',
            'Génération en masse',
            'Support par email',
        ],
        cta: 'Essai gratuit 14 jours',
        highlighted: true,
    },
    {
        name: 'Pro',
        price: '24',
        description: 'Pour les gestionnaires professionnels',
        features: [
            'Biens illimités',
            'Toutes les fonctionnalités Basic',
            'Alertes intelligentes',
            'Export comptable',
            'Multi-utilisateurs',
            'Support prioritaire',
        ],
        cta: 'Essai gratuit 14 jours',
        highlighted: false,
    },
];

// ─── Fade in animation ────────────────────────────────────────────────────
const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, delay: i * 0.1 },
    }),
};

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* ─── Navbar ──────────────────────────────────────────────────── */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-5 w-6 bg-black rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm" />
                        <span className="font-bold text-black text-lg tracking-tight">LocaTrack</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
                        <a href="#features" className="hover:text-black transition-colors">Fonctionnalités</a>
                        <a href="#pricing" className="hover:text-black transition-colors">Tarifs</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="text-sm font-medium text-slate-700 hover:text-black transition-colors px-4 py-2"
                        >
                            Connexion
                        </Link>
                        <Link
                            href="/register"
                            className="text-sm font-medium bg-black text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            Commencer
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ─── Hero ────────────────────────────────────────────────────── */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
                            <Star className="h-3 w-3" />
                            Gestion locative simplifiée
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-black tracking-tight leading-tight">
                            Gérez vos biens
                            <br />
                            <span className="text-slate-400">sans prise de tête</span>
                        </h1>
                        <p className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                            LocaTrack centralise la gestion de vos biens, locataires et documents.
                            Automatisez vos quittances, suivez vos revenus et gardez le contrôle sur votre patrimoine immobilier.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link
                            href="/register"
                            className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors text-sm shadow-lg shadow-slate-200"
                        >
                            Commencer gratuitement
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="#features"
                            className="flex items-center gap-2 text-slate-600 px-6 py-3 rounded-lg font-medium hover:text-black transition-colors text-sm"
                        >
                            Découvrir les fonctionnalités
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </motion.div>

                    {/* Dashboard Preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="mt-16 relative"
                    >
                        <div className="bg-slate-100 rounded-2xl p-2 shadow-2xl shadow-slate-200/50">
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                {/* Mock dashboard preview */}
                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="h-3 w-3 rounded-full bg-red-400" />
                                        <div className="h-3 w-3 rounded-full bg-yellow-400" />
                                        <div className="h-3 w-3 rounded-full bg-green-400" />
                                        <span className="text-xs text-slate-400 ml-2">app.locatrack.fr/dashboard</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-3 mb-4">
                                        {[
                                            { label: 'Taux d\'occupation', value: '87%' },
                                            { label: 'Revenus mensuels', value: '3 450 €' },
                                            { label: 'Impayés', value: '0 €' },
                                            { label: 'Locataires', value: '5' },
                                        ].map((kpi) => (
                                            <div key={kpi.label} className="bg-slate-50 rounded-lg p-3">
                                                <p className="text-xs text-slate-400">{kpi.label}</p>
                                                <p className="text-lg font-bold text-slate-900 mt-1">{kpi.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="col-span-2 bg-slate-50 rounded-lg p-4 h-32" />
                                        <div className="bg-slate-50 rounded-lg p-4 h-32" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ─── Features ────────────────────────────────────────────────── */}
            <section id="features" className="py-20 px-6 bg-slate-50">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        custom={0}
                        className="text-center mb-14"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-black tracking-tight">
                            Tout ce dont vous avez besoin
                        </h2>
                        <p className="mt-4 text-slate-500 max-w-xl mx-auto">
                            Une plateforme complète pour gérer votre patrimoine immobilier de A à Z.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((feature, idx) => {
                            const FeatureIcon = feature.icon;
                            return (
                                <motion.div
                                    key={idx}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    variants={fadeUp}
                                    custom={idx}
                                    className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
                                        <FeatureIcon className="h-5 w-5 text-slate-700" />
                                    </div>
                                    <h3 className="text-base font-semibold text-black mb-2">{feature.title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ─── Pricing ─────────────────────────────────────────────────── */}
            <section id="pricing" className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        custom={0}
                        className="text-center mb-14"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-black tracking-tight">
                            Tarifs simples et transparents
                        </h2>
                        <p className="mt-4 text-slate-500 max-w-xl mx-auto">
                            Commencez gratuitement, évoluez quand vous êtes prêt.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {plans.map((plan, idx) => (
                            <motion.div
                                key={idx}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeUp}
                                custom={idx}
                                className={`rounded-2xl p-6 flex flex-col ${
                                    plan.highlighted
                                        ? 'bg-black text-white ring-2 ring-black shadow-xl shadow-slate-200/50 scale-[1.02]'
                                        : 'bg-white border border-slate-200'
                                }`}
                            >
                                <div className="mb-6">
                                    <h3 className={`text-lg font-semibold ${plan.highlighted ? 'text-white' : 'text-black'}`}>
                                        {plan.name}
                                    </h3>
                                    <p className={`text-sm mt-1 ${plan.highlighted ? 'text-slate-300' : 'text-slate-500'}`}>
                                        {plan.description}
                                    </p>
                                </div>

                                <div className="mb-6">
                                    <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-black'}`}>
                                        {plan.price}€
                                    </span>
                                    <span className={`text-sm ${plan.highlighted ? 'text-slate-400' : 'text-slate-500'}`}>/mois</span>
                                </div>

                                <ul className="space-y-3 mb-8 flex-grow">
                                    {plan.features.map((feature, fIdx) => (
                                        <li key={fIdx} className="flex items-start gap-2.5">
                                            <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                                                plan.highlighted ? 'text-green-400' : 'text-slate-400'
                                            }`} />
                                            <span className={`text-sm ${
                                                plan.highlighted ? 'text-slate-200' : 'text-slate-600'
                                            }`}>
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href="/register"
                                    className={`w-full text-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                        plan.highlighted
                                            ? 'bg-white text-black hover:bg-slate-100'
                                            : 'bg-black text-white hover:bg-slate-800'
                                    }`}
                                >
                                    {plan.cta}
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CTA ─────────────────────────────────────────────────────── */}
            <section className="py-20 px-6 bg-slate-50">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={0}
                    className="max-w-3xl mx-auto text-center"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-black tracking-tight">
                        Prêt à simplifier votre gestion locative ?
                    </h2>
                    <p className="mt-4 text-slate-500 mb-8">
                        Rejoignez les propriétaires qui gagnent du temps avec LocaTrack.
                    </p>
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-2 bg-black text-white px-8 py-3.5 rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                    >
                        Créer mon compte gratuitement
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </motion.div>
            </section>

            {/* ─── Footer ──────────────────────────────────────────────────── */}
            <footer className="border-t border-slate-200 py-10 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-5 bg-black rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm" />
                        <span className="font-bold text-sm text-black">LocaTrack</span>
                    </div>
                    <p className="text-xs text-slate-400">
                        &copy; {new Date().getFullYear()} LocaTrack. Tous droits réservés.
                    </p>
                    <div className="flex gap-6 text-xs text-slate-500">
                        <a href="#" className="hover:text-black transition-colors">Mentions légales</a>
                        <a href="#" className="hover:text-black transition-colors">Confidentialité</a>
                        <a href="#" className="hover:text-black transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
