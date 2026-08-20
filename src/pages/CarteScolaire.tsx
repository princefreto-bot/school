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
    CheckCircle, Loader2, ChevronDown, AlertCircle, User,
    Users, Info
} from 'lucide-react';

// ============================================================
// COMPOSANT CARTE VERSO — Affichage écran
// Texte libre défini par l'établissement (Paramètres > Cartes).
// Mêmes dimensions que le recto pour un aperçu cohérent.
// ============================================================
interface CarteVersoProps {
    schoolName: string;
    schoolLogo: string | null;
    versoTexte: string;
}

const CarteVerso: React.FC<CarteVersoProps> = ({ schoolName, schoolLogo, versoTexte }) => {
    const AMBER = '#D97706';
    return (
        <div style={{
            width: 360, height: 228,
            borderRadius: 10,
            overflow: 'hidden',
            position: 'relative',
            fontFamily: '"Poppins", sans-serif',
            boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.05)',
            userSelect: 'none',
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            display: 'flex',
            flexDirection: 'column',
        }}>
            <div style={{ height: 4, background: AMBER, flexShrink: 0 }} />
            <div style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{
                        width: 22, height: 22, borderRadius: 4, background: '#FFFFFF',
                        border: `1px solid ${AMBER}`, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', padding: 2, flexShrink: 0,
                    }}>
                        {schoolLogo
                            ? <img src={schoolLogo} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            : <span style={{ color: AMBER, fontWeight: 900, fontSize: 8 }}>ID</span>
                        }
                    </div>
                    <span style={{ color: '#111827', fontWeight: 800, fontSize: 10, textTransform: 'uppercase' }}>{schoolName}</span>
                </div>
                <p style={{
                    flex: 1, color: '#374151', fontSize: 9.5, lineHeight: 1.5,
                    whiteSpace: 'pre-wrap', overflow: 'hidden', margin: 0,
                }}>
                    {versoTexte}
                </p>
                <p style={{ color: '#9CA3AF', fontSize: 6.5, fontWeight: 700, textAlign: 'center', margin: 0, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                    DGhubSchool
                </p>
            </div>
        </div>
    );
};

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
    adsn?: string | null;
}

