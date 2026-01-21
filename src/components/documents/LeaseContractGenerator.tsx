'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Tenant, Property, Lease, UserProfile } from '@/types';
import { ScrollText, Loader2, Download } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

import { convertImageToBase64 } from '@/lib/utils';

// ... imports remain the same

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
                    address: `${ownerProfile.ownerInfo.address}, ${ownerProfile.ownerInfo.zipCode} ${ownerProfile.ownerInfo.city}`,
                    email: ownerProfile.ownerInfo.email,
                    signatureUrl: signatureBase64,
                    logoUrl: logoBase64,
                });
            }
        };

        loadImages();
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
