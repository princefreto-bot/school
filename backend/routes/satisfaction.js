const router = require('express').Router();
const { authenticateToken, requireSchool, requireSchoolAdmin } = require('../middleware/auth');
const { submitSatisfaction, getMySatisfaction, getSatisfactionSummary } = require('../controllers/satisfactionController');

router.use(authenticateToken);
router.use(requireSchool);

// Parent : soumettre / consulter sa propre note du mois
router.post('/', submitSatisfaction);
router.get('/mine', getMySatisfaction);

// Direction : vue d'ensemble (score NPS, tendance, commentaires)
router.get('/summary', requireSchoolAdmin, getSatisfactionSummary);

module.exports = router;
