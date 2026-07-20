import React, { useEffect, useState } from 'react';
import { Bell, Loader2, Save } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { getAuthHeaders, parseResponse } from '../services/apiHelpers';

export const AutoReminderSettings: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [thresholdDays, setThresholdDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/settings/reminders`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await parseResponse(res);
        setEnabled(data.autoRemindersEnabled);
        setThresholdDays(data.autoRemindersThresholdDays);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/settings/reminders`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ autoRemindersEnabled: enabled, autoRemindersThresholdDays: thresholdDays })
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pro-card p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800">
      <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
          <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        Alertes de retard automatiques
      </h3>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-2"><Loader2 className="w-4 h-4 animate-spin" /> Chargement...</div>
      ) : (
        <>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-4">
            Envoie automatiquement une notification aux parents dont le solde est impayé au-delà du seuil ci-dessous (au maximum une fois par semaine par élève).
          </p>

          <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 mb-3 cursor-pointer">
            <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Activer les alertes automatiques</span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-5 h-5 rounded accent-indigo-600"
            />
          </label>

          <div className="mb-5">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5">Seuil de retard (jours)</label>
            <input
              type="number"
              min={1}
              value={thresholdDays}
              onChange={(e) => setThresholdDays(Number(e.target.value) || 1)}
              disabled={!enabled}
              className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none disabled:opacity-50"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full flex justify-center items-center gap-2 px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${
              saved ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
            } disabled:opacity-50`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? 'Enregistré' : 'Enregistrer'}
          </button>
        </>
      )}
    </div>
  );
};
