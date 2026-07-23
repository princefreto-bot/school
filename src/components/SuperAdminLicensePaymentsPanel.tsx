// ============================================================
// Panneau Superadmin — Feed licences parents (toutes écoles) + export
// ============================================================
import React, { useEffect, useState, useCallback } from 'react';
import { Wallet, Loader2, CheckCircle, Clock, Download, TrendingUp, School as SchoolIcon } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface Payment {
    id: string;
    student_id: string;
    parent_id: string;
    license_key: string;
    amount: number;
    tranche_number: number;
    is_final: boolean;
    paid_at: string;
    school_slug: string;
    school_name: string;
}

interface PerSchool {
    slug: string;
    name: string;
    paymentsCount: number;
    totalCollected: number;
    licensesCompleted: number;
    reversedToSchool: number;
    platformNet: number;
}

interface Summary {
    paymentsCount: number;
    totalCollected: number;
    licensesCompleted: number;
    reversedToSchool: number;
    platformNet: number;
}

const fmtMoney = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function toCsv(payments: Payment[], perSchool: PerSchool[]) {
    const lines: string[] = [];
    lines.push('# Résumé par école');
    lines.push('École;Slug;Paiements;Collecté;Licences soldées;Reversé école;Net plateforme');
    perSchool.forEach(s => {
        lines.push([s.name, s.slug, s.paymentsCount, s.totalCollected, s.licensesCompleted, s.reversedToSchool, s.platformNet].join(';'));
    });
    lines.push('');
    lines.push('# Détail paiements');
    lines.push('Date;École;Slug;LicenceKey;Type;Montant;Soldée');
    payments.forEach(p => {
        lines.push([
            p.paid_at,
            p.school_name,
            p.school_slug,
            p.license_key,
            p.tranche_number === 0 ? 'Complet' : `Tranche ${p.tranche_number}/3`,
            p.amount,
            p.is_final ? 'oui' : 'non'
        ].join(';'));
    });
    return lines.join('\n');
}

export const SuperAdminLicensePaymentsPanel: React.FC = () => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [perSchool, setPerSchool] = useState<PerSchool[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [schoolFilter, setSchoolFilter] = useState('');

    const token = localStorage.getItem('parent_token');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const q = schoolFilter ? `?school=${encodeURIComponent(schoolFilter)}` : '';
            const res = await fetch(`${API_BASE_URL}/license-payments/superadmin${q}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setPayments(data.payments || []);
            setPerSchool(data.perSchool || []);
            setSummary(data.summary || null);
        } catch (err) {
            console.error('SuperAdmin license payments load error:', err);
        } finally {
            setLoading(false);
        }
    }, [token, schoolFilter]);

    useEffect(() => { load(); }, [load]);

    const exportCsv = () => {
        const csv = toCsv(payments, perSchool);
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport_licences_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Revenus licences parents</h3>
                        <p className="text-xs text-slate-400 font-medium">Toutes écoles confondues — feed en temps réel</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={schoolFilter}
                        onChange={(e) => setSchoolFilter(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-lg px-3 py-2"
                    >
                        <option value="">Toutes les écoles</option>
                        {perSchool.map(s => (
                            <option key={s.slug} value={s.slug}>{s.name}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={exportCsv}
                        disabled={payments.length === 0}
                        className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 text-xs font-black rounded-lg uppercase"
                    >
                        <Download className="w-3.5 h-3.5" /> CSV
                    </button>
                </div>
            </div>

            {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paiements</p>
                        <p className="text-xl font-black text-white mt-1">{summary.paymentsCount}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Collecté</p>
                        <p className="text-sm font-black text-white mt-1">{fmtMoney(summary.totalCollected)}</p>
                    </div>
                    <div className="bg-emerald-950/30 rounded-xl p-3 border border-emerald-800/40">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Licences soldées</p>
                        <p className="text-xl font-black text-emerald-400 mt-1">{summary.licensesCompleted}</p>
                    </div>
                    <div className="bg-amber-950/30 rounded-xl p-3 border border-amber-800/40">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Reversé écoles</p>
                        <p className="text-sm font-black text-amber-400 mt-1">{fmtMoney(summary.reversedToSchool)}</p>
                    </div>
                    <div className="bg-blue-950/30 rounded-xl p-3 border border-blue-800/40">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Net plateforme</p>
                        <p className="text-sm font-black text-blue-400 mt-1">{fmtMoney(summary.platformNet)}</p>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex items-center gap-2 text-slate-400 py-4">
                    <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
                </div>
            ) : (
                <>
                    {perSchool.length > 0 && (
                        <div className="bg-slate-800/40 rounded-xl border border-slate-700 overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
                                <SchoolIcon className="w-4 h-4 text-amber-400" />
                                <h4 className="text-xs font-black text-white uppercase tracking-widest">Par école</h4>
                            </div>
                            <div className="divide-y divide-slate-800">
                                {perSchool.map(s => (
                                    <div key={s.slug} className="flex items-center justify-between px-4 py-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-white truncate">{s.name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                {s.paymentsCount} paiement{s.paymentsCount > 1 ? 's' : ''} · {s.licensesCompleted} licence{s.licensesCompleted > 1 ? 's' : ''} soldée{s.licensesCompleted > 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-black text-white">{fmtMoney(s.totalCollected)}</p>
                                            <p className="text-[10px] font-black text-amber-400">
                                                +{fmtMoney(s.reversedToSchool)} école
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-800/40 rounded-xl border border-slate-700 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-amber-400" />
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">Feed des paiements ({payments.length})</h4>
                        </div>
                        <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto">
                            {payments.length === 0 ? (
                                <p className="text-xs text-slate-500 text-center py-8">Aucun paiement enregistré.</p>
                            ) : payments.map(p => (
                                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${p.is_final ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                        {p.is_final ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-white truncate">
                                            {p.school_name}
                                            <span className="text-slate-400 font-medium"> · {p.tranche_number === 0 ? 'Complet' : `Tranche ${p.tranche_number}/3`}</span>
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-medium">{fmtDate(p.paid_at)} · {p.license_key.slice(0, 12)}…</p>
                                    </div>
                                    <p className="text-sm font-black text-white shrink-0">{fmtMoney(p.amount)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
