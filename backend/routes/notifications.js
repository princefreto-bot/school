const router = require('express').Router();
const { authenticateToken, requireSchoolAdmin, requireRoles } = require('../middleware/auth');
const { sendNotification, broadcastAnnouncement } = require('../controllers/notificationController');

// Réservé au personnel : sans ce contrôle, n'importe quel compte parent pouvait
// diffuser une annonce à toute l'école ou injecter un message dans le fil "administration"
// d'une autre famille (cf. audit sécurité 2026-08-19). Les surveillants en ont besoin :
// les scans d'entrée/sortie préviennent le parent de l'élève scanné.
router.post('/send', authenticateToken, requireRoles([
    'admin', 'directeur', 'directeur_general', 'comptable', 'proviseur', 'censeur', 'superviseur', 'surveillant',
]), sendNotification);

// POST /api/notifications/broadcast-announcement — Broadcast à tous les parents
router.post('/broadcast-announcement', authenticateToken, requireSchoolAdmin, broadcastAnnouncement);

module.exports = router;
