const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { authenticateToken, requireSchool, requireSchoolAdmin } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireSchool);

// Lecture accessible à tout membre authentifié de l'école (admin, enseignant) —
// consulter un emploi du temps n'est pas sensible.
router.get('/', timetableController.getTimetable);
router.get('/mine', timetableController.getMyTimetable);

// Écriture réservée à la direction/administration.
router.post('/', requireSchoolAdmin, timetableController.createSlot);
router.delete('/:id', requireSchoolAdmin, timetableController.deleteSlot);

module.exports = router;
