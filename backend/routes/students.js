// ============================================================
// ROUTES — Élèves
// ============================================================
const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const { listStudents, linkStudentToParent, unlinkStudentFromParent, countStudents } = require('../controllers/studentsController');

// Liste publique pour sélection (authentification requise quand même)
router.get('/', authenticateToken, listStudents);
router.get('/count', authenticateToken, countStudents);

// Lier un élève à un parent
router.post('/link', authenticateToken, linkStudentToParent);

// Retirer le lien
router.delete('/unlink/:studentId', authenticateToken, unlinkStudentFromParent);

module.exports = router;
