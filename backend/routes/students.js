// ============================================================
// ROUTE — Upload photo passeport d'un élève
// POST /api/students/upload-photo/:studentId
// ============================================================
'use strict';
const router = require('express').Router();
const { authenticateToken, requireSchoolAdmin } = require('../middleware/auth');
const { listStudents, listStudentsByYear, linkStudentToParent, unlinkStudentFromParent, countStudents, promoteStudents } = require('../controllers/studentsController');
const { uploadStudentPhoto } = require('../controllers/photoController');

// Routes existantes
router.get('/', authenticateToken, listStudents);
router.get('/count', authenticateToken, countStudents);
router.post('/link', authenticateToken, linkStudentToParent);
router.delete('/unlink/:studentId', authenticateToken, unlinkStudentFromParent);

// Rentrée / promotion des élèves vers une nouvelle année scolaire
router.get('/by-year', authenticateToken, requireSchoolAdmin, listStudentsByYear);
router.post('/promote', authenticateToken, requireSchoolAdmin, promoteStudents);

// ── Nouvelle route : Upload photo passeport ──────────────────
// Le payload JSON contient { imageBase64: "data:image/...;base64,..." }
router.post('/upload-photo/:studentId', authenticateToken, uploadStudentPhoto);

module.exports = router;
