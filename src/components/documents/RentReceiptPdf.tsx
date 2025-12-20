import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tenant, Property, Lease } from '@/types';

// Create styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#1e293b', // slate-800
    },
    header: {
        marginBottom: 30,
        borderBottomWidth: 2,
        borderBottomColor: '#2563eb', // blue-600
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    headerLeft: {
        flexDirection: 'column',
    },
    headerRight: {
        textAlign: 'right',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#2563eb', // blue-600
        letterSpacing: 1,
    },
    docNumber: {
        fontSize: 10,
        color: '#64748b',
        marginTop: 4,
    },
    periodBox: {
        backgroundColor: '#f1f5f9', // slate-100
        padding: 15,
        borderRadius: 6,
        marginBottom: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    periodText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#334155',
    },
    addressSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        gap: 20,
    },
    addressBox: {
        width: '48%',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 4,
        padding: 12,
        height: 100,
    },
    addressBoxTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 4,
    },
    addressContent: {
        fontSize: 11,
        lineHeight: 1.4,
    },
    propertyInfo: {
        marginBottom: 30,
        padding: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#2563eb',
        backgroundColor: '#f8fafc',
    },
    tableTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#0f172a',
    },
    table: {
        width: '100%',
        marginBottom: 30,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#e2e8f0',
        padding: 8,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        padding: 8,
    },
    colDesc: { width: '70%' },
    colAmount: { width: '30%', textAlign: 'right', fontWeight: 'bold' },

    totalRow: {
        flexDirection: 'row',
        backgroundColor: '#eff6ff', // blue-50
        padding: 12,
        marginTop: 10,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    legalText: {
        fontSize: 9,
        marginBottom: 40,
        lineHeight: 1.5,
        color: '#475569',
        fontStyle: 'italic',
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 'auto',
    },
    signatureBox: {
        marginTop: 20,
    },
    signatureTitle: {
        marginBottom: 40,
        fontWeight: 'bold',
    },
    watermark: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: '#cbd5e1',
        fontSize: 8,
    },
});

interface RentReceiptPdfProps {
    tenant: Tenant;
    property: Property;
    lease: Lease;
    period: Date;
}

export const RentReceiptPdf = ({ tenant, property, lease, period }: RentReceiptPdfProps) => {
    const startOfMonth = new Date(period.getFullYear(), period.getMonth(), 1);
    const endOfMonth = new Date(period.getFullYear(), period.getMonth() + 1, 0);

    const formattedStart = format(startOfMonth, 'dd/MM/yyyy');
    const formattedEnd = format(endOfMonth, 'dd/MM/yyyy');
    const dateOfIssue = format(new Date(), 'dd/MM/yyyy');
    const periodMonthYear = format(period, 'MMMM yyyy', { locale: fr });
    const formattedPeriodMonthYear = periodMonthYear.charAt(0).toUpperCase() + periodMonthYear.slice(1);

    const rent = lease.financials.currentRent;
    const charges = lease.financials.currentCharges;
    const total = rent + charges;

    // TODO: Proprietor info should eventually come from global settings
    const ownerInfo = {
        name: "Monsieur le Propriétaire", // Placeholder, replace with dynamic data if available
        address: "Adresse du Propriétaire\n75000 PARIS",
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.title}>Quittance de Loyer</Text>
                        <Text style={styles.docNumber}>N° REF-{format(period, 'yyyyMM')}-{tenant.id.slice(0, 4)}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={{ fontSize: 10, color: '#64748b' }}>Date d'émission</Text>
                        <Text style={{ fontWeight: 'bold' }}>{dateOfIssue}</Text>
                    </View>
                </View>

                {/* Period Box */}
                <View style={styles.periodBox}>
                    <Text>Période du : </Text>
                    <Text style={styles.periodText}>{formattedStart}</Text>
                    <Text> au </Text>
                    <Text style={styles.periodText}>{formattedEnd}</Text>
                </View>

                {/* Addresses */}
                <View style={styles.addressSection}>
                    {/* Bailleur */}
                    <View style={styles.addressBox}>
                        <Text style={styles.addressBoxTitle}>Bailleur (Propriétaire)</Text>
                        <Text style={styles.addressContent}>{ownerInfo.name}</Text>
                        <Text style={styles.addressContent}>{ownerInfo.address}</Text>
                    </View>

                    {/* Locataire */}
                    <View style={styles.addressBox}>
                        <Text style={styles.addressBoxTitle}>Locataire(s)</Text>
                        <Text style={[styles.addressContent, { fontWeight: 'bold' }]}>
                            {tenant.personalInfo.lastName.toUpperCase()} {tenant.personalInfo.firstName}
                        </Text>
                        {tenant.roommates?.map((rm, i) => (
                            <Text key={i} style={styles.addressContent}>& {rm.lastName.toUpperCase()} {rm.firstName}</Text>
                        ))}
                    </View>
                </View>

                {/* Property Info */}
                <View style={styles.propertyInfo}>
                    <Text style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>Adresse de la location</Text>
                    <Text style={{ fontSize: 11, fontWeight: 'bold' }}>
                        {property.address.street}, {property.address.zipCode} {property.address.city}
                    </Text>
                    {/* Room for apartment number if needed in future schema */}
                </View>

                {/* Financial Table */}
                <Text style={styles.tableTitle}>Détail du règlement</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.colDesc, { fontWeight: 'bold', color: '#475569' }]}>Libellé</Text>
                        <Text style={[styles.colAmount, { color: '#475569' }]}>Montant</Text>
                    </View>

                    <View style={styles.tableRow}>
                        <Text style={styles.colDesc}>Loyer mensuel ({lease.type === 'MEUBLE' ? 'Meublé' : 'Nu'})</Text>
                        <Text style={styles.colAmount}>{rent.toFixed(2)} €</Text>
                    </View>

                    <View style={styles.tableRow}>
                        <Text style={styles.colDesc}>
                            {lease.type === 'MEUBLE' ? 'Forfait de charges' : 'Provision sur charges'}
                        </Text>
                        <Text style={styles.colAmount}>{charges.toFixed(2)} €</Text>
                    </View>

                    <View style={styles.totalRow}>
                        <Text style={[styles.colDesc, { fontWeight: 'bold', fontSize: 12 }]}>TOTAL PAYÉ</Text>
                        <Text style={[styles.colAmount, { fontWeight: 'bold', fontSize: 12, color: '#2563eb' }]}>{total.toFixed(2)} €</Text>
                    </View>
                </View>

                {/* Legal Block */}
                <Text style={styles.legalText}>
                    Je soussigné(e), propriétaire du logement désigné ci-dessus, déclare avoir reçu de la part du locataire
                    la somme de {total.toFixed(2)} euros au titre du loyer et des charges pour la période mentionnée.
                    {"\n"}
                    Cette quittance annule tous les reçus qui auraient pu être donnés pour acompte versé sur la présente échéance.
                    En cas de congé, le paiement du dernier mois de loyer ne peut être compensé par le dépôt de garantie.
                </Text>

                {/* Signatures */}
                <View style={styles.footerContainer}>
                    <View style={styles.signatureBox}>
                        <Text>Fait à {property.address.city}, le {dateOfIssue}</Text>
                        <Text style={[styles.signatureTitle, { marginTop: 10 }]}>Le Bailleur, avec signature</Text>
                        {/* Placeholder for Signature Image if available */}
                    </View>
                </View>

                <Text style={styles.watermark}>Document généré automatiquement via LocaTrack</Text>
            </Page>
        </Document>
    );
};
