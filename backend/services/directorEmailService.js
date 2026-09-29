// ============================================================
// SERVICE — E-mails aux directeurs d'etablissement (Resend)
//  - campagnes manuelles depuis le dashboard superadmin
//  - notes de version envoyees apres un build (scripts/sendReleaseEmail.js)
//  - relances automatiques : si aucun e-mail n'est parti depuis
//    AUTO_INTERVAL_DAYS, un guide de la bibliotheque ci-dessous est envoye
//  - e-mail de bienvenue a la validation d'une nouvelle ecole
// ============================================================
'use strict';
const cron = require('node-cron');
const { supabase } = require('../utils/supabase');
const { sendResendBatch, sendResendEmail } = require('../utils/mailer');
const { CATEGORIES, renderDirectorEmail, unsubscribeUrl, SITE_URL } = require('../utils/directorEmailTemplate');

const AUTO_INTERVAL_DAYS = parseInt(process.env.DIRECTOR_EMAIL_INTERVAL_DAYS, 10) || 14;

// Bibliotheque des relances automatiques — chaque guide ne met en avant
// qu'une fonctionnalite qui existe reellement dans l'application.
// L'ordre est l'ordre de rotation ; on repart du debut une fois tout envoye.
const AUTO_GUIDES = [
    {
        key: 'guide-utilisateur',
        category: 'guide',
        subject: 'Le guide complet DGhubSchool (26 pages) est disponible',
        title: 'Tout DGhubSchool en un seul guide',
        intro: 'Pour vous et votre équipe, nous avons mis à jour le **guide utilisateur** : chaque écran expliqué pas à pas, avec des captures.',
        highlights: [
            'Inscriptions, classes et fiches élèves',
            'Tranches de scolarité, paiements et reçus',
            'Notes, bulletins et cartes scolaires',
            'Personnel, paie et emploi du temps',
        ],
        body: 'Partagez-le à votre secrétariat et à votre comptable : c\'est le moyen le plus rapide de les rendre autonomes.',
        ctaLabel: 'Télécharger le guide (PDF)',
        ctaUrl: `${SITE_URL}/guides/DGhubSchool_Guide_Utilisateur.pdf`,
    },
    {
        key: 'rappels-paiement',
        category: 'guide',
        subject: 'Astuce : laissez DGhubSchool relancer les parents à votre place',
        title: 'Les rappels de paiement automatiques',
        intro: 'Relancer les parents un par un prend du temps. DGhubSchool peut le faire **automatiquement**, avec votre propre message.',
        highlights: [
            'Activez les rappels dans **Paramètres** et choisissez le délai de retard',
            'Les parents reçoivent une notification sur leur téléphone',
            'Un même parent n\'est jamais relancé plus d\'une fois par semaine',
        ],
        body: 'Résultat : moins d\'appels, et un recouvrement plus régulier sur toute l\'année.',
    },
    {
        key: 'recus-transactions',
        category: 'guide',
        subject: 'Reçus A5, suivi par transaction : vos paiements plus clairs',
        title: 'Chaque paiement a désormais son reçu',
        intro: 'Dans la page **Paiements**, chaque montant encaissé est tracé par une transaction, avec son propre reçu.',
        highlights: [
            'Reçus au format **A5 compact** : deux fois moins de papier',
            'Un reçu par transaction, imprimable à tout moment',
            'Un paiement saisi par erreur peut être supprimé depuis la page Paiements',
        ],
    },
    {
        key: 'app-mobile',
        category: 'guide',
        subject: 'DGhubSchool dans votre poche : l\'application Android',
        title: 'Gérez votre école depuis votre téléphone',
        intro: 'L\'application mobile Android DGhubSchool vous donne accès à votre établissement partout, même en déplacement.',
        highlights: [
            'Consultez les paiements et les élèves en temps réel',
            'Recevez les notifications importantes',
            'Vous êtes prévenu automatiquement quand une mise à jour est disponible',
        ],
        ctaLabel: 'Télécharger l\'application',
        ctaUrl: `${SITE_URL}/fr/telecharger-app`,
    },
    {
        key: 'attestation-scolarite',
        category: 'guide',
        subject: 'Astuce : l\'attestation de scolarité en un clic',
        title: 'Une attestation de scolarité en un clic',
        intro: 'Un parent vous demande une attestation ? Plus besoin de la rédiger : ouvrez la **fiche de l\'élève** et générez-la directement.',
        highlights: [
            'Document aux couleurs et au logo de votre école',
            'Prêt à imprimer ou à envoyer en PDF',
        ],
    },
    {
        key: 'rentree-promotion',
        category: 'guide',
        subject: 'Rentrée : passez vos élèves en classe supérieure sans ressaisie',
        title: 'La promotion des élèves d\'une année à l\'autre',
        intro: 'À la rentrée, inutile de réinscrire vos élèves : DGhubSchool les **fait passer en classe supérieure** en conservant leur historique.',
        highlights: [
            'Tranches et frais d\'inscription configurés **par année scolaire**',
            'Tarifs fixés par classe, Ancien/Nouveau élève',
            'Les données de l\'année précédente restent consultables',
        ],
    },
];

