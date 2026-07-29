// ============================================================
// BULLETIN DE PAIE — Modèle premium, sobre et imprimable (A4)
// Inspiré des logiciels RH : PayFit, Sage Paie, Lucca, ADP,
// SAP SuccessFactors, Workday.
//
// Charte : blanc dominant · noir & gris · un seul accent (#820000)
// Pas de dégradés, pas de cartes, pas d'icônes, pas d'ombres.
// Typographie Inter · alignements stricts · densité maîtrisée.
// ============================================================
import React from 'react';
import { SchoolLogo } from './SchoolLogo';

// ── Couleur d'accent unique (très discrète) ──
const ACCENT = '#820000';

// ── Types ──
export interface LignePaie {
  label: string;
  montant: number;
}

export interface PayslipData {
  periode: string; // "YYYY-MM"
  salaire_base: number;
  primes: LignePaie[];
  retenues: LignePaie[];
  personnes_a_charge: number;
  cnss_salarial: number;
  cnss_patronal: number;
  amu_salarial: number;
  amu_patronal: number;
  irpp: number;
  net_a_payer: number;
  generated_at?: string;
}

export interface EmployerInfo {
  name: string;
  logo?: string | null;
  address?: string;
  bp?: string;
  telephone?: string;
  email?: string;
  ifu?: string;
  rccm?: string;
  nif?: string;
}

export interface EmployeeInfo {
  nom: string;
  fonction?: string;
  matricule?: string;
  departement?: string;
  cnss?: string;
  dateEmbauche?: string;
  modePaiement?: string;
  compteBancaire?: string;
  centreCout?: string;
}

interface BulletinPaiePDFProps {
  data: PayslipData;
  employer: EmployerInfo;
  employee: EmployeeInfo;
  currency?: string;
  observations?: string;
}

// ── Helpers de formatage ──
const money = (n: number, currency = 'FCFA') =>
  `${new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))} ${currency}`;

const percent = (rate: number) =>
  `${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(rate)} %`;

const NA = '—';
const orNA = (v?: string | number | null) =>
  v === undefined || v === null || v === '' ? NA : String(v);

const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const formatPeriode = (p: string) => {
  const m = /^(\d{4})-(\d{2})$/.exec(p);
  if (!m) return p;
  const mois = MOIS[Number(m[2]) - 1] || '';
  return `${mois} ${m[1]}`;
};

// ============================================================
// Sous-composants réutilisables
// ============================================================

// ── Ligne d'information (label gris / valeur noire) ──
const InfoRow: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
  <div className="flex justify-between gap-3 py-[3px] border-b border-neutral-100 last:border-0">
    <span className="text-[9.5px] uppercase tracking-wide text-neutral-500">{label}</span>
    <span className="text-[10px] font-medium text-neutral-900 text-right leading-tight">{orNA(value)}</span>
  </div>
);

// ── Bloc d'information (titre + lignes) ──
const InfoBlock: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="flex-1">
    <h3
      className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-900 pb-1 mb-1 border-b"
      style={{ borderColor: ACCENT }}
    >
      {title}
    </h3>
    <div>{children}</div>
  </div>
);

// ── En-tête : identité de l'entreprise ──
const PayslipHeader: React.FC<{ employer: EmployerInfo }> = ({ employer }) => (
  <header>
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <SchoolLogo src={employer.logo} name={employer.name} sizeMm={16} />
        <div className="leading-snug">
          <p className="text-[15px] font-bold tracking-tight text-neutral-900">{employer.name}</p>
          <p className="text-[9.5px] text-neutral-600">
            {employer.address || NA}
            {employer.bp ? ` · BP ${employer.bp}` : ''}
          </p>
          <p className="text-[9.5px] text-neutral-600">
            {employer.telephone ? `Tél. ${employer.telephone}` : ''}
            {employer.email ? `${employer.telephone ? ' · ' : ''}${employer.email}` : ''}
          </p>
        </div>
      </div>
      <div className="text-right text-[8.5px] text-neutral-500 leading-relaxed">
        <p>IFU&nbsp;: <span className="text-neutral-800 font-medium">{orNA(employer.ifu)}</span></p>
        <p>RCCM&nbsp;: <span className="text-neutral-800 font-medium">{orNA(employer.rccm)}</span></p>
        <p>NIF&nbsp;: <span className="text-neutral-800 font-medium">{orNA(employer.nif)}</span></p>
      </div>
    </div>

    <h1 className="text-center text-[13px] font-semibold uppercase tracking-[0.35em] text-neutral-900 mt-4">
      Bulletin de paie
    </h1>
  </header>
);

// ── Tableau principal des éléments de paie ──
type TableRow = {
  label: string;
  base?: number;
  taux?: number;
  gain?: number;
  retenue?: number;
  strong?: boolean;
};

