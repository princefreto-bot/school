const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const {
    getDashboard,
    getPayments,
    getBadges,
    getActiveParentsCount,
} = require('../controllers/parentController');

// Routes protégées
router.use(authenticateToken);

router.get('/dashboard', getDashboard);
router.get('/payments/:studentId', getPayments);
router.get('/badges', getBadges);
router.get('/active-count', getActiveParentsCount);

module.exports = router;
