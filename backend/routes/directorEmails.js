const router = require('express').Router();
const { unsubscribe } = require('../controllers/directorEmailController');

// Public : lien de desabonnement present en pied de chaque e-mail directeur.
router.get('/unsubscribe', unsubscribe);

module.exports = router;
