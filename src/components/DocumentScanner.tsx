import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, RotateCw, Contrast, X, Check, FileText, AlertTriangle, Sun } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import jsPDF from 'jspdf';

interface DocumentScannerProps {
  onCapture: (file: File, docType: string, title: string) => void;
  onClose: () => void;
  studentName: string;
}

// Helper functions for perspective projection (quadrilateral warping)
function solveLinearSystem(A: number[][], B: number[]) {
  const n = B.length;
  for (let i = 0; i < n; i++) {
    A[i].push(B[i]); // augmented matrix
  }
  
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
        maxRow = k;
      }
    }
    
    const temp = A[i];
    A[i] = A[maxRow];
    A[maxRow] = temp;
    
    if (Math.abs(A[i][i]) < 1e-10) {
      return null;
    }
    
    for (let k = i + 1; k < n; k++) {
      const factor = A[k][i] / A[i][i];
      for (let j = i; j <= n; j++) {
        A[k][j] -= factor * A[i][j];
      }
    }
  }
  
  const X = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += A[i][j] * X[j];
    }
    X[i] = (A[i][n] - sum) / A[i][i];
  }
  return X;
}

function getPerspectiveTransform(src: {x: number, y: number}[], dst: {x: number, y: number}[]) {
  const A = [];
  const B = [];
  
  for (let i = 0; i < 4; i++) {
    const sx = src[i].x;
    const sy = src[i].y;
    const dx = dst[i].x;
    const dy = dst[i].y;
    
    A.push([sx, sy, 1, 0, 0, 0, -sx * dx, -sy * dx]);
    B.push(dx);
    A.push([0, 0, 0, sx, sy, 1, -sx * dy, -sy * dy]);
    B.push(dy);
  }
  
  const X = solveLinearSystem(A, B);
  if (!X) return null;
  return [X[0], X[1], X[2], X[3], X[4], X[5], X[6], X[7], 1];
}

function perspectiveWarp(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  srcCorners: {x: number, y: number}[], // TL, TR, BR, BL
  dstWidth: number,
  dstHeight: number
) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = img.width;
  tempCanvas.height = img.height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;
  tempCtx.drawImage(img, 0, 0);
  const srcImgData = tempCtx.getImageData(0, 0, img.width, img.height);
  const srcData = srcImgData.data;
  
  const dstImgData = ctx.createImageData(dstWidth, dstHeight);
  const dstData = dstImgData.data;
  
  const dstCorners = [
    { x: 0, y: 0 },
    { x: dstWidth, y: 0 },
    { x: dstWidth, y: dstHeight },
    { x: 0, y: dstHeight }
  ];
  
  const H = getPerspectiveTransform(dstCorners, srcCorners);
  if (!H) return;
  
  const h00 = H[0], h01 = H[1], h02 = H[2];
  const h10 = H[3], h11 = H[4], h12 = H[5];
  const h20 = H[6], h21 = H[7];
  
  const imgWidth = img.width;
  const imgHeight = img.height;
  
  for (let y = 0; y < dstHeight; y++) {
    const y_offset = y * dstWidth;
    for (let x = 0; x < dstWidth; x++) {
      const w = h20 * x + h21 * y + 1;
      const sx = Math.round((h00 * x + h01 * y + h02) / w);
      const sy = Math.round((h10 * x + h11 * y + h12) / w);
      
      const dstIdx = (y_offset + x) * 4;
      
      if (sx >= 0 && sx < imgWidth && sy >= 0 && sy < imgHeight) {
        const srcIdx = (sy * imgWidth + sx) * 4;
        dstData[dstIdx] = srcData[srcIdx];
        dstData[dstIdx + 1] = srcData[srcIdx + 1];
        dstData[dstIdx + 2] = srcData[srcIdx + 2];
        dstData[dstIdx + 3] = srcData[srcIdx + 3];
      } else {
        dstData[dstIdx] = 255;
        dstData[dstIdx + 1] = 255;
        dstData[dstIdx + 2] = 255;
        dstData[dstIdx + 3] = 255;
      }
    }
  }
  ctx.putImageData(dstImgData, 0, 0);
}

