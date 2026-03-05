// ============================================================
// REPORT GENERATOR — Rapport Intelligent Mensuel
// ============================================================
// @ts-ignore
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
import { Student } from '../types';
import { ClassFinanceRow, computeMonthlyEvolution, computeRecouvrement } from '../services/analyticsService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const fmtMoney = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

export const generateRapportMensuelPDF = (
    students: Student[],
    classComp: ClassFinanceRow[]
): void => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const w = doc.internal.pageSize.getWidth();

    // -- Données du rapport
    const currentMonthName = format(new Date(), 'MMMM yyyy', { locale: fr });
    const currentMonthIndex = new Date().getMonth();

    const recou = computeRecouvrement(students);
    const evolution = computeMonthlyEvolution(students);

    const currentMonthData = evolution[currentMonthIndex]?.montant || 0;
    const prevMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
    const prevMonthData = evolution[prevMonthIndex]?.montant || 0;

    const diffMontant = currentMonthData - prevMonthData;
    const diffPercent = prevMonthData > 0 ? (diffMontant / prevMonthData) * 100 : 100;
    const isUp = diffMontant >= 0;

    // Top 3 classes
    const topClasses = [...classComp].sort((a, b) => b.taux - a.taux).slice(0, 3);

    // Classes à risque
    const riskClasses = classComp.filter(c => c.taux < 60).sort((a, b) => a.taux - b.taux);

    // Urgence
    const nonSoldes = students.filter(s => s.status !== 'Soldé');
    const urgenceCount = nonSoldes.length;
    const urgenceMontant = nonSoldes.reduce((a, s) => a + s.restant, 0);

    // --- HEADER OFFICIEL ---
    let y = 0;
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, w, 6, 'F');
    doc.setFillColor(37, 99, 235); // blue-600
    doc.rect(0, 6, w, 2, 'F');

    y = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('RAPPORT FINANCIER MENSUEL', w / 2, y, { align: 'center' });

    y += 6;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Mois : ${currentMonthName.toUpperCase()}`, w / 2, y, { align: 'center' });

    y += 10;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, y, w - 14, y);

    y += 10;

    // --- 1. RESUME FINANCIER ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('1. RÉSUMÉ FINANCIER GLOBAL', 14, y);

    y += 6;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, w - 28, 22, 2, 2, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Total Attendu', 20, y + 8);
    doc.text('Total Encaissé', 70, y + 8);
    doc.text('Total Restant', 120, y + 8);
    doc.text('Taux Recouvrement', 170, y + 8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(fmtMoney(recou.totalTheorique), 20, y + 16);
    doc.setTextColor(22, 163, 74); // green
    doc.text(fmtMoney(recou.totalEncaisse), 70, y + 16);
    doc.setTextColor(220, 38, 38); // red
    doc.text(fmtMoney(recou.totalRestant), 120, y + 16);

    doc.setTextColor(37, 99, 235); // blue
    doc.text(`${recou.taux}%`, 170, y + 16);

    y += 30;

    // --- 2. EVOLUTION MENSUELLE ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('2. ÉVOLUTION MENSUELLE (RECETTES)', 14, y);

    y += 6;
    doc.setFillColor(isUp ? 240 : 254, isUp ? 253 : 242, isUp ? 244 : 242);
    doc.setDrawColor(isUp ? 187 : 254, isUp ? 247 : 205, isUp ? 208 : 211);
    doc.roundedRect(14, y, w - 28, 16, 2, 2, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isUp ? 21 : 153, isUp ? 128 : 27, isUp ? 61 : 27);
    const evolutionText = `Mois actuel : ${fmtMoney(currentMonthData)}  |  Mois précédent : ${fmtMoney(prevMonthData)}`;
    const diffText = `Différence : ${isUp ? '+' : ''}${fmtMoney(diffMontant)} (${isUp ? '+' : ''}${diffPercent.toFixed(1)}%)`;

    doc.text(evolutionText, 20, y + 7);
    doc.text(diffText, 20, y + 12);

    y += 24;

    // --- 3. TOP 3 CLASSES ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('3. TOP 3 DES CLASSES PERFORMANTES', 14, y);

    y += 6;
    if (topClasses.length > 0) {
        autoTable(doc, {
            startY: y,
            head: [['Postion', 'Classe', 'Cycle', 'Taux de paiement', 'Restant']],
            body: topClasses.map((c, i) => [
                `#${i + 1}`, c.classe, c.cycle, `${c.taux}%`, fmtMoney(c.totalRestant)
            ]),
            styles: { fontSize: 9, font: 'helvetica' },
            headStyles: { fillColor: [22, 163, 74] },
            margin: { left: 14, right: 14 }
        });
        y = (doc as any).lastAutoTable.finalY + 10;
    } else {
        y += 10;
    }

    // --- 4. CLASSES A RISQUE ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('4. CLASSES À RISQUE (< 60% RECOUVREMENT)', 14, y);
    y += 6;

    if (riskClasses.length > 0) {
        autoTable(doc, {
            startY: y,
            head: [['Classe', 'Cycle', 'Taux de paiement', 'Montant à recouvrer']],
            body: riskClasses.map(c => [
                c.classe, c.cycle, `${c.taux}%`, fmtMoney(c.totalRestant)
            ]),
            styles: { fontSize: 9, font: 'helvetica' },
            headStyles: { fillColor: [220, 38, 38] },
            margin: { left: 14, right: 14 }
        });
        y = (doc as any).lastAutoTable.finalY + 10;
    } else {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(22, 163, 74);
        doc.text("✓ Aucune classe à risque détectée.", 14, y);
        y += 12;
    }

    // --- 5. URGENCE & RECOUVREMENT ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('5. MONTANT GLOBAL À RECOUVRER EN URGENCE', 14, y);
    y += 6;

    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 205, 211);
    doc.roundedRect(14, y, w - 28, 16, 2, 2, 'FD');

    doc.setFontSize(10);
    doc.setTextColor(153, 27, 27);
    doc.text(`Total en retard : ${fmtMoney(urgenceMontant)}`, 20, y + 7);
    doc.text(`Élèves concernés : ${urgenceCount} élève(s)`, 20, y + 13);

    y += 35;

    // --- SIGNATURES ---
    if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = 20;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);

    doc.text('Le Comptable', 40, y);
    doc.text('Le Directeur', w - 40, y, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('(Signature et cachet)', 40, y + 20);
    doc.text('(Signature et cachet)', w - 40, y + 20, { align: 'right' });

    // --- FOOTER ---
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy')} - Page ${i}/${pages}`, w / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`Rapport_Mensuel_${currentMonthName.replace(' ', '_')}.pdf`);
};
