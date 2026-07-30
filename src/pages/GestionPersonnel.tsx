// ============================================================
// GESTION DU PERSONNEL — Fiches complètes de tout le personnel
// (identité, rôle, matricule, CNSS, département, mode de paiement...)
// ============================================================
import React, { useEffect, useState } from 'react';
import { personnelApi } from '../services/personnelApi';
import { staffAbsencesApi } from '../services/staffAbsencesApi';
import { personnelDocumentsApi, PersonnelDocument } from '../services/personnelDocumentsApi';
import { getAuthHeaders } from '../services/apiHelpers';
import { DocumentScanner, DocTypeOption } from '../components/DocumentScanner';
import { useStore } from '../store/useStore';
import {
  Users, UserPlus, Trash2, Loader2, Shield, Pencil, X, AlertTriangle, CheckCircle, CalendarX, Plus,
  FileText, Download, ScanLine
} from 'lucide-react';

const STAFF_DOC_TYPES: DocTypeOption[] = [
  { value: 'contract', label: 'Contrat' },
  { value: 'diploma', label: 'Diplôme' },
  { value: 'id_card', label: "Pièce d'identité" },
  { value: 'cnss_card', label: 'Carte CNSS' },
  { value: 'other', label: 'Autre document' },
];
const STAFF_DOC_LABELS: Record<string, string> = Object.fromEntries(STAFF_DOC_TYPES.map((t) => [t.value, t.label]));

interface PersonnelRow {
  id: string;
  nom: string;
  telephone: string;
  email?: string | null;
  role: string;
  matricule?: string | null;
  numero_cnss?: string | null;
  date_embauche?: string | null;
  mode_paiement?: string | null;
  compte_bancaire?: string | null;
  departement?: string | null;
}

interface EditForm {
  nom: string;
  telephone: string;
  email: string;
  role: string;
  matricule: string;
  numeroCnss: string;
  dateEmbauche: string;
  modePaiement: string;
  compteBancaire: string;
  departement: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur (Complet)',
  censeur: 'Censeur',
  proviseur: 'Proviseur',
  superviseur: 'Surveillant (Gardien - Scan)',
  comptable: 'Comptable',
  secretaire: 'Secrétaire',
  enseignant: 'Enseignant (Compte Partagé)',
};

const CREATABLE_ROLES = ['superviseur', 'censeur', 'proviseur', 'comptable', 'secretaire', 'admin', 'enseignant'];

