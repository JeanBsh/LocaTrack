'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { LeaseContractPdf } from './LeaseContractPdf';
import { Tenant, Property, Lease } from '@/types';
import { Loader2, Download } from 'lucide-react';

interface LeaseContractDownloaderProps {
    tenant: Tenant;
    property: Property;
    lease: Lease;
    ownerInfo?: { name: string; address: string; email?: string; signatureUrl?: string; logoUrl?: string };
}

export const LeaseContractDownloader = ({ tenant, property, lease, ownerInfo }: LeaseContractDownloaderProps) => {
    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) return null;

    return (
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
    );
};

export default LeaseContractDownloader;
