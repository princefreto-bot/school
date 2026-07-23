const router = require('express').Router();
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const {
    getMyPayments,
    getSchoolPayments,
    getSuperadminPayments
} = require('../controllers/licensePaymentsController');

router.get('/mine', authenticateToken, getMyPayments);
router.get('/school', authenticateToken, getSchoolPayments);
router.get('/superadmin', authenticateToken, requireSuperAdmin, getSuperadminPayments);

module.exports = router;
