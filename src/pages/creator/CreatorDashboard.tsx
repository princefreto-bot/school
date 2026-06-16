import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { API_BASE_URL } from '../../config';
import { getAuthHeaders, parseResponse } from '../../services/apiHelpers';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  School, Users, CheckCircle, Wallet, Award, Megaphone, 
  ArrowUpRight, AlertCircle, RefreshCw, LogOut, Eye, EyeOff
} from 'lucide-react';
import gsap from 'gsap';

const fmtMoney = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
const COLORS = ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#78350f'];

interface CreatorData {
  creator: {
    id: string;
    nom: string;
    telephone: string;
  };
  summary: {
    total_schools: number;
    total_students: number;
    total_active_students: number;
    total_revenue_generated: number;
    total_creator_commission: number;
    price_per_student: number;
    commission_percentage: number;
  };
  schools: Array<{
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    status: string;
    total_students: number;
    active_students: number;
    revenue_generated: number;
    creator_commission: number;
  }>;
}

export const CreatorDashboard: React.FC = () => {
  const [data, setData] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [privacyMode, setPrivacyMode] = useState(false);
  const logout = useStore((s) => s.logout);
  const theme = useStore((s) => s.theme);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/creator/dashboard`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        throw new Error("Impossible de charger les données du dashboard.");
      }
      const result = await parseResponse(res);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors du chargement des statistiques.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // GSAP Entrance Animation
  useEffect(() => {
    if (!loading && !error && data) {
      const tl = gsap.timeline();
      tl.from('.creator-animate-in', {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power3.out',
      }, 0.1);
    }
  }, [loading, error, data]);

  const maskValue = (val: string | number) => privacyMode ? '••••••' : val;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-fadeIn">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">Chargement de votre espace...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-fadeIn">
        <div className="w-20 h-20 bg-rose-500/10 dark:bg-rose-500/5 rounded-[24px] flex items-center justify-center mb-6 text-rose-500">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Erreur de chargement</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 text-sm">
          {error || "Nous n'avons pas pu charger vos informations créateur."}
        </p>
        <button 
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg hover:shadow-xl transition active:scale-95"
        >
          <RefreshCw className="w-4 h-4" /> Réessayer
        </button>
      </div>
    );
  }

  const { creator, summary, schools } = data;

  const chartData = schools.map(s => ({
    name: s.name,
    Commission: s.creator_commission,
    Revenu: s.revenue_generated
  }));

  const pieData = schools.map(s => ({
    name: s.name,
    value: s.active_students
  })).filter(d => d.value > 0);

  return (
    <>
      <div className="guides">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="col" />
        ))}
      </div>
      <div className="grid-wrap pb-20">
      {/* ── HERO BANNER ── */}
      <div className="band mt-8 creator-animate-in relative pro-card p-8 lg:p-10 overflow-hidden group bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <Megaphone className="w-64 h-64 text-amber-500" />
        </div>
        
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
            <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500 text-[10px] font-black text-white uppercase tracking-[0.2em] mb-6 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                    <Award className="w-3.5 h-3.5" /> Espace Partenaire Créateur
                </div>
                <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 leading-tight">
                    Bonjour, <span className="text-transparent bg-clip-text bg-gradient-to-br from-amber-400 to-amber-600">{creator.nom}</span>
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed font-medium max-w-xl">
                    Suivez en temps réel l'impact de vos campagnes, les licences élèves débloquées par vos écoles affiliées et vos gains générés (20% de commission).
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 xl:gap-6">
                <button
                  onClick={() => setPrivacyMode(!privacyMode)}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-[20px] hover:border-amber-500 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] font-black text-[13px] tracking-wide shadow-md active:scale-[0.98] hover:scale-105 group"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${privacyMode ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-slate-100 dark:bg-slate-700'}`}>
                    {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </div>
                  MODE CONFIDENTIEL
                </button>

                <button 
                  onClick={fetchDashboardData}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[20px] hover:scale-105 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] font-black text-[13px] tracking-wide shadow-xl hover:shadow-2xl active:scale-[0.98]"
                >
                  <RefreshCw className="w-4 h-4" /> ACTUALISER
                </button>
            </div>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="band mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6 creator-animate-in">
        <div className="pro-card relative group p-6 overflow-hidden">
          <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full blur-3xl opacity-20 bg-amber-500" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Écoles Liées</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{summary.total_schools}</p>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">Affiliations actives</p>
            </div>
            <div className="w-14 h-14 rounded-[20px] bg-amber-500/10 text-amber-500 flex items-center justify-center border border-white/20 shadow-md">
              <School className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="pro-card relative group p-6 overflow-hidden">
          <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full blur-3xl opacity-20 bg-indigo-500" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Total Élèves</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{maskValue(summary.total_students)}</p>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">Dans vos établissements</p>
            </div>
            <div className="w-14 h-14 rounded-[20px] bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-white/20 shadow-md">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="pro-card relative group p-6 overflow-hidden">
          <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full blur-3xl opacity-20 bg-emerald-500" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Comptes Débloqués</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{maskValue(summary.total_active_students)}</p>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">Licences annuelles payées</p>
            </div>
            <div className="w-14 h-14 rounded-[20px] bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-white/20 shadow-md">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="pro-card relative group p-6 overflow-hidden">
          <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full blur-3xl opacity-20 bg-rose-500" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">CA Établissements</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{maskValue(`${fmtMoney(summary.total_revenue_generated)} F`)}</p>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">Généré par les licences</p>
            </div>
            <div className="w-14 h-14 rounded-[20px] bg-rose-500/10 text-rose-500 flex items-center justify-center border border-white/20 shadow-md">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="pro-card relative group p-6 overflow-hidden bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full blur-3xl opacity-35 bg-white" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-amber-200 uppercase tracking-[0.2em]">Votre Commission (20%)</p>
              <p className="text-3xl font-black text-white tracking-tighter">{maskValue(`${fmtMoney(summary.total_creator_commission)} F`)}</p>
              <p className="text-[11px] font-bold text-amber-100/80">Montant total dû</p>
            </div>
            <div className="w-14 h-14 rounded-[20px] bg-white/20 text-white flex items-center justify-center border border-white/10 shadow-md">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* ── VISUALISATIONS & GRAPHS ── */}
      <div className="band mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6 creator-animate-in">
        <div className="xl:col-span-2 pro-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-xl tracking-tight mb-1">Gains par Établissement</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Comparaison des commissions générées</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-[16px]">
              <Wallet className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          {schools.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm font-bold bg-slate-50 dark:bg-slate-800/50 rounded-[20px]">Aucun établissement affilié</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} barCategoryGap="25%" margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} dy={10} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }} 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  formatter={(value) => [`${privacyMode ? '••••••' : fmtMoney(value as number)} FCFA`, 'Commission']}
                />
                <Bar dataKey="Commission" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="pro-card p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-xl tracking-tight mb-1">Impact Ventes</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Répartition des licences</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-[16px]">
              <Users className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          {pieData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm font-bold bg-slate-50 dark:bg-slate-800/50 rounded-[20px]">Aucune licence vendue</div>
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={pieData} 
                    cx="50%" cy="45%" 
                    outerRadius={100} innerRadius={60} 
                    dataKey="value" 
                    paddingAngle={5}
                    stroke="none"
                  >
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} className="hover:opacity-85 transition-opacity outline-none" />)}
                  </Pie>
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontWeight: 700 }} iconType="circle" />
                  <Tooltip 
                    formatter={(value) => [`${value} licences`, 'Ventes']} 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── AFFILIATED SCHOOLS LIST ── */}
      <div className="band mt-8 pro-card p-8 creator-animate-in">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-6 flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
            <School className="w-6 h-6" />
          </div>
          Établissements Affiliés
        </h3>
        
        {schools.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/20 rounded-[20px]">
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Vous n'avez pas encore d'écoles affiliées à votre compte.</p>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Les liaisons d'écoles sont configurées manuellement par le SuperAdmin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[24px] border border-slate-100 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  <th className="px-6 py-5">Établissement</th>
                  <th className="px-6 py-5">Statut</th>
                  <th className="px-6 py-5 text-right">Total Élèves</th>
                  <th className="px-6 py-5 text-right">Licences Débloquées</th>
                  <th className="px-6 py-5 text-right">Chiffre d'Affaires</th>
                  <th className="px-6 py-5 text-right">Votre Gain (20%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                {schools.map((school) => {
                  const percentActive = school.total_students > 0 
                    ? Math.round((school.active_students / school.total_students) * 100)
                    : 0;

                  return (
                    <tr key={school.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-sm border border-amber-500/10 overflow-hidden flex-shrink-0">
                          {school.logo_url ? (
                            <img src={school.logo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            school.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white leading-tight">{school.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">slug: {school.slug}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          school.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-600' 
                            : school.status === 'trial'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-rose-500/10 text-rose-600'
                        }`}>
                          {school.status === 'active' ? 'Actif' : school.status === 'trial' ? 'Essai' : 'Suspendu'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right font-bold tabular-nums">
                        {maskValue(school.total_students)}
                      </td>
                      <td className="px-6 py-5 text-right font-bold tabular-nums">
                        <div className="flex flex-col items-end">
                          <span>{maskValue(school.active_students)}</span>
                          <span className="text-[10px] text-slate-400 font-bold mt-0.5">({percentActive}%)</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-bold tabular-nums">
                        {maskValue(`${fmtMoney(school.revenue_generated)} F`)}
                      </td>
                      <td className="px-6 py-5 text-right font-black tabular-nums text-amber-500">
                        {maskValue(`${fmtMoney(school.creator_commission)} F`)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </>
  );
};
