import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { API_BASE_URL } from '../config';
import {
  Save, School, MessageSquare, Shield, Info,
  Upload, X, Image, Clock, Plus, Calendar, Trash2, Database, Layers,
  CheckCircle2, Circle, ChevronDown, Phone, MapPin, Mail, Globe, FileBadge2,
  Landmark, Sparkles, UserSquare2, Wallet, RefreshCw
} from 'lucide-react';
import { CLASS_CONFIG } from '../data/classConfig';
import { SchoolBackups } from '../components/SchoolBackups';
import { AutoReminderSettings } from '../components/AutoReminderSettings';
import { ParentSatisfactionOverview } from '../components/ParentSatisfactionOverview';

// ── Interrupteur réutilisable, plus lisible qu'une case à cocher pour un réglage on/off ──
const ToggleSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
  <label className="flex items-center justify-between gap-3 cursor-pointer select-none py-1.5">
    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-4' : ''}`} />
    </button>
  </label>
);

// ── En-tête de sous-section, cohérent partout dans la page ──
const SectionHeading: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
  <div className="flex items-start gap-2.5 mb-4">
    <div className="mt-0.5 text-indigo-500 shrink-0">{icon}</div>
    <div>
      <h4 className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{title}</h4>
      {subtitle && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

export const Parametres: React.FC = () => {
  const schoolName = useStore((s) => s.schoolName);
  const schoolYear = useStore((s) => s.schoolYear);
  const messageRemerciement = useStore((s) => s.messageRemerciement);
  const messageRappel = useStore((s) => s.messageRappel);
  const appName = useStore((s) => s.appName);
  const schoolLogo = useStore((s) => s.schoolLogo);
  const schoolStamp = useStore((s) => s.schoolStamp);
  const officialSeal = useStore((s) => s.officialSeal);
  const directorSignature = useStore((s) => s.directorSignature);
  const directorName = useStore((s) => s.directorName);
  const directorTitle = useStore((s) => s.directorTitle);
  const showStampOnCards = useStore((s) => s.showStampOnCards);
  const showSignatureOnCards = useStore((s) => s.showSignatureOnCards);
  const showSealOnCards = useStore((s) => s.showSealOnCards);
  const showStampOnBulletins = useStore((s) => s.showStampOnBulletins);
  const showSignatureOnBulletins = useStore((s) => s.showSignatureOnBulletins);
  const user = useStore((s) => s.user);
  const academicYears = useStore((s) => s.academicYears) || [];

  const schoolMotto = useStore((s) => s.schoolMotto);
  const schoolBp = useStore((s) => s.schoolBp);
  const schoolTelephone = useStore((s) => s.schoolTelephone);
  const schoolAddress = useStore((s) => s.schoolAddress);
  const schoolCurrency = useStore((s) => s.schoolCurrency);
  const schoolIfu = useStore((s) => s.schoolIfu);
  const schoolRccm = useStore((s) => s.schoolRccm);
  const schoolNif = useStore((s) => s.schoolNif);
  const schoolEmail = useStore((s) => s.schoolEmail);
  const schoolWebsite = useStore((s) => s.schoolWebsite);
  const schoolAutorisation = useStore((s) => s.schoolAutorisation);
  const heuresMensuellesStandard = useStore((s) => s.heuresMensuellesStandard);
  const countryName = useStore((s) => s.countryName);
  const countryMotto = useStore((s) => s.countryMotto);
  const ministereName = useStore((s) => s.ministereName);

  const [localSchool, setLocalSchool] = useState(schoolName);
  const [localYear, setLocalYear] = useState(schoolYear);
  const [localRem, setLocalRem] = useState(messageRemerciement);
  const [localRap, setLocalRap] = useState(messageRappel);
  const [localAppName, setLocalAppName] = useState(appName);
  const [localMotto, setLocalMotto] = useState(schoolMotto);
  const [localBp, setLocalBp] = useState(schoolBp);
  const [localTelephone, setLocalTelephone] = useState(schoolTelephone);
  const [localAddress, setLocalAddress] = useState(schoolAddress);
  const [localCurrency, setLocalCurrency] = useState(schoolCurrency);
  const [localIfu, setLocalIfu] = useState(schoolIfu || '');
  const [localRccm, setLocalRccm] = useState(schoolRccm || '');
  const [localNif, setLocalNif] = useState(schoolNif || '');
  const [localEmail, setLocalEmail] = useState(schoolEmail || '');
  const [localWebsite, setLocalWebsite] = useState(schoolWebsite || '');
  const [localAutorisation, setLocalAutorisation] = useState(schoolAutorisation || '');
  const [localHeuresMensuelles, setLocalHeuresMensuelles] = useState(heuresMensuellesStandard != null ? String(heuresMensuellesStandard) : '');
  const [localCountryName, setLocalCountryName] = useState(countryName);
  const [localCountryMotto, setLocalCountryMotto] = useState(countryMotto);
  const [localMinistereName, setLocalMinistereName] = useState(ministereName);
  const [localDirectorName, setLocalDirectorName] = useState(directorName || '');
  const [localDirectorTitle, setLocalDirectorTitle] = useState(directorTitle || 'Directeur');
  const [localShowStampOnCards, setLocalShowStampOnCards] = useState(showStampOnCards !== undefined ? showStampOnCards : true);
  const [localShowSignatureOnCards, setLocalShowSignatureOnCards] = useState(showSignatureOnCards !== undefined ? showSignatureOnCards : true);
  const [localShowSealOnCards, setLocalShowSealOnCards] = useState(showSealOnCards !== undefined ? showSealOnCards : true);
  const [localShowStampOnBulletins, setLocalShowStampOnBulletins] = useState(showStampOnBulletins !== undefined ? showStampOnBulletins : true);
  const [localShowSignatureOnBulletins, setLocalShowSignatureOnBulletins] = useState(showSignatureOnBulletins !== undefined ? showSignatureOnBulletins : true);
  const [saved, setSaved] = useState(false);
  
  const [logoPreview, setLogoPreview] = useState<string | null>(schoolLogo);
  const [logoError, setLogoError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [stampPreview, setStampPreview] = useState<string | null>(schoolStamp);
  const [stampError, setStampError] = useState('');
  const stampFileRef = useRef<HTMLInputElement>(null);

  const [signaturePreview, setSignaturePreview] = useState<string | null>(directorSignature);
  const [signatureError, setSignatureError] = useState('');
  const signatureFileRef = useRef<HTMLInputElement>(null);

  const [sealPreview, setSealPreview] = useState<string | null>(officialSeal);
  const [sealError, setSealError] = useState('');
  const sealFileRef = useRef<HTMLInputElement>(null);

  const cycleSchedules = useStore((s) => s.cycleSchedules);
  const setCycleSchedules = useStore((s) => s.setCycleSchedules);
  const [localSchedules, setLocalSchedules] = useState(cycleSchedules);
  const [scheduleSaved, setScheduleSaved] = useState(false);

  const tranches = useStore((s) => s.tranches);
  const setTranches = useStore((s) => s.setTranches);
  const [localTranches, setLocalTranches] = useState(tranches || []);
  const [tranchesSaved, setTranchesSaved] = useState(false);

  // ── Frais de scolarité personnalisés par classe ──
  const classFees = useStore((s) => s.classFees);
  const recalculateStudentFees = useStore((s) => s.recalculateStudentFees);
  const [localClassFees, setLocalClassFees] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    CLASS_CONFIG.forEach((c) => {
      const override = classFees?.[c.name];
      initial[c.name] = String(override != null ? override : c.ecolage);
    });
    return initial;
  });
  const [feesSaved, setFeesSaved] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [recalcMessage, setRecalcMessage] = useState('');

  const handleSaveFees = async () => {
    const fees: Record<string, number> = {};
    CLASS_CONFIG.forEach((c) => {
      const val = Number(localClassFees[c.name]);
      if (!Number.isNaN(val) && val > 0 && val !== c.ecolage) fees[c.name] = val;
    });

    await updateAllSettings({ classFees: fees });
    setFeesSaved(true);
    setTimeout(() => setFeesSaved(false), 3000);
    setRecalcMessage('');

    const hasOverrides = Object.keys(fees).length > 0;
    if (hasOverrides && window.confirm(
      "Appliquer aussi ces nouveaux tarifs aux élèves déjà inscrits dans ces classes ? " +
      "Le montant dû (restant à payer) sera recalculé — les paiements déjà encaissés ne sont pas modifiés."
    )) {
      setRecalculating(true);
      const result = await recalculateStudentFees();
      setRecalculating(false);
      setRecalcMessage(
        result.success
          ? `${result.updated ?? 0} élève${(result.updated ?? 0) > 1 ? 's' : ''} mis à jour avec les nouveaux tarifs.`
          : (result.error || 'Erreur lors du recalcul.')
      );
    }
  };

  // Sections avancées repliées par défaut sur un profil neuf (moins intimidant),
  // mais ouvertes d'office si l'école a déjà renseigné ces champs.
  const [legalOpen, setLegalOpen] = useState(() => !!(schoolIfu || schoolRccm || schoolNif || schoolAutorisation));
  const [nationalOpen, setNationalOpen] = useState(false);

  // Checklist de complétion du profil — n'affiche que l'essentiel, pas les champs légaux
  // optionnels, pour ne pas culpabiliser une école qui n'en a simplement pas besoin.
  const completionItems = [
    { label: 'Logo de l\'établissement', done: !!logoPreview },
    { label: 'Nom du directeur', done: !!localDirectorName.trim() },
    { label: 'Téléphone', done: !!localTelephone.trim() },
    { label: 'Adresse', done: !!localAddress.trim() },
    { label: 'Email de contact', done: !!localEmail.trim() },
  ];
  const completionDone = completionItems.filter((i) => i.done).length;
  const completionPercent = Math.round((completionDone / completionItems.length) * 100);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoError('Le fichier doit être une image (PNG, JPG, SVG).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('L\'image ne doit pas dépasser 2 Mo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 200;
        let w = img.width;
        let h = img.height;
        if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
        else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        const resized = canvas.toDataURL('image/png', 0.9);
        setLogoPreview(resized);
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = async () => {
    setLogoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
    useStore.setState({ schoolLogo: null });
    try {
      const token = localStorage.getItem('parent_token');
      await fetch(`${API_BASE_URL}/settings/remove-asset`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ assetType: 'logo' })
      });
    } catch (err) { console.warn('remove logo error', err); }
  };

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStampError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStampError('Le fichier doit être une image (PNG, JPG, SVG).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setStampError('L\'image ne doit pas dépasser 2 Mo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 200;
        let w = img.width;
        let h = img.height;
        if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
        else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        const resized = canvas.toDataURL('image/png', 0.9);
        setStampPreview(resized);
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  const removeStamp = async () => {
    setStampPreview(null);
    if (stampFileRef.current) stampFileRef.current.value = '';
    useStore.setState({ schoolStamp: null });
    try {
      const token = localStorage.getItem('parent_token');
      await fetch(`${API_BASE_URL}/settings/remove-asset`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ assetType: 'stamp' })
      });
    } catch (err) { console.warn('remove stamp error', err); }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignatureError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSignatureError('Le fichier doit être une image (PNG, JPG, SVG).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSignatureError('L\'image ne doit pas dépasser 2 Mo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 200;
        let w = img.width;
        let h = img.height;
        if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
        else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        const resized = canvas.toDataURL('image/png', 0.9);
        setSignaturePreview(resized);
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  const removeSignature = async () => {
    setSignaturePreview(null);
    if (signatureFileRef.current) signatureFileRef.current.value = '';
    useStore.setState({ directorSignature: null });
    try {
      const token = localStorage.getItem('parent_token');
      await fetch(`${API_BASE_URL}/settings/remove-asset`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ assetType: 'signature' })
      });
    } catch (err) { console.warn('remove signature error', err); }
  };

  const handleSealUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSealError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSealError('Le fichier doit être une image (PNG, JPG, SVG).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSealError('L\'image ne doit pas dépasser 2 Mo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 200;
        let w = img.width;
        let h = img.height;
        if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
        else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        const resized = canvas.toDataURL('image/png', 0.9);
        setSealPreview(resized);
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  const removeSeal = async () => {
    setSealPreview(null);
    if (sealFileRef.current) sealFileRef.current.value = '';
    useStore.setState({ officialSeal: null });
    try {
      const token = localStorage.getItem('parent_token');
      await fetch(`${API_BASE_URL}/settings/remove-asset`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ assetType: 'seal' })
      });
    } catch (err) { console.warn('remove seal error', err); }
  };

  const updateAllSettings = useStore((s) => s.updateAllSettings);

  const uploadAssetIfBase64 = async (assetType: 'logo' | 'stamp' | 'seal' | 'signature', currentPreview: string | null) => {
    if (!currentPreview || !currentPreview.startsWith('data:image/')) {
      return currentPreview;
    }
    try {
      const token = localStorage.getItem('parent_token');
      const res = await fetch(`${API_BASE_URL}/settings/upload-asset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assetType, imageBase64: currentPreview })
      });
      if (res.ok) {
        const data = await res.json();
        return data.publicUrl;
      } else {
        console.error(`Failed to upload ${assetType} to storage`);
      }
    } catch (err) {
      console.error(`Error uploading ${assetType} to storage:`, err);
    }
    return currentPreview;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);

    // Téléverser les images en base64 vers le stockage Supabase en premier
    const logoUrl = await uploadAssetIfBase64('logo', logoPreview);
    const stampUrl = await uploadAssetIfBase64('stamp', stampPreview);
    const sealUrl = await uploadAssetIfBase64('seal', sealPreview);
    const signatureUrl = await uploadAssetIfBase64('signature', signaturePreview);

    await updateAllSettings({
      schoolName: localSchool,
      schoolYear: localYear,
      messageRemerciement: localRem,
      messageRappel: localRap,
      appName: localAppName,
      schoolLogo: logoUrl,
      schoolStamp: stampUrl,
      schoolMotto: localMotto,
      schoolBp: localBp,
      schoolTelephone: localTelephone,
      schoolAddress: localAddress,
      schoolCurrency: localCurrency,
      schoolIfu: localIfu,
      schoolRccm: localRccm,
      schoolNif: localNif,
      schoolEmail: localEmail,
      schoolWebsite: localWebsite,
      schoolAutorisation: localAutorisation,
      heuresMensuellesStandard: localHeuresMensuelles ? Number(localHeuresMensuelles) : null,
      countryName: localCountryName,
      countryMotto: localCountryMotto,
      ministereName: localMinistereName,
      directorSignature: signatureUrl,
      officialSeal: sealUrl,
      directorName: localDirectorName,
      directorTitle: localDirectorTitle,
      showStampOnCards: localShowStampOnCards,
      showSignatureOnCards: localShowSignatureOnCards,
      showSealOnCards: localShowSealOnCards,
      showStampOnBulletins: localShowStampOnBulletins,
      showSignatureOnBulletins: localShowSignatureOnBulletins
    });

    setLogoPreview(logoUrl);
    setStampPreview(stampUrl);
    setSealPreview(sealUrl);
    setSignaturePreview(signatureUrl);

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 pb-20 max-w-[1200px] mx-auto animate-slideUp">
      
      {/* ── HEADER ── */}
      <div className="relative pro-card p-8 overflow-hidden group bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-indigo-100 dark:border-indigo-900/30">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <Layers className="w-64 h-64 text-indigo-500" />
        </div>
        <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500 text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                <Shield className="w-3.5 h-3.5" /> Système
            </div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
              Paramètres du <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-indigo-600">Système</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
              Gérez les informations de l'établissement, les configurations système et les équipes.
            </p>
        </div>
      </div>

      {/* ── PROGRESSION DU PROFIL ── */}
      {(user?.role === 'directeur' || user?.role === 'comptable') && completionPercent < 100 && (
        <div className="pro-card p-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-amber-200/50 dark:border-amber-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative w-12 h-12 shrink-0">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-100 dark:text-slate-800" stroke="currentColor" strokeWidth="4" fill="none" d="M18 2.5 a15.5 15.5 0 0 1 0 31 a15.5 15.5 0 0 1 0 -31" />
                  <path className="text-amber-500" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"
                    strokeDasharray={`${completionPercent}, 100`}
                    d="M18 2.5 a15.5 15.5 0 0 1 0 31 a15.5 15.5 0 0 1 0 -31" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-700 dark:text-slate-200">{completionPercent}%</span>
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Profil de l'établissement
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Complétez ces informations pour des bulletins et cartes scolaires professionnels.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              {completionItems.map((item) => (
                <span key={item.label} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  item.done
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {item.done ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* COLONNE GAUCHE (Principale) */}
        <div className="xl:col-span-2 space-y-6">
            {/* ── IDENTITÉ DE L'APPLICATION ─────────────────────── */}
            <div className="pro-card p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800">
                <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-3 mb-1">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                    <School className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                Identité de l'Établissement
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 ml-[52px] mb-6">Ces informations apparaissent sur les cartes scolaires, bulletins et documents officiels.</p>

                <form onSubmit={handleSave} className="space-y-8">

                {/* ── Identité générale ── */}
                <div>
                    <SectionHeading icon={<Info className="w-4 h-4" />} title="Identité générale" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">
                                Nom de l'application
                            </label>
                            <input
                                disabled={user?.role !== 'directeur' && user?.role !== 'comptable'}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60"
                                value={localAppName}
                                onChange={(e) => setLocalAppName(e.target.value)}
                                placeholder="Ex : DGhubSchool"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">
                                Nom de l'établissement
                            </label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={localSchool}
                                onChange={(e) => setLocalSchool(e.target.value)}
                                placeholder="Ex : Groupe Scolaire Excellence"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">
                                Devise de l'école (Motto)
                            </label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={localMotto}
                                onChange={(e) => setLocalMotto(e.target.value)}
                                placeholder="Ex : Travail-Rigueur-Succès"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">
                                Année scolaire en cours
                            </label>
                            <div className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed">
                                {schoolYear}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Pour changer d'année scolaire, utilisez le menu "Années Scolaires".</p>
                        </div>
                    </div>
                </div>

                {/* ── Direction ── */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60">
                    <SectionHeading icon={<UserSquare2 className="w-4 h-4" />} title="Direction" subtitle="Affiché sur les cartes scolaires et bulletins." />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[11px] font-black text-indigo-600 dark:text-indigo-400 mb-2.5 uppercase tracking-widest">
                                Nom du Directeur
                            </label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-4 text-base font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                                value={localDirectorName}
                                onChange={(e) => setLocalDirectorName(e.target.value)}
                                placeholder="Ex : M. KOFFI Yao"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-black text-indigo-600 dark:text-indigo-400 mb-2.5 uppercase tracking-widest">
                                Fonction du Directeur
                            </label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-4 text-base font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                                value={localDirectorTitle}
                                onChange={(e) => setLocalDirectorTitle(e.target.value)}
                                placeholder="Ex : Directeur Général"
                            />
                        </div>
                    </div>
                </div>

                {/* ── Kit visuel + aperçu en direct ── */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60">
                    <SectionHeading icon={<Image className="w-4 h-4" />} title="Kit visuel" subtitle="Logo, cachet, sceau et signature — utilisés sur cartes et bulletins." />
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: 'Logo', preview: logoPreview, error: logoError, inputRef: fileRef, id: 'logo-upload', onUpload: handleLogoUpload, onRemove: removeLogo, accept: 'image/png,image/jpeg,image/svg+xml,image/webp' },
                                { label: 'Cachet', preview: stampPreview, error: stampError, inputRef: stampFileRef, id: 'stamp-upload', onUpload: handleStampUpload, onRemove: removeStamp, accept: 'image/png,image/jpeg,image/svg+xml,image/webp' },
                                { label: 'Sceau officiel', preview: sealPreview, error: sealError, inputRef: sealFileRef, id: 'seal-upload', onUpload: handleSealUpload, onRemove: removeSeal, accept: 'image/png,image/jpeg,image/svg+xml,image/webp' },
                                { label: 'Signature', preview: signaturePreview, error: signatureError, inputRef: signatureFileRef, id: 'signature-upload', onUpload: handleSignatureUpload, onRemove: removeSignature, accept: 'image/png' },
                            ].map((asset) => (
                                <div key={asset.id} className="flex flex-col items-center gap-2 text-center">
                                    <div className="w-full aspect-square max-w-[110px] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 overflow-hidden relative group">
                                        {asset.preview ? (
                                        <>
                                            <img src={asset.preview} alt={asset.label} className="w-full h-full object-contain p-2" />
                                            <button type="button" onClick={asset.onRemove} className="absolute inset-0 bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                            <X className="w-5 h-5" />
                                            </button>
                                        </>
                                        ) : (
                                        <Image className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                                        )}
                                    </div>
                                    <input ref={asset.inputRef} type="file" accept={asset.accept} className="hidden" id={asset.id} onChange={asset.onUpload} />
                                    <label htmlFor={asset.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-500/10 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors">
                                        <Upload className="w-3 h-3" /> {asset.label}
                                    </label>
                                    {asset.error && <p className="text-[10px] font-bold text-rose-500">{asset.error}</p>}
                                </div>
                            ))}
                        </div>

                        {/* Aperçu en direct — traduit le kit visuel + les interrupteurs en rendu concret */}
                        <div className="w-full lg:w-64 shrink-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3" /> Aperçu carte scolaire
                            </p>
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-4 shadow-sm">
                                <div className="flex items-center gap-2.5 mb-2">
                                    <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                                        {logoPreview ? <img src={logoPreview} alt="" className="w-full h-full object-contain" /> : <School className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-black text-slate-800 dark:text-white truncate">{localSchool || 'Nom de l\'établissement'}</p>
                                        <p className="text-[9px] text-slate-400 truncate">{localMotto || 'Devise de l\'école'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                                    {localShowStampOnCards && (
                                        <div className="w-7 h-7 rounded bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                            {stampPreview ? <img src={stampPreview} alt="" className="w-full h-full object-contain" /> : <Image className="w-3 h-3 text-slate-300" />}
                                        </div>
                                    )}
                                    {localShowSealOnCards && (
                                        <div className="w-7 h-7 rounded bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                            {sealPreview ? <img src={sealPreview} alt="" className="w-full h-full object-contain" /> : <Image className="w-3 h-3 text-slate-300" />}
                                        </div>
                                    )}
                                    {localShowSignatureOnCards && (
                                        <div className="w-7 h-7 rounded bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                            {signaturePreview ? <img src={signaturePreview} alt="" className="w-full h-full object-contain" /> : <Image className="w-3 h-3 text-slate-300" />}
                                        </div>
                                    )}
                                    {!localShowStampOnCards && !localShowSealOnCards && !localShowSignatureOnCards && (
                                        <p className="text-[9px] text-slate-400 italic">Aucun élément affiché sur les cartes</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Options d'affichage ── */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60">
                    <SectionHeading icon={<Shield className="w-4 h-4" />} title="Où afficher cachet, sceau et signature" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 bg-slate-50/60 dark:bg-slate-800/30 rounded-2xl p-4">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pb-1 border-b border-slate-200 dark:border-slate-700">Sur les cartes scolaires</p>
                            <ToggleSwitch label="Cachet de l'établissement" checked={localShowStampOnCards} onChange={setLocalShowStampOnCards} />
                            <ToggleSwitch label="Sceau officiel" checked={localShowSealOnCards} onChange={setLocalShowSealOnCards} />
                            <ToggleSwitch label="Signature du directeur" checked={localShowSignatureOnCards} onChange={setLocalShowSignatureOnCards} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pb-1 border-b border-slate-200 dark:border-slate-700">Sur les bulletins</p>
                            <ToggleSwitch label="Cachet de l'établissement" checked={localShowStampOnBulletins} onChange={setLocalShowStampOnBulletins} />
                            <ToggleSwitch label="Signature du directeur" checked={localShowSignatureOnBulletins} onChange={setLocalShowSignatureOnBulletins} />
                        </div>
                    </div>
                </div>

                {/* ── Coordonnées ── */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60">
                    <SectionHeading icon={<Phone className="w-4 h-4" />} title="Coordonnées" subtitle="Utilisées sur les documents remis aux parents." />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest flex items-center gap-1.5">
                                <Phone className="w-3 h-3" /> Numéro de Téléphone
                            </label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={localTelephone}
                                onChange={(e) => setLocalTelephone(e.target.value)}
                                placeholder="Ex : +228 90 00 00 00"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest flex items-center gap-1.5">
                                <Mail className="w-3 h-3" /> Email (bulletins de paie)
                            </label>
                            <input
                                type="email"
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={localEmail}
                                onChange={(e) => setLocalEmail(e.target.value)}
                                placeholder="Ex : contact@ecole.tg"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest flex items-center gap-1.5">
                                <MapPin className="w-3 h-3" /> Adresse / Ville / Pays
                            </label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={localAddress}
                                onChange={(e) => setLocalAddress(e.target.value)}
                                placeholder="Ex : Quartier, Ville - Pays"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">
                                Boîte Postale (BP)
                            </label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={localBp}
                                onChange={(e) => setLocalBp(e.target.value)}
                                placeholder="Ex : BP 123"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest flex items-center gap-1.5">
                                <Globe className="w-3 h-3" /> Site web
                            </label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={localWebsite}
                                onChange={(e) => setLocalWebsite(e.target.value)}
                                placeholder="Ex : www.ecole.tg"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">
                                Devise Monétaire
                            </label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={localCurrency}
                                onChange={(e) => setLocalCurrency(e.target.value)}
                                placeholder="Ex : FCFA"
                            />
                        </div>
                    </div>
                </div>

                {/* ── Informations légales & paie (repliable) ── */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60">
                    <button type="button" onClick={() => setLegalOpen((v) => !v)} className="w-full flex items-center justify-between text-left">
                        <SectionHeading icon={<FileBadge2 className="w-4 h-4" />} title="Informations légales & paie" subtitle="Optionnel — IFU, RCCM, NIF et calcul des retenues sur salaire." />
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${legalOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {legalOpen && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2 animate-fadeIn">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">
                                N° IFU
                            </label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={localIfu}
                                onChange={(e) => setLocalIfu(e.target.value)}
                                placeholder="Ex : 1000123456789"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">
                                N° RCCM
                            </label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={localRccm}
                                onChange={(e) => setLocalRccm(e.target.value)}
                                placeholder="Ex : TG-LOM-01-2020-B12-00001"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">
                                N° NIF
                            </label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={localNif}
                                onChange={(e) => setLocalNif(e.target.value)}
                                placeholder="Ex : NIF-0012345"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">
                                N° d'autorisation
                            </label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={localAutorisation}
                                onChange={(e) => setLocalAutorisation(e.target.value)}
                                placeholder="Ex : N° 042/MEPS"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">
                                Heures mensuelles standard (paie)
                            </label>
                            <input
                                type="number"
                                min={1}
                                step={0.5}
                                className="w-full md:w-64 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={localHeuresMensuelles}
                                onChange={(e) => setLocalHeuresMensuelles(e.target.value)}
                                placeholder="Ex : 173"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Utilisé pour calculer le taux horaire des retenues sur heures manquées.</p>
                        </div>
                    </div>
                    )}
                </div>

                {/* ── Contexte national (repliable) ── */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60">
                    <button type="button" onClick={() => setNationalOpen((v) => !v)} className="w-full flex items-center justify-between text-left">
                        <SectionHeading icon={<Landmark className="w-4 h-4" />} title="Contexte national" subtitle="Rarement à modifier — mêmes conventions pour toutes les écoles du pays." />
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${nationalOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {nationalOpen && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2 animate-fadeIn">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">
                                Nom du Pays (Titre Officiel)
                            </label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={localCountryName}
                                onChange={(e) => setLocalCountryName(e.target.value)}
                                placeholder="Ex : République Togolaise"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">
                                Devise Nationale du Pays
                            </label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={localCountryMotto}
                                onChange={(e) => setLocalCountryMotto(e.target.value)}
                                placeholder="Ex : Travail - Liberté - Patrie"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">
                                Ministère de Tutelle
                            </label>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={localMinistereName}
                                onChange={(e) => setLocalMinistereName(e.target.value)}
                                placeholder="Ex : Ministère de l'Éducation Nationale"
                            />
                        </div>
                    </div>
                    )}
                </div>

                {/* ── Messages personnalisables ── */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60">
                    <SectionHeading icon={<MessageSquare className="w-4 h-4" />} title="Messages Personnalisables" />
                    <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Message de remerciement (Soldé)</label>
                        <textarea
                            rows={2}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                            value={localRem}
                            onChange={(e) => setLocalRem(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Message de rappel (Non soldé)</label>
                        <textarea
                            rows={2}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                            value={localRap}
                            onChange={(e) => setLocalRap(e.target.value)}
                        />
                    </div>
                    </div>
                </div>

                {(user?.role === 'directeur' || user?.role === 'comptable') && (
                    <div className="flex justify-end pt-4">
                        <button
                        type="submit"
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${
                            saved
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                        }`}
                        >
                        <Save className="w-4 h-4" />
                        {saved ? 'Enregistré' : 'Enregistrer'}
                        </button>
                    </div>
                )}
                </form>
            </div>

            {/* ── TRANCHES DE PAIEMENT ────────────────────────────── */}
            {(user?.role === 'directeur' || user?.role === 'comptable' || user?.role === 'admin' || user?.role === 'directeur_general') && (
                <div className="pro-card p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            Tranches de Paiement
                        </h3>
                        <button
                            onClick={() => {
                                const updated = [...localTranches, { id: crypto.randomUUID?.() || Date.now().toString(), nom: `Tranche ${localTranches.length + 1}`, dateLimite: '', pourcentage: 0 }];
                                setLocalTranches(updated);
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-500 text-indigo-600 hover:text-white dark:bg-indigo-500/10 dark:hover:bg-indigo-500 dark:text-indigo-400 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                        >
                            <Plus className="w-3.5 h-3.5" /> Ajouter
                        </button>
                    </div>

                    <div className="space-y-3 mb-6">
                        {localTranches.length === 0 ? (
                        <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <p className="text-sm font-bold text-slate-500">Aucune tranche paramétrée</p>
                        </div>
                        ) : (
                        localTranches.map((t, idx) => (
                            <div key={t.id} className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <input
                                    type="text"
                                    value={t.nom}
                                    onChange={(e) => {
                                        const updated = [...localTranches];
                                        updated[idx].nom = e.target.value;
                                        setLocalTranches(updated);
                                    }}
                                    placeholder="Nom (ex: Tranche 1)"
                                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                                />
                                <input
                                    type="date"
                                    value={t.dateLimite}
                                    onChange={(e) => {
                                        const updated = [...localTranches];
                                        updated[idx].dateLimite = e.target.value;
                                        setLocalTranches(updated);
                                    }}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-auto"
                                />
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={t.pourcentage}
                                            onChange={(e) => {
                                                const updated = [...localTranches];
                                                updated[idx].pourcentage = Number(e.target.value);
                                                setLocalTranches(updated);
                                            }}
                                            className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-8 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">%</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const updated = localTranches.filter((_, i) => i !== idx);
                                            setLocalTranches(updated);
                                        }}
                                        className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors ml-auto sm:ml-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                        )}
                        {localTranches.length > 0 && (
                        <div className="flex justify-end pt-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Total : 
                                <span className={`ml-2 text-sm ${localTranches.reduce((sum, t) => sum + (t.pourcentage || 0), 0) === 100 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {localTranches.reduce((sum, t) => sum + (t.pourcentage || 0), 0)}%
                                </span>
                            </span>
                        </div>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={() => {
                                setTranches(localTranches);
                                updateAllSettings({ tranches: localTranches });
                                setTranchesSaved(true);
                                setTimeout(() => setTranchesSaved(false), 3000);
                            }}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${
                            tranchesSaved
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                            }`}
                        >
                            <Save className="w-4 h-4" />
                            {tranchesSaved ? 'Enregistré' : 'Enregistrer'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── FRAIS DE SCOLARITÉ PERSONNALISÉS ────────────────── */}
            {(user?.role === 'directeur' || user?.role === 'comptable' || user?.role === 'admin' || user?.role === 'directeur_general') && (
                <div className="pro-card p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                        <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                                <Wallet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            Frais de scolarité
                        </h3>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
                        Chaque école a ses propres tarifs — ajustez le montant par classe ci-dessous. Une classe non modifiée garde le tarif générique proposé par défaut.
                    </p>

                    <div className="space-y-6">
                        {(['Primaire', 'Collège', 'Lycée'] as const).map((cycle) => (
                            <div key={cycle}>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{cycle}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {CLASS_CONFIG.filter((c) => c.cycle === cycle).map((c) => {
                                        const isCustom = localClassFees[c.name] !== String(c.ecolage);
                                        return (
                                            <div key={c.name} className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                                    {c.name}
                                                    {isCustom && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" title="Tarif personnalisé" />}
                                                </span>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        step={500}
                                                        value={localClassFees[c.name] ?? ''}
                                                        onChange={(e) => setLocalClassFees((prev) => ({ ...prev, [c.name]: e.target.value }))}
                                                        className="w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-12 py-2 text-sm font-bold text-slate-900 dark:text-white text-right focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">{localCurrency || 'FCFA'}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {recalcMessage && (
                        <p className="mt-4 text-xs font-bold text-slate-500 dark:text-slate-400">{recalcMessage}</p>
                    )}

                    <div className="flex justify-end pt-6">
                        <button
                            onClick={handleSaveFees}
                            disabled={recalculating}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all disabled:opacity-60 ${
                                feesSaved
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                            }`}
                        >
                            {recalculating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {recalculating ? 'Application en cours...' : feesSaved ? 'Enregistré' : 'Enregistrer'}
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* COLONNE DROITE (Secondaire) */}
        <div className="space-y-6">
            
            {/* ── HORAIRES SCOLAIRES ────────────────────── */}
            {(user?.role === 'directeur' || user?.role === 'comptable' || user?.role === 'admin' || user?.role === 'directeur_general') && (
                <div className="pro-card p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800">
                    <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        Horaires & Retards
                    </h3>
                    <div className="space-y-3 mb-6">
                        {localSchedules.map((schedule, idx) => (
                        <div key={schedule.cycle} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">
                                {schedule.cycle}
                            </span>
                            <input
                                type="time"
                                value={schedule.heureLimite}
                                onChange={(e) => {
                                    const updated = [...localSchedules];
                                    updated[idx] = { ...schedule, heureLimite: e.target.value };
                                    setLocalSchedules(updated);
                                }}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm font-bold font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        ))}
                    </div>
                    <button
                        onClick={() => {
                            setCycleSchedules(localSchedules);
                            setScheduleSaved(true);
                            setTimeout(() => setScheduleSaved(false), 3000);
                        }}
                        className={`w-full flex justify-center items-center gap-2 px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${
                            scheduleSaved
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                        }`}
                    >
                        <Save className="w-4 h-4" />
                        {scheduleSaved ? 'Enregistré' : 'Enregistrer'}
                    </button>
                </div>
            )}

            {/* ── SAUVEGARDES ────────────────────────────── */}
            {(user?.role === 'directeur' || user?.role === 'comptable' || user?.role === 'admin' || user?.role === 'directeur_general') && (
                <SchoolBackups />
            )}

            {/* ── ALERTES DE RETARD AUTOMATIQUES ────────────────────────────── */}
            {(user?.role === 'directeur' || user?.role === 'comptable' || user?.role === 'admin' || user?.role === 'directeur_general') && (
                <AutoReminderSettings />
            )}

            {/* ── SATISFACTION DES PARENTS ────────────────────────────── */}
            {(user?.role === 'directeur' || user?.role === 'comptable' || user?.role === 'admin' || user?.role === 'directeur_general') && (
                <ParentSatisfactionOverview />
            )}

            {/* ── COMPTE UTILISATEUR ────────────────────────────── */}
            <div className="pro-card p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800">
                <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                        <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    Mon Compte
                </h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Utilisateur</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{user?.nom}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Identifiant</span>
                        <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">{user?.username}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rôle</span>
                        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            {user?.role}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── DANGER ZONE ────────────────────────────── */}
            {(user?.role === 'admin' || user?.role === 'directeur' || user?.role === 'directeur_general') && (
                <div className="pro-card p-6 bg-rose-50/50 dark:bg-rose-500/5 backdrop-blur-xl border border-rose-200/50 dark:border-rose-500/20">
                    <h3 className="font-black text-lg text-rose-700 dark:text-rose-400 flex items-center gap-3 mb-4">
                        <div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-xl">
                            <Database className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        Maintenance
                    </h3>
                    <div className="space-y-3">
                        <button
                            onClick={async () => {
                                if (window.confirm("Voulez-vous vraiment VIDER tout l'historique des scans de présence ? Cette action est irréversible.")) {
                                    const success = await useStore.getState().clearCloudPresences();
                                    if (success) alert("Historique des présences vidé.");
                                }
                            }}
                            className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-500/20 rounded-2xl hover:border-rose-300 dark:hover:border-rose-500/40 transition-colors group"
                        >
                            <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest group-hover:text-rose-700 dark:group-hover:text-rose-300">Purger Présences</span>
                            <Trash2 className="w-4 h-4 text-rose-400" />
                        </button>
                        <button
                            onClick={async () => {
                                if (window.confirm("Voulez-vous vraiment VIDER tous les logs d'activité ?")) {
                                    const success = await useStore.getState().clearCloudActivityLogs();
                                    if (success) alert("Logs d'activité vidés.");
                                }
                            }}
                            className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-500/20 rounded-2xl hover:border-rose-300 dark:hover:border-rose-500/40 transition-colors group"
                        >
                            <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest group-hover:text-rose-700 dark:group-hover:text-rose-300">Purger Logs</span>
                            <Trash2 className="w-4 h-4 text-rose-400" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── À PROPOS ──────────────────────────────────────── */}
            <div className="flex items-center justify-center gap-2 text-slate-400 dark:text-slate-600">
                <Info className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{appName} v1.0 — Nomade Corp</span>
            </div>

        </div>
      </div>
    </div>
  );
};
