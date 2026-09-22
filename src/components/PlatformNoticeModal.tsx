// ============================================================
// PLATFORM NOTICE MODAL — Message/image du propriétaire de la plateforme
// affiché aux comptes établissement (admin/directeur/comptable) à la
// connexion. Jamais affiché aux enseignants, secrétaires ou parents —
// ce filtrage est fait côté backend (voir platformNoticeController).
// ============================================================
import React, { useEffect, useState } from 'react';
import { X, Megaphone } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface PlatformNotice {
  id: string;
  title: string | null;
  message: string | null;
  image_url: string | null;
  updated_at: string;
}

const DISMISSED_KEY_PREFIX = 'platform_notice_dismissed_';

export const PlatformNoticeModal: React.FC = () => {
  const [notice, setNotice] = useState<PlatformNotice | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('parent_token');
    if (!token) return;

    fetch(`${API_BASE_URL}/platform-notice`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : { notice: null }))
      .then((data) => {
        const n = data?.notice as PlatformNotice | null;
        if (!n) return;
        // Une notice republiée (updated_at plus récent) redevient visible même si
        // une version précédente avait déjà été fermée sur cet appareil.
        const dismissedAt = localStorage.getItem(`${DISMISSED_KEY_PREFIX}${n.id}`);
        if (dismissedAt && new Date(dismissedAt) >= new Date(n.updated_at)) return;
        setNotice(n);
      })
      .catch(() => {});
  }, []);

  if (!notice) return null;

  const close = () => {
    localStorage.setItem(`${DISMISSED_KEY_PREFIX}${notice.id}`, new Date().toISOString());
    setNotice(null);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-slideUp border border-white/20">
        <div className="px-6 py-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white relative">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Megaphone className="w-20 h-20" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shrink-0">
                <Megaphone className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black tracking-tight">{notice.title || 'Information DGhubSchool'}</h3>
            </div>
            <button
              onClick={close}
              className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-all shrink-0"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          {notice.image_url && (
            <img src={notice.image_url} alt={notice.title || 'Notice'} className="w-full h-auto block" />
          )}
          {notice.message && (
            <p className="p-6 text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
              {notice.message}
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={close}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl transition-colors"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
};
