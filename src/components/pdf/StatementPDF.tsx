// ============================================================
// STATEMENTPDF — États comptables (Balance, Bilan, Compte de résultat)
// Même charte que le reçu et le bulletin de paie : blanc, noir/gris,
// accent unique #820000, filets fins, aucune bande colorée, Inter.
// ============================================================
import React from 'react';
import { SchoolLogo } from './SchoolLogo';

const ACCENT = '#820000';

const money = (n: number, c = 'FCFA') =>
  `${new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))} ${c}`;

export interface StatementEmployer {
  name: string;
  logo?: string | null;
  address?: string;
  telephone?: string;
  email?: string;
}

export interface StatementRow {
  code?: string;
  name: string;
  type?: string;
  debit?: number;
  credit?: number;
  amount?: number;
  balance?: number;
}

export interface StatementSection {
  title: string;
  rows: StatementRow[];
  total?: { label: string; amount: number };
  columns: ('code' | 'type' | 'debit' | 'credit' | 'amount' | 'balance')[];
}

interface StatementPDFProps {
  title: string;
  subtitle?: string;
  employer: StatementEmployer;
  sections: StatementSection[];
  currency?: string;
  finalTotal?: { label: string; amount: number };
  generatedAt?: string;
}

const COLUMN_LABELS: Record<string, string> = {
  code: 'Code',
  type: 'Type',
  debit: 'Débit',
  credit: 'Crédit',
  amount: 'Montant',
  balance: 'Solde',
};

const StatementHeader: React.FC<{ employer: StatementEmployer; title: string; subtitle?: string }> = ({ employer, title, subtitle }) => (
  <header>
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <SchoolLogo src={employer.logo} name={employer.name} sizeMm={14} />
        <div className="leading-snug">
          <p className="text-[14px] font-bold tracking-tight text-neutral-900">{employer.name}</p>
          {employer.address && <p className="text-[9px] text-neutral-600">{employer.address}</p>}
          <p className="text-[9px] text-neutral-600">
            {employer.telephone ? `Tél. ${employer.telephone}` : ''}
            {employer.email ? `${employer.telephone ? ' · ' : ''}${employer.email}` : ''}
          </p>
        </div>
      </div>
      {subtitle && <div className="text-right text-[9px] text-neutral-500">{subtitle}</div>}
    </div>
    <h1 className="text-center text-[13px] font-semibold uppercase tracking-[0.3em] text-neutral-900 mt-4">{title}</h1>
  </header>
);

const StatementTable: React.FC<{ section: StatementSection; currency: string }> = ({ section, currency }) => {
  const cell = 'py-[3.5px] px-2 align-top';
  const num = (v?: number) => (v || v === 0 ? money(v, currency) : '—');
  return (
    <div className="mb-4">
      <h3 className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-900 pb-1 mb-1 border-b" style={{ borderColor: ACCENT }}>
        {section.title}
      </h3>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-y border-neutral-300">
            <th className={`${cell} text-left text-[9px] font-semibold uppercase tracking-wider text-neutral-600`}>Libellé</th>
            {section.columns.map((c) => (
              <th key={c} className={`${cell} text-right text-[9px] font-semibold uppercase tracking-wider text-neutral-600`}>
                {COLUMN_LABELS[c]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {section.rows.map((r, i) => (
            <tr key={i} className="border-b border-neutral-100">
              <td className={`${cell} text-left text-[10px] text-neutral-800`}>{r.code ? `${r.code} — ${r.name}` : r.name}</td>
              {section.columns.map((c) => (
                <td key={c} className={`${cell} text-right text-[10px] tabular-nums text-neutral-700`}>
                  {c === 'type' ? (r.type || '—') : num(r[c] as number | undefined)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {section.total && (
          <tfoot>
            <tr className="border-t-2 border-neutral-800">
              <td className={`${cell} text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-900`} colSpan={section.columns.length}>
                {section.total.label}
              </td>
              <td className={`${cell} text-right text-[10.5px] font-bold tabular-nums text-neutral-900`}>{money(section.total.amount, currency)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

export const StatementPDF: React.FC<StatementPDFProps> = ({
  title, subtitle, employer, sections, currency = 'FCFA', finalTotal, generatedAt,
}) => (
  <div
    className="statement-pdf bg-white text-neutral-900 flex flex-col"
    style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '12mm 14mm',
      fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
      boxSizing: 'border-box',
    }}
  >
    <StatementHeader employer={employer} title={title} subtitle={subtitle} />
    <hr className="border-neutral-200 my-3" />

    {sections.map((s, i) => <StatementTable key={i} section={s} currency={currency} />)}

    {finalTotal && (
      <div className="flex justify-end mt-2">
        <div className="w-[52%] flex justify-between items-baseline px-3 py-2 border" style={{ borderColor: ACCENT }}>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-900">{finalTotal.label}</span>
          <span className="text-[14px] font-bold tabular-nums" style={{ color: ACCENT }}>{money(finalTotal.amount, currency)}</span>
        </div>
      </div>
    )}

    <footer className="mt-auto pt-6">
      <p className="text-center text-[7.5px] text-neutral-400 tracking-wide">
        Document généré automatiquement{generatedAt ? ` le ${generatedAt}` : ''} par le système.
      </p>
    </footer>
  </div>
);

export default StatementPDF;
