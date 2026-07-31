import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color?: string; // gradient classes, e.g. 'from-blue-500 to-cyan-500'
  valueClassName?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon, color, valueClassName }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${color ? `bg-gradient-to-br ${color}` : 'bg-slate-800 text-slate-300'}`}>
        {icon}
      </div>
    </div>
    <p className={`text-2xl font-black ${valueClassName || 'text-white'}`}>{value}</p>
    <p className="text-slate-400 text-sm font-medium">{label}</p>
    {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
  </div>
);
