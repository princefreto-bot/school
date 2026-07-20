// ============================================================
// ACADEMIC REPORT GENERATOR — Rapport de Réussite Académique
// ============================================================
// @ts-ignore
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
import { Student, Note, Matiere, ClasseMatiere, PeriodeType } from '../types';
import { calculerBulletinsClasse } from './bulletinCalculations';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useStore } from '../store/useStore';

export interface ClassAcademicStats {
    classe: string;
    cycle: string;
    effectif: number;
    periods: Record<string, {
        successCount: number;
        successRate: number;
        failureCount: number;
        failureRate: number;
        average: number;
    }>;
    annual: {
        successCount: number;
        successRate: number;
        failureCount: number;
        failureRate: number;
        average: number;
    };
}

/**
 * Calcule les statistiques académiques pour le Collège et le Lycée (exclut le Primaire).
 */
export const computeAcademicStats = (
    students: Student[],
    matieres: Matiere[],
    classeMatieres: ClasseMatiere[],
    notes: Note[]
): ClassAcademicStats[] => {
    // Exclure les élèves du primaire
    const nonPrimaryStudents = students.filter(s => s.classe && s.classe.toUpperCase() !== 'CM2' && s.classe.toUpperCase() !== 'CM1' && s.classe.toUpperCase() !== 'CE2' && s.classe.toUpperCase() !== 'CE1' && s.classe.toUpperCase() !== 'CP2' && s.classe.toUpperCase() !== 'CP1' && s.classe.toUpperCase() !== 'CI' && s.classe.toUpperCase() !== 'CI 1' && s.classe.toUpperCase() !== 'CI 2');
    
    // Identifier les classes uniques
    const classes = Array.from(new Set(nonPrimaryStudents.map(s => s.classe))).sort();
    
    // Liste des classes collège et lycée configurées
    const academicClasses = classes.filter(classe => {
        const classStudents = students.filter(s => s.classe === classe);
        const cycle = classStudents[0]?.cycle || 'Primaire';
        return cycle === 'Collège' || cycle === 'Lycée';
    });

    return academicClasses.map(classe => {
        const classStudents = students.filter(s => s.classe === classe);
        const cycle = classStudents[0]?.cycle || 'Primaire';
        const effectif = classStudents.length;

        // Périodes à vérifier selon le cycle
        const periodsToCheck: PeriodeType[] = cycle === 'Lycée' 
            ? ['SEMESTRE 1', 'SEMESTRE 2']
            : ['TRIMESTRE 1', 'TRIMESTRE 2', 'TRIMESTRE 3'];

        const periodStats: Record<string, { 
            successCount: number; 
            successRate: number; 
            failureCount: number; 
            failureRate: number; 
            average: number; 
        }> = {};
        const studentPeriodAverages: Record<string, Record<string, number>> = {};

        // Initialiser l'historique des moyennes par élève
        classStudents.forEach(s => {
            studentPeriodAverages[s.id] = {};
        });

        periodsToCheck.forEach(period => {
            const classNotes = notes.filter(n => 
                n.periode === period && 
                classStudents.some(s => s.id === n.eleveId)
            );

            if (classNotes.length === 0) {
                periodStats[period] = { successCount: 0, successRate: 0, failureCount: 0, failureRate: 0, average: 0 };
                return;
            }

            const bulletins = calculerBulletinsClasse(
                classe,
                period,
                students,
                matieres,
                classeMatieres,
                notes,
                [] // Pas besoin de présences pour calculer les moyennes académiques
            );

            const activeBulletins = bulletins.filter(b => b.totalCoefsGeneral > 0);
            const totalActive = activeBulletins.length;
            
            const successCount = activeBulletins.filter(b => b.moyenneGenerale >= 10).length;
            const successRate = totalActive > 0 ? (successCount / totalActive) * 100 : 0;
            const failureCount = totalActive - successCount;
            const failureRate = totalActive > 0 ? (failureCount / totalActive) * 100 : 0;
            const average = totalActive > 0 ? activeBulletins.reduce((sum, b) => sum + b.moyenneGenerale, 0) / totalActive : 0;

            activeBulletins.forEach(b => {
                studentPeriodAverages[b.eleve.id][period] = b.moyenneGenerale;
            });

            periodStats[period] = {
                successCount,
                successRate: parseFloat(successRate.toFixed(2)),
                failureCount,
                failureRate: parseFloat(failureRate.toFixed(2)),
                average: parseFloat(average.toFixed(2))
            };
        });

        // Calculer les statistiques annuelles
        let annualSuccessCount = 0;
        let annualTotalActive = 0;
        let annualSum = 0;

        classStudents.forEach(s => {
            const avgs = Object.values(studentPeriodAverages[s.id]);
            if (avgs.length > 0) {
                const annualAvg = avgs.reduce((sum, val) => sum + val, 0) / avgs.length;
                annualTotalActive++;
                annualSum += annualAvg;
                if (annualAvg >= 10) {
                    annualSuccessCount++;
                }
            }
        });

        const annualSuccessRate = annualTotalActive > 0 ? (annualSuccessCount / annualTotalActive) * 100 : 0;
        const annualFailureCount = annualTotalActive - annualSuccessCount;
        const annualFailureRate = annualTotalActive > 0 ? (annualFailureCount / annualTotalActive) * 100 : 0;
        const annualAverage = annualTotalActive > 0 ? annualSum / annualTotalActive : 0;

        return {
            classe,
            cycle,
            effectif,
            periods: periodStats,
            annual: {
                successCount: annualSuccessCount,
                successRate: parseFloat(annualSuccessRate.toFixed(2)),
                failureCount: annualFailureCount,
                failureRate: parseFloat(annualFailureRate.toFixed(2)),
                average: parseFloat(annualAverage.toFixed(2))
            }
        };
    });
};

