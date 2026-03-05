const router = require('express').Router();
const multer = require('multer');
const { getConversations, getMessages, sendMessage, uploadImage } = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/conversations', authenticateToken, getConversations);
router.get('/messages/:conversationId', authenticateToken, getMessages);
router.post('/send', authenticateToken, sendMessage);
router.post('/upload', authenticateToken, upload.single('image'), uploadImage);

module.exports = router;
