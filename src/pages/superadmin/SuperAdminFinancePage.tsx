// ============================================================
// SUPERADMIN — Dépenses & Chiffre d'affaires
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, AlertTriangle, Star, Trash2, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { getAuthHeaders } from '../../services/apiHelpers';
import { formatFCFA } from '../../services/superAdminApi';
import { SuperAdminLicensePaymentsPanel } from '../../components/SuperAdminLicensePaymentsPanel';
import { GlobalStats } from './types';

export const SuperAdminFinancePage: React.FC = () => {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpensePeriod, setNewExpensePeriod] = useState('annuel');
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      const [statsRes, expensesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/superadmin/stats`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/superadmin/expenses`, { headers: getAuthHeaders() }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (expensesRes.ok) setExpenses((await expensesRes.json()) || []);
    } catch (err) {
      console.error('SuperAdmin load finance error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseCategory || !newExpenseAmount) return;
    try {
      const res = await fetch(`${API_BASE_URL}/superadmin/expenses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ category: newExpenseCategory, amount: Number(newExpenseAmount), period: newExpensePeriod })
      });
      if (res.ok) {
        setNewExpenseCategory('');
        setNewExpenseAmount('');
        await loadAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveExpense = async (id: string) => {
    if (!confirm('Supprimer cette dépense ?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/superadmin/expenses/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) await loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  const totalExpenses = expenses.reduce((a, b) => a + Number(b.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Dépenses & Chiffre d'affaires</h1>
        <p className="text-slate-400 text-sm">Suivi des charges de la plateforme et estimation du bénéfice.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
            <Wallet className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-white">{formatFCFA(stats?.total_revenue || 0)}</p>
          <p className="text-slate-400 text-sm font-semibold">Revenus SaaS Globaux (estimé)</p>
          <p className="text-slate-500 text-xs mt-1">Élèves actifs × prix/élève — pas un encaissement réel, voir Cashflow</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center mb-4">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-white">{formatFCFA(totalExpenses)}</p>
          <p className="text-slate-400 text-sm font-semibold">Dépenses SaaS enregistrées</p>
          <p className="text-slate-500 text-xs mt-1">Hébergement, bases de données, etc.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
            <Star className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-emerald-400">
            {formatFCFA((stats?.total_revenue || 0) - totalExpenses)}
          </p>
          <p className="text-slate-400 text-sm font-semibold">Bénéfice Net Estimé</p>
          <p className="text-slate-500 text-xs mt-1">Revenus estimés - Dépenses (sans commissions)</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-6">
        <h2 className="text-lg font-bold text-white mb-6">Ajouter une dépense / charge</h2>
        <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:flex sm:flex-wrap items-end gap-4">
          <div className="flex-1 w-full min-w-0 sm:min-w-[200px]">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Catégorie / Nom</label>
            <input type="text" value={newExpenseCategory} onChange={e => setNewExpenseCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="ex: Serveur Render" required />
          </div>
          <div className="w-full sm:w-32">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Montant (FCFA)</label>
            <input type="number" value={newExpenseAmount} onChange={e => setNewExpenseAmount(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              required />
          </div>
          <div className="w-full sm:w-32">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Périodicité</label>
            <select value={newExpensePeriod} onChange={e => setNewExpensePeriod(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="annuel">Annuel</option>
              <option value="mensuel">Mensuel</option>
              <option value="unique">Unique</option>
            </select>
          </div>
          <button type="submit"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-all h-[46px]">
            Ajouter
          </button>
        </form>

        <div className="mt-8 border-t border-slate-800 pt-6">
          <h3 className="text-md font-bold text-slate-300 mb-4">Liste des dépenses</h3>
          <div className="space-y-3">
            {expenses.length === 0 ? <p className="text-slate-500 text-sm">Aucune dépense enregistrée.</p> : null}
            {expenses.map(exp => (
              <div key={exp.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <div>
                  <p className="text-white font-bold">{exp.category}</p>
                  <p className="text-xs text-slate-400 capitalize">{exp.period}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-black text-rose-400">{formatFCFA(exp.amount)}</span>
                  <button onClick={() => handleRemoveExpense(exp.id)} className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SuperAdminLicensePaymentsPanel />
    </div>
  );
};
