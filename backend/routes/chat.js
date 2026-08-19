const router = require('express').Router();
const multer = require('multer');
const { getConversations, getMessages, sendMessage, uploadImage, getUnreadCount, initiateConversation, deleteConversation } = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');

const ALLOWED_CHAT_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 }, // 8 Mo
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_CHAT_IMAGE_TYPES.has(file.mimetype)) {
            return cb(new Error('Type de fichier non autorisé. Formats acceptés : JPEG, PNG, WEBP, GIF.'));
        }
        cb(null, true);
    }
});

router.get('/conversations', authenticateToken, getConversations);
router.get('/messages/:conversationId', authenticateToken, getMessages);
router.get('/unread', authenticateToken, getUnreadCount);
router.post('/initiate', authenticateToken, initiateConversation);
router.post('/send', authenticateToken, sendMessage);
router.post('/upload', authenticateToken, upload.single('image'), uploadImage);
router.delete('/conversation/:id', authenticateToken, deleteConversation);

module.exports = router;