export const GestionPersonnel: React.FC = () => {
  const currentUser = useStore((s) => s.user);
  const canDelete = currentUser?.role === 'admin' || currentUser?.role === 'directeur' || currentUser?.role === 'directeur_general';

  const [personnel, setPersonnel] = useState<PersonnelRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Création
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('superviseur');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Édition
  const emptyForm: EditForm = {
    nom: '', telephone: '', email: '', role: '',
    matricule: '', numeroCnss: '', dateEmbauche: '', modePaiement: '', compteBancaire: '', departement: '',
  };
  const [editRow, setEditRow] = useState<PersonnelRow | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      const data = await personnelApi.getPersonnel();
      setPersonnel(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, []);

  // ── Absences ──
  const [absences, setAbsences] = useState<any[]>([]);
  const [loadingAbsences, setLoadingAbsences] = useState(true);
  const [absPersonnelId, setAbsPersonnelId] = useState('');
  const [absDate, setAbsDate] = useState('');
  const [absType, setAbsType] = useState('absence');
  const [absHeures, setAbsHeures] = useState('');
  const [absMotif, setAbsMotif] = useState('');
  const [absSubmitting, setAbsSubmitting] = useState(false);
  const [absError, setAbsError] = useState('');

  const fetchAbsences = async () => {
    try {
      setLoadingAbsences(true);
      const data = await staffAbsencesApi.getAll();
      setAbsences(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAbsences(false);
    }
  };

  useEffect(() => {
    fetchAbsences();
  }, []);

  const handleCreateAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    setAbsError('');
    if (!absPersonnelId || !absDate) {
      setAbsError('Membre du personnel et date requis.');
      return;
    }
    setAbsSubmitting(true);
    try {
      await staffAbsencesApi.create({
        personnelId: absPersonnelId,
        date: absDate,
        type: absType,
        heuresManquees: absHeures ? Number(absHeures) : null,
        motif: absMotif || undefined,
      });
      setAbsDate('');
      setAbsHeures('');
      setAbsMotif('');
      await fetchAbsences();
    } catch (err: any) {
      setAbsError(err?.error || "Erreur lors de l'enregistrement.");
    } finally {
      setAbsSubmitting(false);
    }
  };

  const handleDeleteAbsence = async (id: string) => {
    if (!window.confirm('Supprimer cette absence ?')) return;
    try {
      await staffAbsencesApi.remove(id);
      await fetchAbsences();
    } catch {
      alert('Erreur lors de la suppression.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nom || !telephone || !password) {
      setError('Tous les champs sont requis.');
      return;
    }
    setSubmitting(true);
    try {
      await personnelApi.createPersonnel({ nom, telephone, password, role });
      setNom('');
      setTelephone('');
      setPassword('');
      await fetchPersonnel();
    } catch (err: any) {
      setError(err?.error || 'Erreur lors de la création du compte.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet agent de l'établissement ?")) return;
    try {
      await personnelApi.deletePersonnel(id);
      await fetchPersonnel();
    } catch (err) {
      alert('Erreur lors de la suppression.');
    }
  };

  const openEdit = (p: PersonnelRow) => {
    setEditError('');
    setEditRow(p);
    setEditForm({
      nom: p.nom || '',
      telephone: p.telephone || '',
      email: p.email || '',
      role: p.role || '',
      matricule: p.matricule || '',
      numeroCnss: p.numero_cnss || '',
      dateEmbauche: p.date_embauche ? String(p.date_embauche).slice(0, 10) : '',
      modePaiement: p.mode_paiement || '',
      compteBancaire: p.compte_bancaire || '',
      departement: p.departement || '',
    });
  };

  const saveEdit = async () => {
    if (!editRow) return;
    setSaving(true);
    setEditError('');
    try {
      await personnelApi.updatePersonnel(editRow.id, editForm);
      setEditRow(null);
      await fetchPersonnel();
    } catch (err: any) {
      setEditError(err?.error || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  // ── Documents personnel (contrat, diplôme, pièce d'identité...) ──
  const [personnelDocs, setPersonnelDocs] = useState<PersonnelDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [docError, setDocError] = useState('');

  const fetchPersonnelDocs = async (personnelId: string) => {
    setLoadingDocs(true);
    try {
      const data = await personnelDocumentsApi.getForPersonnel(personnelId);
      setPersonnelDocs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (editRow) fetchPersonnelDocs(editRow.id);
    else setPersonnelDocs([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editRow?.id]);

  const handleDocCapture = async (file: File, docType: string, title: string) => {
    if (!editRow) return;
    setScannerOpen(false);
    setDocError('');
    try {
      await personnelDocumentsApi.scan(file, editRow.id, docType, title);
      await fetchPersonnelDocs(editRow.id);
    } catch (err: any) {
      setDocError(err?.error || 'Erreur lors de la numérisation.');
    }
  };

  const handleViewDoc = async (d: PersonnelDocument) => {
    const filename = d.file_url.split('/').pop() || '';
    try {
      const res = await fetch(personnelDocumentsApi.fileUrl(filename), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    } catch {
      alert('Erreur lors du chargement du document.');
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!editRow || !window.confirm('Supprimer ce document ?')) return;
    try {
      await personnelDocumentsApi.remove(id);
      await fetchPersonnelDocs(editRow.id);
    } catch {
      alert('Erreur lors de la suppression.');
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-[1200px] mx-auto animate-slideUp">
      <div className="relative pro-card p-8 overflow-hidden bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-indigo-100 dark:border-indigo-900/30">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500 text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4">
            <Users className="w-3.5 h-3.5" /> Administration
          </div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Personnel</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
            Créez les accès de vos collaborateurs et tenez à jour leurs fiches (matricule, CNSS, département, mode de paiement...).
          </p>
        </div>
      </div>

      {/* ── Création ── */}
      <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8">
        <h3 className="font-black text-slate-800 dark:text-slate-200 text-lg mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-indigo-500" /> Ajouter un collaborateur
        </h3>

        {error && (
          <div className="mb-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl p-3 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Nom et prénom</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Jean Dupont" className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Téléphone (identifiant)</label>
            <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Ex: 90000000" className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Mot de passe</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ex: secret123" className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Rôle d'accès</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
              {CREATABLE_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase rounded-xl transition flex items-center gap-2 disabled:opacity-50">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          Créer le compte
        </button>
      </form>

      {/* ── Liste ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Shield className="w-6 h-6 text-indigo-500" />
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Comptes existants</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.1em] border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4">Nom</th>
                <th className="px-6 py-4">Téléphone</th>
                <th className="px-6 py-4">Rôle</th>
                <th className="px-6 py-4">Matricule</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400"><Loader2 className="w-4 h-4 animate-spin inline" /></td></tr>
              ) : personnel.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-400 text-sm font-medium">Aucun point d'accès créé pour le moment.</td></tr>
              ) : (
                personnel.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-200">{p.nom}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{p.telephone}</td>
                    <td className="px-6 py-4 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{ROLE_LABELS[p.role] || p.role}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{p.matricule || <span className="text-slate-300 dark:text-slate-600">—</span>}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => openEdit(p)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors" title="Éditer la fiche">
                          <Pencil className="w-4 h-4" />
                        </button>
                        {canDelete && (
                          <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors" title="Supprimer ce compte">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Absences ── */}
      <form onSubmit={handleCreateAbsence} className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8">
        <h3 className="font-black text-slate-800 dark:text-slate-200 text-lg mb-4 flex items-center gap-2">
          <CalendarX className="w-5 h-5 text-indigo-500" /> Enregistrer une absence
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Saisie manuelle — aucune donnée de retenue sur salaire n'est calculée automatiquement pour le moment.
        </p>

        {absError && (
          <div className="mb-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl p-3 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {absError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Membre du personnel</label>
            <select value={absPersonnelId} onChange={(e) => setAbsPersonnelId(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
              <option value="">Sélectionner…</option>
              {personnel.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Date</label>
            <input type="date" value={absDate} onChange={(e) => setAbsDate(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Type</label>
            <select value={absType} onChange={(e) => setAbsType(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
              <option value="absence">Absence</option>
              <option value="retard">Retard</option>
              <option value="conge">Congé</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Heures manquées</label>
            <input type="number" min={0} step={0.5} value={absHeures} onChange={(e) => setAbsHeures(e.target.value)} placeholder="Ex: 4" className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Motif</label>
            <input value={absMotif} onChange={(e) => setAbsMotif(e.target.value)} placeholder="Ex: Maladie" className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
          </div>
        </div>

        <button type="submit" disabled={absSubmitting} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase rounded-xl transition flex items-center gap-2 disabled:opacity-50">
          {absSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Enregistrer
        </button>
      </form>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <CalendarX className="w-6 h-6 text-indigo-500" />
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Absences enregistrées</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.1em] border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4">Personnel</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Heures</th>
                <th className="px-6 py-4">Motif</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {loadingAbsences ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400"><Loader2 className="w-4 h-4 animate-spin inline" /></td></tr>
              ) : absences.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-400 text-sm font-medium">Aucune absence enregistrée.</td></tr>
              ) : (
                absences.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-200">{a.personnel?.nom || a.personnel_id}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{new Date(a.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-4 text-xs text-indigo-600 dark:text-indigo-400 font-semibold capitalize">{a.type}</td>
                    <td className="px-6 py-4 text-right text-xs text-slate-500 dark:text-slate-400">{a.heures_manquees != null ? `${a.heures_manquees} h` : '—'}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{a.motif || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDeleteAbsence(a.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors ml-auto" title="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modale d'édition ── */}
      {editRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setEditRow(null)}>
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <Pencil className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="font-black text-slate-900 dark:text-white">Fiche personnel</h3>
                <p className="text-[11px] text-slate-400 font-medium">{editRow.nom}</p>
              </div>
              <button onClick={() => setEditRow(null)} className="ml-auto p-2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-6 space-y-4">
              {editError && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl p-3 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {editError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Nom et prénom</label>
                  <input value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Téléphone</label>
                  <input value={editForm.telephone} onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Email</label>
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Rôle</label>
                  <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                    {CREATABLE_ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Matricule</label>
                  <input value={editForm.matricule} onChange={(e) => setEditForm({ ...editForm, matricule: e.target.value })} placeholder="Ex: EMP-0042" className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">N° CNSS</label>
                  <input value={editForm.numeroCnss} onChange={(e) => setEditForm({ ...editForm, numeroCnss: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Date d'embauche</label>
                  <input type="date" value={editForm.dateEmbauche} onChange={(e) => setEditForm({ ...editForm, dateEmbauche: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Département</label>
                  <input value={editForm.departement} onChange={(e) => setEditForm({ ...editForm, departement: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Mode de paiement</label>
                  <select value={editForm.modePaiement} onChange={(e) => setEditForm({ ...editForm, modePaiement: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                    <option value="">—</option>
                    <option value="Espèces">Espèces</option>
                    <option value="Virement bancaire">Virement bancaire</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Chèque">Chèque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Compte bancaire / Mobile</label>
                  <input value={editForm.compteBancaire} onChange={(e) => setEditForm({ ...editForm, compteBancaire: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
              </div>

              {/* ── Documents ── */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Documents
                  </h4>
                  <button type="button" onClick={() => setScannerOpen(true)} className="flex items-center gap-1 text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline">
                    <ScanLine className="w-3.5 h-3.5" /> Numériser un document
                  </button>
                </div>

                {docError && (
                  <div className="mb-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl p-2.5 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {docError}
                  </div>
                )}

                {loadingDocs ? (
                  <div className="py-4 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
                ) : personnelDocs.length === 0 ? (
                  <p className="text-[11px] text-slate-400 py-2">Aucun document numérisé.</p>
                ) : (
                  <div className="space-y-1.5">
                    {personnelDocs.map((d) => (
                      <div key={d.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-lg">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{d.title}</p>
                          <p className="text-[10px] text-slate-400">{STAFF_DOC_LABELS[d.document_type] || d.document_type}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => handleViewDoc(d)} className="p-1.5 text-slate-400 hover:text-indigo-600" title="Voir / télécharger">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteDoc(d.id)} className="p-1.5 text-slate-400 hover:text-rose-600" title="Supprimer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button onClick={() => setEditRow(null)} className="px-4 py-2.5 text-xs font-black uppercase text-slate-500 hover:text-slate-700">Annuler</button>
              <button onClick={saveEdit} disabled={saving} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase rounded-xl transition flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {scannerOpen && editRow && (
        <DocumentScanner
          subjectName={editRow.nom}
          docTypes={STAFF_DOC_TYPES}
          notifyCopy="Le document sera associé à la fiche du membre du personnel."
          onCapture={handleDocCapture}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  );
};

export default GestionPersonnel;
