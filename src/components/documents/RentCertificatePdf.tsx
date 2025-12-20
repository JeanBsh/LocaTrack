import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tenant, Property, Lease } from '@/types';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#1e293b',
    },
    header: {
        marginBottom: 40,
        borderBottomWidth: 2,
        borderBottomColor: '#2563eb',
        paddingBottom: 15,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#2563eb',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 10,
        color: '#64748b',
        marginTop: 5,
    },
    content: {
        fontSize: 12,
        lineHeight: 1.8,
        textAlign: 'justify',
        marginBottom: 30,
    },
    bold: {
        fontWeight: 'bold',
        color: '#0f172a',
    },
    box: {
        borderWidth: 1,
        borderColor: '#cbd5e1',
        backgroundColor: '#f8fafc',
        padding: 20,
        borderRadius: 4,
        marginBottom: 30,
    },
    boxRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    boxLabel: {
        width: '30%',
        color: '#64748b',
        fontWeight: 'bold',
    },
    boxValue: {
        width: '70%',
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 'auto',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    signatureSection: {
        marginTop: 40,
        alignItems: 'flex-end',
        paddingRight: 20,
    },
});

interface RentCertificatePdfProps {
    tenant: Tenant;
    property: Property;
    lease: Lease;
}

export const RentCertificatePdf = ({ tenant, property, lease }: RentCertificatePdfProps) => {
    const today = new Date();
    const dateOfIssue = format(today, 'dd/MM/yyyy');

    // Check if tenant is up to date (Placeholder logic - in a real app this would check payment status)
    // For an "Attestation", we generally assume they are up to date if we are generating it.

    // TODO: Owner info from settings
    const ownerName = "Monsieur le Propriétaire";

    // Safe date conversion helper
    const formatDate = (date: any) => {
        if (!date) return 'N/A';
        try {
            // Check if it's a Firestore Timestamp (has toDate method)
            if (date && typeof date.toDate === 'function') {
                return format(date.toDate(), 'dd/MM/yyyy');
            }
            // If it's a string or already a Date
            return format(new Date(date), 'dd/MM/yyyy');
        } catch (e) {
            console.error("Date formatting error:", e);
            return 'Date invalide';
        }
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>Attestation de Loyer</Text>
                    <Text style={styles.subtitle}>Document valant justificatif de domicile</Text>
                </View>

                <View style={styles.content}>
                    <Text>
                        Je soussigné, <Text style={styles.bold}>{ownerName}</Text>, propriétaire du logement désigné ci-dessous,
                        atteste par la présente que :
                    </Text>
                </View>

                <View style={styles.box}>
                    <View style={styles.boxRow}>
                        <Text style={styles.boxLabel}>M/Mme :</Text>
                        <Text style={styles.boxValue}>
                            {tenant.personalInfo.firstName} {tenant.personalInfo.lastName.toUpperCase()}
                        </Text>
                    </View>
                    {tenant.roommates?.map((rm, i) => (
                        <View style={styles.boxRow} key={i}>
                            <Text style={styles.boxLabel}>Et :</Text>
                            <Text style={styles.boxValue}>{rm.firstName} {rm.lastName.toUpperCase()}</Text>
                        </View>
                    ))}
                    <View style={styles.boxRow}>
                        <Text style={styles.boxLabel}>Adresse :</Text>
                        <Text style={styles.boxValue}>
                            {property.address.street}, {property.address.zipCode} {property.address.city}
                        </Text>
                    </View>
                </View>

                <View style={styles.content}>
                    <Text>
                        Est locataire à l'adresse susmentionnée depuis le <Text style={styles.bold}>{formatDate(lease.dates?.start)}</Text>.
                    </Text>
                    <Text>{"\n"}</Text>
                    <Text>
                        Il est à ce jour à jour du règlement de ses loyers et charges.
                        Le montant actuel du loyer mensuel (charges comprises) s'élève à <Text style={styles.bold}>{(lease.financials.currentRent + lease.financials.currentCharges).toFixed(2)} euros</Text>.
                    </Text>

                    <Text>{"\n"}</Text>
                    <Text>
                        Cette attestation est délivrée à la demande de l'intéressé(e) pour servir et valoir ce que de droit.
                    </Text>
                </View>

                <View style={styles.signatureSection}>
                    <Text style={{ marginBottom: 10 }}>Fait à {property.address.city}, le {dateOfIssue}</Text>
                    <Text style={{ fontWeight: 'bold', marginBottom: 50 }}>Le Bailleur</Text>
                    {/* Placeholder for Signature */}
                    <Text style={{ color: '#cbd5e1', fontSize: 10 }}>[Signature]</Text>
                </View>

                <View style={styles.footer}>
                    <Text style={{ color: '#94a3b8', fontSize: 8 }}>
                        Document généré via LocaTrack - Gestion Immobilière Simplifiée
                    </Text>
                    <Text style={{ color: '#94a3b8', fontSize: 8 }}>Page 1/1</Text>
                </View>
            </Page>
        </Document>
    );
};
