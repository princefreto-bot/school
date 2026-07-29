// ============================================================
// REÇU DE PAIEMENT — Document comptable sobre et professionnel
// Inspiré des ERP/RH : Sage, Odoo, SAP, Oracle, Workday, PayFit.
//
// Charte : fond blanc · texte noir · gris pour les filets ·
// un seul accent discret (#820000). Aucune bande colorée, aucun
// dégradé, aucune carte, aucune icône superflue. Typographie Inter.
// Optimisé A4, lisible en A5. QR code de vérification.
// ============================================================
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { SchoolLogo } from './SchoolLogo';
import { Student, Payment } from '../../types';

const ACCENT = '#820000';
const NA = '—';

const money = (n: number, c = 'FCFA') =>
  `${new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))} ${c}`;
const orNA = (v?: string | number | null) =>
  v === undefined || v === null || v === '' ? NA : String(v);

export interface ReceiptEmployer {
  name: string;
  logo?: string | null;
  address?: string;
  telephone?: string;
  email?: string;
  website?: string;
  autorisation?: string;
}

interface RecuPaiementPDFProps {
  student: Student;
  /** Transaction documentée par ce reçu (défaut : dernier versement). */
  payment?: Payment;
  employer: ReceiptEmployer;
  parentName?: string;
  schoolYear: string;
  currency?: string;
  cashierName?: string;
  stamp?: string | null;
}

// ── Ligne d'information (clé grise / valeur noire) ──
const InfoRow: React.FC<{ label: string; value?: string | number | null; accent?: boolean }> = ({ label, value, accent }) => (
  <div className="flex justify-between gap-3 py-[3px] border-b border-neutral-100 last:border-0">
    <span className="text-[9px] uppercase tracking-wide text-neutral-500">{label}</span>
    <span className={`text-[10px] font-medium text-right leading-tight ${accent ? '' : 'text-neutral-900'}`} style={accent ? { color: ACCENT } : undefined}>
      {orNA(value)}
    </span>
  </div>
);

// ── EN-TÊTE ──
const ReceiptHeader: React.FC<{ employer: ReceiptEmployer; schoolYear: string }> = ({ employer, schoolYear }) => (
  <header>
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <SchoolLogo src={employer.logo} name={employer.name} sizeMm={16} />
        <div className="leading-snug">
          <p className="text-[15px] font-bold tracking-tight text-neutral-900">{employer.name}</p>
          {employer.address && <p className="text-[9px] text-neutral-600">{employer.address}</p>}
          <p className="text-[9px] text-neutral-600">
            {employer.telephone ? `Tél. ${employer.telephone}` : ''}
            {employer.email ? `${employer.telephone ? ' · ' : ''}${employer.email}` : ''}
          </p>
          {employer.website && <p className="text-[9px] text-neutral-600">{employer.website}</p>}
        </div>
      </div>
      <div className="text-right text-[8.5px] text-neutral-500 leading-relaxed">
        <p>Année scolaire&nbsp;: <span className="text-neutral-800 font-medium">{orNA(schoolYear)}</span></p>
        {employer.autorisation && <p>Autorisation&nbsp;: <span className="text-neutral-800 font-medium">{employer.autorisation}</span></p>}
      </div>
    </div>

    <h1 className="text-center text-[13px] font-semibold uppercase tracking-[0.35em] text-neutral-900 mt-4">
      Reçu de paiement
    </h1>
  </header>
);

// ── MÉTA DU REÇU (N°, date, heure, mode, référence, statut) ──
const ReceiptMeta: React.FC<{
  numero: string; date: string; heure: string; mode: string; reference: string; solde: boolean;
}> = ({ numero, date, heure, mode, reference, solde }) => (
  <div className="flex items-stretch justify-between gap-6 mt-3">
    <div className="flex-1 grid grid-cols-2 gap-x-6">
      <InfoRow label="N° du reçu" value={numero} accent />
      <InfoRow label="Mode de paiement" value={mode} />
      <InfoRow label="Date" value={date} />
      <InfoRow label="Référence" value={reference} />
      <InfoRow label="Heure" value={heure} />
      <InfoRow label="Statut" value={solde ? 'Soldé' : 'Partiel'} />
    </div>
    <div className="flex items-center">
      <div className="text-center px-4 py-2 border" style={{ borderColor: ACCENT }}>
        <p className="text-[8px] uppercase tracking-widest text-neutral-500 leading-none mb-1">Statut</p>
        <p className="text-[13px] font-bold leading-none" style={{ color: ACCENT }}>✓ PAYÉ</p>
      </div>
    </div>
  </div>
);

