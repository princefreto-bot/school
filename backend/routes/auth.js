// ============================================================
// ROUTES — Authentification
// ============================================================
const router = require('express').Router();
const { register, login, deleteSelfAccount, updatePushToken, registerSchoolRequest, verifySchoolEmail, resendVerificationEmail, requestPasswordReset, resetPassword } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/register-school-request', registerSchoolRequest);
router.post('/verify-school-email', verifySchoolEmail);
router.post('/resend-verification-email', resendVerificationEmail);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/update-push-token', authenticateToken, updatePushToken);
router.delete('/me', authenticateToken, deleteSelfAccount);

module.exports = router;
