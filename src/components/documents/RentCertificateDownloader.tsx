'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { RentCertificatePdf } from './RentCertificatePdf';
import { Tenant, Property, Lease } from '@/types';
import { Loader2, Download } from 'lucide-react';

interface RentCertificateDownloaderProps {
    tenant: Tenant;
    property: Property;
    lease: Lease;
    ownerName?: string;
    signatureUrl?: string;
    logoUrl?: string;
}

export const RentCertificateDownloader = ({ tenant, property, lease, ownerName, signatureUrl, logoUrl }: RentCertificateDownloaderProps) => {
    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) return null;

    return (
        <PDFDownloadLink
            document={<RentCertificatePdf tenant={tenant} property={property} lease={lease} ownerName={ownerName} signatureUrl={signatureUrl} logoUrl={logoUrl} />}
            fileName={`Attestation_${tenant.personalInfo.lastName}_${tenant.personalInfo.firstName}.pdf`}
            className="inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-medium rounded-lg transition-all shadow-sm hover:shadow-md flex-shrink-0"
        >
            {({ loading }) => (loading ?
                <Loader2 className="animate-spin" size={16} /> :
                <Download size={16} />
            )}
        </PDFDownloadLink>
    );
};

export default RentCertificateDownloader;
