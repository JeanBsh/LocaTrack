import PropertyList from '@/components/biens/PropertyList';
import Link from 'next/link';

export default function PropertiesPage() {
    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Mes Biens</h1>
                <Link
                    href="/biens/nouveau"
                    style={{
                        backgroundColor: '#2563eb',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontWeight: 600
                    }}
                >
                    Ajouter un Bien
                </Link>
            </div>
            <PropertyList />
        </div>
    );
}
