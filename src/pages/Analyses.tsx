// ============================================================
// PAGE ANALYSES — Analyse financière avancée
// ============================================================
import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { CLASS_CONFIG } from '../data/classConfig';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { TrendingUp, AlertTriangle, Target, Award, Eye, EyeOff } from 'lucide-react';
import { computeCycleComparison } from '../services/analyticsService';

// Custom tooltips évitant les problèmes de types Recharts
const MoneyTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) => {
  const privacyMode = useStore(s => s.privacyMode);
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white shadow-xl rounded-xl border border-gray-100 p-3 text-xs">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-gray-600">{p.name} : {privacyMode ? '••••••' : new Intl.NumberFormat('fr-FR').format(p.value)} FCFA</p>
      ))}
    </div>
  );
};

const PieMoneyTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  const privacyMode = useStore(s => s.privacyMode);
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white shadow-xl rounded-xl border border-gray-100 p-3 text-xs">
      <p className="font-semibold text-gray-800">{payload[0].name}</p>
      <p className="text-gray-600">{privacyMode ? '••••••' : new Intl.NumberFormat('fr-FR').format(payload[0].value)} FCFA</p>
    </div>
  );
};

const SingleValueTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  const privacyMode = useStore(s => s.privacyMode);
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white shadow-xl rounded-xl border border-gray-100 p-3 text-xs">
      <p className="font-semibold text-gray-800">{payload[0].payload.cycle || payload[0].name}</p>
      <p className="text-blue-600 font-bold">{privacyMode ? '••••••' : `${payload[0].value}%`}</p>
    </div>
  );
};

const fmtMoney = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
const COLORS = ['#1e40af', '#16a34a', '#ea580c', '#7c3aed', '#db2777', '#0891b2'];

