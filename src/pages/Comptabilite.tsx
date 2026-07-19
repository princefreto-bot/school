// ============================================================
// PAGE COMPTABILITÉ — Dépenses, Balance, Bilan, Compte de résultat
// ============================================================
import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL } from '../config';
import { getAuthHeaders, parseResponse } from '../services/apiHelpers';
import {
  Landmark, Wallet, Loader2, Send, Camera, AlertCircle, CheckCircle,
  Download, Sparkles
} from 'lucide-react';

const fmtMoney = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA';

interface Account {
  id: string;
  code: string;
  name: string;
  type: 'actif' | 'passif' | 'capitaux_propres' | 'produit' | 'charge';
}

interface BalanceRow {
  accountId: string;
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
  balance: number;
}

interface StatementRow {
  code: string;
  name: string;
  amount: number;
}

type Tab = 'depenses' | 'balance' | 'bilan' | 'resultat';

export const Comptabilite: React.FC = () => {
  const [tab, setTab] = useState<Tab>('depenses');
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Dépenses
  const [entries, setEntries] = useState<any[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'caisse' | 'banque'>('caisse');
  const [description, setDescription] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Balance
  const [balanceRows, setBalanceRows] = useState<BalanceRow[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Bilan
  const [bilan, setBilan] = useState<{ actif: StatementRow[]; passif: StatementRow[]; capitauxPropres: StatementRow[]; totalActif: number; totalPassifEtCapitaux: number } | null>(null);
  const [loadingBilan, setLoadingBilan] = useState(false);

  // Compte de résultat
  const [resultat, setResultat] = useState<{ produits: StatementRow[]; charges: StatementRow[]; totalProduits: number; totalCharges: number; resultatNet: number } | null>(null);
  const [loadingResultat, setLoadingResultat] = useState(false);

  const chargeAccounts = accounts.filter(a => a.type === 'charge');

  const loadAccounts = async () => {
    const res = await fetch(`${API_BASE_URL}/accounting/accounts`, { headers: getAuthHeaders() });
    if (res.ok) setAccounts(await parseResponse(res));
  };

  const loadEntries = async () => {
    setLoadingEntries(true);
    try {
      const res = await fetch(`${API_BASE_URL}/accounting/entries`, { headers: getAuthHeaders() });
      if (res.ok) setEntries(await parseResponse(res));
    } finally {
      setLoadingEntries(false);
    }
  };

  const loadBalance = async () => {
    setLoadingBalance(true);
    try {
      const res = await fetch(`${API_BASE_URL}/accounting/balance`, { headers: getAuthHeaders() });
      if (res.ok) setBalanceRows((await parseResponse(res)).rows || []);
    } finally {
      setLoadingBalance(false);
    }
  };

  const loadBilan = async () => {
    setLoadingBilan(true);
    try {
      const res = await fetch(`${API_BASE_URL}/accounting/bilan`, { headers: getAuthHeaders() });
      if (res.ok) setBilan(await parseResponse(res));
    } finally {
      setLoadingBilan(false);
    }
  };

  const loadResultat = async () => {
    setLoadingResultat(true);
    try {
      const res = await fetch(`${API_BASE_URL}/accounting/compte-resultat`, { headers: getAuthHeaders() });
      if (res.ok) setResultat(await parseResponse(res));
    } finally {
      setLoadingResultat(false);
    }
  };

  useEffect(() => {
    loadAccounts();
    loadEntries();
  }, []);

  useEffect(() => {
    if (tab === 'balance' && balanceRows.length === 0) loadBalance();
    if (tab === 'bilan' && !bilan) loadBilan();
    if (tab === 'resultat' && !resultat) loadResultat();
  }, [tab]);

  const handleProofCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadstart = () => setUploadingProof(true);
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await fetch(`${API_BASE_URL}/accounting/expenses/upload-proof`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ imageBase64: base64 })
        });
        const data = await parseResponse(res);
        if (res.ok && data.success) setProofUrl(data.proofUrl);
        else setErrorMsg(data.error || 'Erreur lors de l\'envoi de la preuve.');
      } catch (err) {
        setErrorMsg('Erreur lors de l\'envoi de la preuve.');
      } finally {
        setUploadingProof(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0 || !accountId || !description.trim()) {
      setErrorMsg('Veuillez renseigner le montant, la catégorie et une description.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/accounting/expenses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          amount: amountNum,
          accountId,
          description: description.trim(),
          paymentMethod,
          proofUrl: proofUrl || null
        })
      });
      const data = await parseResponse(res);
      if (res.ok) {
        setSuccessMsg('Dépense enregistrée avec succès.');
        setAmount('');
        setAccountId('');
        setDescription('');
        setProofUrl('');
        await loadEntries();
      } else {
        setErrorMsg(data.error || 'Erreur lors de l\'enregistrement de la dépense.');
      }
    } catch (err) {
      setErrorMsg('Erreur réseau.');
    } finally {
      setSubmitting(false);
    }
  };

  const expenseEntries = entries.filter(e => e.reference === 'DEPENSE');

  const exportBalancePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Balance Comptable', 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [['Code', 'Compte', 'Type', 'Débit', 'Crédit', 'Solde']],
      body: balanceRows.map(r => [r.code, r.name, r.type, fmtMoney(r.debit), fmtMoney(r.credit), fmtMoney(r.balance)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] }
    });
    doc.save('Balance_Comptable.pdf');
  };

  const exportBilanPDF = () => {
    if (!bilan) return;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Bilan au ${new Date().toLocaleDateString('fr-FR')}`, 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [['Actif', 'Montant']],
      body: bilan.actif.map(r => [r.name, fmtMoney(r.amount)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 185, 129] },
      foot: [['Total Actif', fmtMoney(bilan.totalActif)]]
    });
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Passif & Capitaux Propres', 'Montant']],
      body: [...bilan.passif, ...bilan.capitauxPropres].map(r => [r.name, fmtMoney(r.amount)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [244, 63, 94] },
      foot: [['Total Passif & Capitaux', fmtMoney(bilan.totalPassifEtCapitaux)]]
    });
    doc.save('Bilan.pdf');
  };

  const exportResultatPDF = () => {
    if (!resultat) return;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Compte de Résultat', 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [['Produits', 'Montant']],
      body: resultat.produits.map(r => [r.name, fmtMoney(r.amount)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 185, 129] },
      foot: [['Total Produits', fmtMoney(resultat.totalProduits)]]
    });
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Charges', 'Montant']],
      body: resultat.charges.map(r => [r.name, fmtMoney(r.amount)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [244, 63, 94] },
      foot: [['Total Charges', fmtMoney(resultat.totalCharges)]]
    });
    doc.text(`Résultat Net : ${fmtMoney(resultat.resultatNet)}`, 14, (doc as any).lastAutoTable.finalY + 15);
    doc.save('Compte_Resultat.pdf');
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'depenses', label: 'Dépenses' },
    { id: 'balance', label: 'Balance' },
    { id: 'bilan', label: 'Bilan' },
    { id: 'resultat', label: 'Compte de résultat' }
  ];

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto animate-slideUp">
      {/* ── HEADER ── */}
      <div className="relative pro-card p-8 overflow-hidden group bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-indigo-100 dark:border-indigo-900/30">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
          <Landmark className="w-64 h-64 text-indigo-500" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500 text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <Sparkles className="w-3.5 h-3.5" /> Comptabilité en partie double
          </div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-indigo-600">Comptabilité</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
            Chaque paiement de scolarité est comptabilisé automatiquement. Enregistrez vos dépenses ici pour obtenir votre balance, votre bilan et votre compte de résultat en temps réel.
          </p>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-2 p-1.5 bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 rounded-2xl w-full sm:w-fit overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition shrink-0 ${
              tab === t.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── DÉPENSES ── */}
      {tab === 'depenses' && (
        <div className="space-y-6">
          <form onSubmit={handleSubmitExpense} className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8">
            <h3 className="font-black text-slate-800 dark:text-slate-200 text-lg mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-500" />
              Enregistrer une dépense
            </h3>

            {errorMsg && (
              <div className="mb-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl p-3 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                {successMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Montant (FCFA)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ex: 25000"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Catégorie</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                >
                  <option value="">Sélectionner...</option>
                  {chargeAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Achat fournitures de bureau"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Mode de paiement</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'caisse' | 'banque')}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                >
                  <option value="caisse">Caisse</option>
                  <option value="banque">Banque</option>
                </select>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Justificatif (optionnel)</label>
              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-indigo-500 transition-colors">
                <input type="file" accept="image/*" className="hidden" onChange={handleProofCapture} disabled={uploadingProof} />
                {uploadingProof ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> : <Camera className="w-4 h-4 text-indigo-500" />}
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {proofUrl ? '✅ Justificatif joint' : 'Cliquer pour joindre une image'}
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || uploadingProof}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase rounded-xl transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enregistrer la dépense
            </button>
          </form>

          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Historique des dépenses</h3>
              <span className="px-4 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                {expenseEntries.length} dépense{expenseEntries.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.1em] border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4 text-right">Montant</th>
                    <th className="px-6 py-4 text-right">Preuve</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {loadingEntries ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400"><Loader2 className="w-4 h-4 animate-spin inline" /></td></tr>
                  ) : expenseEntries.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-16 text-center text-slate-400 text-sm font-medium">Aucune dépense enregistrée.</td></tr>
                  ) : (
                    expenseEntries.map((e) => {
                      const chargeLine = e.lines.find((l: any) => l.debit > 0);
                      return (
                        <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400">{new Date(e.date).toLocaleDateString('fr-FR')}</td>
                          <td className="px-6 py-4 text-xs text-slate-700 dark:text-slate-300">{e.description}</td>
                          <td className="px-6 py-4 text-right text-sm font-black text-rose-600 dark:text-rose-400">{fmtMoney(chargeLine?.debit || 0)}</td>
                          <td className="px-6 py-4 text-right">
                            {e.proof_url && (
                              <a href={e.proof_url} target="_blank" rel="noreferrer" className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline">Voir</a>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── BALANCE ── */}
      {tab === 'balance' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <Wallet className="w-6 h-6 text-indigo-500" /> Balance comptable
            </h3>
            <button onClick={exportBalancePDF} disabled={balanceRows.length === 0} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition disabled:opacity-40">
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.1em] border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4">Compte</th>
                  <th className="px-6 py-4 text-right">Débit</th>
                  <th className="px-6 py-4 text-right">Crédit</th>
                  <th className="px-6 py-4 text-right">Solde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {loadingBalance ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400"><Loader2 className="w-4 h-4 animate-spin inline" /></td></tr>
                ) : balanceRows.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-16 text-center text-slate-400 text-sm font-medium">Aucun mouvement pour le moment.</td></tr>
                ) : (
                  balanceRows.map((r) => (
                    <tr key={r.accountId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">{r.code} — {r.name}</td>
                      <td className="px-6 py-4 text-right text-xs text-slate-600 dark:text-slate-400">{fmtMoney(r.debit)}</td>
                      <td className="px-6 py-4 text-right text-xs text-slate-600 dark:text-slate-400">{fmtMoney(r.credit)}</td>
                      <td className="px-6 py-4 text-right text-sm font-black text-slate-900 dark:text-white">{fmtMoney(r.balance)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── BILAN ── */}
      {tab === 'bilan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Actif</h3>
              <button onClick={exportBilanPDF} disabled={!bilan} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition disabled:opacity-40">
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
            {loadingBilan ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : (
              <div className="space-y-2">
                {(bilan?.actif || []).map((r, i) => (
                  <div key={i} className="flex justify-between text-xs py-2 border-b border-slate-50 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">{r.name}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{fmtMoney(r.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-black pt-3">
                  <span>Total Actif</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{fmtMoney(bilan?.totalActif || 0)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Passif & Capitaux Propres</h3>
            {loadingBilan ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : (
              <div className="space-y-2">
                {[...(bilan?.passif || []), ...(bilan?.capitauxPropres || [])].map((r, i) => (
                  <div key={i} className="flex justify-between text-xs py-2 border-b border-slate-50 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">{r.name}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{fmtMoney(r.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-black pt-3">
                  <span>Total Passif & Capitaux</span>
                  <span className="text-rose-600 dark:text-rose-400">{fmtMoney(bilan?.totalPassifEtCapitaux || 0)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── COMPTE DE RÉSULTAT ── */}
      {tab === 'resultat' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Compte de résultat</h3>
            <button onClick={exportResultatPDF} disabled={!resultat} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition disabled:opacity-40">
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
          {loadingResultat ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 mb-3">Produits</h4>
                {(resultat?.produits || []).map((r, i) => (
                  <div key={i} className="flex justify-between text-xs py-2 border-b border-slate-50 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">{r.name}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{fmtMoney(r.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-black pt-3">
                  <span>Total</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{fmtMoney(resultat?.totalProduits || 0)}</span>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-rose-600 dark:text-rose-400 mb-3">Charges</h4>
                {(resultat?.charges || []).map((r, i) => (
                  <div key={i} className="flex justify-between text-xs py-2 border-b border-slate-50 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">{r.name}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{fmtMoney(r.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-black pt-3">
                  <span>Total</span>
                  <span className="text-rose-600 dark:text-rose-400">{fmtMoney(resultat?.totalCharges || 0)}</span>
                </div>
              </div>
              <div className="md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-sm font-black text-slate-900 dark:text-white">Résultat Net</span>
                <span className={`text-xl font-black ${(resultat?.resultatNet || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {fmtMoney(resultat?.resultatNet || 0)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
