import React, { useEffect, useState } from 'react';
import { admissionApi } from '../services/admissionApi';
import { useStore } from '../store/useStore';
import { 
  UserCheck, UserX, Phone, Calendar, Search, Loader2, 
  CheckCircle, XCircle, Clock, GraduationCap, School, MapPin 
} from 'lucide-react';
import { format } from 'date-fns';

export interface AdmissionRequest {
  id: string;
  nom: string;
  prenom: string;
  sexe: string;
  date_naissance?: string;
  classe: string;
  telephone_parent: string;
  ecole_provenance?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export const Admissions: React.FC = () => {
  const [requests, setRequests] = useState<AdmissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await admissionApi.listRequests();
      if (data && Array.isArray(data.requests)) {
        setRequests(data.requests);
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des demandes d'admission:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleResolve = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoadingId(id);
    setMessage(null);
    try {
      await admissionApi.resolveRequest(id, status);
      
      // Update local state status
      setRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
      
      setMessage({
        type: 'success',
        text: status === 'approved' 
          ? "Demande approuvée avec succès ! L'élève a été inscrit." 
          : "Demande d'admission rejetée."
      });

      // Refetch from store so that dashboard counts and student lists get updated
      useStore.getState().fetchAllFromBackend(true);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.error || "Une erreur est survenue lors de la résolution de la demande."
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesTab = r.status === activeTab;
    const matchesSearch = 
      r.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.classe.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.telephone_parent.includes(searchTerm);
    return matchesTab && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
        return (
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold rounded-full uppercase flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Acceptée
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold rounded-full uppercase flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Refusée
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold rounded-full uppercase flex items-center gap-1">
            <Clock className="w-3 h-3" />
            En attente
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
        <p className="text-slate-500 font-medium text-sm">Chargement des demandes d'admission...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight dark:text-white">Gestion des Admissions</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1 dark:text-slate-400">
            Validez ou rejetez les demandes d'inscription reçues via le formulaire public.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Nom, prénom, classe ou mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all dark:text-white"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {(['pending', 'approved', 'rejected'] as const).map((tab) => {
          const count = requests.filter(r => r.status === tab).length;
          const label = tab === 'pending' ? 'En attente' : tab === 'approved' ? 'Acceptées' : 'Refusées';
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setMessage(null);
              }}
              className={`px-4 py-3 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 -mb-[2px]
                ${active 
                  ? 'border-amber-500 text-amber-500 dark:text-amber-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
            >
              <span>{label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black 
                ${active 
                  ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs md:text-sm font-bold text-center border animate-in fade-in duration-200
          ${message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400' 
            : 'bg-rose-50 border-rose-100 text-rose-500 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400'}`}>
          {message.text}
        </div>
      )}

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRequests.map((req) => (
          <div 
            key={req.id} 
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              {/* Header card info */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-2xl flex items-center justify-center font-black text-lg">
                  {req.nom.charAt(0).toUpperCase()}
                </div>
                {getStatusBadge(req.status)}
              </div>

              {/* Student basic info */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-white group-hover:text-amber-500 transition-colors">
                    {req.nom.toUpperCase()} {req.prenom}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-bold mt-1">
                    <span>Sexe: {req.sexe === 'M' ? 'Garçon' : 'Fille'}</span>
                    {req.date_naissance && (
                      <>
                        <span>•</span>
                        <span>Né(e) le {req.date_naissance}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-2 pt-2 border-t border-slate-50 dark:border-slate-800/40 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2 font-bold">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>Classe : <span className="text-slate-800 dark:text-white">{req.classe}</span></span>
                  </div>

                  <div className="flex items-center gap-2 font-bold">
                    <Phone className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>Parent : <a href={`tel:${req.telephone_parent}`} className="text-slate-800 dark:text-white hover:underline">{req.telephone_parent}</a></span>
                  </div>

                  {req.ecole_provenance && (
                    <div className="flex items-center gap-2 font-medium">
                      <School className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span className="truncate">Provenance : <span className="text-slate-800 dark:text-white">{req.ecole_provenance}</span></span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer with actions */}
            <div className="pt-4 mt-4 border-t border-slate-50 dark:border-slate-800/40 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-semibold mb-2">
                <Calendar className="w-3 h-3" />
                <span>Reçu le {format(new Date(req.created_at), 'dd/MM/yyyy HH:mm')}</span>
              </div>

              {req.status === 'pending' && (
                <div className="flex gap-2.5">
                  <button
                    onClick={() => handleResolve(req.id, 'rejected')}
                    disabled={actionLoadingId !== null}
                    className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-400 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    Refuser
                  </button>

                  <button
                    onClick={() => handleResolve(req.id, 'approved')}
                    disabled={actionLoadingId !== null}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                  >
                    {actionLoadingId === req.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        Accepter
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredRequests.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Aucune demande d'admission dans cette catégorie.</p>
          </div>
        )}
      </div>
    </div>
  );
};
