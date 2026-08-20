import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { BulletinTogoPDF } from '../components/pdf/BulletinTogoPDF';
import { calculerBulletinsClasse, BulletinEleveResultat, getPeriodesAntérieures } from '../utils/bulletinCalculations';
import { getAvailablePeriods } from '../data/classConfig';
import { useReactToPrint } from 'react-to-print';
import { FileSpreadsheet, Printer, Users, Award, ShieldCheck } from 'lucide-react';
import { PeriodeType } from '../types';

export const Bulletins: React.FC = () => {
    const { 
        currentPeriode, setCurrentPeriode, students, matieres, classeMatieres, notes,
        schoolName, schoolLogo, schoolStamp, schoolYear,
        schoolMotto, schoolBp, schoolTelephone, schoolAddress, schoolCurrency,
        countryName, countryMotto, ministereName,
        showStampOnBulletins, showSignatureOnBulletins,
        officialSeal, directorSignature
    } = useStore();

    const classesList = Array.from(new Set(students.map(s => s.classe))).sort();
    const [selectedClasse, setSelectedClasse] = useState('');
    const [editableSchoolYear, setEditableSchoolYear] = useState('');
    const [bulletinsCalcules, setBulletinsCalcules] = useState<BulletinEleveResultat[]>([]);
    // Moyennes de périodes antérieures saisies à la main quand l'établissement
    // n'a pas rentré les notes de cette période (ex: Trimestre 1 / Semestre 1).
    // Jamais envoyées au backend : uniquement utilisées pour le calcul en local
    // de la moyenne annuelle cumulée du bulletin en cours.
    const [manualOverrides, setManualOverrides] = useState<Record<string, Partial<Record<PeriodeType, number>>>>({});

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

    React.useEffect(() => {
        if (schoolYear) {
            setEditableSchoolYear(schoolYear);
        }
    }, [schoolYear]);

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
            useStore.getState().presences,
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

            {/* Outils de génération */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[180px]">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Classe</label>
                    <select
                        value={selectedClasse}
                        onChange={(e) => setSelectedClasse(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
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
                        <div key={p} className="mb-4 last:mb-0">
                            <p className="font-semibold text-sm text-gray-700 mb-2">{p}</p>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {elevesDeLaClasse.map(e => (
                                    <div key={e.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                                        <span className="flex-1 text-sm truncate">{e.nom} {e.prenom}</span>
                                        <input
                                            type="number"
                                            min={0}
                                            max={20}
                                            step={0.01}
                                            value={manualOverrides[e.id]?.[p] ?? ''}
                                            onChange={(ev) => updateManualOverride(e.id, p, ev.target.value)}
                                            className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-right focus:ring-2 focus:ring-amber-500"
                                            placeholder="/20"
                                        />
                                    </div>
                                ))}
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
