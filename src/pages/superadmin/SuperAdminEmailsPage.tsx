// ============================================================
// SUPERADMIN — E-mails directeurs (Resend)
// Nouveautés, incidents/maintenance, guides et relances envoyés par
// e-mail aux directeurs de tous les établissements actifs.
// ============================================================
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mail, RefreshCw, Send, FlaskConical, Sparkles, AlertTriangle, BookOpen, BellRing, Clock, CheckCircle2 } from 'lucide-react';
import { superAdminApi } from '../../services/superAdminApi';
import { BrandLoader } from '../../components/brand/BrandLoader';

type Category = 'update' | 'incident' | 'guide' | 'reminder';

interface SentEmail {
  id: string;
  category: Category;
  subject: string;
  source: 'manual' | 'auto' | 'release';
  recipients_count: number;
  failed_count: number;
  sent_at: string;
}

interface AutoInfo {
  enabled: boolean;
  intervalDays: number;
  nextGuideSubject: string;
  nextAutoAt: string | null;
}

const CATEGORY_META: Record<Category, { label: string; icon: React.ReactNode; tone: string }> = {
  update:   { label: 'Nouveautés', icon: <Sparkles className="w-4 h-4" />,      tone: 'amber' },
  incident: { label: 'Incident / maintenance', icon: <AlertTriangle className="w-4 h-4" />, tone: 'rose' },
  guide:    { label: 'Guide & astuce', icon: <BookOpen className="w-4 h-4" />,  tone: 'blue' },
  reminder: { label: 'Rappel', icon: <BellRing className="w-4 h-4" />,          tone: 'emerald' },
};

