// ============================================================
// SCAN PRÉSENCE — Pointage des élèves par QR Code / recherche
// ============================================================
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { Presence } from '../types';
import { v4 as uuid } from '../utils/uuid';
import { createActivityLog } from '../utils/activityLogger';
import { sendWhatsApp, messagePresenceArrivee } from '../utils/whatsappHelper';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import {
    Camera, Search, CheckCircle2, AlertTriangle, UserCheck,
    Clock, Users, X, Smartphone
} from 'lucide-react';

// ── Composant carte d'élève scanné ───────────────────────────
const StudentScanned: React.FC<{
    nom: string; prenom: string; classe: string; heure: string;
    dejaPresent: boolean; telephone?: string; schoolName: string;
    onClose: () => void;
}> = ({ nom, prenom, classe, heure, dejaPresent, telephone, schoolName, onClose }) => (
    <div className={`rounded-2xl border-2 p-6 text-center transition-all animate-fade-in ${dejaPresent
        ? 'border-amber-300 bg-amber-50'
        : 'border-emerald-300 bg-emerald-50'
        }`}>
        <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${dejaPresent ? 'bg-amber-100' : 'bg-emerald-100'
            }`}>
            {dejaPresent ? (
                <AlertTriangle className="w-8 h-8 text-amber-600" />
            ) : (
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            )}
        </div>
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mx-auto mb-3 flex items-center justify-center text-white text-xl font-bold">
            {prenom.charAt(0)}{nom.charAt(0)}
        </div>
        <h3 className="text-lg font-bold text-gray-900">{prenom} {nom}</h3>
        <p className="text-sm text-gray-500 font-medium">{classe}</p>
        <p className={`text-sm font-bold mt-2 ${dejaPresent ? 'text-amber-600' : 'text-emerald-600'}`}>
            {dejaPresent ? '⚠️ Présence déjà enregistrée aujourd\'hui' : `✅ Présence enregistrée à ${heure}`}
        </p>

        <div className="flex gap-2 mt-4 justify-center">
            {telephone && !dejaPresent && (
                <button
                    onClick={() => sendWhatsApp(telephone, messagePresenceArrivee(`${prenom} ${nom}`, heure, schoolName))}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                    <Smartphone className="w-3.5 h-3.5" />
                    Notifier parent
                </button>
            )}
            <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition-colors"
            >
                Fermer
            </button>
        </div>
    </div>
);

// ── Page principale ──────────────────────────────────────────
export const ScanPresence: React.FC = () => {
    const students = useStore((s) => s.students);
    const presences = useStore((s) => s.presences);
    const addPresence = useStore((s) => s.addPresence);
    const isAlreadyPresent = useStore((s) => s.isAlreadyPresent);
    const addActivityLog = useStore((s) => s.addActivityLog);
    const user = useStore((s) => s.user);
    const schoolName = useStore((s) => s.schoolName);

    const [searchQuery, setSearchQuery] = useState('');
    const [scannedStudent, setScannedStudent] = useState<{
        nom: string; prenom: string; classe: string; heure: string;
        dejaPresent: boolean; telephone?: string;
    } | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
    const controlsRef = useRef<IScannerControls | null>(null);
    const isScanningPaused = useRef(false);

    const today = new Date().toISOString().split('T')[0];
    const todayPresences = presences.filter(p => p.date === today);

    // ── Enregistrer la présence d'un élève ─────────────────────
    const registerPresence = useCallback((studentId: string) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        const now = new Date();
        const heure = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const already = isAlreadyPresent(studentId);

        if (!already) {
            const presence: Presence = {
                id: uuid(),
                eleveId: student.id,
                eleveNom: student.nom,
                elevePrenom: student.prenom,
                eleveClasse: student.classe,
                date: today,
                heure: now.toTimeString().split(' ')[0],
                statut: 'present',
            };
            addPresence(presence);

            // Log d'activité
            addActivityLog(createActivityLog(
                user?.nom || 'Système',
                user?.role || 'système',
                'presence',
                `Présence enregistrée : ${student.prenom} ${student.nom} (${student.classe}) à ${heure}`
            ));

            // Vibration du téléphone
            if (navigator.vibrate) navigator.vibrate(200);
        }

        setScannedStudent({
            nom: student.nom,
            prenom: student.prenom,
            classe: student.classe,
            heure,
            dejaPresent: already,
            telephone: student.telephone,
        });
        isScanningPaused.current = true;
    }, [students, today, isAlreadyPresent, addPresence, addActivityLog, user]);

    // ── Caméra QR avec Google ZXing ──────────────────────────────
    const startCamera = async () => {
        setCameraError('');
        try {
            setCameraActive(true);

            // Attendre un instant que la balise video soit bien rendue par React
            setTimeout(async () => {
                if (!videoRef.current) return;

                const codeReader = new BrowserQRCodeReader();
                codeReaderRef.current = codeReader;

                // ZXing gère automatiquement le focus, l'accès matériel, et le flux !
                try {
                    const controls = await codeReader.decodeFromVideoDevice(
                        undefined, // undefined = caméra de dos par défaut
                        videoRef.current,
                        (result, error, controls) => {
                            if (result && !isScanningPaused.current) {
                                const code = result.getText();
                                const exist = students.some(s => s.id === code);
                                if (exist) {
                                    registerPresence(code);
                                }
                            }
                        }
                    );
                    controlsRef.current = controls;
                } catch (err) {
                    console.error("ZXing Camera Error:", err);
                    setCameraError('Erreur matérielle de la caméra.');
                    setCameraActive(false);
                }
            }, 100);

        } catch (err) {
            setCameraError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
            setCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (controlsRef.current) {
            controlsRef.current.stop();
            controlsRef.current = null;
        }
        setCameraActive(false);
    };

    useEffect(() => {
        return () => stopCamera();
    }, []);

    // ── Recherche élève (alternative au scan) ──────────────────
    const filteredStudents = searchQuery.length >= 2
        ? students.filter(s =>
            `${s.prenom} ${s.nom} ${s.classe} ${s.id}`.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 10)
        : [];

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* En-tête */}
            <div className="bg-gradient-to-r from-cyan-600 to-blue-700 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Pointage des présences</h2>
                        <p className="text-cyan-100 text-sm">Scan QR ou recherche manuelle</p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold">{todayPresences.length}</p>
                        <p className="text-xs text-cyan-200">Présents</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold">{students.length}</p>
                        <p className="text-xs text-cyan-200">Total élèves</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold">
                            {students.length > 0 ? Math.round((todayPresences.length / students.length) * 100) : 0}%
                        </p>
                        <p className="text-xs text-cyan-200">Taux</p>
                    </div>
                </div>
            </div>

            {/* Zone caméra */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                        <Camera className="w-4 h-4 text-blue-600" />
                        Scanner un QR Code
                    </h3>
                    <button
                        onClick={cameraActive ? stopCamera : startCamera}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${cameraActive
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        {cameraActive ? <><X className="w-3.5 h-3.5" /> Arrêter</> : <><Camera className="w-3.5 h-3.5" /> Activer caméra</>}
                    </button>
                </div>

                {cameraActive && (
                    <div className="relative bg-black aspect-video max-h-[300px] flex items-center justify-center overflow-hidden">
                        {/* ZXing override la vidéo et gère le stream directement depuis le DOM */}
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            autoPlay
                            playsInline
                            muted
                        />
                        {/* Overlay de scan */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-48 h-48 border-2 border-white/60 rounded-2xl shadow-lg">
                                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl" />
                                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl" />
                                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl" />
                                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-xl" />
                            </div>
                        </div>
                        <p className="absolute bottom-3 text-white/80 text-xs font-medium bg-black/40 px-3 py-1 rounded-full">
                            Placez le QR Code dans le cadre
                        </p>
                    </div>
                )}

                {cameraError && (
                    <div className="p-4 bg-red-50 text-red-600 text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {cameraError}
                    </div>
                )}
            </div>

            {/* Recherche manuelle */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3 text-sm">
                    <Search className="w-4 h-4 text-blue-600" />
                    Recherche manuelle
                </h3>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Nom, prénom, classe ou matricule..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                </div>

                {/* Résultats de recherche */}
                {filteredStudents.length > 0 && (
                    <div className="mt-3 space-y-1 max-h-[300px] overflow-y-auto">
                        {filteredStudents.map(student => {
                            const alreadyHere = isAlreadyPresent(student.id);
                            return (
                                <button
                                    key={student.id}
                                    onClick={() => registerPresence(student.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:shadow-sm ${alreadyHere ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 hover:bg-blue-50 border border-gray-100'
                                        }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                        {student.prenom.charAt(0)}{student.nom.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {student.prenom} {student.nom}
                                        </p>
                                        <p className="text-xs text-gray-500">{student.classe}</p>
                                    </div>
                                    {alreadyHere ? (
                                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Présent
                                        </span>
                                    ) : (
                                        <span className="text-xs font-bold text-blue-600">Pointer →</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Résultat du scan */}
            {scannedStudent && (
                <StudentScanned
                    {...scannedStudent}
                    schoolName={schoolName}
                    onClose={() => {
                        setScannedStudent(null);
                        isScanningPaused.current = false;
                    }}
                />
            )}

            {/* Liste des présents aujourd'hui */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-emerald-600" />
                        Présents aujourd'hui ({todayPresences.length})
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                </div>
                <div className="p-4 max-h-[400px] overflow-y-auto">
                    {todayPresences.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-8">Aucune présence enregistrée aujourd'hui</p>
                    ) : (
                        <div className="space-y-1">
                            {todayPresences.map(p => (
                                <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold">
                                        {p.elevePrenom.charAt(0)}{p.eleveNom.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-900 truncate">{p.elevePrenom} {p.eleveNom}</p>
                                        <p className="text-[10px] text-gray-500">{p.eleveClasse}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-mono">{p.heure.slice(0, 5)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
