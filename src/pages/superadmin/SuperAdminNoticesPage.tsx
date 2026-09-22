// ============================================================
// SUPERADMIN — Notice écoles (message/image envoyé aux comptes établissement)
// ============================================================
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Megaphone, RefreshCw, Upload, X, Save, EyeOff, Info } from 'lucide-react';
import { superAdminApi } from '../../services/superAdminApi';

interface Notice {
  id: string;
  title: string | null;
  message: string | null;
  image_url: string | null;
  active: boolean;
  updated_at: string;
}

export const SuperAdminNoticesPage: React.FC = () => {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await superAdminApi.getNotice();
      const n = data?.notice as Notice | null;
      setNotice(n);
      setTitle(n?.title || '');
      setMessage(n?.message || '');
      setImagePreview(n?.image_url || null);
    } catch (err) {
      console.error('getNotice error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Le fichier doit être une image (PNG, JPG).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("L'image ne doit pas dépasser 5 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        // Redimensionne pour rester léger tout en gardant une image lisible en banner.
        const MAX_W = 1000;
        let w = img.width;
        let h = img.height;
        if (w > MAX_W) { h = Math.round(h * MAX_W / w); w = MAX_W; }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        setImagePreview(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSave = async (active: boolean) => {
    setError('');
    if (!message.trim() && !imagePreview) {
      setError('Ajoutez au moins un message ou une image avant de publier.');
      return;
    }
    setSaving(true);
    try {
      const data = await superAdminApi.saveNotice({
        title: title.trim() || undefined,
        message: message.trim() || undefined,
        imageUrl: imagePreview,
        active
      });
      setNotice(data.notice);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la publication.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    setSaving(true);
    setError('');
    try {
      await superAdminApi.deactivateNotice();
      await load();
    } catch (err: any) {
      setError(err.message || 'Erreur lors du retrait.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Notice écoles</h1>
          <p className="text-slate-400 text-sm">
            Message ou image affiché à la connexion des comptes établissement (admin, directeur, comptable) — jamais aux enseignants ni aux parents.
          </p>
        </div>
        {notice?.active && (
          <span className="shrink-0 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            Notice active
          </span>
        )}
      </div>

      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-300">
        <Info className="w-5 h-5 shrink-0 mt-0.5" />
        <p className="text-sm">
          Une seule notice à la fois. Republier remplace la précédente et la réaffiche même aux écoles qui avaient déjà fermé l'ancienne version.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Titre (optionnel)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Nouvelle fonctionnalité disponible"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Message (optionnel si une image est fournie)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Écrivez votre message aux directeurs..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-500 outline-none resize-none"
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Image (optionnel)</label>
          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-700">
              <img src={imagePreview} alt="Aperçu" className="w-full h-auto max-h-64 object-cover" />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-slate-950/80 hover:bg-rose-600 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-xl transition-colors text-slate-500 hover:text-amber-400"
            >
              <Upload className="w-6 h-6" />
              <span className="text-xs font-bold">Cliquez pour ajouter une image</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          {imageError && <p className="mt-2 text-xs font-bold text-rose-400">{imageError}</p>}
        </div>

        {error && <p className="text-xs font-bold text-rose-400">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${
              saved ? 'bg-emerald-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
            }`}
          >
            <Save className="w-4 h-4" />
            {saved ? 'Publié' : 'Publier la notice'}
          </button>
          {notice?.active && (
            <button
              onClick={handleDeactivate}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all disabled:opacity-50"
            >
              <EyeOff className="w-4 h-4" />
              Retirer la notice
            </button>
          )}
        </div>
      </div>

      {(title || message || imagePreview) && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Aperçu — ce que verront les directeurs</p>
          <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-white/20 max-w-lg">
            <div className="px-6 py-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/30 shrink-0">
                <Megaphone className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black tracking-tight">{title || 'Information DGhubSchool'}</h3>
            </div>
            {imagePreview && <img src={imagePreview} alt="" className="w-full h-auto block" />}
            {message && <p className="p-6 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">{message}</p>}
          </div>
        </div>
      )}
    </div>
  );
};
