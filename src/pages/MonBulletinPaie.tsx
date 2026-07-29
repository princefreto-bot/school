// ============================================================
// MON BULLETIN DE PAIE — Espace salarié (accès protégé par mot de passe)
// Le personnel sélectionne son nom puis saisit le mot de passe de sa
// fiche pour consulter et imprimer ses propres bulletins.
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { API_BASE_URL } from '../config';
import { getAuthHeaders, parseResponse } from '../services/apiHelpers';
import { useStore } from '../store/useStore';
import { BulletinPaiePDF } from '../components/pdf/BulletinPaiePDF';
import { Wallet, Lock, Loader2, Printer, AlertTriangle, ShieldCheck, ArrowLeft } from 'lucide-react';

const fmtMoney = (n: number, c = 'FCFA') =>
  `${new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))} ${c}`;

interface Payslip {
  id: string;
  personnel_id: string;
  periode: string;
  salaire_base: number;
  primes: { label: string; montant: number }[];
  retenues: { label: string; montant: number }[];
  personnes_a_charge: number;
  cnss_salarial: number;
  cnss_patronal: number;
  amu_salarial: number;
  amu_patronal: number;
  irpp: number;
  net_a_payer: number;
  generated_at: string;
  fonction?: string | null;
  matricule?: string | null;
  numero_cnss?: string | null;
  date_embauche?: string | null;
  mode_paiement?: string | null;
  compte_bancaire?: string | null;
  departement?: string | null;
}

interface RosterEntry { id: string; nom: string; role: string }

export const MonBulletinPaie: React.FC = () => {
  const {
    schoolName, schoolLogo, schoolAddress, schoolBp,
    schoolTelephone, schoolCurrency,
    schoolIfu, schoolRccm, schoolNif, schoolEmail,
  } = useStore();

  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [unlocked, setUnlocked] = useState(false);
  const [me, setMe] = useState<RosterEntry | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);

  useEffect(() => {
    (async () => {
      setLoadingRoster(true);
      try {
        const res = await fetch(`${API_BASE_URL}/payroll/self/roster`, { headers: getAuthHeaders() });
        if (res.ok) setRoster(await parseResponse(res));
      } finally {
        setLoadingRoster(false);
      }
    })();
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedId || !password) {
      setError('Sélectionnez votre nom et saisissez votre mot de passe.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/payroll/self/payslips`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ personnelId: selectedId, password }),
      });
      const data = await parseResponse(res);
      if (res.ok) {
        setMe(data.personnel);
        setPayslips(data.payslips || []);
        setUnlocked(true);
        setPassword('');
      } else {
        setError(data.error || 'Accès refusé.');
      }
    } catch {
      setError('Erreur réseau.');
    } finally {
      setSubmitting(false);
    }
  };

  const lock = () => {
    setUnlocked(false);
    setMe(null);
    setPayslips([]);
    setSelectedId('');
  };

  // ── Impression ──
  const printRef = useRef<HTMLDivElement>(null);
  const [printSlip, setPrintSlip] = useState<Payslip | null>(null);
  const [printNonce, setPrintNonce] = useState(0);
  const doPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printSlip ? `Bulletin_${(me?.nom || 'salarie').replace(/\s+/g, '_')}_${printSlip.periode}` : 'Bulletin_de_paie',
    pageStyle: `@page { size: A4 portrait; margin: 0; } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`,
  });
  const printPayslip = (p: Payslip) => { setPrintSlip(p); setPrintNonce((n) => n + 1); };
  useEffect(() => {
    if (printSlip && printNonce) doPrint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printNonce]);

  // ── Écran de déverrouillage ──
  if (!unlocked) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400 mb-2">
              <Wallet className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Mon bulletin de paie</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              Sélectionnez votre nom et saisissez votre mot de passe personnel pour accéder à vos bulletins.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl p-3 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Votre nom</label>
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} disabled={loadingRoster}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                <option value="">{loadingRoster ? 'Chargement…' : 'Sélectionner…'}</option>
                {roster.map((r) => <option key={r.id} value={r.id}>{r.nom} — {r.role}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
            </div>
            <button type="submit" disabled={submitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase rounded-xl transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Accéder à mes bulletins
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Liste des bulletins du salarié ──
  return (
    <div className="space-y-6 pb-20 max-w-[1000px] mx-auto animate-slideUp">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Wallet className="w-6 h-6 text-indigo-500" />
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Mes bulletins de paie</h3>
            <p className="text-[11px] text-slate-400 font-medium">{me?.nom} — {me?.role}</p>
          </div>
          <button onClick={lock} className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Verrouiller
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.1em] border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4">Période</th>
                <th className="px-6 py-4 text-right">Net à payer</th>
                <th className="px-6 py-4 text-right">Bulletin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {payslips.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-16 text-center text-slate-400 text-sm font-medium">Aucun bulletin disponible pour le moment.</td></tr>
              ) : (
                payslips.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-200">{p.periode}</td>
                    <td className="px-6 py-4 text-right text-sm font-black text-slate-900 dark:text-white">{fmtMoney(p.net_a_payer, schoolCurrency)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => printPayslip(p)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition ml-auto">
                        <Printer className="w-3.5 h-3.5" /> Bulletin
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conteneur d'impression (hors écran) */}
      <div className="hidden">
        <div ref={printRef}>
          {printSlip && (
            <BulletinPaiePDF
              data={printSlip}
              currency={schoolCurrency || 'FCFA'}
              employer={{
                name: schoolName, logo: schoolLogo, address: schoolAddress, bp: schoolBp,
                telephone: schoolTelephone, email: schoolEmail, ifu: schoolIfu, rccm: schoolRccm, nif: schoolNif,
              }}
              employee={{
                nom: me?.nom || '',
                fonction: printSlip.fonction || me?.role,
                matricule: printSlip.matricule || undefined,
                departement: printSlip.departement || undefined,
                cnss: printSlip.numero_cnss || undefined,
                dateEmbauche: printSlip.date_embauche ? new Date(printSlip.date_embauche).toLocaleDateString('fr-FR') : undefined,
                modePaiement: printSlip.mode_paiement || undefined,
                compteBancaire: printSlip.compte_bancaire || undefined,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MonBulletinPaie;