const TONE_CLASSES: Record<string, { active: string; badge: string }> = {
  amber:   { active: 'bg-amber-500 text-slate-950 border-amber-500',     badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  rose:    { active: 'bg-rose-600 text-white border-rose-600',           badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  blue:    { active: 'bg-blue-600 text-white border-blue-600',           badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  emerald: { active: 'bg-emerald-600 text-white border-emerald-600',     badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

// Points de départ pré-remplis selon le type d'e-mail.
const STARTERS: Record<Category, { subject: string; title: string; intro: string; highlights: string; body: string }> = {
  update: {
    subject: 'Nouveautés du mois sur DGhubSchool',
    title: 'Ce qui est nouveau sur DGhubSchool',
    intro: 'Nous avons amélioré DGhubSchool. Voici les nouveautés, déjà disponibles sur votre compte :',
    highlights: '',
    body: '',
  },
  incident: {
    subject: 'Information : perturbation du service',
    title: 'Perturbation temporaire du service',
    intro: 'Nous vous informons que DGhubSchool a rencontré une perturbation le [date] entre [heure] et [heure].',
    highlights: 'Vos données sont intactes et en sécurité\nLe service est de nouveau pleinement opérationnel',
    body: 'Nous vous prions de nous excuser pour la gêne occasionnée.',
  },
  guide: {
    subject: 'Astuce : ',
    title: '',
    intro: '',
    highlights: '',
    body: '',
  },
  reminder: {
    subject: 'Rappel : ',
    title: '',
    intro: '',
    highlights: '',
    body: 'Besoin d\'aide pour le faire ? Écrivez-nous sur WhatsApp, nous vous guidons pas à pas.',
  },
};

const SOURCE_LABEL: Record<SentEmail['source'], string> = {
  manual: 'Manuel',
  auto: 'Relance auto',
  release: 'Notes de version',
};

const inputCls = 'w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-500 outline-none';
const labelCls = 'text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block';

export const SuperAdminEmailsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [recipientsCount, setRecipientsCount] = useState(0);
  const [auto, setAuto] = useState<AutoInfo | null>(null);

  const [category, setCategory] = useState<Category>('update');
  const [subject, setSubject] = useState(STARTERS.update.subject);
  const [title, setTitle] = useState(STARTERS.update.title);
  const [intro, setIntro] = useState(STARTERS.update.intro);
  const [highlights, setHighlights] = useState('');
  const [body, setBody] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [testTo, setTestTo] = useState('');

  const [previewHtml, setPreviewHtml] = useState('');
  const [busy, setBusy] = useState<'test' | 'send' | null>(null);
  const [confirmSend, setConfirmSend] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const previewTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const content = { title, intro, highlights: highlights.split('\n'), body, ctaLabel, ctaUrl };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await superAdminApi.getDirectorEmails();
      setEmails(data.emails || []);
      setRecipientsCount(data.recipientsCount || 0);
      setAuto(data.auto || null);
    } catch (err: any) {
      setError(err.message || 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Aperçu rendu par le backend (exactement le HTML qui partira), avec anti-rebond.
  useEffect(() => {
    clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(async () => {
      try {
        const data = await superAdminApi.previewDirectorEmail({ category, content });
        setPreviewHtml(data.html || '');
      } catch { /* l'aperçu n'est pas bloquant */ }
    }, 400);
    return () => clearTimeout(previewTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, title, intro, highlights, body, ctaLabel, ctaUrl]);

  const applyStarter = (cat: Category) => {
    setCategory(cat);
    const s = STARTERS[cat];
    setSubject(s.subject);
    setTitle(s.title);
    setIntro(s.intro);
    setHighlights(s.highlights);
    setBody(s.body);
    setConfirmSend(false);
  };

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 5000);
  };

  const handleTest = async () => {
    setError('');
    setBusy('test');
    try {
      const data = await superAdminApi.testDirectorEmail({ category, subject, content, to: testTo.trim() || undefined });
      flash(`E-mail de test envoyé à ${data.to}.`);
    } catch (err: any) {
      setError(err.message || 'Échec de l\'envoi de test.');
    } finally {
      setBusy(null);
    }
  };

  const handleSend = async () => {
    setError('');
    setBusy('send');
    try {
      const data = await superAdminApi.sendDirectorEmail({ category, subject, content });
      flash(`Envoyé à ${data.sent} école(s)${data.failed ? ` — ${data.failed} échec(s)` : ''}.`);
      setConfirmSend(false);
      await load();
    } catch (err: any) {
      setError(err.message || 'Échec de l\'envoi.');
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <BrandLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">E-mails directeurs</h1>
          <p className="text-slate-400 text-sm">
            Nouveautés, incidents, guides et rappels envoyés par e-mail aux directeurs de chaque établissement actif.
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-full">
          <Mail className="w-3.5 h-3.5" /> {recipientsCount} destinataire(s)
        </span>
      </div>

      {auto && (
        <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300">
          <Clock className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">
            {auto.enabled ? (
              <>
                <strong>Relances automatiques actives.</strong> Si aucun e-mail n'est parti depuis {auto.intervalDays} jours, un guide est envoyé automatiquement (le mardi à 9h).
                Prochain guide : <em>« {auto.nextGuideSubject} »</em>
                {auto.nextAutoAt && <> — pas avant le {new Date(auto.nextAutoAt).toLocaleDateString('fr-FR')}</>}.
              </>
            ) : (
              <><strong>Relances automatiques désactivées</strong> (DIRECTOR_EMAIL_AUTO=false sur le serveur).</>
            )}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── Rédaction ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 min-w-0">
          <div>
            <span className={labelCls}>Type d'e-mail</span>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(CATEGORY_META) as Category[]).map((cat) => {
                const meta = CATEGORY_META[cat];
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => applyStarter(cat)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-black transition-colors ${
                      active ? TONE_CLASSES[meta.tone].active : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {meta.icon} {meta.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Changer de type pré-remplit un modèle (le texte en cours est remplacé).</p>
          </div>

          <div>
            <label className={labelCls}>Objet de l'e-mail</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} placeholder="Ex : Nouveautés de septembre" />
            <p className="mt-1 text-[11px] text-slate-500">Préfixé automatiquement par [DGhubSchool].</p>
          </div>

          <div>
            <label className={labelCls}>Titre</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Ex : Ce qui est nouveau sur DGhubSchool" />
          </div>

          <div>
            <label className={labelCls}>Introduction</label>
            <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label className={labelCls}>Points forts (un par ligne)</label>
            <textarea
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              rows={5}
              className={`${inputCls} resize-y`}
              placeholder={'**Reçus A5** : deux fois moins de papier\n**Promotion des élèves** en un clic'}
            />
            <p className="mt-1 text-[11px] text-slate-500">Entourez un mot de **deux étoiles** pour le mettre en gras.</p>
          </div>

          <div>
            <label className={labelCls}>Texte complémentaire (optionnel)</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Texte du bouton</label>
              <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} className={inputCls} placeholder="Voir la nouveauté" />
            </div>
            <div>
              <label className={labelCls}>Lien du bouton</label>
              <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} className={inputCls} placeholder="https://..." />
            </div>
          </div>
          <p className="-mt-3 text-[11px] text-slate-500">Sans lien, le bouton mène à la page de connexion de chaque école.</p>

          {error && <p className="text-xs font-bold text-rose-400">{error}</p>}
          {notice && (
            <p className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> {notice}
            </p>
          )}

          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <input
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                className={inputCls}
                placeholder="Adresse de test (par défaut : e-mail superadmin)"
              />
              <button
                onClick={handleTest}
                disabled={busy !== null}
                className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors disabled:opacity-50"
              >
                {busy === 'test' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
                Tester
              </button>
            </div>

            {!confirmSend ? (
              <button
                onClick={() => { setError(''); setConfirmSend(true); }}
                disabled={busy !== null || recipientsCount === 0}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> Envoyer à tous les directeurs
              </button>
            ) : (
              <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 space-y-3">
                <p className="text-sm font-bold text-amber-200">
                  Envoyer « {subject} » à {recipientsCount} établissement(s) ? Un e-mail envoyé ne peut pas être rappelé.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSend}
                    disabled={busy !== null}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-amber-500 hover:bg-amber-600 text-slate-950 disabled:opacity-50"
                  >
                    {busy === 'send' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Oui, envoyer
                  </button>
                  <button
                    onClick={() => setConfirmSend(false)}
                    disabled={busy !== null}
                    className="px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Aperçu ── */}
        <div className="min-w-0">
          <p className={labelCls}>Aperçu — tel que le recevront les directeurs</p>
          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-100">
            <iframe title="Aperçu e-mail" srcDoc={previewHtml} className="w-full h-[760px] block" sandbox="" />
          </div>
        </div>
      </div>

      {/* ── Historique ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Historique des envois</h2>
        {emails.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun e-mail envoyé pour l'instant.</p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {emails.map((e) => {
              const meta = CATEGORY_META[e.category] || CATEGORY_META.update;
              return (
                <li key={e.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border px-2.5 py-1 rounded-full w-fit ${TONE_CLASSES[meta.tone].badge}`}>
                    {meta.icon} {meta.label}
                  </span>
                  <span className="flex-1 min-w-0 text-sm font-bold text-white truncate">{e.subject}</span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {SOURCE_LABEL[e.source]} · {e.recipients_count} envoyé(s){e.failed_count ? `, ${e.failed_count} échec(s)` : ''} · {new Date(e.sent_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
