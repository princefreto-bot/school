// Fallback asynchrone direct sans nécessiter Redis / BullMQ
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');

// Fonction pour envoyer un email. IMPORTANT : on attend réellement l'envoi et on laisse
// toute erreur remonter à l'appelant — auparavant, `setImmediate` détachait l'envoi de la
// réponse HTTP, donc l'API répondait "code envoyé" avant même que l'appel à Resend n'ait eu
// lieu, et un échec (clé API, domaine non vérifié, etc.) n'était visible que dans les logs
// serveur pendant que l'utilisateur recevait un faux succès.
const addEmailJob = async (jobName, emailData) => {
  console.log(`[Mailer] Envoi de l'email pour le job ${jobName} vers:`, emailData.to);

  if (jobName === 'send-verification') {
    const { to, schoolName, code } = emailData;
    await sendVerificationEmail(to, schoolName, code);
  } else if (jobName === 'send-password-reset') {
    const { to, resetLink } = emailData;
    await sendPasswordResetEmail(to, resetLink);
  }

  console.log(`[Mailer] Email envoyé avec succès pour ${jobName}`);
};

module.exports = {
  emailQueue: null,
  addEmailJob
};
