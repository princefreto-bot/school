// ============================================================
// GABARIT E-MAIL DIRECTEURS — mise en page brandee DGhubSchool
// commune a toutes les campagnes (nouveautes, incidents, guides,
// relances) et a l'e-mail de bienvenue.
// Tables + styles inline uniquement : c'est ce que Gmail/Outlook rendent
// correctement (pas de flexbox, pas de <style> fiable).
// ============================================================
'use strict';
const crypto = require('crypto');

const SITE_URL = process.env.PUBLIC_URL || 'https://www.dghubschool.com';
const LOGO_URL = 'https://dghubschool.com/logo.png';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@dghubschool.com';
const WHATSAPP_NUMBER = '22872473027';
const WHATSAPP_DISPLAY = '+228 72 47 30 27';

const CATEGORIES = {
    update:   { label: 'Nouveautés',            color: '#f2ae06', soft: '#fef3c7', ink: '#92400e' },
    incident: { label: 'Information service',   color: '#e11d48', soft: '#ffe4e6', ink: '#9f1239' },
    guide:    { label: 'Guide & astuces',       color: '#2563eb', soft: '#dbeafe', ink: '#1e40af' },
    reminder: { label: 'Rappel',                color: '#059669', soft: '#d1fae5', ink: '#065f46' },
};

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Texte libre du superadmin : echappe, puis **gras** et retours a la ligne.
function formatText(str) {
    return escapeHtml(str)
        .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#0f172a;">$1</strong>')
        .replace(/\n/g, '<br />');
}

function safeUrl(url) {
    if (!url) return null;
    return /^https?:\/\//i.test(url) ? url : null;
}

// Jeton de desabonnement : HMAC de l'id ecole, verifiable sans stockage.
function unsubscribeToken(schoolId) {
    return crypto.createHmac('sha256', process.env.JWT_SECRET || 'dev').update(`unsub:${schoolId}`).digest('hex').slice(0, 32);
}

function unsubscribeUrl(schoolId) {
    return `${SITE_URL}/api/director-emails/unsubscribe?s=${encodeURIComponent(schoolId)}&t=${unsubscribeToken(schoolId)}`;
}

/**
 * @param {object} p
 * @param {'update'|'incident'|'guide'|'reminder'} p.category
 * @param {string} p.title
 * @param {string} [p.intro]
 * @param {string[]} [p.highlights]  points forts (liste a puces)
 * @param {string} [p.body]
 * @param {string} [p.ctaLabel]
 * @param {string} [p.ctaUrl]
 * @param {string} [p.schoolName]   personnalisation "Bonjour, direction de ..."
 * @param {string} [p.schoolId]     pour le lien de desabonnement
 */
