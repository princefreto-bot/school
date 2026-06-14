// ============================================================
// SUPER ADMIN DASHBOARD — Tableau de bord propriétaire SaaS
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Users, AlertTriangle,
  Plus, Check, X, Clock, RefreshCw, ToggleLeft, ToggleRight,
  Globe, Phone, Mail, MapPin, Wallet, Star, Trash2, ExternalLink,
  Megaphone, Link as LinkIcon, UserCheck
} from 'lucide-react';
import { School } from '../../types';
import { API_BASE_URL } from '../../config';
import { useStore } from '../../store/useStore';

// ── Helpers ──────────────────────────────────────────────────

function getAuthHeaders() {
  const token = localStorage.getItem('parent_token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-TG').format(n) + ' FCFA';
}

function getStatusBadge(status: School['status']) {
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

// ── Types internes ────────────────────────────────────────────
interface SchoolWithStats extends School {
  student_count: number;
  user_count: number;
  revenue: number;
  trial_days_left: number;
}

interface GlobalStats {
  total_schools: number;
  active_schools: number;
  trial_schools: number;
  suspended_schools: number;
  expired_trials: number;
  total_students: number;
  total_users: number;
  total_revenue: number;
  price_per_student: number;
}

interface CreatorWithStats {
  id: string;
  nom: string;
  telephone: string;
  created_at: string;
  linked_schools_count: number;
  linked_schools: Array<{
    id: string;
    name: string;
    slug: string;
    total_students: number;
    active_students: number;
    revenue_generated: number;
    creator_commission: number;
  }>;
  total_students: number;
  total_active_students: number;
  total_revenue_generated: number;
  total_commission: number;
}

// ── COMPOSANT MODAL NOUVEAU CRÉATEUR ───────────────────────────
interface CreateCreatorModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const CreateCreatorModal: React.FC<CreateCreatorModalProps> = ({ onClose, onCreated }) => {
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/superadmin/creators`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ nom, telephone, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création');
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-black text-white">Nouveau compte Créateur</h2>
            <p className="text-slate-400 text-xs">Accès global avec commission d'affiliation de 20%</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Nom complet *</label>
            <input type="text" value={nom} onChange={e => setNom(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="ex: Canal Affiliation" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Téléphone (login) *</label>
            <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="ex: 91000000" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Mot de passe *</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Minimum 6 caractères" required minLength={6} />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 font-semibold transition-all">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {loading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── COMPOSANT MODAL LIER ÉCOLE ────────────────────────────────
interface LinkSchoolModalProps {
  creator: CreatorWithStats;
  schools: SchoolWithStats[];
  onClose: () => void;
  onLinked: () => void;
}

const LinkSchoolModal: React.FC<LinkSchoolModalProps> = ({ creator, schools, onClose, onLinked }) => {
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filtrer les écoles déjà liées à ce créateur
  const availableSchools = schools.filter(s => 
    !creator.linked_schools.some(ls => ls.id === s.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolId) return;

    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/superadmin/creators/${creator.id}/link`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ school_id: selectedSchoolId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur d\'affiliation');
      onLinked();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden animate-slideUp">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-black text-white">Affilier un établissement</h2>
            <p className="text-slate-400 text-xs">Associez une école au compte de {creator.nom}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Sélectionner l'école *</label>
            <select
              value={selectedSchoolId}
              onChange={e => setSelectedSchoolId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            >
              <option value="" disabled>-- Sélectionner --</option>
              {availableSchools.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.student_count} élèves)</option>
              ))}
            </select>
            {availableSchools.length === 0 && (
              <p className="text-rose-400 text-xs mt-2">Toutes les écoles sont déjà affiliées à ce créateur.</p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 font-semibold transition-all">
              Annuler
            </button>
            <button type="submit" disabled={loading || !selectedSchoolId}
              className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
              {loading ? 'Liaison...' : 'Lier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── COMPOSANT MODAL CRÉER ÉCOLE ───────────────────────────────
interface CreateSchoolModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const CreateSchoolModal: React.FC<CreateSchoolModalProps> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: '', slug: '', address: '', phone: '', email: '',
    admin_nom: '', admin_telephone: '', admin_password: '',
    accepted_terms: false,
    accepted_privacy_policy: false,
    marketing_consent: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/superadmin/schools`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur création');
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setForm(f => ({ ...f, name, slug }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-black text-white">Créer un nouvel établissement</h2>
            <p className="text-slate-400 text-sm">L'école bénéficiera de 2 mois d'essai gratuit</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Informations de l'école</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Nom de l'établissement *</label>
                <input type="text" value={form.name} onChange={e => handleNameChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="ex: Lycée Excellence Lomé" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Slug URL *</label>
                <div className="flex items-center bg-slate-800 border border-slate-600 rounded-xl overflow-hidden">
                  <span className="px-3 text-slate-500 text-sm">/</span>
                  <input type="text" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    className="flex-1 bg-transparent px-2 py-2.5 text-white placeholder-slate-500 focus:outline-none"
                    placeholder="lycee-excellence-lome" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Adresse</label>
                <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Adressez à Lomé" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Téléphone</label>
                <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="+228 XX XX XX XX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="contact@ecole.tg" />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Compte Directeur (SchoolAdmin)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Nom complet *</label>
                <input type="text" value={form.admin_nom} onChange={e => setForm(f => ({ ...f, admin_nom: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="M. Jean Dupont" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Téléphone (login) *</label>
                <input type="text" value={form.admin_telephone} onChange={e => setForm(f => ({ ...f, admin_telephone: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="90000001" required />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Mot de passe provisoire *</label>
                <input type="password" value={form.admin_password} onChange={e => setForm(f => ({ ...f, admin_password: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Minimum 8 caractères" required minLength={6} />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Confidentialité & Protection des données</h3>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.accepted_terms || false}
                  onChange={e => setForm(f => ({ ...f, accepted_terms: e.target.checked }))}
                  className="mt-1 accent-amber-500 rounded-none"
                  required
                />
                <span className="text-sm text-slate-300 leading-tight">
                  J'accepte les <a href="/#/conditions-utilisation" target="_blank" className="text-amber-500 font-bold hover:underline">Conditions Générales d'Utilisation</a>. <span className="text-red-500">*</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.accepted_privacy_policy || false}
                  onChange={e => setForm(f => ({ ...f, accepted_privacy_policy: e.target.checked }))}
                  className="mt-1 accent-amber-500 rounded-none"
                  required
                />
                <span className="text-sm text-slate-300 leading-tight">
                  J'autorise le traitement des données conformément à la <a href="/#/confidentialite" target="_blank" className="text-amber-500 font-bold hover:underline">Politique de Confidentialité</a>. <span className="text-red-500">*</span>
                </span>
              </label>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 font-semibold transition-all">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {loading ? 'Création...' : 'Créer l\'école'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── DASHBOARD PRINCIPAL ───────────────────────────────────────
export const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schools' | 'creators'>('schools');
  
  // États Écoles
  const [schools, setSchools] = useState<SchoolWithStats[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // États Créateurs
  const [creators, setCreators] = useState<CreatorWithStats[]>([]);
  const [showCreateCreatorModal, setShowCreateCreatorModal] = useState(false);
  const [selectedCreatorForLink, setSelectedCreatorForLink] = useState<CreatorWithStats | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadSchoolsAndStats = async () => {
    try {
      const [schoolsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/superadmin/schools`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/superadmin/stats`, { headers: getAuthHeaders() })
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
    }
  };

  const loadCreators = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/superadmin/creators`, { headers: getAuthHeaders() });
      if (res.ok) {
        const d = await res.json();
        setCreators(d || []);
      }
    } catch (err) {
      console.error('SuperAdmin load creators error:', err);
    }
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadSchoolsAndStats(),
      loadCreators()
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

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
      await loadAll();
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

  // ── Actions Créateurs ──
  const handleDeleteCreator = async (creator: CreatorWithStats) => {
    if (!confirm(`Voulez-vous supprimer définitivement le créateur "${creator.nom}" ?`)) return;

    setActionLoading(creator.id);
    try {
      const res = await fetch(`${API_BASE_URL}/superadmin/creators/${creator.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        await loadCreators();
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
        await loadCreators();
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
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(124,58,237,0.3)]">
            <Star className="w-8 h-8 text-white fill-white/20" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">SuperAdmin Global</h1>
            <p className="text-slate-400 text-sm sm:text-base font-medium mt-1">Plateforme SaaS — Contrôle & Gestion centralisée</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={loadAll}
            className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/50 hover:shadow-lg"
            title="Actualiser">
            <RefreshCw className="w-5 h-5" />
          </button>
          
          {activeTab === 'schools' ? (
            <button onClick={() => setShowCreateModal(true)}
              className="flex flex-1 md:flex-none items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black transition-all shadow-[0_8px_20px_-6px_rgba(245,158,11,0.4)] border border-amber-500/30 hover:scale-[1.02] active:scale-[0.98]">
              <Plus className="w-5 h-5 shrink-0" />
              <span className="whitespace-nowrap">Nouvelle école</span>
            </button>
          ) : (
            <button onClick={() => setShowCreateCreatorModal(true)}
              className="flex flex-1 md:flex-none items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black transition-all shadow-[0_8px_20px_-6px_rgba(245,158,11,0.4)] border border-amber-500/30 hover:scale-[1.02] active:scale-[0.98]">
              <Plus className="w-5 h-5 shrink-0" />
              <span className="whitespace-nowrap">Nouveau Créateur</span>
            </button>
          )}
        </div>
      </div>

      {/* ── TABS NAVIGATION ── */}
      <div className="flex gap-2 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('schools')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition ${
            activeTab === 'schools'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Building2 className="w-4 h-4" /> Établissements
        </button>
        <button
          onClick={() => setActiveTab('creators')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition ${
            activeTab === 'creators'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Megaphone className="w-4 h-4" /> Partenaires Créateurs
        </button>
      </div>

      {/* ── CONTENU ONGLET ÉCOLES ── */}
      {activeTab === 'schools' && (
        <div className="space-y-6">
          {/* Stats globales */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Total Écoles', value: stats.total_schools, icon: <Building2 className="w-5 h-5" />,
                  color: 'from-blue-500 to-cyan-500', sub: `${stats.active_schools} actives`
                },
                {
                  label: 'Total Élèves', value: stats.total_students.toLocaleString(), icon: <Users className="w-5 h-5" />,
                  color: 'from-emerald-500 to-teal-500', sub: `${stats.total_users} utilisateurs`
                },
                {
                  label: 'Chiffre d\'affaires', value: formatFCFA(stats.total_revenue), icon: <Wallet className="w-5 h-5" />,
                  color: 'from-purple-500 to-violet-500', sub: `${stats.price_per_student.toLocaleString()} FCFA/élève`
                },
                {
                  label: 'Alertes', value: stats.expired_trials + stats.suspended_schools, icon: <AlertTriangle className="w-5 h-5" />,
                  color: 'from-red-500 to-rose-500', sub: `${stats.expired_trials} essais expirés`
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

          {/* Liste des écoles */}
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
                      <div className="flex items-start gap-4">
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
                              <p className="text-slate-500 text-xs">Revenus/mois</p>
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

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-700/50 pt-3 sm:pt-0 sm:pl-4 mt-3 sm:mt-0">
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
        </div>
      )}

      {/* ── CONTENU ONGLET CRÉATEURS ── */}
      {activeTab === 'creators' && (
        <div className="space-y-6">
          
          {/* Stats Créateurs */}
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
              <p className="text-2xl font-black text-white text-emerald-400">{formatFCFA(totalCommissionsAll)}</p>
              <p className="text-slate-400 text-sm font-semibold">Commissions Dues (20%)</p>
              <p className="text-slate-500 text-xs mt-1">Cumulé sur les licences débloquées</p>
            </div>
          </div>

          {/* Liste des Créateurs */}
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
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center shrink-0 font-black text-lg">
                        {creator.nom.charAt(0).toUpperCase()}
                      </div>

                      {/* Infos */}
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

                        {/* Écoles Affiliées en badge avec croix */}
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

                        {/* Revenus associés */}
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

                      {/* Actions Créateurs */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-700/50 pt-3 sm:pt-0 sm:pl-4 mt-3 sm:mt-0">
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
        </div>
      )}

      {/* Modal création école */}
      {showCreateModal && (
        <CreateSchoolModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); loadSchoolsAndStats(); }}
        />
      )}

      {/* Modal création créateur */}
      {showCreateCreatorModal && (
        <CreateCreatorModal
          onClose={() => setShowCreateCreatorModal(false)}
          onCreated={() => { setShowCreateCreatorModal(false); loadCreators(); }}
        />
      )}

      {/* Modal liaison école */}
      {selectedCreatorForLink && (
        <LinkSchoolModal
          creator={selectedCreatorForLink}
          schools={schools}
          onClose={() => setSelectedCreatorForLink(null)}
          onLinked={() => { setSelectedCreatorForLink(null); loadCreators(); }}
        />
      )}
    </div>
  );
};
