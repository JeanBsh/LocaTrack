'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Tenant, Property, Lease, UserProfile } from '@/types';
import { FileCheck, Loader2, Download } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    { ssr: false, loading: () => <Loader2 className="animate-spin" size={16} /> }
);

const RentCertificatePdf = dynamic(
    () => import('./RentCertificatePdf').then((mod) => mod.RentCertificatePdf),
    { ssr: false }
);

interface CertificateGeneratorProps {
    tenant: Tenant;
    property: Property;
    lease: Lease;
}

export default function RentCertificateGenerator({ tenant, property, lease }: CertificateGeneratorProps) {
    const [ownerInfo, setOwnerInfo] = useState<{ name: string; signatureUrl?: string; logoUrl?: string } | undefined>(undefined);

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
                    signatureUrl: profile.signatureUrl,
                    logoUrl: profile.logoUrl,
                });
            }
        };

        fetchProfile();
    }, []);

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

            <PDFDownloadLink
                document={<RentCertificatePdf tenant={tenant} property={property} lease={lease} ownerName={ownerInfo?.name} signatureUrl={ownerInfo?.signatureUrl} logoUrl={ownerInfo?.logoUrl} />}
                fileName={`Attestation_${tenant.personalInfo.lastName}_${tenant.personalInfo.firstName}.pdf`}
                className="inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-medium rounded-lg transition-all shadow-sm hover:shadow-md flex-shrink-0"
            >
                {({ loading }) => (loading ?
                    <Loader2 className="animate-spin" size={16} /> :
                    <Download size={16} />
                )}
            </PDFDownloadLink>
        </div>
    );
}
