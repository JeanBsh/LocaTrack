import { TrendingUp, Wallet, AlertCircle, Users } from 'lucide-react';
import { TiltCard } from '@/components/ui/TiltCard';

export default function Dashboard() {
  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
          Tableau de Bord
        </h1>
        <p className="text-slate-500">
          Vue d'ensemble de votre parc immobilier
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* KPI Card 1 */}
        <div className="h-full">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3 h-full relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-3 opacity-10 transform translate-x-2 -translate-y-2">
              <Users size={80} className="text-blue-600" />
            </div>

            <div className="flex justify-between items-start relative z-10">
              <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
                <Users size={20} />
              </div>
              <span className="text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                +2.5%
              </span>
            </div>
            <div className="relative z-10">
              <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                Taux d'Occupation
              </h3>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">
                85%
              </p>
            </div>
          </div>
        </div>

        {/* KPI Card 2 */}
        <div className="h-full">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3 h-full relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-3 opacity-10 transform translate-x-2 -translate-y-2">
              <Wallet size={80} className="text-green-600" />
            </div>

            <div className="flex justify-between items-start relative z-10">
              <div className="p-2.5 bg-green-50 rounded-lg text-green-600">
                <Wallet size={20} />
              </div>
              <span className="text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                98% collectés
              </span>
            </div>
            <div className="relative z-10">
              <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                Loyers Encaissés
              </h3>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">
                12 450 €
              </p>
            </div>
          </div>
        </div>

        {/* KPI Card 3 */}
        <div className="h-full">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3 h-full relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-3 opacity-10 transform translate-x-2 -translate-y-2">
              <AlertCircle size={80} className="text-red-600" />
            </div>

            <div className="flex justify-between items-start relative z-10">
              <div className="p-2.5 bg-red-50 rounded-lg text-red-600">
                <AlertCircle size={20} />
              </div>
              <span className="text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                2 dossiers
              </span>
            </div>
            <div className="relative z-10">
              <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                Impayés
              </h3>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">
                850 €
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
