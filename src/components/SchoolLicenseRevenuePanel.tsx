// ============================================================
// Panneau école — Revenus détaillés depuis les licences parents
// ============================================================
import React, { useEffect, useState, useCallback } from 'react';
import { Wallet, Loader2, CheckCircle, Clock, Users } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { getAuthHeaders } from '../services/apiHelpers';

interface Payment {
    id: string;
    student_id: string;
    parent_id: string;
    license_key: string;
    amount: number;
    tranche_number: number;
    is_final: boolean;
    paid_at: string;
    student: { id: string; nom: string; prenom: string; classe: string } | null;
    parent: { id: string; nom: string; telephone: string } | null;
}

interface Summary {
    totalCollected: number;
    reversedToSchool: number;
    licensesCompleted: number;
    paymentsCount: number;
}

const fmtMoney = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const SchoolLicenseRevenuePanel: React.FC = () => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/license-payments/school`, {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            setPayments(data.payments || []);
            setSummary(data.summary || null);
        } catch (err) {
            console.error('SchoolLicenseRevenuePanel error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">Revenus des licences parents</h3>
                        <p className="text-[11px] text-slate-500 font-medium">Chaque licence complète = +700 FCFA reversés à l'école</p>
                    </div>
                </div>
                <button type="button" onClick={load} className="text-[11px] font-black text-amber-600 hover:text-amber-700 uppercase">
                    Actualiser
                </button>
            </div>

            {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paiements</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{summary.paymentsCount}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Collectés (parents)</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white mt-1">{fmtMoney(summary.totalCollected)}</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3 border border-emerald-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Licences soldées</p>
                        <p className="text-lg font-black text-emerald-700 mt-1">{summary.licensesCompleted}</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 border border-amber-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Reversé à l'école</p>
                        <p className="text-sm font-black text-amber-700 mt-1">{fmtMoney(summary.reversedToSchool)}</p>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex items-center gap-2 text-slate-500 py-4">
                    <Loader2 className="w-4 h-4 animate-spin" /> <span className="text-sm">Chargement...</span>
                </div>
            ) : payments.length === 0 ? (
                <div className="text-center py-8">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-500">Aucun paiement de licence pour le moment</p>
                    <p className="text-xs text-slate-400 mt-1">Les tranches réglées par les parents s'afficheront ici.</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[420px] overflow-y-auto">
                    {payments.map(p => (
                        <div key={p.id} className="flex items-center gap-3 py-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${p.is_final ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                {p.is_final ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                                    {p.student ? `${p.student.prenom} ${p.student.nom}` : 'Élève inconnu'}
                                    {p.student?.classe && <span className="text-slate-400 font-medium"> — {p.student.classe}</span>}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium">
                                    {p.tranche_number === 0 ? 'Règlement complet' : `Tranche ${p.tranche_number}/3`}
                                    {p.parent ? ` · Parent ${p.parent.nom}` : ''}
                                    {' · '}{fmtDate(p.paid_at)}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-sm font-black text-slate-900 dark:text-white">{fmtMoney(p.amount)}</p>
                                {p.is_final && (
                                    <p className="text-[9px] font-black text-emerald-600 uppercase">+700 F ristourne</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
