import TenantList from '@/components/locataires/TenantList';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function TenantsPage() {
    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">Locataires</h1>
                    <p className="text-text-tertiary text-sm mt-1">Gérez vos locataires et leurs informations</p>
                </div>
                <Link
                    href="/locataires/nouveau"
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-sm font-medium text-sm"
                >
                    <Plus size={18} /> Nouveau locataire
                </Link>
            </div>
            <TenantList />
        </div>
    );
}
