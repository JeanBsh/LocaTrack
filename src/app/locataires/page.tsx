import TenantList from '@/components/locataires/TenantList';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function TenantsPage() {
    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <PageHeader
                title="Locataires"
                description="Gérez vos locataires et leurs informations"
                action={
                    <Link
                        href="/locataires/nouveau"
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-sm font-medium text-sm"
                    >
                        <Plus size={16} /> Nouveau locataire
                    </Link>
                }
            />
            <TenantList />
        </div>
    );
}
