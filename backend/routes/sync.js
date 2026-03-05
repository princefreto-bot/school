// ============================================================
// ROUTES — Synchronisation
// ============================================================
const router = require('express').Router();
const { syncFromFrontend } = require('../controllers/syncController');

// Route publique (ou protégée par un secret admin si souhaité)
router.post('/', syncFromFrontend);

module.exports = router;
