import React from 'react';
import { ProspectCard, Prospect } from './ProspectCard';

interface ProspectStageColumnProps {
  label: string;
  prospects: Prospect[];
  onStageChange: (id: string, stage: string) => void;
  onDelete: (id: string) => void;
}

export const ProspectStageColumn: React.FC<ProspectStageColumnProps> = ({ label, prospects, onStageChange, onDelete }) => (
  <div className="flex flex-col gap-3 min-w-[260px] w-[260px] shrink-0">
    <div className="flex items-center justify-between px-1">
      <h3 className="text-slate-300 font-black text-xs uppercase tracking-widest">{label}</h3>
      <span className="text-slate-500 text-xs font-bold">{prospects.length}</span>
    </div>
    <div className="flex flex-col gap-3 min-h-[80px]">
      {prospects.length === 0 ? (
        <div className="border-2 border-dashed border-slate-800 rounded-2xl py-6 text-center text-slate-600 text-xs">Vide</div>
      ) : (
        prospects.map((p) => (
          <ProspectCard key={p.id} prospect={p} onStageChange={onStageChange} onDelete={onDelete} />
        ))
      )}
    </div>
  </div>
);
