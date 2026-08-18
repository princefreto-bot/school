// ============================================================
// PARAMÈTRES — Catalogue réutilisable des libellés de dépenses élève
// (ex: Maillots, Excursion), utilisé lors de l'ajout d'une dépense
// sur une fiche élève. Piste distincte de l'écolage/frais d'inscription.
// ============================================================
import React, { useEffect, useState } from 'react';
import { ShoppingBag, Plus, Trash2, Loader2 } from 'lucide-react';
import { expensesApi } from '../services/expensesApi';
import { ExpenseLabel } from '../types';

export const ExpenseLabelsSettings: React.FC = () => {
  const [labels, setLabels] = useState<ExpenseLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLabels(await expensesApi.getLabels());
    } catch (err) {
      console.error('Erreur chargement libellés de dépenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    setError('');
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const created = await expensesApi.createLabel(newName.trim());
      setLabels((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
    } catch (err: any) {
      setError(err?.error || "Erreur lors de l'ajout du libellé.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce libellé du catalogue ? Les dépenses déjà créées avec ce libellé ne seront pas affectées.')) return;
    try {
      await expensesApi.deleteLabel(id);
      setLabels((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error('Erreur suppression libellé:', err);
    }
  };

  return (
    <div className="pro-card p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800">
      <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
          <ShoppingBag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        Frais divers (dépenses élève)
      </h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">
        Libellés réutilisables (ex: Maillots, Excursion) proposés lors de l'ajout d'une dépense sur la fiche d'un élève. Distincts de l'écolage et des frais d'inscription — à payer par le parent, suivis séparément sur le reçu.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-2"><Loader2 className="w-4 h-4 animate-spin" /> Chargement...</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {labels.length === 0 && (
              <p className="text-xs text-slate-400 italic">Aucun libellé pour l'instant.</p>
            )}
            {labels.map((l) => (
              <span
                key={l.id}
                className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                {l.name}
                <button
                  onClick={() => handleDelete(l.id)}
                  className="p-1 text-slate-300 hover:text-red-500 transition-colors rounded-full"
                  title="Supprimer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="Nouveau libellé (ex: Maillots)"
              className="flex-1 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
              className="flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-60"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
          {error && <p className="mt-2 text-xs font-bold text-red-500">{error}</p>}
        </>
      )}
    </div>
  );
};