function daysAgoIso(days) {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Ecoles destinataires : actives, e-mail verifie. Les incidents passent
 * outre le desabonnement (ils concernent directement le service souscrit).
 */
async function getRecipients(category) {
    const { data, error } = await supabase
        .from('schools')
        .select('id, name, slug, email, status, email_updates_opt_out')
        .eq('is_email_verified', true)
        .neq('status', 'suspended')
        .not('email', 'is', null);
    if (error) throw error;
    const seen = new Set();
    return (data || []).filter((s) => {
        const email = (s.email || '').trim().toLowerCase();
        if (!email || seen.has(email)) return false;
        if (category !== 'incident' && s.email_updates_opt_out) return false;
        seen.add(email);
        return true;
    });
}

function normalizeContent(c) {
    return {
        title: String(c.title || '').trim(),
        intro: String(c.intro || '').trim(),
        highlights: Array.isArray(c.highlights) ? c.highlights.map(h => String(h).trim()).filter(Boolean) : [],
        body: String(c.body || '').trim(),
        ctaLabel: String(c.ctaLabel || '').trim(),
        ctaUrl: String(c.ctaUrl || '').trim(),
    };
}

function buildForSchool(category, content, school) {
    return renderDirectorEmail({
        category,
        ...content,
        // Sans lien explicite, le bouton mene a la page de connexion de l'ecole.
        ctaLabel: content.ctaUrl ? content.ctaLabel : 'Se connecter à mon école',
        ctaUrl: content.ctaUrl || (school ? `${SITE_URL}/fr/login/${school.slug}` : `${SITE_URL}/fr/login`),
        schoolName: school?.name,
        schoolId: school?.id,
    });
}

function validate(category, subject, content) {
    if (!CATEGORIES[category]) return 'Catégorie invalide.';
    if (!subject || !String(subject).trim()) return 'L\'objet de l\'e-mail est requis.';
    if (!content.title) return 'Le titre est requis.';
    if (!content.intro && !content.body && content.highlights.length === 0) return 'Ajoutez au moins un texte ou un point fort.';
    if (content.ctaUrl && !/^https?:\/\//i.test(content.ctaUrl)) return 'Le lien du bouton doit commencer par http(s)://';
    return null;
}

/**
 * Envoie une campagne a toutes les ecoles eligibles et l'enregistre dans l'historique.
 */
async function sendCampaign({ category, subject, content: rawContent, source = 'manual', autoKey = null, createdBy = null }) {
    const content = normalizeContent(rawContent || {});
    const err = validate(category, subject, content);
    if (err) { const e = new Error(err); e.status = 400; throw e; }

    const schools = await getRecipients(category);
    const fullSubject = `[DGhubSchool] ${String(subject).trim()}`;
    const emails = schools.map((school) => ({
        to: school.email.trim(),
        subject: fullSubject,
        html: buildForSchool(category, content, school),
        headers: {
            'List-Unsubscribe': `<${unsubscribeUrl(school.id)}>`,
        },
    }));

    const { sent, failed } = emails.length ? await sendResendBatch(emails) : { sent: 0, failed: 0 };

    const { data: row, error } = await supabase
        .from('platform_emails')
        .insert({
            category,
            subject: String(subject).trim(),
            content,
            source,
            auto_key: autoKey,
            recipients_count: sent,
            failed_count: failed,
            created_by: createdBy,
        })
        .select()
        .single();
    if (error) console.error('[DirectorEmail] Historique non enregistré :', error.message);

    console.log(`📧 [DirectorEmail] "${subject}" (${source}) : ${sent} envoyé(s), ${failed} échec(s).`);
    return { sent, failed, total: emails.length, email: row || null };
}

/** Un seul e-mail de test (rendu comme pour une vraie ecole fictive). */
async function sendTest({ category, subject, content: rawContent, to }) {
    const content = normalizeContent(rawContent || {});
    const err = validate(category, subject, content);
    if (err) { const e = new Error(err); e.status = 400; throw e; }
    const html = buildForSchool(category, content, { id: 'test', name: 'École de démonstration', slug: 'demo' });
    await sendResendEmail(to, `[TEST] [DGhubSchool] ${String(subject).trim()}`, html);
    return true;
}

function preview({ category, content }) {
    return buildForSchool(CATEGORIES[category] ? category : 'update', normalizeContent(content || {}), { id: 'preview', name: 'École de démonstration', slug: 'demo' });
}

/** Bienvenue a une ecole qui vient de valider son inscription (une seule fois). */
async function sendWelcomeEmail(school) {
    if (!school?.email || school.welcome_email_sent_at) return;
    const html = buildForSchool('update', {
        title: `Bienvenue sur DGhubSchool, ${school.name} !`,
        intro: 'Votre établissement est prêt. Voici les premières étapes pour bien démarrer :',
        highlights: [
            'Créez vos **classes** et configurez les **tranches de scolarité** par classe',
            'Inscrivez vos élèves (ou importez-les depuis Excel)',
            'Ajoutez votre personnel : secrétaire, comptable, enseignants',
            'Encaissez les paiements : chaque transaction génère son reçu',
        ],
        body: 'Le **guide utilisateur** (bouton ci-dessous) détaille chaque écran, pas à pas.\n\nNous vous écrirons régulièrement pour vous présenter les nouveautés et des astuces. Et si vous bloquez sur quoi que ce soit, écrivez-nous sur WhatsApp : nous vous accompagnons.',
        ctaLabel: 'Télécharger le guide (PDF)',
        ctaUrl: `${SITE_URL}/guides/DGhubSchool_Guide_Utilisateur.pdf`,
    }, school);
    try {
        await sendResendEmail(school.email.trim(), `[DGhubSchool] Bienvenue, ${school.name} — vos premiers pas`, html);
        await supabase.from('schools').update({ welcome_email_sent_at: new Date().toISOString() }).eq('id', school.id);
    } catch (err) {
        console.error('[DirectorEmail] Bienvenue non envoyée :', err.message);
    }
}

/**
 * Relance automatique : n'envoie rien si un e-mail (manuel, release ou auto)
 * est deja parti dans les AUTO_INTERVAL_DAYS derniers jours.
 */
async function runAutoReminder() {
    if (process.env.DIRECTOR_EMAIL_AUTO === 'false') return { skipped: 'disabled' };

    const { data: recent, error: recentErr } = await supabase
        .from('platform_emails')
        .select('id')
        .gte('sent_at', daysAgoIso(AUTO_INTERVAL_DAYS))
        .limit(1);
    // Sans historique lisible (migration non appliquee...), on n'envoie rien :
    // sinon le meme guide repartirait chaque semaine.
    if (recentErr) {
        console.error('[DirectorEmail] Historique illisible, relance annulée :', recentErr.message);
        return { skipped: 'no-history' };
    }
    if (recent && recent.length) return { skipped: 'recent' };

    const { data: autoSent } = await supabase
        .from('platform_emails')
        .select('auto_key')
        .eq('source', 'auto')
        .order('sent_at', { ascending: false })
        .limit(1);
    const guide = nextAutoGuide(autoSent?.[0]?.auto_key);

    const { key, category, subject, ...content } = guide;
    return sendCampaign({ category, subject, content, source: 'auto', autoKey: key });
}

function nextAutoGuide(lastKey) {
    const lastIdx = AUTO_GUIDES.findIndex(g => g.key === lastKey);
    return AUTO_GUIDES[(lastIdx + 1) % AUTO_GUIDES.length];
}

/** Verification chaque mardi a 9h (heure serveur). */
function start() {
    cron.schedule('0 9 * * 2', () => {
        runAutoReminder().catch((err) => console.error('💥 [DirectorEmail] Relance automatique échouée :', err.message));
    });
    console.log(`📧 [DirectorEmail] Relances automatiques planifiées (mardi 9h, intervalle ${AUTO_INTERVAL_DAYS} j).`);
}

module.exports = {
    AUTO_GUIDES,
    AUTO_INTERVAL_DAYS,
    getRecipients,
    sendCampaign,
    sendTest,
    preview,
    sendWelcomeEmail,
    runAutoReminder,
    nextAutoGuide,
    start,
};
