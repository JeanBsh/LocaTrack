'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { RentCertificatePdf } from './RentCertificatePdf';
import { Tenant, Property, Lease } from '@/types';
import { FileCheck, Loader2, Download } from 'lucide-react';

interface CertificateGeneratorProps {
    tenant: Tenant;
    property: Property;
    lease: Lease;
}

export default function RentCertificateGenerator({ tenant, property, lease }: CertificateGeneratorProps) {
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
                document={<RentCertificatePdf tenant={tenant} property={property} lease={lease} />}
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