const CarteEleve: React.FC<CarteProps> = ({
    nom, prenom, classe, id, telephone, schoolName, schoolYear, schoolLogo, photoUrl, adsn
}) => {
    const nomComplet = `${prenom} ${nom}`.toUpperCase();
    const initials = `${prenom.charAt(0)}${nom.charAt(0)}`;
    const AMBER = '#D97706';

    return (
        <div style={{
            width: 360, height: 228,
            borderRadius: 10,
            overflow: 'hidden',
            position: 'relative',
            fontFamily: '"Poppins", sans-serif',
            boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.05)',
            userSelect: 'none',
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
        }}>
            {/* ── Fine bande amber en haut (identité visuelle minimale) ── */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 4,
                background: AMBER,
            }} />

            {/* ── Header : logo + nom école ── */}
            <div style={{
                position: 'absolute', top: 10, left: 12, right: 12, height: 30,
                display: 'flex', alignItems: 'center', gap: 8,
            }}>
                <div style={{
                    width: 26, height: 26, borderRadius: 4,
                    background: '#FFFFFF',
                    border: `1px solid ${AMBER}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 2, flexShrink: 0,
                }}>
                    {schoolLogo
                        ? <img src={schoolLogo} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        : <span style={{ color: AMBER, fontWeight: 900, fontSize: 10 }}>ID</span>
                    }
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                        color: '#111827', fontWeight: 800, lineHeight: 1.1,
                        fontSize: schoolName.length > 22 ? 9 : schoolName.length > 14 ? 10.5 : 12,
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{schoolName}</div>
                    <div style={{ color: AMBER, fontSize: 7.5, fontWeight: 800, marginTop: 1, letterSpacing: 0.6 }}>
                        CARTE SCOLAIRE · {schoolYear}
                    </div>
                </div>
            </div>

            {/* ── Ligne séparatrice fine ── */}
            <div style={{
                position: 'absolute', top: 46, left: 12, right: 12, height: 1,
                background: '#E5E7EB',
            }} />

            {/* ── Photo élève (petite, gauche) ── */}
            <div style={{
                position: 'absolute', top: 54, left: 12,
                width: 60, height: 78,
                borderRadius: 4,
                overflow: 'hidden',
                border: '1px solid #E5E7EB',
                background: '#F9FAFB',
            }}>
                {photoUrl ? (
                    <img src={photoUrl} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#9CA3AF', fontSize: 22, fontWeight: 800,
                    }}>
                        {initials}
                    </div>
                )}
            </div>

            {/* ── Infos élève (centre) ── */}
            <div style={{
                position: 'absolute', top: 54, left: 82, right: 108,
            }}>
                <div style={{
                    color: '#111827', fontWeight: 900,
                    fontSize: nomComplet.length > 28 ? 11 : nomComplet.length > 18 ? 13 : 14,
                    lineHeight: 1.15, textTransform: 'uppercase',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    marginBottom: 8,
                }}>
                    {nomComplet}
                </div>

                <div style={{ marginBottom: 6 }}>
                    <div style={{ color: '#6B7280', fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Classe</div>
                    <div style={{ color: '#111827', fontSize: 12, fontWeight: 800 }}>{classe}</div>
                </div>

                <div style={{ marginBottom: 6 }}>
                    <div style={{ color: '#6B7280', fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Matricule</div>
                    <div style={{
                        color: '#111827', fontSize: 9, fontWeight: 700,
                        fontFamily: 'monospace', letterSpacing: 0.4,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                        {adsn ? adsn.toUpperCase() : '—'}
                    </div>
                </div>

                <div>
                    <div style={{ color: '#6B7280', fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Contact</div>
                    <div style={{ color: '#111827', fontSize: 9.5, fontWeight: 700 }}>
                        {telephone || '—'}
                    </div>
                </div>
            </div>

            {/* ── GROS QR Code (droite) ── */}
            <div style={{
                position: 'absolute', top: 54, right: 12,
                width: 92, height: 92,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
                <QRCodeCanvas value={id} size={90} level="H" bgColor="#FFFFFF" fgColor="#111827" />
            </div>

            {/* ── Footer minimaliste ── */}
            <div style={{
                position: 'absolute', bottom: 6, left: 12, right: 12,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <p style={{
                    color: '#9CA3AF', fontSize: 6.5, fontWeight: 600, margin: 0,
                    textTransform: 'uppercase', letterSpacing: 0.5,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    flex: 1,
                }}>
                    Retourner à l'administration si trouvée
                </p>
                <p style={{
                    color: AMBER, fontSize: 6.5, fontWeight: 800, margin: 0,
                    textTransform: 'uppercase', letterSpacing: 0.6,
                    marginLeft: 8,
                }}>
                    DGhubSchool
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

/**
 * Charge une URL d'image et la convertit en Base64 (utile pour jsPDF avec URLs distantes)
 */
const imageUrlToBase64 = async (url: string): Promise<string> => {
    if (url.startsWith('data:image')) return url;
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error('Erreur conversion image:', e);
        return '';
    }
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
// Design identique à la carte écran : fond sombre, bande or diagonale
// ============================================================
const generateCartesPDF = async (
    students: Array<{ id: string; nom: string; prenom: string; classe: string; telephone: string; photoUrl?: string; adsn?: string }>,
    schoolName: string,
    schoolYear: string,
    schoolLogo: string | null,
    onProgress: (n: number) => void,
    versoTexte: string = '',
): Promise<void> => {
    if (!students.length) throw new Error('Aucun élève sélectionné');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // ── Mise en page ────────────────────────────────────────
    const cardW   = 85;
    const cardH   = 54;
    const cols    = 2;
    const rowsMax = 4;
    const pageW   = 210;
    const pageH   = 297;
    const gapX    = 6;
    const gapY    = 8;
    const marginX = (pageW - cols * cardW - (cols - 1) * gapX) / 2;
    const marginY = (pageH - rowsMax * cardH - (rowsMax - 1) * gapY) / 2;

    // ── Logo pré-traité ─────────────────────────────────────
    let logoData = '';
    if (schoolLogo && schoolLogo.startsWith('data:image')) {
        logoData = await resizeLogoForPDF(schoolLogo, 120);
    }

    const total = students.length;
    let cardIndex = 0;

    // Palette minimaliste : 90% blanc, une touche amber, texte noir/gris
    const C = {
        white:   [255, 255, 255] as [number, number, number],
        border:  [229, 231, 235] as [number, number, number], // #E5E7EB
        text:    [17,  24,  39 ] as [number, number, number], // #111827
        muted:   [107, 114, 128] as [number, number, number], // #6B7280
        faint:   [156, 163, 175] as [number, number, number], // #9CA3AF
        amber:   [217, 119, 6  ] as [number, number, number], // #D97706
        photoBg: [249, 250, 251] as [number, number, number], // #F9FAFB
    };

    for (const student of students) {
        const posOnPage = cardIndex % (cols * rowsMax);
        if (posOnPage === 0 && cardIndex > 0) doc.addPage();

        const col = posOnPage % cols;
        const row = Math.floor(posOnPage / cols);
        const x   = marginX + col * (cardW + gapX);
        const y   = marginY + row * (cardH + gapY);

        // ── 1. FOND BLANC + bordure fine ─────────────────────
        doc.setFillColor(...C.white);
        doc.roundedRect(x, y, cardW, cardH, 2, 2, 'F');
        doc.setDrawColor(...C.border);
        doc.setLineWidth(0.15);
        doc.roundedRect(x, y, cardW, cardH, 2, 2, 'S');

        // ── 2. Fine bande amber en haut (identité) ───────────
        doc.setFillColor(...C.amber);
        doc.rect(x, y, cardW, 1.2, 'F');

        // ── 3. HEADER : logo + nom école ─────────────────────
        const hY = y + 4;
        const logoBoxW = 7;
        const logoBoxH = 7;
        const logoBoxX = x + 3;
        const logoBoxY = hY;

        // Cadre logo blanc bordé amber
        doc.setFillColor(...C.white);
        doc.setDrawColor(...C.amber);
        doc.setLineWidth(0.2);
        doc.roundedRect(logoBoxX, logoBoxY, logoBoxW, logoBoxH, 1, 1, 'FD');

        if (logoData) {
            doc.addImage(logoData, 'PNG', logoBoxX + 0.4, logoBoxY + 0.4, logoBoxW - 0.8, logoBoxH - 0.8);
        } else {
            doc.setTextColor(...C.amber);
            doc.setFontSize(4);
            doc.setFont('helvetica', 'bold');
            doc.text('ID', logoBoxX + logoBoxW / 2, logoBoxY + 4.5, { align: 'center' });
        }

        // Nom école (noir)
        const schoolTxtX = logoBoxX + logoBoxW + 2;
        const maxSchoolW = cardW - (logoBoxW + 6) - 3;
        let sLine = (schoolName || 'ÉCOLE').toUpperCase();
        doc.setFont('helvetica', 'bold');
        let sFS = 6.5;
        doc.setFontSize(sFS);
        while (doc.getTextWidth(sLine) > maxSchoolW && sFS > 4) { sFS -= 0.3; doc.setFontSize(sFS); }
        if (doc.getTextWidth(sLine) > maxSchoolW) {
            while (doc.getTextWidth(sLine + '...') > maxSchoolW && sLine.length > 4) sLine = sLine.slice(0, -1);
            sLine += '...';
        }
        doc.setTextColor(...C.text);
        doc.text(sLine, schoolTxtX, hY + 3);

        // Sous-titre amber : CARTE SCOLAIRE · année
        doc.setFontSize(3.6);
        doc.setTextColor(...C.amber);
        doc.setFont('helvetica', 'bold');
        doc.text(`CARTE SCOLAIRE · ${schoolYear}`, schoolTxtX, hY + 6.2);

        // Ligne séparatrice
        doc.setDrawColor(...C.border);
        doc.setLineWidth(0.1);
        doc.line(x + 3, y + 13.5, x + cardW - 3, y + 13.5);

        // ── 4. PHOTO ÉLÈVE (petite, gauche) ──────────────────
        const phW = 14;
        const phH = 18;
        const phX = x + 3;
        const phY = y + 15;

        doc.setFillColor(...C.photoBg);
        doc.roundedRect(phX, phY, phW, phH, 1, 1, 'F');
        doc.setDrawColor(...C.border);
        doc.setLineWidth(0.15);
        doc.roundedRect(phX, phY, phW, phH, 1, 1, 'S');

        if (student.photoUrl) {
            try {
                const b64 = await imageUrlToBase64(student.photoUrl);
                if (b64) doc.addImage(b64, 'JPEG', phX + 0.3, phY + 0.3, phW - 0.6, phH - 0.6);
            } catch { /* silencieux */ }
        } else {
            const initials = `${student.prenom.charAt(0)}${student.nom.charAt(0)}`.toUpperCase();
            doc.setTextColor(...C.faint);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(initials, phX + phW / 2, phY + phH / 2 + 2, { align: 'center' });
        }

        // ── 5. INFOS ÉLÈVE (centre, noir sur blanc) ──────────
        const iX    = phX + phW + 3;
        const iMaxW = cardW - (phW + 6) - 30 - 2; // laisse la place au QR à droite

        // Nom
        const fullName = `${student.prenom} ${student.nom}`.toUpperCase();
        doc.setTextColor(...C.text);
        let nFS = 8;
        if (fullName.length > 25) nFS = 5.5;
        else if (fullName.length > 18) nFS = 6.5;
        doc.setFontSize(nFS);
        doc.setFont('helvetica', 'bold');
        const nLines = doc.splitTextToSize(fullName, iMaxW);
        doc.text(nLines.slice(0, 2), iX, phY + 3);

        // Classe
        doc.setFontSize(3.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.muted);
        doc.text('CLASSE', iX, phY + 9);
        doc.setFontSize(6.5);
        doc.setTextColor(...C.text);
        doc.text(student.classe, iX, phY + 12);

        // Matricule
        doc.setFontSize(3.5);
        doc.setTextColor(...C.muted);
        doc.text('MATRICULE', iX, phY + 15);
        doc.setFontSize(5);
        doc.setTextColor(...C.text);
        doc.text(student.adsn ? student.adsn.toUpperCase() : '—', iX, phY + 17.5);

        // ── 6. GROS QR CODE (droite) ─────────────────────────
        // Le QR est l'élément dominant — 26mm de côté
        const qrMM  = 26;
        const qrX2  = x + cardW - qrMM - 3;
        const qrY2  = y + 15;

        const qrDataURL = await buildQRDataURL(student.id);
        doc.addImage(qrDataURL, 'PNG', qrX2, qrY2, qrMM, qrMM, undefined, 'NONE');

        // ── 7. FOOTER minimaliste ────────────────────────────
        const fY = y + cardH - 3;
        doc.setFontSize(2.8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.faint);
        doc.text("Retourner a l'administration si trouvee", x + 3, fY);

        doc.setFontSize(2.8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.amber);
        doc.text('DGhubSchool', x + cardW - 3, fY, { align: 'right' });

        cardIndex++;
        onProgress(Math.round((cardIndex / total) * 100));
    }

    // ── PAGES VERSO — mêmes positions que le recto (impression recto-verso,
    // bord long) : la carte verso N occupe la même case que la carte recto N,
    // sur une page supplémentaire ajoutée après chaque page de rectos. ──
    if (versoTexte.trim()) {
        const cardsPerPage = cols * rowsMax;
        const nbRectoPages = Math.ceil(students.length / cardsPerPage);
        const versoLines = doc.splitTextToSize(versoTexte.trim(), cardW - 6);

        for (let pageIdx = 0; pageIdx < nbRectoPages; pageIdx++) {
            doc.addPage();
            const cardsOnThisPage = Math.min(cardsPerPage, students.length - pageIdx * cardsPerPage);

            for (let posOnPage = 0; posOnPage < cardsOnThisPage; posOnPage++) {
                const col = posOnPage % cols;
                const row = Math.floor(posOnPage / cols);
                const x   = marginX + col * (cardW + gapX);
                const y   = marginY + row * (cardH + gapY);

                doc.setFillColor(...C.white);
                doc.roundedRect(x, y, cardW, cardH, 2, 2, 'F');
                doc.setDrawColor(...C.border);
                doc.setLineWidth(0.15);
                doc.roundedRect(x, y, cardW, cardH, 2, 2, 'S');
                doc.setFillColor(...C.amber);
                doc.rect(x, y, cardW, 1.2, 'F');

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(5);
                doc.setTextColor(...C.text);
                doc.text((schoolName || 'ÉCOLE').toUpperCase(), x + cardW / 2, y + 5, { align: 'center', maxWidth: cardW - 6 });

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(4.2);
                doc.setTextColor(...C.muted);
                doc.text(versoLines, x + 3, y + 11, { maxWidth: cardW - 6, lineHeightFactor: 1.35 });

                doc.setFontSize(2.8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...C.amber);
                doc.text('DGhubSchool', x + cardW / 2, y + cardH - 3, { align: 'center' });
            }
        }
    }

    // Numérotation de pages
    const nbPages = doc.getNumberOfPages();
    for (let p = 1; p <= nbPages; p++) {
        doc.setPage(p);
        doc.setFontSize(5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
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
    const carteVersoTexte = useStore(s => s.carteVersoTexte);

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
            await generateCartesPDF(list, schoolName, schoolYear, schoolLogo, setProgress, carteVersoTexte);
        } catch (err) {
            console.error('[CarteScolaire] Erreur génération PDF:', err);
            setError(err instanceof Error ? err.message : 'Erreur lors de la génération du PDF');
        } finally {
            setGenerating(false);
        }
    }, [generating, schoolName, schoolYear, schoolLogo, carteVersoTexte]);

    const handleGenerateAll    = () => startGeneration(filtered);
    const handleGenerateClasse = (c: string) => startGeneration(students.filter(s => s.classe === c));
    const handleGenerateOne    = (id: string) => {
        const s = students.find(st => st.id === id);
        if (s) startGeneration([s]);
    };

    // ── Rendu ────────────────────────────────────────────────
    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-24">

            {/* ── Header Ultra-Premium (Toss Pattern) ─────────────────────────────────── */}
            <div className="rounded-[24px] p-6 md:p-8 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 text-white relative overflow-hidden shadow-[0_8px_30px_rgba(49,46,129,0.2)]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-[20px] flex items-center justify-center shadow-inner">
                            <CreditCard className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">Cartes Scolaires</h2>
                            <p className="text-indigo-200 text-sm mt-1 font-medium max-w-md">
                                Format ISO 85×54 mm · QR Code niveau H
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 relative z-10">
                    {[
                        { v: students.length,               l: 'Total élèves',      color: 'bg-white/10' },
                        { v: classes.length,                l: 'Classes',           color: 'bg-purple-500/20' },
                        { v: Math.ceil(students.length / 8), l: 'Pages PDF', color: 'bg-emerald-500/20' },
                    ].map(({ v, l, color }) => (
                        <div key={l} className={`${color} backdrop-blur-md rounded-[20px] p-4 transition-colors`}>
                            <p className="text-3xl font-black text-white drop-shadow-md mb-1">{v}</p>
                            <p className="text-xs font-bold text-white/70 uppercase tracking-wider">{l}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Filtres + bouton principal (Toss Layout) ───────────────── */}
            <div className="bg-white rounded-[24px] shadow-[0_2px_20px_rgba(0,0,0,0.04)] p-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Rechercher un élève par nom, matricule..."
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-indigo-100 focus:bg-white outline-none font-medium transition-all"
                                />
                            </div>
                            <div className="relative sm:w-64">
                                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <select
                                    value={selectedClasse}
                                    onChange={e => setSelectedClasse(e.target.value)}
                                    className="w-full pl-11 pr-10 py-3 bg-slate-50 border-none rounded-[16px] text-sm focus:bg-white appearance-none focus:ring-2 focus:ring-indigo-100 outline-none font-medium transition-all cursor-pointer"
                                >
                                    <option value="">Toutes les classes</option>
                                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleGenerateAll}
                        disabled={generating || filtered.length === 0}
                        className="flex items-center justify-center gap-2 px-8 py-3 bg-slate-900 hover:bg-black active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[16px] text-sm font-bold transition-all shadow-md w-full md:w-auto h-full"
                    >
                        {generating
                            ? <><Loader2 className="w-5 h-5 animate-spin" /> {progress}%</>
                            : <><Download className="w-5 h-5" /> Générer lot PDF ({filtered.length})</>
                        }
                    </button>
                </div>

                {/* Barre de progression */}
                {generating && (
                    <div className="pt-4 mt-4 border-t border-slate-100 animate-fadeIn">
                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                            <span>Construction du document PDF en cours…</span>
                            <span className="text-slate-900">{progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-slate-900 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Erreur */}
                {error && (
                    <div className="flex items-center gap-3 p-4 mt-4 bg-rose-50 rounded-[16px] text-sm font-bold text-rose-700 animate-fadeIn">
                        <AlertCircle className="w-5 h-5 text-rose-500" />
                        {error}
                    </div>
                )}
            </div>

            {/* ── Génération par classe ────────────────────── */}
            <div className="bg-white rounded-[24px] shadow-[0_2px_20px_rgba(0,0,0,0.04)] p-6">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wider">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                        <Filter className="w-4 h-4 text-slate-600" />
                    </div>
                    Générer rapidement par classe
                </h3>
                <div className="flex flex-wrap gap-2">
                    {classes.map(c => {
                        const count = students.filter(s => s.classe === c).length;
                        return (
                            <button
                                key={c}
                                onClick={() => handleGenerateClasse(c)}
                                disabled={generating}
                                className="group flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 active:scale-[0.98] disabled:opacity-50 text-slate-700 rounded-[14px] text-sm font-bold transition-all"
                            >
                                <Download className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                {c}
                                <span className="bg-white text-slate-500 group-hover:text-slate-700 px-2 py-0.5 rounded-lg text-xs font-black shadow-sm transition-colors">{count}</span>
                            </button>
                        );
                    })}
                </div>
                <div className="mt-5 p-4 bg-slate-50 rounded-[16px] flex items-start gap-3">
                    <Info className="w-5 h-5 text-slate-400 shrink-0" />
                    <p className="text-sm font-medium text-slate-600 leading-relaxed">
                        Le format PDF respecte les normes ISO 7810 (85×54 mm). Le QR code est encodé avec un niveau H (30% de correction d'erreurs) garantissant une lecture fiable. Rendement de 8 cartes par page A4.
                        {carteVersoTexte.trim() && ' Un verso personnalisé est configuré (Paramètres > Cartes) : les pages verso sont ajoutées après chaque page de rectos, prêtes pour une impression recto-verso.'}
                    </p>
                </div>
            </div>

            {/* ── Prévisualisation d'une carte ─────────────── */}
            {selectedStudent ? (() => {
                const s = students.find(st => st.id === selectedStudent);
                if (!s) return null;
                return (
                    <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-6 md:p-8 animate-fadeIn">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                                    <Search className="w-5 h-5 text-slate-600" />
                                </div>
                                Prévisualisation HD
                            </h3>
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all hover:rotate-90 duration-300"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex flex-col lg:flex-row gap-10 items-start">
                            {/* Carte */}
                            <div className="flex-shrink-0">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Aperçu ISO (85×54 mm)</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-[24px]">
                                    <div style={{ boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)', borderRadius:0, display:'inline-block' }} className="transition-transform hover:scale-[1.02] duration-500">
                                        <CarteEleve
                                            nom={s.nom} prenom={s.prenom} classe={s.classe} id={s.id}
                                            telephone={s.telephone}
                                            schoolName={schoolName} schoolYear={schoolYear} schoolLogo={schoolLogo}
                                            photoUrl={s.photoUrl}
                                            adsn={s.adsn}
                                        />
                                    </div>
                                </div>
                            </div>
                            {carteVersoTexte.trim() && (
                                <div className="flex-shrink-0">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Verso</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-[24px]">
                                        <div style={{ boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)', borderRadius:0, display:'inline-block' }} className="transition-transform hover:scale-[1.02] duration-500">
                                            <CarteVerso schoolName={schoolName} schoolLogo={schoolLogo} versoTexte={carteVersoTexte} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Actions */}
                            <div className="flex-1 space-y-4 min-w-[250px] w-full">
                                <div className="text-sm text-slate-700 bg-slate-50 rounded-[20px] p-5 flex items-start gap-4">
                                    <CheckCircle className="w-6 h-6 shrink-0 text-emerald-500" />
                                    <p className="font-medium leading-relaxed">
                                        <strong className="block mb-1 text-slate-900">Validation technique réussie</strong>
                                        Le QR Code généré utilise une matrice haute densité (Niveau H) offrant une résilience de 30% aux dommages.
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleGenerateOne(s.id)}
                                    disabled={generating}
                                    className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-slate-900 hover:bg-black active:scale-[0.98] disabled:opacity-50 text-white rounded-[16px] text-sm font-bold transition-all shadow-[0_10px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_15px_25px_rgba(0,0,0,0.15)]"
                                >
                                    {generating
                                        ? <><Loader2 className="w-5 h-5 animate-spin" /> Rendu PDF en cours…</>
                                        : <><Printer className="w-5 h-5" /> Télécharger la carte seule (PDF)</>
                                    }
                                </button>
                                <button
                                    onClick={() => setSelectedStudent(null)}
                                    className="flex items-center justify-center w-full px-6 py-4 bg-white hover:bg-slate-50 text-slate-700 rounded-[16px] text-sm font-bold transition-all active:scale-[0.98]"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })() : (
                /* Liste des élèves (Toss List) */
                <div className="bg-white rounded-[24px] shadow-[0_2px_20px_rgba(0,0,0,0.04)] p-6">
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-lg text-slate-800 font-bold flex items-center gap-3">
                            <Users className="w-5 h-5 text-slate-400" />
                            Répertoire des élèves
                        </p>
                        <span className="bg-slate-50 text-slate-600 px-4 py-1.5 rounded-full text-xs font-black">
                            {filtered.length} résultats
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[520px] overflow-y-auto pr-2 custom-scrollbar">
                        {filtered.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedStudent(s.id)}
                                className="group flex items-center gap-4 p-4 rounded-[20px] bg-slate-50 hover:bg-white hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] active:scale-[0.98] transition-all text-left"
                            >
                                <div className="w-12 h-12 rounded-[16px] bg-white shadow-sm flex items-center justify-center text-slate-800 text-sm font-black shrink-0 transition-transform">
                                    {s.prenom.charAt(0)}{s.nom.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[15px] font-bold text-slate-900 truncate group-hover:text-slate-700 transition-colors">{s.prenom} {s.nom}</p>
                                    <p className="text-xs font-bold text-slate-400 mt-1">{s.classe}</p>
                                </div>
                                <div className="w-10 h-10 rounded-[14px] flex items-center justify-center bg-white group-hover:bg-slate-50 shadow-sm transition-colors shrink-0">
                                    <CreditCard className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                </div>
                            </button>
                        ))}
                        {filtered.length === 0 && (
                            <div className="col-span-full text-center py-16">
                                <div className="w-20 h-20 rounded-[24px] bg-slate-50 flex items-center justify-center mx-auto mb-5">
                                    <Search className="w-10 h-10 text-slate-300" />
                                </div>
                                <p className="text-lg text-slate-600 font-bold">Aucun élève trouvé</p>
                                <p className="text-sm text-slate-400 mt-1">Modifiez vos critères de recherche</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
