import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { FileText, Download, Award, ShieldCheck, BookOpen, Layers, GraduationCap, UserX, TrendingDown, Trophy, Loader2 } from 'lucide-react';
import { computeAcademicStats, computeSubjectAcademicStats, computePerformanceDeclineAlerts, generateAcademicReportPDF } from '../utils/academicReportGenerator';
import { computeAbsenceTrend, filterSchoolDays } from '../services/attendanceAnalyticsService';
import { computeExamStats } from '../utils/examReportGenerator';
import { isExamClass } from '../utils/examEligibility';
import { examApi, ExamSession, ExamNote } from '../services/examApi';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export const RapportsAcademiques: React.FC = () => {
    const {
        students,
        matieres,
        classeMatieres,
        notes,
        presences,
        schoolName,
        schoolLogo,
        schoolStamp,
        schoolYear
    } = useStore();

    const [activeTab, setActiveTab] = useState<'primaire' | 'college' | 'lycee' | 'examens'>('primaire');

    // ── Statistiques d'examens (CEPD/BEPC/BAC) ──
    const [examSessions, setExamSessions] = useState<ExamSession[]>([]);
    const [examNotesAll, setExamNotesAll] = useState<ExamNote[]>([]);
    const [loadingExamStats, setLoadingExamStats] = useState(false);
    // Ref pour éviter les re-fetch infinis (notamment en cas d'échec réseau)
    const hasFetchedExams = useRef(false);

    useEffect(() => {
        if (activeTab !== 'examens') return;
        // Ne pas re-fetcher si déjà en cours ou déjà tenté
        if (hasFetchedExams.current || loadingExamStats) return;

        const examClasses = Array.from(new Set(students.map(s => s.classe))).filter(isExamClass);
        if (examClasses.length === 0) return;

        hasFetchedExams.current = true;
        setLoadingExamStats(true);
        examApi.getSessions()
            .then(async (sessions) => {
                setExamSessions(sessions);
                const allNotes: ExamNote[] = [];
                for (const classe of examClasses) {
                    for (const session of sessions) {
                        try {
                            const notes = await examApi.getNotes(classe, session.id);
                            allNotes.push(...notes);
                        } catch {
                            // classe/session sans notes — ignoré
                        }
                    }
                }
                setExamNotesAll(allNotes);
            })
            .catch(() => {
                // En cas d'échec, permettre un retry manuel en réinitialisant le ref
                hasFetchedExams.current = false;
                setExamSessions([]);
                setExamNotesAll([]);
            })
            .finally(() => setLoadingExamStats(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, students]);

    const examStats = useMemo(() => {
        return computeExamStats(students, matieres, classeMatieres, examNotesAll, examSessions);
    }, [students, matieres, classeMatieres, examNotesAll, examSessions]);

    // Calculer les statistiques
    const stats = useMemo(() => {
        return computeAcademicStats(students, matieres, classeMatieres, notes);
    }, [students, matieres, classeMatieres, notes]);

    const primaireStats = useMemo(() => stats.filter(s => s.cycle === 'Primaire'), [stats]);
    const collegeStats = useMemo(() => stats.filter(s => s.cycle === 'Collège'), [stats]);
    const lyceeStats = useMemo(() => stats.filter(s => s.cycle === 'Lycée'), [stats]);

    // Taux de réussite par matière (nouveau, en complément du taux par classe ci-dessus)
    const subjectStats = useMemo(() => {
        return computeSubjectAcademicStats(students, matieres, classeMatieres, notes);
    }, [students, matieres, classeMatieres, notes]);

    const primaireSubjectStats = useMemo(() => subjectStats.filter(s => s.cycle === 'Primaire'), [subjectStats]);
    const collegeSubjectStats = useMemo(() => subjectStats.filter(s => s.cycle === 'Collège'), [subjectStats]);
    const lyceeSubjectStats = useMemo(() => subjectStats.filter(s => s.cycle === 'Lycée'), [subjectStats]);

    // Tendance des absences sur les 14 derniers jours (tous cycles confondus)
    const absenceTrend = useMemo(() => {
        return filterSchoolDays(computeAbsenceTrend(students, presences, 14));
    }, [students, presences]);

    // Alertes de baisse de performance (comparaison des deux dernières périodes ayant des notes)
    const performanceAlerts = useMemo(() => {
        return computePerformanceDeclineAlerts(students, matieres, classeMatieres, notes);
    }, [students, matieres, classeMatieres, notes]);

    const handleDownloadPDF = () => {
        generateAcademicReportPDF(
            students,
            matieres,
            classeMatieres,
            notes,
            { name: schoolName, logo: schoolLogo, stamp: schoolStamp }
        );
    };

    const totalStudentsCount = useMemo(() => {
        return stats.reduce((sum, s) => sum + s.effectif, 0);
    }, [stats]);

    const overallSuccessRate = useMemo(() => {
        const activeClassesWithAverages = stats.filter(s => s.annual.average > 0);
        if (activeClassesWithAverages.length === 0) return 0;
        const totalRatesSum = activeClassesWithAverages.reduce((sum, s) => sum + s.annual.successRate, 0);
        return parseFloat((totalRatesSum / activeClassesWithAverages.length).toFixed(2));
    }, [stats]);

    const primaryStudentsCount = useMemo(() => primaireStats.reduce((sum, s) => sum + s.effectif, 0), [primaireStats]);    const renderStatsCell = (periodData?: { successCount: number; successRate: number; failureCount: number; failureRate: number }, isRight = false) => {
        const success = periodData?.successCount || 0;
        const successPct = periodData?.successRate || 0;
        const failure = periodData?.failureCount || 0;
        const failurePct = periodData?.failureRate || 0;
        
        return (
            <div className={`text-xs space-y-0.5 ${isRight ? 'text-right' : ''}`}>
                <div className="font-semibold text-emerald-600 dark:text-emerald-450">
                    Réu: <span className="font-black text-slate-900 dark:text-white">{success}</span> <span className="text-slate-400">({successPct}%)</span>
                </div>
                <div className="font-semibold text-rose-500 dark:text-rose-455">
                    Éch: <span className="font-black text-slate-700 dark:text-slate-300">{failure}</span> <span className="text-slate-400">({failurePct}%)</span>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-20 animate-slideUp">
            
            {/* ── HEADER ── */}
            <div className="relative border border-slate-900/10 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[32px] p-8 overflow-hidden group shadow-sm">
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.04] group-hover:scale-110 transition-all duration-700">
                    <FileText className="w-64 h-64 text-black dark:text-white" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 dark:bg-slate-800 text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4">
                            <Award className="w-3.5 h-3.5" /> Pédagogie
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
                            Rapports <span className="text-transparent bg-clip-text bg-gradient-to-br from-slate-700 to-slate-950 dark:from-slate-300 dark:to-slate-100">Académiques</span>
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                            Analysez les taux de réussite par classe et téléchargez le bilan officiel imprimable en noir et blanc.
                        </p>
                    </div>
 
                    <button
                        onClick={handleDownloadPDF}
                        disabled={stats.length === 0}
                        className="flex items-center justify-center gap-2.5 px-6 py-4 bg-slate-950 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        Générer Rapport B&W
                    </button>
                </div>
            </div>
 
            {/* ── KPIs ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="border border-slate-900/10 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 rounded-[24px] flex items-center justify-between group hover:border-slate-400 dark:hover:border-slate-600 transition-colors shadow-sm">
                    <div>
                        <p className="text-[10px] font-black text-slate-445 dark:text-slate-500 uppercase tracking-widest mb-1">Effectif Total (Collège & Lycée)</p>
                        <p className="text-3xl font-black tracking-tighter text-slate-950 dark:text-white">{totalStudentsCount} élèves</p>
                    </div>
                    <div className="w-12 h-12 rounded-[1rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                        <BookOpen className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    </div>
                </div>
 
                <div className="border border-slate-900/10 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 rounded-[24px] flex items-center justify-between group hover:border-slate-400 dark:hover:border-slate-600 transition-colors shadow-sm">
                    <div>
                        <p className="text-[10px] font-black text-slate-445 dark:text-slate-500 uppercase tracking-widest mb-1">Taux de Réussite Annuel Global</p>
                        <p className="text-3xl font-black tracking-tighter text-slate-950 dark:text-white">{overallSuccessRate}%</p>
                    </div>
                    <div className="w-12 h-12 rounded-[1rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                        <ShieldCheck className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    </div>
                </div>
            </div>

            {/* ── ALERTES DE BAISSE DE PERFORMANCE ── */}
            {performanceAlerts.length > 0 && (
                <div className="border border-rose-500/20 bg-rose-50/50 dark:bg-rose-950/10 rounded-[28px] p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center border border-rose-500/20">
                            <TrendingDown className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">
                                Alertes de Baisse de Performance
                                <span className="ml-2 text-xs font-black text-rose-600 bg-rose-100 dark:bg-rose-500/20 dark:text-rose-400 px-2.5 py-0.5 rounded-full align-middle">{performanceAlerts.length}</span>
                            </h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-450">Élèves dont la moyenne a chuté entre les deux dernières périodes</p>
                        </div>
                    </div>

                    <div className="space-y-2.5 max-h-96 overflow-y-auto">
                        {performanceAlerts.map(a => (
                            <div key={a.studentId} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                <div className="min-w-0">
                                    <p className="font-black text-slate-900 dark:text-white truncate">{a.studentName}</p>
                                    <p className="text-xs font-bold text-slate-450 uppercase tracking-wide">{a.classe} · {a.previousPeriod} → {a.currentPeriod}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400 font-bold">{a.previousAverage}/20 → <span className="text-slate-900 dark:text-white">{a.currentAverage}/20</span></p>
                                        {a.crossedToFailing && <p className="text-[10px] font-black text-rose-600 uppercase tracking-wide">Passe sous la moyenne</p>}
                                    </div>
                                    <span className="text-sm font-black text-rose-600 bg-rose-100 dark:bg-rose-500/20 dark:text-rose-400 px-3 py-1.5 rounded-xl">
                                        {a.delta}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── TABS ── */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800 w-fit">
                <button
                    onClick={() => setActiveTab('primaire')}
                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                        activeTab === 'primaire'
                        ? 'bg-slate-950 text-white dark:bg-slate-800 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-750 dark:hover:text-slate-300'
                    }`}
                >
                    <Layers className="w-4 h-4" />
                    Primaire (Trimestres)
                </button>
                <button
                    onClick={() => setActiveTab('college')}
                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                        activeTab === 'college' 
                        ? 'bg-slate-950 text-white dark:bg-slate-800 dark:text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-750 dark:hover:text-slate-300'
                    }`}
                >
                    <Layers className="w-4 h-4" />
                    Collège (Trimestres)
                </button>
                <button
                    onClick={() => setActiveTab('lycee')}
                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                        activeTab === 'lycee' 
                        ? 'bg-slate-950 text-white dark:bg-slate-800 dark:text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-750 dark:hover:text-slate-300'
                    }`}
                >
                    <Layers className="w-4 h-4" />
                    Lycée (Semestres)
                </button>
                <button
                    onClick={() => setActiveTab('examens')}
                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                        activeTab === 'examens'
                        ? 'bg-slate-950 text-white dark:bg-slate-800 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-750 dark:hover:text-slate-300'
                    }`}
                >
                    <Trophy className="w-4 h-4" />
                    Examens (CEPD/BEPC/BAC)
                </button>
            </div>

            {/* ── ONGLET EXAMENS ── */}
            {activeTab === 'examens' && (
                <div className="space-y-6">
                    {loadingExamStats ? (
                        <div className="flex items-center justify-center py-16 border border-slate-900/10 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[28px] shadow-sm">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                        </div>
                    ) : examStats.length === 0 ? (
                        <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-[28px] bg-white dark:bg-slate-900">
                            <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-sm font-bold text-slate-400">Aucune session d'examen ou aucune note saisie pour l'instant.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {examStats.map(s => (
                                    <div key={s.type} className="border border-slate-900/10 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 rounded-[24px] shadow-sm">
                                        <p className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1">{s.type}</p>
                                        <p className="text-3xl font-black tracking-tighter text-slate-950 dark:text-white mb-2">{s.moyenneGenerale}/20</p>
                                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Réussite : {s.successRate}%</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-2">{s.effectif} élèves · {s.sessionsCount} session(s)</p>
                                    </div>
                                ))}
                            </div>

                            <div className="border border-slate-900/10 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[28px] p-6 sm:p-8 shadow-sm">
                                <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight mb-6">Moyenne Générale par Type d'Examen</h3>
                                <ResponsiveContainer width="100%" height={240}>
                                    <BarChart data={examStats.map(s => ({ name: s.type, moyenne: s.moyenneGenerale }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.5} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} />
                                        <YAxis tickFormatter={(v) => `${v}`} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} domain={[0, 20]} />
                                        <Tooltip
                                            formatter={(value?: number) => [`${value ?? 0}/20`, 'Moyenne']}
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                                        />
                                        <Bar dataKey="moyenne" name="moyenne" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="border border-slate-900/10 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[28px] p-6 sm:p-8 shadow-sm">
                                <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight mb-6">Top 5 par Type d'Examen</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {examStats.map(s => (
                                        <div key={s.type} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
                                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">{s.type}</p>
                                            {s.top5.length === 0 ? (
                                                <p className="text-xs text-slate-400 italic">Aucune donnée.</p>
                                            ) : (
                                                <ul className="space-y-2">
                                                    {s.top5.map((t, i) => (
                                                        <li key={i} className="flex items-center justify-between text-sm">
                                                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{i + 1}. {t.nom} <span className="text-slate-400 font-medium">({t.classe})</span></span>
                                                            <span className="font-black text-emerald-600">{t.moyenne}/20</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── TABLE PREVIEW ── */}
            {activeTab !== 'examens' && (
            <div className="border border-slate-900/10 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[28px] p-6 sm:p-8 shadow-sm">

                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">
                        {activeTab === 'primaire' ? 'Tableau des Résultats — Primaire'
                         : activeTab === 'college' ? 'Tableau des Résultats — Collège'
                         : 'Tableau des Résultats — Lycée'}
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-450">
                        Session {schoolYear}
                    </span>
                </div>
 
                <div className="overflow-x-auto">
                    {/* Primaire */}
                    {activeTab === 'primaire' && (
                        primaireStats.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                <p className="text-sm font-bold text-slate-400">Aucune donnée disponible pour le Primaire.</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-905 dark:border-slate-800">
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-450 uppercase tracking-widest">Classe</th>
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-450 uppercase tracking-widest">Effectif</th>
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-450 uppercase tracking-widest">Trimestre 1</th>
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-450 uppercase tracking-widest">Trimestre 2</th>
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-450 uppercase tracking-widest">Trimestre 3</th>
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-450 uppercase tracking-widest text-right">Bilan Annuel</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {primaireStats.map(c => (
                                        <tr key={c.classe} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-4 px-4 font-black text-slate-900 dark:text-white">{c.classe.toUpperCase()}</td>
                                            <td className="py-4 px-4 font-bold text-slate-500">{c.effectif} élèves</td>
                                            <td className="py-4 px-4">{renderStatsCell(c.periods['TRIMESTRE 1'])}</td>
                                            <td className="py-4 px-4">{renderStatsCell(c.periods['TRIMESTRE 2'])}</td>
                                            <td className="py-4 px-4">{renderStatsCell(c.periods['TRIMESTRE 3'])}</td>
                                            <td className="py-4 px-4">{renderStatsCell(c.annual, true)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )
                    )}

                    {/* Collège */}
                    {activeTab === 'college' && (
                        collegeStats.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                <p className="text-sm font-bold text-slate-400">Aucune donnée disponible pour le Collège.</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-905 dark:border-slate-800">
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-450 uppercase tracking-widest">Classe</th>
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-450 uppercase tracking-widest">Effectif</th>
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-450 uppercase tracking-widest">Trimestre 1</th>
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-450 uppercase tracking-widest">Trimestre 2</th>
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-450 uppercase tracking-widest">Trimestre 3</th>
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-450 uppercase tracking-widest text-right">Bilan Annuel</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {collegeStats.map(c => (
                                        <tr key={c.classe} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-4 px-4 font-black text-slate-900 dark:text-white">{c.classe.toUpperCase()}</td>
                                            <td className="py-4 px-4 font-bold text-slate-500">{c.effectif} élèves</td>
                                            <td className="py-4 px-4">
                                                {renderStatsCell(c.periods['TRIMESTRE 1'])}
                                            </td>
                                            <td className="py-4 px-4">
                                                {renderStatsCell(c.periods['TRIMESTRE 2'])}
                                            </td>
                                            <td className="py-4 px-4">
                                                {renderStatsCell(c.periods['TRIMESTRE 3'])}
                                            </td>
                                            <td className="py-4 px-4">
                                                {renderStatsCell(c.annual, true)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )
                    )}


                    {/* Lycée */}
                    {activeTab === 'lycee' && (
                        lyceeStats.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                <p className="text-sm font-bold text-slate-400">Aucune donnée disponible pour le Lycée.</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-905 dark:border-slate-800">
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-450 uppercase tracking-widest">Classe</th>
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-450 uppercase tracking-widest">Effectif</th>
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-450 uppercase tracking-widest">Semestre 1</th>
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-450 uppercase tracking-widest">Semestre 2</th>
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-450 uppercase tracking-widest text-right">Bilan Annuel</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {lyceeStats.map(c => (
                                        <tr key={c.classe} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-4 px-4 font-black text-slate-900 dark:text-white">{c.classe.toUpperCase()}</td>
                                            <td className="py-4 px-4 font-bold text-slate-500">{c.effectif} élèves</td>
                                            <td className="py-4 px-4">
                                                {renderStatsCell(c.periods['SEMESTRE 1'])}
                                            </td>
                                            <td className="py-4 px-4">
                                                {renderStatsCell(c.periods['SEMESTRE 2'] || c.periods['SEMERE 2'])}
                                            </td>
                                            <td className="py-4 px-4">
                                                {renderStatsCell(c.annual, true)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )
                    )}
                </div>
            </div>
            )}

            {/* ── TAUX DE RÉUSSITE PAR MATIÈRE ── */}
            {activeTab !== 'examens' && (
            <div className="border border-slate-900/10 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[28px] p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20">
                        <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">Taux de Réussite par Matière</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-450">
                            {activeTab === 'primaire' ? 'Primaire' : activeTab === 'college' ? 'Collège' : 'Lycée'} — toutes classes confondues
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {(() => {
                        const rows = activeTab === 'primaire' ? primaireSubjectStats
                            : activeTab === 'college' ? collegeSubjectStats
                            : lyceeSubjectStats;
                        const periodKeys = activeTab === 'lycee'
                            ? ['SEMESTRE 1', 'SEMESTRE 2']
                            : ['TRIMESTRE 1', 'TRIMESTRE 2', 'TRIMESTRE 3'];

                        if (rows.length === 0) {
                            return (
                                <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                    <p className="text-sm font-bold text-slate-400">Aucune note disponible pour calculer ce taux.</p>
                                </div>
                            );
                        }

                        return (
                            <table className="w-full text-sm text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-905 dark:border-slate-800">
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-450 uppercase tracking-widest">Matière</th>
                                        {periodKeys.map(p => (
                                            <th key={p} className="py-4 px-4 text-[10px] font-black text-slate-450 uppercase tracking-widest">{p}</th>
                                        ))}
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-450 uppercase tracking-widest text-right">Bilan Annuel</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {rows.map(s => (
                                        <tr key={s.matiereId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-4 px-4 font-black text-slate-900 dark:text-white">{s.matiereName}</td>
                                            {periodKeys.map(p => (
                                                <td key={p} className="py-4 px-4">{renderStatsCell(s.periods[p])}</td>
                                            ))}
                                            <td className="py-4 px-4">{renderStatsCell(s.annual, true)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        );
                    })()}
                </div>
            </div>
            )}

            {/* ── TENDANCE DES ABSENCES ── */}
            <div className="border border-slate-900/10 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[28px] p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center border border-rose-500/20">
                        <UserX className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">Tendance des Absences</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-450">Derniers jours de classe (tous cycles)</p>
                    </div>
                </div>

                {absenceTrend.length === 0 ? (
                    <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm font-bold bg-slate-50 dark:bg-slate-800/50 rounded-[20px]">
                        Aucun scan de présence enregistré récemment.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={absenceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.5} />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} />
                            <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                            <Tooltip
                                formatter={(value?: number) => [`${value || 0}%`, 'Taux d\'absence']}
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                            />
                            <Line type="monotone" dataKey="absenceRate" name="absenceRate" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e' }} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

        </div>
    );
};
