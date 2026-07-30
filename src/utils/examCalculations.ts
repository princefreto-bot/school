import { Student, ClasseMatiere, Matiere } from '../types';
import { ExamNote } from '../services/examApi';

export interface ExamMatiereLigne {
    matiere: Matiere;
    coef: number;
    note: number | null;
}

export interface ExamEleveResultat {
    eleve: Student;
    lignes: ExamMatiereLigne[];
    totalCoefs: number;
    totalPoints: number;
    moyenne: number;
    rang: string;
    effectifClasse: number;
    moyenneClasse: number;
}

const formatRang = (rank: number): string => (rank === 1 ? '1er' : `${rank}ème`);

/**
 * Classement d'une session d'examen pour UNE classe (une section), jamais fusionné
 * entre sections d'un même niveau (ex: Tle A4 et Tle D restent classées séparément).
 */
export const calculerClassementExamen = (
    classe: string,
    students: Student[],
    matieres: Matiere[],
    classeMatieres: ClasseMatiere[],
    examNotes: ExamNote[]
): ExamEleveResultat[] => {
    const elevesDeLaClasse = students.filter(s => s.classe === classe);
    const configsMatiere = classeMatieres.filter(cm => cm.classe === classe);

    const resultatsBruts: ExamEleveResultat[] = elevesDeLaClasse.map(eleve => {
        let totalCoefs = 0;
        let totalPoints = 0;

        const lignes: ExamMatiereLigne[] = configsMatiere
            .map(cm => {
                const mat = matieres.find(m => m.id === cm.matiereId);
                if (!mat) return null;

                const n = examNotes.find(x => x.eleve_id === eleve.id && x.matiere_id === cm.matiereId);
                const note = n?.note ?? null;

                if (note !== null) {
                    totalCoefs += cm.coefficient;
                    totalPoints += note * cm.coefficient;
                }

                return { matiere: mat, coef: cm.coefficient, note };
            })
            .filter((l): l is ExamMatiereLigne => l !== null);

        const moyenne = totalCoefs > 0 ? totalPoints / totalCoefs : 0;

        return {
            eleve,
            lignes,
            totalCoefs,
            totalPoints: parseFloat(totalPoints.toFixed(2)),
            moyenne: parseFloat(moyenne.toFixed(2)),
            rang: '',
            effectifClasse: elevesDeLaClasse.length,
            moyenneClasse: 0
        };
    });

    const sorted = [...resultatsBruts].sort((a, b) => b.moyenne - a.moyenne);
    const moyennes = sorted.map(r => r.moyenne);
    const moyenneClasse = moyennes.length > 0 ? moyennes.reduce((a, b) => a + b, 0) / moyennes.length : 0;

    sorted.forEach((r, index) => {
        r.rang = formatRang(index + 1);
        r.moyenneClasse = parseFloat(moyenneClasse.toFixed(2));
    });

    return sorted;
};
