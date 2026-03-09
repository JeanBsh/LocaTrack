import PropertyList from '@/components/biens/PropertyList';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function PropertiesPage() {
    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">Mes Biens</h1>
                    <p className="text-text-tertiary text-sm mt-1">Gérez votre parc immobilier</p>
                </div>
                <Link
                    href="/biens/nouveau"
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-sm font-medium text-sm"
                >
                    <Plus size={18} /> Ajouter un bien
                </Link>
            </div>
            <PropertyList />
        </div>
    );
}