export const DocumentScanner: React.FC<DocumentScannerProps> = ({ onCapture, onClose, studentName }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCamera, setHasCamera] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // Paramètres du document
  const [docType, setDocType] = useState('birth_certificate');
  const [docTitle, setDocTitle] = useState('Acte de naissance');

  // Filtres
  const [filterType, setFilterType] = useState<'original' | 'binarized'>('binarized');
  const [contrastValue, setContrastValue] = useState(50); // 0 à 100
  const [brightnessValue, setBrightnessValue] = useState(50); // 0 à 100
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [filteredPreview, setFilteredPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!capturedImage) {
      setFilteredPreview(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

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

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      if (filterType !== 'original') {
        const threshold = Math.max(10, Math.min(245, 128 + (50 - brightnessValue) * 2.2));
        const contrastFactor = (contrastValue - 50) * 1.5;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // 1. Grayscale
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;

          // 2. Contrast adjustment
          if (contrastFactor !== 0) {
            gray = ((gray - 128) * (128 + contrastFactor)) / 128 + 128;
          }

          // 3. Threshold binarization
          const val = gray > threshold ? 255 : 0;

          data[i] = val;
          data[i + 1] = val;
          data[i + 2] = val;
        }
      } else {
        // Original color filter with brightness/contrast adjustment
        if (brightnessValue !== 50 || contrastValue !== 50) {
          const bFactor = (brightnessValue - 50) * 2;
          const cFactor = (259 * ((contrastValue - 50) * 2.5 + 255)) / (255 * (259 - (contrastValue - 50) * 2.5));

          for (let i = 0; i < data.length; i += 4) {
            for (let j = 0; j < 3; j++) {
              let val = data[i + j];
              val = val + bFactor;
              val = cFactor * (val - 128) + 128;
              data[i + j] = Math.max(0, Math.min(255, val));
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      setFilteredPreview(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = capturedImage;
  }, [capturedImage, filterType, contrastValue, brightnessValue, rotation]);

  // Cadrage / Crop
  const [scanStep, setScanStep] = useState<'crop' | 'filter'>('crop');
  const [cropTL, setCropTL] = useState({ x: 5, y: 5 }); // %
  const [cropTR, setCropTR] = useState({ x: 95, y: 5 }); // %
  const [cropBL, setCropBL] = useState({ x: 5, y: 95 }); // %
  const [cropBR, setCropBR] = useState({ x: 95, y: 95 }); // %
  const [activeHandle, setActiveHandle] = useState<'tl' | 'tr' | 'bl' | 'br' | 'tm' | 'rm' | 'bm' | 'lm' | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const cornersRef = useRef({ tl: cropTL, tr: cropTR, bl: cropBL, br: cropBR });
  useEffect(() => {
    cornersRef.current = { tl: cropTL, tr: cropTR, bl: cropBL, br: cropBR };
  }, [cropTL, cropTR, cropBL, cropBR]);

  const handlePointerDown = (handle: 'tl' | 'tr' | 'bl' | 'br' | 'tm' | 'rm' | 'bm' | 'lm') => (e: React.MouseEvent | React.TouchEvent) => {
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

      const { tl, tr, bl, br } = cornersRef.current;

      if (activeHandle === 'tl') {
        setCropTL({ x, y });
      } else if (activeHandle === 'tr') {
        setCropTR({ x, y });
      } else if (activeHandle === 'bl') {
        setCropBL({ x, y });
      } else if (activeHandle === 'br') {
        setCropBR({ x, y });
      } else if (activeHandle === 'tm') {
        const midX = (tl.x + tr.x) / 2;
        const midY = (tl.y + tr.y) / 2;
        const dx = x - midX;
        const dy = y - midY;
        setCropTL({ x: Math.max(0, Math.min(100, tl.x + dx)), y: Math.max(0, Math.min(100, tl.y + dy)) });
        setCropTR({ x: Math.max(0, Math.min(100, tr.x + dx)), y: Math.max(0, Math.min(100, tr.y + dy)) });
      } else if (activeHandle === 'rm') {
        const midX = (tr.x + br.x) / 2;
        const midY = (tr.y + br.y) / 2;
        const dx = x - midX;
        const dy = y - midY;
        setCropTR({ x: Math.max(0, Math.min(100, tr.x + dx)), y: Math.max(0, Math.min(100, tr.y + dy)) });
        setCropBR({ x: Math.max(0, Math.min(100, br.x + dx)), y: Math.max(0, Math.min(100, br.y + dy)) });
      } else if (activeHandle === 'bm') {
        const midX = (bl.x + br.x) / 2;
        const midY = (bl.y + br.y) / 2;
        const dx = x - midX;
        const dy = y - midY;
        setCropBL({ x: Math.max(0, Math.min(100, bl.x + dx)), y: Math.max(0, Math.min(100, bl.y + dy)) });
        setCropBR({ x: Math.max(0, Math.min(100, br.x + dx)), y: Math.max(0, Math.min(100, br.y + dy)) });
      } else if (activeHandle === 'lm') {
        const midX = (tl.x + bl.x) / 2;
        const midY = (tl.y + bl.y) / 2;
        const dx = x - midX;
        const dy = y - midY;
        setCropTL({ x: Math.max(0, Math.min(100, tl.x + dx)), y: Math.max(0, Math.min(100, tl.y + dy)) });
        setCropBL({ x: Math.max(0, Math.min(100, bl.x + dx)), y: Math.max(0, Math.min(100, bl.y + dy)) });
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
  }, [activeHandle]);

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
        setOriginalImage(image.dataUrl);
        autoFlatten(image.dataUrl, { 
          tl: { x: 5, y: 5 }, tr: { x: 95, y: 5 }, bl: { x: 5, y: 95 }, br: { x: 95, y: 95 } 
        });
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
        setOriginalImage(dataUrl);
        autoFlatten(dataUrl, { 
          tl: { x: 5, y: 5 }, tr: { x: 95, y: 5 }, bl: { x: 5, y: 95 }, br: { x: 95, y: 95 } 
        });
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
          const dataUrl = event.target.result as string;
          setOriginalImage(dataUrl);
          autoFlatten(dataUrl, { 
            tl: { x: 5, y: 5 }, tr: { x: 95, y: 5 }, bl: { x: 5, y: 95 }, br: { x: 95, y: 95 } 
          });
          stopCamera();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 3.5 Auto-flatten function
  const autoFlatten = (sourceImage: string, corners: any) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      if (!ctx) return;

      const TL = { x: (corners.tl.x / 100) * img.width, y: (corners.tl.y / 100) * img.height };
      const TR = { x: (corners.tr.x / 100) * img.width, y: (corners.tr.y / 100) * img.height };
      const BL = { x: (corners.bl.x / 100) * img.width, y: (corners.bl.y / 100) * img.height };
      const BR = { x: (corners.br.x / 100) * img.width, y: (corners.br.y / 100) * img.height };

      const widthTop = Math.hypot(TR.x - TL.x, TR.y - TL.y);
      const widthBottom = Math.hypot(BR.x - BL.x, BR.y - BL.y);
      const dstWidth = Math.round(Math.max(widthTop, widthBottom));

      const heightLeft = Math.hypot(BL.x - TL.x, BL.y - TL.y);
      const heightRight = Math.hypot(BR.x - TR.x, BR.y - TR.y);
      const dstHeight = Math.round(Math.max(heightLeft, heightRight));

      canvas.width = dstWidth;
      canvas.height = dstHeight;
      ctx.clearRect(0, 0, dstWidth, dstHeight);
      
      perspectiveWarp(ctx, img, [TL, TR, BR, BL], dstWidth, dstHeight);

      const croppedDataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(croppedDataUrl);
      setFilterType('binarized');
      setScanStep('filter');
    };
    img.src = sourceImage;
  };

  // 3.6 Valider le cadrage manuel
  const handleNextStep = () => {
    if (!originalImage) return;
    autoFlatten(originalImage, { tl: cropTL, tr: cropTR, bl: cropBL, br: cropBR });
  };

  // 4. Appliquer les filtres de traitement d'image sur le Canvas
  const applyFiltersAndGetBlob = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const source = filteredPreview || capturedImage;
      if (!source || !canvasRef.current) {
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

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.clearRect(0, 0, img.width, img.height);
        ctx.drawImage(img, 0, 0);

        // Si filteredPreview n'est pas encore généré par sécurité,
        // on applique les filtres à la volée.
        if (!filteredPreview) {
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

          if (filterType !== 'original') {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;

            const threshold = Math.max(10, Math.min(245, 128 + (50 - brightnessValue) * 2.2));
            const contrastFactor = (contrastValue - 50) * 1.5;

            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];

              // 1. Grayscale
              let gray = 0.299 * r + 0.587 * g + 0.114 * b;

              // 2. Contrast adjustment
              if (contrastFactor !== 0) {
                gray = ((gray - 128) * (128 + contrastFactor)) / 128 + 128;
              }

              // 3. Threshold binarization
              const val = gray > threshold ? 255 : 0;

              data[i] = val;
              data[i + 1] = val;
              data[i + 2] = val;
            }

            ctx.putImageData(imgData, 0, 0);
          } else {
            // Original color filter with brightness/contrast adjustment
            if (brightnessValue !== 50 || contrastValue !== 50) {
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const data = imgData.data;
              const bFactor = (brightnessValue - 50) * 2;
              const cFactor = (259 * ((contrastValue - 50) * 2.5 + 255)) / (255 * (259 - (contrastValue - 50) * 2.5));

              for (let i = 0; i < data.length; i += 4) {
                for (let j = 0; j < 3; j++) {
                  let val = data[i + j];
                  val = val + bFactor;
                  val = cFactor * (val - 128) + 128;
                  data[i + j] = Math.max(0, Math.min(255, val));
                }
              }
              ctx.putImageData(imgData, 0, 0);
            }
          }
        }

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Erreur de conversion canvas en blob."));
          }
        }, 'image/png');
      };

      img.onerror = () => reject(new Error("Erreur de chargement de la source d'image."));
      img.src = source;
    });
  };

  // 5. Soumettre le document scanné sous forme d'image PNG
  const handleSubmit = async () => {
    try {
      const blob = await applyFiltersAndGetBlob();
      const fileName = `${docTitle.toLowerCase().replace(/\s+/g, '_')}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });
      
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-0 md:p-4 overflow-y-auto">
      <div className="w-full h-full md:h-auto md:max-h-[90vh] md:max-w-5xl bg-white dark:bg-slate-900 rounded-none md:rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row animate-slideUp">
        
        {/* Panneau de Numérisation / Capture */}
        <div className="flex-1 bg-slate-950 flex flex-col relative min-h-[300px] h-full justify-center">
          
          {/* Floating Close Button */}
          {!(capturedImage && scanStep === 'filter') && (
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-slate-900/60 backdrop-blur-md text-white hover:bg-slate-900/80 flex items-center justify-center transition border border-white/10 active:scale-95 cursor-pointer shadow-lg"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

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
                <div ref={containerRef} className="relative inline-block max-w-full max-h-[72vh] md:max-h-[82vh] select-none">
                  <img 
                    src={originalImage || capturedImage || ''} 
                    alt="Cadrage" 
                    className="max-w-full max-h-[72vh] md:max-h-[82vh] object-contain shadow-2xl rounded-lg pointer-events-none select-none" 
                  />
                  {/* Overlay SVG */}
                  <svg 
                    viewBox="0 0 100 100" 
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full select-none pointer-events-none z-10"
                  >
                    <defs>
                      <mask id="cropMask">
                        <rect x="0" y="0" width="100" height="100" fill="white" />
                        <polygon 
                          points={`${cropTL.x},${cropTL.y} ${cropTR.x},${cropTR.y} ${cropBR.x},${cropBR.y} ${cropBL.x},${cropBL.y}`} 
                          fill="black" 
                        />
                      </mask>
                    </defs>
                    
                    {/* Dark mask outside crop area */}
                    <rect x="0" y="0" width="100" height="100" fill="black" opacity="0.65" mask="url(#cropMask)" />
                    
                    {/* Border of crop box */}
                    <polygon 
                      points={`${cropTL.x},${cropTL.y} ${cropTR.x},${cropTR.y} ${cropBR.x},${cropBR.y} ${cropBL.x},${cropBL.y}`} 
                      fill="none" 
                      stroke={activeHandle ? "#f59e0b" : "#6366f1"} 
                      strokeWidth="0.8" 
                    />

                    {/* 3x3 Grid Lines inside the quad */}
                    <line 
                      x1={cropTL.x + (cropTR.x - cropTL.x) / 3} 
                      y1={cropTL.y + (cropTR.y - cropTL.y) / 3} 
                      x2={cropBL.x + (cropBR.x - cropBL.x) / 3} 
                      y2={cropBL.y + (cropBR.y - cropBL.y) / 3} 
                      stroke={activeHandle ? "#f59e0b" : "#6366f1"} 
                      strokeWidth="0.2" 
                      opacity="0.35" 
                    />
                    <line 
                      x1={cropTL.x + 2 * (cropTR.x - cropTL.x) / 3} 
                      y1={cropTL.y + 2 * (cropTR.y - cropTL.y) / 3} 
                      x2={cropBL.x + 2 * (cropBR.x - cropBL.x) / 3} 
                      y2={cropBL.y + 2 * (cropBR.y - cropBL.y) / 3} 
                      stroke={activeHandle ? "#f59e0b" : "#6366f1"} 
                      strokeWidth="0.2" 
                      opacity="0.35" 
                    />
                    <line 
                      x1={cropTL.x + (cropBL.x - cropTL.x) / 3} 
                      y1={cropTL.y + (cropBL.y - cropTL.y) / 3} 
                      x2={cropTR.x + (cropBR.x - cropTR.x) / 3} 
                      y2={cropTR.y + (cropBR.y - cropTR.y) / 3} 
                      stroke={activeHandle ? "#f59e0b" : "#6366f1"} 
                      strokeWidth="0.2" 
                      opacity="0.35" 
                    />
                    <line 
                      x1={cropTL.x + 2 * (cropBL.x - cropTL.x) / 3} 
                      y1={cropTL.y + 2 * (cropBL.y - cropTL.y) / 3} 
                      x2={cropTR.x + 2 * (cropBR.x - cropTR.x) / 3} 
                      y2={cropTR.y + 2 * (cropBR.y - cropTR.y) / 3} 
                      stroke={activeHandle ? "#f59e0b" : "#6366f1"} 
                      strokeWidth="0.2" 
                      opacity="0.35" 
                    />
                  </svg>

                  {/* Corner Handles - Styled as crop brackets */}
                  {/* Top Left */}
                  <div 
                    onMouseDown={handlePointerDown('tl')}
                    onTouchStart={handlePointerDown('tl')}
                    style={{ left: `${cropTL.x}%`, top: `${cropTL.y}%` }}
                    className={`absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-nwse-resize z-20 pointer-events-auto transition-all duration-150 ${activeHandle === 'tl' ? 'scale-125' : ''}`}
                  >
                    <div className={`w-6 h-6 border-t-4 border-l-4 rounded-tl-sm transition-colors ${activeHandle === 'tl' ? 'border-amber-400' : 'border-indigo-500'} absolute top-1/2 left-1/2`} />
                    <div className={`w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all ${activeHandle === 'tl' ? 'bg-amber-400 border-white scale-110 shadow-lg' : 'bg-white border-indigo-500 shadow-md'} absolute top-1/2 left-1/2 z-30`} />
                  </div>

                  {/* Top Right */}
                  <div 
                    onMouseDown={handlePointerDown('tr')}
                    onTouchStart={handlePointerDown('tr')}
                    style={{ left: `${cropTR.x}%`, top: `${cropTR.y}%` }}
                    className={`absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-nesw-resize z-20 pointer-events-auto transition-all duration-150 ${activeHandle === 'tr' ? 'scale-125' : ''}`}
                  >
                    <div className={`w-6 h-6 border-t-4 border-r-4 rounded-tr-sm transition-colors ${activeHandle === 'tr' ? 'border-amber-400' : 'border-indigo-500'} absolute top-1/2 right-1/2`} />
                    <div className={`w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all ${activeHandle === 'tr' ? 'bg-amber-400 border-white scale-110 shadow-lg' : 'bg-white border-indigo-500 shadow-md'} absolute top-1/2 right-1/2 z-30`} />
                  </div>

                  {/* Bottom Left */}
                  <div 
                    onMouseDown={handlePointerDown('bl')}
                    onTouchStart={handlePointerDown('bl')}
                    style={{ left: `${cropBL.x}%`, top: `${cropBL.y}%` }}
                    className={`absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-nesw-resize z-20 pointer-events-auto transition-all duration-150 ${activeHandle === 'bl' ? 'scale-125' : ''}`}
                  >
                    <div className={`w-6 h-6 border-b-4 border-l-4 rounded-bl-sm transition-colors ${activeHandle === 'bl' ? 'border-amber-400' : 'border-indigo-500'} absolute bottom-1/2 left-1/2`} />
                    <div className={`w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all ${activeHandle === 'bl' ? 'bg-amber-400 border-white scale-110 shadow-lg' : 'bg-white border-indigo-500 shadow-md'} absolute bottom-1/2 left-1/2 z-30`} />
                  </div>

                  {/* Bottom Right */}
                  <div 
                    onMouseDown={handlePointerDown('br')}
                    onTouchStart={handlePointerDown('br')}
                    style={{ left: `${cropBR.x}%`, top: `${cropBR.y}%` }}
                    className={`absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-nwse-resize z-20 pointer-events-auto transition-all duration-150 ${activeHandle === 'br' ? 'scale-125' : ''}`}
                  >
                    <div className={`w-6 h-6 border-b-4 border-r-4 rounded-br-sm transition-colors ${activeHandle === 'br' ? 'border-amber-400' : 'border-indigo-500'} absolute bottom-1/2 right-1/2`} />
                    <div className={`w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all ${activeHandle === 'br' ? 'bg-amber-400 border-white scale-110 shadow-lg' : 'bg-white border-indigo-500 shadow-md'} absolute bottom-1/2 right-1/2 z-30`} />
                  </div>

                  {/* Side Handles - Styled as grab pills */}
                  {/* Top Middle */}
                  <div 
                    onMouseDown={handlePointerDown('tm')}
                    onTouchStart={handlePointerDown('tm')}
                    style={{ left: `${(cropTL.x + cropTR.x) / 2}%`, top: `${(cropTL.y + cropTR.y) / 2}%` }}
                    className={`absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-ns-resize z-20 pointer-events-auto transition-all duration-150 ${activeHandle === 'tm' ? 'scale-125' : ''}`}
                  >
                    <div className={`w-8 h-2.5 rounded-full border-2 transition-all ${activeHandle === 'tm' ? 'bg-amber-400 border-white scale-110 shadow-lg' : 'bg-white border-indigo-500 shadow-md'} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30`} />
                  </div>

                  {/* Right Middle */}
                  <div 
                    onMouseDown={handlePointerDown('rm')}
                    onTouchStart={handlePointerDown('rm')}
                    style={{ left: `${(cropTR.x + cropBR.x) / 2}%`, top: `${(cropTR.y + cropBR.y) / 2}%` }}
                    className={`absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-ew-resize z-20 pointer-events-auto transition-all duration-150 ${activeHandle === 'rm' ? 'scale-125' : ''}`}
                  >
                    <div className={`w-2.5 h-8 rounded-full border-2 transition-all ${activeHandle === 'rm' ? 'bg-amber-400 border-white scale-110 shadow-lg' : 'bg-white border-indigo-500 shadow-md'} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30`} />
                  </div>

                  {/* Bottom Middle */}
                  <div 
                    onMouseDown={handlePointerDown('bm')}
                    onTouchStart={handlePointerDown('bm')}
                    style={{ left: `${(cropBL.x + cropBR.x) / 2}%`, top: `${(cropBL.y + cropBR.y) / 2}%` }}
                    className={`absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-ns-resize z-20 pointer-events-auto transition-all duration-150 ${activeHandle === 'bm' ? 'scale-125' : ''}`}
                  >
                    <div className={`w-8 h-2.5 rounded-full border-2 transition-all ${activeHandle === 'bm' ? 'bg-amber-400 border-white scale-110 shadow-lg' : 'bg-white border-indigo-500 shadow-md'} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30`} />
                  </div>

                  {/* Left Middle */}
                  <div 
                    onMouseDown={handlePointerDown('lm')}
                    onTouchStart={handlePointerDown('lm')}
                    style={{ left: `${(cropTL.x + cropBL.x) / 2}%`, top: `${(cropTL.y + cropBL.y) / 2}%` }}
                    className={`absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-ew-resize z-20 pointer-events-auto transition-all duration-150 ${activeHandle === 'lm' ? 'scale-125' : ''}`}
                  >
                    <div className={`w-2.5 h-8 rounded-full border-2 transition-all ${activeHandle === 'lm' ? 'bg-amber-400 border-white scale-110 shadow-lg' : 'bg-white border-indigo-500 shadow-md'} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30`} />
                  </div>
                </div>
              ) : (
                <img 
                  src={filteredPreview || capturedImage || ''} 
                  alt="Capture Preview" 
                  style={{ transform: filteredPreview ? 'none' : `rotate(${rotation}deg)` }}
                  className="max-w-full max-h-[62vh] md:max-h-[72vh] object-contain shadow-2xl rounded-lg transition-transform duration-300 pointer-events-none select-none" 
                />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6">
              <AlertTriangle className="w-12 h-12 text-amber-500 mb-4 animate-pulse" />
              <p className="font-bold text-center text-sm">Caméra indisponible ou permission refusée.</p>
              <p className="text-xs text-slate-500 text-center mt-1 mb-4">Veuillez importer un fichier ou autoriser l'accès dans les paramètres de votre appareil.</p>
              <button 
                onClick={isNative ? takeNativePhoto : startCamera}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <RotateCw className="w-3.5 h-3.5" /> {isNative ? "Ouvrir l'appareil photo" : "Réessayer d'activer la caméra"}
              </button>
            </div>
          )}

          {/* Actions rapides bas d'écran image */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10 bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-xl">
            {cameraActive && !capturedImage && (
              <button 
                onClick={capturePhoto}
                className="w-14 h-14 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition cursor-pointer"
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
                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full font-black text-xs uppercase tracking-wider active:scale-95 transition flex items-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    <Check className="w-4 h-4" /> Valider le cadrage
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        setCapturedImage(originalImage);
                        setScanStep('crop');
                      }}
                      className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold text-xs active:scale-95 transition flex items-center gap-1.5 shadow-lg"
                    >
                      Recadrer
                    </button>
                    <button 
                      onClick={() => setRotation((prev) => (prev + 90) % 360)}
                      className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 active:scale-95 transition cursor-pointer"
                      title="Tourner 90°"
                    >
                      <RotateCw className="w-5 h-5" />
                    </button>
                  </>
                )}
                 <button 
                  onClick={() => {
                    setCapturedImage(null);
                    setOriginalImage(null);
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
              <label className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 active:scale-95 transition cursor-pointer shadow-md" title="Importer un document">
                <Upload className="w-5 h-5" />
                <input type="file" accept="image/*" onChange={handleFileImport} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Panneau de configuration (Filtres et métadonnées) */}
        {capturedImage && scanStep === 'filter' && (
          <div className="w-full md:w-[360px] p-6 lg:p-8 flex flex-col justify-between overflow-y-auto border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 animate-fadeIn">
            
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">Numériseur de document</h4>
                  <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider mt-0.5">{studentName}</p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center transition cursor-pointer"
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
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>
              </div>

              {/* Filtres de Traitement */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Contrast className="w-3.5 h-3.5" /> Traitement d'image magique
                </label>
                
                {/* Sélecteurs de filtre */}
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: 'binarized', label: 'Noir & Blanc' },
                    { id: 'original', label: 'Couleur' },
                  ] as const).map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setFilterType(filter.id)}
                      className={`py-2 px-3 rounded-xl border text-[11px] font-bold tracking-wide transition-all cursor-pointer ${
                        filterType === filter.id 
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500 shadow-sm' 
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Luminosité Slider */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      Luminosité
                    </span>
                    <span>{brightnessValue}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="90" 
                    value={brightnessValue} 
                    onChange={(e) => setBrightnessValue(Number(e.target.value))}
                    className="w-full h-1 bg-slate-100 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-semibold px-0.5">
                    <span>Plus sombre</span>
                    <span>Standard</span>
                    <span>Plus clair</span>
                  </div>
                </div>

                {/* Contraste Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Contrast className="w-3.5 h-3.5 text-indigo-500" />
                      Contraste & Épaisseur
                    </span>
                    <span>{contrastValue}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="90" 
                    value={contrastValue} 
                    onChange={(e) => setContrastValue(Number(e.target.value))}
                    className="w-full h-1 bg-slate-100 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-semibold px-0.5">
                    <span>Doux</span>
                    <span>Standard</span>
                    <span>Prononcé</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Validation */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 mt-6 md:mt-0 flex flex-col gap-2">
              <button
                onClick={handleSubmit}
                className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 hover:bg-indigo-600 active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Numériser & Envoyer
              </button>
              <p className="text-[9px] text-center text-slate-400 font-bold leading-normal">
                Le document sera associé au profil de l'élève et une notification push sera envoyée immédiatement aux parents.
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