export interface SubjectAcademicStats {
    matiereId: string;
    matiereName: string;
    cycle: string;
    periods: Record<string, {
        successCount: number;
        successRate: number;
        failureCount: number;
        failureRate: number;
        average: number;
        effectif: number;
    }>;
    annual: {
        successCount: number;
        successRate: number;
        failureCount: number;
        failureRate: number;
        average: number;
        effectif: number;
    };
}

/**
 * Calcule le taux de réussite PAR MATIÈRE (et non par classe) pour le Collège
 * et le Lycée. Réutilise calculerBulletinsClasse (déjà appelé pour le calcul
 * par classe) pour obtenir la moyenne de chaque élève dans chaque matière,
 * puis regroupe par matière au lieu de par classe. Le calcul annuel moyenne
 * d'abord les moyennes de périodes de CHAQUE élève dans la matière, puis
 * vérifie le seuil de 10/20 — même logique que le cumul annuel par classe,
 * pour rester cohérent (pas une simple moyenne de toutes les notes de période
 * mises bout à bout, qui favoriserait les matières avec plus de périodes
 * renseignées).
 */
export const computeSubjectAcademicStats = (
    students: Student[],
    matieres: Matiere[],
    classeMatieres: ClasseMatiere[],
    notes: Note[]
): SubjectAcademicStats[] => {
    const academicClasses = Array.from(new Set(students.map(s => s.classe)))
        .filter(classe => {
            const cycle = students.find(s => s.classe === classe)?.cycle;
            return cycle === 'Collège' || cycle === 'Lycée';
        });

    const result: SubjectAcademicStats[] = [];

    (['Collège', 'Lycée'] as const).forEach(cycle => {
        const cycleClasses = academicClasses.filter(classe => students.find(s => s.classe === classe)?.cycle === cycle);
        if (cycleClasses.length === 0) return;

        const periodsToCheck: PeriodeType[] = cycle === 'Lycée'
            ? ['SEMESTRE 1', 'SEMESTRE 2']
            : ['TRIMESTRE 1', 'TRIMESTRE 2', 'TRIMESTRE 3'];

        // matiereId -> nom + { period -> { studentId -> moyenneMatiere } }
        const bySubject: Record<string, { name: string; perPeriod: Record<string, Record<string, number>> }> = {};

        periodsToCheck.forEach(period => {
            cycleClasses.forEach(classe => {
                const classStudents = students.filter(s => s.classe === classe);
                const hasNotes = notes.some(n => n.periode === period && classStudents.some(s => s.id === n.eleveId));
                if (!hasNotes) return;

                const bulletins = calculerBulletinsClasse(classe, period, students, matieres, classeMatieres, notes, []);
                bulletins.forEach(b => {
                    b.categories.forEach(cat => {
                        cat.lignes.forEach(ligne => {
                            if (ligne.moyenneMatiere === null) return;
                            const mid = ligne.matiere.id;
                            if (!bySubject[mid]) bySubject[mid] = { name: ligne.matiere.nom, perPeriod: {} };
                            if (!bySubject[mid].perPeriod[period]) bySubject[mid].perPeriod[period] = {};
                            bySubject[mid].perPeriod[period][b.eleve.id] = ligne.moyenneMatiere;
                        });
                    });
                });
            });
        });

        Object.entries(bySubject).forEach(([matiereId, data]) => {
            const periodStats: SubjectAcademicStats['periods'] = {};
            const studentPeriodAverages: Record<string, number[]> = {};

            periodsToCheck.forEach(period => {
                const studentValues = data.perPeriod[period] || {};
                const values = Object.values(studentValues);
                const effectif = values.length;
                const successCount = values.filter(v => v >= 10).length;
                const failureCount = effectif - successCount;

                Object.entries(studentValues).forEach(([studentId, val]) => {
                    if (!studentPeriodAverages[studentId]) studentPeriodAverages[studentId] = [];
                    studentPeriodAverages[studentId].push(val);
                });

                periodStats[period] = {
                    successCount,
                    successRate: effectif > 0 ? parseFloat(((successCount / effectif) * 100).toFixed(2)) : 0,
                    failureCount,
                    failureRate: effectif > 0 ? parseFloat(((failureCount / effectif) * 100).toFixed(2)) : 0,
                    average: effectif > 0 ? parseFloat((values.reduce((a, b) => a + b, 0) / effectif).toFixed(2)) : 0,
                    effectif
                };
            });

            let annualSuccessCount = 0;
            let annualSum = 0;
            const annualEffectif = Object.keys(studentPeriodAverages).length;

            Object.values(studentPeriodAverages).forEach(vals => {
                const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                annualSum += avg;
                if (avg >= 10) annualSuccessCount++;
            });

            const annualFailureCount = annualEffectif - annualSuccessCount;

            result.push({
                matiereId,
                matiereName: data.name,
                cycle,
                periods: periodStats,
                annual: {
                    successCount: annualSuccessCount,
                    successRate: annualEffectif > 0 ? parseFloat(((annualSuccessCount / annualEffectif) * 100).toFixed(2)) : 0,
                    failureCount: annualFailureCount,
                    failureRate: annualEffectif > 0 ? parseFloat(((annualFailureCount / annualEffectif) * 100).toFixed(2)) : 0,
                    average: annualEffectif > 0 ? parseFloat((annualSum / annualEffectif).toFixed(2)) : 0,
                    effectif: annualEffectif
                }
            });
        });
    });

    return result.sort((a, b) => a.matiereName.localeCompare(b.matiereName));
};

