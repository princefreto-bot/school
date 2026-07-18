const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const { authenticateToken, requireSchool, requireSchoolAdmin } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireSchool);
router.use(requireSchoolAdmin);

router.get('/balance', withdrawalController.getBalance);
router.post('/request', withdrawalController.requestWithdrawal);
router.get('/history', withdrawalController.getHistory);
router.post('/upload-proof', withdrawalController.uploadProof);

module.exports = router;
