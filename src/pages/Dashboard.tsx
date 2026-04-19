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
import { Users, TrendingUp, Wallet, AlertCircle, CheckCircle, School, BookOpen, GraduationCap, Target, ArrowUpRight, BarChart2, UserCheck, FileText } from 'lucide-react';
import { CLASS_CONFIG } from '../data/classConfig';
import {
  computeRecouvrement,
  computeClassComparison,
  computeSanteFinanciere
} from '../services/analyticsService';
import { generateRapportMensuelPDF } from '@/utils/reportGenerator';
import { DashboardSkeleton } from '../components/SkeletonLoaders';

const fmtMoney = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
const PIE_COLORS = ['#eab308', '#16a34a', '#ea580c'];
const BAR_COLORS = { paye: '#16a34a', restant: '#ef4444' };

interface StatCardProps {
  title: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string; trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, sub, icon, color, trend }) => (
  <div className="pro-card p-6">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-[10px] font-black text-slate-800 dark:text-slate-300 border-l-2 border-amber-500 pl-2 uppercase tracking-[0.2em]">{title}</p>
        <div>
           <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
           {sub && <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mt-0.5">{sub}</p>}
        </div>
        {trend && (
           <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 w-fit">
              <ArrowUpRight className="w-3 h-3" />
              <p className="text-[10px] font-black">{trend}</p>
           </div>
        )}
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

const CustomTooltip: React.FC<{ active?: boolean; payload?: { name: string; value: number }[]; label?: string }> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-2xl border border-gray-100 dark:border-slate-700 p-4 text-xs backdrop-blur-md">
        <p className="font-bold text-slate-800 dark:text-slate-100 mb-2">{label}</p>
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
  const getPresencesToday = useStore((s) => s.getPresencesToday);
  const isSyncing = useStore((s) => s.isSyncing);

  const todayPresences = useMemo(() => getPresencesToday(), [getPresencesToday]);
  const tauxPresence = students.length > 0 ? Math.round((todayPresences.length / students.length) * 100) : 0;

  // Synchronisation Cloud au montage du dashboard
  useEffect(() => {
    const roles = ['admin', 'directeur', 'directeur_general', 'comptable'];
    if (user?.role && roles.includes(user.role)) {
      const initSync = async () => {
        const available = await isBackendAvailable();
        if (available) {
          // 1. Récupérer les données fraîches du serveur (Single Source of Truth)
          const fetchAllFromBackend = useStore.getState().fetchAllFromBackend;
          await fetchAllFromBackend();
          
          // La synchronisation inverse (Local -> Cloud) est désormais gérée 
          // intelligemment dans fetchAllFromBackend si des doublons sont détectés.
        }
      };
      initSync();
    }
  }, []);

  // ── Indicateurs financiers avancés ──
  const recouvrement = useMemo(() => computeRecouvrement(students), [students]);
  const classComp = useMemo(() => computeClassComparison(students), [students]);
  const santeFinanciere = useMemo(() => computeSanteFinanciere(students), [students]);

  // --- Gestion Automatique du Rapport Mensuel (Chaque 5 du mois) ---
  useEffect(() => {
    if (students.length === 0 || classComp.length === 0) return;
    
    const now = new Date();
    const day = now.getDate();
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    const lastReportMonth = useStore.getState().lastReportMonth;
    
    // Si on est le 5 ou plus, et qu'on n'a pas encore généré le rapport ce mois-ci
    if (day >= 5 && lastReportMonth !== currentMonthKey) {
      setTimeout(() => {
        generateRapportMensuelPDF(students, classComp, { 
          name: useStore.getState().schoolName || useStore.getState().appName, 
          logo: useStore.getState().schoolLogo 
        });
        useStore.getState().setLastReportMonth(currentMonthKey);
      }, 2000); // Petit délai pour laisser l'interface se charger
    }
  }, [students, classComp]);

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

  const cycleData = [
    { name: 'Primaire', value: stats.primaire },
    { name: 'Collège', value: stats.college },
    { name: 'Lycée', value: stats.lycee },
  ].filter((d) => d.value > 0);

  const topClasses = useMemo(() => {
    return CLASS_CONFIG.map((c) => {
      const cls = students.filter((s) => s.classe === c.name);
      if (!cls.length) return null;
      const paye = cls.reduce((a, s) => a + s.dejaPaye, 0);
      const total = cls.reduce((a, s) => a + s.ecolage, 0);
      return { name: c.name, cycle: c.cycle, taux: total > 0 ? Math.round((paye / total) * 100) : 0, count: cls.length };
    }).filter(Boolean).sort((a, b) => (b?.taux ?? 0) - (a?.taux ?? 0)).slice(0, 5) as { name: string; cycle: string; taux: number; count: number }[];
  }, [students]);

  if (isSyncing && students.length === 0) {
    return <DashboardSkeleton />;
  }

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-4">
          <GraduationCap className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Aucune donnée trouvée</h2>
        <p className="text-gray-500 max-w-md mx-auto px-4">
          Importez un fichier Excel ou patientez si une synchronisation est en cours.
          Vérifiez que vous êtes bien connecté à internet.
        </p>
      </div>
    );
  }


  return (
    <div className="space-y-8 pb-10">
      {/* Strategic Header */}
      <div className="relative pro-card p-8 overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <TrendingUp className="w-48 h-48 text-amber-500" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500 text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4">
                    <Target className="w-3 h-3" /> Dashboard Stratégique
                </div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
                    Analyse & <span className="text-amber-500">Performance</span>
                </h2>
                <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed font-medium">
                    Visualisation en temps réel de la santé financière globale, incluant le recouvrement, les projections et les statistiques par cycle.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
                <button 
                  onClick={() => generateRapportMensuelPDF(students, classComp, { 
                    name: useStore.getState().schoolName || useStore.getState().appName, 
                    logo: useStore.getState().schoolLogo 
                  })}
                  className="flex items-center gap-3 px-6 py-4 bg-slate-900 border-2 border-slate-900 text-white rounded-[22px] hover:bg-white hover:text-slate-900 transition-all duration-300 font-black text-sm shadow-xl hover:shadow-2xl active:scale-95 group"
                >
                    <div className="w-8 h-8 rounded-xl bg-white/10 group-hover:bg-slate-100 flex items-center justify-center transition-colors">
                        <FileText className="w-4 h-4" />
                    </div>
                    TÉLÉCHARGER LE BILAN STRATÉGIQUE
                </button>

                <div className="flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50 px-8 py-5 rounded-[24px] border border-slate-100 dark:border-slate-700 backdrop-blur-sm self-stretch">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Santé Financière</p>
                        <p className={`text-xl font-black ${santeFinanciere.color}`}>
                            {santeFinanciere.label}
                        </p>
                    </div>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 shadow-xl ${
                        santeFinanciere.score >= 80 ? 'border-emerald-500 bg-emerald-50' :
                        santeFinanciere.score >= 50 ? 'border-amber-500 bg-amber-50' : 'border-rose-500 bg-rose-50'
                    }`}>
                        <span className={`text-xl font-black ${santeFinanciere.color}`}>
                            {santeFinanciere.score}
                        </span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Élèves"
          value={students.length}
          sub={`${stats.soldes} soldés / ${stats.nonSoldes} non soldés`}
          icon={<Users className="w-5 h-5 text-amber-500" />}
          color="bg-amber-50"
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
        <StatCard
          title="Présences Aujourd'hui"
          value={`${todayPresences.length} / ${students.length}`}
          sub="Élèves pointés"
          icon={<UserCheck className="w-5 h-5 text-cyan-600" />}
          color="bg-cyan-50"
          trend={`${tauxPresence}% de présence`}
        />
      </div>

      <div className="pro-card p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">Recouvrement Global</h3>
            <p className="text-xs text-slate-700 dark:text-slate-400 font-bold uppercase tracking-widest">Progression des encaissements périodiques</p>
          </div>
          <div className="text-4xl font-black text-amber-500 dark:text-amber-400 tracking-tighter">{stats.taux}%</div>
        </div>
        <div className="relative h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner p-1">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-lg"
            style={{ width: `${stats.taux}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
          <span>Initial (0%)</span>
          <span className="text-slate-300">Seuil (50%)</span>
          <span>Objectif (100%)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {([
          {
            label: 'Cycle Primaire',
            sub: '9 Classes (CI au CM2)',
            icon: <School className="w-5 h-5 text-amber-600" />,
            border: 'border-amber-100', bg: 'bg-amber-50/30', text: 'text-amber-600',
            bar: 'bg-amber-500', key: 'Primaire' as const,
          },
          {
            label: 'Cycle Collège',
            sub: '4 Classes (6ème au 3ème)',
            icon: <BookOpen className="w-5 h-5 text-blue-600" />,
            border: 'border-blue-100', bg: 'bg-blue-50/30', text: 'text-blue-600',
            bar: 'bg-blue-500', key: 'Collège' as const,
          },
          {
            label: 'Cycle Lycée',
            sub: '3 Classes (Sciences & Arts)',
            icon: <GraduationCap className="w-5 h-5 text-purple-600" />,
            border: 'border-purple-100', bg: 'bg-purple-50/30', text: 'text-purple-600',
            bar: 'bg-purple-500', key: 'Lycée' as const,
          },
        ] as const).map((c) => {
          const cs = stats.cycleStats[c.key];
          return (
            <div key={c.label} className={`pro-card p-8 border-l-4 ${c.border.replace('border-', 'border-l-')}`}>
              <div className="flex items-center gap-4 mb-8">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${c.bg}`}>
                  {c.icon}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className={`text-base font-black tracking-tight ${c.text}`}>{c.label}</p>
                  <p className="text-[10px] text-slate-700 dark:text-slate-400 font-bold uppercase truncate">{c.sub}</p>
                </div>
                <span className={`text-3xl font-black ${c.text}`}>{cs.count}</span>
              </div>

              <div className="space-y-3 font-medium text-sm mb-8 border-y border-slate-50 dark:border-slate-800 py-6">
                <div className="flex justify-between text-slate-500">
                  <span>Attendu</span>
                  <span className="font-black text-slate-900 dark:text-white">{fmtMoney(cs.ecolage)} F</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Perçu</span>
                  <span className="font-black text-emerald-600">{fmtMoney(cs.paye)} F</span>
                </div>
                <div className="flex justify-between text-slate-500 font-black">
                  <span>Reste</span>
                  <span className="text-rose-500">{fmtMoney(cs.restant)} F</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">
                  <span>Taux de recouvrement</span>
                  <span className={c.text}>{cs.taux}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`h-full ${c.bar} rounded-full transition-all duration-1000`}
                    style={{ width: `${cs.taux}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <h3 className="font-bold text-slate-800 dark:text-white mb-1">Paiements par classe</h3>
          <p className="text-xs text-slate-500 mb-4">Montants payés vs. restants (FCFA)</p>
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

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <h3 className="font-bold text-slate-800 dark:text-white mb-1">Répartition par cycle</h3>
          <p className="text-xs text-slate-500 mb-4">Distribution des élèves</p>
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

      {students.length > 0 && (
        <div className="pro-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                <Target className="w-6 h-6 text-amber-500" />
                Analyse du Recouvrement
              </h3>
              <p className="text-[10px] text-slate-700 dark:text-slate-400 font-bold uppercase tracking-[0.2em]">Formule : (encaissé / théorique) × 100</p>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${recouvrement.badgeColor}`}>
              {recouvrement.badgeLabel}
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 transition-transform hover:scale-[1.02]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Théorique</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">{fmtMoney(recouvrement.totalTheorique)}</p>
              <p className="text-[10px] text-slate-400 mt-1 font-bold">FCFA ATTENDUS</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-900/30 transition-transform hover:scale-[1.02]">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Encaissé</p>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tighter">{fmtMoney(recouvrement.totalEncaisse)}</p>
              <p className="text-[10px] text-emerald-500 mt-1 font-bold">REÇU À CE JOUR</p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-900/10 rounded-2xl p-6 border border-rose-100 dark:border-rose-900/30 transition-transform hover:scale-[1.02]">
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">Restant</p>
              <p className="text-2xl font-black text-rose-700 dark:text-rose-400 tracking-tighter">{fmtMoney(recouvrement.totalRestant)}</p>
              <p className="text-[10px] text-rose-500 mt-1 font-bold">EN ATTENTE</p>
            </div>
          </div>

          <div className="relative pt-2">
            <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-[0.1em] mb-2">
              <span>Progression Stratégique</span>
              <span className="text-slate-900 dark:text-white px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md shadow-sm">{recouvrement.taux}%</span>
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner flex p-1">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out shadow-lg"
                style={{ width: `${Math.min(recouvrement.taux, 100)}%`, backgroundColor: recouvrement.barColor }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="pro-card p-8">
          <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 mb-8 tracking-tight">
            <BarChart2 className="w-6 h-6 text-amber-500" />
            Performance des Classes
          </h3>

          <div className="space-y-4">
            {classComp.slice(0, 8).map((row, i) => (
              <div key={row.classe} className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${
                    i === 0 ? 'bg-amber-400 text-black' :
                    i === 1 ? 'bg-slate-200 text-slate-900' :
                    i === 2 ? 'bg-orange-200 text-orange-900' : 'bg-slate-100 text-slate-600'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-extrabold text-slate-800 dark:text-white tracking-tight">{row.classe}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        row.taux >= 85 ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'
                    }`}>{row.taux}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-1000 group-hover:shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                      style={{ width: `${row.taux}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pro-card p-8">
          <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 mb-8 tracking-tight">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            Top Solvabilité
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {topClasses.map((c) => (
              <div key={c.name} className="relative pro-card p-6 bg-slate-50/30 dark:bg-slate-800/30 border-none overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform duration-500">
                      <CheckCircle className="w-24 h-24 text-emerald-600" />
                  </div>
                  <div className="relative z-10 flex items-center justify-between">
                      <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.cycle}</p>
                          <h4 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">{c.name}</h4>
                          <p className="text-xs text-slate-500 font-bold">{c.count} élèves inscrits</p>
                      </div>
                      <div className="text-right">
                          <div className="text-3xl font-black text-emerald-600 tracking-tighter">{c.taux}%</div>
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Recouvré</p>
                      </div>
                  </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
