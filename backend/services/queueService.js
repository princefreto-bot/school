// Fallback asynchrone direct sans nécessiter Redis / BullMQ
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer'); 

// Fonction pour ajouter un email (exécuté en background sans file d'attente Redis)
const addEmailJob = async (jobName, emailData) => {
  console.log(`Exécution de l'email en direct (sans Redis) pour le job ${jobName} vers:`, emailData.to);
  
  // Utiliser setImmediate pour ne pas bloquer le thread principal (simule l'effet background)
  setImmediate(async () => {
    try {
      if (jobName === 'send-verification') {
        const { to, schoolName, code } = emailData;
        await sendVerificationEmail(to, schoolName, code);
      } else if (jobName === 'send-password-reset') {
        const { to, resetLink } = emailData;
        await sendPasswordResetEmail(to, resetLink);
      }
      console.log(`Email envoyé avec succès pour ${jobName}`);
    } catch (err) {
      console.error('Erreur lors de l\'envoi direct de l\'email:', err);
    }
  });
};

module.exports = {
  emailQueue: null,
  addEmailJob
};
