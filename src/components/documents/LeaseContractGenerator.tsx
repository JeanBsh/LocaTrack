'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Tenant, Property, Lease, UserProfile } from '@/types';
import { ScrollText, Loader2 } from 'lucide-react';

// Dynamic import of the downloader component to isolate react-pdf
const LeaseContractDownloader = dynamic(() => import('./LeaseContractDownloader').then(mod => mod.LeaseContractDownloader), {
    ssr: false,
    loading: () => <Loader2 className="animate-spin" size={16} />
});

interface LeaseGeneratorProps {
    tenant: Tenant;
    property: Property;
    lease: Lease;
    ownerProfile: UserProfile | null;
}

export default function LeaseContractGenerator({ tenant, property, lease, ownerProfile }: LeaseGeneratorProps) {
    const [ownerInfo, setOwnerInfo] = useState<{ name: string; address: string; email?: string; signatureUrl?: string; logoUrl?: string } | undefined>(undefined);

    useEffect(() => {
        if (ownerProfile) {
            // Use base64 directly from profile (stored during upload)
            setOwnerInfo({
                name: ownerProfile.ownerInfo.name,
                address: `${ownerProfile.ownerInfo.address}, ${ownerProfile.ownerInfo.zipCode} ${ownerProfile.ownerInfo.city}`,
                email: ownerProfile.ownerInfo.email,
                signatureUrl: ownerProfile.signatureBase64 || ownerProfile.signatureUrl,
                logoUrl: ownerProfile.logoBase64 || ownerProfile.logoUrl,
            });
        }
    }, [ownerProfile]);

    if (!tenant || !property || !lease) return null;

    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex-shrink-0">
                    <ScrollText size={18} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <h5 className="font-semibold text-slate-800 text-sm">Contrat de Location</h5>
                    <p className="text-xs text-slate-500 truncate">Bail d'habitation</p>
                </div>
            </div>

            {ownerProfile && !ownerInfo ? (
                <div className="flex items-center justify-center px-4">
                    <Loader2 className="animate-spin text-emerald-500" size={20} />
                </div>
            ) : (
                <LeaseContractDownloader
                    tenant={tenant}
                    property={property}
                    lease={lease}
                    ownerInfo={ownerInfo}
                />
            )}
        </div>
    );
}
