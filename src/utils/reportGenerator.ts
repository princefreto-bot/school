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
    primary: [0, 0, 0],         // Pure black
    secondary: [60, 60, 60],    // Dark gray
    muted: [100, 100, 100],     // Gray
    border: [0, 0, 0],          // Solid black borders
    bg: [255, 255, 255],        // White background
};

const fmtPrice = (n: number) => {
    return new Intl.NumberFormat('fr-FR').format(n).replace(/\s/g, '.') + ' FCFA';
};

export const generateRapportMensuelPDF = (
    students: Student[],
    classComp: ClassFinanceRow[],
    schoolInfo: { name: string, logo: string | null }
): void => {
    // Force standard WinAnsiEncoding by avoiding weird non-breaking spaces or rare characters
    const cleanText = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, (m) => {
        // Optionnel: On peut garder les accents si jspdf les gère, 
        // mais pour être "Ultra Safe" contre les &&&, on peut normaliser.
        // Ici on va tenter de garder le texte propre.
        return m; 
    });

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    const margin = 20; // Plus grande marge pour le côté pro

    // -- Data compute
    const now = new Date();
    const currentMonthName = format(now, 'MMMM yyyy', { locale: fr });
    const recou = computeRecouvrement(students);
    const evolution = computeMonthlyEvolution(students);
    // Afficher TOUTES les classes pour plus de transparence (les "écritures")
    const allClassStats = [...classComp].sort((a, b) => a.classe.localeCompare(b.classe));

    // --- HELPER WRAPPERS ---
    const setPrimary = () => doc.setTextColor(0, 0, 0);
    const setSecondary = () => doc.setTextColor(60, 60, 60);

    // --- 0. BRANDING & HEADER ---
    let y = 15;

    // Logo if exists
    if (schoolInfo.logo) {
        try {
            doc.addImage(schoolInfo.logo, 'PNG', margin, y, 25, 25);
        } catch (e) {
            console.error("Erreur logo PDF", e);
        }
    }

    // Header Right
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    setPrimary();
    doc.text('BILAN FINANCIER', w - margin, y + 10, { align: 'right' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(schoolInfo.name.toUpperCase(), w - margin, y + 18, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    setSecondary();
    doc.text(`Période : ${currentMonthName.toUpperCase()}`, w - margin, y + 24, { align: 'right' });
    doc.text(`Généré le : ${format(now, 'dd.MM.yyyy HH:mm')}`, w - margin, y + 29, { align: 'right' });

    y = 50;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(margin, y, w - margin, y);

    y += 15;

    // --- 1. RÉSUMÉ STRATÉGIQUE (Tableau simple plutôt que cartes pour le côté pro) ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    setPrimary();
    doc.text('1. RÉSUMÉ DE LA SITUATION', margin, y);
    
    y += 8;
    autoTable(doc, {
        startY: y,
        head: [['INDICATEUR', 'VALEUR']],
        body: [
            ['REVENUS THÉORIQUES ATTENDUS', fmtPrice(recou.totalTheorique)],
            ['TOTAL DES ENCAISSEMENTS RÉELS', fmtPrice(recou.totalEncaisse)],
            ['SOLDE RESTANT À RECOUVRER', fmtPrice(recou.totalRestant)],
            ['TAUX DE RECOUVREMENT GLOBAL', `${new Intl.NumberFormat('fr-FR').format(recou.taux)}%`],
        ],
        theme: 'plain',
        styles: { 
            fontSize: 11, 
            cellPadding: 5, 
            font: 'helvetica',
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: 0.1
        },
        headStyles: { 
            fontStyle: 'bold', 
            fillColor: [0, 0, 0], 
            textColor: [255, 255, 255] 
        },
        columnStyles: {
            1: { halign: 'right', fontStyle: 'bold', fontSize: 13 }
        },
        margin: { left: margin, right: margin },
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    // --- 2. DÉTAILS DES ÉCRITURES PAR CLASSE ---
    if (y > h - 40) { doc.addPage(); y = 20; }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    setPrimary();
    doc.text('2. ÉTAT FINANCIER PAR CLASSE', margin, y);

    y += 8;
    autoTable(doc, {
        startY: y,
        head: [['CLASSE', 'EFFECTIF', 'ATTENDU', 'ENCAISSÉ', 'RESTE', 'TAUX']],
        body: allClassStats.map(c => [
            c.classe.toUpperCase(),
            c.effectif,
            fmtPrice(c.totalTheorique),
            fmtPrice(c.totalEncaisse),
            fmtPrice(c.totalRestant),
            `${new Intl.NumberFormat('fr-FR').format(c.taux)}%`
        ]),
        styles: { 
            fontSize: 10, 
            cellPadding: 4, 
            font: 'helvetica',
            lineColor: [0, 0, 0],
            lineWidth: 0.1
        },
        headStyles: { 
            fillColor: [0, 0, 0], 
            textColor: [255, 255, 255], 
            fontStyle: 'bold' 
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: margin, right: margin },
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    // --- 3. ÉVOLUTION MENSUELLE ---
    if (y > h - 60) { doc.addPage(); y = 20; }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    setPrimary();
    doc.text('3. FLUX MENSUELS ENCAISSÉS', margin, y);

    y += 8;
    const chartW = w - (margin * 2);
    const chartH = 30;
    const barSpacing = chartW / 12;
    const barW = barSpacing * 0.7;
    const maxVal = Math.max(...evolution.map(m => m.montant), 1);

    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, y + chartH, margin + chartW, y + chartH);

    evolution.forEach((m, i) => {
        const barH = (m.montant / maxVal) * chartH;
        const xPos = margin + (i * barSpacing);
        
        if (barH > 0) {
            doc.setFillColor(0, 0, 0); // Black bars
            doc.rect(xPos, y + chartH - barH, barW, barH, 'F');
        }

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(m.mois, xPos + (barW / 2), y + chartH + 5, { align: 'center' });
    });

    y += chartH + 20;

    // --- 4. CONCLUSION ---
    if (y > h - 50) { doc.addPage(); y = 20; }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    setPrimary();
    doc.text('OBSERVATIONS ET VALIDATION', margin, y);

    y += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const conclusion = `Le présent rapport certifie qu'au ${format(now, 'dd.MM.yyyy')}, le taux de recouvrement global est de ${new Intl.NumberFormat('fr-FR').format(recou.taux)}%. ` + 
        `Un montant total de ${fmtPrice(recou.totalRestant)} reste à percevoir pour clôturer l'exercice.`;
    
    doc.text(doc.splitTextToSize(conclusion, w - (margin * 2)), margin, y);

    // --- SIGNATURES ---
    y = h - 60;
    doc.setLineWidth(1);
    doc.setDrawColor(0, 0, 0);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    
    doc.text('LE COMPTABLE', margin + 30, y, { align: 'center' });
    doc.text('LA DIRECTION GÉNÉRALE', w - margin - 30, y, { align: 'center' });
    
    doc.setLineWidth(0.2);
    doc.line(margin + 5, y + 2, margin + 55, y + 2);
    doc.line(w - margin - 55, y + 2, w - margin - 5, y + 2);

    // --- FOOTER ---
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.line(margin, h - 15, w - margin, h - 15);
        doc.text(`${schoolInfo.name.toUpperCase()} - BILAN FINANCIER - Page ${i} sur ${totalPages}`, w / 2, h - 10, { align: 'center' });
    }

    const fileName = `Bilan_Financier_${currentMonthName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(' ', '_')}.pdf`;
    doc.save(fileName);
};

