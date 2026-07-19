// ============================================================
// PAGE PAIE — Salaires du personnel, bulletins, cotisations
// ============================================================
import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL } from '../config';
import { getAuthHeaders, parseResponse } from '../services/apiHelpers';
import {
  Wallet, Loader2, Send, AlertTriangle, CheckCircle, Download,
  Sparkles, Plus, X, Users
} from 'lucide-react';

const fmtMoney = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA';

interface StaffMember {
  id: string;
  nom: string;
  role: string;
  salaireBase: number | null;
  dateEffet: string | null;
}

interface Ligne { label: string; montant: number }

interface Payslip {
  id: string;
  personnel_id: string;
  periode: string;
  salaire_base: number;
  primes: Ligne[];
  retenues: Ligne[];
  personnes_a_charge: number;
  cnss_salarial: number;
  cnss_patronal: number;
  amu_salarial: number;
  amu_patronal: number;
  irpp: number;
  net_a_payer: number;
  generated_at: string;
  personnel?: { nom: string; role: string };
}

const currentPeriode = () => new Date().toISOString().slice(0, 7);

export const Paie: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [loadingPayslips, setLoadingPayslips] = useState(true);
  const [sourceNote, setSourceNote] = useState('');

  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [salaireBase, setSalaireBase] = useState('');
  const [periode, setPeriode] = useState(currentPeriode());
  const [personnesACharge, setPersonnesACharge] = useState('0');
  const [primes, setPrimes] = useState<Ligne[]>([]);
  const [retenues, setRetenues] = useState<Ligne[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadStaff = async () => {
    setLoadingStaff(true);
    try {
      const res = await fetch(`${API_BASE_URL}/payroll/staff`, { headers: getAuthHeaders() });
      if (res.ok) setStaff(await parseResponse(res));
    } finally {
      setLoadingStaff(false);
    }
  };

  const loadPayslips = async () => {
    setLoadingPayslips(true);
    try {
      const res = await fetch(`${API_BASE_URL}/payroll/payslips`, { headers: getAuthHeaders() });
      if (res.ok) setPayslips(await parseResponse(res));
    } finally {
      setLoadingPayslips(false);
    }
  };

  const loadConfig = async () => {
    const res = await fetch(`${API_BASE_URL}/payroll/config`, { headers: getAuthHeaders() });
    if (res.ok) {
      const data = await parseResponse(res);
      setSourceNote(data.source_note || '');
    }
  };

  useEffect(() => {
    loadStaff();
    loadPayslips();
    loadConfig();
  }, []);

  useEffect(() => {
    const s = staff.find((x) => x.id === selectedStaffId);
    setSalaireBase(s?.salaireBase ? String(s.salaireBase) : '');
  }, [selectedStaffId]);

  const addLigne = (setter: React.Dispatch<React.SetStateAction<Ligne[]>>) => {
    setter((prev) => [...prev, { label: '', montant: 0 }]);
  };
  const updateLigne = (setter: React.Dispatch<React.SetStateAction<Ligne[]>>, idx: number, field: 'label' | 'montant', value: string) => {
    setter((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: field === 'montant' ? Number(value) || 0 : value } : l)));
  };
  const removeLigne = (setter: React.Dispatch<React.SetStateAction<Ligne[]>>, idx: number) => {
    setter((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const salaireNum = Number(salaireBase);
    if (!selectedStaffId || !salaireNum || salaireNum <= 0) {
      setErrorMsg('Veuillez sélectionner un membre du personnel et renseigner un salaire de base.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/payroll/payslips`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          personnelId: selectedStaffId,
          periode,
          salaireBase: salaireNum,
          primes,
          retenues,
          personnesACharge: Number(personnesACharge) || 0
        })
      });
      const data = await parseResponse(res);
      if (res.ok) {
        setSuccessMsg('Bulletin généré avec succès.');
        setPrimes([]);
        setRetenues([]);
        await loadPayslips();
      } else {
        setErrorMsg(data.error || 'Erreur lors de la génération du bulletin.');
      }
    } catch (err) {
      setErrorMsg('Erreur réseau.');
    } finally {
      setSubmitting(false);
    }
  };

  const exportPayslipPDF = (p: Payslip) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Bulletin de Paie', 14, 18);
    doc.setFontSize(10);
    doc.text(`Employé : ${p.personnel?.nom || p.personnel_id}`, 14, 28);
    doc.text(`Fonction : ${p.personnel?.role || ''}`, 14, 34);
    doc.text(`Période : ${p.periode}`, 14, 40);

    const rows: (string | number)[][] = [
      ['Salaire de base', fmtMoney(p.salaire_base)],
      ...(p.primes || []).map((pr) => [`Prime — ${pr.label}`, fmtMoney(pr.montant)]),
      ['CNSS salarial', `-${fmtMoney(p.cnss_salarial)}`],
      ['AMU salarial', `-${fmtMoney(p.amu_salarial)}`],
      ['IRPP', `-${fmtMoney(p.irpp)}`],
      ...(p.retenues || []).map((r) => [`Retenue — ${r.label}`, `-${fmtMoney(r.montant)}`]),
      ['Net à payer', fmtMoney(p.net_a_payer)]
    ];

    autoTable(doc, {
      startY: 48,
      head: [['Élément', 'Montant']],
      body: rows,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [79, 70, 229] },
      didParseCell: (data) => {
        if (data.row.index === rows.length - 1 && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text(`Charges patronales : CNSS ${fmtMoney(p.cnss_patronal)} · AMU ${fmtMoney(p.amu_patronal)}`, 14, finalY);

    doc.save(`Bulletin_${(p.personnel?.nom || 'employe').replace(/\s+/g, '_')}_${p.periode}.pdf`);
  };

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto animate-slideUp">
      {/* ── HEADER ── */}
      <div className="relative pro-card p-8 overflow-hidden group bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-indigo-100 dark:border-indigo-900/30">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
          <Wallet className="w-64 h-64 text-indigo-500" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500 text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <Sparkles className="w-3.5 h-3.5" /> Paie du personnel
          </div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-indigo-600">Paie</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
            Calcul automatique des cotisations CNSS, AMU et de l'IRPP, génération de bulletins PDF. La gestion des comptes du personnel se fait dans Paramètres.
          </p>
        </div>
      </div>

      {sourceNote && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">{sourceNote}</p>
        </div>
      )}

      {/* ── PERSONNEL & SALAIRES DE BASE ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Users className="w-6 h-6 text-indigo-500" />
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Personnel</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.1em] border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4">Nom</th>
                <th className="px-6 py-4">Fonction</th>
                <th className="px-6 py-4 text-right">Salaire de base actuel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {loadingStaff ? (
                <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-400"><Loader2 className="w-4 h-4 animate-spin inline" /></td></tr>
              ) : staff.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-16 text-center text-slate-400 text-sm font-medium">Aucun membre du personnel.</td></tr>
              ) : (
                staff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-200">{s.nom}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 capitalize">{s.role}</td>
                    <td className="px-6 py-4 text-right text-sm font-black text-slate-900 dark:text-white">
                      {s.salaireBase ? fmtMoney(s.salaireBase) : <span className="text-slate-400 font-normal">Non défini</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── GÉNÉRER UN BULLETIN ── */}
      <form onSubmit={handleGenerate} className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8">
        <h3 className="font-black text-slate-800 dark:text-slate-200 text-lg mb-4 flex items-center gap-2">
          <Send className="w-5 h-5 text-indigo-500" />
          Générer un bulletin
        </h3>

        {errorMsg && (
          <div className="mb-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl p-3 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Employé</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            >
              <option value="">Sélectionner...</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.nom} — {s.role}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Période</label>
            <input
              type="month"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Personnes à charge</label>
            <input
              type="number"
              min={0}
              value={personnesACharge}
              onChange={(e) => setPersonnesACharge(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Salaire de base (FCFA)</label>
          <input
            type="number"
            value={salaireBase}
            onChange={(e) => setSalaireBase(e.target.value)}
            placeholder="Ex: 150000"
            className="w-full md:w-64 p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Primes */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Primes</label>
            <button type="button" onClick={() => addLigne(setPrimes)} className="flex items-center gap-1 text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline">
              <Plus className="w-3 h-3" /> Ajouter
            </button>
          </div>
          <div className="space-y-2">
            {primes.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="text" placeholder="Libellé (ex: Prime de transport)" value={l.label} onChange={(e) => updateLigne(setPrimes, i, 'label', e.target.value)} className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg text-xs" />
                <input type="number" placeholder="Montant" value={l.montant || ''} onChange={(e) => updateLigne(setPrimes, i, 'montant', e.target.value)} className="w-32 p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg text-xs" />
                <button type="button" onClick={() => removeLigne(setPrimes, i)} className="p-2 text-rose-400 hover:text-rose-600"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Retenues */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Retenues (avances, absences...)</label>
            <button type="button" onClick={() => addLigne(setRetenues)} className="flex items-center gap-1 text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline">
              <Plus className="w-3 h-3" /> Ajouter
            </button>
          </div>
          <div className="space-y-2">
            {retenues.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="text" placeholder="Libellé (ex: Avance sur salaire)" value={l.label} onChange={(e) => updateLigne(setRetenues, i, 'label', e.target.value)} className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg text-xs" />
                <input type="number" placeholder="Montant" value={l.montant || ''} onChange={(e) => updateLigne(setRetenues, i, 'montant', e.target.value)} className="w-32 p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg text-xs" />
                <button type="button" onClick={() => removeLigne(setRetenues, i)} className="p-2 text-rose-400 hover:text-rose-600"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase rounded-xl transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Générer le bulletin
        </button>
      </form>

      {/* ── HISTORIQUE ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Historique des bulletins</h3>
          <span className="px-4 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest">
            {payslips.length} bulletin{payslips.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.1em] border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4">Employé</th>
                <th className="px-6 py-4">Période</th>
                <th className="px-6 py-4 text-right">Net à payer</th>
                <th className="px-6 py-4 text-right">Bulletin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {loadingPayslips ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400"><Loader2 className="w-4 h-4 animate-spin inline" /></td></tr>
              ) : payslips.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-16 text-center text-slate-400 text-sm font-medium">Aucun bulletin généré pour le moment.</td></tr>
              ) : (
                payslips.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-200">{p.personnel?.nom || p.personnel_id}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{p.periode}</td>
                    <td className="px-6 py-4 text-right text-sm font-black text-slate-900 dark:text-white">{fmtMoney(p.net_a_payer)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => exportPayslipPDF(p)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition ml-auto">
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
