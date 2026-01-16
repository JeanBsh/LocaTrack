'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Tenant, Property, Lease, UserProfile } from '@/types';
import { ScrollText, Loader2, Download } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    { ssr: false, loading: () => <Loader2 className="animate-spin" size={16} /> }
);

const LeaseContractPdf = dynamic(
    () => import('./LeaseContractPdf').then((mod) => mod.LeaseContractPdf),
    { ssr: false }
);

interface LeaseGeneratorProps {
    tenant: Tenant;
    property: Property;
    lease: Lease;
}

export default function LeaseContractGenerator({ tenant, property, lease }: LeaseGeneratorProps) {
    const [ownerInfo, setOwnerInfo] = useState<{ name: string; address: string; email?: string; signatureUrl?: string; logoUrl?: string } | undefined>(undefined);

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
                    address: `${profile.ownerInfo.address}, ${profile.ownerInfo.zipCode} ${profile.ownerInfo.city}`,
                    email: profile.ownerInfo.email,
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
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex-shrink-0">
                    <ScrollText size={18} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <h5 className="font-semibold text-slate-800 text-sm">Contrat de Location</h5>
                    <p className="text-xs text-slate-500 truncate">Bail d'habitation</p>
                </div>
            </div>

            <PDFDownloadLink
                document={<LeaseContractPdf tenant={tenant} property={property} lease={lease} ownerInfo={ownerInfo} />}
                fileName={`Bail_${tenant.personalInfo.lastName}_${tenant.personalInfo.firstName}.pdf`}
                className="inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-medium rounded-lg transition-all shadow-sm hover:shadow-md flex-shrink-0"
            >
                {({ loading }) => (loading ?
                    <Loader2 className="animate-spin" size={16} /> :
                    <Download size={16} />
                )}
            </PDFDownloadLink>
        </div>
    );
}
