// ============================================================
// DASHBOARD — Tableau de bord principal
// ============================================================
import React, { useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { syncToBackend, isBackendAvailable } from '../services/backendSync';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Users, TrendingUp, Wallet, AlertCircle, CheckCircle, School, BookOpen, GraduationCap, Target, ArrowUpRight, ArrowDownRight, BarChart2, FileText } from 'lucide-react';
import { CLASS_CONFIG } from '../data/classConfig';
import {
  computeRecouvrement,
  computeProjection,
  computeClassComparison,
  computeSanteFinanciere
} from '../services/analyticsService';
import { generateRapportMensuelPDF } from '@/utils/reportGenerator';

const fmtMoney = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
const PIE_COLORS = ['#1e40af', '#16a34a', '#ea580c'];
const BAR_COLORS = { paye: '#16a34a', restant: '#ef4444' };

interface StatCardProps {
  title: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string; trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, sub, icon, color, trend }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        {trend && <p className="text-xs text-emerald-600 mt-1 font-medium">{trend}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

const CustomTooltip: React.FC<{ active?: boolean; payload?: { name: string; value: number }[]; label?: string }> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-xl rounded-xl border border-gray-100 p-3 text-xs">
        <p className="font-semibold text-gray-800 mb-2">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.name === 'Payé' ? BAR_COLORS.paye : BAR_COLORS.restant }}>
            {p.name} : {fmtMoney(p.value)} FCFA
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC = () => {
  const students = useStore((s) => s.students);
  const parents = useStore((s) => s.parents);
  const user = useStore((s) => s.user);

  // Sync auto avec le backend (Node.js) pour alimenter le portail parent
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'comptable') {
      const runSync = async () => {
        const available = await isBackendAvailable();
        if (available) {
          console.log("🔄 Synchronisation avec le backend...");
          await syncToBackend({ students, parents });
        }
      };
      runSync();
    }
  }, []); // Une fois au montage du dashboard

  // ── Indicateurs financiers avancés (via analyticsService) ──
  const recouvrement = useMemo(() => computeRecouvrement(students), [students]);
  const projection = useMemo(() => computeProjection(students), [students]);
  const classComp = useMemo(() => computeClassComparison(students), [students]);
  const santeFinanciere = useMemo(() => computeSanteFinanciere(students), [students]);

  const stats = useMemo(() => {
    const primaire = students.filter((s) => s.cycle === 'Primaire');
    const college = students.filter((s) => s.cycle === 'Collège');
    const lycee = students.filter((s) => s.cycle === 'Lycée');

    const cycleStat = (arr: typeof students) => ({
      count: arr.length,
      ecolage: arr.reduce((a, s) => a + s.ecolage, 0),
      paye: arr.reduce((a, s) => a + s.dejaPaye, 0),
      restant: arr.reduce((a, s) => a + s.restant, 0),
      soldes: arr.filter((s) => s.status === 'Soldé').length,
      taux: arr.length > 0
        ? Math.round((arr.reduce((a, s) => a + s.dejaPaye, 0) / arr.reduce((a, s) => a + s.ecolage, 0)) * 100)
        : 0,
    });

    const totalEcolage = students.reduce((a, s) => a + s.ecolage, 0);
    const totalPaye = students.reduce((a, s) => a + s.dejaPaye, 0);
    const totalRestant = students.reduce((a, s) => a + s.restant, 0);
    const taux = totalEcolage > 0 ? Math.round((totalPaye / totalEcolage) * 100) : 0;
    const soldes = students.filter((s) => s.status === 'Soldé').length;
    const nonSoldes = students.filter((s) => s.status !== 'Soldé').length;

    return {
      primaire: primaire.length, college: college.length, lycee: lycee.length,
      cycleStats: {
        Primaire: cycleStat(primaire),
        Collège: cycleStat(college),
        Lycée: cycleStat(lycee),
      },
      totalEcolage, totalPaye, totalRestant, taux, soldes, nonSoldes,
    };
  }, [students]);

  // Données graphique barres par classe
  const classData = useMemo(() => {
    return CLASS_CONFIG.map((c) => {
      const cls = students.filter((s) => s.classe === c.name);
      return {
        classe: c.name,
        Payé: cls.reduce((a, s) => a + s.dejaPaye, 0),
        Restant: cls.reduce((a, s) => a + s.restant, 0),
        total: cls.length,
      };
    }).filter((c) => c.total > 0);
  }, [students]);

  // Données camembert cycles
  const cycleData = [
    { name: 'Primaire', value: stats.primaire },
    { name: 'Collège', value: stats.college },
    { name: 'Lycée', value: stats.lycee },
  ].filter((d) => d.value > 0);

  // Top classes solvables
  const topClasses = useMemo(() => {
    return CLASS_CONFIG.map((c) => {
      const cls = students.filter((s) => s.classe === c.name);
      if (!cls.length) return null;
      const paye = cls.reduce((a, s) => a + s.dejaPaye, 0);
      const total = cls.reduce((a, s) => a + s.ecolage, 0);
      return { name: c.name, cycle: c.cycle, taux: total > 0 ? Math.round((paye / total) * 100) : 0, count: cls.length };
    }).filter(Boolean).sort((a, b) => (b?.taux ?? 0) - (a?.taux ?? 0)).slice(0, 5) as { name: string; cycle: string; taux: number; count: number }[];
  }, [students]);

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <GraduationCap className="w-10 h-10 text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Aucune donnée</h2>
        <p className="text-gray-500 max-w-md">
          Importez un fichier Excel depuis la page <strong>Élèves</strong> pour commencer, ou ajoutez des élèves manuellement.
        </p>
      </div>
    );
  }

  const handleGenerateReport = () => {
    generateRapportMensuelPDF(students, classComp);
  };

  return (
    <div className="space-y-6">
      {/* ═══ Header avec Action et Santé Financière ═══ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            Tableau de Bord Stratégique
          </h2>
          <p className="text-sm text-gray-500">Aperçu financier et indicateurs de performance</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Indice de Santé Financière */}
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
            <div>
              <p className="text-xs text-gray-500 font-medium">Santé Financière</p>
              <p className={`text-sm font-bold ${santeFinanciere.color}`}>
                {santeFinanciere.label}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${santeFinanciere.score >= 80 ? 'border-emerald-200 bg-emerald-100/50' :
              santeFinanciere.score >= 50 ? 'border-amber-200 bg-amber-100/50' : 'border-red-200 bg-red-100/50'
              }`}>
              <span className={`text-lg font-extrabold ${santeFinanciere.color}`}>
                {santeFinanciere.score}
              </span>
            </div>
          </div>

          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-600/20 transition-all font-medium text-sm disabled:opacity-50"
          >
            <FileText className="w-5 h-5" />
            Générer Rapport du Mois
          </button>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Élèves"
          value={students.length}
          sub={`${stats.soldes} soldés / ${stats.nonSoldes} non soldés`}
          icon={<Users className="w-5 h-5 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="Écolage Attendu"
          value={`${fmtMoney(stats.totalEcolage)} FCFA`}
          sub="Total annuel"
          icon={<Wallet className="w-5 h-5 text-violet-600" />}
          color="bg-violet-50"
        />
        <StatCard
          title="Déjà Perçu"
          value={`${fmtMoney(stats.totalPaye)} FCFA`}
          sub="Paiements reçus"
          icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
          color="bg-emerald-50"
          trend={`+${stats.taux}% recouvert`}
        />
        <StatCard
          title="Solde Restant"
          value={`${fmtMoney(stats.totalRestant)} FCFA`}
          sub="À recouvrer"
          icon={<AlertCircle className="w-5 h-5 text-red-500" />}
          color="bg-red-50"
        />
      </div>

      {/* Taux de recouvrement global */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-800">Taux de recouvrement global</h3>
            <p className="text-xs text-gray-500">Progression des paiements</p>
          </div>
          <span className="text-2xl font-bold text-blue-700">{stats.taux}%</span>
        </div>
        <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${stats.taux}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Cycles — cards détaillées */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {([
          {
            label: 'Primaire',
            sub: 'CI · CI1 · CI2 · CP1 · CP2 · CE1 · CE2 · CM1 · CM2',
            icon: <School className="w-5 h-5 text-amber-600" />,
            border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700',
            bar: 'bg-amber-400', key: 'Primaire' as const,
          },
          {
            label: 'Collège',
            sub: '6ème · 5ème · 4ème · 3ème',
            icon: <BookOpen className="w-5 h-5 text-blue-600" />,
            border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-700',
            bar: 'bg-blue-500', key: 'Collège' as const,
          },
          {
            label: 'Lycée',
            sub: '2nde · 1ère · Terminale',
            icon: <GraduationCap className="w-5 h-5 text-purple-600" />,
            border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-700',
            bar: 'bg-purple-500', key: 'Lycée' as const,
          },
        ] as const).map((c) => {
          const cs = stats.cycleStats[c.key];
          return (
            <div key={c.label} className={`${c.bg} border ${c.border} rounded-2xl p-5`}>
              {/* En-tête */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                  {c.icon}
                </div>
                <div>
                  <p className={`text-base font-bold ${c.text}`}>{c.label}</p>
                  <p className="text-[10px] text-gray-400 leading-tight">{c.sub}</p>
                </div>
                <span className={`ml-auto text-2xl font-extrabold ${c.text}`}>{cs.count}</span>
              </div>

              {/* Stats financières */}
              <div className="space-y-1 text-xs mb-3">
                <div className="flex justify-between text-gray-500">
                  <span>Écolage attendu</span>
                  <span className="font-semibold text-gray-700">{fmtMoney(cs.ecolage)} F</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Déjà perçu</span>
                  <span className="font-semibold text-emerald-700">{fmtMoney(cs.paye)} F</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Restant</span>
                  <span className="font-semibold text-red-600">{fmtMoney(cs.restant)} F</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Soldés</span>
                  <span className="font-semibold text-gray-700">{cs.soldes} / {cs.count}</span>
                </div>
              </div>

              {/* Barre de recouvrement */}
              <div>
                <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                  <span>Recouvrement</span>
                  <span className="font-bold">{cs.taux}%</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`h-full ${c.bar} rounded-full transition-all duration-700`}
                    style={{ width: `${cs.taux}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Barres par classe */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-1">Paiements par classe</h3>
          <p className="text-xs text-gray-500 mb-4">Montants payés vs. restants (FCFA)</p>
          {classData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={classData} barCategoryGap="25%" barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="classe" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Payé" fill={BAR_COLORS.paye} radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="Restant" fill={BAR_COLORS.restant} radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Camembert cycles */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-1">Répartition par cycle</h3>
          <p className="text-xs text-gray-500 mb-4">Distribution des élèves</p>
          {cycleData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={cycleData} cx="50%" cy="45%" outerRadius={80} innerRadius={40} dataKey="value" paddingAngle={3}>
                  {cycleData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${value} élèves`]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ═══ INDICATEUR 1 : Taux de recouvrement avancé ═══ */}
      {students.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                Taux de recouvrement — Analyse détaillée
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Formule : (encaissé / théorique) × 100</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${recouvrement.badgeColor}`}>
              {recouvrement.badgeLabel}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-1">Théorique</p>
              <p className="text-lg font-bold text-gray-800">{fmtMoney(recouvrement.totalTheorique)}</p>
              <p className="text-[10px] text-gray-400">FCFA attendus</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-1">Encaissé</p>
              <p className="text-lg font-bold text-emerald-700">{fmtMoney(recouvrement.totalEncaisse)}</p>
              <p className="text-[10px] text-gray-400">FCFA reçus</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-1">Restant</p>
              <p className="text-lg font-bold text-red-600">{fmtMoney(recouvrement.totalRestant)}</p>
              <p className="text-[10px] text-gray-400">FCFA à recouvrer</p>
            </div>
          </div>
          {/* Barre de progression avec taux précis */}
          <div className="relative">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progression</span>
              <span className="font-bold text-gray-800">{recouvrement.taux}%</span>
            </div>
            <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                style={{ width: `${Math.min(recouvrement.taux, 100)}%`, backgroundColor: recouvrement.barColor }}
              >
                {recouvrement.taux > 15 && (
                  <span className="text-[10px] font-bold text-white">{recouvrement.taux}%</span>
                )}
              </div>
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-gray-300">
              <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ INDICATEUR 2 : Projection fin d'année ═══ */}
      {students.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-violet-600" />
            Projection des revenus — Fin d'année scolaire
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Basée sur le taux actuel de {(projection.tauxActuel * 100).toFixed(1)}% · Projection = Théorique × Taux
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Scénario pessimiste */}
            <div className="border border-red-100 bg-red-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownRight className="w-4 h-4 text-red-500" />
                <p className="text-xs font-semibold text-red-700">Scénario pessimiste</p>
              </div>
              <p className="text-xl font-bold text-red-600">{fmtMoney(projection.scenarioPessimiste)}</p>
              <p className="text-[10px] text-red-400 mt-1">Taux − 10% = {((projection.tauxActuel - 0.10) * 100).toFixed(1)}%</p>
            </div>
            {/* Projection réaliste */}
            <div className="border border-violet-200 bg-violet-50 rounded-xl p-4 ring-2 ring-violet-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-violet-600" />
                <p className="text-xs font-semibold text-violet-700">Projection réaliste</p>
              </div>
              <p className="text-xl font-bold text-violet-700">{fmtMoney(projection.projectionFinAnnee)}</p>
              <p className="text-[10px] text-violet-400 mt-1">Taux actuel = {(projection.tauxActuel * 100).toFixed(1)}%</p>
              <p className="text-[10px] text-violet-500 mt-1 font-medium">
                Reste à encaisser : {fmtMoney(projection.resteAEncaisser)} FCFA
              </p>
            </div>
            {/* Scénario optimiste */}
            <div className="border border-emerald-100 bg-emerald-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                <p className="text-xs font-semibold text-emerald-700">Scénario optimiste</p>
              </div>
              <p className="text-xl font-bold text-emerald-600">{fmtMoney(projection.scenarioOptimiste)}</p>
              <p className="text-[10px] text-emerald-400 mt-1">Taux + 10% = {(Math.min(projection.tauxActuel + 0.10, 1) * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ INDICATEUR 3 : Comparaison financière par classe ═══ */}
      {classComp.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-1">
            <BarChart2 className="w-4 h-4 text-blue-600" />
            Comparaison financière par classe
          </h3>
          <p className="text-xs text-gray-500 mb-4">Classé du meilleur taux au plus faible — Cliquez pour détails</p>

          {/* BarChart Recharts */}
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={classComp.map((r) => ({
                classe: r.classe,
                Encaissé: r.totalEncaisse,
                Restant: r.totalRestant,
                taux: r.taux,
              }))}
              barCategoryGap="20%"
              barGap={2}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="classe" tick={{ fontSize: 9, fill: '#6b7280' }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 9, fill: '#6b7280' }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const row = classComp.find((r) => r.classe === label);
                  return (
                    <div className="bg-white shadow-xl rounded-xl border border-gray-100 p-3 text-xs min-w-[160px]">
                      <p className="font-bold text-gray-800 mb-2">{label}</p>
                      {payload.map((p, i) => (
                        <p key={i} style={{ color: p.name === 'Encaissé' ? '#16a34a' : '#ef4444' }}>
                          {p.name} : {fmtMoney(p.value as number)} FCFA
                        </p>
                      ))}
                      {row && (
                        <>
                          <hr className="my-1 border-gray-100" />
                          <p className="text-gray-500">Taux : <strong className="text-gray-800">{row.taux}%</strong></p>
                          <p className="text-gray-500">Effectif : <strong>{row.effectif}</strong> · Soldés : <strong>{row.soldes}</strong></p>
                        </>
                      )}
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Encaissé" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Restant" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>

          {/* Tableau récapitulatif */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 uppercase text-[10px] border-b border-gray-100">
                  <th className="text-left pb-2 font-medium">Rang</th>
                  <th className="text-left pb-2 font-medium">Classe</th>
                  <th className="text-left pb-2 font-medium">Cycle</th>
                  <th className="text-right pb-2 font-medium">Effectif</th>
                  <th className="text-right pb-2 font-medium">Théorique</th>
                  <th className="text-right pb-2 font-medium">Encaissé</th>
                  <th className="text-right pb-2 font-medium">Taux</th>
                </tr>
              </thead>
              <tbody>
                {classComp.map((row, i) => (
                  <tr key={row.classe} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2">
                      <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' :
                        i === 1 ? 'bg-gray-100 text-gray-600' :
                          i === 2 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-400'
                        }`}>{i + 1}</span>
                    </td>
                    <td className="py-2 font-semibold text-gray-800">{row.classe}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${row.cycle === 'Primaire' ? 'bg-amber-100 text-amber-700' :
                        row.cycle === 'Collège' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>{row.cycle}</span>
                    </td>
                    <td className="py-2 text-right text-gray-600">{row.effectif}</td>
                    <td className="py-2 text-right text-gray-600">{fmtMoney(row.totalTheorique)}</td>
                    <td className="py-2 text-right font-semibold text-emerald-700">{fmtMoney(row.totalEncaisse)}</td>
                    <td className="py-2 text-right">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${row.taux >= 85 ? 'bg-emerald-100 text-emerald-700' :
                        row.taux >= 65 ? 'bg-blue-100 text-blue-700' :
                          row.taux >= 40 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                        }`}>{row.taux}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top classes solvables */}
      {topClasses.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Classement des classes les plus solvables
          </h3>
          <div className="space-y-3">
            {topClasses.map((c, i) => (
              <div key={c.name} className="flex items-center gap-4">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-yellow-100 text-yellow-700' :
                  i === 1 ? 'bg-gray-100 text-gray-600' :
                    i === 2 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-500'
                  }`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800">{c.name}</span>
                    <span className="text-xs text-gray-500">{c.taux}% — {c.count} élève{c.count > 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${c.taux}%`,
                        background: c.taux >= 80 ? '#16a34a' : c.taux >= 50 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
