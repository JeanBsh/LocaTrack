import TenantDetail from '@/components/locataires/TenantDetail';

export default async function SingleTenantPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <TenantDetail tenantId={id} />;
}
