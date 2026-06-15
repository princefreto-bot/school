const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function sendVerificationEmail(toEmail, schoolName, verificationCode) {
    const from = process.env.SMTP_FROM || '"DGhubSchool" <no-reply@dghubschool.com>';
    
    const htmlContent = `
        <div style="font-family: 'Poppins', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; padding: 12px; background-color: #f59e0b; border-radius: 12px; color: #ffffff; font-weight: bold; font-size: 24px;">
                    🏫
                </div>
                <h2 style="color: #0f172a; margin-top: 12px; font-weight: 800; tracking: -0.025em;">Validation de votre établissement</h2>
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

    // Mode Brevo API
    if (process.env.BREVO_API_KEY) {
        const match = from.match(/<([^>]+)>/);
        const cleanFromEmail = match ? match[1] : from;
        const senderName = from.includes('<') ? from.split('<')[0].replace(/"/g, '').trim() : 'DGhubSchool';

        try {
            console.log(`✉️ [Mailer] Tentative d'envoi d'email via Brevo API à ${toEmail}...`);
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': process.env.BREVO_API_KEY,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: {
                        name: senderName,
                        email: cleanFromEmail
                    },
                    to: [{ email: toEmail }],
                    subject: `[DGhubSchool] Vérification de votre adresse e-mail - ${schoolName}`,
                    htmlContent
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || `Code d'erreur Brevo: ${response.status}`);
            }

            const data = await response.json();
            console.log(`[Mailer] E-mail de validation envoyé avec succès via Brevo API à ${toEmail} :`, data.messageId);
            return true;
        } catch (error) {
            console.error('[Mailer] Erreur lors de l\'envoi de l\'email via Brevo API :', error);
            throw error;
        }
    }

    // Mode SMTP standard
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn(`⚠️ [Mailer Warning] SMTP ou Brevo API non configurés (SMTP_USER ou BREVO_API_KEY manquant).`);
        console.log(`🔑 [CODE DE VALIDATION] E-mail: ${toEmail} | Code: ${verificationCode}`);
        return true;
    }

    const mailOptions = {
        from,
        to: toEmail,
        subject: `[DGhubSchool] Vérification de votre adresse e-mail - ${schoolName}`,
        html: htmlContent
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[Mailer] E-mail de validation envoyé avec succès à ${toEmail} : ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('[Mailer] Erreur lors de l\'envoi de l\'email via SMTP :', error);
        throw error;
    }
}

module.exports = { sendVerificationEmail };
