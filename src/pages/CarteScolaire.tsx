// ============================================================
// CARTE SCOLAIRE — Génération PDF + affichage écran
// QR Code haute résolution, format ISO 85×54mm, 8 cartes/A4
// ============================================================
import React, { useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import QRCodeLib from 'qrcode'; // import statique — fiable dans le navigateur
import {
    CreditCard, Search, Download, Printer, X, Filter,
    CheckCircle, Loader2, ChevronDown, AlertCircle
} from 'lucide-react';

// ============================================================
// COMPOSANT CARTE — Affichage écran
// QR Canvas rendu en haute résolution puis réduit via CSS
// ============================================================
interface CarteProps {
    nom: string;
    prenom: string;
    classe: string;
    id: string;
    telephone: string;
    schoolName: string;
    schoolYear: string;
    schoolLogo: string | null;
    photoUrl?: string | null;
}

const CarteEleve: React.FC<CarteProps> = ({
    nom, prenom, classe, id, telephone, schoolName, schoolYear, schoolLogo, photoUrl,
}) => {
    const nomComplet = `${prenom} ${nom}`.toUpperCase();

    return (
        // Carte 321×204 px = proportions exactes 85×54mm
        <div style={{
            width: 321, height: 204, flexShrink: 0, position: 'relative', overflow: 'hidden',
            borderRadius: 14,
            background: '#FFFFFF',
            fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            boxShadow: '0 10px 30px rgba(10, 46, 115, 0.15)',
            border: '0.5px solid rgba(10, 46, 115, 0.1)'
        }}>
            {/* Motif de fond subtil */}
            <div style={{
                position: 'absolute', inset: 0, opacity: 0.03, zIndex: 0,
                backgroundImage: `radial-gradient(#0A2E73 0.5px, transparent 0.5px)`,
                backgroundSize: '10px 10px'
            }} />

            {/* Courbe latérale gauche premium */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: 40, height: '100%',
                background: 'linear-gradient(180deg, #0A2E73 0%, #123D91 100%)',
                clipPath: 'polygon(0 0, 100% 0, 60% 100%, 0 100%)',
                zIndex: 1, borderRight: '1.5px solid #D4AF37'
            }} />

            {/* Bannière supérieure horizontale */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: 42,
                background: 'linear-gradient(90deg, #0A2E73 0%, #123D91 100%)',
                zIndex: 2, display: 'flex', alignItems: 'center', padding: '0 12px',
                borderBottom: '1.5px solid #D4AF37', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                {/* Logo Badge */}
                <div style={{
                    width: 32, height: 32, background: 'white', borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 2, border: '1px solid #D4AF37', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    marginRight: 10
                }}>
                    {schoolLogo ? (
                        <img src={schoolLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                        <CreditCard style={{ width: 16, height: 16, color: '#0A2E73' }} />
                    )}
                </div>
                {/* School Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                        color: 'white', fontSize: 9.5, fontWeight: 900, margin: 0,
                        textTransform: 'uppercase', letterSpacing: 0.8,
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
                    }}>
                        {schoolName}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 7, margin: 0, fontStyle: 'italic', fontWeight: 500 }}>
                        Carte scolaire {schoolYear}
                    </p>
                </div>
            </div>

            {/* Corps de la carte */}
            <div style={{
                position: 'relative', zIndex: 10, height: '100%', display: 'flex',
                padding: '52px 12px 28px 45px', // Top padding for banner, left padding for curve
                gap: 12, alignItems: 'center'
            }}>
                {/* Photo passeport (si dispo) */}
                {photoUrl && (
                    <div style={{
                        width: 62, height: 74, flexShrink: 0,
                        borderRadius: 6, overflow: 'hidden',
                        border: '1.5px solid #0A2E73',
                        boxShadow: '0 4px 12px rgba(10, 46, 115, 0.2)',
                        background: '#F5F7FA'
                    }}>
                        <img src={photoUrl} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                )}

                {/* Infos élève */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                        color: '#0A2E73', margin: 0, marginBottom: 5, fontWeight: 900, fontSize: 13,
                        lineHeight: 1.1, textTransform: 'uppercase', borderBottom: '1px solid #F0F0F0',
                        paddingBottom: 4
                    }}>
                        {nomComplet}
                    </h3>
                    <div style={{ marginBottom: 6 }}>
                        <span style={{
                            background: 'linear-gradient(135deg, #0A2E73 0%, #123D91 100%)',
                            color: 'white', fontSize: 8, fontWeight: 800, padding: '3px 10px',
                            borderRadius: 20, boxShadow: '0 2px 4px rgba(10, 46, 115, 0.2)',
                            display: 'inline-block'
                        }}>
                            {classe}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0A2E73' }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#0A2E73', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: 'white', fontSize: 7 }}>☏</span>
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 700 }}>{telephone}</span>
                    </div>
                </div>

                {/* QR Code Frame */}
                <div style={{
                    width: 78, height: 78, flexShrink: 0,
                    background: 'white', borderRadius: 10, padding: 4,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #0A2E73',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    position: 'relative', overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 2, background: '#D4AF37' }} />
                    <QRCodeCanvas
                        value={id}
                        size={128}
                        level="H"
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                        marginSize={1}
                        style={{ width: 58, height: 58 }}
                    />
                    <p style={{ fontSize: 4.5, color: '#0A2E73', margin: '2px 0 0 0', fontStyle: 'italic', fontWeight: 800 }}>IDENTIFICATION SÉCURISÉE</p>
                </div>
            </div>

            {/* Bannière inférieure fixe */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, width: '100%', height: 20,
                background: '#0A2E73', zIndex: 11, display: 'flex', alignItems: 'center',
                justifyContent: 'center', borderTop: '1px solid #D4AF37'
            }}>
                <p style={{ color: 'white', fontSize: 6, margin: 0, fontStyle: 'italic', opacity: 0.9 }}>
                    Si vous trouvez cette carte, veuillez la retourner à l'administration de l'établissement.
                </p>
            </div>
        </div>
    );
};

