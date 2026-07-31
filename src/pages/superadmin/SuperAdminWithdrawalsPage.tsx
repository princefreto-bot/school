// ============================================================
// SUPERADMIN — Retraits (ristournes écoles)
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Check, X, ExternalLink } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { getAuthHeaders } from '../../services/apiHelpers';
import { formatFCFA } from '../../services/superAdminApi';

export const SuperAdminWithdrawalsPage: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [uploadingWithdrawalId, setUploadingWithdrawalId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadWithdrawals = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/superadmin/withdrawals`, { headers: getAuthHeaders() });
      if (res.ok) setWithdrawals((await res.json()) || []);
    } catch (err) {
      console.error('SuperAdmin load withdrawals error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadWithdrawals(); }, [loadWithdrawals]);

  const handleApproveWithdrawal = async (withdrawalId: string, adminProofImageUrl?: string) => {
    setActionLoading(withdrawalId);
    try {
      const res = await fetch(`${API_BASE_URL}/superadmin/withdrawals/${withdrawalId}/approve`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ adminProofImageUrl: adminProofImageUrl || null })
      });
      if (res.ok) await loadWithdrawals();
      else {
        const errData = await res.json();
        alert(errData.error || 'Erreur lors de l\'approbation');
      }
    } catch (err) {
      alert('Erreur réseau lors de l\'approbation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: string) => {
    if (!confirm('Voulez-vous rejeter cette demande de retrait ?')) return;
    setActionLoading(withdrawalId);
    try {
      const res = await fetch(`${API_BASE_URL}/superadmin/withdrawals/${withdrawalId}/reject`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      if (res.ok) await loadWithdrawals();
      else {
        const errData = await res.json();
        alert(errData.error || 'Erreur lors du rejet');
      }
    } catch (err) {
      alert('Erreur réseau lors du rejet');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveWithProofFile = (withdrawalId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadstart = () => setUploadingWithdrawalId(withdrawalId);
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await fetch(`${API_BASE_URL}/superadmin/withdrawals/upload-proof`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ imageBase64: base64 })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          await handleApproveWithdrawal(withdrawalId, data.proofUrl);
        } else {
          alert(data.error || 'Erreur lors de l\'envoi de la preuve');
        }
      } catch (err) {
        alert('Erreur lors de l\'envoi de la preuve');
      } finally {
        setUploadingWithdrawalId(null);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  const filtered = withdrawals.filter(w => withdrawalFilter === 'all' || w.status === withdrawalFilter);
  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Retraits</h1>
          <p className="text-slate-400 text-sm">{pendingCount} demande{pendingCount !== 1 ? 's' : ''} en attente d'approbation.</p>
        </div>
        <button onClick={loadWithdrawals}
          className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/50"
          title="Actualiser">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setWithdrawalFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              withdrawalFilter === f
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {f === 'pending' ? 'En attente' : f === 'approved' ? 'Approuvés' : f === 'rejected' ? 'Rejetés' : 'Tous'}
          </button>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-slate-500 text-sm p-6">Aucune demande de retrait pour ce filtre.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {filtered.map((w) => (
              <div key={w.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-black text-white">{w.school_slug}</p>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      w.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      w.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {w.status === 'pending' ? 'En attente' : w.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm font-bold">{formatFCFA(w.amount)}</p>
                  <p className="text-slate-500 text-xs">{w.recipient_name} · {w.recipient_phone}</p>
                  <div className="flex gap-3 mt-1.5">
                    {w.proof_image_url && (
                      <a href={w.proof_image_url} target="_blank" rel="noreferrer" className="text-[11px] font-black text-blue-400 hover:underline flex items-center gap-1">
                        Preuve école <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {w.admin_proof_image_url && (
                      <a href={w.admin_proof_image_url} target="_blank" rel="noreferrer" className="text-[11px] font-black text-emerald-400 hover:underline flex items-center gap-1">
                        Preuve dépôt <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {w.status === 'pending' && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 lg:border-l border-slate-700/50 pt-3 lg:pt-0 lg:pl-4">
                    <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 shadow-md transition-all cursor-pointer disabled:opacity-50">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={actionLoading === w.id || uploadingWithdrawalId === w.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleApproveWithProofFile(w.id, file);
                        }}
                      />
                      {uploadingWithdrawalId === w.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Approuver + preuve
                    </label>
                    <button
                      onClick={() => handleApproveWithdrawal(w.id)}
                      disabled={actionLoading === w.id || uploadingWithdrawalId === w.id}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 transition-all disabled:opacity-50"
                    >
                      Approuver sans preuve
                    </button>
                    <button
                      onClick={() => handleRejectWithdrawal(w.id)}
                      disabled={actionLoading === w.id || uploadingWithdrawalId === w.id}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 shadow-md transition-all disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Rejeter
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
