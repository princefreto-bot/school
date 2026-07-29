const router = require('express').Router();
const { getPersonnel, createPersonnel, updatePersonnel, getMyProfile, getTeachingMode, deletePersonnel } = require('../controllers/personnelController');
const { authenticateToken } = require('../middleware/auth');

router.get('/me/teaching-mode', authenticateToken, getTeachingMode);
router.get('/me', authenticateToken, getMyProfile);
router.get('/', authenticateToken, getPersonnel);
router.post('/', authenticateToken, createPersonnel);
router.patch('/:id', authenticateToken, updatePersonnel);
router.delete('/:id', authenticateToken, deletePersonnel);

module.exports = router;
