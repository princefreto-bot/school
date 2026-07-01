import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Student } from '../types';
import jsPDF from 'jspdf';
import {
    Award, Search, Filter, Download, Printer, Edit3, X, Eye, 
    CheckCircle, AlertCircle, Users, Check, RefreshCw, ZoomIn, ZoomOut, RotateCw
} from 'lucide-react';

// ============================================================
// LOGIQUE DE DÉTECTION DES EXAMENS
// ============================================================
export const getExamenForClasse = (classe: string): 'CEPD' | 'BEPC' | 'BAC 1' | 'BAC 2' | null => {
    if (!classe) return null;
    const lower = classe.trim().toLowerCase();
    
    if (lower.startsWith('cm2')) {
        return 'CEPD';
    }
    if (lower.startsWith('3ème') || lower.startsWith('3e') || lower.startsWith('3eme')) {
        return 'BEPC';
    }
    if (lower.startsWith('1ère') || lower.startsWith('1ere') || lower.startsWith('1e') || lower.startsWith('première') || lower.startsWith('premiere')) {
        return 'BAC 1';
    }
    if (lower.startsWith('terminale') || lower.startsWith('tle')) {
        return 'BAC 2';
    }
    return null;
};

// Couleurs Togo associées aux examens
const EXAM_COLORS: Record<'CEPD' | 'BEPC' | 'BAC 1' | 'BAC 2', { primary: string, bg: string, text: string }> = {
    'CEPD': { primary: '#2563EB', bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-600 dark:text-blue-400' },
    'BEPC': { primary: '#16A34A', bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-600 dark:text-emerald-400' },
    'BAC 1': { primary: '#EA580C', bg: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-600 dark:text-orange-400' },
    'BAC 2': { primary: '#9333EA', bg: 'bg-purple-50 dark:bg-purple-950/20', text: 'text-purple-600 dark:text-purple-400' }
};

// Draw Togo Flag
const drawTogoFlag = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    ctx.save();
    const stripeH = h / 5;
    const colors = ['#006a4e', '#ffc72c', '#006a4e', '#ffc72c', '#006a4e'];
    for (let i = 0; i < 5; i++) {
        ctx.fillStyle = colors[i];
        ctx.fillRect(x, y + i * stripeH, w, stripeH);
    }
    const cantonW = w * 0.4;
    const cantonH = stripeH * 3;
    ctx.fillStyle = '#d21034';
    ctx.fillRect(x, y, cantonW, cantonH);
    
    // Draw white star
    const cx = x + cantonW / 2;
    const cy = y + cantonH / 2;
    const r = Math.min(cantonW, cantonH) * 0.3;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const sx = cx + r * Math.cos(angle);
        const sy = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
};

// Security Anti-counterfeit waves
const drawSecurityTexture = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 0.6;
    for (let y = 10; y < h; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x < w; x += 15) {
            const dy = Math.sin(x * 0.04 + y * 0.03) * 6;
            ctx.lineTo(x, y + dy);
        }
        ctx.stroke();
    }
    // Draw outer frame border line
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, h);
    ctx.restore();
};

