'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Tenant, Property, Lease, UserProfile } from '@/types';
import { Receipt, Loader2, Calendar, Download } from 'lucide-react';
import { format } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

// Dynamic import of the entire PDF download component
const PdfDownloader = dynamic(() => import('./PdfDownloader').then(mod => mod.RentReceiptDownloader), {
    ssr: false,
    loading: () => <Loader2 className="animate-spin" size={16} />
});

interface ReceiptGeneratorProps {
    tenant: Tenant;
    property: Property;
    lease: Lease;
}

export default function RentReceiptGenerator({ tenant, property, lease }: ReceiptGeneratorProps) {
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [ownerInfo, setOwnerInfo] = useState<{ name: string; address: string; signatureUrl?: string; logoUrl?: string } | undefined>(undefined);

    useEffect(() => {
        const fetchProfile = async () => {
            const user = auth.currentUser;
            if (!user) return;

            const profileRef = doc(db, 'profiles', user.uid);
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
                const profile = profileSnap.data() as UserProfile;
                setOwnerInfo({
                    name: profile.ownerInfo.name,
                    address: `${profile.ownerInfo.address}\n${profile.ownerInfo.zipCode} ${profile.ownerInfo.city}`,
                    signatureUrl: profile.signatureUrl,
                    logoUrl: profile.logoUrl,
                });
            }
        };

        fetchProfile();
    }, []);

    const getPeriodDate = () => {
        const [year, month] = selectedMonth.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, 1);
    };

    const periodDate = getPeriodDate();

    if (!tenant || !property || !lease) return null;

    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex-shrink-0">
                    <Receipt size={18} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <h5 className="font-semibold text-slate-800 text-sm">Quittance de Loyer</h5>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <Calendar size={12} className="text-slate-400 flex-shrink-0" />
                        <input
                            type="month"
                            className="text-xs text-slate-500 border-none bg-transparent p-0 focus:outline-none focus:ring-0 w-full"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <PdfDownloader
                tenant={tenant}
                property={property}
                lease={lease}
                period={periodDate}
                ownerInfo={ownerInfo}
            />
        </div>
    );
}
