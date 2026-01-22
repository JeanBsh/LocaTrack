'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Tenant, Property, Lease, UserProfile } from '@/types';
import { FileCheck, Loader2 } from 'lucide-react';

// Dynamic import of the downloader component to isolate react-pdf
const RentCertificateDownloader = dynamic(() => import('./RentCertificateDownloader').then(mod => mod.RentCertificateDownloader), {
    ssr: false,
    loading: () => <Loader2 className="animate-spin" size={16} />
});

interface CertificateGeneratorProps {
    tenant: Tenant;
    property: Property;
    lease: Lease;
    ownerProfile: UserProfile | null;
}

export default function RentCertificateGenerator({ tenant, property, lease, ownerProfile }: CertificateGeneratorProps) {
    const [ownerInfo, setOwnerInfo] = useState<{ name: string; signatureUrl?: string; logoUrl?: string } | undefined>(undefined);

    useEffect(() => {
        if (ownerProfile) {
            // Use base64 directly from profile (stored during upload)
            setOwnerInfo({
                name: ownerProfile.ownerInfo.name,
                signatureUrl: ownerProfile.signatureBase64 || ownerProfile.signatureUrl,
                logoUrl: ownerProfile.logoBase64 || ownerProfile.logoUrl,
            });
        }
    }, [ownerProfile]);

    if (!tenant || !property || !lease) return null;

    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex-shrink-0">
                    <FileCheck size={18} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <h5 className="font-semibold text-slate-800 text-sm">Attestation de Loyer</h5>
                    <p className="text-xs text-slate-500 truncate">Justificatif de domicile</p>
                </div>
            </div>

            {ownerProfile && !ownerInfo ? (
                <div className="flex items-center justify-center px-4">
                    <Loader2 className="animate-spin text-purple-500" size={20} />
                </div>
            ) : (
                <RentCertificateDownloader
                    tenant={tenant}
                    property={property}
                    lease={lease}
                    ownerName={ownerInfo?.name}
                    signatureUrl={ownerInfo?.signatureUrl}
                    logoUrl={ownerInfo?.logoUrl}
                />
            )}
        </div>
    );
}