// ============================================================
// GÉNÉRATION QR HAUTE RÉSOLUTION POUR PDF
// Via QRCodeLib (import statique, fiable navigateur)
// ============================================================
const buildQRDataURL = async (studentId: string): Promise<string> => {
    // toDataURL retourne directement un data:image/png;base64,...
    // Paramètres optimisés impression :
    //   - errorCorrectionLevel H = 30% de correction
    //   - margin 4 = quiet zone 4 modules (norme ISO 18004)
    //   - width 400px @ 300dpi ≈ 34mm dans le PDF — ultra net
    //   - couleurs : noir absolu sur blanc absolu
    return QRCodeLib.toDataURL(studentId, {
        type: 'image/png',
        width: 400,
        margin: 1, // Marge ISO réduite pour une plus grande zone de scan
        errorCorrectionLevel: 'H',
        color: { dark: '#000000', light: '#ffffff' },
    });
};

// ============================================================
// REDIMENSIONNEMENT LOGO POUR PDF
// ============================================================
const resizeLogoForPDF = (src: string, size: number): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, size, size);
            const ratio = Math.min(size / img.width, size / img.height);
            const w = img.width * ratio;
            const h = img.height * ratio;
            ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
            resolve(canvas.toDataURL('image/png', 1.0));
        };
        img.onerror = () => resolve('');
        img.src = src;
    });
};

