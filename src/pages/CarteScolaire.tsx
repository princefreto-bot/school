// ============================================================
// CARTE SCOLAIRE — Génération optimisée pour impression PDF
// QR Code haute qualité, format 85×54mm, 8 cartes/page A4
// ============================================================
import React, { useState, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import {
    CreditCard, Search, Download, Printer, X, Filter,
    CheckCircle, Loader2, ChevronDown
} from 'lucide-react';

// ── Dimensions carte ISO 85×54mm ─────────────────────────────
// En pixels pour l'affichage écran (ratio 1mm ≈ 3.7795px)
const CARD_W_PX = 321; // 85mm
const CARD_H_PX = 204; // 54mm

// ── Composant Carte unitaire (affichage écran) ───────────────
interface CarteProps {
    nom: string;
    prenom: string;
    classe: string;
    id: string;
    schoolName: string;
    schoolYear: string;
    schoolLogo: string | null;
}

const CarteEleve: React.FC<CarteProps & { cardRef?: React.RefObject<HTMLDivElement> }> = ({
    nom, prenom, classe, id, schoolName, schoolYear, schoolLogo, cardRef
}) => {
    // Tronquer le nom pour l'affichage si trop long
    const nomComplet = `${prenom} ${nom}`.toUpperCase();
    const nomTruncated = nomComplet.length > 28 ? nomComplet.slice(0, 28) + '...' : nomComplet;

    return (
        <div
            ref={cardRef}
            style={{
                width: `${CARD_W_PX}px`,
                height: `${CARD_H_PX}px`,
                background: 'linear-gradient(135deg, #0f2645 0%, #1e3a5f 60%, #1e40af 100%)',
                fontFamily: 'Arial, Helvetica, sans-serif',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '12px',
                flexShrink: 0,
            }}
        >
            {/* Décoration cercles */}
            <div style={{
                position: 'absolute', top: -24, right: -24,
                width: 80, height: 80,
                borderRadius: '50%', background: 'rgba(96,165,250,0.12)'
            }} />
            <div style={{
                position: 'absolute', bottom: -20, left: -20,
                width: 64, height: 64,
                borderRadius: '50%', background: 'rgba(99,102,241,0.12)'
            }} />

            {/* Contenu principal */}
            <div style={{
                position: 'relative', zIndex: 10, height: '100%',
                display: 'flex', flexDirection: 'column', padding: '10px'
            }}>
                {/* En-tête : Logo + Nom établissement */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    {schoolLogo ? (
                        <img
                            src={schoolLogo}
                            alt="Logo"
                            style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.9)', padding: 2, objectFit: 'contain' }}
                        />
                    ) : (
                        <div style={{
                            width: 28, height: 28, borderRadius: 6,
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <CreditCard style={{ width: 14, height: 14, color: 'white' }} />
                        </div>
                    )}
                    <div>
                        <p style={{ color: 'white', fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, margin: 0, maxWidth: 170, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                            {schoolName}
                        </p>
                        <p style={{ color: '#93c5fd', fontSize: 7, margin: 0 }}>Carte scolaire {schoolYear}</p>
                    </div>
                </div>

                {/* Séparateur */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.15)', marginBottom: 6 }} />

                {/* Corps : Infos + QR Code */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                    {/* Zone texte élève — flex:1 mais avec max-width pour ne pas empiéter sur QR */}
                    <div style={{ flex: 1, minWidth: 0, maxWidth: 195 }}>
                        {/* Nom élève avec gestion des noms longs */}
                        <p style={{
                            color: 'white', fontSize: nomComplet.length > 20 ? 9 : 11,
                            fontWeight: 'bold', margin: 0, marginBottom: 3,
                            lineHeight: 1.2, wordBreak: 'break-word', overflowWrap: 'break-word',
                            maxWidth: '100%'
                        }}>
                            {nomTruncated}
                        </p>

                        {/* Classe */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                            <span style={{
                                background: 'rgba(59,130,246,0.3)', color: '#93c5fd',
                                fontSize: 7, fontWeight: 'bold', padding: '1px 5px',
                                borderRadius: 10, border: '1px solid rgba(147,197,253,0.3)'
                            }}>
                                {classe}
                            </span>
                        </div>

                        {/* Bande inférieure */}
                        <p style={{ color: '#60a5fa', fontSize: 6, margin: 0 }}>
                            Scanner pour détails · YZOMACAMB
                        </p>
                    </div>

                    {/* Zone QR Code — taille FIXE, ne peut jamais être masquée */}
                    <div style={{
                        width: 72, height: 72, flexShrink: 0,
                        background: 'white', borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}>
                        <QRCodeCanvas
                            value={id}
                            size={64}
                            level="H"
                            bgColor="#FFFFFF"
                            fgColor="#0f172a"
                            marginSize={0}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Génération QR haute résolution via qrcode (canvas offscreen) ──────
/**
 * Génère une image base64 du QR Code à la résolution maximale
 * pour garantir une parfaite scannabilité après impression.
 * - errorCorrectionLevel H : 30% correction d'erreur (max)
 * - margin 4 : zone blanche ISO recommandée (4 modules de quiet zone)
 * - Fond blanc #ffffff pur, encre noire #000000 pur — contraste optimal
 */
const generateHighResQRDataURL = (id: string, sizePx: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        import('qrcode').then(({ default: QRCode }) => {
            QRCode.toCanvas(canvas, id, {
                width: sizePx,
                margin: 4,
                color: { dark: '#000000ff', light: '#ffffffff' },
                errorCorrectionLevel: 'H',
            }, (err) => {
                if (err) { reject(err); return; }
                // qualité 1.0 = aucune compression JPEG — PNG est sans perte
                resolve(canvas.toDataURL('image/png', 1.0));
            });
        }).catch(reject);
    });
};

// ── Génération logo base64 à la bonne taille ─────────────────
const resizeLogo = (src: string, size: number): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, size, size);
            // Centrer l'image dans le carré en conservant les proportions
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

// ── Génération PDF A4 — 8 cartes par page ────────────────────
// Dimensions en mm : carte 85×54mm, marges, espacement
const generateCartesPDF = async (
    students: Array<{ id: string; nom: string; prenom: string; classe: string }>,
    schoolName: string,
    schoolYear: string,
    schoolLogo: string | null,
    onProgress?: (n: number) => void
): Promise<void> => {
    if (!students.length) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // A4 : 210×297mm
    // 8 cartes (2 colonnes × 4 lignes), marges et espacement
    const pageW = 210;
    const cardW = 85;  // mm
    const cardH = 54;  // mm
    const cols = 2;
    const rows = 4;
    const marginX = (pageW - cols * cardW) / 2; // centrage horizontal ≈ 20mm
    const marginTop = 10;
    const gapX = 0; // pas d'espace entre colonnes (déjà centré)
    const gapY = 4; // 4mm entre lignes

    // Résolution QR en mm→px pour impression 300 DPI
    // 25mm QR × 300dpi / 25.4 ≈ 295px
    const QR_SIZE_PX = 300;
    // Logo : 10mm × 300dpi/25.4 ≈ 118px
    const LOGO_SIZE_PX = 118;

    // Pré-rendre le logo redimensionné
    let logoData = '';
    if (schoolLogo && schoolLogo.startsWith('data:image')) {
        logoData = await resizeLogo(schoolLogo, LOGO_SIZE_PX);
    }

    let cardIndex = 0;
    const total = students.length;

    for (const student of students) {
        onProgress?.(Math.round((cardIndex / total) * 100));

        // Calculer position sur la page
        const posOnPage = cardIndex % (cols * rows);
        if (posOnPage === 0 && cardIndex > 0) {
            doc.addPage();
        }

        const col = posOnPage % cols;
        const row = Math.floor(posOnPage / cols);
        const x = marginX + col * (cardW + gapX);
        const y = marginTop + row * (cardH + gapY);

        // ── Fond dégradé simulé (rectangle + overlay) ──────
        // Fond principal bleu foncé
        doc.setFillColor(15, 38, 69);
        doc.roundedRect(x, y, cardW, cardH, 3, 3, 'F');

        // Accent bleu sur la partie droite
        doc.setFillColor(30, 64, 175);
        doc.roundedRect(x + cardW * 0.55, y, cardW * 0.45, cardH, 3, 3, 'F');
        // Re-appliquer le fond sur le milieu pour effacer les coins ronds du bloc droit
        doc.setFillColor(15, 38, 69);
        doc.rect(x + cardW * 0.55, y, cardW * 0.2, cardH, 'F');

        // Cercle décoratif haut-droite
        doc.setFillColor(30, 58, 138);
        doc.circle(x + cardW - 8, y + 8, 10, 'F');

        // ── Ligne séparatrice horizontale ──────────────────
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.15);
        doc.setGState(doc.GState({ opacity: 0.2 }));
        doc.line(x + 3, y + 14, x + cardW - 3, y + 14);
        doc.setGState(doc.GState({ opacity: 1 }));

        // ── Logo établissement ─────────────────────────────
        const logoX = x + 3;
        const logoY = y + 3;
        const logoMM = 8; // 8mm de côté dans le PDF

        if (logoData) {
            // Fond blanc arrondi pour le logo
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(logoX, logoY, logoMM, logoMM, 1.5, 1.5, 'F');
            doc.addImage(logoData, 'PNG', logoX, logoY, logoMM, logoMM);
        } else {
            // Placeholder logo
            doc.setFillColor(30, 58, 138);
            doc.roundedRect(logoX, logoY, logoMM, logoMM, 1.5, 1.5, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(5);
            doc.setFont('helvetica', 'bold');
            doc.text('EDU', logoX + logoMM / 2, logoY + logoMM / 2 + 1.5, { align: 'center' });
        }

        // ── Nom établissement ──────────────────────────────
        const textStartX = logoX + logoMM + 1.5;
        const availW = cardW - logoMM - 2 - 24 - 4; // réserve la zone QR
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        const schoolNameStr = schoolName.toUpperCase();
        const schoolNameTrunc = doc.splitTextToSize(schoolNameStr, availW)[0];
        doc.text(schoolNameTrunc, textStartX, logoY + 4);

        // Année scolaire
        doc.setTextColor(147, 197, 253);
        doc.setFontSize(5);
        doc.setFont('helvetica', 'normal');
        doc.text(`Carte scolaire ${schoolYear}`, textStartX, logoY + 8.5);

        // ── QR CODE — Zone fixe à droite ──────────────────
        const qrMM = 24; // 24mm de côté dans le PDF (grande taille)
        const qrX = x + cardW - qrMM - 3;
        const qrY = y + cardH - qrMM - 3;

        // Fond blanc pour le QR (zone sécurisée indispensable)
        const qrPadding = 1.2;
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(qrX - qrPadding, qrY - qrPadding, qrMM + qrPadding * 2, qrMM + qrPadding * 2, 2, 2, 'F');

        // Générer et insérer le QR haute résolution
        const qrDataUrl = await generateHighResQRDataURL(student.id, QR_SIZE_PX);
        doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrMM, qrMM, undefined, 'NONE'); // NONE = pas de compression

        // ── Nom & Prénom élève ──────────────────────────────
        const infoX = x + 3;
        const infoY = y + 18;
        const infoMaxW = cardW - qrMM - 8;

        const fullName = `${prenom} ${nom}`.toUpperCase();
        const nameLines = doc.splitTextToSize(fullName, infoMaxW);

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');

        // Adapter la taille selon la longueur du nom
        const nameFontSize = fullName.length > 24 ? 7 : 8.5;
        doc.setFontSize(nameFontSize);

        // Limiter à 2 lignes max
        const displayLines = nameLines.slice(0, 2);
        displayLines.forEach((line: string, i: number) => {
            doc.text(line, infoX, infoY + i * (nameFontSize * 0.4));
        });

        // ── Classe ────────────────────────────────────────
        const classeY = infoY + displayLines.length * (nameFontSize * 0.4) + 3.5;
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(59, 130, 246);
        doc.setTextColor(147, 197, 253);
        const classLabel = `CLASSE : ${classe}`;
        doc.text(classLabel, infoX, classeY);

        // ── Texte pied de carte ───────────────────────────
        doc.setFontSize(4.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(96, 165, 250);
        doc.text('Scanner le QR pour vérifier', infoX, y + cardH - 3);

        cardIndex++;
    }

    onProgress?.(100);

    // Numérotation des pages
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Cartes scolaires ${schoolYear} — ${schoolName} — Page ${p}/${totalPages}`,
            105, 294, { align: 'center' }
        );
    }

    doc.save(`cartes_scolaires_${schoolYear.replace('/', '-')}.pdf`);
};

// ── Page principale ──────────────────────────────────────────
export const CarteScolaire: React.FC = () => {
    const students = useStore((s) => s.students);
    const schoolName = useStore((s) => s.schoolName);
    const schoolYear = useStore((s) => s.schoolYear);
    const schoolLogo = useStore((s) => s.schoolLogo);

    const [search, setSearch] = useState('');
    const [selectedClasse, setSelectedClasse] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [genMode, setGenMode] = useState<'all' | 'classe' | null>(null);

    const classes = [...new Set(students.map(s => s.classe))].sort();

    const filtered = students.filter(s => {
        const matchSearch = !search || `${s.prenom} ${s.nom} ${s.id} ${s.classe}`.toLowerCase().includes(search.toLowerCase());
        const matchClasse = !selectedClasse || s.classe === selectedClasse;
        return matchSearch && matchClasse;
    });

    // Génération PDF de toutes les cartes
    const handleGenerateAll = useCallback(async () => {
        if (generating) return;
        setGenerating(true);
        setProgress(0);
        setGenMode('all');
        try {
            await generateCartesPDF(
                filtered,
                schoolName,
                schoolYear,
                schoolLogo,
                setProgress
            );
        } finally {
            setGenerating(false);
            setGenMode(null);
        }
    }, [filtered, schoolName, schoolYear, schoolLogo, generating]);

    // Génération PDF d'une seule classe
    const handleGenerateClasse = useCallback(async (classe: string) => {
        if (generating) return;
        const classeStudents = students.filter(s => s.classe === classe);
        if (!classeStudents.length) return;
        setGenerating(true);
        setProgress(0);
        setGenMode('classe');
        try {
            await generateCartesPDF(
                classeStudents,
                schoolName,
                schoolYear,
                schoolLogo,
                setProgress
            );
        } finally {
            setGenerating(false);
            setGenMode(null);
        }
    }, [students, schoolName, schoolYear, schoolLogo, generating]);

    // Impression d'une carte unique
    const handlePrintOne = useCallback((studentId: string) => {
        const s = students.find(st => st.id === studentId);
        if (!s) return;
        // On génère un PDF d'une seule carte
        setGenerating(true);
        generateCartesPDF([s], schoolName, schoolYear, schoolLogo, setProgress)
            .finally(() => { setGenerating(false); setGenMode(null); });
    }, [students, schoolName, schoolYear, schoolLogo]);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* En-tête */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Cartes Scolaires</h2>
                        <p className="text-indigo-200 text-sm">Format 85×54 mm — QR Code haute qualité — Prêt pour impression</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold">{students.length}</p>
                        <p className="text-xs text-indigo-200">Total élèves</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold">{classes.length}</p>
                        <p className="text-xs text-indigo-200">Classes</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold">{Math.ceil(students.length / 8)}</p>
                        <p className="text-xs text-indigo-200">Pages PDF</p>
                    </div>
                </div>
            </div>

            {/* Barre d'actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    {/* Recherche */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher un élève..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* Filtre classe */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <select
                            value={selectedClasse}
                            onChange={(e) => setSelectedClasse(e.target.value)}
                            className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white appearance-none focus:ring-2 focus:ring-blue-500 outline-none sm:w-44"
                        >
                            <option value="">Toutes les classes</option>
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Bouton générer toutes les cartes */}
                    <button
                        onClick={handleGenerateAll}
                        disabled={generating || filtered.length === 0}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
                    >
                        {generating && genMode === 'all' ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {progress}%
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Générer cartes ({filtered.length})
                            </>
                        )}
                    </button>
                </div>

                {/* Progression */}
                {generating && (
                    <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Génération du PDF en cours...</span>
                            <span className="font-bold text-indigo-600">{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Génération par classe */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-indigo-500" />
                    Générer par classe
                </h3>
                <div className="flex flex-wrap gap-2">
                    {classes.map(classe => {
                        const count = students.filter(s => s.classe === classe).length;
                        return (
                            <button
                                key={classe}
                                onClick={() => handleGenerateClasse(classe)}
                                disabled={generating}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 disabled:opacity-50 text-gray-700 hover:text-indigo-700 rounded-lg text-xs font-medium transition-all"
                            >
                                <Download className="w-3 h-3" />
                                {classe}
                                <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">{count}</span>
                            </button>
                        );
                    })}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                    * 8 cartes par page A4 — Format ISO 85×54mm — QR Code niveau H (30% correction d'erreur)
                </p>
            </div>

            {/* Prévisualisation d'une carte sélectionnée */}
            {selectedStudent ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-gray-800">Prévisualisation de la carte</h3>
                        <button
                            onClick={() => setSelectedStudent(null)}
                            className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-lg hover:bg-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    {(() => {
                        const s = students.find(st => st.id === selectedStudent);
                        if (!s) return null;
                        return (
                            <div className="flex flex-col sm:flex-row items-start gap-6">
                                {/* Carte prévisualisation */}
                                <div className="flex flex-col gap-3">
                                    <p className="text-xs text-gray-500 font-medium">Aperçu écran (proportionnel 85×54mm)</p>
                                    <div style={{
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                                        borderRadius: 12,
                                        display: 'inline-block'
                                    }}>
                                        <CarteEleve
                                            nom={s.nom}
                                            prenom={s.prenom}
                                            classe={s.classe}
                                            id={s.id}
                                            schoolName={schoolName}
                                            schoolYear={schoolYear}
                                            schoolLogo={schoolLogo}
                                        />
                                    </div>
                                </div>

                                {/* Infos + action */}
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Détails</p>
                                        <div className="space-y-2">
                                            {[
                                                ['Nom', `${s.prenom} ${s.nom}`],
                                                ['Classe', s.classe],
                                                ['ID student', s.id.slice(0, 20) + '...'],
                                            ].map(([k, v]) => (
                                                <div key={k} className="flex items-center gap-2 text-sm">
                                                    <span className="text-gray-400 w-20 shrink-0">{k}</span>
                                                    <span className="font-medium text-gray-800 font-mono text-xs bg-gray-50 px-2 py-0.5 rounded">{v}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-gray-100 space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                                            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                            QR Code niveau H (30% correction d'erreur) — Scannable après impression
                                        </div>
                                        <button
                                            onClick={() => handlePrintOne(s.id)}
                                            disabled={generating}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all w-full justify-center"
                                        >
                                            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                                            Générer PDF (carte individuelle)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            ) : (
                /* Liste des élèves */
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-gray-500 font-medium">
                            {filtered.length} élève(s) — cliquer pour prévisualiser
                        </p>
                        {filtered.length === 0 && (
                            <p className="text-xs text-amber-600">Aucun élève trouvé</p>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[500px] overflow-y-auto">
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
                    </div>
                </div>
            )}
        </div>
    );
};
