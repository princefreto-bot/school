// ============================================================
// ROUTES — Élèves
// ============================================================
const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const { listStudents, linkStudentToParent, unlinkStudentFromParent } = require('../controllers/studentsController');

// Liste publique pour sélection (authentification requise quand même)
router.get('/', authenticateToken, listStudents);

// Lier un élève à un parent
router.post('/link', authenticateToken, linkStudentToParent);

// Retirer le lien
router.delete('/unlink/:studentId', authenticateToken, unlinkStudentFromParent);

module.exports = router;
