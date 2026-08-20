import React, { useMemo, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { useReactToPrint } from 'react-to-print';
import { BarChart2, Cake, Printer, Users } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { computeAgeSexStats, calculerAge } from '../services/analyticsService';
import { StatistiquesElevesPDF } from '../components/pdf/StatistiquesElevesPDF';

const GENDER_COLORS = { garcons: '#2563eb', filles: '#ec4899' };

export const StatistiquesEleves: React.FC = () => {
  const students = useStore((s) => s.students);
  const {
    schoolName, schoolLogo, schoolStamp, schoolYear, schoolAddress, schoolTelephone, schoolEmail,
    countryName, countryMotto, ministereName, directorName,
  } = useStore();

  const [filterCycle, setFilterCycle] = useState('');
  const [filterClasse, setFilterClasse] = useState('');

  const cyclesList = useMemo(() => Array.from(new Set(students.map((s) => s.cycle))).sort(), [students]);
  const classesList = useMemo(() => {
    const base = filterCycle ? students.filter((s) => s.cycle === filterCycle) : students;
    return Array.from(new Set(base.map((s) => s.classe))).sort();
  }, [students, filterCycle]);

  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => !filterCycle || s.cycle === filterCycle)
      .filter((s) => !filterClasse || s.classe === filterClasse)
      .sort((a, b) => (a.classe || '').localeCompare(b.classe || '') || (a.nom || '').localeCompare(b.nom || ''));
  }, [students, filterCycle, filterClasse]);

  const stats = useMemo(() => computeAgeSexStats(filteredStudents), [filteredStudents]);

  const scopeLabel = filterClasse
    ? `Classe ${filterClasse}`
    : filterCycle
      ? `Cycle ${filterCycle}`
      : 'Toutes classes';

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Statistiques_Eleves_${scopeLabel}`.replace(/\s+/g, '_'),
    pageStyle: `
      @page { size: A4 portrait; margin: 0; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    `,
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-500 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-xl">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Statistiques Élèves — Âge &amp; Sexe</h2>
            <p className="text-blue-100">Répartition de l'effectif, liste détaillée et export imprimable.</p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          disabled={filteredStudents.length === 0}
          className="bg-white text-blue-700 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-50 shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          <Printer className="w-5 h-5" />
          Imprimer la liste
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Cycle</label>
          <select
            value={filterCycle}
            onChange={(e) => { setFilterCycle(e.target.value); setFilterClasse(''); }}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
          >
            <option value="">Tous les cycles</option>
            {cyclesList.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Classe</label>
          <select
            value={filterClasse}
            onChange={(e) => setFilterClasse(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
          >
            <option value="">Toutes les classes</option>
            {classesList.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Cartes résumé */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Effectif</p>
          <p className="text-2xl font-black text-gray-900">{filteredStudents.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Garçons</p>
          <p className="text-2xl font-black" style={{ color: GENDER_COLORS.garcons }}>{stats.garcons}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Filles</p>
          <p className="text-2xl font-black" style={{ color: GENDER_COLORS.filles }}>{stats.filles}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Âge moyen</p>
          <p className="text-2xl font-black text-gray-900">{stats.ageMoyen ?? '—'}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Sans date de naissance</p>
          <p className="text-2xl font-black text-amber-600">{stats.sansDateNaissance}</p>
        </div>
      </div>

      {/* Répartition par âge */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2"><Cake className="w-5 h-5 text-gray-400" /> Répartition par âge</h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Élèves avec date de naissance renseignée</p>
          </div>
          <BarChart2 className="w-5 h-5 text-gray-400" />
        </div>
        {stats.parAge.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm font-bold bg-gray-50 rounded-xl">
            Aucune date de naissance renseignée pour ce périmètre.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.parAge} barCategoryGap="25%" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.5} />
              <XAxis dataKey="age" tickFormatter={(v) => `${v} ans`} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 700 }} />
              <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} iconType="circle" />
              <Bar dataKey="garcons" name="Garçons" stackId="sexe" fill={GENDER_COLORS.garcons} radius={[0, 0, 0, 0]} />
              <Bar dataKey="filles" name="Filles" stackId="sexe" fill={GENDER_COLORS.filles} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Liste détaillée */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Liste des élèves ({filteredStudents.length})</h3>
        </div>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Nom &amp; Prénoms</th>
                <th className="px-4 py-2 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Classe</th>
                <th className="px-4 py-2 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">Sexe</th>
                <th className="px-4 py-2 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Date de naissance</th>
                <th className="px-4 py-2 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Âge</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => {
                const age = calculerAge(s.dateNaissance);
                return (
                  <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 font-semibold text-gray-800">{s.nom} {s.prenom}</td>
                    <td className="px-4 py-2 text-gray-600">{s.classe}</td>
                    <td className="px-4 py-2 text-center text-gray-600">{s.sexe}</td>
                    <td className="px-4 py-2 text-right text-gray-600 tabular-nums">{s.dateNaissance || '—'}</td>
                    <td className="px-4 py-2 text-right text-gray-600 tabular-nums">{age !== null ? age : '—'}</td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400 font-semibold">Aucun élève dans ce périmètre.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIV INVISIBLE POUR IMPRESSION */}
      <div className="hidden">
        <div ref={printRef}>
          <StatistiquesElevesPDF
            students={filteredStudents}
            scopeLabel={scopeLabel}
            schoolYear={schoolYear}
            countryName={countryName}
            countryMotto={countryMotto}
            ministereName={ministereName}
            directorName={directorName}
            stamp={schoolStamp}
            employer={{
              name: schoolName,
              logo: schoolLogo,
              address: schoolAddress,
              telephone: schoolTelephone,
              email: schoolEmail,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default StatistiquesEleves;