// ============================================================
// GÉNÉRATION PDF — 8 cartes par page A4 (2 colonnes × 4 lignes)
// ============================================================
const generateCartesPDF = async (
    students: Array<{ id: string; nom: string; prenom: string; classe: string; telephone: string; photoUrl?: string }>,
    schoolName: string,
    schoolYear: string,
    schoolLogo: string | null,
    onProgress: (n: number) => void,
): Promise<void> => {
    if (!students.length) {
        throw new Error('Aucun élève sélectionné');
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // ── Mise en page ────────────────────────────────────────
    const cardW   = 85;   // mm (ISO 7810 ID-1)
    const cardH   = 54;   // mm (ISO 7810 ID-1)
    const cols    = 2;
    const rowsMax = 4;
    const pageW   = 210;
    const pageH   = 297;
    const gapX    = 6;    // 6mm entre colonnes
    const gapY    = 8;    // 8mm entre lignes
    const marginX = (pageW - cols * cardW - (cols - 1) * gapX) / 2;  // centrage horizontal
    const marginY = (pageH - rowsMax * cardH - (rowsMax - 1) * gapY) / 2; // centrage vertical

    // ── Logo pré-traité ─────────────────────────────────────
    let logoData = '';
    if (schoolLogo && schoolLogo.startsWith('data:image')) {
        // 120px ≈ 10mm à 300dpi — assez grand pour être net
        logoData = await resizeLogoForPDF(schoolLogo, 120);
    }

    const total = students.length;
    let cardIndex = 0;

    for (const student of students) {
        const posOnPage = cardIndex % (cols * rowsMax);
        if (posOnPage === 0 && cardIndex > 0) {
            doc.addPage();
        }

        const col  = posOnPage % cols;
        const row  = Math.floor(posOnPage / cols);
        const x    = marginX + col * (cardW + gapX);
        const y    = marginY + row * (cardH + gapY);

        // ── Fond de la carte (Premium White with geometric pattern) ─────
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, y, cardW, cardH, 3, 3, 'F');
        
        // Bordure fine
        doc.setDrawColor(10, 46, 115);
        doc.setLineWidth(0.05);
        doc.roundedRect(x, y, cardW, cardH, 3, 3, 'S');

        // ── Courbe latérale gauche (Ornement) ─────────────
        doc.setFillColor(10, 46, 115); // Bleu principal
        doc.triangle(x, y, x + 10, y, x, y + cardH, 'F');
        doc.setFillColor(18, 61, 145); // Bleu secondaire
        doc.triangle(x + 10, y, x, y + cardH, x + 5, y + cardH, 'F');
        
        // Ligne dorée ornementale
        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(0.4);
        doc.line(x + 10.2, y, x + 5.2, y + cardH);

        // ── Bannière supérieure horizontale ──────────────
        const bannerH = 11;
        doc.setFillColor(10, 46, 115);
        doc.rect(x, y, cardW, bannerH, 'F');
        
        // Ligne dorée sous bannière
        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(0.35);
        doc.line(x, y + bannerH, x + cardW, y + bannerH);

        // ── Logo Badge ────────────────────────────────────
        const logoMM  = 8.5;
        const logoX   = x + 3;
        const logoY   = y + (bannerH - logoMM) / 2;

        doc.setFillColor(255, 255, 255);
        doc.roundedRect(logoX - 0.5, logoY - 0.5, logoMM + 1, logoMM + 1, 1.5, 1.5, 'F');
        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(0.15);
        doc.roundedRect(logoX - 0.5, logoY - 0.5, logoMM + 1, logoMM + 1, 1.5, 1.5, 'S');

        if (logoData) {
            doc.addImage(logoData, 'PNG', logoX, logoY, logoMM, logoMM);
        } else {
            doc.setFillColor(10, 46, 115);
            doc.roundedRect(logoX, logoY, logoMM, logoMM, 1, 1, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(4);
            doc.setFont('helvetica', 'bold');
            doc.text('CSY', logoX + logoMM / 2, logoY + 5.5, { align: 'center' });
        }

        // ── Titre établissement (Sur bannière) ─────────────
        const txtX      = logoX + logoMM + 3;
        const maxNameW  = cardW - logoMM - 10;
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        const schoolLine = doc.splitTextToSize(schoolName.toUpperCase(), maxNameW)[0];
        doc.text(schoolLine, txtX, y + 5);
        
        doc.setFontSize(4.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(230, 230, 230);
        doc.text(`Carte scolaire ${schoolYear}`, txtX, y + 8.5);

        // ── QR Code Frame ─────────────────────────────────
        const qrMM    = 22;
        const qrX     = x + cardW - qrMM - 3;
        const qrY     = y + bannerH + 5;
        const qrPad   = 1.5;

        // Ombre simulée QR
        doc.setFillColor(0, 0, 0);
        doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
        doc.roundedRect(qrX - qrPad + 0.5, qrY - qrPad + 0.5, qrMM + qrPad * 2, qrMM + qrPad * 2, 2, 2, 'F');
        doc.setGState(new (doc as any).GState({ opacity: 1.0 }));

        // Conteneur blanc
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(qrX - qrPad, qrY - qrPad, qrMM + qrPad * 2, qrMM + qrPad * 2, 2, 2, 'F');
        
        // Bordures cadre QR
        doc.setDrawColor(10, 46, 115);
        doc.setLineWidth(0.2);
        doc.roundedRect(qrX - qrPad, qrY - qrPad, qrMM + qrPad * 2, qrMM + qrPad * 2, 2, 2, 'S');
        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(0.4);
        doc.line(qrX - qrPad, qrY - qrPad, qrX + qrMM + qrPad, qrY - qrPad);

        // Le QR Code
        const qrDataURL = await buildQRDataURL(student.id);
        doc.addImage(qrDataURL, 'PNG', qrX, qrY, qrMM, qrMM, undefined, 'NONE');

        doc.setTextColor(10, 46, 115);
        doc.setFontSize(3.8);
        doc.setFont('helvetica', 'italic');
        doc.text("IDENTIFICATION SÉCURISÉE", qrX + qrMM / 2, qrY + qrMM + 3, { align: 'center' });

        // ── Photo passeport ──────────────────────────────
        const photoOffsetX = 11; // Après l'ornement
        const photoW = student.photoUrl ? 17 : 0;
        const photoH = 21;
        const photoY = y + bannerH + 4;

        if (student.photoUrl && student.photoUrl.startsWith('data:image')) {
            // Cadre photo
            doc.setDrawColor(10, 46, 115);
            doc.setLineWidth(0.3);
            doc.roundedRect(x + photoOffsetX - 0.2, photoY - 0.2, photoW + 0.4, photoH + 0.4, 1, 1, 'S');
            doc.addImage(student.photoUrl, 'JPEG', x + photoOffsetX, photoY, photoW, photoH);
        }

        // ── Infos Élève : Nom ────────────────────────────
        const infoStartX = x + photoOffsetX + photoW + 4;
        const nameMaxW   = cardW - qrMM - photoW - 18;
        const fullName   = `${student.prenom} ${student.nom}`.toUpperCase();
        const nameFontSz = fullName.length > 22 ? 8 : 10;
        
        doc.setTextColor(10, 46, 115);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(nameFontSz);
        const nameLines = doc.splitTextToSize(fullName, nameMaxW);
        nameLines.forEach((line: string, i: number) => {
            doc.text(line, infoStartX, photoY + 5 + i * 4);
        });

        // Ligne souligne nom
        doc.setDrawColor(240, 240, 240);
        doc.setLineWidth(0.2);
        doc.line(infoStartX, photoY + 9, infoStartX + 25, photoY + 9);

        // ── Badge Classe ─────────────────────────────────
        const badgeY = photoY + 13;
        doc.setFillColor(10, 46, 115);
        doc.roundedRect(infoStartX, badgeY, 18, 5, 2.5, 2.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'bold');
        doc.text(student.classe, infoStartX + 9, badgeY + 3.6, { align: 'center' });

        // ── Téléphone ────────────────────────────────────
        doc.setTextColor(10, 46, 115);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.text(`Tél : ${student.telephone}`, infoStartX, badgeY + 9);

        // ── Bannière inférieure ──────────────────────────
        const footerH = 5.5;
        doc.setFillColor(10, 46, 115);
        doc.rect(x, y + cardH - footerH, cardW, footerH, 'F');
        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(0.3);
        doc.line(x, y + cardH - footerH, x + cardW, y + cardH - footerH);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(3.5);
        doc.setFont('helvetica', 'italic');
        const disclaimer = "Si cette carte ne vous appartient pas, veuillez la retourner à l'administration.";
        doc.text(disclaimer, x + cardW / 2, y + cardH - 2, { align: 'center' });

        // Progression
        cardIndex++;
        onProgress(Math.round((cardIndex / total) * 100));
    }

    // ── Pied de page (toutes les pages) ───────────────────
    const nbPages = doc.getNumberOfPages();
    for (let p = 1; p <= nbPages; p++) {
        doc.setPage(p);
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(160, 160, 160);
        doc.text(
            `Cartes scolaires ${schoolYear} — ${schoolName} — Page ${p}/${nbPages}`,
            105, 293, { align: 'center' }
        );
    }

    doc.save(`cartes_scolaires_${schoolYear.replace(/\//g, '-')}.pdf`);
};

// ============================================================
// PAGE PRINCIPALE
// ============================================================
export const CarteScolaire: React.FC = () => {
    const students   = useStore(s => s.students);
    const schoolName = useStore(s => s.schoolName);
    const schoolYear = useStore(s => s.schoolYear);
    const schoolLogo = useStore(s => s.schoolLogo);

    const [search,          setSearch]          = useState('');
    const [selectedClasse,  setSelectedClasse]  = useState('');
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [generating,      setGenerating]      = useState(false);
    const [progress,        setProgress]        = useState(0);
    const [error,           setError]           = useState<string | null>(null);

    const classes = [...new Set(students.map(s => s.classe))].sort();

    const filtered = students.filter(s => {
        const matchSearch  = !search || `${s.prenom} ${s.nom} ${s.id} ${s.classe}`.toLowerCase().includes(search.toLowerCase());
        const matchClasse  = !selectedClasse || s.classe === selectedClasse;
        return matchSearch && matchClasse;
    });

    // ── Lancer la génération PDF ─────────────────────────────
    const startGeneration = useCallback(async (list: typeof students) => {
        if (generating || !list.length) return;
        setGenerating(true);
        setProgress(0);
        setError(null);
        try {
            await generateCartesPDF(list, schoolName, schoolYear, schoolLogo, setProgress);
        } catch (err) {
            console.error('[CarteScolaire] Erreur génération PDF:', err);
            setError(err instanceof Error ? err.message : 'Erreur lors de la génération du PDF');
        } finally {
            setGenerating(false);
        }
    }, [generating, schoolName, schoolYear, schoolLogo]);

    const handleGenerateAll    = () => startGeneration(filtered);
    const handleGenerateClasse = (c: string) => startGeneration(students.filter(s => s.classe === c));
    const handleGenerateOne    = (id: string) => {
        const s = students.find(st => st.id === id);
        if (s) startGeneration([s]);
    };

    // ── Rendu ────────────────────────────────────────────────
    return (
        <div className="max-w-6xl mx-auto space-y-6">

            {/* ── En-tête ─────────────────────────────────── */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Cartes Scolaires</h2>
                        <p className="text-indigo-200 text-sm">
                            Format ISO 85×54 mm · QR Code niveau H · 8 cartes/page A4
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                    {[
                        { v: students.length,               l: 'Total élèves' },
                        { v: classes.length,                l: 'Classes'      },
                        { v: Math.ceil(students.length / 8), l: 'Pages PDF'   },
                    ].map(({ v, l }) => (
                        <div key={l} className="bg-white/10 rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold">{v}</p>
                            <p className="text-xs text-indigo-200">{l}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Filtres + bouton principal ───────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher un élève..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <select
                            value={selectedClasse}
                            onChange={e => setSelectedClasse(e.target.value)}
                            className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white appearance-none focus:ring-2 focus:ring-indigo-500 outline-none sm:w-44"
                        >
                            <option value="">Toutes les classes</option>
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={handleGenerateAll}
                        disabled={generating || filtered.length === 0}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-md"
                    >
                        {generating
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> {progress}%</>
                            : <><Download className="w-4 h-4" /> Générer cartes ({filtered.length})</>
                        }
                    </button>
                </div>

                {/* Barre de progression */}
                {generating && (
                    <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Construction du PDF…</span>
                            <span className="font-bold text-indigo-600">{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 rounded-full transition-all duration-200"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Erreur */}
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}
            </div>

            {/* ── Génération par classe ────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-indigo-500" />
                    Générer par classe
                </h3>
                <div className="flex flex-wrap gap-2">
                    {classes.map(c => {
                        const count = students.filter(s => s.classe === c).length;
                        return (
                            <button
                                key={c}
                                onClick={() => handleGenerateClasse(c)}
                                disabled={generating}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 disabled:opacity-50 text-gray-700 hover:text-indigo-700 rounded-lg text-xs font-medium transition-all"
                            >
                                <Download className="w-3 h-3" />
                                {c}
                                <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">{count}</span>
                            </button>
                        );
                    })}
                </div>
                <p className="text-[11px] text-gray-400 mt-3">
                    Format ISO 7810 · 85×54 mm · QR niveau H (30% correction) · 8 cartes/A4 · PNG sans compression
                </p>
            </div>

            {/* ── Prévisualisation d'une carte ─────────────── */}
            {selectedStudent ? (() => {
                const s = students.find(st => st.id === selectedStudent);
                if (!s) return null;
                return (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-semibold text-gray-800">Prévisualisation</h3>
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                            {/* Carte */}
                            <div>
                                <p className="text-xs text-gray-500 mb-2 font-medium">Aperçu proportionnel 85×54 mm</p>
                                <div style={{ boxShadow:'0 10px 40px rgba(0,0,0,0.2)', borderRadius:12, display:'inline-block' }}>
                                    <CarteEleve
                                        nom={s.nom} prenom={s.prenom} classe={s.classe} id={s.id}
                                        telephone={s.telephone}
                                        schoolName={schoolName} schoolYear={schoolYear} schoolLogo={schoolLogo}
                                        photoUrl={s.photoUrl}
                                    />
                                </div>
                            </div>
                            {/* Actions */}
                            <div className="flex-1 space-y-3 min-w-[200px]">
                                <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 shrink-0" />
                                    QR Code niveau H · Scannable après impression et plastification
                                </div>
                                <button
                                    onClick={() => handleGenerateOne(s.id)}
                                    disabled={generating}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all"
                                >
                                    {generating
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Génération…</>
                                        : <><Printer className="w-4 h-4" /> Générer PDF (carte seule)</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })() : (
                /* Liste des élèves */
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <p className="text-xs text-gray-500 font-medium mb-3">
                        {filtered.length} élève(s) — cliquer pour prévisualiser la carte
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[520px] overflow-y-auto">
                        {filtered.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedStudent(s.id)}
                                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left group"
                            >
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {s.prenom.charAt(0)}{s.nom.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{s.prenom} {s.nom}</p>
                                    <p className="text-xs text-gray-500">{s.classe}</p>
                                </div>
                                <CreditCard className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                            </button>
                        ))}
                        {filtered.length === 0 && (
                            <p className="col-span-3 text-center text-gray-400 text-sm py-10">
                                Aucun élève trouvé
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
