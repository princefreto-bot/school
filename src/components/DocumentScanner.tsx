import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, RotateCw, Contrast, X, Check, FileText, AlertTriangle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';

interface DocumentScannerProps {
  onCapture: (file: File, docType: string, title: string) => void;
  onClose: () => void;
  studentName: string;
}

export const DocumentScanner: React.FC<DocumentScannerProps> = ({ onCapture, onClose, studentName }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCamera, setHasCamera] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // Paramètres du document
  const [docType, setDocType] = useState('birth_certificate');
  const [docTitle, setDocTitle] = useState('Acte de naissance');

  // Filtres
  const [filterType, setFilterType] = useState<'original' | 'grayscale' | 'magic' | 'binarized'>('original');
  const [contrastValue, setContrastValue] = useState(50); // 0 à 100
  const [brightnessValue, setBrightnessValue] = useState(50); // 0 à 100
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270

  // Cadrage / Crop
  const [scanStep, setScanStep] = useState<'crop' | 'filter'>('crop');
  const [cropLeft, setCropLeft] = useState(5); // %
  const [cropTop, setCropTop] = useState(5); // %
  const [cropRight, setCropRight] = useState(95); // %
  const [cropBottom, setCropBottom] = useState(95); // %
  const [activeHandle, setActiveHandle] = useState<'tl' | 'tr' | 'bl' | 'br' | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handlePointerDown = (handle: 'tl' | 'tr' | 'bl' | 'br') => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setActiveHandle(handle);
  };

  useEffect(() => {
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!activeHandle || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      let x = ((clientX - rect.left) / rect.width) * 100;
      let y = ((clientY - rect.top) / rect.height) * 100;

      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));

      const minSize = 10;

      if (activeHandle === 'tl') {
        setCropLeft(Math.min(x, cropRight - minSize));
        setCropTop(Math.min(y, cropBottom - minSize));
      } else if (activeHandle === 'tr') {
        setCropRight(Math.max(x, cropLeft + minSize));
        setCropTop(Math.min(y, cropBottom - minSize));
      } else if (activeHandle === 'bl') {
        setCropLeft(Math.min(x, cropRight - minSize));
        setCropBottom(Math.max(y, cropTop + minSize));
      } else if (activeHandle === 'br') {
        setCropRight(Math.max(x, cropLeft + minSize));
        setCropBottom(Math.max(y, cropTop + minSize));
      }
    };

    const handlePointerUp = () => {
      setActiveHandle(null);
    };

    if (activeHandle) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp);
    }

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [activeHandle, cropLeft, cropTop, cropRight, cropBottom]);

  const isNative = Capacitor.isNativePlatform();

  // 1. Initialiser la caméra
  useEffect(() => {
    if (isNative) {
      takeNativePhoto();
    } else {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, []);

  const takeNativePhoto = async () => {
    try {
      console.log("[Camera] Launching native camera...");
      const image = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });
      
      if (image.dataUrl) {
        setCapturedImage(image.dataUrl);
        setScanStep('crop');
        setCropLeft(5);
        setCropTop(5);
        setCropRight(95);
        setCropBottom(95);
        setHasCamera(true);
        setCameraActive(false);
      }
    } catch (err) {
      console.warn("Utilisateur a annulé ou erreur appareil photo natif:", err);
      setHasCamera(false);
      setCameraActive(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasCamera(true);
        setCameraActive(true);
      }
    } catch (err) {
      console.warn("Accès caméra refusé ou non disponible. Mode import fichier actif.", err);
      setHasCamera(false);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // 2. Prendre une photo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        setScanStep('crop');
        setCropLeft(5);
        setCropTop(5);
        setCropRight(95);
        setCropBottom(95);
        stopCamera();
      }
    }
  };

  // 3. Importer un fichier
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedImage(event.target.result as string);
          setScanStep('crop');
          setCropLeft(5);
          setCropTop(5);
          setCropRight(95);
          setCropBottom(95);
          stopCamera();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 3.5 Valider le cadrage (Crop)
  const handleNextStep = () => {
    if (!capturedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      if (!ctx) return;

      const srcX = (cropLeft / 100) * img.width;
      const srcY = (cropTop / 100) * img.height;
      const srcWidth = ((cropRight - cropLeft) / 100) * img.width;
      const srcHeight = ((cropBottom - cropTop) / 100) * img.height;

      canvas.width = srcWidth;
      canvas.height = srcHeight;
      ctx.clearRect(0, 0, srcWidth, srcHeight);
      ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, srcWidth, srcHeight);

      const croppedDataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(croppedDataUrl);
      setScanStep('filter');
    };
    img.src = capturedImage;
  };

  // 4. Appliquer les filtres de traitement d'image sur le Canvas
  const applyFiltersAndGetBlob = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!capturedImage || !canvasRef.current) {
        reject(new Error("Aucune image chargée."));
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        if (!ctx) {
          reject(new Error("Impossible de créer le contexte 2D."));
          return;
        }

        // Gérer la rotation
        const isRotated90or270 = rotation === 90 || rotation === 270;
        const width = isRotated90or270 ? img.height : img.width;
        const height = isRotated90or270 ? img.width : img.height;

        canvas.width = width;
        canvas.height = height;

        ctx.clearRect(0, 0, width, height);
        ctx.translate(width / 2, height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.rotate(-(rotation * Math.PI) / 180);
        ctx.translate(-width / 2, -height / 2);

        // Appliquer les filtres pixel-par-pixel
        if (filterType !== 'original') {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          // Calculer le contraste et la luminosité
          // Contraste de 0 à 100 -> facteur
          const contrast = (contrastValue - 50) * 2; // -100 à 100
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          
          const brightness = (brightnessValue - 50) * 2.5; // -125 à 125

          for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // 1. Grayscale
            if (filterType === 'grayscale' || filterType === 'binarized' || filterType === 'magic') {
              const gray = 0.299 * r + 0.587 * g + 0.114 * b;
              r = gray;
              g = gray;
              b = gray;
            }

            // 2. Luminosité
            r += brightness;
            g += brightness;
            b += brightness;

            // 3. Contraste
            r = factor * (r - 128) + 128;
            g = factor * (g - 128) + 128;
            b = factor * (b - 128) + 128;

            // 4. Binarisation (seuillage noir et blanc CamScanner agressif)
            if (filterType === 'binarized') {
              const gray = (r + g + b) / 3;
              const threshold = 135; // Seuil standard
              const val = gray > threshold ? 255 : 0;
              r = val;
              g = val;
              b = val;
            } 
            
            // 5. Couleur magique : blanchiment des zones presque blanches (fond du papier)
            if (filterType === 'magic') {
              // Blanchir le fond si c'est déjà clair
              const gray = (r + g + b) / 3;
              if (gray > 180) {
                r = Math.min(255, r * 1.25);
                g = Math.min(255, g * 1.25);
                b = Math.min(255, b * 1.25);
              } else {
                // Rendre les écritures sombres encore plus noires
                r = Math.max(0, r * 0.75);
                g = Math.max(0, g * 0.75);
                b = Math.max(0, b * 0.75);
              }
            }

            // Clamping
            data[i] = Math.min(255, Math.max(0, r));
            data[i + 1] = Math.min(255, Math.max(0, g));
            data[i + 2] = Math.min(255, Math.max(0, b));
          }

          ctx.putImageData(imgData, 0, 0);
        }

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Erreur de conversion canvas en blob."));
          }
        }, 'image/jpeg', 0.85);
      };

      img.onerror = () => reject(new Error("Erreur de chargement de la source d'image."));
      img.src = capturedImage;
    });
  };

  // 5. Soumettre le document scanné
  const handleSubmit = async () => {
    try {
      const blob = await applyFiltersAndGetBlob();
      const file = new File([blob], `${docTitle.toLowerCase().replace(/\s+/g, '_')}.jpg`, { type: 'image/jpeg' });
      onCapture(file, docType, docTitle);
    } catch (err: any) {
      alert("Erreur lors du traitement du scan : " + err.message);
    }
  };

  // Mettre à jour le titre automatique lors du changement de type
  const handleTypeChange = (type: string) => {
    setDocType(type);
    switch (type) {
      case 'birth_certificate':
        setDocTitle('Acte de naissance');
        break;
      case 'report_card':
        setDocTitle('Ancien bulletin scolaire');
        break;
      case 'certificate':
        setDocTitle('Attestation scolaire');
        break;
      default:
        setDocTitle('Pièce numérisée');
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row h-full max-h-[85vh] animate-slideUp">
        
        {/* Panneau de Numérisation / Capture */}
        <div className="flex-1 bg-slate-950 flex flex-col relative h-[50vh] md:h-auto min-h-[300px]">
          
          {cameraActive && !capturedImage ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
          ) : capturedImage ? (
            <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden bg-slate-900 select-none">
              {scanStep === 'crop' ? (
                <div ref={containerRef} className="relative inline-block max-w-full max-h-[40vh] md:max-h-[55vh] select-none">
                  <img 
                    src={capturedImage} 
                    alt="Cadrage" 
                    className="max-w-full max-h-[40vh] md:max-h-[55vh] object-contain shadow-2xl rounded-lg pointer-events-none select-none" 
                  />
                  {/* Overlay SVG */}
                  <svg className="absolute inset-0 w-full h-full select-none pointer-events-none z-10">
                    <defs>
                      <mask id="cropMask">
                        <rect width="100%" height="100%" fill="white" />
                        <rect 
                          x={`${cropLeft}%`} 
                          y={`${cropTop}%`} 
                          width={`${cropRight - cropLeft}%`} 
                          height={`${cropBottom - cropTop}%`} 
                          fill="black" 
                        />
                      </mask>
                    </defs>
                    
                    {/* Dark mask outside crop area */}
                    <rect width="100%" height="100%" fill="black" opacity="0.6" mask="url(#cropMask)" />
                    
                    {/* Border of crop box */}
                    <rect 
                      x={`${cropLeft}%`} 
                      y={`${cropTop}%`} 
                      width={`${cropRight - cropLeft}%`} 
                      height={`${cropBottom - cropTop}%`} 
                      fill="none" 
                      stroke="#f59e0b" 
                      strokeWidth="2.5" 
                      strokeDasharray="5 5"
                    />
                  </svg>

                  {/* Corner Handles */}
                  {/* Top Left */}
                  <div 
                    onMouseDown={handlePointerDown('tl')}
                    onTouchStart={handlePointerDown('tl')}
                    style={{ left: `${cropLeft}%`, top: `${cropTop}%` }}
                    className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-nwse-resize z-20 pointer-events-auto active:scale-125 transition-transform"
                  >
                    <div className="w-5 h-5 rounded-full bg-amber-500 border-2 border-white shadow-xl" />
                  </div>

                  {/* Top Right */}
                  <div 
                    onMouseDown={handlePointerDown('tr')}
                    onTouchStart={handlePointerDown('tr')}
                    style={{ left: `${cropRight}%`, top: `${cropTop}%` }}
                    className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-nesw-resize z-20 pointer-events-auto active:scale-125 transition-transform"
                  >
                    <div className="w-5 h-5 rounded-full bg-amber-500 border-2 border-white shadow-xl" />
                  </div>

                  {/* Bottom Left */}
                  <div 
                    onMouseDown={handlePointerDown('bl')}
                    onTouchStart={handlePointerDown('bl')}
                    style={{ left: `${cropLeft}%`, top: `${cropBottom}%` }}
                    className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-nesw-resize z-20 pointer-events-auto active:scale-125 transition-transform"
                  >
                    <div className="w-5 h-5 rounded-full bg-amber-500 border-2 border-white shadow-xl" />
                  </div>

                  {/* Bottom Right */}
                  <div 
                    onMouseDown={handlePointerDown('br')}
                    onTouchStart={handlePointerDown('br')}
                    style={{ left: `${cropRight}%`, top: `${cropBottom}%` }}
                    className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-nwse-resize z-20 pointer-events-auto active:scale-125 transition-transform"
                  >
                    <div className="w-5 h-5 rounded-full bg-amber-500 border-2 border-white shadow-xl" />
                  </div>
                </div>
              ) : (
                <img 
                  src={capturedImage} 
                  alt="Capture Preview" 
                  style={{ transform: `rotate(${rotation}deg)` }}
                  className="max-w-full max-h-[40vh] md:max-h-[50vh] object-contain shadow-2xl rounded-lg transition-transform duration-300 pointer-events-none select-none" 
                />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6">
              <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
              <p className="font-bold text-center text-sm">Caméra indisponible ou permission refusée.</p>
              <p className="text-xs text-slate-500 text-center mt-1 mb-4">Veuillez importer un fichier ou autoriser l'accès dans les paramètres de votre appareil.</p>
              <button 
                onClick={isNative ? takeNativePhoto : startCamera}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" /> {isNative ? "Ouvrir l'appareil photo" : "Réessayer d'activer la caméra"}
              </button>
            </div>
          )}

          {/* Actions rapides bas d'écran image */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10 bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
            {cameraActive && !capturedImage && (
              <button 
                onClick={capturePhoto}
                className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition cursor-pointer"
                title="Prendre la photo"
              >
                <Camera className="w-6 h-6" />
              </button>
            )}

            {capturedImage && (
              <>
                {scanStep === 'crop' ? (
                  <button 
                    onClick={handleNextStep}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-black text-xs uppercase tracking-wider active:scale-95 transition flex items-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    <Check className="w-4 h-4" /> Valider le cadrage
                  </button>
                ) : (
                  <button 
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                    className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 active:scale-95 transition cursor-pointer"
                    title="Tourner 90°"
                  >
                    <RotateCw className="w-5 h-5" />
                  </button>
                )}
                 <button 
                  onClick={() => {
                    setCapturedImage(null);
                    setRotation(0);
                    setScanStep('crop');
                    if (isNative) {
                      takeNativePhoto();
                    } else {
                      startCamera();
                    }
                  }}
                  className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-bold text-xs active:scale-95 transition cursor-pointer shadow-lg"
                >
                  Recommencer
                </button>
              </>
            )}

            {!capturedImage && (
              <label className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 active:scale-95 transition cursor-pointer" title="Importer un document">
                <Upload className="w-5 h-5" />
                <input type="file" accept="image/*" onChange={handleFileImport} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Panneau de configuration (Filtres et métadonnées) */}
        <div className="w-full md:w-[360px] p-6 lg:p-8 flex flex-col justify-between overflow-y-auto border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">Numériseur de document</h4>
                <p className="text-[11px] font-bold text-amber-500 uppercase tracking-wider mt-0.5">{studentName}</p>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type & Titre */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type de pièce</label>
                <select 
                  value={docType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-300"
                >
                  <option value="birth_certificate">Acte de naissance</option>
                  <option value="report_card">Ancien bulletin scolaire</option>
                  <option value="certificate">Attestation ou Certificat</option>
                  <option value="other">Autre document</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom explicite du document</label>
                <input 
                  type="text" 
                  value={docTitle} 
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Ex: Acte de Naissance - [Nom]" 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-xl text-sm"
                  required
                />
              </div>
            </div>

            {/* Filtres de Traitement */}
            {capturedImage && scanStep === 'filter' && (
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Contrast className="w-3.5 h-3.5" /> Traitement d'image magique
                </label>
                
                {/* Sélecteurs de filtre */}
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: 'original', label: 'Original' },
                    { id: 'grayscale', label: 'Noir & Blanc' },
                    { id: 'magic', label: 'Magique Color' },
                    { id: 'binarized', label: 'Binarisé' },
                  ] as const).map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setFilterType(filter.id)}
                      className={`py-2 px-3 rounded-xl border text-[11px] font-bold tracking-wide transition-all ${
                        filterType === filter.id 
                          ? 'border-amber-500 bg-amber-500/10 text-amber-500' 
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Sliders avancés si non-original */}
                {filterType !== 'original' && (
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                        <span>Contraste</span>
                        <span>{contrastValue}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={contrastValue}
                        onChange={(e) => setContrastValue(Number(e.target.value))}
                        className="w-full accent-amber-500" 
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                        <span>Luminosité</span>
                        <span>{brightnessValue}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={brightnessValue}
                        onChange={(e) => setBrightnessValue(Number(e.target.value))}
                        className="w-full accent-amber-500" 
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Validation */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 mt-6 md:mt-0 flex flex-col gap-2">
            {!capturedImage ? (
              <button
                disabled
                className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              >
                <Check className="w-4 h-4" /> Numériser & Envoyer
              </button>
            ) : scanStep === 'crop' ? (
              <button
                onClick={handleNextStep}
                className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 bg-amber-500 text-white shadow-xl shadow-amber-500/20 hover:bg-amber-600 active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Valider le cadrage
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 bg-amber-500 text-white shadow-xl shadow-amber-500/20 hover:bg-amber-600 active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Numériser & Envoyer
              </button>
            )}
            <p className="text-[9px] text-center text-slate-400 font-bold leading-normal">
              Le document sera associé au profil de l'élève et une notification push sera envoyée immédiatement aux parents.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
