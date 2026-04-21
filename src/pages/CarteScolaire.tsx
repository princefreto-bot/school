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
        // Format ISO 85×54mm (321×204 px)
        <div style={{
            width: 321, height: 204, position: 'relative', overflow: 'hidden',
            borderRadius: 16, background: '#F8FAFC',
            fontFamily: "'Inter', system-ui, sans-serif",
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(255,255,255,0.8)'
        }}>
            {/* 1. Motif de sécurité (Guilloche) */}
            <div style={{
                position: 'absolute', inset: 0, opacity: 0.15, zIndex: 0,
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0c16.568 0 30 13.432 30 30s-13.432 30-30 30S0 46.568 0 30 13.432 0 30 0zm0 5C16.193 5 5 16.193 5 30s11.193 25 25 25 25-11.193 25-25S43.807 5 30 5z' fill='%230f172a' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                backgroundSize: '30px 30px'
            }} />

            {/* 2. Gradient de fond premium */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(241,245,249,0.95) 100%)',
                zIndex: 1
            }} />

            {/* 3. Bande latérale Elite avec or et bleu profond */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: 45, height: '100%',
                background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
                zIndex: 2, borderRight: '2px solid #EAB308'
            }}>
                <div style={{
                    height: '100%', width: '100%', opacity: 0.1,
                    backgroundImage: `repeating-linear-gradient(45deg, #fbbf24 0, #fbbf24 1px, transparent 0, transparent 50%)`,
                    backgroundSize: '10px 10px'
                }} />
            </div>

            {/* 4. En-tête Glassmorphism */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: 48,
                background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)',
                zIndex: 3, display: 'flex', alignItems: 'center', padding: '0 15px',
                borderBottom: '2px solid #EAB308', boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}>
                {/* Logo haute fidélité */}
                <div style={{
                    width: 34, height: 34, background: 'white', borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 3, border: '1.5px solid #EAB308', 
                    boxShadow: '0 0 15px rgba(234, 179, 8, 0.3)', marginRight: 12
                }}>
                    {schoolLogo ? (
                        <img src={schoolLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                        <Award style={{ width: 20, height: 20, color: '#0F172A' }} />
                    )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                        color: 'white', fontSize: 10, fontWeight: 900, margin: 0,
                        textTransform: 'uppercase', letterSpacing: 1.2,
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
                    }}>
                        {schoolName}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <p style={{ color: '#EAB308', fontSize: 7, margin: 0, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Officiel {schoolYear}
                        </p>
                        <div style={{ width: 3, height: 3, background: 'rgba(255,255,255,0.3)', borderRadius: '50%' }} />
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 7, margin: 0, fontWeight: 600 }}>IDENTITÉ SCOLAIRE</p>
                    </div>
                </div>
            </div>

            {/* 5. Contenu principal */}
            <div style={{
                position: 'relative', zIndex: 10, height: '100%', display: 'flex',
                padding: '60px 15px 30px 60px', gap: 15, alignItems: 'center'
            }}>
                {/* Photo de l'élève - Effet Portrait Premium */}
                <div style={{
                    width: 68, height: 82, flexShrink: 0,
                    borderRadius: 12, overflow: 'hidden',
                    border: '2px solid #0F172A',
                    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.25)',
                    background: '#F1F5F9', position: 'relative'
                }}>
                    {photoUrl ? (
                        <img src={photoUrl} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E2E8F0' }}>
                            <span style={{ fontSize: 24, opacity: 0.2 }}>📸</span>
                        </div>
                    )}
                    {/* Sceau de sécurité sur la photo */}
                    <div style={{
                        position: 'absolute', bottom: 4, right: 4, width: 14, height: 14,
                        background: 'rgba(234, 179, 8, 0.8)', borderRadius: '50%',
                        border: '1px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <CheckCircle style={{ width: 8, height: 8, color: 'white' }} />
                    </div>
                </div>

                {/* Détails identité */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 7, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 2, letterSpacing: 1 }}>Nom & Prénoms</p>
                    <h3 style={{
                        color: '#0F172A', margin: 0, marginBottom: 8, fontWeight: 900, fontSize: 14,
                        lineHeight: 1.1, textTransform: 'uppercase', letterSpacing: -0.2
                    }}>
                        {nomComplet}
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div>
                                <p style={{ fontSize: 6, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 1 }}>Classe</p>
                                <span style={{
                                    background: '#0F172A',
                                    color: 'white', fontSize: 9, fontWeight: 900, padding: '2px 10px',
                                    borderRadius: 6, display: 'inline-block', boxShadow: '0 4px 10px rgba(15, 23, 42, 0.2)'
                                }}>
                                    {classe}
                                </span>
                            </div>
                            <div style={{ width: 1, height: 20, background: '#E2E8F0' }} />
                            <div>
                                <p style={{ fontSize: 6, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 1 }}>Contact</p>
                                <span style={{ fontSize: 9, fontWeight: 900, color: '#0F172A' }}>{telephone}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* QR Code - Intégration futuriste */}
                <div style={{
                    width: 76, height: 76, flexShrink: 0,
                    background: 'white', borderRadius: 14, padding: 6,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    border: '1.5px solid #E2E8F0',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                    position: 'relative'
                }}>
                    <QRCodeCanvas
                        value={id}
                        size={120}
                        level="H"
                        bgColor="#FFFFFF"
                        fgColor="#0F172A"
                        marginSize={0}
                        style={{ width: 56, height: 56 }}
                    />
                    {/* Holographic sparkle effect */}
                    <div style={{
                        position: 'absolute', top: 2, right: 2, width: 8, height: 8,
                        background: 'linear-gradient(45deg, #FFD700, #FFF, #C0C0C0)',
                        borderRadius: '50%', opacity: 0.6
                    }} />
                    <p style={{ fontSize: 5, color: '#94A3B8', margin: '4px 0 0 0', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5 }}>Scan Sécurisé</p>
                </div>
            </div>

            {/* 6. Signature / Footer ultra-fin */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, width: '100%', height: 22,
                background: 'linear-gradient(90deg, #0F172A 0%, #1E293B 100%)', zIndex: 11, 
                display: 'flex', alignItems: 'center', px: 20, borderTop: '1.5px solid #EAB308'
            }}>
                <div style={{ width: '100%', textAlign: 'center', opacity: 0.9 }}>
                    <p style={{ color: 'white', fontSize: 6, margin: 0, fontWeight: 600, letterSpacing: 0.2 }}>
                        Propriété exclusive de l'établissement • Document officiel certifié par QR Code
                    </p>
                </div>
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

        // ── Fond de la carte (Elite Neutral) ─────
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, y, cardW, cardH, 4, 4, 'F');
        
        // Bordure fine
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.1);
        doc.roundedRect(x, y, cardW, cardH, 4, 4, 'S');

        // ── Barre latérale gauche Elite ─────────────
        const sideW = 12;
        doc.setFillColor(15, 23, 42); 
        doc.rect(x, y, sideW, cardH, 'F');
        
        // Trim Or
        doc.setDrawColor(234, 179, 8);
        doc.setLineWidth(0.6);
        doc.line(x + sideW, y, x + sideW, y + cardH);

        // ── Bandeau supérieur ──────────────
        const bannerH = 13;
        doc.setFillColor(15, 23, 42);
        doc.rect(x, y, cardW, bannerH, 'F');
        
        // Ligne dorée sous bannière
        doc.setDrawColor(234, 179, 8);
        doc.setLineWidth(0.6);
        doc.line(x, y + bannerH, x + cardW, y + bannerH);

        // ── Logo Frame ────────────────────────────────────
        const logoMM  = 9;
        const logoX   = x + 4;
        const logoY   = y + (bannerH - logoMM) / 2;

        doc.setFillColor(255, 255, 255);
        doc.roundedRect(logoX - 0.5, logoY - 0.5, logoMM + 1, logoMM + 1, 2, 2, 'F');
        doc.setDrawColor(234, 179, 8);
        doc.setLineWidth(0.2);
        doc.roundedRect(logoX - 0.5, logoY - 0.5, logoMM + 1, logoMM + 1, 2, 2, 'S');

        if (logoData) {
            doc.addImage(logoData, 'PNG', logoX, logoY, logoMM, logoMM);
        } else {
            doc.setFillColor(15, 23, 42);
            doc.roundedRect(logoX, logoY, logoMM, logoMM, 1, 1, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(4);
            doc.setFont('helvetica', 'bold');
            doc.text('ID', logoX + logoMM / 2, logoY + 5.5, { align: 'center' });
        }

        // ── Titre établissement (Sur bannière) ─────────────
        const txtX      = logoX + logoMM + 4;
        const maxNameW  = cardW - logoMM - 10;
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        const schoolLine = (schoolName || 'ÉCOLE').toUpperCase();
        doc.text(schoolLine, txtX, y + 5);
        
        doc.setFontSize(4.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(234, 179, 8);
        doc.text(`OFFICIEL ${schoolYear}`, txtX, y + 8.5);
        
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'normal');
        doc.text(' • IDENTITÉ SCOLAIRE', txtX + doc.getTextWidth(`OFFICIEL ${schoolYear}`) + 1, y + 8.5);

        // ── QR Code Frame ─────────────────────────────────
        const qrMM    = 21;
        const qrX     = x + cardW - qrMM - 4;
        const qrY     = y + bannerH + 5;
        const qrPad   = 1.5;

        // Conteneur blanc
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(qrX - qrPad, qrY - qrPad, qrMM + qrPad * 2, qrMM + qrPad * 2, 3, 3, 'F');
        
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.roundedRect(qrX - qrPad, qrY - qrPad, qrMM + qrPad * 2, qrMM + qrPad * 2, 3, 3, 'S');

        const qrDataURL = await buildQRDataURL(student.id);
        doc.addImage(qrDataURL, 'PNG', qrX, qrY, qrMM, qrMM, undefined, 'NONE');

        doc.setTextColor(148, 163, 184);
        doc.setFontSize(3.5);
        doc.setFont('helvetica', 'bold');
        doc.text("SCAN SÉCURISÉ", qrX + qrMM / 2, qrY + qrMM + 3, { align: 'center' });

        // ── Photo passeport ──────────────────────────────
        const photoOffsetX = 16; 
        const photoW = 18;
        const photoH = 22;
        const photoY = y + bannerH + 4;

        // Cadre photo
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(x + photoOffsetX, photoY, photoW, photoH, 2, 2, 'F');
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.4);
        doc.roundedRect(x + photoOffsetX, photoY, photoW, photoH, 2, 2, 'S');

        if (student.photoUrl && student.photoUrl.startsWith('data:image')) {
            doc.addImage(student.photoUrl, 'JPEG', x + photoOffsetX + 0.2, photoY + 0.2, photoW - 0.4, photoH - 0.4);
        }

        // ── Sceau de sécurité photo
        doc.setFillColor(234, 179, 8);
        doc.circle(x + photoOffsetX + photoW - 2, photoY + photoH - 2, 1.5, 'F');
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.1);
        doc.circle(x + photoOffsetX + photoW - 2, photoY + photoH - 2, 1.5, 'S');

        // ── Infos Élève : Nom ────────────────────────────
        const infoStartX = x + photoOffsetX + photoW + 4;
        const nameMaxW   = cardW - qrMM - photoW - 22;
        const fullName   = `${student.prenom} ${student.nom}`.toUpperCase();
        
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(4);
        doc.setFont('helvetica', 'bold');
        doc.text("NOM & PRÉNOMS", infoStartX, photoY + 2);

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fullName.length > 20 ? 8 : 9);
        const nameLines = doc.splitTextToSize(fullName, nameMaxW);
        doc.text(nameLines[0], infoStartX, photoY + 6);

        // ── Tags (Classe & Contact) ─────────────────────────────────
        const tagY = photoY + 12;
        
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(3.5);
        doc.text("CLASSE", infoStartX, tagY);
        
        doc.setFillColor(15, 23, 42);
        doc.roundedRect(infoStartX, tagY + 1, 16, 4.5, 1.5, 1.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.text(student.classe, infoStartX + 8, tagY + 4.2, { align: 'center' });

        doc.setTextColor(100, 116, 139);
        doc.setFontSize(3.5);
        doc.text("CONTACT", infoStartX + 20, tagY);
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(5);
        doc.text(student.telephone, infoStartX + 20, tagY + 4.2);

        // ── Pied de page ──────────────────────────
        const footerH = 6;
        doc.setFillColor(15, 23, 42);
        doc.rect(x, y + cardH - footerH, cardW, footerH, 'F');
        doc.setDrawColor(234, 179, 8);
        doc.setLineWidth(0.4);
        doc.line(x, y + cardH - footerH, x + cardW, y + cardH - footerH);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(3.5);
        doc.setFont('helvetica', 'bold');
        const disclaimer = "Document officiel certifié par QR Code • École Numérique";
        doc.text(disclaimer, x + cardW / 2, y + cardH - 2.2, { align: 'center' });

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
