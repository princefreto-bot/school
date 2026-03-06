// ============================================================
// PAGE ÉLÈVES — Liste, filtres, import, ajout, CRUD
// ============================================================
import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Student } from '../types';
import { CLASS_CONFIG } from '../data/classConfig';
import { importFromExcel } from '../utils/excelImport';
import { generateRecuPDF } from '../utils/pdfGenerator';
import {
  Search, Upload, Plus, Trash2, Edit2, FileText,
  MessageCircle, ChevronUp, ChevronDown, X, Check,
  AlertTriangle, Download, Filter,
} from 'lucide-react';
import { StudentDetail } from '../components/StudentDetail';

const fmtMoney = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' F';

// ── Badge statut ─────────────────────────────────────────────
const StatusBadge: React.FC<{ status: Student['status'] }> = ({ status }) => {
  const map: Record<string, string> = {
    'Soldé': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Partiel': 'bg-amber-100 text-amber-700 border-amber-200',
    'Non soldé': 'bg-red-100 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] ?? ''}`}>
      {status === 'Soldé' && <Check className="w-3 h-3 mr-1" />}
      {status === 'Partiel' && <span className="mr-1">≥70%</span>}
      {status}
    </span>
  );
};

// ── Modale Ajout/Édition ─────────────────────────────────────
interface ModalProps { student?: Student | null; onClose: () => void }

