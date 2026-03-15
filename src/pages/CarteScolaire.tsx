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
    schoolName: string;
    schoolYear: string;
    schoolLogo: string | null;
}

const CarteEleve: React.FC<CarteProps> = ({
    nom, prenom, classe, id, schoolName, schoolYear, schoolLogo,
}) => {
    const nomComplet = `${prenom} ${nom}`.toUpperCase();

    return (
        // Carte 321×204 px = proportions exactes 85×54mm
        <div style={{
            width: 321, height: 204, flexShrink: 0, position: 'relative', overflow: 'hidden',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #0f2645 0%, #1a3a6a 55%, #1e40af 100%)',
            fontFamily: 'Arial, Helvetica, sans-serif',
        }}>
            {/* Contenu */}
            <div style={{ position:'relative', zIndex:10, height:'100%', display:'flex', flexDirection:'column', padding:10 }}>

                {/* En-tête */}
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
                    {schoolLogo ? (
                        <img src={schoolLogo} alt="Logo" style={{
                            width:28, height:28, borderRadius:6, objectFit:'contain',
                            background:'rgba(255,255,255,0.95)', padding:2,
                        }} />
                    ) : (
                        <div style={{ width:28, height:28, borderRadius:6, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <CreditCard style={{ width:14, height:14, color:'white' }} />
                        </div>
                    )}
                    <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ color:'white', fontSize:8, fontWeight:'bold', margin:0,
                            textTransform:'uppercase', letterSpacing:0.4,
                            overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                            {schoolName}
                        </p>
                        <p style={{ color:'#93c5fd', fontSize:6.5, margin:0 }}>Carte scolaire {schoolYear}</p>
                    </div>
                </div>

                {/* Séparateur */}
                <div style={{ height:1, background:'rgba(255,255,255,0.12)', marginBottom:6 }} />

                {/* Corps */}
                <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>

                    {/* Infos élève */}
                    <div style={{ flex:1, minWidth:0, maxWidth:200 }}>
                        <p style={{
                            color:'white', margin:0, marginBottom:4, fontWeight:'bold', lineHeight:1.25,
                            fontSize: nomComplet.length > 22 ? 8.5 : nomComplet.length > 16 ? 10 : 11.5,
                            wordBreak:'break-word', overflowWrap:'break-word',
                        }}>
                            {nomComplet}
                        </p>
                        <span style={{
                            background:'rgba(59,130,246,0.35)', color:'#bfdbfe',
                            fontSize:7, fontWeight:'bold', padding:'1px 6px',
                            borderRadius:10, border:'1px solid rgba(147,197,253,0.25)',
                            display:'inline-block', marginBottom:4,
                        }}>
                            {classe}
                        </span>
                        <p style={{ color:'#60a5fa', fontSize:6, margin:0 }}>
                            Scanner le QR · YZOMACAMB
                        </p>
                    </div>

                    {/* QR Code — zone fixe, jamais masquée */}
                    {/* Rendu en 256px, réduit à 72px via CSS = net sur Retina */}
                    <div style={{
                        width:72, height:72, flexShrink:0,
                        background:'white', borderRadius:8, padding:3,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        boxShadow:'0 2px 10px rgba(0,0,0,0.4)',
                        overflow:'hidden',
                    }}>
                        <QRCodeCanvas
                            value={id}
                            size={256}        // rendu interne haute résolution
                            level="H"         // correction d'erreur 30%
                            bgColor="#FFFFFF"
                            fgColor="#000000" // noir pur = contraste max
                            marginSize={2}    // quiet zone ISO
                            style={{ width:66, height:66 }} // réduit par CSS → net
                        />
                    </div>
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
        margin: 4,
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
    students: Array<{ id: string; nom: string; prenom: string; classe: string }>,
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
        // ── Position dans la page ──────────────────────────
        const posOnPage = cardIndex % (cols * rowsMax);
        if (posOnPage === 0 && cardIndex > 0) {
            doc.addPage();
        }

        const col  = posOnPage % cols;
        const row  = Math.floor(posOnPage / cols);
        const x    = marginX + col * (cardW + gapX);
        const y    = marginY + row * (cardH + gapY);

        // ── Fond de la carte (dégradé simulé) ─────────────
        // Bg bleu foncé principal
        doc.setFillColor(15, 38, 69);
        doc.roundedRect(x, y, cardW, cardH, 2.5, 2.5, 'F');
        // Zone dégradée bleu roi à droite
        doc.setFillColor(30, 64, 170);
        doc.roundedRect(x + 50, y, cardW - 50, cardH, 2.5, 2.5, 'F');
        // Raccord net au milieu
        doc.setFillColor(22, 51, 115);
        doc.rect(x + 50, y, 5, cardH, 'F');



        // ── Ligne séparatrice horizontale ─────────────────
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.1);
        doc.line(x + 2, y + 13, x + cardW - 2, y + 13);

        // ── Logo ──────────────────────────────────────────
        const logoMM  = 8;
        const logoX   = x + 2.5;
        const logoY   = y + 2.5;

        if (logoData) {
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(logoX, logoY, logoMM, logoMM, 1.2, 1.2, 'F');
            doc.addImage(logoData, 'PNG', logoX, logoY, logoMM, logoMM);
        } else {
            doc.setFillColor(37, 99, 235);
            doc.roundedRect(logoX, logoY, logoMM, logoMM, 1.2, 1.2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(4.5);
            doc.setFont('helvetica', 'bold');
            doc.text('EDU', logoX + logoMM / 2, logoY + 5, { align: 'center' });
        }

        // ── Nom établissement ──────────────────────────────
        const txtX      = logoX + logoMM + 1.5;
        const maxNameW  = cardW - logoMM - 4 - 28; // réserve zone QR
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'bold');
        const schoolLine = doc.splitTextToSize(schoolName.toUpperCase(), maxNameW)[0];
        doc.text(schoolLine, txtX, logoY + 3.5);
        doc.setFontSize(4.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(147, 197, 253);
        doc.text(`Carte scolaire ${schoolYear}`, txtX, logoY + 7.5);

        // ── QR Code — zone fixe bas-droite ────────────────
        const qrMM    = 22;   // 22mm dans le PDF
        const qrX     = x + cardW - qrMM - 2.5;
        const qrY     = y + cardH - qrMM - 2.5;
        const qrPad   = 1.0;  // marge blanche autour du QR dans le PDF

        // Fond blanc (quiet zone supplémentaire)
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(qrX - qrPad, qrY - qrPad, qrMM + qrPad * 2, qrMM + qrPad * 2, 1.5, 1.5, 'F');

        // QR Code haute résolution — aucune compression (NONE)
        const qrDataURL = await buildQRDataURL(student.id);
        doc.addImage(qrDataURL, 'PNG', qrX, qrY, qrMM, qrMM, undefined, 'NONE');

        // ── Nom & Prénom de l'élève ────────────────────────
        const nameMaxW   = cardW - qrMM - 6;
        const fullName   = `${student.prenom} ${student.nom}`.toUpperCase();
        const nameLines  = doc.splitTextToSize(fullName, nameMaxW);
        const nameFontSz = fullName.length > 22 ? 7 : fullName.length > 16 ? 8 : 9;
        const nameY      = y + 17;

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(nameFontSz);
        nameLines.slice(0, 2).forEach((line: string, i: number) => {
            doc.text(line, x + 2.5, nameY + i * (nameFontSz * 0.38));
        });

        // ── Classe ────────────────────────────────────────
        const classeOffsetY = nameLines.slice(0, 2).length * (nameFontSz * 0.38);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(147, 197, 253);
        doc.text(`CLASSE : ${student.classe}`, x + 2.5, nameY + classeOffsetY + 3.5);

        // ── Pied de carte ─────────────────────────────────
        doc.setFontSize(4);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(96, 165, 250);
        doc.text('Scanner le QR pour vérifier', x + 2.5, y + cardH - 2);

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
                                        schoolName={schoolName} schoolYear={schoolYear} schoolLogo={schoolLogo}
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
