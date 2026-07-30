// ============================================================
// ESPACE PERSONNEL — Accueil non-financier pour les rôles sans accès
// au dashboard financier (secrétaire). Aucune donnée financière ici.
// ============================================================
import React from 'react';
import { useStore } from '../store/useStore';
import { getRoleLabel } from '../utils/rolePermissions';
import {
  UserCircle, Wallet, Calendar, CalendarX, Users, Megaphone, ArrowRight
} from 'lucide-react';

const QUICK_LINKS: { id: 'mon_profil' | 'mon_planning' | 'mes_absences' | 'mon_bulletin_paie' | 'gestion_personnel'; label: string; icon: React.ReactNode }[] = [
  { id: 'gestion_personnel', label: 'Gestion du Personnel', icon: <Users className="w-5 h-5" /> },
  { id: 'mon_profil', label: 'Mon Profil', icon: <UserCircle className="w-5 h-5" /> },
  { id: 'mon_bulletin_paie', label: 'Mes Bulletins de Paie', icon: <Wallet className="w-5 h-5" /> },
  { id: 'mon_planning', label: 'Mon Planning', icon: <Calendar className="w-5 h-5" /> },
  { id: 'mes_absences', label: 'Mes Absences', icon: <CalendarX className="w-5 h-5" /> },
];

export const EspacePersonnel: React.FC = () => {
  const user = useStore((s) => s.user);
  const announcements = useStore((s) => s.announcements);
  const setCurrentPage = useStore((s) => s.setCurrentPage);

  const recentAnnouncements = [...announcements]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 animate-slideUp">
      <div className="relative border border-slate-900/10 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[32px] p-8 overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
          <Users className="w-52 h-52 text-slate-900 dark:text-white" />
        </div>
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 dark:bg-slate-800 text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4">
            {getRoleLabel(user?.role || '')}
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Bonjour, {user?.nom || ''}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium max-w-xl">
            Retrouvez ici vos raccourcis et les dernières annonces de l'établissement.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {QUICK_LINKS.map((link) => (
          <button
            key={link.id}
            onClick={() => setCurrentPage(link.id)}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 flex flex-col items-center gap-3 text-center hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              {link.icon}
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{link.label}</span>
          </button>
        ))}
      </div>

      <div className="border border-slate-900/10 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[28px] p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20">
            <Megaphone className="w-5 h-5" />
          </div>
          <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">Annonces Récentes</h3>
        </div>

        {recentAnnouncements.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className="text-sm font-bold text-slate-400">Aucune annonce pour l'instant.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentAnnouncements.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="min-w-0">
                  <p className="font-black text-slate-900 dark:text-white truncate">{a.titre}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{a.message}</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 shrink-0">{a.date}</span>
              </div>
            ))}
            <button
              onClick={() => setCurrentPage('annonces')}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-500 pt-2"
            >
              Voir toutes les annonces <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