const LignesTable: React.FC<{ rows: TableRow[]; currency: string }> = ({ rows, currency }) => {
  const totalGain = rows.reduce((s, r) => s + (r.gain || 0), 0);
  const totalRetenue = rows.reduce((s, r) => s + (r.retenue || 0), 0);

  const cell = 'py-[3.5px] px-2 align-top';

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-y border-neutral-300">
          <th className={`${cell} text-left text-[9px] font-semibold uppercase tracking-wider text-neutral-600`}>Libellé</th>
          <th className={`${cell} text-right text-[9px] font-semibold uppercase tracking-wider text-neutral-600 w-[15%]`}>Base</th>
          <th className={`${cell} text-center text-[9px] font-semibold uppercase tracking-wider text-neutral-600 w-[10%]`}>Taux</th>
          <th className={`${cell} text-right text-[9px] font-semibold uppercase tracking-wider text-neutral-600 w-[18%]`}>Gain</th>
          <th className={`${cell} text-right text-[9px] font-semibold uppercase tracking-wider text-neutral-600 w-[18%]`}>Retenue</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-neutral-100">
            <td className={`${cell} text-left text-[10px] ${r.strong ? 'font-semibold text-neutral-900' : 'text-neutral-800'}`}>
              {r.label}
            </td>
            <td className={`${cell} text-right text-[10px] tabular-nums text-neutral-700`}>
              {r.base !== undefined ? money(r.base, currency) : NA}
            </td>
            <td className={`${cell} text-center text-[10px] tabular-nums text-neutral-600`}>
              {r.taux !== undefined ? percent(r.taux) : NA}
            </td>
            <td className={`${cell} text-right text-[10px] tabular-nums ${r.gain ? 'text-neutral-900 font-medium' : 'text-neutral-300'}`}>
              {r.gain ? money(r.gain, currency) : NA}
            </td>
            <td className={`${cell} text-right text-[10px] tabular-nums ${r.retenue ? 'text-neutral-900 font-medium' : 'text-neutral-300'}`}>
              {r.retenue ? money(r.retenue, currency) : NA}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-neutral-800">
          <td className={`${cell} text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-900`} colSpan={3}>
            Totaux
          </td>
          <td className={`${cell} text-right text-[10.5px] font-bold tabular-nums text-neutral-900`}>{money(totalGain, currency)}</td>
          <td className={`${cell} text-right text-[10.5px] font-bold tabular-nums text-neutral-900`}>{money(totalRetenue, currency)}</td>
        </tr>
      </tfoot>
    </table>
  );
};

// ── Ligne du bloc résumé ──
const ResumeRow: React.FC<{ label: string; value: string; muted?: boolean }> = ({ label, value, muted }) => (
  <div className="flex justify-between items-baseline py-[3px]">
    <span className={`text-[10px] ${muted ? 'text-neutral-500' : 'text-neutral-700'}`}>{label}</span>
    <span className={`text-[10.5px] tabular-nums ${muted ? 'text-neutral-600' : 'text-neutral-900 font-medium'}`}>{value}</span>
  </div>
);

// ── Bloc résumé + Net à payer encadré ──
const ResumeBlock: React.FC<{
  brut: number;
  cotisations: number;
  retenues: number;
  avantages: number;
  netImposable: number;
  netAPayer: number;
  currency: string;
}> = ({ brut, cotisations, retenues, avantages, netImposable, netAPayer, currency }) => (
  <div className="flex justify-end">
    <div className="w-[58%]">
      <div className="border-t border-neutral-200 pt-1.5">
        <ResumeRow label="Salaire brut" value={money(brut, currency)} />
        <ResumeRow label="Cotisations sociales" value={`- ${money(cotisations, currency)}`} muted />
        <ResumeRow label="Autres retenues" value={`- ${money(retenues, currency)}`} muted />
        <ResumeRow label="Avantages / Primes" value={money(avantages, currency)} muted />
        <div className="border-t border-neutral-200 mt-1 pt-1">
          <ResumeRow label="Net imposable" value={money(netImposable, currency)} />
        </div>
      </div>

      {/* Net à payer — encadré discret, sans fond coloré */}
      <div
        className="mt-2 flex justify-between items-baseline px-3 py-2 border"
        style={{ borderColor: ACCENT }}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-900">Net à payer</span>
        <span className="text-[15px] font-bold tabular-nums" style={{ color: ACCENT }}>{money(netAPayer, currency)}</span>
      </div>
    </div>
  </div>
);

// ── Emplacement de signature ──
const SignatureSlot: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex-1">
    <p className="text-[9px] uppercase tracking-wider text-neutral-500 mb-8">{title}</p>
    <div className="border-t border-neutral-300" />
  </div>
);

