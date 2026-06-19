const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Configuration Redis pour BullMQ
const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Requis par BullMQ
});

// File d'attente pour les emails
const emailQueue = new Queue('email-queue', { connection });

// Fonction pour ajouter un email à la file d'attente
const addEmailJob = async (jobName, emailData) => {
  try {
    await emailQueue.add(jobName, emailData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
    console.log(`Job email ${jobName} ajouté pour:`, emailData.to);
  } catch (err) {
    console.error('Erreur lors de l\'ajout du job email:', err);
  }
};

// Importer le service d'envoi (soit mailer.js soit emailService.js, adapté selon l'implémentation existante)
// Note: Ici nous utilisons un bloc try/catch pour le worker. L'import réel doit être aligné avec la structure
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer'); 

const emailWorker = new Worker('email-queue', async job => {
  if (job.name === 'send-verification') {
    const { to, schoolName, code } = job.data;
    console.log(`Traitement de l'envoi d'email de vérification à ${to}`);
    await sendVerificationEmail(to, schoolName, code);
  } else if (job.name === 'send-password-reset') {
    const { to, resetLink } = job.data;
    console.log(`Traitement de l'envoi d'email de reset à ${to}`);
    await sendPasswordResetEmail(to, resetLink);
  }
}, { connection });

emailWorker.on('completed', job => {
  console.log(`Job ${job.id} terminé avec succès`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} a échoué avec l'erreur: ${err.message}`);
});

module.exports = {
  emailQueue,
  addEmailJob
};
