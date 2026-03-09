"use client";

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (loading) return;

        const publicPaths = ['/', '/login', '/register'];
        const isPublicPath = publicPaths.includes(pathname);

        if (!user && !isPublicPath) {
            router.push('/login');
        } else if (user && (pathname === '/login' || pathname === '/register')) {
            router.push('/dashboard');
        }
    }, [user, loading, pathname, router]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm text-gray-500 font-medium">Chargement...</p>
                </div>
            </div>
        );
    }

    if (!user && !['/', '/login', '/register'].includes(pathname)) {
        return null;
    }

    return <>{children}</>;
}