export const Analyses: React.FC = () => {
  const students = useStore((s) => s.students);
  const privacyMode = useStore((s) => s.privacyMode);
  const setPrivacyMode = useStore((s) => s.setPrivacyMode);

  const maskValue = (val: string | number) => privacyMode ? '••••••' : val;

  // Données par classe
  const classData = useMemo(() => {
    return CLASS_CONFIG.map((c) => {
      const cls = students.filter((s) => s.classe === c.name);
      if (!cls.length) return null;
      const ecolageTotal = cls.reduce((a, s) => a + s.ecolage, 0);
      const paye         = cls.reduce((a, s) => a + s.dejaPaye, 0);
      const restant      = cls.reduce((a, s) => a + s.restant, 0);
      const taux         = ecolageTotal > 0 ? Math.round((paye / ecolageTotal) * 100) : 0;
      const soldes       = cls.filter((s) => s.status === 'Soldé').length;
      return {
        classe: c.name,
        cycle: c.cycle,
        effectif: cls.length,
        ecolageTotal,
        paye,
        restant,
        taux,
        soldes,
        nonSoldes: cls.length - soldes,
      };
    }).filter(Boolean) as {
      classe: string; cycle: string; effectif: number;
      ecolageTotal: number; paye: number; restant: number;
      taux: number; soldes: number; nonSoldes: number;
    }[];
  }, [students]);

  // Données par cycle (Solvabilité)
  const cycleComparison = useMemo(() => computeCycleComparison(students), [students]);

  // Données pour le camembert (Effectifs ou Revenus - on garde revenus payés comme avant)
  const cyclePieData = useMemo(() => {
    return cycleComparison.map(c => ({ name: c.cycle, value: c.totalEncaisse }));
  }, [cycleComparison]);

  // Classement solvabilité
  const topClasses = [...classData].sort((a, b) => b.taux - a.taux);

  // Prévision trésorerie : si taux actuel maintenu
  const totalEcolage  = students.reduce((a, s) => a + s.ecolage, 0);
  const totalPaye     = students.reduce((a, s) => a + s.dejaPaye, 0);
  const totalRestant  = students.reduce((a, s) => a + s.restant, 0);
  const tauxGlobal    = totalEcolage > 0 ? Math.round((totalPaye / totalEcolage) * 100) : 0;

  // Retards : élèves non soldés avec écolage > 60 000 et paiement < 30%
  const retards = students.filter((s) => {
    const taux = s.ecolage > 0 ? s.dejaPaye / s.ecolage : 0;
    return s.status !== 'Soldé' && taux < 0.3;
  });

  // Radar solvabilité par cycle (On garde le nom pour la compatibilité mais on change la structure si besoin)
  const radarData = useMemo(() => cycleComparison.map((c) => ({ cycle: c.cycle, taux: c.taux })), [cycleComparison]);

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <TrendingUp className="w-16 h-16 text-gray-200 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Aucune donnée à analyser</h2>
        <p className="text-gray-400 max-w-sm">Importez des élèves depuis la page <strong>Élèves</strong> pour voir les analyses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Analyse Financière</h2>
          <p className="text-sm text-slate-500 font-medium">Visualisation détaillée de la performance et des recouvrements</p>
        </div>
        <button
          onClick={() => setPrivacyMode(!privacyMode)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-amber-500 transition-all font-bold text-xs shadow-sm active:scale-95 group"
        >
          {privacyMode ? <Eye className="w-4 h-4 text-amber-500" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
          <span className="dark:text-white">{privacyMode ? "AFFICHER" : "MASQUER"} LES CHIFFRES</span>
        </button>
      </div>

      {/* KPIs globaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Taux de recouvrement', value: maskValue(`${tauxGlobal}%`), color: 'text-blue-700', bg: 'bg-blue-50', icon: <Target className="w-5 h-5 text-blue-600" /> },
          { label: 'Revenus encaissés', value: maskValue(`${fmtMoney(totalPaye)} F`), color: 'text-emerald-700', bg: 'bg-emerald-50', icon: <TrendingUp className="w-5 h-5 text-emerald-600" /> },
          { label: 'À recouvrer', value: maskValue(`${fmtMoney(totalRestant)} F`), color: 'text-red-700', bg: 'bg-red-50', icon: <AlertTriangle className="w-5 h-5 text-red-500" /> },
          { label: 'Potentiel total', value: maskValue(`${fmtMoney(totalEcolage)} F`), color: 'text-violet-700', bg: 'bg-violet-50', icon: <Award className="w-5 h-5 text-violet-600" /> },
        ].map((k) => (
          <div key={k.label} className={`${k.bg} rounded-2xl p-4 border border-white shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{k.label}</p>
              {k.icon}
            </div>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Graphique barres par classe — payé vs restant */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-1">Revenus par classe</h3>
        <p className="text-xs text-gray-400 mb-4">Montants encaissés vs restants (FCFA)</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={classData} barCategoryGap="25%" barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="classe" tick={{ fontSize: 10, fill: '#6b7280' }} />
            <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#6b7280' }} />
            <Tooltip content={<MoneyTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="paye"    name="Payé"    fill="#16a34a" radius={[4,4,0,0]} maxBarSize={28} />
            <Bar dataKey="restant" name="Restant" fill="#ef4444" radius={[4,4,0,0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-1">Répartition des revenus par cycle</h3>
          <p className="text-xs text-gray-400 mb-4">Montants encaissés (FCFA)</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={cyclePieData} cx="50%" cy="45%" outerRadius={80} innerRadius={40} dataKey="value" paddingAngle={3}>
                {cyclePieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip content={<PieMoneyTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Solvabilité par cycle */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
            Solvabilité par cycle
          </h3>
          <p className="text-xs text-gray-400 mb-4">Taux de recouvrement (%)</p>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="cycle" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <Radar
                name="Taux de recouvrement"
                dataKey="taux"
                stroke="#1e40af"
                fill="#1e40af"
                fillOpacity={0.6}
              />
              <Tooltip content={<SingleValueTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Classement classes solvables */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" /> Classement des classes — Solvabilité
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Classe</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Cycle</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Effectif</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Payé</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Restant</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Taux</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Soldés</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topClasses.map((c, i) => (
                <tr key={c.classe} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold inline-flex ${
                      i === 0 ? 'bg-yellow-100 text-yellow-700' :
                      i === 1 ? 'bg-gray-100 text-gray-600' :
                      i === 2 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-500'
                    }`}>{i + 1}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{c.classe}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.cycle === 'Primaire' ? 'bg-amber-100 text-amber-700' :
                      c.cycle === 'Collège'  ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>{c.cycle}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{maskValue(c.effectif)}</td>
                  <td className="px-4 py-3 font-medium text-emerald-700">{maskValue(fmtMoney(c.paye))} F</td>
                  <td className="px-4 py-3 font-medium text-red-600">{maskValue(fmtMoney(c.restant))} F</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${c.taux}%`, background: c.taux >= 80 ? '#16a34a' : c.taux >= 50 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                      <span className={`text-xs font-bold ${c.taux >= 80 ? 'text-emerald-700' : c.taux >= 50 ? 'text-amber-700' : 'text-red-600'}`}>{maskValue(`${c.taux}%`)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{privacyMode ? '••••••' : `${c.soldes}/${c.effectif}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alertes retards */}
      {retards.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" /> Détection automatique — Retards critiques ({retards.length} élèves)
          </h3>
          <p className="text-xs text-red-600 mb-3">Élèves ayant payé moins de 30% de leur écolage</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-red-700 border-b border-red-200">
                  <th className="pb-2 text-left font-semibold">Élève</th>
                  <th className="pb-2 text-left font-semibold">Classe</th>
                  <th className="pb-2 text-left font-semibold">Payé</th>
                  <th className="pb-2 text-left font-semibold">Restant</th>
                  <th className="pb-2 text-left font-semibold">Taux</th>
                  <th className="pb-2 text-left font-semibold">Téléphone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {retards.slice(0, 10).map((s) => {
                  const t = Math.round((s.dejaPaye / s.ecolage) * 100);
                  return (
                    <tr key={s.id}>
                      <td className="py-2 font-medium text-gray-900">{s.prenom} {s.nom}</td>
                      <td className="py-2 text-gray-600">{s.classe}</td>
                      <td className="py-2 text-emerald-700">{maskValue(fmtMoney(s.dejaPaye))} F</td>
                      <td className="py-2 text-red-700 font-medium">{maskValue(fmtMoney(s.restant))} F</td>
                      <td className="py-2"><span className="text-red-700 font-bold text-xs">{maskValue(`${t}%`)}</span></td>
                      <td className="py-2 text-gray-500 font-mono text-xs">{maskValue(s.telephone)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {retards.length > 10 && <p className="text-xs text-red-500 mt-2">… et {retards.length - 10} autres élèves</p>}
        </div>
      )}

      {/* Prévision trésorerie */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" /> Prévision de trésorerie
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs text-blue-600 font-medium mb-1">Potentiel si 100%</p>
            <p className="text-xl font-bold text-blue-800">{maskValue(fmtMoney(totalEcolage))} F</p>
            <p className="text-xs text-blue-500 mt-1">Manque encore : {maskValue(fmtMoney(totalRestant))} F</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4">
            <p className="text-xs text-emerald-600 font-medium mb-1">Si taux actuel ({maskValue(tauxGlobal)}%) maintenu</p>
            <p className="text-xl font-bold text-emerald-800">{maskValue(fmtMoney(totalPaye))} F</p>
            <p className="text-xs text-emerald-500 mt-1">Recouvert à ce jour</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4">
            <p className="text-xs text-amber-600 font-medium mb-1">Écart avec objectif</p>
            <p className="text-xl font-bold text-amber-800">{maskValue(100 - tauxGlobal)}% restant</p>
            <p className="text-xs text-amber-500 mt-1">Soit {maskValue(fmtMoney(totalRestant))} FCFA</p>
          </div>
        </div>
      </div>
    </div>
  );
};
