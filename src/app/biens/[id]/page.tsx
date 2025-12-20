import PropertyDetail from '@/components/biens/PropertyDetail';

export default async function SinglePropertyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <PropertyDetail propertyId={id} />;
}
