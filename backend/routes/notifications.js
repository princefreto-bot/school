const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const { sendNotification } = require('../controllers/notificationController');

router.post('/send', authenticateToken, sendNotification);

module.exports = router;
