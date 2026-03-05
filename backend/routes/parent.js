// ============================================================
// ROUTES — Espace Parent (protégées par JWT)
// ============================================================
const router = require('express').Router();
const auth = require('../middleware/auth');
const {
    getDashboard,
    getPayments,
    downloadReceipt,
    getBadges,
    getMessages,
} = require('../controllers/parentController');

// Toutes les routes parent nécessitent un token valide
router.use(auth);

router.get('/dashboard', getDashboard);
router.get('/payments/:studentId', getPayments);
router.get('/receipt/:receiptId', downloadReceipt);
router.get('/badges', getBadges);
router.get('/messages', getMessages);

module.exports = router;
