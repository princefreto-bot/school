import React from 'react';

type Tone = 'success' | 'warning' | 'danger' | 'neutral';

const TONE_CLASSES: Record<Tone, string> = {
  success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
  neutral: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
};

interface SuperAdminBadgeProps {
  tone: Tone;
  icon?: React.ReactNode;
  pulse?: boolean;
  children: React.ReactNode;
}

export const SuperAdminBadge: React.FC<SuperAdminBadgeProps> = ({ tone, icon, pulse, children }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${TONE_CLASSES[tone]} ${pulse ? 'animate-pulse' : ''}`}>
    {icon}
    {children}
  </span>
);
