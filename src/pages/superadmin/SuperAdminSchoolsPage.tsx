// ============================================================
// SUPERADMIN — Établissements
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Users, AlertTriangle, Plus, Check, X, Clock, RefreshCw,
  ToggleLeft, ToggleRight, Globe, Phone, Mail, MapPin, Wallet, UserCheck,
  ExternalLink, Trash2
} from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { getAuthHeaders } from '../../services/apiHelpers';
import { useStore } from '../../store/useStore';
import { formatFCFA } from '../../services/superAdminApi';
import { CreateSchoolModal } from '../../components/superadmin/CreateSchoolModal';
import { SchoolWithStats, GlobalStats } from './types';

function getStatusBadge(status: SchoolWithStats['status']) {
  const map = {
    active: { label: 'Actif', color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
    trial: { label: 'Essai', color: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
    suspended: { label: 'Suspendu', color: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${s.color}`}>
      {status === 'active' && <Check className="w-3 h-3" />}
      {status === 'trial' && <Clock className="w-3 h-3" />}
      {status === 'suspended' && <X className="w-3 h-3" />}
      {s.label}
    </span>
  );
}

export const SuperAdminSchoolsPage: React.FC = () => {
  const [schools, setSchools] = useState<SchoolWithStats[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadSchoolsAndStats = useCallback(async () => {
    try {
      const [schoolsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/superadmin/schools`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/superadmin/stats`, { headers: getAuthHeaders() }),
      ]);
      if (schoolsRes.ok) {
        const d = await schoolsRes.json();
        setSchools(d.schools || []);
      }
      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d);
      }
    } catch (err) {
      console.error('SuperAdmin load schools/stats error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSchoolsAndStats(); }, [loadSchoolsAndStats]);

  const handleApproveToggle = async (school: SchoolWithStats, approved: boolean) => {
    const action = approved ? 'approuver' : 'désapprouver';
    if (!confirm(`Voulez-vous ${action} "${school.name}" ?`)) return;

    setActionLoading(school.id);
    try {
      const res = await fetch(`${API_BASE_URL}/superadmin/schools/${school.id}/approve`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_approved: approved })
      });
      if (res.ok) await loadSchoolsAndStats();
      else {
        const errData = await res.json();
        alert(errData.error || 'Erreur lors de la modification');
      }
    } catch (err) {
      alert('Erreur réseau lors de la modification');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusToggle = async (school: SchoolWithStats) => {
    const newStatus = school.status === 'active' ? 'suspended' : 'active';
    const label = newStatus === 'active' ? 'activer' : 'suspendre';
    if (!confirm(`Voulez-vous ${label} "${school.name}" ?`)) return;

    setActionLoading(school.id);
    try {
      const res = await fetch(`${API_BASE_URL}/superadmin/schools/${school.id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) await loadSchoolsAndStats();
    } catch (err) {
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSchool = async (school: SchoolWithStats) => {
    if (!confirm(`⚠️ ATTENTION ⚠️\nSupprimer DÉFINITIVEMENT "${school.name}" ?\n\nCette action va détruire toutes les bases de données associées.`)) return;
    if (prompt(`Pour confirmer, tapez le nom de l'école : "${school.name}"`) !== school.name) {
      alert("Suppression annulée.");
      return;
    }

    setActionLoading(school.id);
    try {
      const res = await fetch(`${API_BASE_URL}/superadmin/schools/${school.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message);
      await loadSchoolsAndStats();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    } finally {
      setActionLoading(null);
    }
  };

  const handleImpersonate = async (school: SchoolWithStats) => {
    setActionLoading(school.id);
    try {
      const res = await fetch(`${API_BASE_URL}/superadmin/schools/${school.id}/impersonate`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur impersonate');

      localStorage.setItem('parent_token', data.token);

      useStore.getState().resetSchoolSettingsToDefaults();
      useStore.setState({
        students: [], parents: [], presences: [], activityLogs: [], links: [],
        announcements: [], announcementReads: [], matieres: [], classeMatieres: [],
        notes: [],
        schoolLogo: data.user.school_logo || null,
        schoolName: data.user.school_name || 'Établissement',
        user: data.user,
        isAuthenticated: true,
        currentPage: 'dashboard'
      });

      useStore.getState().fetchAllFromBackend();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

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
          <h1 className="text-2xl font-black text-white">Établissements</h1>
          <p className="text-slate-400 text-sm">Créez, approuvez et gérez les écoles clientes.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadSchoolsAndStats}
            className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/50"
            title="Actualiser">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black transition-all shadow-[0_8px_20px_-6px_rgba(245,158,11,0.4)] border border-amber-500/30 hover:scale-[1.02] active:scale-[0.98]">
            <Plus className="w-5 h-5 shrink-0" />
            <span className="whitespace-nowrap">Nouvelle école</span>
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Écoles', value: stats.total_schools, icon: <Building2 className="w-5 h-5" />,
              color: 'from-blue-500 to-cyan-500', sub: `${stats.active_schools} actives`
            },
            {
              label: 'Total Élèves', value: stats.total_students.toLocaleString(), icon: <Users className="w-5 h-5" />,
              color: 'from-emerald-500 to-teal-500', sub: `${stats.total_users} users`
            },
            {
              label: 'Parents Activés', value: stats.total_parents || 0, icon: <UserCheck className="w-5 h-5" />,
              color: 'from-indigo-500 to-blue-500', sub: `sur la plateforme`
            },
            {
              label: 'CA Mensuel (estimé)', value: formatFCFA(stats.total_revenue), icon: <Wallet className="w-5 h-5" />,
              color: 'from-purple-500 to-violet-500', sub: `${stats.price_per_student.toLocaleString()} FCFA/élève`
            },
          ].map((card) => (
            <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white`}>
                  {card.icon}
                </div>
              </div>
              <p className="text-2xl font-black text-white">{card.value}</p>
              <p className="text-slate-400 text-sm font-medium">{card.label}</p>
              <p className="text-slate-500 text-xs mt-1">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {stats && stats.expired_trials > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold">{stats.expired_trials} école{stats.expired_trials > 1 ? 's' : ''} en essai expiré</p>
            <p className="text-sm text-amber-500/80">Ces écoles n'ont pas encore réglé leur abonnement. Contactez les directeurs.</p>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Établissements enregistrés</h2>
          <span className="text-sm text-slate-500">{schools.length} école{schools.length !== 1 ? 's' : ''}</span>
        </div>

        {schools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="w-12 h-12 text-slate-700 mb-4" />
            <p className="text-slate-500 font-medium">Aucun établissement enregistré</p>
            <p className="text-slate-600 text-sm mt-1">Cliquez sur "Nouvelle école" pour commencer</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {schools.map((school) => {
              const isExpired = school.status === 'trial' && school.trial_days_left === 0;
              return (
                <div key={school.id} className={`p-5 hover:bg-slate-800/30 transition-colors ${isExpired ? 'border-l-4 border-amber-500' : ''}`}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center shrink-0 overflow-hidden">
                        {school.logo_url ? (
                          <img src={school.logo_url} alt={school.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <h3 className="text-white font-bold text-base">{school.name}</h3>
                          {getStatusBadge(school.status)}
                          {school.is_email_verified === false && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                              <Mail className="w-3 h-3" /> Email non vérifié
                            </span>
                          )}
                          {school.is_approved === false && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                              <AlertTriangle className="w-3 h-3" /> En attente de validation
                            </span>
                          )}
                          {isExpired && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                              <AlertTriangle className="w-3 h-3" /> Essai expiré
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400 mb-3">
                          <span className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5" />
                            <code className="text-slate-300 text-xs">/{school.slug}</code>
                          </span>
                          {school.address && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />{school.address}
                            </span>
                          )}
                          {school.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5" />{school.phone}
                            </span>
                          )}
                          {school.email && (
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5" />{school.email}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4">
                          <div className="text-center">
                            <p className="text-white font-bold text-lg">{school.student_count}</p>
                            <p className="text-slate-500 text-xs">Élèves actuels</p>
                          </div>
                          <div className="text-center">
                            <p className="text-emerald-400 font-bold text-lg">{formatFCFA(school.revenue)}</p>
                            <p className="text-slate-500 text-xs">Revenus/mois (estimé)</p>
                          </div>
                          {school.status === 'trial' && (
                            <div className="text-center">
                              <p className={`font-bold text-lg ${school.trial_days_left > 7 ? 'text-amber-400' : 'text-red-400'}`}>
                                {school.trial_days_left}j
                              </p>
                              <p className="text-slate-500 text-xs">Restant essai</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 lg:border-l border-slate-700/50 pt-3 sm:pt-0 lg:pl-4">
                      {school.is_approved === false ? (
                        <button
                          onClick={() => handleApproveToggle(school, true)}
                          disabled={actionLoading === school.id}
                          className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all disabled:opacity-50"
                        >
                          {actionLoading === school.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                          APPROUVER
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApproveToggle(school, false)}
                          disabled={actionLoading === school.id}
                          className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 shadow-md transition-all disabled:opacity-50"
                        >
                          {actionLoading === school.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                          BLOQUER
                        </button>
                      )}

                      <button
                        onClick={() => handleImpersonate(school)}
                        disabled={actionLoading === school.id}
                        className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-600/20 to-amber-500/10 text-amber-400 hover:from-amber-600/30 hover:to-amber-500/20 border border-amber-600/40 shadow-md transition-all disabled:opacity-50"
                      >
                        {actionLoading === school.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                        GÉRER
                      </button>

                      <button
                        onClick={() => handleStatusToggle(school)}
                        disabled={actionLoading === school.id}
                        className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md ${
                          school.status === 'suspended'
                              ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-400/10 text-emerald-400 hover:from-emerald-500/30 hover:to-emerald-400/20 border border-emerald-500/40'
                              : 'bg-gradient-to-r from-amber-500/20 to-amber-400/10 text-amber-400 hover:from-amber-500/30 hover:to-amber-400/20 border border-amber-500/40'
                        } disabled:opacity-50`}
                      >
                        {actionLoading === school.id
                          ? <RefreshCw className="w-4 h-4 animate-spin" />
                          : school.status === 'suspended'
                            ? <ToggleLeft className="w-5 h-5" />
                            : <ToggleRight className="w-5 h-5" />
                        }
                        {school.status === 'suspended' ? 'RÉACTIVER' : 'SUSPENDRE'}
                      </button>

                      <button
                        onClick={() => handleDeleteSchool(school)}
                        disabled={actionLoading === school.id}
                        className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-red-600/20 to-red-500/10 text-red-500 hover:from-red-600/30 hover:to-red-500/20 border border-red-600/40 shadow-md transition-all disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        SUPPRIMER
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateSchoolModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); loadSchoolsAndStats(); }}
        />
      )}
    </div>
  );
};
