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
        average: number;
    }>;
    annual: {
        successCount: number;
        successRate: number;
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

        const periodStats: Record<string, { successCount: number; successRate: number; average: number }> = {};
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
                periodStats[period] = { successCount: 0, successRate: 0, average: 0 };
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
            const average = totalActive > 0 ? activeBulletins.reduce((sum, b) => sum + b.moyenneGenerale, 0) / totalActive : 0;

            activeBulletins.forEach(b => {
                studentPeriodAverages[b.eleve.id][period] = b.moyenneGenerale;
            });

            periodStats[period] = {
                successCount,
                successRate: parseFloat(successRate.toFixed(2)),
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
        const annualAverage = annualTotalActive > 0 ? annualSum / annualTotalActive : 0;

        return {
            classe,
            cycle,
            effectif,
            periods: periodStats,
            annual: {
                successCount: annualSuccessCount,
                successRate: parseFloat(annualSuccessRate.toFixed(2)),
                average: parseFloat(annualAverage.toFixed(2))
            }
        };
    });
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
            c.periods['TRIMESTRE 1'] ? `${c.periods['TRIMESTRE 1'].successCount} (${c.periods['TRIMESTRE 1'].successRate}%)` : '0 (0%)',
            c.periods['TRIMESTRE 2'] ? `${c.periods['TRIMESTRE 2'].successCount} (${c.periods['TRIMESTRE 2'].successRate}%)` : '0 (0%)',
            c.periods['TRIMESTRE 3'] ? `${c.periods['TRIMESTRE 3'].successCount} (${c.periods['TRIMESTRE 3'].successRate}%)` : '0 (0%)',
            `${c.annual.successCount} (${c.annual.successRate}%)`
        ]);

        autoTable(doc, {
            startY: y,
            head: [['CLASSE', 'EFFECTIF', 'TRIMESTRE 1', 'TRIMESTRE 2', 'TRIMESTRE 3', 'RÉSULTAT ANNUEL']],
            body: collegeRows,
            theme: 'plain',
            styles: { 
                fontSize: 9, 
                cellPadding: 4, 
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
            c.periods['SEMESTRE 1'] ? `${c.periods['SEMESTRE 1'].successCount} (${c.periods['SEMESTRE 1'].successRate}%)` : '0 (0%)',
            c.periods['SEMERE 2'] || c.periods['SEMESTRE 2'] ? `${(c.periods['SEMESTRE 2'] || c.periods['SEMESTRE 2']).successCount} (${(c.periods['SEMESTRE 2'] || c.periods['SEMESTRE 2']).successRate}%)` : '0 (0%)',
            `${c.annual.successCount} (${c.annual.successRate}%)`
        ]);

        autoTable(doc, {
            startY: y,
            head: [['CLASSE', 'EFFECTIF', 'SEMESTRE 1', 'SEMESTRE 2', 'RÉSULTAT ANNUEL']],
            body: lyceeRows,
            theme: 'plain',
            styles: { 
                fontSize: 9, 
                cellPadding: 4, 
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
