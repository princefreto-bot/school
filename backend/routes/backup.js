const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { authenticateToken, requireSchool, requireFinanceAdmin } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireSchool);
router.use(requireFinanceAdmin);

router.get('/', backupController.listBackups);
router.post('/run', backupController.runBackupNow);

module.exports = router;