// ── INFORMATIONS ÉLÈVE ──
const ReceiptStudentInfo: React.FC<{
  student: Student; parentName?: string; schoolYear: string;
}> = ({ student, parentName, schoolYear }) => (
  <div>
    <h3 className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-900 pb-1 mb-1 border-b" style={{ borderColor: ACCENT }}>
      Informations de l'élève
    </h3>
    <div className="flex gap-8">
      <div className="flex-1">
        <InfoRow label="Nom complet" value={`${student.prenom} ${student.nom}`} />
        <InfoRow label="Matricule" value={student.adsn || student.numeroTable} />
        <InfoRow label="Classe" value={student.classe} />
        <InfoRow label="Sexe" value={student.sexe === 'M' ? 'Masculin' : student.sexe === 'F' ? 'Féminin' : student.sexe} />
      </div>
      <div className="flex-1">
        <InfoRow label="Parent / Tuteur" value={parentName} />
        <InfoRow label="Téléphone parent" value={student.telephone} />
        <InfoRow label="Année scolaire" value={schoolYear} />
        <InfoRow label="Cycle" value={student.cycle} />
      </div>
    </div>
  </div>
);

// ── DÉTAIL DU PAIEMENT (tableau) ──
type DetailRow = { label: string; montant?: number; reduction?: number; paye?: number; reste?: number; strong?: boolean };

const ReceiptPaymentTable: React.FC<{ rows: DetailRow[]; currency: string }> = ({ rows, currency }) => {
  const cell = 'py-[4px] px-2 align-top';
  const num = (v?: number) => (v || v === 0 ? money(v, currency) : NA);
  const tot = (k: keyof DetailRow) => rows.reduce((s, r) => s + (Number(r[k]) || 0), 0);
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-y border-neutral-300">
          <th className={`${cell} text-left text-[9px] font-semibold uppercase tracking-wider text-neutral-600`}>Libellé</th>
          <th className={`${cell} text-right text-[9px] font-semibold uppercase tracking-wider text-neutral-600 w-[18%]`}>Montant</th>
          <th className={`${cell} text-right text-[9px] font-semibold uppercase tracking-wider text-neutral-600 w-[16%]`}>Réduction</th>
          <th className={`${cell} text-right text-[9px] font-semibold uppercase tracking-wider text-neutral-600 w-[18%]`}>Montant payé</th>
          <th className={`${cell} text-right text-[9px] font-semibold uppercase tracking-wider text-neutral-600 w-[16%]`}>Reste</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-neutral-100">
            <td className={`${cell} text-left text-[10px] ${r.strong ? 'font-semibold text-neutral-900' : 'text-neutral-800'}`}>{r.label}</td>
            <td className={`${cell} text-right text-[10px] tabular-nums text-neutral-700`}>{num(r.montant)}</td>
            <td className={`${cell} text-right text-[10px] tabular-nums ${r.reduction ? 'text-neutral-700' : 'text-neutral-300'}`}>{r.reduction ? num(r.reduction) : NA}</td>
            <td className={`${cell} text-right text-[10px] tabular-nums text-neutral-900 font-medium`}>{num(r.paye)}</td>
            <td className={`${cell} text-right text-[10px] tabular-nums ${(r.reste || 0) > 0 ? 'text-neutral-900' : 'text-neutral-400'}`}>{num(r.reste)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-neutral-800">
          <td className={`${cell} text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-900`}>Totaux</td>
          <td className={`${cell} text-right text-[10px] font-bold tabular-nums text-neutral-900`}>{money(tot('montant'), currency)}</td>
          <td className={`${cell} text-right text-[10px] font-bold tabular-nums text-neutral-900`}>{money(tot('reduction'), currency)}</td>
          <td className={`${cell} text-right text-[10px] font-bold tabular-nums text-neutral-900`}>{money(tot('paye'), currency)}</td>
          <td className={`${cell} text-right text-[10px] font-bold tabular-nums text-neutral-900`}>{money(tot('reste'), currency)}</td>
        </tr>
      </tfoot>
    </table>
  );
};

// ── RÉCAPITULATIF ──
const ReceiptSummary: React.FC<{
  totalDu: number; reduction: number; paye: number; reste: number; currency: string;
}> = ({ totalDu, reduction, paye, reste, currency }) => (
  <div className="flex justify-end">
    <div className="w-[52%]">
      <div className="border-t border-neutral-200 pt-1.5">
        <div className="flex justify-between py-[3px]"><span className="text-[10px] text-neutral-700">Total dû</span><span className="text-[10.5px] tabular-nums text-neutral-900">{money(totalDu, currency)}</span></div>
        <div className="flex justify-between py-[3px]"><span className="text-[10px] text-neutral-500">Réduction</span><span className="text-[10.5px] tabular-nums text-neutral-600">{money(reduction, currency)}</span></div>
        <div className="flex justify-between items-baseline py-[3px] border-t border-neutral-200 mt-1">
          <span className="text-[11px] font-semibold text-neutral-900">Montant payé</span>
          <span className="text-[14px] font-bold tabular-nums text-neutral-900">{money(paye, currency)}</span>
        </div>
      </div>
      <div className="mt-2 flex justify-between items-baseline px-3 py-2 border" style={{ borderColor: ACCENT }}>
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-neutral-900">Reste à payer</span>
        <span className="text-[13px] font-bold tabular-nums" style={{ color: reste > 0 ? ACCENT : '#171717' }}>{money(reste, currency)}</span>
      </div>
    </div>
  </div>
);

