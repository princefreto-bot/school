// ============================================================
// E-MAILS DIRECTEURS — endpoints superadmin + desabonnement public
// ============================================================
const { supabase } = require('../utils/supabase');
const service = require('../services/directorEmailService');
const { unsubscribeToken } = require('../utils/directorEmailTemplate');

/** GET /api/superadmin/director-emails — historique + etat des relances auto */
async function listDirectorEmails(req, res) {
    try {
        const { data, error } = await supabase
            .from('platform_emails')
            .select('id, category, subject, content, source, auto_key, recipients_count, failed_count, sent_at')
            .order('sent_at', { ascending: false })
            .limit(50);
        if (error) throw error;

        const recipients = await service.getRecipients('update');
        const lastAuto = (data || []).find(e => e.source === 'auto');
        const lastAny = data?.[0];
        const nextGuide = service.nextAutoGuide(lastAuto?.auto_key || null);
        const nextAutoAt = lastAny
            ? new Date(new Date(lastAny.sent_at).getTime() + service.AUTO_INTERVAL_DAYS * 86400000).toISOString()
            : null;

        return res.json({
            emails: data || [],
            recipientsCount: recipients.length,
            auto: {
                enabled: process.env.DIRECTOR_EMAIL_AUTO !== 'false',
                intervalDays: service.AUTO_INTERVAL_DAYS,
                nextGuideSubject: nextGuide.subject,
                nextAutoAt,
            },
        });
    } catch (err) {
        console.error('listDirectorEmails error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

/** POST /api/superadmin/director-emails/preview — HTML rendu */
async function previewDirectorEmail(req, res) {
    const { category, content } = req.body || {};
    return res.json({ html: service.preview({ category, content }) });
}

/** POST /api/superadmin/director-emails/test — envoi a une seule adresse */
async function testDirectorEmail(req, res) {
    try {
        const { category, subject, content, to } = req.body || {};
        const target = (to || process.env.SUPERADMIN_EMAIL || '').trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
            return res.status(400).json({ error: 'Adresse de test invalide.' });
        }
        await service.sendTest({ category, subject, content, to: target });
        return res.json({ success: true, to: target });
    } catch (err) {
        return res.status(err.status || 500).json({ error: err.message });
    }
}

/** POST /api/superadmin/director-emails/send — envoi a toutes les ecoles */
async function sendDirectorEmail(req, res) {
    try {
        const { category, subject, content } = req.body || {};
        const result = await service.sendCampaign({ category, subject, content, source: 'manual', createdBy: req.user.id });
        return res.json(result);
    } catch (err) {
        console.error('sendDirectorEmail error:', err.message);
        return res.status(err.status || 500).json({ error: err.message });
    }
}

/** GET /api/director-emails/unsubscribe?s=<schoolId>&t=<token> — lien public en pied d'e-mail */
async function unsubscribe(req, res) {
    const { s, t } = req.query;
    const page = (title, text) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#f1f5f9;font-family:Helvetica,Arial,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px;">
<div style="max-width:440px;background:#fff;border-radius:20px;padding:32px;text-align:center;border:1px solid #e2e8f0;">
<img src="https://dghubschool.com/logo.png" alt="DGhubSchool" style="height:44px;margin-bottom:16px;">
<h1 style="font-size:20px;color:#0f172a;margin:0 0 10px;">${title}</h1>
<p style="font-size:14px;color:#475569;line-height:1.6;margin:0;">${text}</p></div></body></html>`;

    if (!s || !t || t !== unsubscribeToken(s)) {
        return res.status(400).send(page('Lien invalide', 'Ce lien de désabonnement n\'est pas valide. Écrivez-nous sur WhatsApp au +228 72 47 30 27 si besoin.'));
    }
    const { error } = await supabase.from('schools').update({ email_updates_opt_out: true }).eq('id', s);
    if (error) {
        return res.status(500).send(page('Erreur', 'Une erreur est survenue. Réessayez plus tard.'));
    }
    return res.send(page('Désabonnement confirmé', 'Vous ne recevrez plus nos e-mails de nouveautés et de guides. Les informations importantes concernant le service (incidents, maintenance) continueront de vous parvenir.'));
}

module.exports = { listDirectorEmails, previewDirectorEmail, testDirectorEmail, sendDirectorEmail, unsubscribe };
