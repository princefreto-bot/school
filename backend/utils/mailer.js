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
                <div style="display: inline-block; padding: 12px; background-color: #f59e0b; border-radius: 12px; color: #ffffff; font-weight: bold; font-size: 24px;">
                    🏫
                </div>
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
                <div style="display: inline-block; padding: 12px; background-color: #3b82f6; border-radius: 12px; color: #ffffff; font-weight: bold; font-size: 24px;">
                    🔒
                </div>
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

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
