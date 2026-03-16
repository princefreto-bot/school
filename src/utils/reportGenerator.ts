// ============================================================
// REPORT GENERATOR — Rapport Financier Mensuel "Ultra Pro"
// ============================================================
// @ts-ignore
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
import { Student } from '../types';
import { ClassFinanceRow, computeMonthlyEvolution, computeRecouvrement } from '../services/analyticsService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = {
    primary: [15, 23, 42],     // slate-900
    accent: [37, 99, 235],      // blue-600
    success: [22, 163, 74],     // emerald-600
    danger: [225, 29, 72],      // rose-600
    muted: [100, 116, 139],     // slate-500
    border: [226, 232, 240],    // slate-200
    bg: [248, 250, 252],        // slate-50
};

const fmtPrice = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' F';

export const generateRapportMensuelPDF = (
    students: Student[],
    classComp: ClassFinanceRow[],
    schoolInfo: { name: string, logo: string | null }
): void => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    const margin = 15;

    // -- Data compute
    const now = new Date();
    const currentMonthName = format(now, 'MMMM yyyy', { locale: fr });
    const recou = computeRecouvrement(students);
    const evolution = computeMonthlyEvolution(students);
    const topClasses = [...classComp].sort((a, b) => b.taux - a.taux).slice(0, 5);

    // --- HELPER WRAPPERS ---
    const setPrimary = () => doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    const setMuted = () => doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    const setAccent = () => doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);

    // --- 0. BRANDING & HEADER ---
    let y = 15;

    // Logo if exists
    if (schoolInfo.logo) {
        try {
            doc.addImage(schoolInfo.logo, 'PNG', margin, y, 20, 20);
        } catch (e) {
            console.error("Erreur logo PDF", e);
        }
    }

    // Title & Info
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    setPrimary();
    doc.text('RAPPORT FINANCIER', w - margin, y + 5, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    setMuted();
    doc.text(schoolInfo.name.toUpperCase(), w - margin, y + 10, { align: 'right' });
    doc.text(`ÉDITION DU ${format(now, 'dd/MM/yyyy').toUpperCase()}`, w - margin, y + 15, { align: 'right' });

    y = 40;
    doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
    doc.setLineWidth(0.2);
    doc.line(margin, y, w - margin, y);

    y += 15;

    // --- 1. INDICATEURS CLÉS (CARDS) ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    setPrimary();
    doc.text('RÉSUMÉ DES OPÉRATIONS', margin, y);
    
    y += 5;
    const cardW = (w - (margin * 2) - 10) / 3;
    const cardH = 25;

    // Card 1: Attendu
    doc.setFillColor(COLORS.bg[0], COLORS.bg[1], COLORS.bg[2]);
    doc.roundedRect(margin, y, cardW, cardH, 3, 3, 'F');
    doc.setFontSize(8);
    setMuted();
    doc.text('REVENUS ATTENDUS', margin + 5, y + 8);
    doc.setFontSize(12);
    setPrimary();
    doc.text(fmtPrice(recou.totalTheorique), margin + 5, y + 18);

    // Card 2: Encaissé
    doc.roundedRect(margin + cardW + 5, y, cardW, cardH, 3, 3, 'F');
    doc.setFontSize(8);
    setMuted();
    doc.text('TOTAL ENCAISSÉ', margin + cardW + 10, y + 8);
    doc.setFontSize(12);
    doc.setTextColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
    doc.text(fmtPrice(recou.totalEncaisse), margin + cardW + 10, y + 18);

    // Card 3: Restant
    doc.roundedRect(margin + (cardW * 2) + 10, y, cardW, cardH, 3, 3, 'F');
    doc.setFontSize(8);
    setMuted();
    doc.text('RESTE À RECOUVRER', margin + (cardW * 2) + 15, y + 8);
    doc.setFontSize(12);
    doc.setTextColor(COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]);
    doc.text(fmtPrice(recou.totalRestant), margin + (cardW * 2) + 15, y + 18);

    y += cardH + 15;

    // --- 2. PROGRESS BAR & TAUX ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    setPrimary();
    doc.text('TAUX DE RECOUVREMENT GLOBAL', margin, y);
    
    doc.setFontSize(14);
    setAccent();
    doc.text(`${recou.taux}%`, w - margin, y, { align: 'right' });

    y += 4;
    doc.setFillColor(COLORS.bg[0], COLORS.bg[1], COLORS.bg[2]);
    doc.roundedRect(margin, y, w - (margin * 2), 4, 2, 2, 'F');
    
    const progressW = (doc.internal.pageSize.getWidth() - (margin * 2)) * (recou.taux / 100);
    doc.setFillColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
    doc.roundedRect(margin, y, progressW, 4, 1.5, 1.5, 'F');

    y += 15;

    // --- 3. GRAPHIQUE D'ÉVOLUTION (BAR CHART MINIMAL) ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    setPrimary();
    doc.text(`ÉVOLUTION MENSUELLE DES FLUX`, margin, y);

    y += 8;
    const chartW = w - (margin * 2);
    const chartH = 40;
    const barSpacing = chartW / 12;
    const barW = barSpacing * 0.6;
    
    // Find max value for scaling
    const maxVal = Math.max(...evolution.map(m => m.montant), 1000000);

    doc.setLineWidth(0.1);
    doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
    doc.line(margin, y + chartH, margin + chartW, y + chartH); // Base line

    evolution.forEach((m, i) => {
        const barH = (m.montant / maxVal) * chartH;
        const xPos = margin + (i * barSpacing);
        
        // Draw Bar
        doc.setFillColor(COLORS.bg[0], COLORS.bg[1], COLORS.bg[2]);
        doc.rect(xPos, y, barW, chartH, 'F');
        
        if (barH > 0) {
            doc.setFillColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
            doc.rect(xPos, y + chartH - barH, barW, barH, 'F');
        }

        // Month label
        doc.setFontSize(6);
        setMuted();
        doc.text(m.mois, xPos + (barW / 2), y + chartH + 3, { align: 'center' });
    });

    y += chartH + 15;

    // --- 4. TOP PERFORMERS ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    setPrimary();
    doc.text('CLASSES LES PLUS SOLVABLES (TOP 5)', margin, y);

    y += 5;
    autoTable(doc, {
        startY: y,
        head: [['RANG', 'CLASSE', 'CYCLE', 'EFFECTIF', 'RECOUVREMENT', 'RESTE']],
        body: topClasses.map((c, i) => [
            `#${i + 1}`, c.classe.toUpperCase(), c.cycle, c.effectif, `${c.taux}%`, fmtPrice(c.totalRestant)
        ]),
        styles: { fontSize: 8, cellPadding: 4, font: 'helvetica' },
        headStyles: { fillColor: COLORS.primary, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [252, 253, 255] },
        margin: { left: margin, right: margin },
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    // --- 5. CONCLUSION ---
    if (y > h - 60) {
        doc.addPage();
        y = 30;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    setPrimary();
    doc.text('CONCLUSION & OBSERVATIONS', margin, y);

    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    setMuted();
    const conclusion = `Le taux de recouvrement de ${recou.taux}% est jugé ${recou.badgeLabel.toLowerCase()}. ` + 
        `Un montant total de ${fmtPrice(recou.totalRestant)} reste à percevoir. ` + 
        `Nous recommandons de prioriser les rappels pour les classes à faible taux afin d'assurer la trésorerie de l'établissement.`;
    
    doc.text(doc.splitTextToSize(conclusion, w - (margin * 2)), margin, y);

    // --- SIGNATURES ---
    y = h - 50;
    doc.setLineWidth(0.5);
    doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    setPrimary();
    
    doc.text('LE COMPTABLE', margin + 20, y, { align: 'center' });
    doc.text('LE DIRECTEUR', w - margin - 20, y, { align: 'center' });
    
    doc.setLineWidth(0.1);
    doc.line(margin + 5, y + 2, margin + 35, y + 2);
    doc.line(w - margin - 35, y + 2, w - margin - 5, y + 2);

    // --- FOOTER ---
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        setMuted();
        doc.text(`Rapport Financier Mensuel - ${currentMonthName} - Page ${i}/${totalPages}`, w / 2, h - 8, { align: 'center' });
    }

    doc.save(`Rapport_Financier_${currentMonthName.replace(' ', '_')}.pdf`);
};
