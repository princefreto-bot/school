// ============================================================
// MON PROFIL — Fiche personnelle en lecture seule (portail « Mon Espace »)
// ============================================================
import React, { useEffect, useState } from 'react';
import { personnelApi } from '../services/personnelApi';
import { useStore } from '../store/useStore';
import { getRoleLabel } from '../utils/rolePermissions';
import { UserCircle, Loader2, AlertTriangle } from 'lucide-react';

interface Profile {
  id: string;
  nom: string;
  telephone: string;
  email?: string | null;
  role: string;
  matricule?: string | null;
  numero_cnss?: string | null;
  date_embauche?: string | null;
  mode_paiement?: string | null;
  compte_bancaire?: string | null;
  departement?: string | null;
}

const NA = '—';

const Row: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
    <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{value || NA}</span>
  </div>
);

export const MonProfil: React.FC = () => {
  const user = useStore((s) => s.user);
  const teachingMode = useStore((s) => s.teachingMode);
  const isSharedTeacher = user?.role === 'enseignant' && teachingMode !== 'individual';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isSharedTeacher) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      try {
        const data = await personnelApi.getMyProfile();
        setProfile(data);
      } catch (err: any) {
        setError(err?.error || 'Erreur lors du chargement du profil.');
      } finally {
        setLoading(false);
      }
    })();
  }, [isSharedTeacher]);

  return (
    <div className="space-y-6 pb-20 max-w-[700px] mx-auto animate-slideUp">
      <div className="relative pro-card p-8 overflow-hidden bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-indigo-100 dark:border-indigo-900/30">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500 text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4">
            <UserCircle className="w-3.5 h-3.5" /> Mon Espace
          </div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Mon Profil</h2>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8">
        {isSharedTeacher ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Compte partagé</p>
            <p className="text-xs text-slate-400 max-w-sm">
              Ce compte enseignant est partagé entre plusieurs personnes. Contactez la direction pour obtenir un compte individuel et accéder à votre profil.
            </p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
        ) : error ? (
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl p-3 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        ) : profile ? (
          <div>
            <Row label="Nom et prénom" value={profile.nom} />
            <Row label="Rôle" value={getRoleLabel(profile.role)} />
            <Row label="Téléphone" value={profile.telephone} />
            <Row label="Email" value={profile.email} />
            <Row label="Matricule" value={profile.matricule} />
            <Row label="N° CNSS" value={profile.numero_cnss} />
            <Row label="Date d'embauche" value={profile.date_embauche ? new Date(profile.date_embauche).toLocaleDateString('fr-FR') : undefined} />
            <Row label="Département" value={profile.departement} />
            <Row label="Mode de paiement" value={profile.mode_paiement} />
            <Row label="Compte bancaire / Mobile" value={profile.compte_bancaire} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MonProfil;
