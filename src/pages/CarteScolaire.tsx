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

    return (
        <div style={{
            width: 360, height: 228,
            borderRadius: 16,
            overflow: 'hidden',
            position: 'relative',
            fontFamily: '"Poppins", sans-serif',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.15)',
            userSelect: 'none',
            background: '#0F172A',
        }}>
            {/* ── Bande diagonale dorée principale ── */}
            <div style={{
                position: 'absolute',
                top: -30, left: -20,
                width: 220, height: 280,
                background: 'linear-gradient(145deg, #1E293B 0%, #0F172A 60%)',
                transform: 'skewX(-8deg)',
                zIndex: 1,
            }} />

            {/* ── Accent diagonal doré ── */}
            <div style={{
                position: 'absolute',
                top: 0, right: 0,
                width: '55%', height: '100%',
                background: 'linear-gradient(135deg, #1a1035 0%, #12082a 40%, #0d0620 100%)',
                clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)',
                zIndex: 1,
            }} />

            {/* ── Ligne diagonale accent or ── */}
            <div style={{
                position: 'absolute',
                top: 0, left: '40%',
                width: 3, height: '100%',
                background: 'linear-gradient(180deg, #F59E0B 0%, #EAB308 50%, #D97706 100%)',
                transform: 'skewX(-8deg)',
                zIndex: 5,
                boxShadow: '0 0 12px rgba(234,179,8,0.5)',
            }} />

            {/* ── Micro-pattern guilloche (fond gauche) ── */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 2, opacity: 0.04,
                backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
                backgroundSize: '8px 8px',
            }} />

            {/* ── Cercles décoratifs ── */}
            <div style={{
                position: 'absolute', top: -40, left: -40,
                width: 130, height: 130,
                borderRadius: '50%',
                border: '1.5px solid rgba(234,179,8,0.15)',
                zIndex: 3,
            }} />
            <div style={{
                position: 'absolute', top: -25, left: -25,
                width: 100, height: 100,
                borderRadius: '50%',
                border: '1px solid rgba(234,179,8,0.1)',
                zIndex: 3,
            }} />
            <div style={{
                position: 'absolute', bottom: -30, right: 10,
                width: 80, height: 80,
                borderRadius: '50%',
                border: '1px solid rgba(139,92,246,0.2)',
                zIndex: 3,
            }} />

            {/* ── HEADER GAUCHE : Logo + Nom école ── */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '42%', height: 52,
                display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px',
                zIndex: 10,
            }}>
                {/* Logo box */}
                <div style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: schoolLogo ? 'white' : 'linear-gradient(135deg, #EAB308, #F59E0B)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 3, flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}>
                    {schoolLogo
                        ? <img src={schoolLogo} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        : <span style={{ color: '#0F172A', fontWeight: 900, fontSize: 11 }}>ID</span>
                    }
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={{
                        color: '#FFFFFF', fontWeight: 900, lineHeight: 1.1,
                        fontSize: schoolName.length > 22 ? 8.5 : schoolName.length > 14 ? 10 : 12,
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        maxWidth: 115,
                    }}>{schoolName}</div>
                    <div style={{ color: '#EAB308', fontSize: 8, fontWeight: 700, marginTop: 1 }}>
                        CARTE SCOLAIRE
                    </div>
                </div>
            </div>

            {/* ── Ligne dorée sous le header ── */}
            <div style={{
                position: 'absolute', top: 52, left: 0, width: '43%', height: 1.5,
                background: 'linear-gradient(90deg, rgba(234,179,8,0.8), transparent)',
                zIndex: 10,
            }} />

            {/* ── Année scolaire (badge) ── */}
            <div style={{
                position: 'absolute', top: 60, left: 14,
                background: 'rgba(234,179,8,0.12)',
                border: '1px solid rgba(234,179,8,0.4)',
                borderRadius: 6, padding: '2px 8px',
                zIndex: 10,
            }}>
                <span style={{ color: '#EAB308', fontSize: 8, fontWeight: 800 }}>AN. {schoolYear}</span>
            </div>

            {/* ── Photo élève ── */}
            <div style={{
                position: 'absolute', top: 84, left: 14,
                width: 80, height: 100,
                zIndex: 12,
            }}>
                {/* Cadre photo avec effet */}
                <div style={{
                    width: '100%', height: '100%',
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: '2.5px solid #EAB308',
                    background: '#1E293B',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}>
                    {photoUrl ? (
                        <img src={photoUrl} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{
                            width: '100%', height: '100%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'linear-gradient(145deg, #1E293B, #0F172A)',
                            color: '#EAB308', fontSize: 28, fontWeight: 900,
                        }}>
                            {initials}
                        </div>
                    )}
                </div>
                {/* Pastille dorée sécurité */}
                <div style={{
                    position: 'absolute', bottom: -4, right: -4,
                    width: 16, height: 16, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #F59E0B, #EAB308)',
                    border: '2px solid #0F172A',
                    zIndex: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(234,179,8,0.5)',
                }}>
                    <span style={{ color: '#0F172A', fontSize: 8, fontWeight: 900 }}>✓</span>
                </div>
            </div>

            {/* ── COLONNE DROITE : Informations élève ── */}
            <div style={{
                position: 'absolute', top: 14, right: 12, width: '52%',
                display: 'flex', flexDirection: 'column', gap: 0,
                zIndex: 10, paddingLeft: 14,
            }}>
                {/* Label */}
                <div style={{
                    color: 'rgba(139,92,246,0.9)', fontSize: 7.5, fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 5,
                }}>
                    Identité Élève
                </div>

                {/* Nom complet */}
                <div style={{
                    color: '#FFFFFF', fontWeight: 900,
                    fontSize: nomComplet.length > 28 ? 10.5 : nomComplet.length > 18 ? 13 : 15,
                    lineHeight: 1.15, textTransform: 'uppercase',
                    maxHeight: 42, overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    marginBottom: 10,
                    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                }}>
                    {nomComplet}
                </div>

                {/* Classe badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #EAB308, #F59E0B)',
                        borderRadius: 7, padding: '3px 10px',
                        boxShadow: '0 3px 10px rgba(234,179,8,0.35)',
                    }}>
                        <span style={{ color: '#0F172A', fontSize: 14, fontWeight: 900 }}>{classe}</span>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>·</span>
                </div>

                {/* Ligne séparatrice */}
                <div style={{
                    width: '80%', height: 1,
                    background: 'linear-gradient(90deg, rgba(234,179,8,0.4), transparent)',
                    marginBottom: 8,
                }} />

                {/* Matricule */}
                <div style={{ marginBottom: 6 }}>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Matricule</div>
                    <div style={{
                        color: 'rgba(255,255,255,0.88)', fontSize: 8.5, fontWeight: 800,
                        fontFamily: 'monospace', letterSpacing: 0.6,
                        background: 'rgba(255,255,255,0.06)', borderRadius: 5, padding: '3px 7px',
                        display: 'inline-block', maxWidth: '100%',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                        {adsn ? adsn.toUpperCase() : 'À PRÉCISER'}
                    </div>
                </div>

                {/* Contact */}
                <div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Contact</div>
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 800 }}>
                        {telephone || '—'}
                    </div>
                </div>
            </div>

            {/* ── QR Code ── */}
            <div style={{
                position: 'absolute', bottom: 22, right: 10,
                width: 64, height: 64,
                background: '#FFFFFF',
                borderRadius: 8,
                padding: 4,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                zIndex: 12,
                boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
            }}>
                <QRCodeCanvas value={id} size={52} level="H" bgColor="#FFFFFF" fgColor="#0F172A" />
                <p style={{ fontSize: 5, color: '#94A3B8', marginTop: 2, fontWeight: 900, textTransform: 'uppercase' }}>Scan</p>
            </div>

            {/* ── FOOTER ── */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, width: '100%', height: 18,
                background: 'linear-gradient(90deg, #EAB308 0%, #F59E0B 40%, #1E293B 60%)',
                zIndex: 15,
                display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 80,
            }}>
                <p style={{
                    color: '#0F172A', fontSize: 7, fontWeight: 800, margin: 0,
                    textTransform: 'uppercase', letterSpacing: 0.5,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    Retourner à l'administration si trouvée • {schoolName}
                </p>
            </div>

            {/* ── Watermark logo ── */}
            {schoolLogo && (
                <div style={{
                    position: 'absolute', top: '50%', left: '20%', transform: 'translate(-50%, -50%)',
                    width: 90, height: 90, opacity: 0.07, zIndex: 4, pointerEvents: 'none',
                }}>
                    <img src={schoolLogo} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'grayscale(1) invert(1)' }} />
                </div>
            )}
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

    // Couleurs du design
    const C = {
        dark:   [15,  23,  42 ] as [number,number,number],
        slate:  [30,  41,  59 ] as [number,number,number],
        purple: [18,  8,   42 ] as [number,number,number],
        gold:   [234, 179, 8  ] as [number,number,number],
        goldHi: [245, 158, 11 ] as [number,number,number],
        white:  [255, 255, 255] as [number,number,number],
        dim:    [148, 163, 184] as [number,number,number],
        silver: [200, 200, 200] as [number,number,number],
        violet: [139, 92,  246] as [number,number,number],
        dimDark:[71,  85,  105] as [number,number,number],
    };

    const gs = (opacity: number) => {
        // @ts-ignore
        doc.setGState(new doc.GState({ opacity }));
    };

    for (const student of students) {
        const posOnPage = cardIndex % (cols * rowsMax);
        if (posOnPage === 0 && cardIndex > 0) doc.addPage();

        const col = posOnPage % cols;
        const row = Math.floor(posOnPage / cols);
        const x   = marginX + col * (cardW + gapX);
        const y   = marginY + row * (cardH + gapY);

        // ══════════════════════════════════════════════════════
        // 1. FOND PRINCIPAL — côté gauche sombre
        // ══════════════════════════════════════════════════════
        doc.setFillColor(...C.dark);
        doc.roundedRect(x, y, cardW, cardH, 2, 2, 'F');

        // Zone gauche légèrement plus claire (slate)
        doc.setFillColor(...C.slate);
        doc.rect(x, y, cardW * 0.46, cardH, 'F');

        // Zone droite — fond violet sombre
        doc.setFillColor(...C.purple);
        doc.rect(x + cardW * 0.52, y, cardW * 0.48, cardH, 'F');

        // Re-appliquer le fond dark sur le card pour les angles arrondis
        doc.setDrawColor(...C.dark);
        doc.setLineWidth(0.1);
        doc.roundedRect(x, y, cardW, cardH, 2, 2, 'S');

        // ── Micro guilloche diagonal (gauche) ────────────────
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.04);
        for (let i = 0; i < cardH; i += 3) {
            gs(0.04);
            doc.line(x, y + i, x + cardW * 0.45, y + i + 1.5);
        }
        gs(1);

        // ── Bande diagonale or (séparation) ─────────────────
        const sepX = x + cardW * 0.48;
        doc.setFillColor(...C.gold);
        doc.rect(sepX - 0.8, y, 1.8, cardH, 'F');
        doc.setFillColor(...C.goldHi);
        doc.rect(sepX - 1.5, y, 0.6, cardH, 'F');

        // ── Cercles décoratifs coin supérieur gauche ─────────
        doc.setDrawColor(...C.gold);
        doc.setLineWidth(0.3);
        // @ts-ignore
        doc.setGState(new doc.GState({ opacity: 0.15 }));
        doc.circle(x - 5, y - 5, 14, 'S');
        // @ts-ignore
        doc.setGState(new doc.GState({ opacity: 0.1 }));
        doc.circle(x - 5, y - 5, 10, 'S');
        // @ts-ignore
        doc.setGState(new doc.GState({ opacity: 1 }));
        doc.setLineWidth(0.1);

        // ══════════════════════════════════════════════════════
        // 2. HEADER GAUCHE — Logo + Nom école
        // ══════════════════════════════════════════════════════
        const hH       = 14;
        const logoBoxW = 9;
        const logoBoxH = 9;
        const logoBoxX = x + 3.5;
        const logoBoxY = y + (hH - logoBoxH) / 2;

        doc.setFillColor(...C.white);
        doc.roundedRect(logoBoxX, logoBoxY, logoBoxW, logoBoxH, 1.5, 1.5, 'F');

        if (logoData) {
            doc.addImage(logoData, 'PNG', logoBoxX + 0.5, logoBoxY + 0.5, logoBoxW - 1, logoBoxH - 1);
        } else {
            doc.setFillColor(...C.gold);
            doc.roundedRect(logoBoxX, logoBoxY, logoBoxW, logoBoxH, 1.5, 1.5, 'F');
            doc.setTextColor(...C.dark);
            doc.setFontSize(4.5);
            doc.setFont('helvetica', 'bold');
            doc.text('ID', logoBoxX + logoBoxW / 2, logoBoxY + 6, { align: 'center' });
        }

        const schoolTxtX = logoBoxX + logoBoxW + 2.5;
        const maxSchoolW = cardW * 0.44 - logoBoxW - 6;
        let sLine = (schoolName || 'ÉCOLE').toUpperCase();
        doc.setFont('helvetica', 'bold');
        let sFS = 6.5;
        doc.setFontSize(sFS);
        while (doc.getTextWidth(sLine) > maxSchoolW && sFS > 4) { sFS -= 0.4; doc.setFontSize(sFS); }
        if (doc.getTextWidth(sLine) > maxSchoolW) {
            while (doc.getTextWidth(sLine + '...') > maxSchoolW && sLine.length > 4) sLine = sLine.slice(0, -1);
            sLine += '...';
        }
        doc.setTextColor(...C.white);
        doc.text(sLine, schoolTxtX, y + 5.5);

        doc.setFontSize(3.8);
        doc.setTextColor(...C.gold);
        doc.text('CARTE SCOLAIRE', schoolTxtX, y + 9.5);

        // Ligne or sous le header
        doc.setDrawColor(...C.gold);
        doc.setLineWidth(0.3);
        gs(0.65);
        doc.line(x, y + hH, x + cardW * 0.47, y + hH);
        gs(1);


        // Badge année scolaire
        const bX = x + 3.5;
        const bY = y + hH + 2;
        doc.setFillColor(...C.gold);
        gs(0.13);
        doc.roundedRect(bX, bY, 22, 4, 1, 1, 'F');
        gs(1);
        doc.setDrawColor(...C.gold);
        doc.setLineWidth(0.18);
        doc.roundedRect(bX, bY, 22, 4, 1, 1, 'S');
        doc.setTextColor(...C.gold);
        doc.setFontSize(3.5);
        doc.setFont('helvetica', 'bold');
        doc.text(`AN. ${schoolYear}`, bX + 11, bY + 2.8, { align: 'center' });

        // ── 6. PHOTO ÉLÈVE ──────────────────────────────────────────
        const phW = 20;
        const phH = 26;
        const phX = x + 3.5;
        const phY = y + hH + 8;

        doc.setFillColor(...C.slate);
        doc.roundedRect(phX, phY, phW, phH, 2, 2, 'F');
        doc.setDrawColor(...C.gold);
        doc.setLineWidth(0.55);
        doc.roundedRect(phX, phY, phW, phH, 2, 2, 'S');

        if (student.photoUrl) {
            try {
                const b64 = await imageUrlToBase64(student.photoUrl);
                if (b64) doc.addImage(b64, 'JPEG', phX + 0.4, phY + 0.4, phW - 0.8, phH - 0.8);
            } catch { /* silencieux */ }
        } else {
            const initials = `${student.prenom.charAt(0)}${student.nom.charAt(0)}`.toUpperCase();
            doc.setTextColor(...C.gold);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(initials, phX + phW / 2, phY + phH / 2 + 3, { align: 'center' });
        }

        // Pastille sécurité
        doc.setFillColor(...C.gold);
        doc.circle(phX + phW - 1, phY + phH - 1, 2, 'F');
        doc.setTextColor(...C.dark);
        doc.setFontSize(3);
        doc.setFont('helvetica', 'bold');
        doc.text('OK', phX + phW - 1, phY + phH - 0.3, { align: 'center' });

        // ── 7. INFORMATIONS ÉLÈVE (colonne droite) ──────────────────
        const iX    = x + cardW * 0.54;
        const iMaxW = cardW * 0.42;

        doc.setTextColor(...C.violet);
        doc.setFontSize(4.5);
        doc.setFont('helvetica', 'bold');
        doc.text('IDENTITE ELEVE', iX, y + 5.2);

        const fullName = `${student.prenom} ${student.nom}`.toUpperCase();
        doc.setTextColor(...C.white);
        let nFS = 10;
        if (fullName.length > 25) nFS = 7;
        else if (fullName.length > 18) nFS = 8;
        doc.setFontSize(nFS);
        const nLines = doc.splitTextToSize(fullName, iMaxW);
        doc.text(nLines.slice(0, 2), iX, y + 10.5);

        // Badge classe
        const tY = y + 21;
        doc.setFontSize(8);
        const cW = Math.max(doc.getTextWidth(student.classe) + 5, 13);
        doc.setFillColor(...C.gold);
        doc.roundedRect(iX, tY, cW, 5.5, 1.5, 1.5, 'F');
        doc.setTextColor(...C.dark);
        doc.setFont('helvetica', 'bold');
        doc.text(student.classe, iX + cW / 2, tY + 4.2, { align: 'center' });

        // Séparateur or
        doc.setDrawColor(...C.gold);
        doc.setLineWidth(0.18);
        gs(0.35);
        doc.line(iX, tY + 7.5, iX + iMaxW * 0.7, tY + 7.5);
        gs(1);

        // Matricule
        doc.setTextColor(...C.dim);
        doc.setFontSize(4);
        doc.setFont('helvetica', 'bold');
        doc.text('MATRICULE', iX, tY + 11.5);
        const matStr = student.adsn ? student.adsn.toUpperCase() : 'À PRÉCISER';
        doc.setFontSize(6);
        const mW = doc.getTextWidth(matStr) + 2.5;
        doc.setFillColor(...C.white);
        gs(0.06);
        doc.roundedRect(iX, tY + 12.3, mW, 3.8, 0.8, 0.8, 'F');
        gs(1);
        doc.setTextColor(...C.silver);
        doc.text(matStr, iX + 1.2, tY + 15.3);

        // Contact
        doc.setTextColor(...C.dim);
        doc.setFontSize(4);
        doc.setFont('helvetica', 'bold');
        doc.text('CONTACT', iX, tY + 20);
        doc.setTextColor(...C.silver);
        doc.setFontSize(7);
        doc.text(student.telephone || '—', iX, tY + 23.5);

        // ── 8. QR CODE ──────────────────────────────────────────────
        const qrMM  = 16;
        const qrPad = 1;
        const qrX2  = x + cardW - qrMM - qrPad * 2 - 2;
        const qrY2  = y + cardH - qrMM - qrPad * 2 - 5.5;

        doc.setFillColor(...C.white);
        doc.roundedRect(qrX2, qrY2, qrMM + qrPad * 2, qrMM + qrPad * 2, 1.5, 1.5, 'F');

        const qrDataURL = await buildQRDataURL(student.id);
        doc.addImage(qrDataURL, 'PNG', qrX2 + qrPad, qrY2 + qrPad, qrMM, qrMM, undefined, 'NONE');

        doc.setTextColor(...C.dim);
        doc.setFontSize(3);
        doc.setFont('helvetica', 'bold');
        doc.text('SCAN', qrX2 + qrPad + qrMM / 2, qrY2 + qrMM + qrPad * 2 + 1, { align: 'center' });

        // ── 9. FOOTER dégradé or / slate ────────────────────────────
        const fH = 5;
        const fY = y + cardH - fH;

        doc.setFillColor(...C.gold);
        doc.rect(x, fY, cardW * 0.50, fH, 'F');
        doc.setFillColor(...C.slate);
        doc.rect(x + cardW * 0.50, fY, cardW * 0.50, fH, 'F');
        doc.setDrawColor(...C.dark);
        doc.setLineWidth(0.08);
        doc.roundedRect(x, y, cardW, cardH, 2, 2, 'S');

        let fTxt = `Retourner a l'admin si trouvee  •  ${schoolName.toUpperCase()}`;
        const maxFW = cardW * 0.47;
        doc.setFontSize(3);
        doc.setFont('helvetica', 'bold');
        while (doc.getTextWidth(fTxt) > maxFW && fTxt.length > 8) fTxt = fTxt.slice(0, -1);
        doc.setTextColor(...C.dark);
        doc.text(fTxt, x + 3, fY + 3.3);

        cardIndex++;
        onProgress(Math.round((cardIndex / total) * 100));
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
