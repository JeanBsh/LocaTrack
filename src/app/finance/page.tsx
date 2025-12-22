'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function FinancePage() {
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push('/login');
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="p-8 w-full max-w-7xl mx-auto flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="p-8 w-full max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
                    Finance
                </h1>
                <p className="text-slate-500">
                    Gestion financière (En construction)
                </p>
            </header>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-600">Cette page est en cours de développement.</p>
            </div>
        </div>
    );
}
