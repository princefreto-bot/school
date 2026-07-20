const router = require('express').Router();
const { getPublicSettings, getReminderSettings, updateReminderSettings } = require('../controllers/settingsController');
const { uploadSchoolAsset, removeSchoolAsset } = require('../controllers/photoController');
const { authenticateToken, requireSchool, requireSchoolAdmin } = require('../middleware/auth');

// Route publique (pas d'authenticateToken ici)
router.get('/', getPublicSettings);

// Route privée pour téléverser un asset de configuration de l'école (logo, cachet, sceau, signature)
router.post('/upload-asset', authenticateToken, uploadSchoolAsset);

// Route privée pour supprimer définitivement un asset (Storage + DB null)
router.delete('/remove-asset', authenticateToken, removeSchoolAsset);

// Alertes automatiques de retard de paiement
router.get('/reminders', authenticateToken, requireSchool, requireSchoolAdmin, getReminderSettings);
router.patch('/reminders', authenticateToken, requireSchool, requireSchoolAdmin, updateReminderSettings);

module.exports = router;
