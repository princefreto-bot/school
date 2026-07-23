// ============================================================
// PAGE RETRAITS — Ristournes de l'école (700 F / élève soldé)
// ============================================================
import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import { getAuthHeaders, parseResponse } from '../services/apiHelpers';
import {
  Wallet, TrendingUp, Clock, CheckCircle, XCircle, Camera,
  Loader2, Send, ExternalLink, Sparkles, AlertCircle
} from 'lucide-react';
import { SchoolLicenseRevenuePanel } from '../components/SchoolLicenseRevenuePanel';

const fmtMoney = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

interface Balance {
  totalEarned: number;
  totalWithdrawn: number;
  totalPending: number;
  availableBalance: number;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  recipient_name: string;
  recipient_phone: string;
  proof_image_url: string | null;
  admin_proof_image_url: string | null;
  created_at: string;
}

function statusBadge(status: Withdrawal['status']) {
  const map = {
    pending: { label: 'En attente', className: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400', icon: Clock },
    approved: { label: 'Approuvé', className: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400', icon: CheckCircle },
    rejected: { label: 'Rejeté', className: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400', icon: XCircle }
  } as const;
  const { label, className, icon: Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

export const Retraits: React.FC = () => {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [history, setHistory] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [balanceRes, historyRes] = await Promise.all([
        fetch(`${API_BASE_URL}/withdrawals/balance`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/withdrawals/history`, { headers: getAuthHeaders() })
      ]);
      if (balanceRes.ok) setBalance(await parseResponse(balanceRes));
      if (historyRes.ok) setHistory(await parseResponse(historyRes));
    } catch (err) {
      console.error('Erreur chargement retraits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleProofCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadstart = () => setUploadingProof(true);
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await fetch(`${API_BASE_URL}/withdrawals/upload-proof`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ imageBase64: base64 })
        });
        const data = await parseResponse(res);
        if (res.ok && data.success) {
          setProofUrl(data.proofUrl);
        } else {
          setErrorMsg(data.error || 'Erreur lors de l\'envoi de la preuve.');
        }
      } catch (err) {
        setErrorMsg('Erreur lors de l\'envoi de la preuve.');
      } finally {
        setUploadingProof(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!balance || balance.availableBalance <= 0) return;
    if (!recipientName.trim() || !recipientPhone.trim() || !proofUrl) {
      setErrorMsg('Veuillez renseigner le bénéficiaire, le téléphone et joindre une preuve de paiement.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/withdrawals/request`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          amount: balance.availableBalance,
          recipientName: recipientName.trim(),
          recipientPhone: recipientPhone.trim(),
          proofImageUrl: proofUrl
        })
      });
      const data = await parseResponse(res);
      if (res.ok) {
        setSuccessMsg('Demande de retrait envoyée avec succès. Elle sera traitée par notre équipe.');
        setRecipientName('');
        setRecipientPhone('');
        setProofUrl('');
        await loadData();
      } else {
        setErrorMsg(data.error || 'Erreur lors de la demande de retrait.');
      }
    } catch (err) {
      setErrorMsg('Erreur réseau lors de la demande de retrait.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto animate-slideUp">
      {/* ── HEADER ── */}
      <div className="relative pro-card p-8 overflow-hidden group bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-amber-100 dark:border-amber-900/30">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
          <Wallet className="w-64 h-64 text-amber-500" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500 text-[10px] font-black text-slate-950 uppercase tracking-[0.2em] mb-4 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            <Sparkles className="w-3.5 h-3.5" /> Ristournes DGhubSchool
          </div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
            Retraits & <span className="text-transparent bg-clip-text bg-gradient-to-br from-amber-400 to-amber-600">Ristournes</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
            Votre établissement perçoit 700 FCFA pour chaque élève dont le parent a soldé la totalité des 2100 FCFA. Demandez le versement de votre solde disponible ci-dessous.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-slate-400 py-20">
          <Loader2 className="w-5 h-5 animate-spin" /> Chargement...
        </div>
      ) : (
        <>
          {/* ── Cards financières ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-5 sm:p-7">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center shrink-0 shadow-inner">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Total Gagné</span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white mb-1">{fmtMoney(balance?.totalEarned || 0)}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide">700 F par élève soldé</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-5 sm:p-7">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-3xl flex items-center justify-center shrink-0 shadow-inner">
                  <Clock className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Retiré / En attente</span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white mb-1">{fmtMoney((balance?.totalWithdrawn || 0) + (balance?.totalPending || 0))}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide">
                {fmtMoney(balance?.totalWithdrawn || 0)} approuvé · {fmtMoney(balance?.totalPending || 0)} en attente
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl shadow-lg shadow-amber-500/20 p-5 sm:p-7">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 text-white rounded-3xl flex items-center justify-center shrink-0 shadow-inner">
                  <Wallet className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-black text-amber-100 uppercase tracking-widest">Solde Disponible</span>
              </div>
              <p className="text-3xl font-black text-white mb-1">{fmtMoney(balance?.availableBalance || 0)}</p>
              <p className="text-xs text-amber-50 font-bold uppercase tracking-wide">Prêt à être retiré</p>
            </div>
          </div>

          {/* ── Formulaire de demande ── */}
          {(balance?.availableBalance || 0) > 0 && (
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8">
              <h3 className="font-black text-slate-800 dark:text-slate-200 text-lg mb-4 flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-500" />
                Demander le retrait de {fmtMoney(balance!.availableBalance)}
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
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Nom du bénéficiaire</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Ex: Directeur de l'établissement"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Numéro (Mobile Money)</label>
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="Ex: 90 00 00 00"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Preuve (RIB, capture Mobile Money...)</label>
                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-amber-500 transition-colors">
                  <input type="file" accept="image/*" className="hidden" onChange={handleProofCapture} disabled={uploadingProof} />
                  {uploadingProof ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  ) : (
                    <Camera className="w-4 h-4 text-amber-500" />
                  )}
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {proofUrl ? '✅ Preuve jointe — cliquer pour remplacer' : 'Cliquer pour joindre une image'}
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting || uploadingProof}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase rounded-xl transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Envoyer la demande
              </button>
            </form>
          )}

          {/* ── Détail des paiements parents (revenus reversés) ── */}
          <SchoolLicenseRevenuePanel />

          {/* ── Historique ── */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Historique des retraits</h3>
              </div>
              <span className="px-4 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                {history.length} demande{history.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.1em] border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Bénéficiaire</th>
                    <th className="px-6 py-4 text-right">Montant</th>
                    <th className="px-6 py-4 text-center">Statut</th>
                    <th className="px-6 py-4 text-right">Preuves</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-slate-400 text-sm font-medium">
                        Aucune demande de retrait pour le moment.
                      </td>
                    </tr>
                  ) : (
                    history.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400">{fmtDate(w.created_at)}</td>
                        <td className="px-6 py-4 text-xs">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{w.recipient_name}</p>
                          <p className="text-slate-400">{w.recipient_phone}</p>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-black text-slate-900 dark:text-white">{fmtMoney(w.amount)}</td>
                        <td className="px-6 py-4 text-center">{statusBadge(w.status)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {w.proof_image_url && (
                              <a href={w.proof_image_url} target="_blank" rel="noreferrer" className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                Ma preuve <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {w.admin_proof_image_url && (
                              <a href={w.admin_proof_image_url} target="_blank" rel="noreferrer" className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                                Dépôt <ExternalLink className="w-3 h-3" />
                              </a>
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
        </>
      )}
    </div>
  );
};