export interface PerformanceAlert {
    studentId: string;
    studentName: string;
    classe: string;
    cycle: string;
    previousPeriod: string;
    previousAverage: number;
    currentPeriod: string;
    currentAverage: number;
    delta: number; // négatif = baisse
    crossedToFailing: boolean;
}

/**
 * Détecte les élèves dont la moyenne générale a chuté entre les deux dernières
 * périodes AYANT des notes saisies (pas forcément T1→T2 : si seuls T2 et T3 ont
 * des notes, la comparaison se fait entre ces deux-là). Un élève est signalé si
 * sa moyenne baisse d'au moins `threshold` points, OU s'il passe d'admis (≥10)
 * à recalé (<10) même avec une baisse plus faible. Trié du plus sévère au
 * moins sévère.
 */
export const computePerformanceDeclineAlerts = (
    students: Student[],
    matieres: Matiere[],
    classeMatieres: ClasseMatiere[],
    notes: Note[],
    threshold: number = 2
): PerformanceAlert[] => {
    const alerts: PerformanceAlert[] = [];

    const academicClasses = Array.from(new Set(students.map(s => s.classe)))
        .filter(classe => {
            const cycle = students.find(s => s.classe === classe)?.cycle;
            return cycle === 'Collège' || cycle === 'Lycée';
        });

    academicClasses.forEach(classe => {
        const classStudents = students.filter(s => s.classe === classe);
        const cycle = classStudents[0]?.cycle as string;
        const periodsToCheck: PeriodeType[] = cycle === 'Lycée'
            ? ['SEMESTRE 1', 'SEMESTRE 2']
            : ['TRIMESTRE 1', 'TRIMESTRE 2', 'TRIMESTRE 3'];

        const periodsWithData = periodsToCheck.filter(period =>
            notes.some(n => n.periode === period && classStudents.some(s => s.id === n.eleveId))
        );
        if (periodsWithData.length < 2) return;

        const prevPeriod = periodsWithData[periodsWithData.length - 2];
        const currPeriod = periodsWithData[periodsWithData.length - 1];

        const prevBulletins = calculerBulletinsClasse(classe, prevPeriod, students, matieres, classeMatieres, notes, []);
        const currBulletins = calculerBulletinsClasse(classe, currPeriod, students, matieres, classeMatieres, notes, []);

        const prevByStudent = new Map(
            prevBulletins.filter(b => b.totalCoefsGeneral > 0).map(b => [b.eleve.id, b.moyenneGenerale])
        );

        currBulletins
            .filter(b => b.totalCoefsGeneral > 0)
            .forEach(b => {
                const prevAvg = prevByStudent.get(b.eleve.id);
                if (prevAvg === undefined) return;

                const currAvg = b.moyenneGenerale;
                const delta = currAvg - prevAvg;
                const crossedToFailing = prevAvg >= 10 && currAvg < 10;

                if (delta <= -threshold || crossedToFailing) {
                    alerts.push({
                        studentId: b.eleve.id,
                        studentName: `${b.eleve.nom} ${b.eleve.prenom}`,
                        classe,
                        cycle,
                        previousPeriod: prevPeriod,
                        previousAverage: parseFloat(prevAvg.toFixed(2)),
                        currentPeriod: currPeriod,
                        currentAverage: parseFloat(currAvg.toFixed(2)),
                        delta: parseFloat(delta.toFixed(2)),
                        crossedToFailing
                    });
                }
            });
    });

    return alerts.sort((a, b) => a.delta - b.delta);
};

