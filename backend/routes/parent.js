const router = require('express').Router();
const { authenticateToken, requireSchoolAdmin } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');
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
// Roster/liste des parents réservé à la direction — sinon tout compte parent authentifié
// pouvait lister les noms/téléphones de toutes les autres familles de l'école.
router.get('/active-count', requireSchoolAdmin, getActiveParentsCount);
router.get('/list', requireSchoolAdmin, getAllParents);
router.get('/license-pricing', getLicensePricing);
router.post('/activate-license', activateLicense);
router.post('/activate-license-auto', activateLicenseAuto);
router.post('/license-checkout-session', paymentLimiter, createLicenseCheckoutSession);
router.get('/license-checkout-session/:id/status', checkLicenseCheckoutSessionStatus);
router.get('/:id', getParentById);
router.delete('/:parentId', adminDeleteAccount);

module.exports = router;