// ── Pied de bulletin : paiement, observations, signatures ──
const PayslipFooter: React.FC<{
  employee: EmployeeInfo;
  data: PayslipData;
  observations?: string;
}> = ({ employee, data, observations }) => (
  <footer className="mt-auto pt-3">
    <div className="grid grid-cols-2 gap-6 pb-3 border-b border-neutral-200">
      <div>
        <h4 className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-900 mb-1">Observations</h4>
        <p className="text-[9.5px] text-neutral-600 leading-relaxed min-h-[28px]">{observations || NA}</p>
      </div>
      <div className="text-[9.5px] text-neutral-700 space-y-0.5">
        <div className="flex justify-between"><span className="text-neutral-500">Mode de paiement</span><span className="font-medium">{orNA(employee.modePaiement)}</span></div>
        <div className="flex justify-between"><span className="text-neutral-500">Compte bancaire</span><span className="font-medium">{orNA(employee.compteBancaire)}</span></div>
        <div className="flex justify-between"><span className="text-neutral-500">Date de paiement</span><span className="font-medium">{data.generated_at ? new Date(data.generated_at).toLocaleDateString('fr-FR') : NA}</span></div>
      </div>
    </div>

    <div className="flex gap-8 pt-4">
      <SignatureSlot title="Signature employeur" />
      <SignatureSlot title="Signature salarié" />
      <SignatureSlot title="Cachet" />
    </div>

    <p className="text-center text-[7.5px] text-neutral-400 mt-4 tracking-wide">Document généré automatiquement</p>
  </footer>
);

// ============================================================
// Composant principal
// ============================================================
export const BulletinPaiePDF: React.FC<BulletinPaiePDFProps> = ({
  data,
  employer,
  employee,
  currency = 'FCFA',
  observations,
}) => {
  // ── Dérivations financières ──
  const totalPrimes = (data.primes || []).reduce((s, p) => s + (p.montant || 0), 0);
  const totalRetenuesLibres = (data.retenues || []).reduce((s, r) => s + (r.montant || 0), 0);
  const brut = data.salaire_base + totalPrimes;
  const cotisations = data.cnss_salarial + data.amu_salarial;
  const netImposable = brut - cotisations;

  // Taux effectifs (calculés à partir des montants réels)
  const tauxSur = (montant: number, base: number) => (base > 0 ? (montant / base) * 100 : undefined);

  // ── Construction des lignes du tableau ──
  const rows: TableRow[] = [
    { label: 'Salaire de base', base: data.salaire_base, gain: data.salaire_base, strong: true },
    ...(data.primes || []).map((p) => ({ label: p.label || 'Prime', gain: p.montant })),
    { label: 'CNSS (part salariale)', base: brut, taux: tauxSur(data.cnss_salarial, brut), retenue: data.cnss_salarial },
    { label: 'AMU (part salariale)', base: brut, taux: tauxSur(data.amu_salarial, brut), retenue: data.amu_salarial },
    { label: 'IRPP', base: netImposable, taux: tauxSur(data.irpp, netImposable), retenue: data.irpp },
    ...(data.retenues || []).map((r) => ({ label: r.label || 'Retenue', retenue: r.montant })),
  ];

  return (
    <div
      className="bulletin-paie bg-white text-neutral-900 flex flex-col"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '12mm 14mm',
        fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
        boxSizing: 'border-box',
      }}
    >
      <PayslipHeader employer={employer} />

      {/* Séparation fine */}
      <hr className="border-neutral-200 my-3" />

      {/* Deux colonnes équilibrées : Employeur / Salarié */}
      <div className="flex gap-8">
        <InfoBlock title="Informations employeur">
          <InfoRow label="Raison sociale" value={employer.name} />
          <InfoRow label="Adresse" value={employer.address} />
          <InfoRow label="Téléphone" value={employer.telephone} />
          <InfoRow label="IFU" value={employer.ifu} />
          <InfoRow label="RCCM" value={employer.rccm} />
          <InfoRow label="Période de paie" value={formatPeriode(data.periode)} />
        </InfoBlock>

        <InfoBlock title="Informations salarié">
          <InfoRow label="Nom & prénom" value={employee.nom} />
          <InfoRow label="Matricule" value={employee.matricule} />
          <InfoRow label="Fonction" value={employee.fonction} />
          <InfoRow label="Département" value={employee.departement} />
          <InfoRow label="N° CNSS" value={employee.cnss} />
          <InfoRow label="Date d'embauche" value={employee.dateEmbauche} />
          <InfoRow label="Personnes à charge" value={data.personnes_a_charge} />
          <InfoRow label="Centre de coût" value={employee.centreCout} />
        </InfoBlock>
      </div>

      {/* Séparation fine */}
      <hr className="border-neutral-200 my-3" />

      {/* Tableau principal */}
      <LignesTable rows={rows} currency={currency} />

      {/* Résumé + Net à payer */}
      <div className="mt-4">
        <ResumeBlock
          brut={brut}
          cotisations={cotisations}
          retenues={totalRetenuesLibres + data.irpp}
          avantages={totalPrimes}
          netImposable={netImposable}
          netAPayer={data.net_a_payer}
          currency={currency}
        />
      </div>

      {/* Charges patronales — mention discrète */}
      <p className="text-[8px] text-neutral-400 mt-2 text-right">
        Charges patronales : CNSS {money(data.cnss_patronal, currency)} · AMU {money(data.amu_patronal, currency)}
      </p>

      <PayslipFooter employee={employee} data={data} observations={observations} />
    </div>
  );
};

export default BulletinPaiePDF;
