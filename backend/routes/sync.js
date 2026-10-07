// ============================================================
// ROUTES — Synchronisation
// ============================================================
const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const { syncFromFrontend, syncToFrontend, getYearArchive, deleteMatiere, deleteClasseMatiere, deleteNote, deletePayment, deleteStudent, deleteAcademicYear } = require('../controllers/syncController');

// Route protégée : seuls les utilisateurs authentifiés (directeur/comptable) peuvent synchroniser
router.use(authenticateToken);
router.post('/', syncFromFrontend);
router.get('/', syncToFrontend);
router.get('/archive', getYearArchive);

// Deletions individuelles pour académique
router.delete('/matiere/:id', deleteMatiere);
router.delete('/classe-matiere/:id', deleteClasseMatiere);
router.delete('/note/:id', deleteNote);
router.delete('/payment/:id', deletePayment);
router.delete('/student/:id', deleteStudent);
router.delete('/academic-year/:id', deleteAcademicYear);
module.exports = router;
