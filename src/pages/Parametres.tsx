import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import {
  Save, School, MessageSquare, Shield, Info,
  Upload, X, Image, Code2, ChevronDown, ChevronRight,
  Palette, Type, FileText, Database,
  AlertCircle
} from 'lucide-react';

// ── Composant accordéon pour le guide développeur ───────────
const GuideSection: React.FC<{
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}> = ({ icon, title, color, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left font-medium text-sm ${color} transition-colors`}
      >
        <span className="flex items-center gap-2">{icon}{title}</span>
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      {open && (
        <div className="px-4 py-4 bg-white text-sm text-gray-700 space-y-3 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
};

// ── Bloc de code affiché dans le guide ───────────────────────
const CodeBlock: React.FC<{ code: string; comment?: string }> = ({ code, comment }) => (
  <div className="mt-2">
    {comment && <p className="text-xs text-gray-500 mb-1 italic">{comment}</p>}
    <pre className="bg-slate-900 text-green-400 text-xs rounded-lg p-3 overflow-x-auto font-mono leading-relaxed">
      {code}
    </pre>
  </div>
);

// ── PAGE PRINCIPALE ──────────────────────────────────────────
export const Parametres: React.FC = () => {
  // Sélecteurs séparés (pas d'objet pour éviter re-renders infinis)
  const schoolName = useStore((s) => s.schoolName);
  const setSchoolName = useStore((s) => s.setSchoolName);
  const schoolYear = useStore((s) => s.schoolYear);
  const setSchoolYear = useStore((s) => s.setSchoolYear);
  const messageRemerciement = useStore((s) => s.messageRemerciement);
  const setMessageRemerciement = useStore((s) => s.setMessageRemerciement);
  const messageRappel = useStore((s) => s.messageRappel);
  const setMessageRappel = useStore((s) => s.setMessageRappel);
  const appName = useStore((s) => s.appName);
  const setAppName = useStore((s) => s.setAppName);
  const schoolLogo = useStore((s) => s.schoolLogo);
  const setSchoolLogo = useStore((s) => s.setSchoolLogo);
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

  // ── Sauvegarde ───────────────────────────────────────────
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSchoolName(localSchool);
    setSchoolYear(localYear);
    setMessageRemerciement(localRem);
    setMessageRappel(localRap);
    setAppName(localAppName);
    setSchoolLogo(logoPreview);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl space-y-6">

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

      {/* ── GUIDE DE PERSONNALISATION DU CODE ─────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
          <Code2 className="w-4 h-4 text-purple-600" />
          Guide de personnalisation du code
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Cliquez sur chaque section pour voir comment modifier le code source directement.
        </p>

        <div className="space-y-3">

          {/* Couleurs */}
          <GuideSection
            icon={<Palette className="w-4 h-4" />}
            title="Changer les couleurs de l'interface"
            color="bg-purple-50 text-purple-800 hover:bg-purple-100"
          >
            <p>Les couleurs principales sont définies via les classes Tailwind CSS dans chaque composant.</p>
            <p className="font-medium text-gray-800">Couleur principale (bleu → vert par exemple) :</p>
            <CodeBlock
              comment="Dans src/components/Layout.tsx — changer bg-blue-600 partout"
              code={`// Remplacer toutes les occurrences de :
bg-blue-600  →  bg-emerald-600
text-blue-600  →  text-emerald-600
focus:ring-blue-500  →  focus:ring-emerald-500

// Chercher/remplacer dans VS Code :
// Ctrl+Shift+H → "blue-600" → "emerald-600"
// dans les fichiers src/**/*.tsx`}
            />
            <p className="font-medium text-gray-800 mt-2">Couleur de fond de la sidebar :</p>
            <CodeBlock
              comment="Dans src/components/Layout.tsx"
              code={`// Ligne : <aside className="... bg-slate-900 ...">
// Remplacer bg-slate-900 par :
bg-gray-900    // gris foncé
bg-indigo-900  // indigo foncé
bg-green-900   // vert foncé
bg-zinc-900    // zinc foncé`}
            />
          </GuideSection>

          {/* Typographie */}
          <GuideSection
            icon={<Type className="w-4 h-4" />}
            title="Changer la police de caractères"
            color="bg-blue-50 text-blue-800 hover:bg-blue-100"
          >
            <p>La police <strong>Inter</strong> est chargée depuis Google Fonts dans <code className="bg-gray-100 px-1 rounded">index.html</code>.</p>
            <CodeBlock
              comment="Dans index.html — remplacer la police"
              code={`<!-- Remplacer cette ligne : -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

<!-- Par exemple pour Poppins : -->
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

<!-- Puis dans src/components/Layout.tsx, ligne style={{...}} : -->
style={{ fontFamily: 'Poppins, sans-serif' }}`}
            />
          </GuideSection>

          {/* Nom et titre */}
          <GuideSection
            icon={<Type className="w-4 h-4" />}
            title="Changer le nom de l'onglet du navigateur"
            color="bg-orange-50 text-orange-800 hover:bg-orange-100"
          >
            <p>Le titre de l'onglet du navigateur est défini dans <code className="bg-gray-100 px-1 rounded">index.html</code>.</p>
            <CodeBlock
              comment="Dans index.html"
              code={`<!-- Ligne 7 environ : -->
<title>EduFinance — Gestion Financière Scolaire</title>

<!-- Remplacer par : -->
<title>MonÉcole — Gestion Financière</title>`}
            />
            <p className="text-gray-600 mt-2">
              Le nom dans la <strong>sidebar</strong> se change directement via le champ «&nbsp;Nom de l'application&nbsp;» ci-dessus — sans toucher au code.
            </p>
          </GuideSection>

          {/* Écolages */}
          <GuideSection
            icon={<Database className="w-4 h-4" />}
            title="Modifier les écolages par classe"
            color="bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
          >
            <p>Tous les montants d'écolage sont centralisés dans un seul fichier :</p>
            <CodeBlock
              comment="Dans src/data/classConfig.ts"
              code={`export const CLASS_CONFIG: ClassConfig[] = [
  // Primaire — 50 000 F
  { nom: 'CP1',    cycle: 'Primaire', ecolage: 50000 },
  { nom: 'CP2',    cycle: 'Primaire', ecolage: 50000 },
  // ...
  // Collège — 60 000 F
  { nom: '6ème',   cycle: 'Collège',  ecolage: 60000 },
  // Lycée — 75 000 F
  { nom: '2nde S', cycle: 'Lycée',    ecolage: 75000 },
  // ...
];
// Modifier uniquement la valeur "ecolage" pour chaque classe`}
            />
          </GuideSection>

          {/* PDF */}
          <GuideSection
            icon={<FileText className="w-4 h-4" />}
            title="Modifier la mise en forme des PDF"
            color="bg-red-50 text-red-800 hover:bg-red-100"
          >
            <p>Toute la logique PDF est dans <code className="bg-gray-100 px-1 rounded">src/utils/pdfGenerator.ts</code>.</p>
            <CodeBlock
              comment="Changer les couleurs du PDF"
              code={`// Variables de couleurs en haut du fichier :
const BLUE  = [26, 86, 219]  as [number,number,number];
const GREEN = [5, 150, 105]  as [number,number,number];
const ORANGE= [234, 88, 12]  as [number,number,number];
// Modifier les valeurs RGB selon vos besoins`}
            />
            <CodeBlock
              comment="Changer les marges / taille de police"
              code={`// Marges du document
const MARGIN = 20;   // en mm

// Tailles de police (dans chaque section)
doc.setFontSize(22);  // titre principal
doc.setFontSize(9);   // texte normal`}
            />
          </GuideSection>

          {/* Comptes utilisateurs */}
          <GuideSection
            icon={<Shield className="w-4 h-4" />}
            title="Changer les mots de passe des comptes"
            color="bg-slate-50 text-slate-800 hover:bg-slate-100"
          >
            <p>Les comptes sont définis dans <code className="bg-gray-100 px-1 rounded">src/store/useStore.ts</code>.</p>
            <CodeBlock
              comment="Dans src/store/useStore.ts — tableau USERS"
              code={`const USERS = [
  {
    username: 'admin',
    password: 'admin123',   // ← changer ici
    user: { id: '1', username: 'admin', role: 'admin', nom: 'Administrateur' },
  },
  {
    username: 'comptable',
    password: 'compta123',  // ← changer ici
    user: { id: '2', username: 'comptable', role: 'comptable', nom: 'Comptable Principal' },
  },
];
// Note : en production, utiliser JWT + bcrypt côté serveur`}
            />
          </GuideSection>

        </div>
      </div>

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
        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-xs text-blue-700 font-medium mb-1">Comptes disponibles (démo)</p>
          <div className="grid grid-cols-2 gap-3 text-xs text-blue-600">
            <div><strong>Admin :</strong> admin / admin123</div>
            <div><strong>Comptable :</strong> comptable / compta123</div>
          </div>
        </div>
      </div>

      {/* ── À PROPOS ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-blue-600" /> À propos
        </h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong className="text-gray-800">{appName} v1.0</strong> — Gestion financière scolaire</p>
          <p>Développé avec React, TypeScript, TailwindCSS, Recharts, jsPDF.</p>
          <p>Données stockées de manière sécurisée sur le Cloud (Supabase).</p>
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
