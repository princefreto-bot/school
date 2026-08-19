const router = require('express').Router();
const { authenticateToken, requireSchoolAdmin } = require('../middleware/auth');
const { sendNotification, broadcastAnnouncement } = require('../controllers/notificationController');

// Réservé au personnel de direction : sans ce contrôle, n'importe quel compte parent pouvait
// diffuser une annonce à toute l'école ou injecter un message dans le fil "administration"
// d'une autre famille (cf. audit sécurité 2026-08-19).
router.post('/send', authenticateToken, requireSchoolAdmin, sendNotification);

// POST /api/notifications/broadcast-announcement — Broadcast à tous les parents
router.post('/broadcast-announcement', authenticateToken, requireSchoolAdmin, broadcastAnnouncement);

module.exports = router;
