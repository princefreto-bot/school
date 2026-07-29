// ============================================================
// SCAN SORTIE PERSONNEL — Pointage sortie du personnel (badge QR)
// Symétrique de ScanPresenceEnseignant.tsx — voir ce fichier pour
// le détail des choix (pas de store Zustand, pas de /api/sync).
// ============================================================
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { personnelApi } from '../services/personnelApi';
import { staffAttendanceApi } from '../services/staffAttendanceApi';
import { playSuccessSound, playErrorSound, unlockAudio } from '../utils/audio';
import { Camera, AlertTriangle, CheckCircle2, LogOut, X } from 'lucide-react';

interface PersonnelRow { id: string; nom: string; role: string }

const ScannedOverlay: React.FC<{ nom: string; role: string; heure: string; dejaPointe: boolean }> = ({ nom, role, heure, dejaPointe }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className={`w-full max-w-sm rounded-[2.5rem] border-4 p-8 text-center shadow-2xl ${dejaPointe ? 'border-amber-400 bg-white' : 'border-emerald-400 bg-white'}`}>
            <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${dejaPointe ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                {dejaPointe ? <AlertTriangle className="w-12 h-12 text-amber-600" /> : <CheckCircle2 className="w-12 h-12 text-emerald-600" />}
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-1">{nom}</h3>
            <p className="text-lg text-gray-500 font-bold mb-6 capitalize">{role}</p>
            <div className={`py-3 px-6 rounded-2xl font-black text-lg ${dejaPointe ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {dejaPointe ? 'DÉJÀ POINTÉ' : `SORTIE À ${heure}`}
            </div>
        </div>
    </div>
);

export const ScanSortieEnseignant: React.FC = () => {
    const [roster, setRoster] = useState<PersonnelRow[]>([]);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [flashError, setFlashError] = useState<string | null>(null);
    const [scanned, setScanned] = useState<{ nom: string; role: string; heure: string; dejaPointe: boolean } | null>(null);

    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const isScanningPaused = useRef(false);

    useEffect(() => {
        personnelApi.getPersonnel().then((data: PersonnelRow[]) => setRoster(data || [])).catch(() => setRoster([]));
    }, []);

    const registerSortie = useCallback(async (personnelId: string) => {
        const personne = roster.find(p => p.id === personnelId);
        if (!personne) {
            playErrorSound();
            setFlashError('BADGE INCONNU');
            isScanningPaused.current = true;
            setTimeout(() => { setFlashError(null); isScanningPaused.current = false; }, 600);
            return;
        }

        isScanningPaused.current = true;
        try {
            const status = await staffAttendanceApi.todayStatus(personnelId);
            const heure = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

            if (status.hasOut) {
                playErrorSound();
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                setScanned({ nom: personne.nom, role: personne.role, heure, dejaPointe: true });
            } else {
                await staffAttendanceApi.scan(personnelId, 'out');
                playSuccessSound();
                if (navigator.vibrate) navigator.vibrate(80);
                setScanned({ nom: personne.nom, role: personne.role, heure, dejaPointe: false });
            }
        } catch {
            playErrorSound();
            setFlashError('ERREUR RÉSEAU');
        } finally {
            setTimeout(() => {
                setScanned(null);
                setFlashError(null);
                isScanningPaused.current = false;
            }, 600);
        }
    }, [roster]);

    const startCamera = async () => {
        setCameraError('');
        setCameraActive(true);
        unlockAudio();
        await new Promise(resolve => setTimeout(resolve, 300));
        try {
            const html5QrCode = new Html5Qrcode('reader-staff-out');
            html5QrCodeRef.current = html5QrCode;
            await html5QrCode.start(
                { facingMode: { exact: 'environment' } },
                { fps: 25, qrbox: { width: 250, height: 250 } },
                (decodedText) => { if (!isScanningPaused.current) registerSortie(decodedText); },
                () => {}
            );
        } catch (err) {
            console.error('Camera Error:', err);
            setCameraError('Erreur matérielle ou permissions refusées.');
            setCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (html5QrCodeRef.current) {
            html5QrCodeRef.current.stop().then(() => {
                html5QrCodeRef.current?.clear();
                html5QrCodeRef.current = null;
            }).catch(e => console.error('Erreur arrêt caméra:', e));
        }
        setCameraActive(false);
    };

    useEffect(() => () => { html5QrCodeRef.current?.stop().catch(() => {}); }, []);

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <LogOut className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Pointage sortie — Personnel</h2>
                        <p className="text-slate-300 text-sm">Scan du badge en fin de journée de cours</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                        <Camera className="w-4 h-4 text-slate-600" />
                        Scanner une carte personnel
                    </h3>
                    <button
                        onClick={cameraActive ? stopCamera : startCamera}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${cameraActive ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-slate-800 text-white hover:bg-slate-900'}`}
                    >
                        {cameraActive ? <><X className="w-3.5 h-3.5" /> Arrêter</> : <><Camera className="w-3.5 h-3.5" /> Activer caméra</>}
                    </button>
                </div>

                {cameraActive && (
                    <div className="relative bg-black w-full" style={{ minHeight: '300px' }}>
                        <div id="reader-staff-out" className="w-full h-full"></div>
                        {flashError && (
                            <div className="absolute inset-0 bg-red-600/90 flex flex-col items-center justify-center text-white z-50 animate-pulse">
                                <AlertTriangle className="w-20 h-20 mb-4" />
                                <h2 className="text-4xl font-extrabold">{flashError}</h2>
                            </div>
                        )}
                    </div>
                )}

                {cameraError && (
                    <div className="p-4 bg-red-50 text-red-600 text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {cameraError}
                    </div>
                )}
            </div>

            {scanned && <ScannedOverlay {...scanned} />}
        </div>
    );
};

export default ScanSortieEnseignant;
