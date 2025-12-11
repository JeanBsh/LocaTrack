import TenantList from '@/components/locataires/TenantList';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function TenantsPage() {
    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Locataires</h1>
                    <p className="text-slate-500 mt-1">Gérez vos locataires et leurs informations</p>
                </div>
                <Link
                    href="/locataires/nouveau"
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                >
                    <Plus size={20} /> Nouveau Locataire
                </Link>
            </div>
            <TenantList />
        </div>
    );
}
