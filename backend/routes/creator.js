// ============================================================
// ROUTES CREATOR — Espace Créateurs
// ============================================================
const router = require('express').Router();
const { authenticateToken, requireCreator } = require('../middleware/auth');
const { getCreatorDashboard } = require('../controllers/creatorController');

router.get('/dashboard', authenticateToken, requireCreator, getCreatorDashboard);

module.exports = router;
