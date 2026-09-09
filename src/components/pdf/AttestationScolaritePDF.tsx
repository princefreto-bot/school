// ============================================================
// ATTESTATION DE SCOLARITÉ — Document officiel A4, une page,
// même charte sobre que les autres documents (reçu, bulletins).
// ============================================================
import React from 'react';
import { SchoolLogo } from './SchoolLogo';
import { Student } from '../../types';

const ACCENT = '#820000';
const NA = '.....................................';

const orNA = (v?: string | number | null) =>
  v === undefined || v === null || v === '' ? NA : String(v);

export interface AttestationEmployer {
  name: string;
  logo?: string | null;
  address?: string;
  telephone?: string;
  email?: string;
}

interface AttestationScolaritePDFProps {
  student: Student;
  employer: AttestationEmployer;
  schoolYear: string;
  countryName?: string;
  countryMotto?: string;
  ministereName?: string;
  directorName?: string;
  directorTitle?: string;
  stamp?: string | null;
  officialSeal?: string | null;
  directorSignature?: string | null;
}

const getDateFr = (): string => {
  const d = new Date();
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return `${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`;
};

export const AttestationScolaritePDF: React.FC<AttestationScolaritePDFProps> = ({
  student, employer, schoolYear,
  countryName = 'République Togolaise', countryMotto = 'Travail – Liberté – Patrie',
  ministereName = "Ministère de l'Éducation Nationale",
  directorName, directorTitle = 'Directeur', stamp, officialSeal, directorSignature,
}) => {
  const civilite = student.sexe === 'F' ? 'La nommée' : 'Le nommé';
  const neLe = student.sexe === 'F' ? 'née le' : 'né le';

  return (
    <div
      className="attestation-scolarite bg-white text-neutral-900 flex flex-col"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '18mm 20mm',
        fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
        boxSizing: 'border-box',
      }}
    >
      {/* ── EN-TÊTE OFFICIEL ── */}
      <header>
        <div className="text-center text-[10px] leading-tight text-neutral-600 mb-3">
          <p className="font-semibold text-neutral-800">{countryName}</p>
          <p>{countryMotto}</p>
          <p>{ministereName}</p>
        </div>
        <div className="flex items-start gap-3 pt-3 border-t border-neutral-200">
          <SchoolLogo src={employer.logo} name={employer.name} sizeMm={18} />
          <div className="leading-snug">
            <p className="text-[16px] font-bold tracking-tight text-neutral-900">{employer.name}</p>
            {employer.address && <p className="text-[9.5px] text-neutral-600">{employer.address}</p>}
            <p className="text-[9.5px] text-neutral-600">
              {employer.telephone ? `Tél. ${employer.telephone}` : ''}
              {employer.email ? `${employer.telephone ? ' · ' : ''}${employer.email}` : ''}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center mt-10">
        <h1 className="text-center text-[20px] font-bold uppercase tracking-[0.3em] text-neutral-900 mb-1">
          Attestation de Scolarité
        </h1>
        <p className="text-center text-[10px] text-neutral-500 mb-10">
          N° {NA} / {orNA(schoolYear)}
        </p>

        <p className="text-[12.5px] leading-[2] text-neutral-800 text-justify" style={{ textIndent: '2em' }}>
          Je soussigné(e), <strong>{orNA(directorName)}</strong>, {directorTitle?.toLowerCase() || 'directeur'} de l'établissement <strong>{employer.name}</strong>,
          certifie que :
        </p>

        <div className="my-6 mx-auto w-full max-w-[440px] border border-neutral-300" style={{ borderColor: ACCENT }}>
          <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 p-5 text-[12.5px]">
            <span className="text-neutral-500 font-semibold uppercase text-[10px] tracking-wide">Nom &amp; Prénoms</span>
            <span className="font-bold text-neutral-900">{student.nom} {student.prenom}</span>

            <span className="text-neutral-500 font-semibold uppercase text-[10px] tracking-wide">{neLe}</span>
            <span className="font-medium text-neutral-900">
              {orNA(student.dateNaissance)}{student.lieuNaissance ? ` à ${student.lieuNaissance}` : ''}
            </span>

            <span className="text-neutral-500 font-semibold uppercase text-[10px] tracking-wide">Matricule</span>
            <span className="font-medium text-neutral-900">{orNA(student.adsn)}</span>

            <span className="text-neutral-500 font-semibold uppercase text-[10px] tracking-wide">Classe</span>
            <span className="font-medium text-neutral-900">{student.classe}</span>
          </div>
        </div>

        <p className="text-[12.5px] leading-[2] text-neutral-800 text-justify" style={{ textIndent: '2em' }}>
          {civilite} ci-dessus est régulièrement inscrit(e) dans notre établissement en classe de <strong>{student.classe}</strong>,
          au titre de l'année scolaire <strong>{orNA(schoolYear)}</strong>.
        </p>
        <p className="text-[12.5px] leading-[2] text-neutral-800 text-justify mt-4" style={{ textIndent: '2em' }}>
          En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que de droit.
        </p>
      </div>

      {/* ── PIED DE PAGE ── */}
      <footer className="pt-10">
        <div className="flex justify-end">
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-[10px] text-neutral-500 mb-1">
              Fait à {orNA(employer.address?.split(',')[0])}, le {getDateFr()}
            </p>
            <p className="text-[9px] uppercase tracking-wider text-neutral-500">{directorTitle || 'Le Directeur'}</p>
            <div className="relative h-16 w-32 flex items-center justify-center my-1">
              {officialSeal && (
                <img src={officialSeal} alt="Sceau" className="absolute inset-0 h-full w-full object-contain opacity-90" />
              )}
              {stamp && (
                <img src={stamp} alt="Cachet" className="absolute inset-0 h-full w-full object-contain opacity-90" />
              )}
              {directorSignature && (
                <img src={directorSignature} alt="Signature" className="absolute bottom-0 h-8 object-contain" />
              )}
              {!officialSeal && !stamp && !directorSignature && (
                <div className="h-full w-full border border-dashed border-neutral-300 flex items-center justify-center">
                  <span className="text-[8px] uppercase tracking-widest text-neutral-400">Cachet &amp; signature</span>
                </div>
              )}
            </div>
            <p className="text-[10px] font-medium text-neutral-900">{orNA(directorName)}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AttestationScolaritePDF;
