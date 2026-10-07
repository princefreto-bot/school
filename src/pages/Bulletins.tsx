import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { BulletinTogoPDF } from '../components/pdf/BulletinTogoPDF';
import { calculerBulletinsClasse, BulletinEleveResultat, getPeriodesAntérieures } from '../utils/bulletinCalculations';
import { getAvailablePeriods } from '../data/classConfig';
import { useReactToPrint } from 'react-to-print';
import { FileSpreadsheet, Printer, Users, Award, ShieldCheck, Archive, Loader2 } from 'lucide-react';
import { PeriodeType, Student, Matiere, ClasseMatiere, Note, Presence } from '../types';
import { API_BASE_URL } from '../config';
import { getAuthHeaders } from '../services/apiHelpers';

interface YearArchive {
    students: Student[];
    matieres: Matiere[];
    classeMatieres: ClasseMatiere[];
    notes: Note[];
    presences: Presence[];
}

export const Bulletins: React.FC = () => {
    const {
        currentPeriode, setCurrentPeriode, students: activeStudents, matieres: activeMatieres,
        classeMatieres: activeClasseMatieres, notes: activeNotes, presences: activePresences,
        academicYears,
        schoolName, schoolLogo, schoolStamp, schoolYear,
        schoolMotto, schoolBp, schoolTelephone, schoolAddress, schoolCurrency,
        countryName, countryMotto, ministereName,
        showStampOnBulletins, showSignatureOnBulletins,
        officialSeal, directorSignature
    } = useStore();

    // Consultation d'une année passée en lecture seule : ne change jamais l'année active
    // de l'école (qui vaut pour tous les comptes).
    const [consultedYear, setConsultedYear] = useState(schoolYear);
    const [archive, setArchive] = useState<YearArchive | null>(null);
    const [archiveLoading, setArchiveLoading] = useState(false);
    const [archiveError, setArchiveError] = useState('');
    const isArchive = !!consultedYear && consultedYear !== schoolYear;

    const [selectedClasse, setSelectedClasse] = useState('');
    const [editableSchoolYear, setEditableSchoolYear] = useState('');
    const [bulletinsCalcules, setBulletinsCalcules] = useState<BulletinEleveResultat[]>([]);
    // Moyennes de périodes antérieures saisies à la main quand l'établissement
    // n'a pas rentré les notes de cette période (ex: Trimestre 1 / Semestre 1).
    // Jamais envoyées au backend : uniquement utilisées pour le calcul en local
    // de la moyenne annuelle cumulée du bulletin en cours.
    const [manualOverrides, setManualOverrides] = useState<Record<string, Partial<Record<PeriodeType, number>>>>({});

    React.useEffect(() => {
        if (!consultedYear && schoolYear) setConsultedYear(schoolYear);
    }, [consultedYear, schoolYear]);

    React.useEffect(() => {
        setSelectedClasse('');
        setBulletinsCalcules([]);
        setManualOverrides({});
        setEditableSchoolYear(consultedYear || schoolYear);
        setArchiveError('');
        if (!consultedYear || consultedYear === schoolYear) {
            setArchive(null);
            return;
        }
        let cancelled = false;
        setArchiveLoading(true);
        fetch(`${API_BASE_URL}/sync/archive?year=${encodeURIComponent(consultedYear)}`, { headers: getAuthHeaders() })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
                if (!cancelled) setArchive(data);
            })
            .catch((err: Error) => {
                if (!cancelled) {
                    setArchive(null);
                    setArchiveError(`Impossible de charger l'année ${consultedYear} : ${err.message === 'Failed to fetch' ? 'serveur injoignable, vérifiez la connexion' : err.message}.`);
                }
            })
            .finally(() => { if (!cancelled) setArchiveLoading(false); });
        return () => { cancelled = true; };
    }, [consultedYear, schoolYear]);

    const students = isArchive ? (archive?.students || []) : activeStudents;
    const matieres = isArchive ? (archive?.matieres || []) : activeMatieres;
    const classeMatieres = isArchive ? (archive?.classeMatieres || []) : activeClasseMatieres;
    const notes = isArchive ? (archive?.notes || []) : activeNotes;
    const presences = isArchive ? (archive?.presences || []) : activePresences;

    const yearOptions = Array.from(new Set([schoolYear, ...academicYears.map(y => y.name)].filter(Boolean))).sort().reverse();

    const classesList = Array.from(new Set(students.map(s => s.classe))).sort();

    const elevesDeLaClasse = selectedClasse ? students.filter(s => s.classe === selectedClasse) : [];
    const periodesAnterieures = selectedClasse ? getPeriodesAntérieures(currentPeriode) : [];
    const periodesSansNotes = periodesAnterieures.filter(p =>
        !notes.some(n => n.periode === p && elevesDeLaClasse.some(e => e.id === n.eleveId))
    );

    const updateManualOverride = (eleveId: string, periode: PeriodeType, rawValue: string) => {
        setManualOverrides(prev => {
            const next = { ...prev };
            const forEleve = { ...(next[eleveId] || {}) };
            if (rawValue === '') {
                delete forEleve[periode];
            } else {
                const num = parseFloat(rawValue);
                if (!isNaN(num)) forEleve[periode] = num;
            }
            next[eleveId] = forEleve;
            return next;
        });
    };

    // Dérivé directement du cycle de la classe (jamais via un élève trouvé) —
    // garantit qu'une seule famille de périodes (Trimestre XOR Semestre) est
    // jamais proposée, même pour une classe sans élève encore inscrit.
    const availablePeriods: PeriodeType[] = selectedClasse ? getAvailablePeriods(selectedClasse) : ['TRIMESTRE 1', 'TRIMESTRE 2', 'TRIMESTRE 3'];

    React.useEffect(() => {
        if (selectedClasse) {
            const allowed = getAvailablePeriods(selectedClasse);
            if (!allowed.includes(currentPeriode)) {
                setCurrentPeriode(allowed[0]);
            }
        }
    }, [selectedClasse, currentPeriode, setCurrentPeriode]);

    // Component ref for printing
    const printRef = useRef<HTMLDivElement>(null);

    // Fonction d'impression
    const handlePrintAll = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Bulletins_${selectedClasse}_${currentPeriode.replace(/ /g, '_')}`,
        pageStyle: `
          @page { size: A4 portrait; margin: 0; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page-break { page-break-after: always; break-after: page; }
          }
        `
    });

    const validerCalcul = () => {
        if (!selectedClasse) return;
        const resultats = calculerBulletinsClasse(
            selectedClasse,
            currentPeriode,
            students,
            matieres,
            classeMatieres,
            notes,
            presences,
            manualOverrides
        );
        setBulletinsCalcules(resultats);
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-500 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl">
                        <FileSpreadsheet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Générateur de Bulletins (Modèle Officiel DRE)</h2>
                        <p className="text-amber-100">Calcul automatique des moyennes, rangs et génération PDF.</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-semibold opacity-80 uppercase tracking-widest">{currentPeriode}</p>
                </div>
            </div>

            {isArchive && (
                <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-900">
                    <Archive className="w-5 h-5 mt-0.5 shrink-0" />
                    <p className="text-sm font-semibold">
                        Consultation de l'année <b>{consultedYear}</b> en lecture seule. L'année active de l'école reste <b>{schoolYear}</b> pour tous les utilisateurs.
                        {archiveLoading && ' Chargement des données…'}
                        {!archiveLoading && archive && ` ${archive.students.length} élèves, ${archive.notes.length} notes.`}
                    </p>
                </div>
            )}
            {archiveError && (
                <p className="text-sm font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">{archiveError}</p>
            )}

            {/* Outils de génération */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[160px]">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Année consultée</label>
                    <div className="relative">
                        <select
                            value={consultedYear}
                            onChange={(e) => setConsultedYear(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
                        >
                            {yearOptions.map(y => (
                                <option key={y} value={y}>{y}{y === schoolYear ? ' (active)' : ''}</option>
                            ))}
                        </select>
                        {archiveLoading && <Loader2 className="w-4 h-4 animate-spin absolute right-8 top-3.5 text-gray-400" />}
                    </div>
                </div>

                <div className="flex-1 min-w-[180px]">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Classe</label>
                    <select
                        value={selectedClasse}
                        onChange={(e) => setSelectedClasse(e.target.value)}
                        disabled={archiveLoading}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold disabled:opacity-50"
                    >
                        <option value="">Sélectionner une classe...</option>
                        {classesList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* Sélecteur de Période Académique */}
                <div className="flex-1 min-w-[180px]">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Période Académique</label>
                    <select
                        value={currentPeriode}
                        onChange={(e) => setCurrentPeriode(e.target.value as PeriodeType)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold text-gray-800"
                    >
                        {availablePeriods.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>

                {/* Saisie personnalisée de l'année scolaire */}
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Année Scolaire</label>
                    <input
                        type="text"
                        value={editableSchoolYear}
                        onChange={(e) => setEditableSchoolYear(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold text-gray-800"
                        placeholder="Ex: 2025-2026"
                    />
                </div>

                <button
                    onClick={validerCalcul}
                    disabled={!selectedClasse}
                    className="bg-gray-800 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-900 shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                    <ShieldCheck className="w-5 h-5" />
                    Calculer
                </button>
                <button
                    onClick={handlePrintAll}
                    disabled={bulletinsCalcules.length === 0}
                    className="bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-700 shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                    <Printer className="w-5 h-5" />
                    Imprimer (Lot PDF)
                </button>
            </div>

            {/* Saisie manuelle des moyennes de périodes sans notes (ex: T1 non renseigné) */}
            {selectedClasse && periodesSansNotes.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-1">Moyennes manuelles — périodes sans notes</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Aucune note n'est enregistrée pour {periodesSansNotes.join(' et ')} dans cette classe.
                        Saisissez ici la moyenne de chaque élève pour {periodesSansNotes.length > 1 ? 'ces périodes' : 'cette période'} :
                        ces valeurs ne sont utilisées que pour le calcul de la moyenne annuelle affichée sur ce bulletin et ne sont jamais enregistrées.
                    </p>
                    {periodesSansNotes.map(p => (
                        <div key={p} className="mb-6 last:mb-0">
                            <p className="font-bold text-sm text-amber-700 mb-2 uppercase tracking-wide">Moyenne — {p}</p>
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 border-b border-gray-200">
                                    <span className="flex-1 text-[11px] font-black text-gray-500 uppercase tracking-wider">Élève</span>
                                    <span className="w-24 text-[11px] font-black text-gray-500 uppercase tracking-wider text-right">Moyenne /20</span>
                                </div>
                                {elevesDeLaClasse.map((e, idx) => (
                                    <div
                                        key={e.id}
                                        className={`flex items-center gap-3 px-4 py-2.5 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                    >
                                        <span className="flex-1 text-sm font-bold text-gray-900">{e.nom} {e.prenom}</span>
                                        <input
                                            type="number"
                                            min={0}
                                            max={20}
                                            step={0.01}
                                            value={manualOverrides[e.id]?.[p] ?? ''}
                                            onChange={(ev) => updateManualOverride(e.id, p, ev.target.value)}
                                            className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-right font-bold text-gray-900 focus:ring-2 focus:ring-amber-500"
                                            placeholder="—"
                                        />
                                    </div>
                                ))}
                                {elevesDeLaClasse.length === 0 && (
                                    <div className="px-4 py-6 text-center text-sm text-gray-400 font-semibold">Aucun élève dans cette classe.</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Aperçu des Résultats (Liste) */}
            {bulletinsCalcules.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold flex items-center gap-2">
                            <Users className="w-5 h-5 text-gray-500" />
                            Aperçu des résultats ({bulletinsCalcules.length} élèves)
                        </h3>
                        <div className="text-sm flex gap-4">
                            <span>Moy. Max : <b className="text-emerald-600">{bulletinsCalcules[0].moyenneMax.toFixed(2)}</b></span>
                            <span>Moy. Cl. : <b className="text-blue-600">{bulletinsCalcules[0].moyenneClasse.toFixed(2)}</b></span>
                        </div>
                    </div>
                    <div className="p-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
                        {bulletinsCalcules.map((b) => (
                            <div key={b.eleve.id} className="border border-gray-200 rounded-xl p-4 shadow-sm relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-2 h-full bg-amber-500"></div>
                                <h4 className="font-bold text-gray-900 group-hover:text-amber-600 transition">{b.eleve.nom} {b.eleve.prenom}</h4>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                    <div className="bg-gray-50 p-2 rounded">
                                        <p className="text-gray-500 text-xs uppercase">Moy. Gen.</p>
                                        <p className={`font-black text-lg ${b.moyenneGenerale >= 10 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {b.moyenneGenerale.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded">
                                        <p className="text-gray-500 text-xs uppercase">Rang</p>
                                        <p className="font-black text-lg text-blue-600 flex items-center gap-1">
                                            <Award className="w-4 h-4" /> {b.rangGeneral}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* DIV INVISIBLE CONTENANT TOUS BULLETINS POUR IMPRESSION */}
            <div className="hidden">
                <div ref={printRef} className="print-container">
                    {bulletinsCalcules.map((b) => (
                        <div key={b.eleve.id} className="page-break w-[210mm] h-[297mm] overflow-hidden bg-white mx-auto box-border" style={{ pageBreakAfter: 'always' }}>
                             <BulletinTogoPDF
                                data={b}
                                schoolName={schoolName}
                                schoolLogo={schoolLogo}
                                officialSeal={officialSeal}
                                schoolStamp={schoolStamp}
                                directorSignature={directorSignature}
                                showStampOnBulletins={showStampOnBulletins}
                                showSignatureOnBulletins={showSignatureOnBulletins}
                                schoolYear={editableSchoolYear}
                                studentPhoto={b.eleve.photoUrl || null}
                                schoolMotto={schoolMotto}
                                schoolBp={schoolBp}
                                schoolTelephone={schoolTelephone}
                                schoolAddress={schoolAddress}
                                schoolCurrency={schoolCurrency}
                                countryName={countryName}
                                countryMotto={countryMotto}
                                ministereName={ministereName}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Message de bienvenue */}
            {bulletinsCalcules.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                    <FileSpreadsheet className="w-16 h-16 text-gray-200 mb-4" />
                    <p className="text-gray-500 font-semibold text-lg text-center max-w-sm">
                        Sélectionnez une classe puis calculez pour prévisualiser et imprimer les bulletins.
                    </p>
                </div>
            )}
        </div>
    );
};
