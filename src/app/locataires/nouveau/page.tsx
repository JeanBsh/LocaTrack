import TenantForm from '@/components/locataires/TenantForm';

export default function NewTenantPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Nouveau Locataire</h1>
                <p className="text-slate-500 mt-1">Ajoutez un nouveau locataire à votre base de données</p>
            </header>
            <TenantForm />
        </div>
    );
}
