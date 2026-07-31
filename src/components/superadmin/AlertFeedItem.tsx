import React, { useState } from 'react';
import { MessageSquareText, Check, Loader2 } from 'lucide-react';
import { SuperAdminBadge } from './SuperAdminBadge';
import { superAdminApi } from '../../services/superAdminApi';

export interface OverdueAlert {
  schoolId: string;
  schoolName: string;
  schoolSlug: string;
  reasons: { type: string; label: string }[];
  lastContact: { note: string | null; contactedAt: string } | null;
}

const REASON_TONE: Record<string, 'danger' | 'warning'> = {
  overdue_trial: 'danger',
  pending_approval: 'warning',
  unverified_email: 'warning',
  over_quota: 'warning',
};

export const AlertFeedItem: React.FC<{ alert: OverdueAlert; onContacted: () => void }> = ({ alert, onContacted }) => {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleMarkContacted = async () => {
    setSubmitting(true);
    try {
      await superAdminApi.markAlertContacted(alert.schoolId, note.trim() || undefined);
      setNote('');
      setShowNoteInput(false);
      onContacted();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-white font-bold">{alert.schoolName}</p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {alert.reasons.map((r) => (
              <SuperAdminBadge key={r.type} tone={REASON_TONE[r.type] || 'neutral'}>{r.label}</SuperAdminBadge>
            ))}
          </div>
        </div>

        {showNoteInput ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optionnel)"
              className="bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 w-48"
            />
            <button
              onClick={handleMarkContacted}
              disabled={submitting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Valider
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNoteInput(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition shrink-0"
          >
            <MessageSquareText className="w-3.5 h-3.5" />
            Marquer comme contactée
          </button>
        )}
      </div>

      {alert.lastContact && (
        <p className="text-slate-500 text-xs border-t border-slate-800 pt-2">
          Dernier contact le {new Date(alert.lastContact.contactedAt).toLocaleDateString('fr-FR')}
          {alert.lastContact.note ? ` — "${alert.lastContact.note}"` : ''}
        </p>
      )}
    </div>
  );
};
