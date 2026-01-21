'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { RentReceiptPdf } from './RentReceiptPdf';
import { Tenant, Property, Lease } from '@/types';
import { format } from 'date-fns';
import { Loader2, Download } from 'lucide-react';

interface RentReceiptDownloaderProps {
    tenant: Tenant;
    property: Property;
    lease: Lease;
    period: Date;
    ownerInfo?: { name: string; address: string; signatureUrl?: string; logoUrl?: string };
}

export const RentReceiptDownloader = ({ tenant, property, lease, period, ownerInfo }: RentReceiptDownloaderProps) => {
    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) return null;

    return (
        <PDFDownloadLink
            document={<RentReceiptPdf tenant={tenant} property={property} lease={lease} period={period} ownerInfo={ownerInfo} />}
            fileName={`Quittance_${format(period, 'yyyy-MM')}_${tenant.personalInfo.lastName}.pdf`}
            className="inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-medium rounded-lg transition-all shadow-sm hover:shadow-md flex-shrink-0"
        >
            {({ loading }) => (loading ?
                <Loader2 className="animate-spin" size={16} /> :
                <Download size={16} />
            )}
        </PDFDownloadLink>
    );
};

export default RentReceiptDownloader;
