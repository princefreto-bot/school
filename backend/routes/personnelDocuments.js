const router = require('express').Router();
const controller = require('../controllers/personnelDocumentController');
const { authenticateToken } = require('../middleware/auth');

router.post('/scan', authenticateToken, controller.scanAndUploadDocument);
router.get('/personnel/:personnelId', authenticateToken, controller.getPersonnelDocuments);
router.get('/file/:filename', authenticateToken, controller.downloadDocumentFile);
router.delete('/:id', authenticateToken, controller.deleteDocument);

module.exports = router;
