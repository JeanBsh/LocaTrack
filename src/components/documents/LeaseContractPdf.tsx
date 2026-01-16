import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tenant, Property, Lease } from '@/types';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        lineHeight: 1.5,
        color: '#333'
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        textTransform: 'uppercase',
        color: '#1e40af',
        textDecoration: 'underline'
    },
    subtitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 5,
        color: '#334155',
        backgroundColor: '#f1f5f9',
        padding: 4
    },
    text: {
        marginBottom: 8,
        textAlign: 'justify'
    },
    bold: {
        fontWeight: 'bold',
        fontFamily: 'Helvetica-Bold'
    },
    row: {
        flexDirection: 'row',
        marginBottom: 4
    },
    label: {
        width: '30%',
        fontWeight: 'bold',
        fontFamily: 'Helvetica-Bold'
    },
    value: {
        width: '70%'
    },
    signatureSection: {
        marginTop: 30,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    signatureBox: {
        borderTop: 1,
        borderColor: '#cbd5e1',
        paddingTop: 10,
        width: '45%'
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#94a3b8'
    }
});

interface OwnerInfo {
    name: string;
    address: string;
    email?: string;
    signatureUrl?: string;
    logoUrl?: string;
}

interface LeaseContractPdfProps {
    tenant: Tenant;
    property: Property;
    lease: Lease;
    ownerInfo?: OwnerInfo;
}

export const LeaseContractPdf = ({ tenant, property, lease, ownerInfo: ownerInfoProp }: LeaseContractPdfProps) => {
    // Helper for date formatting
    const formatDate = (date: any) => {
        if (!date) return 'N/A';
        try {
            if (date && typeof date.toDate === 'function') {
                return format(date.toDate(), 'dd/MM/yyyy');
            }
            return format(new Date(date), 'dd/MM/yyyy');
        } catch (e) {
            return 'Date invalide';
        }
    };

    // Use owner info from profile or fallback to placeholder
    const ownerInfo = ownerInfoProp || {
        name: "Monsieur le Propriétaire",
        address: "123 Avenue de l'Immobilier, 75000 Paris",
        email: "proprietaire@example.com"
    };

    // Calculate totals
    const totalRent = (lease.financials.currentRent + lease.financials.currentCharges).toFixed(2);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Logo */}
                {ownerInfo.logoUrl && (
                    <View style={{ alignItems: 'center', marginBottom: 15 }}>
                        <Image src={ownerInfo.logoUrl} style={{ width: 80, height: 80, objectFit: 'contain' }} />
                    </View>
                )}
                <Text style={styles.title}>CONTRAT DE LOCATION</Text>
                <Text style={{ textAlign: 'center', fontSize: 10, marginBottom: 20, color: '#64748b' }}>
                    Soumis au titre Ier de la loi n° 89-462 du 6 juillet 1989
                </Text>

                {/* I. DESIGNATION DES PARTIES */}
                <Text style={styles.subtitle}>I. DÉSIGNATION DES PARTIES</Text>

                <Text style={[styles.text, styles.bold, { marginTop: 5 }]}>Le BAILLEUR</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Nom / Prénom :</Text>
                    <Text style={styles.value}>{ownerInfo.name}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Adresse :</Text>
                    <Text style={styles.value}>{ownerInfo.address}</Text>
                </View>

                <Text style={[styles.text, styles.bold, { marginTop: 10 }]}>Le LOCATAIRE</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Nom / Prénom :</Text>
                    <Text style={styles.value}>{tenant.personalInfo.firstName} {tenant.personalInfo.lastName}</Text>
                </View>
                {tenant.roommates && tenant.roommates.length > 0 && tenant.roommates.map((rm, i) => (
                    <View style={styles.row} key={i}>
                        <Text style={styles.label}>Co-locataire :</Text>
                        <Text style={styles.value}>{rm.firstName} {rm.lastName}</Text>
                    </View>
                ))}
                <View style={styles.row}>
                    <Text style={styles.label}>Email :</Text>
                    <Text style={styles.value}>{tenant.personalInfo.email}</Text>
                </View>

                {/* II. OBJET DU CONTRAT */}
                <Text style={styles.subtitle}>II. OBJET DU CONTRAT</Text>
                <Text style={styles.text}>
                    Le Bailleur donne en location au Locataire les locaux désignés ci-après :
                </Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Type de bien :</Text>
                    <Text style={styles.value}>{property.type}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Adresse :</Text>
                    <Text style={styles.value}>{property.address.street}, {property.address.zipCode} {property.address.city}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Surface habitable :</Text>
                    <Text style={styles.value}>{property.features.surface} m²</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Nombre de pièces :</Text>
                    <Text style={styles.value}>{property.features.rooms}</Text>
                </View>

                {/* III. DATE DE PRISE D'EFFET ET DURÉE */}
                <Text style={styles.subtitle}>III. DATE DE PRISE D'EFFET ET DURÉE</Text>
                <Text style={styles.text}>
                    Le présent contrat est conclu pour une durée de <Text style={styles.bold}>{lease.dates.duration} ans</Text> (si vide) ou 1 an (si meublé).
                </Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Date de prise d'effet :</Text>
                    <Text style={styles.value}>{formatDate(lease.dates.start)}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Date de fin :</Text>
                    <Text style={styles.value}>{formatDate(lease.dates.end)}</Text>
                </View>

                {/* IV. CONDITIONS FINANCIÈRES */}
                <Text style={styles.subtitle}>IV. CONDITIONS FINANCIÈRES</Text>
                <Text style={styles.text}>
                    Le loyer mensuel est fixé comme suit :
                </Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Loyer hors charges :</Text>
                    <Text style={styles.value}>{lease.financials.currentRent.toFixed(2)} €</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Provision sur charges :</Text>
                    <Text style={styles.value}>{lease.financials.currentCharges.toFixed(2)} €</Text>
                </View>
                <View style={[styles.row, { marginTop: 5 }]}>
                    <Text style={styles.label}>TOTAL MENSUEL :</Text>
                    <Text style={[styles.value, styles.bold]}>{totalRent} €</Text>
                </View>
                <Text style={[styles.text, { marginTop: 10 }]}>
                    Le paiement devra être effectué par virement bancaire ou prélèvement le 1er de chaque mois.
                </Text>

                <View style={[styles.row, { marginTop: 10 }]}>
                    <Text style={styles.label}>Dépôt de garantie :</Text>
                    <Text style={styles.value}>{lease.financials.deposit.toFixed(2)} €</Text>
                </View>

                {/* V. SIGNATURES */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBox}>
                        <Text style={styles.bold}>Le BAILLEUR</Text>
                        <Text style={{ fontSize: 8, fontStyle: 'italic', marginBottom: 10 }}>(Signature précédée de la mention "Lu et approuvé")</Text>
                        {ownerInfo.signatureUrl ? (
                            <Image src={ownerInfo.signatureUrl} style={{ width: 100, height: 50, objectFit: 'contain', marginBottom: 5 }} />
                        ) : (
                            <View style={{ height: 30 }} />
                        )}
                        <Text>{ownerInfo.name}</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text style={styles.bold}>Le LOCATAIRE</Text>
                        <Text style={{ fontSize: 8, fontStyle: 'italic', marginBottom: 10 }}>(Signature précédée de la mention "Lu et approuvé")</Text>
                        <View style={{ height: 30 }} />
                        <Text>{tenant.personalInfo.firstName} {tenant.personalInfo.lastName}</Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text>Agence LocaTrack - Document généré le {format(new Date(), 'dd/MM/yyyy')}</Text>
                </View>
            </Page>
        </Document>
    );
};
