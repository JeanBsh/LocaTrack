'use client';

import { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { RentReceiptPdf } from './RentReceiptPdf';
import { Tenant, Property, Lease } from '@/types';
import { Receipt, Loader2, Calendar, Download } from 'lucide-react';
import { format } from 'date-fns';

interface ReceiptGeneratorProps {
    tenant: Tenant;
    property: Property;
    lease: Lease;
}

export default function RentReceiptGenerator({ tenant, property, lease }: ReceiptGeneratorProps) {
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

    const getPeriodDate = () => {
        const [year, month] = selectedMonth.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, 1);
    };

    const periodDate = getPeriodDate();

    if (!tenant || !property || !lease) return null;

    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex-shrink-0">
                    <Receipt size={18} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <h5 className="font-semibold text-slate-800 text-sm">Quittance de Loyer</h5>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <Calendar size={12} className="text-slate-400 flex-shrink-0" />
                        <input
                            type="month"
                            className="text-xs text-slate-500 border-none bg-transparent p-0 focus:outline-none focus:ring-0 w-full"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <PDFDownloadLink
                document={<RentReceiptPdf tenant={tenant} property={property} lease={lease} period={periodDate} />}
                fileName={`Quittance_${tenant.personalInfo.lastName}_${format(periodDate, 'MM-yyyy')}.pdf`}
                className="inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-medium rounded-lg transition-all shadow-sm hover:shadow-md flex-shrink-0"
            >
                {({ loading }) => (loading ?
                    <Loader2 className="animate-spin" size={16} /> :
                    <Download size={16} />
                )}
            </PDFDownloadLink>
        </div>
    );
}
