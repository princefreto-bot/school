// ============================================================
// PAGE DOCUMENTS — Génération PDF individuelle & masse
// ============================================================
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Student } from '../types';
// Config de classes non nécessaire ici — on utilise les classes réelles des élèves
import { generateRecuPDF, generateClassePDF, generateNonSoldesPDF } from '../utils/pdfGenerator';
import { exportToExcel } from '../utils/excelExport';
import {
  FileText, Download, Users, AlertTriangle,
  CheckCircle, MessageCircle, BookOpen, Printer
} from 'lucide-react';

const fmtMoney = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

// Badge dynamique
const DynamicBadge: React.FC<{ student: Student }> = ({ student }) => {
  const taux = student.ecolage > 0 ? student.dejaPaye / student.ecolage : 0;
  if (student.restant <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-300">
        <CheckCircle className="w-3 h-3" /> Parent Responsable · Élève Soldé
      </span>
    );
  }
  if (taux >= 0.7) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold border border-blue-300">
        ✓ 2ᵉ Tranche Validée (≥70%)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold border border-red-300">
      <AlertTriangle className="w-3 h-3" /> Non soldé · Rappel
    </span>
  );
};

// Carte élève
const StudentCard: React.FC<{ student: Student; schoolName: string; schoolYear: string; msgRem: string; msgRap: string; schoolLogo?: string }> = ({
  student, schoolName, schoolYear, msgRem, msgRap, schoolLogo,
}) => {
  const taux = Math.round((student.dejaPaye / student.ecolage) * 100);
  const phone = student.telephone.replace(/\D/g, '');
  const waMsg = student.restant <= 0
    ? `Bonjour, parent de ${student.prenom} ${student.nom} (${student.classe}). ${msgRem} — ${schoolName}`
    : `Bonjour, parent de ${student.prenom} ${student.nom} (${student.classe}). Restant : ${fmtMoney(student.restant)}. ${msgRap} — ${schoolName}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{student.prenom} {student.nom}</p>
          <p className="text-xs text-gray-500">{student.classe} · {student.cycle}</p>
          <div className="mt-2">
            <DynamicBadge student={student} />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-gray-400">Écolage</p>
              <p className="font-medium text-gray-700">{new Intl.NumberFormat('fr-FR').format(student.ecolage)} F</p>
            </div>
            <div>
              <p className="text-gray-400">Payé</p>
              <p className="font-medium text-emerald-700">{new Intl.NumberFormat('fr-FR').format(student.dejaPaye)} F</p>
            </div>
            <div>
              <p className="text-gray-400">Restant</p>
              <p className={`font-medium ${student.restant <= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {student.restant <= 0 ? 'SOLDÉ' : `${new Intl.NumberFormat('fr-FR').format(student.restant)} F`}
              </p>
            </div>
          </div>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{
              width: `${taux}%`,
              background: taux >= 100 ? '#16a34a' : taux >= 70 ? '#2563eb' : taux >= 30 ? '#f59e0b' : '#ef4444'
            }} />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-50">
        <button
          onClick={() => generateRecuPDF(student, schoolName, schoolYear, msgRem, msgRap, schoolLogo)}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
        >
          <Printer className="w-3 h-3" /> Reçu PDF
        </button>
        <a
          href={`https://wa.me/${phone}?text=${encodeURIComponent(waMsg)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors"
        >
          <MessageCircle className="w-3 h-3" /> WhatsApp
        </a>
      </div>
    </div>
  );
};

export const Documents: React.FC = () => {
  const students            = useStore((s) => s.students);
  const schoolName          = useStore((s) => s.schoolName);
  const schoolYear          = useStore((s) => s.schoolYear);
  const messageRemerciement = useStore((s) => s.messageRemerciement);
  const messageRappel       = useStore((s) => s.messageRappel);
  const schoolLogo          = useStore((s) => s.schoolLogo);

  const [filterClasse, setFilterClasse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [generating, setGenerating]     = useState(false);

  // Classes réellement présentes chez les élèves (triées par cycle)
  const cycleOrder = { 'Primaire': 1, 'Collège': 2, 'Lycée': 3 };
  const classes = [...new Set(students.map((s) => s.classe))]
    .sort((a, b) => {
      const sA = students.find((s) => s.classe === a);
      const sB = students.find((s) => s.classe === b);
      const cA = cycleOrder[sA?.cycle as keyof typeof cycleOrder] || 0;
      const cB = cycleOrder[sB?.cycle as keyof typeof cycleOrder] || 0;
      return cA - cB || a.localeCompare(b);
    });

  const filtered = students
    .filter((s) => !filterClasse || s.classe === filterClasse)
    .filter((s) => !filterStatus || s.status === filterStatus);

  const nonSoldes = students.filter((s) => s.status !== 'Soldé');

  const handleGenereClasse = async (classe: string) => {
    setGenerating(true);
    const cls = students.filter((s) => s.classe === classe);
    await generateClassePDF(cls, classe, schoolName, schoolYear, messageRemerciement, messageRappel, schoolLogo ?? undefined);
    setGenerating(false);
  };

  const handleGenereNonSoldes = async () => {
    setGenerating(true);
    await generateNonSoldesPDF(nonSoldes, schoolName, schoolYear, messageRappel, schoolLogo ?? undefined);
    setGenerating(false);
  };

  const handleExportExcel = () => {
    exportToExcel(students, `export_${schoolYear}`);
  };

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <FileText className="w-16 h-16 text-gray-200 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Aucun document disponible</h2>
        <p className="text-gray-400 max-w-sm">Importez des élèves depuis la page Élèves pour générer des documents.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions de masse */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Download className="w-4 h-4 text-blue-600" /> Génération de masse
        </h3>
        <div className="flex flex-wrap gap-3">
          {/* Par classe */}
          {classes.filter((c) => students.some((s) => s.classe === c)).map((classe) => (
            <button
              key={classe}
              onClick={() => handleGenereClasse(classe)}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-medium transition-colors border border-blue-200 disabled:opacity-50"
            >
              <BookOpen className="w-4 h-4" />
              PDF {classe} ({students.filter((s) => s.classe === classe).length} élèves)
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={handleGenereNonSoldes}
            disabled={generating || nonSoldes.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-sm font-medium transition-colors border border-red-200 disabled:opacity-50"
          >
            <AlertTriangle className="w-4 h-4" />
            PDF Non soldés ({nonSoldes.length})
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-sm font-medium transition-colors border border-emerald-200"
          >
            <Download className="w-4 h-4" />
            Export Excel mis à jour
          </button>
        </div>
        {generating && (
          <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Génération en cours…
          </div>
        )}
      </div>

      {/* Filtres individuels */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" /> Documents individuels
        </h3>
        <div className="flex flex-wrap gap-3 mb-4">
          <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={filterClasse} onChange={(e) => setFilterClasse(e.target.value)}>
            <option value="">Toutes les classes</option>
            {classes.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option>Soldé</option>
            <option>Partiel</option>
            <option>Non soldé</option>
          </select>
          {(filterClasse || filterStatus) && (
            <button onClick={() => { setFilterClasse(''); setFilterStatus(''); }} className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl border border-red-100 transition-colors">
              Réinitialiser
            </button>
          )}
          <span className="flex items-center text-xs text-gray-400 ml-auto">{filtered.length} élève(s) affiché(s)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              schoolName={schoolName}
              schoolYear={schoolYear}
              msgRem={messageRemerciement}
              msgRap={messageRappel}
              schoolLogo={schoolLogo ?? undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
