'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Tenant, Property, Lease, UserProfile } from '@/types';
import { Receipt, Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

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
        if (ownerProfile) {
            // Use base64 directly from profile (stored during upload)
            // This works reliably in both local and production environments
            setOwnerInfo({
                name: ownerProfile.ownerInfo.name,
                address: `${ownerProfile.ownerInfo.address}\n${ownerProfile.ownerInfo.zipCode} ${ownerProfile.ownerInfo.city}`,
                signatureUrl: ownerProfile.signatureBase64 || ownerProfile.signatureUrl,
                logoUrl: ownerProfile.logoBase64 || ownerProfile.logoUrl,
            });
        }
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
                <div className="p-2 bg-slate-900 rounded-lg flex-shrink-0">
                    <Receipt size={16} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <h5 className="font-semibold text-text-primary text-sm">Quittance de Loyer</h5>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <Calendar size={11} className="text-text-tertiary flex-shrink-0" />
                        <input
                            type="month"
                            className="text-xs text-text-tertiary border-none bg-transparent p-0 focus:outline-none focus:ring-0 w-full cursor-pointer"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {ownerProfile && !ownerInfo ? (
                <div className="flex items-center justify-center px-4">
                    <Loader2 className="animate-spin text-slate-600" size={20} />
                </div>
            ) : (
                <RentReceiptDownloader
                    tenant={tenant}
                    property={property}
                    lease={lease}
                    period={periodDate}
                    ownerInfo={ownerInfo}
                />
            )}
        </div>
    );
}
