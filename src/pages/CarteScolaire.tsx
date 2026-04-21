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
        <div style={{
            width: 320, height: 204, // Proportions 85x54mm (approx)
            backgroundImage: 'url(/card_bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: 12, overflow: 'hidden',
            position: 'relative', fontFamily: '"Inter", sans-serif',
            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
            userSelect: 'none'
        }}>
            {/* Le fond et la barre latérale sont maintenant dans l'image de template */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: 49,
                display: 'flex', alignItems: 'center', padding: '0 15px', zIndex: 10
            }}>
                <div style={{ width: 34, height: 34, background: 'white', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 3 }}>
                   {schoolLogo ? <img src={schoolLogo} style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain' }} /> : <span style={{ color:'#0F172A', fontWeight:900, fontSize:10 }}>ID</span>}
                </div>
                <div style={{ marginLeft: 12 }}>
                    <h2 style={{ color: 'white', margin: 0, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', lineHeight: 1 }}>{schoolName}</h2>
                    <p style={{ color: '#EAB308', margin: '2px 0 0 0', fontSize: 7, fontWeight: 700 }}>
                        OFFICIEL {schoolYear} <span style={{ color: '#94A3B8', fontWeight: 600 }}>· CARTES Scolaire</span>
                    </p>
                </div>
            </div>

            {/* 3. Photo Passeport (Position fixée au mm près) */}
            <div style={{
                position: 'absolute', top: 64, left: 60, // PhotoX=16mm -> 59px, PhotoY=17mm -> 63px
                width: 68, height: 82, // 18x22mm
                borderRadius: 4, overflow: 'hidden',
                border: '1.5px solid #0F172A',
                background: '#F1F5F9', zIndex: 10
            }}>
                {photoUrl ? (
                    <img src={photoUrl} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                         <User size={24} />
                    </div>
                )}
                {/* Sceau de sécurité photo */}
                <div style={{ position: 'absolute', bottom: 4, right: 4, width: 10, height: 10, background: '#EAB308', borderRadius: '50%', border: '1.5px solid white' }} />
            </div>

            {/* 4. Texte (Identité) */}
            <div style={{
                position: 'absolute', top: 64, left: 140, width: 85, // infoStartX=38mm -> 141px
                display: 'flex', flexDirection: 'column', zIndex: 10
            }}>
                <p style={{ fontSize: 6, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 2 }}>Nom & Prénoms</p>
                <h3 style={{
                    color: '#0F172A', margin: 0, marginBottom: 12, fontWeight: 900, 
                    fontSize: nomComplet.length > 20 ? 11 : 13,
                    lineHeight: 1.1, textTransform: 'uppercase'
                }}>
                    {nomComplet}
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                        <p style={{ fontSize: 6, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 1 }}>Classe</p>
                        <span style={{
                            background: '#0F172A', color: 'white', fontSize: 9, fontWeight: 900, 
                            padding: '2px 10px', borderRadius: 4, display: 'inline-block'
                        }}>
                            {classe}
                        </span>
                    </div>
                    <div>
                        <p style={{ fontSize: 6, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 1 }}>Contact</p>
                        <span style={{ fontSize: 9, fontWeight: 900, color: '#0F172A' }}>{telephone || '71517633'}</span>
                    </div>
                </div>
            </div>

            {/* 5. QR Code (Position fixée) */}
            <div style={{
                position: 'absolute', top: 68, left: 226, // qrX=60mm -> 222px
                width: 79, height: 79, background: 'white', borderRadius: 8, padding: 5,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: '1px solid #E2E8F0', zIndex: 10
            }}>
                <QRCodeCanvas value={id} size={60} level="H" bgColor="#FFFFFF" fgColor="#0F172A" />
                <p style={{ fontSize: 5, color: '#94A3B8', marginTop: 4, fontWeight: 900, textTransform: 'uppercase' }}>Scan Sécurisé</p>
            </div>

            {/* 6. Footer (Pied de page) */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, width: '100%', height: 22,
                background: '#0F172A', borderTop: '1.5px solid #EAB308', zIndex: 11, 
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <p style={{ color: 'white', fontSize: 6, fontWeight: 600, margin: 0 }}>
                    Si cette carte ne vous appartient pas, veuillez la retourner à l'administration.
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

    // Charger le fond template réaliste
    let templateBase64 = '';
    try {
        templateBase64 = await imageUrlToBase64('/card_bg.png');
    } catch (e) {
        console.warn('Impossible de charger le template background');
    }

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

        // ── Fond de la carte (Image Template Réaliste) ─────
        if (templateBase64) {
            doc.addImage(templateBase64, 'PNG', x, y, cardW, cardH);
        } else {
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(x, y, cardW, cardH, 4, 4, 'F');
        }

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

        if (student.photoUrl) {
            try {
                const b64 = await imageUrlToBase64(student.photoUrl);
                if (b64) {
                    doc.addImage(b64, 'JPEG', x + photoOffsetX + 0.2, photoY + 0.2, photoW - 0.4, photoH - 0.4);
                }
            } catch (err) {
                console.warn('Erreur chargement photo PDF:', err);
            }
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
        doc.text("NOM & PRÉNOMS", infoStartX, photoY + 1);

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fullName.length > 20 ? 8 : 9);
        const nameLines = doc.splitTextToSize(fullName, nameMaxW);
        doc.text(nameLines, infoStartX, photoY + 5);

        // ── Tags (Classe & Contact) ─────────────────────────────────
        const tagY = photoY + 13;
        
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(3.5);
        doc.text("CLASSE", infoStartX, tagY);
        
        doc.setFillColor(15, 23, 42);
        doc.roundedRect(infoStartX, tagY + 1, 16, 4.5, 1.5, 1.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.text(student.classe, infoStartX + 8, tagY + 4.2, { align: 'center' });

        const phoneY = tagY + 10;
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(3.5);
        doc.text("CONTACT", infoStartX, phoneY);
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(5);
        doc.text(student.telephone || '71517633', infoStartX, phoneY + 4);

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
        const disclaimer = "Si cette carte ne vous appartient pas, veuillez la retourner à l'administration.";
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
