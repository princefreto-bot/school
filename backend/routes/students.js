// ============================================================
// ROUTES — Élèves
// ============================================================
const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const { listStudents, linkStudentToParent } = require('../controllers/studentsController');

// Liste publique pour sélection (authentification requise quand même)
router.get('/', authenticateToken, listStudents);

// Lier un élève à un parent
router.post('/link', authenticateToken, linkStudentToParent);

module.exports = router;
