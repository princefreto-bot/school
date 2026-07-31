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

// Écriture réservée à la direction/administration — la secrétaire y a aussi accès
// car elle compose l'emploi du temps de tout le personnel.
const requireSchoolAdminOrSecretaire = (req, res, next) => {
    if (req.user && req.user.role === 'secretaire') return next();
    return requireSchoolAdmin(req, res, next);
};
router.post('/', requireSchoolAdminOrSecretaire, timetableController.createSlot);
router.delete('/:id', requireSchoolAdminOrSecretaire, timetableController.deleteSlot);

module.exports = router;
