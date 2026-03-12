// ============================================================
// ROUTES — Synchronisation
// ============================================================
const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const { syncFromFrontend, syncToFrontend, clearPresences, clearActivityLogs, clearStudents } = require('../controllers/syncController');

// Route protégée : seuls les utilisateurs authentifiés (directeur/comptable) peuvent synchroniser
router.use(authenticateToken);
router.post('/', syncFromFrontend);
router.get('/', syncToFrontend);
router.delete('/presences', clearPresences);
router.delete('/logs', clearActivityLogs);
router.delete('/students', clearStudents);

module.exports = router;