/**
 * Génère le PDF en Noir et Blanc épuré.
 */
export const generateAcademicReportPDF = (
    students: Student[],
    matieres: Matiere[],
    classeMatieres: ClasseMatiere[],
    notes: Note[],
    schoolInfo: { name: string, logo: string | null, stamp: string | null }
): void => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    const margin = 20;

    const stats = computeAcademicStats(students, matieres, classeMatieres, notes);

    const now = new Date();
    const formattedDate = format(now, 'dd.MM.yyyy HH:mm');
    const state = useStore.getState();
    const schoolYear = state.schoolYear;
    const schoolMotto = state.schoolMotto || 'Travail-Rigueur-Succès';
    const schoolBp = state.schoolBp || '80159';
    const schoolTelephone = state.schoolTelephone || '+228 90 17 79 66 / 99 41 40 47';
    const schoolAddress = state.schoolAddress || 'Apéssito - TOGO';
    const countryName = state.countryName || 'RÉPUBLIQUE TOGOLAISE';
    const countryMotto = state.countryMotto || 'Travail - Liberté - Patrie';
    const ministereName = state.ministereName || 'MINISTERE DE L\'EDUCATION NATIONALE';

    // --- EN-TÊTE OFFICIEL (STYLE DRE SATURÉ NOIR & BLANC) ---
    let y = 15;
    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'bold');

    // Sceau (gauche)
    if (schoolInfo.stamp) {
        try {
            doc.addImage(schoolInfo.stamp, 'PNG', margin - 10, y, 18, 18);
        } catch(e) {}
    }

    const centerX = w / 2;

    // Bloc Ministère (Centre-Gauche)
    doc.setFontSize(9);
    doc.text(countryName.toUpperCase(), centerX - 35, y, { align: 'center' });
    doc.setFont('times', 'italic');
    doc.setFontSize(8);
    doc.text(countryMotto, centerX - 35, y + 4, { align: 'center' });
    doc.setLineWidth(0.3);
    doc.line(centerX - 42, y + 6, centerX - 28, y + 6);
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(ministereName.toUpperCase(), centerX - 35, y + 11, { align: 'center' });
    doc.setFontSize(8.5);
    doc.text('DIRECTION RÉGIONALE DE L\'ÉDUCATION', centerX - 35, y + 15, { align: 'center' });
    doc.text('INSPECTION DE L\'ENSEIGNEMENT GENERAL', centerX - 35, y + 19, { align: 'center' });

    // Bloc Établissement (Centre-Droite)
    doc.setFontSize(9);
    doc.setFont('times', 'bold');
    doc.text(schoolInfo.name.toUpperCase(), centerX + 35, y, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('times', 'italic');
    doc.text(schoolMotto, centerX + 35, y + 6, { align: 'center' });
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.text(`Tél: ${schoolTelephone}`, centerX + 35, y + 12, { align: 'center' });
    doc.text(`BP: ${schoolBp} ${schoolAddress}`, centerX + 35, y + 16, { align: 'center' });

    // Logo (droite)
    if (schoolInfo.logo) {
        try {
            doc.addImage(schoolInfo.logo, 'PNG', w - margin - 8, y, 18, 18);
        } catch(e) {}
    }

    y = y + 28;

    // Ligne de séparation
    doc.setLineWidth(0.8);
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, y, w - margin, y);
    
    y += 10;
    doc.setFontSize(18);
    doc.setFont('times', 'bold');
    doc.text('RAPPORT ACADÉMIQUE GLOBAL', w / 2, y, { align: 'center' });
    
    y += 7;
    doc.setFontSize(12);
    doc.text(`SESSION ACADÉMIQUE : ${schoolYear}`, w / 2, y, { align: 'center' });
    
    y += 6;
    doc.setFontSize(9);
    doc.setFont('times', 'normal');
    doc.text(`Généré le : ${formattedDate}`, w / 2, y, { align: 'center' });

    y += 6;
    doc.setLineWidth(0.2);
    doc.line(margin, y, w - margin, y);

    y += 12;

    // --- 1. RÉSULTATS DU COLLÈGE (TRIMESTRIELS & ANNUELS) ---
    const collegeStats = stats.filter(s => s.cycle === 'Collège');
    if (collegeStats.length > 0) {
        doc.setFontSize(12);
        doc.setFont('times', 'bold');
        doc.text('1. SITUATION ACADÉMIQUE — COLLÈGE', margin, y);
        
        y += 6;
        
        const collegeRows = collegeStats.map(c => [
            c.classe.toUpperCase(),
            c.effectif.toString(),
            c.periods['TRIMESTRE 1'] 
                ? `Réu: ${c.periods['TRIMESTRE 1'].successCount} (${c.periods['TRIMESTRE 1'].successRate}%)\nÉch: ${c.periods['TRIMESTRE 1'].failureCount} (${c.periods['TRIMESTRE 1'].failureRate}%)`
                : 'Réu: 0 (0%)\nÉch: 0 (0%)',
            c.periods['TRIMESTRE 2'] 
                ? `Réu: ${c.periods['TRIMESTRE 2'].successCount} (${c.periods['TRIMESTRE 2'].successRate}%)\nÉch: ${c.periods['TRIMESTRE 2'].failureCount} (${c.periods['TRIMESTRE 2'].failureRate}%)`
                : 'Réu: 0 (0%)\nÉch: 0 (0%)',
            c.periods['TRIMESTRE 3'] 
                ? `Réu: ${c.periods['TRIMESTRE 3'].successCount} (${c.periods['TRIMESTRE 3'].successRate}%)\nÉch: ${c.periods['TRIMESTRE 3'].failureCount} (${c.periods['TRIMESTRE 3'].failureRate}%)`
                : 'Réu: 0 (0%)\nÉch: 0 (0%)',
            `Réu: ${c.annual.successCount} (${c.annual.successRate}%)\nÉch: ${c.annual.failureCount} (${c.annual.failureRate}%)`
        ]);

        autoTable(doc, {
            startY: y,
            head: [['CLASSE', 'EFFECTIF', 'TRIMESTRE 1', 'TRIMESTRE 2', 'TRIMESTRE 3', 'RÉSULTAT ANNUEL']],
            body: collegeRows,
            theme: 'plain',
            styles: { 
                fontSize: 8, 
                cellPadding: 3, 
                font: 'times',
                textColor: [0, 0, 0],
                lineColor: [0, 0, 0],
                lineWidth: 0.1
            },
            headStyles: { 
                fontStyle: 'bold', 
                fillColor: [0, 0, 0], 
                textColor: [255, 255, 255] 
            },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: margin, right: margin }
        });

        y = (doc as any).lastAutoTable.finalY + 12;
    }

    // --- 2. RÉSULTATS DU LYCÉE (SEMESTRIELS & ANNUELS) ---
    const lyceeStats = stats.filter(s => s.cycle === 'Lycée');
    if (lyceeStats.length > 0) {
        if (y > h - 60) {
            doc.addPage();
            y = 20;
        }

        doc.setFontSize(12);
        doc.setFont('times', 'bold');
        doc.text('2. SITUATION ACADÉMIQUE — LYCÉE', margin, y);
        
        y += 6;

        const lyceeRows = lyceeStats.map(c => [
            c.classe.toUpperCase(),
            c.effectif.toString(),
            c.periods['SEMESTRE 1'] 
                ? `Réu: ${c.periods['SEMESTRE 1'].successCount} (${c.periods['SEMESTRE 1'].successRate}%)\nÉch: ${c.periods['SEMESTRE 1'].failureCount} (${c.periods['SEMESTRE 1'].failureRate}%)`
                : 'Réu: 0 (0%)\nÉch: 0 (0%)',
            (c.periods['SEMESTRE 2'] || c.periods['SEMERE 2']) 
                ? `Réu: ${(c.periods['SEMESTRE 2'] || c.periods['SEMERE 2']).successCount} (${(c.periods['SEMESTRE 2'] || c.periods['SEMERE 2']).successRate}%)\nÉch: ${(c.periods['SEMESTRE 2'] || c.periods['SEMERE 2']).failureCount} (${(c.periods['SEMESTRE 2'] || c.periods['SEMERE 2']).failureRate}%)`
                : 'Réu: 0 (0%)\nÉch: 0 (0%)',
            `Réu: ${c.annual.successCount} (${c.annual.successRate}%)\nÉch: ${c.annual.failureCount} (${c.annual.failureRate}%)`
        ]);

        autoTable(doc, {
            startY: y,
            head: [['CLASSE', 'EFFECTIF', 'SEMESTRE 1', 'SEMESTRE 2', 'RÉSULTAT ANNUEL']],
            body: lyceeRows,
            theme: 'plain',
            styles: { 
                fontSize: 8, 
                cellPadding: 3, 
                font: 'times',
                textColor: [0, 0, 0],
                lineColor: [0, 0, 0],
                lineWidth: 0.1
            },
            headStyles: { 
                fontStyle: 'bold', 
                fillColor: [0, 0, 0], 
                textColor: [255, 255, 255] 
            },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: margin, right: margin }
        });

        y = (doc as any).lastAutoTable.finalY + 12;
    }

    // --- 3. DÉCISIONS & VALIDATIONS (STYLE OFFICIEL ÉPURÉ) ---
    if (y > h - 50) {
        doc.addPage();
        y = 20;
    }

    doc.setFontSize(11);
    doc.setFont('times', 'bold');
    doc.text('OBSERVATIONS ET CONSEIL DES PROFESSEURS', margin, y);

    y += 6;
    doc.setFont('times', 'normal');
    doc.setLineWidth(0.1);
    doc.setDrawColor(180, 180, 180);
    // Draw 3 signature/notes lines
    for (let i = 0; i < 4; i++) {
        doc.line(margin, y + (i * 7), w - margin, y + (i * 7));
    }

    y += 35;

    // --- SIGNATURES ---
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('LE DIRECTEUR DES ÉTUDES', margin + 30, y, { align: 'center' });
    doc.text('LA DIRECTION GÉNÉRALE', w - margin - 30, y, { align: 'center' });
    
    doc.setLineWidth(0.2);
    doc.setDrawColor(0, 0, 0);
    doc.line(margin + 5, y + 2, margin + 55, y + 2);
    doc.line(w - margin - 55, y + 2, w - margin - 5, y + 2);

    // --- FOOTER ---
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('times', 'italic');
        doc.line(margin, h - 12, w - margin, h - 12);
        doc.text(`${schoolInfo.name.toUpperCase()} - RAPPORT DE RÉUSSITE ACADÉMIQUE - SESSION ${schoolYear} - Page ${i} sur ${totalPages}`, w / 2, h - 8, { align: 'center' });
    }

    const fileName = `Rapport_Academique_${schoolYear.replace('/', '_')}.pdf`;
    doc.save(fileName);
};
