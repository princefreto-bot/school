// ============================================================
// CARTE ENSEIGNANT — Badge scannable pour le pointage entrée/sortie
// QR Code haute résolution (personnel_id), format ISO 85×54mm, 8/A4
// Calqué sur CarteScolaire.tsx — accent teal pour se distinguer au
// premier coup d'œil des cartes élèves (accent amber) côté scan.
// ============================================================
import React, { useEffect, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { personnelApi } from '../services/personnelApi';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import QRCodeLib from 'qrcode';
import {
    CreditCard, Search, Download, Printer, X,
    CheckCircle, Loader2, AlertCircle, Users, Info
} from 'lucide-react';

interface PersonnelRow {
    id: string;
    nom: string;
    role: string;
    telephone?: string;
    matricule?: string | null;
}

const TEAL = '#0D9488';

// ── Carte — affichage écran ──
const CartePersonnel: React.FC<{
    nom: string; role: string; id: string; telephone?: string; matricule?: string | null;
    schoolName: string; schoolYear: string; schoolLogo: string | null;
}> = ({ nom, role, id, telephone, matricule, schoolName, schoolYear, schoolLogo }) => {
    const nomComplet = nom.toUpperCase();
    const initials = nom.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '—';

    return (
        <div style={{
            width: 360, height: 228, borderRadius: 10, overflow: 'hidden', position: 'relative',
            fontFamily: '"Poppins", sans-serif', boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.05)',
            userSelect: 'none', background: '#FFFFFF', border: '1px solid #E5E7EB',
        }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: TEAL }} />

            <div style={{ position: 'absolute', top: 10, left: 12, right: 12, height: 30, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                    width: 26, height: 26, borderRadius: 4, background: '#FFFFFF', border: `1px solid ${TEAL}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2, flexShrink: 0,
                }}>
                    {schoolLogo
                        ? <img src={schoolLogo} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        : <span style={{ color: TEAL, fontWeight: 900, fontSize: 10 }}>ID</span>}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                        color: '#111827', fontWeight: 800, lineHeight: 1.1,
                        fontSize: schoolName.length > 22 ? 9 : schoolName.length > 14 ? 10.5 : 12,
                        textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{schoolName}</div>
                    <div style={{ color: TEAL, fontSize: 7.5, fontWeight: 800, marginTop: 1, letterSpacing: 0.6 }}>
                        CARTE PERSONNEL · {schoolYear}
                    </div>
                </div>
            </div>

            <div style={{ position: 'absolute', top: 46, left: 12, right: 12, height: 1, background: '#E5E7EB' }} />

            <div style={{
                position: 'absolute', top: 54, left: 12, width: 60, height: 78, borderRadius: 4,
                overflow: 'hidden', border: '1px solid #E5E7EB', background: '#F9FAFB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <span style={{ color: '#9CA3AF', fontSize: 22, fontWeight: 800 }}>{initials}</span>
            </div>

            <div style={{ position: 'absolute', top: 54, left: 82, right: 108 }}>
                <div style={{
                    color: '#111827', fontWeight: 900,
                    fontSize: nomComplet.length > 28 ? 11 : nomComplet.length > 18 ? 13 : 14,
                    lineHeight: 1.15, textTransform: 'uppercase',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    marginBottom: 8,
                }}>{nomComplet}</div>

                <div style={{ marginBottom: 6 }}>
                    <div style={{ color: '#6B7280', fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Fonction</div>
                    <div style={{ color: '#111827', fontSize: 12, fontWeight: 800, textTransform: 'capitalize' }}>{role}</div>
                </div>

                <div style={{ marginBottom: 6 }}>
                    <div style={{ color: '#6B7280', fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Matricule</div>
                    <div style={{
                        color: '#111827', fontSize: 9, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 0.4,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{matricule ? matricule.toUpperCase() : '—'}</div>
                </div>

                <div>
                    <div style={{ color: '#6B7280', fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Contact</div>
                    <div style={{ color: '#111827', fontSize: 9.5, fontWeight: 700 }}>{telephone || '—'}</div>
                </div>
            </div>

            <div style={{ position: 'absolute', top: 54, right: 12, width: 92, height: 92, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <QRCodeCanvas value={id} size={90} level="H" bgColor="#FFFFFF" fgColor="#111827" />
            </div>

            <div style={{ position: 'absolute', bottom: 6, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{
                    color: '#9CA3AF', fontSize: 6.5, fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1,
                }}>Badge personnel — usage professionnel</p>
                <p style={{ color: TEAL, fontSize: 6.5, fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: 0.6, marginLeft: 8 }}>
                    DGhubSchool
                </p>
            </div>
        </div>
    );
};

const buildQRDataURL = async (personnelId: string): Promise<string> => {
    return QRCodeLib.toDataURL(personnelId, {
        type: 'image/png', width: 400, margin: 1, errorCorrectionLevel: 'H',
        color: { dark: '#000000', light: '#ffffff' },
    });
};

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

const generateCartesPDF = async (
    personnel: PersonnelRow[],
    schoolName: string,
    schoolYear: string,
    schoolLogo: string | null,
    onProgress: (n: number) => void,
): Promise<void> => {
    if (!personnel.length) throw new Error('Aucun membre du personnel sélectionné');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const cardW = 85, cardH = 54, cols = 2, rowsMax = 4, pageW = 210, pageH = 297, gapX = 6, gapY = 8;
    const marginX = (pageW - cols * cardW - (cols - 1) * gapX) / 2;
    const marginY = (pageH - rowsMax * cardH - (rowsMax - 1) * gapY) / 2;

    let logoData = '';
    if (schoolLogo && schoolLogo.startsWith('data:image')) {
        logoData = await resizeLogoForPDF(schoolLogo, 120);
    }

    const total = personnel.length;
    let cardIndex = 0;

    const C = {
        white: [255, 255, 255] as [number, number, number],
        border: [229, 231, 235] as [number, number, number],
        text: [17, 24, 39] as [number, number, number],
        muted: [107, 114, 128] as [number, number, number],
        faint: [156, 163, 175] as [number, number, number],
        teal: [13, 148, 136] as [number, number, number],
        photoBg: [249, 250, 251] as [number, number, number],
    };

    for (const p of personnel) {
        const posOnPage = cardIndex % (cols * rowsMax);
        if (posOnPage === 0 && cardIndex > 0) doc.addPage();

        const col = posOnPage % cols;
        const row = Math.floor(posOnPage / cols);
        const x = marginX + col * (cardW + gapX);
        const y = marginY + row * (cardH + gapY);

        doc.setFillColor(...C.white);
        doc.roundedRect(x, y, cardW, cardH, 2, 2, 'F');
        doc.setDrawColor(...C.border);
        doc.setLineWidth(0.15);
        doc.roundedRect(x, y, cardW, cardH, 2, 2, 'S');

        doc.setFillColor(...C.teal);
        doc.rect(x, y, cardW, 1.2, 'F');

        const hY = y + 4;
        const logoBoxW = 7, logoBoxH = 7, logoBoxX = x + 3, logoBoxY = hY;

        doc.setFillColor(...C.white);
        doc.setDrawColor(...C.teal);
        doc.setLineWidth(0.2);
        doc.roundedRect(logoBoxX, logoBoxY, logoBoxW, logoBoxH, 1, 1, 'FD');

        if (logoData) {
            doc.addImage(logoData, 'PNG', logoBoxX + 0.4, logoBoxY + 0.4, logoBoxW - 0.8, logoBoxH - 0.8);
        } else {
            doc.setTextColor(...C.teal);
            doc.setFontSize(4);
            doc.setFont('helvetica', 'bold');
            doc.text('ID', logoBoxX + logoBoxW / 2, logoBoxY + 4.5, { align: 'center' });
        }

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

        doc.setFontSize(3.6);
        doc.setTextColor(...C.teal);
        doc.setFont('helvetica', 'bold');
        doc.text(`CARTE PERSONNEL · ${schoolYear}`, schoolTxtX, hY + 6.2);

        doc.setDrawColor(...C.border);
        doc.setLineWidth(0.1);
        doc.line(x + 3, y + 13.5, x + cardW - 3, y + 13.5);

        const phW = 14, phH = 18, phX = x + 3, phY = y + 15;
        doc.setFillColor(...C.photoBg);
        doc.roundedRect(phX, phY, phW, phH, 1, 1, 'F');
        doc.setDrawColor(...C.border);
        doc.setLineWidth(0.15);
        doc.roundedRect(phX, phY, phW, phH, 1, 1, 'S');

        const initials = p.nom.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '—';
        doc.setTextColor(...C.faint);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(initials, phX + phW / 2, phY + phH / 2 + 2, { align: 'center' });

        const iX = phX + phW + 3;
        const iMaxW = cardW - (phW + 6) - 30 - 2;

        const fullName = p.nom.toUpperCase();
        doc.setTextColor(...C.text);
        let nFS = 8;
        if (fullName.length > 25) nFS = 5.5;
        else if (fullName.length > 18) nFS = 6.5;
        doc.setFontSize(nFS);
        doc.setFont('helvetica', 'bold');
        const nLines = doc.splitTextToSize(fullName, iMaxW);
        doc.text(nLines.slice(0, 2), iX, phY + 3);

        doc.setFontSize(3.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.muted);
        doc.text('FONCTION', iX, phY + 9);
        doc.setFontSize(6.5);
        doc.setTextColor(...C.text);
        doc.text(p.role, iX, phY + 12);

        doc.setFontSize(3.5);
        doc.setTextColor(...C.muted);
        doc.text('MATRICULE', iX, phY + 15);
        doc.setFontSize(5);
        doc.setTextColor(...C.text);
        doc.text(p.matricule ? p.matricule.toUpperCase() : '—', iX, phY + 17.5);

        const qrMM = 26, qrX2 = x + cardW - qrMM - 3, qrY2 = y + 15;
        const qrDataURL = await buildQRDataURL(p.id);
        doc.addImage(qrDataURL, 'PNG', qrX2, qrY2, qrMM, qrMM, undefined, 'NONE');

        const fY = y + cardH - 3;
        doc.setFontSize(2.8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.faint);
        doc.text("Badge personnel - usage professionnel", x + 3, fY);

        doc.setFontSize(2.8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.teal);
        doc.text('DGhubSchool', x + cardW - 3, fY, { align: 'right' });

        cardIndex++;
        onProgress(Math.round((cardIndex / total) * 100));
    }

    const nbPages = doc.getNumberOfPages();
    for (let p = 1; p <= nbPages; p++) {
        doc.setPage(p);
        doc.setFontSize(5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        doc.text(`Cartes personnel ${schoolYear} — ${schoolName} — Page ${p}/${nbPages}`, 105, 293, { align: 'center' });
    }

    doc.save(`cartes_personnel_${schoolYear.replace(/\//g, '-')}.pdf`);
};

export const CarteEnseignant: React.FC = () => {
    const schoolName = useStore(s => s.schoolName);
    const schoolYear = useStore(s => s.schoolYear);
    const schoolLogo = useStore(s => s.schoolLogo);

    const [personnel, setPersonnel] = useState<PersonnelRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        personnelApi.getPersonnel()
            .then((data: PersonnelRow[]) => setPersonnel(data || []))
            .catch(() => setPersonnel([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = personnel.filter(p =>
        !search || `${p.nom} ${p.role} ${p.matricule || ''}`.toLowerCase().includes(search.toLowerCase())
    );

    const startGeneration = useCallback(async (list: PersonnelRow[]) => {
        if (generating || !list.length) return;
        setGenerating(true);
        setProgress(0);
        setError(null);
        try {
            await generateCartesPDF(list, schoolName, schoolYear, schoolLogo, setProgress);
        } catch (err) {
            console.error('[CarteEnseignant] Erreur génération PDF:', err);
            setError(err instanceof Error ? err.message : 'Erreur lors de la génération du PDF');
        } finally {
            setGenerating(false);
        }
    }, [generating, schoolName, schoolYear, schoolLogo]);

    const handleGenerateAll = () => startGeneration(filtered);
    const handleGenerateOne = (id: string) => {
        const p = personnel.find(pp => pp.id === id);
        if (p) startGeneration([p]);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-24">
            <div className="rounded-[24px] p-6 md:p-8 bg-gradient-to-br from-teal-900 via-emerald-900 to-teal-950 text-white relative overflow-hidden shadow-[0_8px_30px_rgba(15,118,110,0.2)]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-[20px] flex items-center justify-center shadow-inner">
                            <CreditCard className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">Cartes Personnel</h2>
                            <p className="text-teal-200 text-sm mt-1 font-medium max-w-md">
                                Badges enseignants pour le pointage entrée/sortie — Format ISO 85×54 mm · QR Code niveau H
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 relative z-10">
                    {[
                        { v: personnel.length, l: 'Total personnel', color: 'bg-white/10' },
                        { v: Math.ceil(personnel.length / 8), l: 'Pages PDF', color: 'bg-emerald-500/20' },
                    ].map(({ v, l, color }) => (
                        <div key={l} className={`${color} backdrop-blur-md rounded-[20px] p-4 transition-colors`}>
                            <p className="text-3xl font-black text-white drop-shadow-md mb-1">{v}</p>
                            <p className="text-xs font-bold text-white/70 uppercase tracking-wider">{l}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-[24px] shadow-[0_2px_20px_rgba(0,0,0,0.04)] p-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher par nom, fonction, matricule..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-teal-100 focus:bg-white outline-none font-medium transition-all"
                        />
                    </div>
                    <button
                        onClick={handleGenerateAll}
                        disabled={generating || filtered.length === 0}
                        className="flex items-center justify-center gap-2 px-8 py-3 bg-slate-900 hover:bg-black active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[16px] text-sm font-bold transition-all shadow-md w-full md:w-auto h-full"
                    >
                        {generating
                            ? <><Loader2 className="w-5 h-5 animate-spin" /> {progress}%</>
                            : <><Download className="w-5 h-5" /> Générer lot PDF ({filtered.length})</>}
                    </button>
                </div>

                {generating && (
                    <div className="pt-4 mt-4 border-t border-slate-100 animate-fadeIn">
                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                            <span>Construction du document PDF en cours…</span>
                            <span className="text-slate-900">{progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-900 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-3 p-4 mt-4 bg-rose-50 rounded-[16px] text-sm font-bold text-rose-700 animate-fadeIn">
                        <AlertCircle className="w-5 h-5 text-rose-500" />
                        {error}
                    </div>
                )}

                <div className="mt-5 p-4 bg-slate-50 rounded-[16px] flex items-start gap-3">
                    <Info className="w-5 h-5 text-slate-400 shrink-0" />
                    <p className="text-sm font-medium text-slate-600 leading-relaxed">
                        Ce badge sert au pointage entrée/sortie du personnel (Scan Présence/Sortie Personnel). Format ISO 7810, QR niveau H, 8 cartes par page A4.
                    </p>
                </div>
            </div>

            {selectedId ? (() => {
                const p = personnel.find(pp => pp.id === selectedId);
                if (!p) return null;
                return (
                    <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-6 md:p-8 animate-fadeIn">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                                    <Search className="w-5 h-5 text-slate-600" />
                                </div>
                                Prévisualisation HD
                            </h3>
                            <button onClick={() => setSelectedId(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all hover:rotate-90 duration-300">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex flex-col lg:flex-row gap-10 items-start">
                            <div className="flex-shrink-0">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Aperçu ISO (85×54 mm)</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-[24px]">
                                    <div style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'inline-block' }} className="transition-transform hover:scale-[1.02] duration-500">
                                        <CartePersonnel
                                            nom={p.nom} role={p.role} id={p.id} telephone={p.telephone} matricule={p.matricule}
                                            schoolName={schoolName} schoolYear={schoolYear} schoolLogo={schoolLogo}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 space-y-4 min-w-[250px] w-full">
                                <div className="text-sm text-slate-700 bg-slate-50 rounded-[20px] p-5 flex items-start gap-4">
                                    <CheckCircle className="w-6 h-6 shrink-0 text-emerald-500" />
                                    <p className="font-medium leading-relaxed">
                                        <strong className="block mb-1 text-slate-900">Validation technique réussie</strong>
                                        Le QR Code encode l'identifiant de la fiche personnel — niveau H (30% de correction).
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleGenerateOne(p.id)}
                                    disabled={generating}
                                    className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-slate-900 hover:bg-black active:scale-[0.98] disabled:opacity-50 text-white rounded-[16px] text-sm font-bold transition-all shadow-[0_10px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_15px_25px_rgba(0,0,0,0.15)]"
                                >
                                    {generating
                                        ? <><Loader2 className="w-5 h-5 animate-spin" /> Rendu PDF en cours…</>
                                        : <><Printer className="w-5 h-5" /> Télécharger la carte seule (PDF)</>}
                                </button>
                                <button onClick={() => setSelectedId(null)} className="flex items-center justify-center w-full px-6 py-4 bg-white hover:bg-slate-50 text-slate-700 rounded-[16px] text-sm font-bold transition-all active:scale-[0.98]">
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })() : (
                <div className="bg-white rounded-[24px] shadow-[0_2px_20px_rgba(0,0,0,0.04)] p-6">
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-lg text-slate-800 font-bold flex items-center gap-3">
                            <Users className="w-5 h-5 text-slate-400" />
                            Répertoire du personnel
                        </p>
                        <span className="bg-slate-50 text-slate-600 px-4 py-1.5 rounded-full text-xs font-black">
                            {filtered.length} résultats
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[520px] overflow-y-auto pr-2 custom-scrollbar">
                            {filtered.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedId(p.id)}
                                    className="group flex items-center gap-4 p-4 rounded-[20px] bg-slate-50 hover:bg-white hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] active:scale-[0.98] transition-all text-left"
                                >
                                    <div className="w-12 h-12 rounded-[16px] bg-white shadow-sm flex items-center justify-center text-slate-800 text-sm font-black shrink-0 transition-transform">
                                        {p.nom.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[15px] font-bold text-slate-900 truncate group-hover:text-slate-700 transition-colors">{p.nom}</p>
                                        <p className="text-xs font-bold text-slate-400 mt-1 capitalize">{p.role}</p>
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
                                    <p className="text-lg text-slate-600 font-bold">Aucun membre du personnel trouvé</p>
                                    <p className="text-sm text-slate-400 mt-1">Modifiez vos critères de recherche</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CarteEnseignant;