const StudentModal: React.FC<ModalProps> = ({ student, onClose }) => {
  const addStudent = useStore((s) => s.addStudent);
  const updateStudent = useStore((s) => s.updateStudent);

  const [form, setForm] = useState({
    nom: student?.nom ?? '',
    prenom: student?.prenom ?? '',
    classe: student?.classe ?? CLASS_CONFIG[0].name,
    telephone: student?.telephone ?? '+228',
    sexe: (student?.sexe ?? 'M') as 'M' | 'F',
    redoublant: student?.redoublant ?? false,
    ecoleProvenance: student?.ecoleProvenance ?? '',
    dejaPaye: student?.dejaPaye ?? 0,
    recu: student?.recu ?? '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (student) {
      updateStudent(student.id, form);
    } else {
      addStudent(form);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {student ? "Modifier l'élève" : 'Ajouter un élève'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom *</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Prénom *</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Classe *</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={form.classe} onChange={(e) => setForm({ ...form, classe: e.target.value })}>
                {CLASS_CONFIG.map((c) => <option key={c.name} value={c.name}>{c.name} — {c.cycle} ({new Intl.NumberFormat('fr-FR').format(c.ecolage)} F)</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sexe</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={form.sexe} onChange={(e) => setForm({ ...form, sexe: e.target.value as 'M' | 'F' })}>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone parent</label>
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="+228XXXXXXXX" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">École de provenance</label>
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={form.ecoleProvenance} onChange={(e) => setForm({ ...form, ecoleProvenance: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Montant payé (FCFA)</label>
              <input type="number" min={0} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={form.dejaPaye} onChange={(e) => setForm({ ...form, dejaPaye: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">N° Reçu</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={form.recu} onChange={(e) => setForm({ ...form, recu: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="redoub" checked={form.redoublant} onChange={(e) => setForm({ ...form, redoublant: e.target.checked })} className="rounded" />
            <label htmlFor="redoub" className="text-sm text-gray-700">Redoublant</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Annuler</button>
            <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
              {student ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Bouton WhatsApp ──────────────────────────────────────────
const WhatsAppBtn: React.FC<{ student: Student; schoolName: string }> = ({ student, schoolName }) => {
  const taux = Math.round((student.dejaPaye / student.ecolage) * 100);
  const msg = student.restant <= 0
    ? `Bonjour, parent de ${student.prenom} ${student.nom} (${student.classe}). Nous vous felicitons d'avoir solde la scolarite (${new Intl.NumberFormat('fr-FR').format(student.ecolage)} FCFA). Merci ! — ${schoolName}`
    : `Bonjour, parent de ${student.prenom} ${student.nom} (${student.classe}). Solde restant : ${new Intl.NumberFormat('fr-FR').format(student.restant)} FCFA (paye : ${taux}%). Merci de regulariser. — ${schoolName}`;

  const phone = student.telephone.replace(/\D/g, '');
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors"
      title="Envoyer sur WhatsApp"
    >
      <MessageCircle className="w-3 h-3" />
      <span className="hidden sm:inline">WA</span>
    </a>
  );
};

// ── PAGE PRINCIPALE ──────────────────────────────────────────
type SortKey = 'nom' | 'classe' | 'dejaPaye' | 'restant' | 'status';

export const Eleves: React.FC = () => {
  const students = useStore((s) => s.students);
  const deleteStudent = useStore((s) => s.deleteStudent);
  const setStudents = useStore((s) => s.setStudents);
  const searchQuery = useStore((s) => s.searchQuery);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const filterClasse = useStore((s) => s.filterClasse);
  const setFilterClasse = useStore((s) => s.setFilterClasse);
  const filterCycle = useStore((s) => s.filterCycle);
  const setFilterCycle = useStore((s) => s.setFilterCycle);
  const filterStatus = useStore((s) => s.filterStatus);
  const setFilterStatus = useStore((s) => s.setFilterStatus);
  const selectedStudent = useStore((s) => s.selectedStudent);
  const setSelectedStudent = useStore((s) => s.setSelectedStudent);
  const schoolName = useStore((s) => s.schoolName);
  const schoolYear = useStore((s) => s.schoolYear);
  const messageRemerciement = useStore((s) => s.messageRemerciement);
  const messageRappel = useStore((s) => s.messageRappel);
  const user = useStore((s) => s.user);

  const [modal, setModal] = useState<{ open: boolean; student?: Student | null }>({ open: false });
  const [sortKey, setSortKey] = useState<SortKey>('nom');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg('');
    try {
      const imported = await importFromExcel(file);
      setStudents(imported);
      setImportMsg(`OK ${imported.length} élèves importés avec succès.`);
    } catch {
      setImportMsg('ERR Erreur lors de l\'importation. Vérifiez le fichier Excel.');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const filtered = useMemo(() => {
    let list = [...students];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) =>
        s.nom.toLowerCase().includes(q) ||
        s.prenom.toLowerCase().includes(q) ||
        s.classe.toLowerCase().includes(q) ||
        s.telephone.includes(q)
      );
    }
    if (filterClasse) list = list.filter((s) => s.classe === filterClasse);
    if (filterCycle) list = list.filter((s) => s.cycle === filterCycle);
    if (filterStatus) list = list.filter((s) => s.status === filterStatus);

    list.sort((a, b) => {
      const va = String(a[sortKey] ?? '').toLowerCase();
      const vb = String(b[sortKey] ?? '').toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [students, searchQuery, filterClasse, filterCycle, filterStatus, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null;

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) { deleteStudent(id); setDeleteConfirm(null); }
    else setDeleteConfirm(id);
  };

  const classes = [...new Set(CLASS_CONFIG.map((c) => c.name))];
  const isOk = (msg: string) => msg.startsWith('OK');

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Rechercher un élève, classe, téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearchQuery('')}>
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
        <button onClick={() => setShowFilters((f) => !f)} className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
          <Filter className="w-4 h-4" /> Filtres
        </button>
        {(user?.role === 'directeur' || user?.role === 'comptable') && (
          <>
            <button onClick={() => setModal({ open: true })} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Ajouter
            </button>
            <label className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer">
              <Upload className="w-4 h-4" />
              {importing ? 'Import...' : 'Import Excel'}
              <input type="file" accept=".xlsx,.xls" className="hidden" ref={fileRef} onChange={handleImport} />
            </label>
          </>
        )}
      </div>

      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3">
          <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={filterCycle} onChange={(e) => setFilterCycle(e.target.value)}>
            <option value="">Tous les cycles</option>
            <option>Primaire</option><option>Collège</option><option>Lycée</option>
          </select>
          <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={filterClasse} onChange={(e) => setFilterClasse(e.target.value)}>
            <option value="">Toutes les classes</option>
            {classes.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option>Soldé</option><option>Partiel</option><option>Non soldé</option>
          </select>
          {(filterClasse || filterCycle || filterStatus) && (
            <button onClick={() => { setFilterClasse(''); setFilterCycle(''); setFilterStatus(''); }} className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors">
              <X className="w-3 h-3" /> Réinitialiser
            </button>
          )}
        </div>
      )}

      {importMsg && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${isOk(importMsg) ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {isOk(importMsg) ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {importMsg.slice(3)}
          <button className="ml-auto" onClick={() => setImportMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{filtered.length} élève{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''} sur {students.length}</p>
        {filtered.length > 0 && (
          <p className="text-sm text-gray-500">
            Total perçu : <strong className="text-emerald-700">{new Intl.NumberFormat('fr-FR').format(filtered.reduce((a, s) => a + s.dejaPaye, 0))} FCFA</strong>
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  { key: 'nom' as SortKey, label: 'Élève' },
                  { key: 'classe' as SortKey, label: 'Classe' },
                  { key: null, label: 'Téléphone' },
                  { key: 'dejaPaye' as SortKey, label: 'Payé' },
                  { key: 'restant' as SortKey, label: 'Restant' },
                  { key: 'status' as SortKey, label: 'Statut' },
                  { key: null, label: 'Actions' },
                ].map((col) => (
                  <th
                    key={col.label}
                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap ${col.key ? 'cursor-pointer hover:text-gray-900 select-none' : ''}`}
                    onClick={() => col.key && toggleSort(col.key)}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {col.key && <SortIcon k={col.key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    Aucun élève trouvé.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{s.prenom} {s.nom}</p>
                      <p className="text-xs text-gray-400">{s.sexe === 'M' ? '♂' : '♀'}{s.redoublant ? ' · Redoublant' : ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">{s.classe}</span>
                      <p className="text-xs text-gray-400">{s.cycle}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{s.telephone}</td>
                    <td className="px-4 py-3 font-medium text-emerald-700 whitespace-nowrap">{fmtMoney(s.dejaPaye)}</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {s.restant <= 0 ? <span className="text-emerald-600 font-semibold">SOLDÉ</span> : <span className="text-red-600">{fmtMoney(s.restant)}</span>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelectedStudent(s)} className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors" title="Fiche détaillée">
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => generateRecuPDF(s, schoolName, schoolYear, messageRemerciement, messageRappel)} className="p-1.5 hover:bg-violet-100 rounded-lg text-violet-600 transition-colors" title="Reçu PDF">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <WhatsAppBtn student={s} schoolName={schoolName} />
                        {(user?.role === 'directeur' || user?.role === 'comptable') && (
                          <>
                            <button onClick={() => setModal({ open: true, student: s })} className="p-1.5 hover:bg-amber-100 rounded-lg text-amber-600 transition-colors" title="Modifier">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(s.id)} className={`p-1.5 rounded-lg transition-colors ${deleteConfirm === s.id ? 'bg-red-100 text-red-700' : 'hover:bg-red-100 text-red-500'}`} title={deleteConfirm === s.id ? 'Confirmer' : 'Supprimer'}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex flex-wrap gap-4 text-xs text-gray-600">
            <span>Écolage total : <strong>{new Intl.NumberFormat('fr-FR').format(filtered.reduce((a, s) => a + s.ecolage, 0))} FCFA</strong></span>
            <span>Payé : <strong className="text-emerald-700">{new Intl.NumberFormat('fr-FR').format(filtered.reduce((a, s) => a + s.dejaPaye, 0))} FCFA</strong></span>
            <span>Restant : <strong className="text-red-600">{new Intl.NumberFormat('fr-FR').format(filtered.reduce((a, s) => a + s.restant, 0))} FCFA</strong></span>
            <span className="ml-auto">
              Soldés : <strong className="text-emerald-700">{filtered.filter((s) => s.status === 'Soldé').length}</strong> / Non soldés : <strong className="text-red-600">{filtered.filter((s) => s.status !== 'Soldé').length}</strong>
            </span>
          </div>
        )}
      </div>

      {modal.open && <StudentModal student={modal.student} onClose={() => setModal({ open: false })} />}

      {/* Fiche détaillée */}
      {selectedStudent && (
        <StudentDetail
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};
