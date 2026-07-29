const router = require('express').Router();
const staffAbsencesController = require('../controllers/staffAbsencesController');
const { authenticateToken, requireSchool } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireSchool);

// Doit rester avant toute restriction admin — tout membre du personnel
// consulte ses propres absences via son propre JWT.
router.get('/mine', staffAbsencesController.getMyAbsences);

router.get('/', staffAbsencesController.getStaffAbsences);
router.post('/', staffAbsencesController.createStaffAbsence);
router.delete('/:id', staffAbsencesController.deleteStaffAbsence);

module.exports = router;