// ── QR CODE DE VÉRIFICATION ──
const ReceiptQRCode: React.FC<{ value: string }> = ({ value }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="p-1 border border-neutral-200 bg-white">
      <QRCodeSVG value={value} size={78} level="M" bgColor="#ffffff" fgColor="#171717" />
    </div>
    <span className="text-[7px] uppercase tracking-widest text-neutral-400">Vérification</span>
  </div>
);

// ── PIED DE PAGE (caissier, signature, cachet, QR) ──
const ReceiptFooter: React.FC<{ cashierName?: string; stamp?: string | null; qrValue: string }> = ({ cashierName, stamp, qrValue }) => (
  <footer className="mt-auto pt-3">
    <div className="flex justify-between items-end gap-6 pb-3 border-b border-neutral-200">
      <div className="flex-1">
        <p className="text-[9px] uppercase tracking-wider text-neutral-500 mb-1">Caissier</p>
        <p className="text-[10px] font-medium text-neutral-900 mb-6">{orNA(cashierName)}</p>
        <div className="border-t border-neutral-300 w-40" />
        <p className="text-[8px] uppercase tracking-wider text-neutral-500 mt-1">Signature</p>
      </div>

      <div className="flex-1 flex flex-col items-center">
        {stamp ? (
          <img src={stamp} alt="Cachet" className="h-16 object-contain opacity-90" />
        ) : (
          <div className="h-16 w-28 border border-dashed border-neutral-300 flex items-center justify-center">
            <span className="text-[8px] uppercase tracking-widest text-neutral-400">Cachet</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex justify-end">
        <ReceiptQRCode value={qrValue} />
      </div>
    </div>

    <p className="text-center text-[7.5px] text-neutral-400 mt-3 tracking-wide leading-relaxed">
      Ce reçu est généré automatiquement par le système et ne nécessite pas de signature manuscrite.
    </p>
  </footer>
);

// ============================================================
// Composant principal
// ============================================================
export const RecuPaiementPDF: React.FC<RecuPaiementPDFProps> = ({
  student, payment, employer, parentName, schoolYear, currency = 'FCFA', cashierName, stamp,
}) => {
  const tx = payment
    || (student.historiquesPaiements && student.historiquesPaiements.length
      ? [...student.historiquesPaiements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      : undefined);

  const numero = tx?.recu || student.recu || `REC-${student.id.slice(0, 8).toUpperCase()}`;
  const when = tx?.date ? new Date(tx.date) : new Date(student.updatedAt);
  const date = when.toLocaleDateString('fr-FR');
  const heure = when.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const mode = tx?.mode || tx?.methode || 'Espèces';
  const reference = tx?.reference || NA;

  const totalDu = student.ecolage || 0;
  // Réduction = somme des réductions accordées sur l'ensemble des versements.
  const reduction = (student.historiquesPaiements || []).reduce((t, p) => t + (Number(p.reduction) || 0), 0);
  const paye = student.dejaPaye || 0;
  // Reste cohérent sur le document : dû − réduction − payé.
  const reste = Math.max(0, totalDu - reduction - paye);
  const solde = reste <= 0;

  // QR : le numéro de reçu suffit à la vérification (page Vérif. Reçus).
  const qrValue = numero;

  const detailRows: DetailRow[] = [
    { label: `Frais de scolarité — ${schoolYear || ''}`.trim(), montant: totalDu, reduction, paye, reste, strong: true },
  ];

  return (
    <div
      className="recu-paiement bg-white text-neutral-900 flex flex-col"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '12mm 14mm',
        fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
        boxSizing: 'border-box',
      }}
    >
      <ReceiptHeader employer={employer} schoolYear={schoolYear} />
      <ReceiptMeta numero={numero} date={date} heure={heure} mode={mode} reference={reference} solde={solde} />

      <hr className="border-neutral-200 my-3" />

      <ReceiptStudentInfo student={student} parentName={parentName} schoolYear={schoolYear} />

      <hr className="border-neutral-200 my-3" />

      <ReceiptPaymentTable rows={detailRows} currency={currency} />

      <div className="mt-4">
        <ReceiptSummary totalDu={totalDu} reduction={reduction} paye={paye} reste={reste} currency={currency} />
      </div>

      <ReceiptFooter cashierName={cashierName} stamp={stamp} qrValue={qrValue} />
    </div>
  );
};

export default RecuPaiementPDF;
