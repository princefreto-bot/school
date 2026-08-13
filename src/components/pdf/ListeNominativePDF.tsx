// ============================================================
// LISTE NOMINATIVE — Roster imprimable par classe, prêt pour les
// démarches administratives (DRENA, examens) : aucune donnée
// financière, uniquement l'identité des élèves.
// Même charte sobre que le reçu de paiement (RecuPaiementPDF) :
// fond blanc, texte noir, un seul accent discret.
// ============================================================
import React from 'react';
import { SchoolLogo } from './SchoolLogo';
import { Student } from '../../types';

const ACCENT = '#820000';
const NA = '—';

const orNA = (v?: string | number | null) =>
  v === undefined || v === null || v === '' ? NA : String(v);

export interface RosterEmployer {
  name: string;
  logo?: string | null;
  address?: string;
  telephone?: string;
  email?: string;
}

interface ListeNominativePDFProps {
  students: Student[];
  classe: string;
  cycle?: string;
  employer: RosterEmployer;
  schoolYear: string;
  countryName?: string;
  countryMotto?: string;
  ministereName?: string;
  directorName?: string;
  stamp?: string | null;
}

const getDateFr = (): string => {
  const d = new Date();
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return `${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`;
};

export const ListeNominativePDF: React.FC<ListeNominativePDFProps> = ({
  students, classe, cycle, employer, schoolYear,
  countryName = 'République Togolaise', countryMotto = 'Travail – Liberté – Patrie',
  ministereName = "Ministère de l'Éducation Nationale",
  directorName, stamp,
}) => {
  const sorted = [...students].sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
  const garcons = sorted.filter((s) => s.sexe === 'M').length;
  const filles = sorted.filter((s) => s.sexe === 'F').length;

  return (
    <div
      className="liste-nominative bg-white text-neutral-900 flex flex-col"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '12mm 14mm',
        fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
        boxSizing: 'border-box',
      }}
    >
      {/* ── EN-TÊTE OFFICIEL ── */}
      <header>
        <div className="text-center text-[9px] leading-tight text-neutral-600 mb-2">
          <p className="font-semibold text-neutral-800">{countryName}</p>
          <p>{countryMotto}</p>
          <p>{ministereName}</p>
        </div>
        <div className="flex items-start justify-between gap-4 pt-2 border-t border-neutral-200">
          <div className="flex items-start gap-3 pt-2">
            <SchoolLogo src={employer.logo} name={employer.name} sizeMm={16} />
            <div className="leading-snug">
              <p className="text-[15px] font-bold tracking-tight text-neutral-900">{employer.name}</p>
              {employer.address && <p className="text-[9px] text-neutral-600">{employer.address}</p>}
              <p className="text-[9px] text-neutral-600">
                {employer.telephone ? `Tél. ${employer.telephone}` : ''}
                {employer.email ? `${employer.telephone ? ' · ' : ''}${employer.email}` : ''}
              </p>
            </div>
          </div>
          <div className="text-right text-[8.5px] text-neutral-500 leading-relaxed pt-2">
            <p>Année scolaire&nbsp;: <span className="text-neutral-800 font-medium">{orNA(schoolYear)}</span></p>
            <p>Édité le&nbsp;: <span className="text-neutral-800 font-medium">{getDateFr()}</span></p>
          </div>
        </div>

        <h1 className="text-center text-[13px] font-semibold uppercase tracking-[0.35em] text-neutral-900 mt-5">
          Liste nominative des élèves
        </h1>
        <p className="text-center text-[11px] font-medium mt-1" style={{ color: ACCENT }}>
          Classe {classe}{cycle ? ` — ${cycle}` : ''}
        </p>
      </header>

      <hr className="border-neutral-200 my-3" />

      {/* ── TABLEAU ── */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-y border-neutral-300">
            <th className="py-[4px] px-2 text-left text-[9px] font-semibold uppercase tracking-wider text-neutral-600 w-[8%]">N°</th>
            <th className="py-[4px] px-2 text-left text-[9px] font-semibold uppercase tracking-wider text-neutral-600 w-[18%]">Matricule</th>
            <th className="py-[4px] px-2 text-left text-[9px] font-semibold uppercase tracking-wider text-neutral-600">Nom et prénoms</th>
            <th className="py-[4px] px-2 text-center text-[9px] font-semibold uppercase tracking-wider text-neutral-600 w-[8%]">Sexe</th>
            <th className="py-[4px] px-2 text-right text-[9px] font-semibold uppercase tracking-wider text-neutral-600 w-[16%]">Date de naissance</th>
            <th className="py-[4px] px-2 text-right text-[9px] font-semibold uppercase tracking-wider text-neutral-600 w-[14%]">Statut</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s, i) => (
            <tr key={s.id} className="border-b border-neutral-100">
              <td className="py-[4px] px-2 text-left text-[10px] text-neutral-700 tabular-nums">{i + 1}</td>
              <td className="py-[4px] px-2 text-left text-[10px] text-neutral-700">{orNA(s.adsn)}</td>
              <td className="py-[4px] px-2 text-left text-[10px] font-medium text-neutral-900">{s.nom} {s.prenom}</td>
              <td className="py-[4px] px-2 text-center text-[10px] text-neutral-700">{s.sexe === 'M' ? 'M' : s.sexe === 'F' ? 'F' : NA}</td>
              <td className="py-[4px] px-2 text-right text-[10px] text-neutral-700 tabular-nums">{orNA(s.dateNaissance)}</td>
              <td className="py-[4px] px-2 text-right text-[10px] text-neutral-700">{s.redoublant ? 'Redoublant' : 'Régulier'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {sorted.length === 0 && (
        <p className="text-center text-[11px] text-neutral-400 py-8">Aucun élève dans cette classe.</p>
      )}

      {/* ── RÉCAPITULATIF ── */}
      <div className="mt-4 flex justify-between items-center px-3 py-2 border" style={{ borderColor: ACCENT }}>
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-neutral-900">Effectif total</span>
        <span className="text-[11px] text-neutral-700">
          <span className="font-bold" style={{ color: ACCENT }}>{sorted.length}</span> élève{sorted.length > 1 ? 's' : ''}
          <span className="text-neutral-400 mx-2">·</span>
          {garcons} garçon{garcons > 1 ? 's' : ''}
          <span className="text-neutral-400 mx-2">·</span>
          {filles} fille{filles > 1 ? 's' : ''}
        </span>
      </div>

      {/* ── PIED DE PAGE ── */}
      <footer className="mt-auto pt-8">
        <div className="flex justify-between items-end gap-6">
          <div className="text-[9px] text-neutral-500">
            <p>Fait à {orNA(employer.address?.split(',')[0])}, le {getDateFr()}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-[9px] uppercase tracking-wider text-neutral-500">Le Directeur / La Directrice</p>
            {stamp ? (
              <img src={stamp} alt="Cachet" className="h-14 object-contain opacity-90 my-1" />
            ) : (
              <div className="h-14 w-24 border border-dashed border-neutral-300 flex items-center justify-center my-1">
                <span className="text-[8px] uppercase tracking-widest text-neutral-400">Cachet</span>
              </div>
            )}
            <p className="text-[10px] font-medium text-neutral-900">{orNA(directorName)}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ListeNominativePDF;
