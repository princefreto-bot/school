const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const {
    getDashboard,
    getPayments,
    getBadges,
    getPresences,
    getActiveParentsCount,
    getAllParents,
    getParentById,
    adminDeleteAccount,
    getParentData,
    getLicensePricing,
    activateLicense,
    activateLicenseAuto,
    getAcademicYears
} = require('../controllers/parentController');
const {
    createLicenseCheckoutSession,
    checkLicenseCheckoutSessionStatus,
} = require('../controllers/saspayLicenseController');

// Routes protégées
router.use(authenticateToken);

router.get('/years', getAcademicYears);
router.get('/data', getParentData);  // Sync temps réel pour parent
router.get('/dashboard', getDashboard);
router.get('/payments/:studentId', getPayments);
router.get('/presences/:studentId', getPresences);
router.get('/badges', getBadges);
router.get('/active-count', getActiveParentsCount);
router.get('/list', getAllParents);
router.get('/license-pricing', getLicensePricing);
router.post('/activate-license', activateLicense);
router.post('/activate-license-auto', activateLicenseAuto);
router.post('/license-checkout-session', createLicenseCheckoutSession);
router.get('/license-checkout-session/:id/status', checkLicenseCheckoutSessionStatus);
router.get('/:id', getParentById);
router.delete('/:parentId', adminDeleteAccount);

module.exports = router;
