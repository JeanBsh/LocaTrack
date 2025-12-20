'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { LeaseContractPdf } from './LeaseContractPdf';
import { Tenant, Property, Lease } from '@/types';
import { ScrollText, Loader2, Download } from 'lucide-react';

interface LeaseGeneratorProps {
    tenant: Tenant;
    property: Property;
    lease: Lease;
}

export default function LeaseContractGenerator({ tenant, property, lease }: LeaseGeneratorProps) {
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
                document={<LeaseContractPdf tenant={tenant} property={property} lease={lease} />}
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
