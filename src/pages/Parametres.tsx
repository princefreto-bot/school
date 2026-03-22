import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import {
  Save, School, MessageSquare, Shield, Info,
  Upload, X, Image, Code2, ChevronDown, ChevronRight,
  Palette, Type, FileText, Database,
  AlertCircle, Clock
} from 'lucide-react';
import { GestionPersonnel } from '../components/GestionPersonnel';

// ── PAGE PRINCIPALE ──────────────────────────────────────────
export const Parametres: React.FC = () => {
  // Sélecteurs séparés (pas d'objet pour éviter re-renders infinis)
  const schoolName = useStore((s) => s.schoolName);
  const schoolYear = useStore((s) => s.schoolYear);
  const messageRemerciement = useStore((s) => s.messageRemerciement);
  const messageRappel = useStore((s) => s.messageRappel);
  const appName = useStore((s) => s.appName);
  const schoolLogo = useStore((s) => s.schoolLogo);
  const schoolStamp = useStore((s) => s.schoolStamp);
  const user = useStore((s) => s.user);

  // États locaux du formulaire
  const [localSchool, setLocalSchool] = useState(schoolName);
  const [localYear, setLocalYear] = useState(schoolYear);
  const [localRem, setLocalRem] = useState(messageRemerciement);
  const [localRap, setLocalRap] = useState(messageRappel);
  const [localAppName, setLocalAppName] = useState(appName);
  const [saved, setSaved] = useState(false);
  
  const [logoPreview, setLogoPreview] = useState<string | null>(schoolLogo);
  const [logoError, setLogoError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [stampPreview, setStampPreview] = useState<string | null>(schoolStamp);
  const [stampError, setStampError] = useState('');
  const stampFileRef = useRef<HTMLInputElement>(null);

  // Horaires par cycle
  const cycleSchedules = useStore((s) => s.cycleSchedules);
  const setCycleSchedules = useStore((s) => s.setCycleSchedules);
  const [localSchedules, setLocalSchedules] = useState(cycleSchedules);
  const [scheduleSaved, setScheduleSaved] = useState(false);

  // ── Gestion upload logo PNG ────────────────────────────────
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifications
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
      // Redimensionnement via canvas pour forcer max 200×200px
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

  const removeLogo = () => {
    setLogoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Gestion upload sceau PNG ────────────────────────────────
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

  const removeStamp = () => {
    setStampPreview(null);
    if (stampFileRef.current) stampFileRef.current.value = '';
  };

  const updateAllSettings = useStore((s) => s.updateAllSettings);

  // ── Sauvegarde ───────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateAllSettings({
      schoolName: localSchool,
      schoolYear: localYear,
      messageRemerciement: localRem,
      messageRappel: localRap,
      appName: localAppName,
      schoolLogo: logoPreview,
      schoolStamp: stampPreview
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl space-y-6">

      {/* ── GESTION DU PERSONNEL ────────────────────────────── */}
      {(user?.role === 'directeur' || user?.role === 'directeur_general') && (
        <GestionPersonnel />
      )}

      {/* ── IDENTITÉ DE L'APPLICATION ─────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-5">
          <School className="w-4 h-4 text-blue-600" />
          Identité de l'application & établissement
        </h3>
        <form onSubmit={handleSave} className="space-y-5">

          {/* Nom de l'app */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              Nom de l'application (affiché dans la sidebar)
            </label>
            <input
              disabled={user?.role !== 'directeur' && user?.role !== 'comptable'}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium disabled:bg-gray-50 disabled:text-gray-400"
              value={localAppName}
              onChange={(e) => setLocalAppName(e.target.value)}
              placeholder="Ex : EduFinance, SchoolPay, MonÉcole..."
            />
            <p className="text-xs text-gray-400 mt-1">
              Remplace «&nbsp;EduFinance&nbsp;» partout dans l'interface.
            </p>
          </div>

          {/* Nom établissement */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              Nom de l'établissement
            </label>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={localSchool}
              onChange={(e) => setLocalSchool(e.target.value)}
              placeholder="Ex : Groupe Scolaire Excellence"
            />
          </div>

          {/* Année scolaire */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              Année scolaire
            </label>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={localYear}
              onChange={(e) => setLocalYear(e.target.value)}
              placeholder="Ex : 2024-2025"
            />
          </div>

          {/* Upload logo */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Logo de l'établissement
            </label>
            <div className="flex items-start gap-4">
              {/* Prévisualisation */}
              <div className="shrink-0 w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden relative group">
                {logoPreview ? (
                  <>
                    <img
                      src={logoPreview}
                      alt="Logo aperçu"
                      className="w-full h-full object-contain p-1"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl"
                      title="Supprimer le logo"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <Image className="w-8 h-8 text-gray-300" />
                )}
              </div>

              {/* Zone upload */}
              <div className="flex-1">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  id="logo-upload"
                  onChange={handleLogoUpload}
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-blue-200 text-blue-600 rounded-xl text-sm font-medium cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Importer un logo PNG / JPG
                </label>
                <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                  <p>✅ Formats acceptés : PNG, JPG, SVG, WebP</p>
                  <p>✅ Taille max : 2 Mo</p>
                  <p>✅ Redimensionné automatiquement à 200×200 px</p>
                  <p>✅ Affiché dans la sidebar et les PDF générés</p>
                </div>
                {logoError && (
                  <p className="mt-2 text-xs text-red-500 font-medium">⚠️ {logoError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Upload Sceau */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Sceau de l'établissement
            </label>
            <div className="flex items-start gap-4">
              {/* Prévisualisation */}
              <div className="shrink-0 w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden relative group">
                {stampPreview ? (
                  <>
                    <img
                      src={stampPreview}
                      alt="Sceau aperçu"
                      className="w-full h-full object-contain p-1"
                    />
                    <button
                      type="button"
                      onClick={removeStamp}
                      className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl"
                      title="Supprimer le sceau"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <Image className="w-8 h-8 text-gray-300" />
                )}
              </div>

              {/* Zone upload */}
              <div className="flex-1">
                <input
                  ref={stampFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  id="stamp-upload"
                  onChange={handleStampUpload}
                />
                <label
                  htmlFor="stamp-upload"
                  className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-blue-200 text-blue-600 rounded-xl text-sm font-medium cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Importer un sceau PNG / JPG
                </label>
                <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                  <p>✅ Sceau affiché sur les bulletins PDF</p>
                  <p>✅ Format conseillé : PNG avec fond transparent</p>
                </div>
                {stampError && (
                  <p className="mt-2 text-xs text-red-500 font-medium">⚠️ {stampError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Messages personnalisables */}
          <div className="pt-2 border-t border-gray-100">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-4 text-sm">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              Messages personnalisables (PDF & WhatsApp)
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  Message de remerciement (élève soldé)
                </label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  value={localRem}
                  onChange={(e) => setLocalRem(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Affiché sur les reçus PDF des élèves soldés.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  Message de rappel (élève non soldé)
                </label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  value={localRap}
                  onChange={(e) => setLocalRap(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Affiché sur les reçus PDF et envoyé sur WhatsApp.
                </p>
              </div>
            </div>
          </div>

          {(user?.role === 'directeur' || user?.role === 'comptable') && (
            <button
              type="submit"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all ${saved
                ? 'bg-emerald-500 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
              <Save className="w-4 h-4" />
              {saved ? '✓ Paramètres enregistrés !' : 'Enregistrer les paramètres'}
            </button>
          )}
        </form>
      </div>

      {/* ── HORAIRES SCOLAIRES PAR CYCLE ────────────────────── */}
      {(user?.role === 'directeur' || user?.role === 'comptable' || user?.role === 'admin' || user?.role === 'directeur_general') && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-cyan-600" />
            Horaires scolaires — Heure limite d'arrivée par cycle
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Définissez l'heure limite d'arrivée pour chaque cycle. Un élève qui scanne sa carte après cette heure sera marqué <span className="font-bold text-orange-600">en retard</span>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {localSchedules.map((schedule, idx) => (
              <div key={schedule.cycle} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  {schedule.cycle === 'Primaire' && '🏫 '}
                  {schedule.cycle === 'Collège' && '📚 '}
                  {schedule.cycle === 'Lycée' && '🎓 '}
                  {schedule.cycle}
                </label>
                <input
                  type="time"
                  value={schedule.heureLimite}
                  onChange={(e) => {
                    const updated = [...localSchedules];
                    updated[idx] = { ...schedule, heureLimite: e.target.value };
                    setLocalSchedules(updated);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-lg font-mono font-bold text-center focus:ring-2 focus:ring-cyan-500 outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1.5 text-center">
                  Retard si scan après {schedule.heureLimite}
                </p>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              setCycleSchedules(localSchedules);
              setScheduleSaved(true);
              setTimeout(() => setScheduleSaved(false), 3000);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all ${scheduleSaved
              ? 'bg-emerald-500 text-white'
              : 'bg-cyan-600 text-white hover:bg-cyan-700'
              }`}
          >
            <Save className="w-4 h-4" />
            {scheduleSaved ? '✓ Horaires enregistrés !' : 'Enregistrer les horaires'}
          </button>
        </div>
      )}

      {/* ── COMPTE UTILISATEUR ────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-blue-600" /> Compte & Sécurité
        </h3>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Utilisateur connecté</span>
            <span className="font-medium text-gray-900">{user?.nom}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Identifiant</span>
            <span className="font-medium text-gray-900 font-mono">{user?.username}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Rôle</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${user?.role === 'admin' || user?.role === 'directeur' || user?.role === 'directeur_general'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-emerald-100 text-emerald-700'
              }`}>
              {user?.role === 'admin' || user?.role === 'directeur' || user?.role === 'directeur_general' ? '🛡 Admin' : '📊 Comptable'}
            </span>
          </div>
        </div>

      </div>

      {/* ── MAINTENANCE DES DONNÉES CLOUD ──────────────────── */}
      {(user?.role === 'admin' || user?.role === 'directeur' || user?.role === 'directeur_general') && (
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-6 mb-6">
          <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-amber-600" /> Maintenance des Données Cloud
          </h3>
          <p className="text-sm text-amber-700 mb-4">
            Actions de nettoyage pour la base de données. Ces actions sont définitives.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={async () => {
                if (window.confirm("Voulez-vous vraiment VIDER tout l'historique des scans de présence ? Cette action est irréversible.")) {
                  const success = await useStore.getState().clearCloudPresences();
                  if (success) alert("Historique des présences vidé avec succès.");
                  else alert("Erreur lors du nettoyage des présences.");
                }
              }}
              className="px-4 py-2 bg-white border border-amber-200 text-amber-700 hover:bg-amber-100 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Vider l'Historique des Scans
            </button>
            <button
              onClick={async () => {
                if (window.confirm("Voulez-vous vraiment VIDER tous les logs d'activité ?")) {
                  const success = await useStore.getState().clearCloudActivityLogs();
                  if (success) alert("Logs d'activité vidés avec succès.");
                  else alert("Erreur lors du nettoyage des logs.");
                }
              }}
              className="px-4 py-2 bg-white border border-amber-200 text-amber-700 hover:bg-amber-100 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Vider les Logs d'Activité
            </button>
          </div>
        </div>
      )}

      {/* ── À PROPOS ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-blue-600" /> À propos
        </h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong className="text-gray-800">{appName} v1.0</strong> — Gestion financière scolaire</p>
          <p className="font-medium text-emerald-600">Developed by Nomade Corporation</p>
        </div>
      </div>

      {/* ── ZONE DE DANGER (Uniquement Parents) ───────────── */}
      {user?.role === 'parent' && (
        <div className="bg-red-50 rounded-2xl border border-red-100 p-6">
          <h3 className="font-bold text-red-800 flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5" /> Zone de Danger
          </h3>
          <p className="text-sm text-red-600 mb-4 font-medium">
            La suppression de votre compte est irréversible. Toutes vos données personnelles et vos liaisons avec les élèves seront effacées.
          </p>
          <button
            onClick={async () => {
              if (window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
                try {
                  const { parentApi } = await import('../services/parentApi');
                  await parentApi.deleteAccount();
                  useStore.getState().logout();
                } catch (err) {
                  alert("Erreur lors de la suppression du compte.");
                }
              }
            }}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-200 transition-all"
          >
            Supprimer mon compte définitivement
          </button>
        </div>
      )}

    </div>
  );
};
