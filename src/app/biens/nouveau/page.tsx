import PropertyForm from '@/components/biens/PropertyForm';

export default function NewPropertyPage() {
    return (
        <div style={{ padding: '2rem' }}>
            <h1 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: 'bold' }}>Nouveau Bien Immobilier</h1>
            <PropertyForm />
        </div>
    );
}
