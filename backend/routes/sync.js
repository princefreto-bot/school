// ============================================================
// ROUTES — Synchronisation
// ============================================================
const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const { syncFromFrontend } = require('../controllers/syncController');

// Route protégée : seuls les utilisateurs authentifiés (directeur/comptable) peuvent synchroniser
router.use(authenticateToken);
router.post('/', syncFromFrontend);

module.exports = router;
