const fetch = require('node-fetch'); // Ou utiliser le fetch global natif de Node > 18 si disponible

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_YvZHtCpM_JdmCAtGEt3tSTAhK3TwMFpqw';
const FROM_EMAIL = process.env.SMTP_FROM || 'DGhubSchool <onboarding@resend.dev>'; // Doit être un domaine vérifié ou onboarding@resend.dev pour les tests

/**
 * Envoie un email via l'API Resend
 */
async function sendResendEmail(toEmail, subject, htmlContent) {
    console.log(`✉️ [Mailer] Tentative d'envoi d'email via Resend à ${toEmail}...`);
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: [toEmail],
                subject: subject,
                html: htmlContent
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || `Erreur HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log(`[Mailer] E-mail envoyé avec succès via Resend à ${toEmail} :`, data.id);
        return true;
    } catch (error) {
        console.error('[Mailer] Erreur lors de l\'envoi via Resend :', error.message);
        throw error;
    }
}

async function sendVerificationEmail(toEmail, schoolName, verificationCode) {
    const htmlContent = `
        <div style="font-family: 'Poppins', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
                <img src="https://dghubschool.com/logo.png" alt="DGhubSchool" style="height: 60px; max-width: 200px; margin-bottom: 12px; object-fit: contain;" />
                <h2 style="color: #0f172a; margin-top: 12px; font-weight: 800; letter-spacing: -0.025em;">Validation de votre établissement</h2>
            </div>
            
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
                Bonjour,
            </p>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
                Merci d'avoir choisi <strong>DGhubSchool</strong> pour la gestion de votre établissement <strong>${schoolName}</strong>.
            </p>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
                Pour valider la création de votre compte administrateur et initialiser vos bases de données, veuillez copier le code de confirmation ci-dessous :
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
                <span style="display: inline-block; padding: 12px 32px; background-color: #fef3c7; border: 2px dashed #f59e0b; border-radius: 12px; color: #b45309; font-weight: bold; font-size: 28px; letter-spacing: 6px;">
                    ${verificationCode}
                </span>
                <p style="color: #64748b; font-size: 11px; margin-top: 8px;">Ce code est valable pendant 15 minutes.</p>
            </div>
            
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
                Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.
            </p>
            
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
            
            <p style="color: #94a3b8; font-size: 11px; text-align: center; line-height: 1.4;">
                © ${new Date().getFullYear()} DGhubSchool. Tous droits réservés.<br />
                Loi togolaise sur la protection des données de scolarité & IPDCP.
            </p>
        </div>
    `;

    return sendResendEmail(toEmail, `[DGhubSchool] Vérification de votre adresse e-mail - ${schoolName}`, htmlContent);
}

async function sendPasswordResetEmail(toEmail, resetLink) {
    const htmlContent = `
        <div style="font-family: 'Poppins', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
                <img src="https://dghubschool.com/logo.png" alt="DGhubSchool" style="height: 60px; max-width: 200px; margin-bottom: 12px; object-fit: contain;" />
                <h2 style="color: #0f172a; margin-top: 12px; font-weight: 800; letter-spacing: -0.025em;">Réinitialisation de mot de passe</h2>
            </div>
            
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
                Bonjour,
            </p>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
                Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte administrateur sur <strong>DGhubSchool</strong>.
            </p>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
                Veuillez cliquer sur le bouton ci-dessous pour créer un nouveau mot de passe.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
                <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; border-radius: 12px; color: #ffffff; font-weight: bold; font-size: 16px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);">
                    Réinitialiser mon mot de passe
                </a>
                <p style="color: #64748b; font-size: 11px; margin-top: 12px;">Ce lien est valable pendant 1 heure.</p>
            </div>
            
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
                Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail. Votre mot de passe actuel restera inchangé.
            </p>
            
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
            
            <p style="color: #94a3b8; font-size: 11px; text-align: center; line-height: 1.4;">
                © ${new Date().getFullYear()} DGhubSchool. Tous droits réservés.<br />
            </p>
        </div>
    `;

    return sendResendEmail(toEmail, `[DGhubSchool] Réinitialisation de votre mot de passe`, htmlContent);
}

/**
 * Notification superadmin — un paiement de licence parent vient d'être enregistré.
 * @param {object} info { schoolName, schoolSlug, studentName, parentName, amount, trancheLabel, isFinal, totalPaid, licenseKey }
 */
async function sendSuperadminLicensePaymentAlert(info) {
    const to = process.env.SUPERADMIN_EMAIL;
    if (!to) {
        console.log('[Mailer] SUPERADMIN_EMAIL non configuré — notification licence ignorée.');
        return false;
    }

    const {
        schoolName = '—',
        schoolSlug = '—',
        studentName = '—',
        parentName = '—',
        amount = 0,
        trancheLabel = '—',
        isFinal = false,
        totalPaid = 0,
        licenseKey = '—'
    } = info || {};

    const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' F CFA';
    const badgeColor = isFinal ? '#059669' : '#d97706';
    const badgeText = isFinal ? 'LICENCE SOLDÉE — +700 F reversés à l\'école' : 'Tranche partielle enregistrée';

    const html = `
        <div style="font-family: 'Poppins', Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #f1f5f9; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://dghubschool.com/logo.png" alt="DGhubSchool" style="height: 48px; margin-bottom: 12px; object-fit: contain;" />
                <h2 style="color: #0f172a; margin: 8px 0 0; font-weight: 800; font-size: 20px;">Nouveau paiement de licence parent</h2>
                <span style="display:inline-block; margin-top:10px; padding: 4px 12px; background-color: ${badgeColor}; color: #fff; border-radius: 999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">
                    ${badgeText}
                </span>
            </div>

            <table style="width:100%; border-collapse: collapse; font-size: 13px; color: #334155;">
                <tr><td style="padding:8px 0; font-weight:700; color:#0f172a; width:38%;">École</td><td style="padding:8px 0;">${schoolName} <span style="color:#94a3b8;">(${schoolSlug})</span></td></tr>
                <tr style="background:#f8fafc;"><td style="padding:8px; font-weight:700; color:#0f172a;">Élève</td><td style="padding:8px;">${studentName}</td></tr>
                <tr><td style="padding:8px 0; font-weight:700; color:#0f172a;">Parent</td><td style="padding:8px 0;">${parentName}</td></tr>
                <tr style="background:#f8fafc;"><td style="padding:8px; font-weight:700; color:#0f172a;">Montant</td><td style="padding:8px; font-weight:800;">${fmt(amount)}</td></tr>
                <tr><td style="padding:8px 0; font-weight:700; color:#0f172a;">Type</td><td style="padding:8px 0;">${trancheLabel}</td></tr>
                <tr style="background:#f8fafc;"><td style="padding:8px; font-weight:700; color:#0f172a;">Total payé (élève)</td><td style="padding:8px;">${fmt(totalPaid)} / 2 100 F CFA</td></tr>
                <tr><td style="padding:8px 0; font-weight:700; color:#0f172a;">Clé Chariow</td><td style="padding:8px 0; font-family: monospace; font-size:11px; color:#64748b;">${licenseKey}</td></tr>
            </table>

            ${isFinal ? `
                <div style="margin-top:20px; padding:14px; background:#ecfdf5; border-left:4px solid #059669; border-radius:8px; color:#065f46; font-size:12px;">
                    <strong>Licence entièrement soldée.</strong> 700 F CFA ont été automatiquement crédités au solde retrait de <strong>${schoolName}</strong>.
                </div>
            ` : ''}

            <div style="margin-top:24px; text-align:center;">
                <a href="https://www.dghubschool.com/fr/superadmin" style="display:inline-block; padding:12px 28px; background:#0f172a; color:#fff; text-decoration:none; border-radius:10px; font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em;">
                    Ouvrir le dashboard superadmin
                </a>
            </div>

            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center; line-height: 1.4; margin:0;">
                Notification automatique · DGHUBSCHOOL SaaS<br />
                Reçue par ${to}
            </p>
        </div>
    `;

    try {
        await sendResendEmail(to, `[DGhubSchool] ${isFinal ? '✅ Licence soldée' : '🧾 Tranche reçue'} — ${schoolName} — ${fmt(amount)}`, html);
        return true;
    } catch (err) {
        console.error('[Mailer] Notification superadmin échouée:', err.message);
        return false;
    }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendSuperadminLicensePaymentAlert };
