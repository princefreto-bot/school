// ============================================================
// PAGE PAIEMENTS — Historique & enregistrement de paiements
// ============================================================
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Student, Payment } from '../types';
import { CreditCard, Plus, X, Check, Search, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { CLASS_CONFIG } from '../data/classConfig';

const fmtMoney = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
const fmtDate  = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Modale ajout paiement ────────────────────────────────────
const PaymentModal: React.FC<{ student: Student; onClose: () => void }> = ({ student, onClose }) => {
  const addPayment = useStore((s) => s.addPayment);
  const [form, setForm] = useState({ montant: '', recu: '', note: '', date: new Date().toISOString().slice(0, 10) });
  const [error, setError] = useState('');

  const maxPay = student.restant;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const montant = Number(form.montant);
    if (!montant || montant <= 0) { setError('Montant invalide.'); return; }
    if (montant > maxPay) { setError(`Le montant dépasse le restant (${fmtMoney(maxPay)}).`); return; }
    addPayment(student.id, { montant, recu: form.recu, note: form.note, date: form.date });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Enregistrer un paiement</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 pt-4 pb-2 bg-blue-50 mx-5 mt-4 rounded-xl">
          <p className="text-sm font-semibold text-blue-900">{student.prenom} {student.nom} — {student.classe}</p>
          <div className="flex gap-4 mt-2 text-xs text-blue-700">
            <span>Écolage : <strong>{fmtMoney(student.ecolage)}</strong></span>
            <span>Déjà payé : <strong>{fmtMoney(student.dejaPaye)}</strong></span>
            <span>Restant : <strong className="text-red-600">{fmtMoney(student.restant)}</strong></span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Montant (FCFA) *</label>
            <input
              type="number" min={1} max={maxPay} required
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={`Max : ${fmtMoney(maxPay)}`}
              value={form.montant}
              onChange={(e) => { setForm({ ...form, montant: e.target.value }); setError(''); }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">N° Reçu</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={form.recu} onChange={(e) => setForm({ ...form, recu: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Note (optionnel)</label>
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Ex : 1ère tranche" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Annuler</button>
            <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> Valider
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Ligne d'historique d'un élève ─────────────────────────────
const StudentPaymentRow: React.FC<{ student: Student; onPay: (s: Student) => void }> = ({ student, onPay }) => {
  const [open, setOpen] = useState(false);
  const taux = Math.round((student.dejaPaye / student.ecolage) * 100);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 text-sm">{student.prenom} {student.nom}</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{student.classe}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              student.status === 'Soldé' ? 'bg-emerald-100 text-emerald-700' :
              student.status === 'Partiel' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
            }`}>{student.status}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-32">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${taux}%` }} />
            </div>
            <span className="text-xs text-gray-500">{taux}%</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500">{student.historiquesPaiements.length} paiement(s)</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-emerald-700">{new Intl.NumberFormat('fr-FR').format(student.dejaPaye)} F</p>
          <p className="text-xs text-red-500">{student.restant > 0 ? `- ${new Intl.NumberFormat('fr-FR').format(student.restant)} F` : 'SOLDÉ'}</p>
        </div>
        {student.restant > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onPay(student); }}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3 h-3" /> Payer
          </button>
        )}
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </div>

      {open && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
          {student.historiquesPaiements.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Aucun paiement enregistré manuellement.</p>
          ) : (
            <div className="space-y-2">
              {student.historiquesPaiements.map((p: Payment) => (
                <div key={p.id} className="flex items-center gap-3 text-xs">
                  <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                  <span className="text-gray-500">{fmtDate(p.date)}</span>
                  <span className="font-semibold text-emerald-700">+{new Intl.NumberFormat('fr-FR').format(p.montant)} FCFA</span>
                  {p.recu && <span className="text-gray-400">Reçu #{p.recu}</span>}
                  {p.note && <span className="text-gray-400 italic">{p.note}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── PAGE PRINCIPALE ──────────────────────────────────────────
export const Paiements: React.FC = () => {
  const students = useStore((s) => s.students);
  const [search, setSearch] = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [payModal, setPayModal] = useState<Student | null>(null);

  const filtered = useMemo(() => {
    let list = [...students];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => `${s.nom} ${s.prenom} ${s.classe}`.toLowerCase().includes(q));
    }
    if (filterClasse) list = list.filter((s) => s.classe === filterClasse);
    if (filterStatus) list = list.filter((s) => s.status === filterStatus);
    return list.sort((a, b) => a.nom.localeCompare(b.nom));
  }, [students, search, filterClasse, filterStatus]);

  const totalPaye    = filtered.reduce((a, s) => a + s.dejaPaye, 0);
  const totalRestant = filtered.reduce((a, s) => a + s.restant, 0);
  const totalPayements = filtered.reduce((a, s) => a + s.historiquesPaiements.length, 0);

  const classes = [...new Set(CLASS_CONFIG.map((c) => c.name))];

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Perçu</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{new Intl.NumberFormat('fr-FR').format(totalPaye)} F</p>
          <p className="text-xs text-gray-400 mt-1">Sur la sélection actuelle</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Restant</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{new Intl.NumberFormat('fr-FR').format(totalRestant)} F</p>
          <p className="text-xs text-gray-400 mt-1">À recouvrer</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Paiements enregistrés</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{totalPayements}</p>
          <p className="text-xs text-gray-400 mt-1">Transactions manuelles</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Rechercher un élève..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={filterClasse} onChange={(e) => setFilterClasse(e.target.value)}>
          <option value="">Toutes les classes</option>
          {classes.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option>Soldé</option><option>Partiel</option><option>Non soldé</option>
        </select>
        {(search || filterClasse || filterStatus) && (
          <button onClick={() => { setSearch(''); setFilterClasse(''); setFilterStatus(''); }} className="flex items-center gap-1 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl border border-red-100 transition-colors">
            <X className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {students.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucun élève enregistré</p>
          <p className="text-sm mt-1">Importez un fichier Excel ou ajoutez des élèves depuis la page Élèves.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">{filtered.length} élève(s) — Cliquez sur une ligne pour voir l'historique</p>
          <div className="space-y-2">
            {filtered.map((s) => (
              <StudentPaymentRow key={s.id} student={s} onPay={setPayModal} />
            ))}
          </div>
        </>
      )}

      {payModal && <PaymentModal student={payModal} onClose={() => setPayModal(null)} />}
    </div>
  );
};
