import { Student, ClasseMatiere, Matiere } from '../types';
import { ExamNote, ExamSession } from '../services/examApi';
import { ExamType, getExamenForClasse, isExamClass } from './examEligibility';
import { calculerClassementExamen } from './examCalculations';

export interface ExamTypeStats {
    type: ExamType;
    classes: string[];
    sessionsCount: number;
    effectif: number;
    moyenneGenerale: number;
    successRate: number;
    top5: { nom: string; classe: string; session: string; moyenne: number }[];
}

/**
 * Statistiques agrégées des sessions d'examens par type d'examen national
 * (CEPD/BEPC/BAC 1/BAC 2), calculées sur toutes les classes/sections éligibles.
 */
export const computeExamStats = (
    students: Student[],
    matieres: Matiere[],
    classeMatieres: ClasseMatiere[],
    examNotes: ExamNote[],
    examSessions: ExamSession[]
): ExamTypeStats[] => {
    const examClasses = Array.from(new Set(students.map(s => s.classe))).filter(isExamClass);
    const types: ExamType[] = ['CEPD', 'BEPC', 'BAC 1', 'BAC 2'];

    return types.map(type => {
        const classesForType = examClasses.filter(c => getExamenForClasse(c) === type);
        const allMoyennes: { nom: string; classe: string; session: string; moyenne: number }[] = [];
        const sessionsWithData = new Set<string>();

        classesForType.forEach(classe => {
            examSessions.forEach(session => {
                const notesForSession = examNotes.filter(n => n.exam_session_id === session.id);
                if (notesForSession.length === 0) return;

                const classement = calculerClassementExamen(classe, students, matieres, classeMatieres, notesForSession);
                classement.forEach(r => {
                    if (r.lignes.some(l => l.note !== null)) {
                        sessionsWithData.add(session.id);
                        allMoyennes.push({
                            nom: `${r.eleve.nom} ${r.eleve.prenom}`,
                            classe,
                            session: session.nom,
                            moyenne: r.moyenne
                        });
                    }
                });
            });
        });

        const moyenneGenerale = allMoyennes.length > 0
            ? parseFloat((allMoyennes.reduce((a, b) => a + b.moyenne, 0) / allMoyennes.length).toFixed(2))
            : 0;
        const successRate = allMoyennes.length > 0
            ? parseFloat(((allMoyennes.filter(m => m.moyenne >= 10).length / allMoyennes.length) * 100).toFixed(2))
            : 0;
        const top5 = [...allMoyennes].sort((a, b) => b.moyenne - a.moyenne).slice(0, 5);

        return {
            type,
            classes: classesForType,
            sessionsCount: sessionsWithData.size,
            effectif: students.filter(s => classesForType.includes(s.classe)).length,
            moyenneGenerale,
            successRate,
            top5
        };
    }).filter(s => s.classes.length > 0);
};
