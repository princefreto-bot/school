const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const { getPlatformNoticeForUser } = require('../controllers/platformNoticeController');

router.get('/', authenticateToken, getPlatformNoticeForUser);

module.exports = router;
