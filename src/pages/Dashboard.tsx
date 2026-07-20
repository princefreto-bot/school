import React, { useMemo, useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { isBackendAvailable } from '../services/backendSync';
import { API_BASE_URL } from '../config';
import { getAuthHeaders, parseResponse } from '../services/apiHelpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line,
} from 'recharts';
import {
  Users, TrendingUp, Wallet, AlertCircle, CheckCircle, School, BookOpen,
  GraduationCap, Target, ArrowUpRight, BarChart2, UserCheck, FileText, Eye, EyeOff,
  Check, Settings, PlayCircle, Landmark, PiggyBank
} from 'lucide-react';
import { CLASS_CONFIG } from '../data/classConfig';
import {
  computeRecouvrement,
  computeClassComparison,
  computeSanteFinanciere,
  computeCycleComparison
} from '../services/analyticsService';
import { generateRapportMensuelPDF } from '@/utils/reportGenerator';
import { DashboardSkeleton } from '../components/SkeletonLoaders';

const fmtMoney = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
const PIE_COLORS = ['#f59e0b', '#10b981', '#f43f5e'];
const BAR_COLORS = { paye: '#10b981', restant: '#f43f5e' };

interface StatCardProps {
  title: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string; trend?: string; delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, sub, icon, color, trend, delay = 0 }) => (
  <div 
    className="pro-card relative group p-6 overflow-hidden animate-slideUp"
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Subtle gradient background for depth */}
    <div className={`absolute -right-12 -top-12 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 ${color}`} />
    
    <div className="relative z-10 flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">{title}</p>
        <div>
           <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</p>
           {sub && <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
        </div>
        {trend && (
           <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 w-fit mt-2 border border-emerald-500/10 shadow-[0_2px_10px_rgba(16,185,129,0.1)]">
              <ArrowUpRight className="w-3 h-3" />
              <p className="text-[10px] font-black tracking-wide">{trend}</p>
           </div>
        )}
      </div>
      <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-md group-hover:scale-110 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

const CustomTooltip: React.FC<{ active?: boolean; payload?: { name: string; value: number }[]; label?: string }> = ({ active, payload, label }) => {
  const privacyMode = useStore(s => s.privacyMode);
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-slate-900/90 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-[20px] border border-slate-200/50 dark:border-slate-700/50 p-4 text-xs backdrop-blur-xl">
        <p className="font-bold text-slate-800 dark:text-slate-100 mb-3">{label}</p>
        <div className="space-y-2">
          {payload.map((p, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.name === 'Payé' ? BAR_COLORS.paye : BAR_COLORS.restant }} />
                <span className="font-bold text-slate-600 dark:text-slate-300">{p.name}</span>
              </div>
              <span className="font-black text-slate-900 dark:text-white">
                {privacyMode ? '••••••' : fmtMoney(p.value)} FCFA
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const EXPENSE_COLORS = ['#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#6366f1', '#ec4899', '#14b8a6'];

interface RevenuePoint { month: string; total: number; }
interface ExpenseSlice { code: string; name: string; amount: number; }

/**
 * Widget financier auto-suffisant : va chercher ses propres données (comptes
 * Caisse/Banque, dépenses du mois, revenus des 6 derniers mois) auprès du
 * module Comptabilité déjà existant. Se masque silencieusement si l'appel
 * échoue (rôle sans accès compta, ex. proviseur/censeur — 403 attendu, pas
 * une erreur à afficher) plutôt que de casser le reste du Dashboard.
 */
const FinancialOverview: React.FC<{ privacyMode: boolean }> = ({ privacyMode }) => {
  const [tresorerie, setTresorerie] = useState<number | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<RevenuePoint[]>([]);
  const [expenses, setExpenses] = useState<ExpenseSlice[]>([]);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const now = new Date();
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

        const [balanceRes, trendRes, resultatRes] = await Promise.all([
          fetch(`${API_BASE_URL}/accounting/balance`, { headers: getAuthHeaders() }),
          fetch(`${API_BASE_URL}/accounting/revenue-trend?months=6`, { headers: getAuthHeaders() }),
          fetch(`${API_BASE_URL}/accounting/compte-resultat?from=${monthStart}`, { headers: getAuthHeaders() }),
        ]);

        if (!balanceRes.ok || !trendRes.ok || !resultatRes.ok) {
          if (!cancelled) setAvailable(false);
          return;
        }

        const balance = await parseResponse(balanceRes);
        const trend = await parseResponse(trendRes);
        const resultat = await parseResponse(resultatRes);

        if (cancelled) return;

        const treasuryRows = (balance.rows || []).filter((r: { code: string }) => ['571', '521'].includes(r.code));
        const total = treasuryRows.reduce((sum: number, r: { balance: number }) => sum + r.balance, 0);

        setTresorerie(total);
        setRevenueTrend(trend);
        setExpenses((resultat.charges || []).filter((c: ExpenseSlice) => c.amount > 0));
      } catch {
        if (!cancelled) setAvailable(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  if (!available) return null;

  const mask = (val: string) => privacyMode ? '••••••' : val;
  const trendData = revenueTrend.map(p => ({ ...p, label: p.month.slice(5) + '/' + p.month.slice(2, 4) }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="pro-card p-8 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight mb-1">Trésorerie</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Caisse + Banque</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-[16px]">
            <PiggyBank className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
        <p className={`text-3xl font-black tracking-tighter ${tresorerie !== null && tresorerie < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
          {tresorerie === null ? '--' : mask(`${fmtMoney(tresorerie)} F`)}
        </p>
        <p className="text-[11px] font-bold text-slate-400 mt-2">Solde disponible en direct</p>
      </div>

      <div className="xl:col-span-2 pro-card p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight mb-1">Évolution des revenus</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">6 derniers mois (FCFA)</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-[16px]">
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
        </div>
        {trendData.every(p => p.total === 0) ? (
          <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm font-bold bg-slate-50 dark:bg-slate-800/50 rounded-[20px]">Aucun revenu enregistré</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.5} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value?: number) => [privacyMode ? '••••••' : `${fmtMoney(value || 0)} FCFA`, 'Revenus']} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 700 }} />
              <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="xl:col-span-3 pro-card p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight mb-1">Dépenses par catégorie</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Mois en cours</p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-[16px]">
            <Landmark className="w-5 h-5 text-rose-500" />
          </div>
        </div>
        {expenses.length === 0 ? (
          <div className="h-[100px] flex items-center justify-center text-slate-400 text-sm font-bold bg-slate-50 dark:bg-slate-800/50 rounded-[20px]">Aucune dépense ce mois-ci</div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {expenses.sort((a, b) => b.amount - a.amount).map((e, i) => (
              <div key={e.code} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }} />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{e.name}</span>
                <span className="text-xs font-black text-slate-900 dark:text-white">{mask(`${fmtMoney(e.amount)} F`)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const students = useStore((s) => s.students);
  const user = useStore((s) => s.user);
  const getPresencesToday = useStore((s) => s.getPresencesToday);
  const isSyncing = useStore((s) => s.isSyncing);
  const privacyMode = useStore((s) => s.privacyMode);
  const setPrivacyMode = useStore((s) => s.setPrivacyMode);
  const tranches = useStore((s) => s.tranches);

  const trialEndsAt = localStorage.getItem('trial_ends_at');
  const schoolStatus = localStorage.getItem('school_status') || 'trial';
  
  const remainingDays = useMemo(() => {
    if (!trialEndsAt || schoolStatus !== 'trial') return null;
    const diffTime = new Date(trialEndsAt).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [trialEndsAt, schoolStatus]);

  const maskValue = (val: string | number) => privacyMode ? '••••••' : val;

  const todayPresences = useMemo(() => getPresencesToday(), [getPresencesToday]);
  const tauxPresence = students.length > 0 ? Math.round((todayPresences.length / students.length) * 100) : 0;

  useEffect(() => {
    const roles = ['admin', 'directeur', 'directeur_general', 'comptable'];
    if (user?.role && roles.includes(user.role)) {
      const initSync = async () => {
        const available = await isBackendAvailable();
        if (available) {
          const fetchAllFromBackend = useStore.getState().fetchAllFromBackend;
          await fetchAllFromBackend();
        }
      };
      initSync();
    }
  }, []);

  const recouvrement = useMemo(() => computeRecouvrement(students), [students]);
  const classComp = useMemo(() => computeClassComparison(students), [students]);
  const santeFinanciere = useMemo(() => computeSanteFinanciere(students), [students]);
  const cycleComparison = useMemo(() => computeCycleComparison(students), [students]);

  useEffect(() => {
    if (students.length === 0 || classComp.length === 0) return;
    
    const now = new Date();
    const day = now.getDate();
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    const lastReportMonth = useStore.getState().lastReportMonth;
    
    if (day >= 5 && lastReportMonth !== currentMonthKey) {
      setTimeout(() => {
        generateRapportMensuelPDF(students, classComp, { 
          name: useStore.getState().schoolName || useStore.getState().appName, 
          logo: useStore.getState().schoolLogo,
          stamp: useStore.getState().schoolStamp
        });
        useStore.getState().setLastReportMonth(currentMonthKey);
      }, 2000);
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
    const setCurrentPage = useStore.getState().setCurrentPage;
    const tranchesConfigured = tranches && tranches.length > 0;
    const progressPercent = tranchesConfigured ? 33 : 0;

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 animate-fadeIn font-['Poppins']">
        {/* En-tête de bienvenue */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/20 transform hover:rotate-6 transition-transform duration-300">
            <School className="w-10 h-10" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
            Félicitations pour la création de votre établissement ! 🎉
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm md:text-base font-medium leading-relaxed">
            Votre espace de gestion scolaire <strong>{useStore.getState().schoolName || useStore.getState().appName}</strong> est maintenant actif. Suivez ce guide pour configurer vos données en quelques minutes.
          </p>
        </div>

        {/* Barre de progression de la mise en route */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Mise en route de votre école</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                {tranchesConfigured ? '1 sur 3 étapes complétées' : '0 sur 3 étapes complétées'}
              </p>
            </div>
            <span className="text-sm font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">{progressPercent}% complété</span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700 ease-out rounded-full" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Liste des étapes */}
        <div className="space-y-6">
          {/* Étape 1 : Paramètres / Tranches */}
          <div className={`pro-card p-6 flex flex-col md:flex-row gap-6 items-start transition-all duration-300 border bg-white dark:bg-slate-900 ${tranchesConfigured ? 'border-emerald-500/20 dark:border-emerald-500/10 bg-emerald-500/[0.01]' : 'border-slate-200/60 dark:border-slate-800 hover:border-amber-500/20'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${tranchesConfigured ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'}`}>
              {tranchesConfigured ? <CheckCircle className="w-6 h-6" /> : <Settings className="w-6 h-6" />}
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Étape 1 • Configuration Financière</span>
                {tranchesConfigured && <span className="w-fit text-[9px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">Complété</span>}
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Définir les tranches de scolarité</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Déterminez les dates limites et les montants des tranches de paiement dans les paramètres. Étape indispensable pour que les reçus officiels, les restants dus et les relances de paiement automatiques soient corrects.
              </p>
              {!tranchesConfigured && (
                <button
                  onClick={() => setCurrentPage('parametres')}
                  className="mt-2 inline-flex items-center gap-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition active:scale-[0.98] cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Configurer les tranches
                </button>
              )}
            </div>
          </div>

          {/* Étape 2 : Inscription ou Importation */}
          <div className="pro-card p-6 flex flex-col md:flex-row gap-6 items-start transition-all duration-300 border border-slate-200/60 dark:border-slate-800 hover:border-amber-500/20 bg-white dark:bg-slate-900">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            
            <div className="flex-1 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Étape 2 • Base Élèves (Obligatoire)</span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Ajouter ou importer vos élèves</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Alimentez votre base de scolarité. Vous pouvez importer instantanément votre liste complète à partir d'un fichier Excel, ou enregistrer les élèves manuellement un par un.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => setCurrentPage('import_export')}
                  className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition active:scale-[0.98] cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Importer depuis Excel
                </button>
                <button
                  onClick={() => setCurrentPage('eleves')}
                  className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 text-xs font-black uppercase tracking-wider rounded-xl transition active:scale-[0.98] cursor-pointer border border-slate-250 dark:border-slate-700"
                >
                  <Users className="w-3.5 h-3.5" />
                  Inscrire manuellement
                </button>
              </div>
            </div>
          </div>

          {/* Étape 3 : Premier versement test */}
          <div className="pro-card p-6 flex flex-col md:flex-row gap-6 items-start transition-all duration-300 border border-slate-200/60 dark:border-slate-800 hover:border-amber-500/20 bg-white dark:bg-slate-900 opacity-60">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center shrink-0">
              <PlayCircle className="w-6 h-6" />
            </div>
            
            <div className="flex-1 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Étape 3 • Essai Pratique</span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Enregistrer un premier paiement fictif</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Une fois vos élèves enregistrés, simulez un encaissement à la caisse pour découvrir comment se met à jour le solde d'écolage et comment est généré le reçu PDF officiel.
              </p>
              <p className="text-[10px] font-black text-amber-600 bg-amber-500/10 w-fit px-2.5 py-0.5 rounded-full">
                🔒 Nécessite des élèves enregistrés
              </p>
            </div>
          </div>
        </div>

        {/* Conseil pratique en bas */}
        <div className="mt-10 p-4 bg-amber-50 dark:bg-amber-950/10 border border-amber-250/60 dark:border-amber-900/40 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider">💡 Conseil Pratique</p>
            <p className="text-xs text-amber-700 dark:text-slate-350 mt-1 leading-relaxed">
              Pour toute question lors du démarrage, vous pouvez également consulter le centre d'aide ou contacter le support directement via WhatsApp.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      {remainingDays !== null && remainingDays > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 flex items-center justify-between shadow-sm animate-fadeIn dark:bg-amber-500/10 dark:border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight">Période d'essai en cours</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Il vous reste {remainingDays} jour{remainingDays > 1 ? 's' : ''} avant l'activation obligatoire de votre licence d'établissement.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO BANNER ── */}
      <div className="relative pro-card p-8 lg:p-10 overflow-hidden group bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <TrendingUp className="w-64 h-64 text-amber-500" />
        </div>
        
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
            <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500 text-[10px] font-black text-white uppercase tracking-[0.2em] mb-6 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                    <Target className="w-3.5 h-3.5" /> Pilotage Stratégique
                </div>
                <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 leading-tight">
                    Vos encaissements. <span className="text-transparent bg-clip-text bg-gradient-to-br from-amber-400 to-amber-600">En temps réel.</span>
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed font-medium max-w-xl">
                    Recouvrement, soldes par cycle, performances par classe — toutes vos métriques clés en un coup d'œil. Prenez des décisions éclairées, pas des suppositions.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 xl:gap-6">
                <button 
                  onClick={() => generateRapportMensuelPDF(students, classComp, { 
                    name: useStore.getState().schoolName || useStore.getState().appName, 
                    logo: useStore.getState().schoolLogo,
                    stamp: useStore.getState().schoolStamp
                  })}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[20px] hover:scale-105 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] font-black text-[13px] tracking-wide shadow-xl hover:shadow-2xl active:scale-[0.98] group"
                >
                    <div className="w-8 h-8 rounded-full bg-white/20 dark:bg-slate-900/10 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                        <FileText className="w-4 h-4" />
                    </div>
                    RAPPORT MENSUEL
                </button>

                <button
                  onClick={() => setPrivacyMode(!privacyMode)}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-[20px] hover:border-amber-500 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] font-black text-[13px] tracking-wide shadow-md active:scale-[0.98] hover:scale-105 group"
                  title={privacyMode ? "Afficher les chiffres" : "Masquer les chiffres"}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${privacyMode ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-slate-100 dark:bg-slate-700'}`}>
                    {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </div>
                  MODE CONFIDENTIEL
                </button>

                <div className="w-full sm:w-auto flex items-center gap-5 bg-white/80 dark:bg-slate-800/80 px-6 py-4 rounded-[24px] border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-xl shadow-lg">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Santé Financière</p>
                        <p className={`text-xl font-black tracking-tight ${santeFinanciere.color}`}>
                            {maskValue(santeFinanciere.label)}
                        </p>
                    </div>
                    <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center border-[3px] shadow-lg ${
                        santeFinanciere.score >= 80 ? 'border-emerald-500 bg-emerald-50 text-emerald-600' :
                        santeFinanciere.score >= 50 ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-rose-500 bg-rose-50 text-rose-600'
                    }`}>
                        <span className="text-lg font-black tracking-tighter">
                            {maskValue(santeFinanciere.score)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* ── METRICS GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
        <StatCard
          delay={100}
          title="Élèves Inscrits"
          value={maskValue(students.length)}
          sub={privacyMode ? 'Données masquées' : `${stats.soldes} soldés / ${stats.nonSoldes} en attente`}
          icon={<Users className="w-6 h-6 text-amber-600" />}
          color="bg-amber-50/80 dark:bg-amber-900/20 border-amber-500/20"
        />
        <StatCard
          delay={200}
          title="Écolage Total Attendu"
          value={maskValue(`${fmtMoney(stats.totalEcolage)} F`)}
          sub="Montant annuel global"
          icon={<Wallet className="w-6 h-6 text-indigo-600" />}
          color="bg-indigo-50/80 dark:bg-indigo-900/20 border-indigo-500/20"
        />
        <StatCard
          delay={300}
          title="Encaissé à ce Jour"
          value={maskValue(`${fmtMoney(stats.totalPaye)} F`)}
          sub="Versements confirmés"
          icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
          color="bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-500/20"
          trend={privacyMode ? undefined : `+${stats.taux}% recouvré`}
        />
        <StatCard
          delay={400}
          title="Solde à Recouvrer"
          value={maskValue(`${fmtMoney(stats.totalRestant)} F`)}
          sub="Reste à encaisser"
          icon={<AlertCircle className="w-6 h-6 text-rose-600" />}
          color="bg-rose-50/80 dark:bg-rose-900/20 border-rose-500/20"
        />
        <StatCard
          delay={500}
          title="Présences du Jour"
          value={maskValue(`${todayPresences.length} / ${students.length}`)}
          sub="Élèves pointés aujourd'hui"
          icon={<UserCheck className="w-6 h-6 text-cyan-600" />}
          color="bg-cyan-50/80 dark:bg-cyan-900/20 border-cyan-500/20"
          trend={privacyMode ? undefined : `${tauxPresence}% de présence`}
        />
      </div>

      {/* ── RECOVERY BAR ── */}
      <div className="pro-card p-8 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h3 className="font-black text-slate-900 dark:text-white text-xl tracking-tight">Recouvrement Global des Frais</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Progression des encaissements sur l'année scolaire en cours</p>
          </div>
          <div className="text-5xl font-black text-amber-500 dark:text-amber-400 tracking-tighter drop-shadow-sm">{maskValue(`${stats.taux}%`)}</div>
        </div>
        <div className="relative h-8 bg-slate-100/50 dark:bg-slate-800/50 rounded-full overflow-hidden shadow-inner p-1.5 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-500 rounded-full transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_0_20px_rgba(245,158,11,0.5)] relative overflow-hidden"
            style={{ width: `${stats.taux}%` }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)50%,rgba(255,255,255,0.2)75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]" />
          </div>
        </div>
        <div className="flex justify-between mt-4 text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">
          <span>Initial (0%)</span>
          <span className="text-slate-300">Seuil (50%)</span>
          <span>Objectif (100%)</span>
        </div>
      </div>

      {/* ── CYCLE ANALYSIS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {([
          {
            label: 'Primaire', sub: 'CI au CM2',
            icon: <School className="w-6 h-6 text-amber-600" />,
            colors: { border: 'border-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600', fill: 'bg-amber-500' },
            key: 'Primaire' as const,
          },
          {
            label: 'Collège', sub: '6ème au 3ème',
            icon: <BookOpen className="w-6 h-6 text-indigo-600" />,
            colors: { border: 'border-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600', fill: 'bg-indigo-500' },
            key: 'Collège' as const,
          },
          {
            label: 'Lycée', sub: 'Seconde à Terminale',
            icon: <GraduationCap className="w-6 h-6 text-rose-600" />,
            colors: { border: 'border-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600', fill: 'bg-rose-500' },
            key: 'Lycée' as const,
          },
        ] as const).map((c) => {
          const cs = stats.cycleStats[c.key];
          return (
            <div key={c.label} className={`pro-card p-8 border-t-4 border-t-transparent hover:border-t-${c.colors.fill.replace('bg-','')} transition-all duration-300 group`}>
              <div className="flex items-center gap-5 mb-8">
                <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center shadow-md ${c.colors.bg} group-hover:scale-110 transition-transform duration-500 ease-out`}>
                  {c.icon}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className={`text-2xl font-black tracking-tighter text-slate-900 dark:text-white`}>{c.label}</p>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest truncate mt-0.5">{c.sub}</p>
                </div>
                <div className={`px-4 py-2 rounded-xl font-black text-xl bg-slate-50 dark:bg-slate-800 ${c.colors.text}`}>
                  {maskValue(cs.count)}
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Attendu</span>
                  <span className="font-black text-slate-900 dark:text-white">{maskValue(fmtMoney(cs.ecolage))} F</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Perçu</span>
                  <span className="font-black text-emerald-600">{maskValue(fmtMoney(cs.paye))} F</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30">
                  <span className="text-xs font-bold text-rose-600 uppercase tracking-wide">Reste</span>
                  <span className="font-black text-rose-600">{maskValue(fmtMoney(cs.restant))} F</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Taux de recouvrement</span>
                  <span className={`text-xl font-black ${c.colors.text}`}>{maskValue(`${cs.taux}%`)}</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner p-0.5">
                  <div
                    className={`h-full ${c.colors.fill} rounded-full transition-all duration-1000 shadow-md relative overflow-hidden`}
                    style={{ width: `${cs.taux}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full h-full -translate-x-full animate-[shimmer_2s_infinite]" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── CHARTS SECTION ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 pro-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-xl tracking-tight mb-1">Paiements par classe</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Distribution des montants (FCFA)</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-[16px]">
              <BarChart2 className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          {classData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm font-bold bg-slate-50 dark:bg-slate-800/50 rounded-[20px]">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={classData} barCategoryGap="20%" barGap={4} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.5} />
                <XAxis dataKey="classe" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} dy={10} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 700 }} iconType="circle" />
                <Bar dataKey="Payé" fill={BAR_COLORS.paye} radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Restant" fill={BAR_COLORS.restant} radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="pro-card p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-xl tracking-tight mb-1">Répartition</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Élèves par cycle</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-[16px]">
              <PieChart className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          {cycleData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm font-bold bg-slate-50 dark:bg-slate-800/50 rounded-[20px]">Aucune donnée</div>
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={cycleData} 
                    cx="50%" cy="45%" 
                    outerRadius={110} innerRadius={70} 
                    dataKey="value" 
                    paddingAngle={5}
                    stroke="none"
                  >
                    {cycleData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} className="hover:opacity-80 transition-opacity outline-none" />)}
                  </Pie>
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 700 }} iconType="circle" />
                  <Tooltip 
                    formatter={(value) => [`${value} élèves`, 'Total']} 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px', fontWeight: 900 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── TRÉSORERIE, REVENUS & DÉPENSES ── */}
      <FinancialOverview privacyMode={privacyMode} />

      {/* ── TOP PERFORMERS & SOLVABILITY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="pro-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-[16px]">
                <BarChart2 className="w-6 h-6" />
              </div>
              Top Performances
            </h3>
          </div>

          <div className="space-y-4">
            {classComp.slice(0, 5).map((row, i) => (
              <div key={row.classe} className="group flex items-center gap-5 p-4 rounded-[24px] bg-slate-50/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 border border-slate-100 dark:border-slate-700/50 hover:shadow-lg hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center font-black text-lg shadow-sm ${
                    i === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]' :
                    i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' :
                    i === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-lg font-black text-slate-800 dark:text-white tracking-tight">{row.classe}</span>
                    <span className={`text-[11px] font-black px-3 py-1 rounded-lg ${
                        row.taux >= 85 ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400' : 'text-amber-700 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400'
                    }`}>{maskValue(`${row.taux}%`)}</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 relative overflow-hidden ${row.taux >= 85 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${row.taux}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full h-full -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pro-card p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-[16px]">
                <Target className="w-6 h-6" />
              </div>
              Solvabilité / Cycle
            </h3>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={cycleComparison}>
                <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="cycle" tick={{ fontSize: 12, fontWeight: 900, fill: '#475569' }} />
                <Radar
                  name="Taux"
                  dataKey="taux"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  fill="#f59e0b"
                  fillOpacity={0.3}
                  className="drop-shadow-lg"
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px', fontWeight: 900 }}
                  formatter={(value) => [`${value}%`, 'Recouvrement']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
