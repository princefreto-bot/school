import React, { useEffect, useState } from 'react';
import { Heart, Loader2, Send, CheckCircle2, Pencil } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { getAuthHeaders, parseResponse } from '../services/apiHelpers';
import { useStore } from '../store/useStore';

interface SatisfactionEntry {
  id: string;
  score: number;
  comment: string | null;
  period: string;
}

export const ParentSatisfactionSurvey: React.FC = () => {
  const schoolName = useStore((s) => s.schoolName);
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<SatisfactionEntry | null>(null);
  const [editing, setEditing] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/satisfaction/mine`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await parseResponse(res);
        setExisting(data);
        if (data) {
          setScore(data.score);
          setComment(data.comment || '');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (score === null) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/satisfaction`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ score, comment: comment.trim() || undefined })
      });
      if (!res.ok) {
        const data = await parseResponse(res).catch(() => ({}));
        throw new Error(data?.error || 'Erreur lors de l\'envoi.');
      }
      const data = await parseResponse(res);
      setExisting(data);
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pro-card p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800 rounded-[28px] flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
      </div>
    );
  }

  const showForm = !existing || editing;

  return (
    <div className="pro-card p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
      <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-3 mb-4">
        <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl">
          <Heart className="w-5 h-5 text-rose-500" />
        </div>
        Votre avis compte
      </h3>

      {!showForm && existing ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="text-sm font-semibold">
              Merci pour votre note de <strong>{existing.score}/10</strong> ce mois-ci{existing.comment ? ' et votre commentaire' : ''} !
            </p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-amber-600 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Modifier ma note
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-5 font-medium">
            Sur une échelle de 0 à 10, recommanderiez-vous <strong>{schoolName}</strong> à d'autres parents ?
          </p>

          <div className="grid grid-cols-11 gap-1.5 mb-2">
            {Array.from({ length: 11 }, (_, i) => i).map(n => (
              <button
                key={n}
                onClick={() => setScore(n)}
                className={`aspect-square rounded-xl text-xs font-black flex items-center justify-center transition-all active:scale-95 ${
                  score === n
                    ? n >= 9 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : n >= 7 ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-5 px-1">
            <span>Pas du tout</span>
            <span>Tout à fait</span>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Un commentaire à partager avec l'établissement ? (optionnel)"
            maxLength={1000}
            rows={3}
            className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none resize-none mb-4"
          />

          {error && <p className="text-xs font-bold text-rose-600 mb-3">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={score === null || saving}
              className="flex-1 flex justify-center items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase tracking-widest text-[12px] rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Envoyer ma note
            </button>
            {editing && (
              <button
                onClick={() => { setEditing(false); setError(''); }}
                className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-[12px] rounded-xl transition-all active:scale-[0.98]"
              >
                Annuler
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