function renderDirectorEmail(p) {
    const cat = CATEGORIES[p.category] || CATEGORIES.update;
    const highlights = (p.highlights || []).map(h => String(h).trim()).filter(Boolean);
    const ctaUrl = safeUrl(p.ctaUrl);
    const greeting = p.schoolName
        ? `Bonjour à la direction de <strong style="color:#0f172a;">${escapeHtml(p.schoolName)}</strong>,`
        : 'Bonjour Madame, Monsieur le Directeur,';
    const year = new Date().getFullYear();

    const highlightsHtml = highlights.length ? `
        <tr><td style="padding:8px 32px 4px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
                <tr><td style="padding:18px 20px 6px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:${cat.ink};">Ce qui change pour vous</td></tr>
                ${highlights.map(h => `
                <tr><td style="padding:6px 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                        <td valign="top" style="padding:2px 10px 0 0;"><span style="display:inline-block;width:18px;height:18px;line-height:18px;text-align:center;border-radius:9px;background:${cat.color};color:#ffffff;font-size:11px;font-weight:800;">✓</span></td>
                        <td style="font-size:14px;line-height:1.55;color:#334155;">${formatText(h)}</td>
                    </tr></table>
                </td></tr>`).join('')}
                <tr><td style="height:12px;"></td></tr>
            </table>
        </td></tr>` : '';

    const ctaHtml = ctaUrl ? `
        <tr><td align="center" style="padding:24px 32px 8px;">
            <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:14px 30px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:12px;font-size:13px;font-weight:800;letter-spacing:.04em;">${escapeHtml(p.ctaLabel || 'Ouvrir DGhubSchool')} →</a>
        </td></tr>` : '';

    const unsubHtml = p.schoolId
        ? `<br /><a href="${unsubscribeUrl(p.schoolId)}" style="color:#94a3b8;text-decoration:underline;">Ne plus recevoir les nouveautés et guides</a>`
        : '';

    return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${escapeHtml(p.title)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Poppins',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
<tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr><td style="background:#0f172a;padding:22px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                <td>
                    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                        <td style="padding-right:6px;"><img src="${LOGO_URL}" alt="DGhubSchool" width="64" height="64" style="width:64px;height:64px;display:block;border:0;margin:-10px 0;" /></td>
                        <td style="font-size:19px;font-weight:800;color:#ffffff;letter-spacing:-.01em;">DGhub<span style="color:#f2ae06;">School</span></td>
                    </tr></table>
                </td>
                <td align="right"><span style="display:inline-block;padding:5px 12px;border-radius:999px;background:${cat.color};color:#ffffff;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;">${cat.label}</span></td>
            </tr></table>
        </td></tr>
        <tr><td style="height:4px;background:${cat.color};line-height:4px;font-size:0;">&nbsp;</td></tr>

        <tr><td style="padding:30px 32px 6px;">
            <h1 style="margin:0;font-size:23px;line-height:1.3;font-weight:800;color:#0f172a;letter-spacing:-.01em;">${escapeHtml(p.title)}</h1>
        </td></tr>
        <tr><td style="padding:14px 32px 4px;font-size:14px;line-height:1.65;color:#334155;">
            ${greeting}
            ${p.intro ? `<p style="margin:12px 0 0;">${formatText(p.intro)}</p>` : ''}
        </td></tr>
        ${highlightsHtml}
        ${p.body ? `<tr><td style="padding:14px 32px 4px;font-size:14px;line-height:1.65;color:#334155;">${formatText(p.body)}</td></tr>` : ''}
        ${ctaHtml}

        <tr><td style="padding:26px 32px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${cat.soft};border-radius:14px;">
                <tr><td style="padding:18px 20px;">
                    <p style="margin:0 0 10px;font-size:13px;font-weight:800;color:${cat.ink};">Une question, un souci, une suggestion ?</p>
                    <p style="margin:0 0 14px;font-size:13px;line-height:1.55;color:#334155;">Écrivez-nous : notre équipe vous répond rapidement et vous accompagne.</p>
                    <a href="https://wa.me/${WHATSAPP_NUMBER}" style="display:inline-block;margin:0 6px 8px 0;padding:10px 16px;background:#25d366;color:#ffffff;text-decoration:none;border-radius:10px;font-size:12px;font-weight:800;white-space:nowrap;">WhatsApp ${WHATSAPP_DISPLAY}</a>
                    <a href="mailto:${SUPPORT_EMAIL}" style="display:inline-block;margin:0 6px 8px 0;padding:10px 16px;background:#ffffff;color:#0f172a;text-decoration:none;border-radius:10px;font-size:12px;font-weight:800;border:1px solid #cbd5e1;white-space:nowrap;">${SUPPORT_EMAIL}</a>
                </td></tr>
            </table>
        </td></tr>

        <tr><td style="padding:22px 32px 28px;border-top:1px solid #f1f5f9;font-size:11px;line-height:1.6;color:#94a3b8;text-align:center;">
            <strong style="color:#64748b;">DGhubSchool</strong> — la gestion scolaire simple et sécurisée<br />
            <a href="${SITE_URL}" style="color:#94a3b8;">www.dghubschool.com</a> · © ${year}
            ${unsubHtml}
        </td></tr>
    </table>
</td></tr>
</table>
</body></html>`;
}

module.exports = { CATEGORIES, renderDirectorEmail, unsubscribeToken, unsubscribeUrl, SITE_URL };
