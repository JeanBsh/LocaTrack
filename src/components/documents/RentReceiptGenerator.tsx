'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Tenant, Property, Lease, UserProfile } from '@/types';
import { Receipt, Loader2, Calendar, Download } from 'lucide-react';
import { format } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

import { convertImageToBase64 } from '@/lib/utils';

// Dynamic import of the downloader component to isolate react-pdf
const RentReceiptDownloader = dynamic(() => import('./RentReceiptDownloader').then(mod => mod.RentReceiptDownloader), {
    ssr: false,
    loading: () => <Loader2 className="animate-spin" size={16} />
});

interface ReceiptGeneratorProps {
    tenant: Tenant;
    property: Property;
    lease: Lease;
    ownerProfile: UserProfile | null;
}

export default function RentReceiptGenerator({ tenant, property, lease, ownerProfile }: ReceiptGeneratorProps) {
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [ownerInfo, setOwnerInfo] = useState<{ name: string; address: string; signatureUrl?: string; logoUrl?: string } | undefined>(undefined);

    useEffect(() => {
        const loadImages = async () => {
            if (ownerProfile) {
                let logoBase64 = ownerProfile.logoUrl;
                let signatureBase64 = ownerProfile.signatureUrl;

                if (ownerProfile.logoUrl?.startsWith('http')) {
                    const base64 = await convertImageToBase64(ownerProfile.logoUrl);
                    if (base64) logoBase64 = base64;
                }
                if (ownerProfile.signatureUrl?.startsWith('http')) {
                    const base64 = await convertImageToBase64(ownerProfile.signatureUrl);
                    if (base64) signatureBase64 = base64;
                }

                setOwnerInfo({
                    name: ownerProfile.ownerInfo.name,
                    address: `${ownerProfile.ownerInfo.address}\n${ownerProfile.ownerInfo.zipCode} ${ownerProfile.ownerInfo.city}`,
                    signatureUrl: signatureBase64,
                    logoUrl: logoBase64,
                });
            }
        };

        loadImages();
    }, [ownerProfile]);

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

            <RentReceiptDownloader
                tenant={tenant}
                property={property}
                lease={lease}
                period={periodDate}
                ownerInfo={ownerInfo}
            />
        </div>
    );
}
