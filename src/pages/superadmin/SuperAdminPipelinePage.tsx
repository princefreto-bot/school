// ============================================================
// SUPERADMIN — Pipeline commercial (prospects)
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Megaphone } from 'lucide-react';
import { superAdminApi } from '../../services/superAdminApi';
import { SuperAdminModal } from '../../components/superadmin/SuperAdminModal';
import { ProspectStageColumn } from '../../components/superadmin/ProspectStageColumn';
import { STAGES, Prospect } from '../../components/superadmin/ProspectCard';

const NewProspectModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', contact_name: '', phone: '', email: '', source: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await superAdminApi.createProspect(form);
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SuperAdminModal title="Nouveau prospect" subtitle="École à démarcher, pas encore cliente" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Nom de l'école *</label>
          <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="ex: Lycée Moderne" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Contact</label>
          <input type="text" value={form.contact_name} onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="ex: M. Directeur" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Téléphone</label>
            <input type="text" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Source</label>
          <input type="text" value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="ex: Facebook, bouche-à-oreille..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[80px]" />
        </div>

        {error && <p className="text-rose-400 text-xs">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 font-semibold transition-all">
            Annuler
          </button>
          <button type="submit" disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Créer
          </button>
        </div>
      </form>
    </SuperAdminModal>
  );
};

export const SuperAdminPipelinePage: React.FC = () => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await superAdminApi.getProspects();
      setProspects(data.prospects || []);
    } catch (err) {
      console.error('Prospects load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStageChange = async (id: string, stage: string) => {
    setProspects((prev) => prev.map((p) => (p.id === id ? { ...p, stage } : p)));
    try {
      await superAdminApi.updateProspectStage(id, stage);
    } catch (err) {
      console.error(err);
      load();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce prospect ?')) return;
    setProspects((prev) => prev.filter((p) => p.id !== id));
    try {
      await superAdminApi.deleteProspect(id);
    } catch (err) {
      console.error(err);
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Pipeline commercial</h1>
          <p className="text-slate-400 text-sm">{prospects.length} prospect{prospects.length !== 1 ? 's' : ''} en cours de démarchage.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load}
            className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/50"
            title="Actualiser">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black transition-all shadow-[0_8px_20px_-6px_rgba(245,158,11,0.4)] border border-amber-500/30 hover:scale-[1.02] active:scale-[0.98]">
            <Plus className="w-5 h-5 shrink-0" />
            <span className="whitespace-nowrap">Nouveau prospect</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : prospects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <Megaphone className="w-12 h-12 text-slate-700 mb-4" />
          <p className="text-slate-500 font-medium">Aucun prospect enregistré.</p>
          <p className="text-slate-600 text-sm mt-1">Cliquez sur "Nouveau prospect" pour commencer.</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {STAGES.map((s) => (
            <ProspectStageColumn
              key={s.id}
              label={s.label}
              prospects={prospects.filter((p) => p.stage === s.id)}
              onStageChange={handleStageChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <NewProspectModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); load(); }}
        />
      )}
    </div>
  );
};