export const CarteExamen: React.FC = () => {
    const students = useStore((s) => s.students);
    const updateStudent = useStore((s) => s.updateStudent);
    const schoolName = useStore((s) => s.schoolName);
    const schoolYear = useStore((s) => s.schoolYear);
    const schoolLogo = useStore((s) => s.schoolLogo);
    const schoolStamp = useStore((s) => s.schoolStamp);
    const directorSignature = useStore((s) => s.directorSignature);
    const directorName = useStore((s) => s.directorName);
    const directorTitle = useStore((s) => s.directorTitle);
    const showStampOnCards = useStore((s) => s.showStampOnCards);
    const showSignatureOnCards = useStore((s) => s.showSignatureOnCards);
    const officialSeal = useStore((s) => s.officialSeal);
    const showSealOnCards = useStore((s) => s.showSealOnCards);

    // Filtres et Recherche
    const [search, setSearch] = useState('');
    const [selectedExam, setSelectedExam] = useState<string>('');
    const [selectedClasse, setSelectedClasse] = useState<string>('');

    // Modals
    const [previewStudentId, setPreviewStudentId] = useState<string | null>(null);
    const [editStudent, setEditStudent] = useState<Student | null>(null);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Paramètres d'Aperçu
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Classes et Examens disponibles
    const classes = [...new Set(students.map((s) => s.classe))].sort();
    
    // Auto-calculer les examens de chaque élève pour filtrage
    const filteredStudents = students.filter((s) => {
        const exam = getExamenForClasse(s.classe);
        const matchesSearch = `${s.prenom} ${s.nom} ${s.id} ${s.numeroTable || ''}`.toLowerCase().includes(search.toLowerCase());
        const matchesExam = !selectedExam || exam === selectedExam;
        const matchesClasse = !selectedClasse || s.classe === selectedClasse;
        return matchesSearch && matchesExam && matchesClasse;
    });

    // Statistiques
    const getStats = (exam: 'CEPD' | 'BEPC' | 'BAC 1' | 'BAC 2') => {
        const list = students.filter((s) => getExamenForClasse(s.classe) === exam);
        const generated = list.filter((s) => !!s.numeroTable).length;
        return { total: list.length, generated };
    };

    const stats = {
        CEPD: getStats('CEPD'),
        BEPC: getStats('BEPC'),
        'BAC 1': getStats('BAC 1'),
        'BAC 2': getStats('BAC 2'),
    };

    // Charger les images sur le Canvas de manière asynchrone
    const loadImage = (src: string): Promise<HTMLImageElement | null> => {
        return new Promise((resolve) => {
            if (!src) return resolve(null);
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = src;
        });
    };

    // Générer le Canvas haute résolution pour une carte
    const renderCardCanvas = async (canvas: HTMLCanvasElement, student: Student) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = 1012; // 85.60 mm à 300 DPI (approx 1012px)
        const h = 638;  // 54 mm à 300 DPI (approx 638px)
        canvas.width = w;
        canvas.height = h;

        const exam = getExamenForClasse(student.classe);
        const examColor = exam ? EXAM_COLORS[exam].primary : '#64748B';

        // 1. Fond blanc
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);

        // 2. Texture de sécurité anti-contrefaçon
        drawSecurityTexture(ctx, w, h);

        // 3. Dessiner le filigrane du logo s'il existe
        if (schoolLogo) {
            const logoImg = await loadImage(schoolLogo);
            if (logoImg) {
                ctx.save();
                ctx.globalAlpha = 0.07;
                ctx.drawImage(logoImg, w / 2 - 200, h / 2 - 200, 400, 400);
                ctx.restore();
            }
        }

        // ==========================================
        // COLONNE GAUCHE : Photo d'identité (3.5 cm x 4.5 cm)
        // ==========================================
        // A 300 DPI, 35mm x 45mm correspond à 414px x 531px. Centré verticalement.
        const photoX = 40;
        const photoW = 414;
        const photoH = 531;
        const photoY = (h - photoH) / 2; // Centrage vertical (environ 53px de marge)

        // Ombre portée de la photo d'identité
        ctx.save();
        ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 6;
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(photoX, photoY, photoW, photoH);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 6;
        ctx.strokeRect(photoX, photoY, photoW, photoH);
        ctx.restore();

        if (student.photoUrl) {
            const studentPhoto = await loadImage(student.photoUrl);
            if (studentPhoto) {
                ctx.save();
                // Clip pour assurer des coins propres et éviter les débordements
                ctx.beginPath();
                ctx.rect(photoX + 3, photoY + 3, photoW - 6, photoH - 6);
                ctx.clip();
                ctx.drawImage(studentPhoto, photoX + 3, photoY + 3, photoW - 6, photoH - 6);
                ctx.restore();
            }
        } else {
            // Dessin avatar par défaut
            ctx.save();
            ctx.fillStyle = '#f1f5f9';
            ctx.fillRect(photoX + 3, photoY + 3, photoW - 6, photoH - 6);
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'center';
            ctx.font = 'bold 64px Helvetica, Arial, sans-serif';
            ctx.fillText(
                `${student.prenom.charAt(0)}${student.nom.charAt(0)}`.toUpperCase(), 
                photoX + photoW / 2, 
                photoY + photoH / 2 + 20
            );
            ctx.restore();
        }

        // ==========================================
        // COLONNE DROITE : Identité & Éléments Officiels
        // ==========================================
        const detailsX = 480;

        // 4. En-tête : Drapeau du Togo
        drawTogoFlag(ctx, detailsX, 35, 70, 44);

        // 5. En-tête : Textes officiels
        ctx.save();
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'left';
        ctx.font = 'bold 17px Helvetica, Arial, sans-serif';
        ctx.fillText('RÉPUBLIQUE TOGOLAISE', detailsX + 85, 52);

        ctx.fillStyle = '#475569';
        ctx.font = '600 10.5px Helvetica, Arial, sans-serif';
        ctx.fillText('MINISTÈRE DES ENSEIGNEMENTS PRIMAIRE, SECONDAIRE,', detailsX + 85, 68);
        ctx.fillText("TECHNIQUE ET DE L'ARTISANAT", detailsX + 85, 80);
        ctx.restore();

        // Logo de l'école (en haut à droite de la colonne droite)
        if (schoolLogo) {
            const logoImg = await loadImage(schoolLogo);
            if (logoImg) {
                ctx.drawImage(logoImg, w - 120, 35, 80, 80);
            }
        }

        // Nom de l'école (COLLÈGE/ÉTABLISSEMENT)
        ctx.save();
        ctx.fillStyle = examColor;
        ctx.textAlign = 'left';
        ctx.font = 'black 25px Helvetica, Arial, sans-serif';
        ctx.fillText((schoolName || 'ÉTABLISSEMENT SCOLAIRE').toUpperCase(), detailsX, 122);
        ctx.restore();

        // 6. Ligne de séparation : Ruban aux couleurs nationales du Togo (Vert, Jaune, Rouge)
        const ribbonY = 138;
        const ribbonW = w - detailsX - 40;
        ctx.fillStyle = '#006a4e'; // Vert
        ctx.fillRect(detailsX, ribbonY, ribbonW, 2);
        ctx.fillStyle = '#ffc72c'; // Jaune
        ctx.fillRect(detailsX, ribbonY + 2, ribbonW, 2);
        ctx.fillStyle = '#d21034'; // Rouge
        ctx.fillRect(detailsX, ribbonY + 4, ribbonW, 2);

        // 7. Bande colorée d'examen
        ctx.save();
        ctx.fillStyle = examColor;
        ctx.fillRect(detailsX, 152, ribbonW, 42);
        
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 15px Helvetica, Arial, sans-serif';
        ctx.fillText(`CARTE DE CANDIDAT — EXAMEN : ${exam || 'OFFICIEL'}`, detailsX + ribbonW / 2, 152 + 27);
        ctx.restore();

        // 8. Informations de l'élève (Textes plus grands et très lisibles)
        let detailsY = 224;
        const lineSpacing = 32;

        ctx.save();
        ctx.textAlign = 'left';

        // Ligne 1 : Nom
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 15px Helvetica, Arial, sans-serif';
        ctx.fillText('Nom :', detailsX, detailsY);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'black 19px Helvetica, Arial, sans-serif';
        ctx.fillText(student.nom.toUpperCase(), detailsX + 55, detailsY);

        detailsY += lineSpacing;

        // Ligne 2 : Prénoms
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 15px Helvetica, Arial, sans-serif';
        ctx.fillText('Prénom(s) :', detailsX, detailsY);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'black 19px Helvetica, Arial, sans-serif';
        ctx.fillText(student.prenom, detailsX + 90, detailsY);

        detailsY += lineSpacing;

        // Ligne 3 : Date et Lieu de naissance
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 15px Helvetica, Arial, sans-serif';
        ctx.fillText('Né(e) le :', detailsX, detailsY);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 17px Helvetica, Arial, sans-serif';
        ctx.fillText(student.dateNaissance || '—', detailsX + 70, detailsY);

        const dateWidth = ctx.measureText(student.dateNaissance || '—').width;
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 15px Helvetica, Arial, sans-serif';
        ctx.fillText('à', detailsX + 70 + dateWidth + 10, detailsY);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 17px Helvetica, Arial, sans-serif';
        ctx.fillText(student.lieuNaissance || '—', detailsX + 70 + dateWidth + 28, detailsY);

        detailsY += lineSpacing;

        // Ligne 4 : Sexe et Nationalité
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 15px Helvetica, Arial, sans-serif';
        ctx.fillText('Sexe :', detailsX, detailsY);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 17px Helvetica, Arial, sans-serif';
        ctx.fillText(student.sexe, detailsX + 55, detailsY);

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 15px Helvetica, Arial, sans-serif';
        ctx.fillText('Nationalité :', detailsX + 110, detailsY);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 17px Helvetica, Arial, sans-serif';
        ctx.fillText(student.nationalite || 'Togolaise', detailsX + 205, detailsY);

        detailsY += lineSpacing;

        // Ligne 5 : Classe et Matricule
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 15px Helvetica, Arial, sans-serif';
        ctx.fillText('Classe :', detailsX, detailsY);
        
        // Petit badge pour la classe
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px Helvetica, Arial, sans-serif';
        const classVal = student.classe;
        const classValWidth = ctx.measureText(classVal).width;
        ctx.fillRect(detailsX + 65, detailsY - 17, classValWidth + 12, 22);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(classVal, detailsX + 71, detailsY - 1);

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 15px Helvetica, Arial, sans-serif';
        ctx.fillText('Matricule :', detailsX + 155 + classValWidth, detailsY);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 16px Helvetica, Arial, sans-serif';
        ctx.fillText(student.id.substring(0, 10).toUpperCase(), detailsX + 240 + classValWidth, detailsY);

        detailsY += lineSpacing + 4;

        // Ligne 6 : N° de table (Très grand pour lisibilité optimale sur table d'examen)
        ctx.fillStyle = examColor;
        ctx.font = 'black 17px Helvetica, Arial, sans-serif';
        ctx.fillText('N° DE TABLE :', detailsX, detailsY);
        ctx.fillStyle = student.numeroTable ? '#0f172a' : '#ef4444';
        ctx.font = 'black 22px Helvetica, Arial, sans-serif';
        ctx.fillText(student.numeroTable || 'À SAISIR', detailsX + 125, detailsY);

        detailsY += lineSpacing;

        // Ligne 7 : Année scolaire
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 15px Helvetica, Arial, sans-serif';
        ctx.fillText('Année scolaire :', detailsX, detailsY);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 16px Helvetica, Arial, sans-serif';
        ctx.fillText(schoolYear, detailsX + 125, detailsY);

        ctx.restore();

        // ==========================================
        // PIED DE PAGE : Signature, Cachet, Sceau
        // ==========================================
        const sigX = 830;
        const sigY = 460;

        // 1. Sceau Officiel de l'État (bas gauche de la colonne droite)
        if (showSealOnCards && officialSeal) {
            const sealImg = await loadImage(officialSeal);
            if (sealImg) {
                ctx.save();
                ctx.globalAlpha = 0.95;
                ctx.drawImage(sealImg, detailsX + 5, 470, 100, 100);
                ctx.restore();
            }
        }

        // 2. Cachet de l'établissement (bas droit, sous la signature)
        if (showStampOnCards && schoolStamp) {
            const stampImg = await loadImage(schoolStamp);
            if (stampImg) {
                ctx.save();
                ctx.globalAlpha = 0.85;
                ctx.drawImage(stampImg, sigX - 90, sigY - 20, 110, 110);
                ctx.restore();
            }
        }

        // 3. Signature du Directeur
        if (showSignatureOnCards && directorSignature) {
            const sigImg = await loadImage(directorSignature);
            if (sigImg) {
                ctx.drawImage(sigImg, sigX - 80, sigY + 5, 160, 55);
            }
        }

        // 4. Textes d'autorité
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 12px Helvetica, Arial, sans-serif';
        ctx.fillText(directorName ? `M. ${directorName}` : 'Le Directeur', sigX, sigY + 80);

        ctx.fillStyle = '#64748b';
        ctx.font = '600 11px Helvetica, Arial, sans-serif';
        ctx.fillText(directorTitle || 'Directeur', sigX, sigY + 95);
        ctx.restore();
    };

    // Déclencher le rendu écran du Canvas de prévisualisation
    useEffect(() => {
        if (!previewStudentId || !canvasRef.current) return;
        const student = students.find((s) => s.id === previewStudentId);
        if (student) {
            renderCardCanvas(canvasRef.current, student);
        }
    }, [previewStudentId, students, schoolLogo, schoolStamp, officialSeal, directorSignature, directorName, directorTitle, showStampOnCards, showSignatureOnCards, showSealOnCards]);

    // Télécharger la carte en tant que PNG
    const downloadPNG = async (student: Student) => {
        const tempCanvas = document.createElement('canvas');
        await renderCardCanvas(tempCanvas, student);
        const dataUrl = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `carte_examen_${student.prenom}_${student.nom}.png`;
        link.href = dataUrl;
        link.click();
    };

    // Imprimer directement la carte
    const printCard = async (student: Student) => {
        const tempCanvas = document.createElement('canvas');
        await renderCardCanvas(tempCanvas, student);
        const dataUrl = tempCanvas.toDataURL('image/png');
        
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(`
            <html>
            <head>
                <title>Impression Carte d'Examen - ${student.prenom} ${student.nom}</title>
                <style>
                    body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; }
                    img { width: 85.6mm; height: 54mm; object-fit: contain; }
                    @page { size: 86mm 55mm; margin: 0; }
                </style>
            </head>
            <body>
                <img src="${dataUrl}" onload="window.print(); window.close();" />
            </body>
            </html>
        `);
        win.document.close();
    };

    // Télécharger une seule carte en PDF (format carte exact)
    const downloadPDF = async (student: Student) => {
        const tempCanvas = document.createElement('canvas');
        await renderCardCanvas(tempCanvas, student);
        const dataUrl = tempCanvas.toDataURL('image/png');

        // Créer un document PDF au format exact d'une carte PVC (85.6 x 54 mm)
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [85.6, 54]
        });

        doc.addImage(dataUrl, 'PNG', 0, 0, 85.6, 54);
        doc.save(`carte_examen_${student.prenom}_${student.nom}.pdf`);
    };

    // Génération en lot PDF (8 cartes par page A4)
    const generateBatchPDF = async (list: Student[]) => {
        if (!list.length) {
            alert('Aucun élève à exporter');
            return;
        }

        setGenerating(true);
        setProgress(0);
        setError(null);

        try {
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            
            // Marges et calcul A4
            const cardW = 85.6;
            const cardH = 54;
            const cols = 2;
            const rowsMax = 4;
            const pageW = 210;
            const pageH = 297;
            const gapX = 6;
            const gapY = 8;
            const marginX = (pageW - cols * cardW - (cols - 1) * gapX) / 2;
            const marginY = (pageH - rowsMax * cardH - (rowsMax - 1) * gapY) / 2;

            const total = list.length;
            let cardIndex = 0;

            for (const student of list) {
                const posOnPage = cardIndex % (cols * rowsMax);
                if (posOnPage === 0 && cardIndex > 0) {
                    doc.addPage();
                }

                const col = posOnPage % cols;
                const row = Math.floor(posOnPage / cols);
                const x = marginX + col * (cardW + gapX);
                const y = marginY + row * (cardH + gapY);

                // Render Canvas temporaire pour obtenir l'image HD
                const tempCanvas = document.createElement('canvas');
                await renderCardCanvas(tempCanvas, student);
                const dataUrl = tempCanvas.toDataURL('image/png');

                doc.addImage(dataUrl, 'PNG', x, y, cardW, cardH, undefined, 'FAST');

                cardIndex++;
                setProgress(Math.round((cardIndex / total) * 100));
            }

            doc.save(`cartes_examen_${schoolYear.replace(/\//g, '-')}.pdf`);
        } catch (err: any) {
            console.error(err);
            setError(err?.message || 'Erreur pendant la génération du PDF');
        } finally {
            setGenerating(false);
        }
    };

    // Enregistrer les modifications d'un élève (N° de table, nationalité, etc.)
    const handleSaveStudentEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editStudent) return;

        updateStudent(editStudent.id, {
            nom: editStudent.nom,
            prenom: editStudent.prenom,
            dateNaissance: editStudent.dateNaissance,
            lieuNaissance: editStudent.lieuNaissance,
            nationalite: editStudent.nationalite,
            numeroTable: editStudent.numeroTable,
            sexe: editStudent.sexe
        });

        setEditStudent(null);
    };

    return (
        <div className="max-w-[1200px] mx-auto space-y-6 pb-24 animate-fadeIn">
            {/* ── EN-TÊTE DE PAGE (Style Apple/Linear) ── */}
            <div className="rounded-[24px] p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white relative overflow-hidden shadow-xl border border-slate-800">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-[20px] flex items-center justify-center border border-white/10 shadow-inner">
                            <Award className="w-7 h-7 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-white">Cartes scolaires d'examen</h2>
                            <p className="text-indigo-200 text-sm mt-1 font-medium max-w-md">
                                Générez automatiquement les cartes des candidats aux examens officiels CEPD, BEPC, BAC 1 et BAC 2.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── BENTO GRIDS STATISTIQUES (Chaque examen) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(['CEPD', 'BEPC', 'BAC 1', 'BAC 2'] as const).map((exam) => {
                    const examColor = EXAM_COLORS[exam];
                    const examStats = stats[exam];
                    return (
                        <div key={exam} className="bg-white dark:bg-slate-900 rounded-[20px] p-6 shadow-sm border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${examColor.bg} ${examColor.text} uppercase tracking-wider`}>
                                        {exam}
                                    </span>
                                    <Users className="w-4.5 h-4.5 text-slate-400" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{examStats.total}</p>
                                    <p className="text-xs font-semibold text-slate-500">Candidats totaux</p>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                                    <span className="font-bold text-slate-400">Cartes prêtes (N° de table saisi) :</span>
                                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                                        {examStats.generated} / {examStats.total}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    const list = students.filter((s) => getExamenForClasse(s.classe) === exam);
                                    generateBatchPDF(list);
                                }}
                                disabled={examStats.total === 0 || generating}
                                className={`mt-5 w-full py-2.5 rounded-[12px] text-xs font-bold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2`}
                                style={{ backgroundColor: examColor.primary }}
                            >
                                <Download className="w-3.5 h-3.5" /> Générer {exam}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* ── BARRE DE CONTRÔLES (Filtres et Actions en lot) ── */}
            <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-sm p-6 border border-slate-200/60 dark:border-slate-800 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* Recherche et Filtres */}
                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher nom, matricule..."
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-850 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-900 outline-none font-medium transition-all"
                            />
                        </div>

                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <select
                                value={selectedExam}
                                onChange={(e) => setSelectedExam(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-850 border-none rounded-[16px] text-sm appearance-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-900 outline-none font-medium transition-all cursor-pointer"
                            >
                                <option value="">Tous les examens</option>
                                <option value="CEPD">CEPD</option>
                                <option value="BEPC">BEPC</option>
                                <option value="BAC 1">BAC 1</option>
                                <option value="BAC 2">BAC 2</option>
                            </select>
                        </div>

                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <select
                                value={selectedClasse}
                                onChange={(e) => setSelectedClasse(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-850 border-none rounded-[16px] text-sm appearance-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-900 outline-none font-medium transition-all cursor-pointer"
                            >
                                <option value="">Toutes les classes</option>
                                {classes.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Actions Globales */}
                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={() => generateBatchPDF(filteredStudents)}
                            disabled={filteredStudents.length === 0 || generating}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-black text-white dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 rounded-[16px] text-sm font-bold transition-all active:scale-[0.98]"
                        >
                            <Download className="w-4 h-4" /> Exporter PDF ({filteredStudents.length})
                        </button>
                    </div>
                </div>

                {/* Barre de progression de la génération en masse */}
                {generating && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 animate-fadeIn">
                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                            <span>Génération des cartes d'examen en cours...</span>
                            <span className="text-slate-950 dark:text-white">{progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-slate-900 dark:bg-indigo-500 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ── BOUTONS GÉNÉRATION RAPIDE PAR CLASSE ── */}
            <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-sm p-6 border border-slate-200/60 dark:border-slate-800 space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Générer rapidement par classe d'examen
                </h3>
                <div className="flex flex-wrap gap-2">
                    {classes.map((c) => {
                        const exam = getExamenForClasse(c);
                        if (!exam) return null; // Ignorer les classes sans examen officiel
                        
                        const list = students.filter((s) => s.classe === c);
                        const examColor = EXAM_COLORS[exam];

                        return (
                            <button
                                key={c}
                                onClick={() => generateBatchPDF(list)}
                                className="flex items-center gap-2.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200/40 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-[14px] text-xs font-bold transition-all active:scale-[0.97]"
                            >
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: examColor.primary }}></span>
                                {c}
                                <span className="text-[10px] font-black text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-slate-800">
                                    {list.length} élv.
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── TABLEAU DES ÉLÈVES ── */}
            <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-sm border border-slate-200/60 dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-sm uppercase tracking-wider">
                        Liste des Candidats
                    </h3>
                    <span className="bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-[11px] font-black uppercase">
                        {filteredStudents.length} candidats filtrés
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-slate-500">
                        <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            <tr>
                                <th scope="col" className="px-6 py-4">Photo</th>
                                <th scope="col" className="px-6 py-4">Matricule</th>
                                <th scope="col" className="px-6 py-4">Nom & Prénoms</th>
                                <th scope="col" className="px-6 py-4">Classe</th>
                                <th scope="col" className="px-6 py-4">Examen</th>
                                <th scope="col" className="px-6 py-4">N° Table</th>
                                <th scope="col" className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 border-t border-slate-100 dark:border-slate-800">
                            {filteredStudents.map((student) => {
                                const exam = getExamenForClasse(student.classe);
                                const isReady = !!student.numeroTable;
                                const examColor = exam ? EXAM_COLORS[exam] : null;

                                return (
                                    <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                        {/* Photo */}
                                        <td className="px-6 py-4">
                                            <div className="w-10 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-200/50 dark:border-slate-800">
                                                {student.photoUrl ? (
                                                    <img src={student.photoUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[10px] font-black text-slate-400">
                                                        {student.prenom.charAt(0)}{student.nom.charAt(0)}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        {/* Matricule */}
                                        <td className="px-6 py-4 font-bold text-slate-600 dark:text-slate-400 text-xs">
                                            {student.id.substring(0, 10).toUpperCase()}
                                        </td>
                                        {/* Nom */}
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 dark:text-white text-[14px]">
                                                {student.nom.toUpperCase()} {student.prenom}
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">
                                                Né(e) le {student.dateNaissance || '—'} {student.lieuNaissance ? `à ${student.lieuNaissance}` : ''}
                                            </div>
                                        </td>
                                        {/* Classe */}
                                        <td className="px-6 py-4 font-extrabold text-slate-700 dark:text-slate-300">
                                            {student.classe}
                                        </td>
                                        {/* Examen */}
                                        <td className="px-6 py-4">
                                            {examColor ? (
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black ${examColor.bg} ${examColor.text}`}>
                                                    {exam}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400 font-bold">Incompatible</span>
                                            )}
                                        </td>
                                        {/* N° Table */}
                                        <td className="px-6 py-4">
                                            {isReady ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-black border border-emerald-100/50 dark:border-emerald-900/30">
                                                    <Check className="w-3.5 h-3.5" />
                                                    {student.numeroTable}
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => setEditStudent(student)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-black border border-rose-100/50 dark:border-rose-900/30 hover:bg-rose-100/50 cursor-pointer"
                                                >
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    À saisir
                                                </button>
                                            )}
                                        </td>
                                        {/* Actions */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {/* Aperçu écran */}
                                                <button
                                                    onClick={() => setPreviewStudentId(student.id)}
                                                    title="Prévisualiser la carte"
                                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {/* Modifier les infos */}
                                                <button
                                                    onClick={() => setEditStudent(student)}
                                                    title="Modifier les informations"
                                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                {/* Télécharger PDF */}
                                                <button
                                                    onClick={() => downloadPDF(student)}
                                                    disabled={!exam}
                                                    title="Télécharger PDF de la carte"
                                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 transition-colors"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                {/* Imprimer */}
                                                <button
                                                    onClick={() => printCard(student)}
                                                    disabled={!exam}
                                                    title="Imprimer directement"
                                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 transition-colors"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-16">
                                        <div className="w-16 h-16 rounded-[20px] bg-slate-50 dark:bg-slate-850 flex items-center justify-center mx-auto mb-4">
                                            <Search className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-400 font-bold">Aucun élève trouvé</p>
                                        <p className="text-slate-400 text-xs mt-1">Ajustez vos filtres de recherche ou de classe</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── MODAL APERÇU HD & ZOOM ── */}
            {previewStudentId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-[850px] w-full p-6 md:p-8 flex flex-col md:flex-row gap-8 shadow-2xl relative border border-slate-200/50 dark:border-slate-800 animate-scaleUp">
                        
                        {/* Bouton de fermeture */}
                        <button
                            onClick={() => setPreviewStudentId(null)}
                            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-300 transition-all hover:rotate-90 duration-300 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Section du Canvas de la Carte */}
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                Aperçu de la carte PVC (85.60 x 54 mm)
                            </p>
                            
                            <div 
                                className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-3xl overflow-hidden flex items-center justify-center w-full max-w-[550px]"
                                style={{ minHeight: '340px' }}
                            >
                                <div 
                                    className="transition-transform duration-300 shadow-xl rounded-xl overflow-hidden border border-black/10"
                                    style={{ 
                                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                        width: '450px',
                                        height: '284px'
                                    }}
                                >
                                    <canvas 
                                        ref={canvasRef} 
                                        style={{ width: '100%', height: '100%', display: 'block' }}
                                    />
                                </div>
                            </div>

                            {/* Contrôles de rotation et de zoom */}
                            <div className="flex items-center gap-3 mt-6">
                                <button 
                                    onClick={() => setZoom(prev => Math.max(0.6, prev - 0.1))}
                                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                                    title="Zoom arrière"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-black text-slate-500 w-12 text-center">
                                    {Math.round(zoom * 100)}%
                                </span>
                                <button 
                                    onClick={() => setZoom(prev => Math.min(1.4, prev + 0.1))}
                                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                                    title="Zoom avant"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>
                                <button 
                                    onClick={() => setRotation(prev => (prev + 90) % 360)}
                                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-bold"
                                    title="Pivoter de 90°"
                                >
                                    <RotateCw className="w-4 h-4" /> Rotation
                                </button>
                            </div>
                        </div>

                        {/* Section d'Informations et d'Actions de la carte */}
                        <div className="w-full md:w-[280px] flex flex-col justify-between pt-6 md:pt-0">
                            {(() => {
                                const s = students.find((st) => st.id === previewStudentId);
                                if (!s) return null;
                                return (
                                    <div className="space-y-6 flex-1 flex flex-col justify-between h-full">
                                        <div className="space-y-4">
                                            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                                                <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                                                    {s.prenom} {s.nom.toUpperCase()}
                                                </h4>
                                                <p className="text-xs text-slate-400 font-bold mt-1">
                                                    Classe : {s.classe} · Examen : {getExamenForClasse(s.classe) || '—'}
                                                </p>
                                            </div>

                                            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400 font-semibold">N° Matricule :</span>
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">{s.id.substring(0, 10).toUpperCase()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400 font-semibold">N° de Table :</span>
                                                    <span className="font-black text-indigo-600 dark:text-indigo-400">{s.numeroTable || 'Non attribué'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400 font-semibold">Date de Naiss. :</span>
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">{s.dateNaissance || '—'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400 font-semibold">Lieu de Naiss. :</span>
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">{s.lieuNaissance || '—'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400 font-semibold">Nationalité :</span>
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">{s.nationalite || '—'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-6">
                                            <button
                                                onClick={() => downloadPDF(s)}
                                                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-black text-white dark:bg-indigo-600 dark:hover:bg-indigo-700 rounded-xl text-xs font-bold transition-all active:scale-[0.98] shadow-sm"
                                            >
                                                <Download className="w-4 h-4" /> Télécharger PDF
                                            </button>
                                            
                                            <button
                                                onClick={() => downloadPNG(s)}
                                                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
                                            >
                                                <Download className="w-4 h-4" /> Télécharger PNG
                                            </button>

                                            <button
                                                onClick={() => printCard(s)}
                                                className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
                                            >
                                                <Printer className="w-4 h-4" /> Imprimer directement
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL SAISIE / MODIFICATION DES DÉTAILS DE LA CARTE ── */}
            {editStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-[550px] w-full p-6 md:p-8 shadow-2xl relative border border-slate-200/50 dark:border-slate-800 animate-scaleUp">
                        
                        {/* Bouton fermeture */}
                        <button
                            onClick={() => setEditStudent(null)}
                            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-300 transition-all hover:rotate-90 duration-300 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                            Modifier les informations d'examen
                        </h3>

                        <form onSubmit={handleSaveStudentEdit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                                        Nom
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={editStudent.nom}
                                        onChange={(e) => setEditStudent({ ...editStudent, nom: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                                        Prénom(s)
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={editStudent.prenom}
                                        onChange={(e) => setEditStudent({ ...editStudent, prenom: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                                        Sexe
                                    </label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                                        value={editStudent.sexe}
                                        onChange={(e) => setEditStudent({ ...editStudent, sexe: e.target.value as 'M' | 'F' })}
                                    >
                                        <option value="M">Masculin (M)</option>
                                        <option value="F">Féminin (F)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                                        N° de Table
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ex : 492750"
                                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={editStudent.numeroTable || ''}
                                        onChange={(e) => setEditStudent({ ...editStudent, numeroTable: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                                        Date de Naissance
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ex : 12/05/2012"
                                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={editStudent.dateNaissance || ''}
                                        onChange={(e) => setEditStudent({ ...editStudent, dateNaissance: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                                        Lieu de Naissance
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ex : Lomé"
                                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={editStudent.lieuNaissance || ''}
                                        onChange={(e) => setEditStudent({ ...editStudent, lieuNaissance: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                                    Nationalité
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex : Togolaise"
                                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    value={editStudent.nationalite || ''}
                                    onChange={(e) => setEditStudent({ ...editStudent, nationalite: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditStudent(null)}
                                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3.5 bg-slate-900 hover:bg-black text-white dark:bg-indigo-600 dark:hover:bg-indigo-700 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
                                >
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
