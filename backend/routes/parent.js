const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const {
    getDashboard,
    getPayments,
    getBadges,
    getActiveParentsCount,
    getAllParents,
    adminDeleteAccount
} = require('../controllers/parentController');

// Routes protégées
router.use(authenticateToken);

router.get('/dashboard', getDashboard);
router.get('/payments/:studentId', getPayments);
router.get('/badges', getBadges);
router.get('/active-count', getActiveParentsCount);
router.get('/list', getAllParents);
router.delete('/:parentId', adminDeleteAccount);

module.exports = router;
