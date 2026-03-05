// ============================================================
// ROUTES — Élèves
// ============================================================
const router = require('express').Router();
const auth = require('../middleware/auth');
const { listStudents, linkStudentToParent } = require('../controllers/studentsController');

// Liste publique pour sélection (authentification requise quand même)
router.get('/', auth, listStudents);

// Lier un élève à un parent
router.post('/link', auth, linkStudentToParent);

module.exports = router;
