// ============================================================
// SCAN INFORMATION — Consultation rapide des données élève
// ============================================================
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { Html5Qrcode } from "html5-qrcode";
import {
    Camera, Search, CheckCircle2, AlertTriangle, UserCircle,
    X, Wallet, Info, ShieldCheck
} from 'lucide-react';
import { playSuccessSound, playErrorSound, unlockAudio } from '../utils/audio';

// ── Composant carte d'élève scanné (OVERLAY PREMIUM) ────────────────
const InfoStudentScanned: React.FC<{
    nom: string;
    prenom: string;
    classe: string;
    photoUrl?: string;
    solde: number;
    statut: string;
    onClose: () => void;
}> = ({ nom, prenom, classe, photoUrl, solde, statut, onClose }) => {
    const isSolvable = solde <= 0;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-up">
                {/* Header Gradient */}
                <div className={`h-32 bg-gradient-to-r ${isSolvable ? 'from-emerald-500 to-teal-600' : 'from-orange-500 to-red-600'}`} />

                {/* Photo / Avatar */}
                <div className="absolute top-12 left-1/2 -translate-x-1/2">
                    <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-gray-100">
                        {photoUrl ? (
                            <img src={photoUrl} alt="Photo élève" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 text-gray-500">
                                <UserCircle className="w-16 h-16" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-20 pb-8 px-8 text-center">
                    <h3 className="text-3xl font-black text-gray-900 mb-1">{prenom} {nom}</h3>
                    <p className="text-lg text-blue-600 font-bold mb-8">{classe}</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <div className="flex items-center justify-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                                <Wallet className="w-3 h-3" />
                                Solde Actuel
                            </div>
                            <div className={`text-xl font-black ${solde > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {solde.toLocaleString()} <span className="text-sm">FCFA</span>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <div className="flex items-center justify-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                                <ShieldCheck className="w-3 h-3" />
                                Statut
                            </div>
                            <div className={`text-sm font-black px-2 py-1 rounded-lg inline-block ${
                                statut === 'Soldé' ? 'bg-emerald-100 text-emerald-700' : 
                                statut === 'Partiel' ? 'bg-orange-100 text-orange-700' : 
                                'bg-red-100 text-red-700'
                            }`}>
                                {statut.toUpperCase()}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                    >
                        Continuer
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Page principale ──────────────────────────────────────────
export const ScanInformation: React.FC = () => {
    const students = useStore((s) => s.students);
    const [searchQuery, setSearchQuery] = useState('');
    const [scannedStudent, setScannedStudent] = useState<any | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [flashError, setFlashError] = useState<string | null>(null);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const isScanningPaused = useRef(false);

    const handleInfoScan = useCallback((studentId: string) => {
        const student = students.find(s => s.id === studentId);
        const { links } = useStore.getState();

        const isLinked = links && links.some((l: any) =>
            l.student_id?.trim().toLowerCase() === studentId?.trim().toLowerCase()
        );

        if (!student || !isLinked) {
            playErrorSound();
            setFlashError("PAS LIÉE");
            isScanningPaused.current = true;
            setTimeout(() => {
                setFlashError(null);
                isScanningPaused.current = false;
            }, 600);
            return;
        }

        // Succès
        playSuccessSound();
        if (navigator.vibrate) navigator.vibrate(80);

        setScannedStudent(student);
        isScanningPaused.current = true;

        // Auto-close après 3 secondes si pas d'action manuelle (optionnel)
        // Mais ici l'utilisateur peut vouloir regarder plus longtemps
    }, [students]);

    const startCamera = () => {
        setCameraError('');
        setCameraActive(true);
        unlockAudio();

        setTimeout(() => {
            const html5QrCode = new Html5Qrcode("reader-info");
            html5QrCodeRef.current = html5QrCode;

            html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 25,
                    qrbox: { width: 280, height: 280 }
                },
                (decodedText) => {
                    if (!isScanningPaused.current) {
                        handleInfoScan(decodedText);
                    }
                },
                (errorMessage) => {
                    if (process.env.NODE_ENV === 'development' && !errorMessage.includes('No QR code found')) {
                        console.debug("Scan info:", errorMessage);
                    }
                }
            ).catch((err) => {
                console.error("Camera Error:", err);
                setCameraError('Erreur matérielle ou permissions refusées.');
                setCameraActive(false);
            });
        }, 300);
    };

    const stopCamera = () => {
        if (html5QrCodeRef.current) {
            html5QrCodeRef.current.stop().then(() => {
                html5QrCodeRef.current?.clear();
                html5QrCodeRef.current = null;
            }).catch(e => console.error("Erreur arrêt caméra:", e));
        }
        setCameraActive(false);
    };

    useEffect(() => {
        return () => {
            if (html5QrCodeRef.current) {
                html5QrCodeRef.current.stop().catch(() => { });
            }
        };
    }, []);

    const filteredStudents = searchQuery.length >= 2
        ? students.filter(s =>
            `${s.prenom} ${s.nom} ${s.classe} ${s.id}`.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 10)
        : [];

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* En-tête Premium */}
            <div className="bg-gradient-to-br from-indigo-600 via-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Info className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                            <UserCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black">Scan Information</h2>
                            <p className="text-indigo-100 font-medium">Consultez instantanément le profil élève</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Zone caméra */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Camera className="w-5 h-5 text-blue-600" />
                        <span className="font-bold text-gray-800">Lecteur QR Code</span>
                    </div>
                    <button
                        onClick={cameraActive ? stopCamera : startCamera}
                        className={`px-6 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 transition-all shadow-sm ${cameraActive
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200'
                            }`}
                    >
                        {cameraActive ? <><X className="w-4 h-4" /> Fermer</> : <><Camera className="w-4 h-4" /> Démarrer le scan</>}
                    </button>
                </div>

                {cameraActive && (
                    <div className="relative bg-gray-900 w-full" style={{ minHeight: '400px' }}>
                        <div id="reader-info" className="w-full h-full"></div>
                        
                        {/* Overlay Focus UI */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-64 h-64 border-2 border-white/30 rounded-3xl relative">
                                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
                            </div>
                        </div>

                        {flashError && (
                            <div className="absolute inset-0 bg-red-600/90 flex flex-col items-center justify-center text-white z-50 animate-pulse">
                                <AlertTriangle className="w-20 h-20 mb-4" />
                                <h2 className="text-4xl font-extrabold tracking-taller">{flashError}</h2>
                            </div>
                        )}
                    </div>
                )}

                {cameraError && (
                    <div className="p-6 bg-red-50 text-red-600 text-sm font-bold flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5" />
                        {cameraError}
                    </div>
                )}
            </div>

            {/* Recherche manuelle */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Search className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-gray-800">Recherche rapide</span>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher par nom, classe ou ID..."
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-base focus:ring-2 focus:ring-blue-500 outline-none transition font-medium"
                    />
                </div>

                {filteredStudents.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredStudents.map(student => (
                            <button
                                key={student.id}
                                onClick={() => handleInfoScan(student.id)}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left shadow-sm group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 overflow-hidden">
                                    {student.photoUrl ? (
                                        <img src={student.photoUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-bold">{student.prenom.charAt(0)}{student.nom.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                                        {student.prenom} {student.nom}
                                    </p>
                                    <p className="text-sm text-gray-500 font-medium">{student.classe}</p>
                                </div>
                                <span className="text-sm font-black text-blue-600 bg-blue-100/50 px-3 py-1 rounded-lg">VOIR →</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Overlay Résultat */}
            {scannedStudent && (
                <InfoStudentScanned
                    nom={scannedStudent.nom}
                    prenom={scannedStudent.prenom}
                    classe={scannedStudent.classe}
                    photoUrl={scannedStudent.photoUrl}
                    solde={scannedStudent.restant}
                    statut={scannedStudent.status}
                    onClose={() => {
                        setScannedStudent(null);
                        isScanningPaused.current = false;
                    }}
                />
            )}
        </div>
    );
};

export default ScanInformation;
