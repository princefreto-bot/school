// ============================================================
// SUPERADMIN — Partenaires (Créateurs / Affiliation)
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { Users, Building2, Wallet, Megaphone, Phone, Clock, Link as LinkIcon, Trash2, Plus, RefreshCw, X } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { getAuthHeaders } from '../../services/apiHelpers';
import { formatFCFA } from '../../services/superAdminApi';
import { CreateCreatorModal } from '../../components/superadmin/CreateCreatorModal';
import { LinkSchoolModal } from '../../components/superadmin/LinkSchoolModal';
import { CreatorWithStats, SchoolWithStats } from './types';

export const SuperAdminCreatorsPage: React.FC = () => {
  const [creators, setCreators] = useState<CreatorWithStats[]>([]);
  const [schools, setSchools] = useState<SchoolWithStats[]>([]);
  const [showCreateCreatorModal, setShowCreateCreatorModal] = useState(false);
  const [selectedCreatorForLink, setSelectedCreatorForLink] = useState<CreatorWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [creatorsRes, schoolsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/superadmin/creators`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/superadmin/schools`, { headers: getAuthHeaders() }),
      ]);
      if (creatorsRes.ok) setCreators((await creatorsRes.json()) || []);
      if (schoolsRes.ok) {
        const d = await schoolsRes.json();
        setSchools(d.schools || []);
      }
    } catch (err) {
      console.error('SuperAdmin load creators error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleDeleteCreator = async (creator: CreatorWithStats) => {
    if (!confirm(`Voulez-vous supprimer définitivement le créateur "${creator.nom}" ?`)) return;

    setActionLoading(creator.id);
    try {
      const res = await fetch(`${API_BASE_URL}/superadmin/creators/${creator.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        await loadAll();
      } else {
        const result = await res.json();
        throw new Error(result.error);
      }
    } catch (err: any) {
      alert(err.message || "Erreur de suppression");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlinkSchool = async (creatorId: string, schoolId: string, schoolName: string) => {
    if (!confirm(`Voulez-vous retirer l'affiliation de "${schoolName}" pour ce créateur ?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/superadmin/creators/${creatorId}/link/${schoolId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        await loadAll();
      } else {
        const result = await res.json();
        throw new Error(result.error);
      }
    } catch (err: any) {
      alert(err.message || "Erreur lors de la désaffiliation");
    }
  };

  const totalCommissionsAll = creators.reduce((acc, c) => acc + c.total_commission, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Partenaires</h1>
          <p className="text-slate-400 text-sm">Créateurs de contenu affiliés et leurs commissions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadAll}
            className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/50"
            title="Actualiser">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button onClick={() => setShowCreateCreatorModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black transition-all shadow-[0_8px_20px_-6px_rgba(245,158,11,0.4)] border border-amber-500/30 hover:scale-[1.02] active:scale-[0.98]">
            <Plus className="w-5 h-5 shrink-0" />
            <span className="whitespace-nowrap">Nouveau Créateur</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-white">{creators.length}</p>
          <p className="text-slate-400 text-sm font-semibold">Total Créateurs</p>
          <p className="text-slate-500 text-xs mt-1">Comptes partenaires actifs</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
            <Building2 className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-white">
            {creators.reduce((acc, c) => acc + c.linked_schools_count, 0)}
          </p>
          <p className="text-slate-400 text-sm font-semibold">Écoles Affiliées</p>
          <p className="text-slate-500 text-xs mt-1">Total des écoles reliées</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
            <Wallet className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{formatFCFA(totalCommissionsAll)}</p>
          <p className="text-slate-400 text-sm font-semibold">Commissions Dues (20%)</p>
          <p className="text-slate-500 text-xs mt-1">Cumulé sur les licences débloquées</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Créateurs enregistrés</h2>
          <span className="text-sm text-slate-500">{creators.length} créateur{creators.length !== 1 ? 's' : ''}</span>
        </div>

        {creators.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Megaphone className="w-12 h-12 text-slate-700 mb-4" />
            <p className="text-slate-500 font-medium">Aucun créateur de contenu enregistré</p>
            <p className="text-slate-600 text-sm mt-1">Cliquez sur "Nouveau Créateur" pour commencer</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {creators.map((creator) => (
              <div key={creator.id} className="p-5 hover:bg-slate-800/30 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center shrink-0 font-black text-lg">
                      {creator.nom.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h3 className="text-white font-bold text-base">{creator.nom}</h3>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          PARTENAIRE
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400 mb-4">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />{creator.telephone}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Créé le {new Date(creator.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Établissements affiliés ({creator.linked_schools.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {creator.linked_schools.map(school => (
                            <span
                              key={school.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700/50"
                            >
                              <Building2 className="w-3 h-3 text-slate-500" />
                              {school.name}
                              <button
                                onClick={() => handleUnlinkSchool(creator.id, school.id, school.name)}
                                className="w-4 h-4 rounded-full bg-slate-700 hover:bg-rose-500/20 hover:text-rose-400 flex items-center justify-center transition"
                                title="Délier cet établissement"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                          {creator.linked_schools.length === 0 && (
                            <p className="text-xs text-slate-600 italic">Aucune école affiliée.</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-6 border-t border-slate-800/60 pt-3">
                        <div className="text-center sm:text-left">
                          <p className="text-slate-400 font-bold text-base tabular-nums">{creator.total_active_students} / {creator.total_students}</p>
                          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Licences payées</p>
                        </div>
                        <div className="text-center sm:text-left">
                          <p className="text-slate-400 font-bold text-base tabular-nums">{formatFCFA(creator.total_revenue_generated)}</p>
                          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">CA écoles lié</p>
                        </div>
                        <div className="text-center sm:text-left">
                          <p className="text-amber-400 font-black text-base tabular-nums">{formatFCFA(creator.total_commission)}</p>
                          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Commissions créateur (20%)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 lg:border-l border-slate-700/50 pt-3 lg:pt-0 lg:pl-4">
                    <button
                      onClick={() => setSelectedCreatorForLink(creator)}
                      className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 shadow-md transition-all"
                    >
                      <LinkIcon className="w-4 h-4 text-amber-500" />
                      LIER ÉCOLE
                    </button>

                    <button
                      onClick={() => handleDeleteCreator(creator)}
                      disabled={actionLoading === creator.id}
                      className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 shadow-md transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      SUPPRIMER
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateCreatorModal && (
        <CreateCreatorModal
          onClose={() => setShowCreateCreatorModal(false)}
          onCreated={() => { setShowCreateCreatorModal(false); loadAll(); }}
        />
      )}

      {selectedCreatorForLink && (
        <LinkSchoolModal
          creator={selectedCreatorForLink}
          schools={schools}
          onClose={() => setSelectedCreatorForLink(null)}
          onLinked={() => { setSelectedCreatorForLink(null); loadAll(); }}
        />
      )}
    </div>
  );
};
