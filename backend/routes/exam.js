const express = require('express');
const router = express.Router();
const { authenticateToken, requireSchool } = require('../middleware/auth');
const examController = require('../controllers/examController');

router.use(authenticateToken);
router.use(requireSchool);

router.get('/sessions', examController.getSessions);
router.post('/sessions', examController.createSession);
router.delete('/sessions/:id', examController.deleteSession);

router.get('/notes', examController.getNotes);
router.post('/notes', examController.saveNotes);

module.exports = router;
