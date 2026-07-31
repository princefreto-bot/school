import React from 'react';
import { Phone, Mail, Trash2 } from 'lucide-react';

export interface Prospect {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  stage: string;
  notes: string | null;
  created_at: string;
}

export const STAGES: { id: string; label: string }[] = [
  { id: 'new', label: 'Nouveau' },
  { id: 'contacted', label: 'Contacté' },
  { id: 'demo', label: 'Démo' },
  { id: 'negotiation', label: 'Négociation' },
  { id: 'won', label: 'Gagné' },
  { id: 'lost', label: 'Perdu' },
];

interface ProspectCardProps {
  prospect: Prospect;
  onStageChange: (id: string, stage: string) => void;
  onDelete: (id: string) => void;
}

export const ProspectCard: React.FC<ProspectCardProps> = ({ prospect, onStageChange, onDelete }) => (
  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2.5">
    <div className="flex items-start justify-between gap-2">
      <p className="text-white font-bold text-sm leading-tight">{prospect.name}</p>
      <button onClick={() => onDelete(prospect.id)} className="p-1 text-slate-500 hover:text-rose-500 transition shrink-0">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>

    {prospect.contact_name && <p className="text-slate-400 text-xs">{prospect.contact_name}</p>}

    <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-500 text-xs">
      {prospect.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{prospect.phone}</span>}
      {prospect.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{prospect.email}</span>}
    </div>

    {prospect.source && (
      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
        {prospect.source}
      </span>
    )}

    <select
      value={prospect.stage}
      onChange={(e) => onStageChange(prospect.id, e.target.value)}
      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
    >
      {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
    </select>
  </div>
);
