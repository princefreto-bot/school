import React from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { formatFCFA } from '../../services/superAdminApi';

export interface CashflowPoint {
  month: string;
  label: string;
  moneyIn: number;
  moneyOut: number;
  net: number;
}

interface CashflowChartProps {
  data: CashflowPoint[];
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl">
      <p className="text-slate-300 text-xs font-black uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-xs font-bold" style={{ color: p.color }}>
          {p.name} : {formatFCFA(p.value)}
        </p>
      ))}
    </div>
  );
};

export const CashflowChart: React.FC<CashflowChartProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height={280}>
    <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.4} />
      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} tickLine={false} axisLine={false} />
      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} tickLine={false} axisLine={false} />
      <Tooltip content={<CustomTooltip />} />
      <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
      <Bar dataKey="moneyIn" name="Encaissé" fill="#10b981" radius={[6, 6, 0, 0]} />
      <Bar dataKey="moneyOut" name="Dépensé" fill="#f43f5e" radius={[6, 6, 0, 0]} />
      <Line type="monotone" dataKey="net" name="Net" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3, fill: '#f59e0b' }} />
    </ComposedChart>
  </ResponsiveContainer>
);
