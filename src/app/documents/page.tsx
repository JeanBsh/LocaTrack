'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Tenant, Lease, Property } from '@/types';
import RentReceiptGenerator from '@/components/documents/RentReceiptGenerator';
import RentCertificateGenerator from '@/components/documents/RentCertificateGenerator';
import LeaseContractGenerator from '@/components/documents/LeaseContractGenerator';
import { Search, FileText, User, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function DocumentsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [leases, setLeases] = useState<Lease[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        let unsubscribeTenants: (() => void) | undefined;
        let unsubscribeLeases: (() => void) | undefined;
        let unsubscribeProperties: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user) {
                // If not authenticated, we could redirect or just stop. 
                // Since this page is likely wrapped in a layout that doesn't force auth globally yet, 
                // we'll just stop loading. The Dashboard redirect handles the main entry point.
                setLoading(false);
                return;
            }

            // Suppression du orderBy pour éviter les erreurs d'index sur champs imbriqués
            unsubscribeTenants = onSnapshot(collection(db, 'locataires'), (snapshot) => {
                const tenantsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tenant));
                // Tri côté client
                tenantsData.sort((a, b) => a.personalInfo.lastName.localeCompare(b.personalInfo.lastName));
                setTenants(tenantsData);
            });

            unsubscribeLeases = onSnapshot(collection(db, 'leases'), (snapshot) => {
                setLeases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lease)));
            });

            unsubscribeProperties = onSnapshot(collection(db, 'biens'), (snapshot) => {
                setProperties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property)));
            });
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeTenants) unsubscribeTenants();
            if (unsubscribeLeases) unsubscribeLeases();
            if (unsubscribeProperties) unsubscribeProperties();
        };
    }, []);

    useEffect(() => {
        if (tenants.length > 0 || leases.length > 0 || properties.length > 0) {
            setLoading(false);
        }
        // Fallback loading state if collections are empty but connected
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(timer);
    }, [tenants, leases, properties]);

    const getTenantDetails = (tenant: Tenant) => {
        // On prend le bail associé au locataire (sans vérifier le status 'ACTIF' qui n'existe pas sur l'objet Lease)
        const activeLease = leases.find(l => l.tenantId === tenant.id);
        const property = activeLease ? properties.find(p => p.id === activeLease.propertyId) : null;
        return { activeLease, property };
    };

    const filteredTenants = tenants.filter(tenant =>
        tenant.personalInfo.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.personalInfo.firstName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Documents</h1>
                    <p className="text-slate-500">Générez et gérez les documents administratifs pour vos locataires.</p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Rechercher un locataire..."
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Tenants Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTenants.map(tenant => {
                    const { activeLease, property } = getTenantDetails(tenant);

                    return (
                        <div key={tenant.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col">

                            {/* Card Header with subtle gradient */}
                            <div className="bg-gradient-to-r from-slate-50 to-white p-5 border-b border-slate-100">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-200">
                                            {tenant.personalInfo.firstName[0]}{tenant.personalInfo.lastName[0]}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900 leading-tight">
                                                {tenant.personalInfo.firstName} {tenant.personalInfo.lastName}
                                            </h2>
                                            <span className="inline-flex items-center text-xs font-medium text-slate-500 mt-0.5">
                                                <User size={12} className="mr-1" /> Locataire
                                            </span>
                                        </div>
                                    </div>
                                    {activeLease ? (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100 flex items-center shadow-sm">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                                            Actif
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                            Inactif
                                        </span>
                                    )}
                                </div>

                                {property && (
                                    <div className="mt-4 p-3 bg-white/50 rounded-lg border border-slate-100 backdrop-blur-sm">
                                        <div className="flex items-center text-sm text-slate-700 font-medium mb-1">
                                            <MapPin size={14} className="text-blue-500 mr-1.5" />
                                            {property.address.street}
                                        </div>
                                        <div className="text-xs text-slate-500 pl-5">
                                            {property.address.zipCode} {property.address.city} • {property.type}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Card Actions */}
                            <div className="p-5 flex-grow flex flex-col justify-end bg-white">
                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                                    <FileText size={12} className="mr-1.5" /> Documents disponibles
                                </h3>

                                {activeLease && property ? (
                                    <div className="space-y-3">
                                        <RentReceiptGenerator
                                            tenant={tenant}
                                            property={property}
                                            lease={activeLease}
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <RentCertificateGenerator
                                                tenant={tenant}
                                                property={property}
                                                lease={activeLease}
                                            />
                                            <LeaseContractGenerator
                                                tenant={tenant}
                                                property={property}
                                                lease={activeLease}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
                                        <p className="text-sm text-slate-500 font-medium">Aucun bail actif associé</p>
                                        <p className="text-xs text-slate-400 mt-1">Créez un bail pour générer des documents</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {filteredTenants.length === 0 && (
                    <div className="col-span-full py-16 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                            <Search className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Aucun locataire trouvé</h3>
                        <p className="mt-1 text-slate-500">Essayez de modifier votre recherche ou ajoutez un nouveau locataire.</p>
                        <Link href="/locataires/nouveau" className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Ajouter un locataire
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
