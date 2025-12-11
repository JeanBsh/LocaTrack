export type PropertyType = 'Appartement' | 'Maison' | 'Bureau' | 'Local Commercial';
export type PropertyStatus = 'DISPONIBLE' | 'OCCUPE' | 'TRAVAUX';

export interface Address {
    street: string;
    zipCode: string;
    city: string;
    country: string;
}

export interface PropertyFeatures {
    surface: number;
    rooms: number;
    constructionYear: number;
}

export interface PropertyFinancials {
    baseRent: number;
    charges: number;
    deposit: number;
}

export interface PropertyDocument {
    url: string;
    name: string;
    type: string;
}

export interface Property {
    id: string;
    type: PropertyType;
    address: Address;
    features: PropertyFeatures;
    status: PropertyStatus;
    financials: PropertyFinancials;
    documents: PropertyDocument[];
    createdAt: Date;
    updatedAt: Date;
}

export interface TenantPersonalInfo {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}

export interface TenantAdminInfo {
    birthDate: Date;
    idNumber: string;
}

export interface Guarantor {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}

export type TenantStatus = 'ACTIF' | 'ARCHIVE';

export interface Tenant {
    id: string;
    personalInfo: TenantPersonalInfo;
    adminInfo: TenantAdminInfo;
    guarantors: Guarantor[];
    status: TenantStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface LeaseDates {
    start: Date;
    end: Date;
    duration: number; // months
}

export interface LeaseFinancials {
    currentRent: number;
    currentCharges: number;
    deposit: number;
}

export interface LeaseIndexation {
    lastIndexDate?: Date;
    baseIndex?: number;
}

export interface Lease {
    id: string;
    propertyId: string;
    tenantId: string;
    dates: LeaseDates;
    financials: LeaseFinancials;
    indexation: LeaseIndexation;
    createdAt: Date;
    updatedAt: Date;
}

export type PaymentMethod = 'VIREMENT' | 'CHEQUE' | 'ESPECES';
export type PaymentStatus = 'PAYE' | 'RETARD' | 'IMPAYE' | 'PARTIEL';

export interface PaymentPeriod {
    month: number;
    year: number;
}

export interface Payment {
    id: string;
    leaseId: string;
    tenantId: string;
    date: Date;
    amount: number;
    method: PaymentMethod;
    period: PaymentPeriod;
    status: PaymentStatus;
    createdAt: Date;
}
