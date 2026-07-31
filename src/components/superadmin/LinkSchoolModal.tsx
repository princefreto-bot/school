import React, { useState } from 'react';
import { AlertTriangle, Link as LinkIcon, RefreshCw, X } from 'lucide-react';
import { School } from '../../types';
import { API_BASE_URL } from '../../config';
import { getAuthHeaders } from '../../services/apiHelpers';

interface SchoolWithStats extends School {
  student_count: number;
  user_count: number;
  revenue: number;
  trial_days_left: number;
}

interface CreatorWithStats {
  id: string;
  nom: string;
  telephone: string;
  created_at: string;
  linked_schools_count: number;
  linked_schools: Array<{
    id: string;
    name: string;
    slug: string;
    total_students: number;
    active_students: number;
    revenue_generated: number;
    creator_commission: number;
  }>;
  total_students: number;
  total_active_students: number;
  total_revenue_generated: number;
  total_commission: number;
}

interface LinkSchoolModalProps {
  creator: CreatorWithStats;
  schools: SchoolWithStats[];
  onClose: () => void;
  onLinked: () => void;
}

export const LinkSchoolModal: React.FC<LinkSchoolModalProps> = ({ creator, schools, onClose, onLinked }) => {
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filtrer les écoles déjà liées à ce créateur
  const availableSchools = schools.filter(s =>
    !creator.linked_schools.some(ls => ls.id === s.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolId) return;

    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/superadmin/creators/${creator.id}/link`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ school_id: selectedSchoolId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur d\'affiliation');
      onLinked();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden animate-slideUp">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-black text-white">Affilier un établissement</h2>
            <p className="text-slate-400 text-xs">Associez une école au compte de {creator.nom}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Sélectionner l'école *</label>
            <select
              value={selectedSchoolId}
              onChange={e => setSelectedSchoolId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            >
              <option value="" disabled>-- Sélectionner --</option>
              {availableSchools.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.student_count} élèves)</option>
              ))}
            </select>
            {availableSchools.length === 0 && (
              <p className="text-rose-400 text-xs mt-2">Toutes les écoles sont déjà affiliées à ce créateur.</p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 font-semibold transition-all">
              Annuler
            </button>
            <button type="submit" disabled={loading || !selectedSchoolId}
              className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
              {loading ? 'Liaison...' : 'Lier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
