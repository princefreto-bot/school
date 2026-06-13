// ============================================================
// ROUTES DOCUMENTS — Numérisation
// ============================================================
const router = require('express').Router();
const { authenticateToken, requireSchoolAdmin } = require('../middleware/auth');
const {
    scanAndUploadDocument,
    getStudentDocuments,
    deleteDocument
} = require('../controllers/documentController');

// Seul le personnel d'établissement (directeur, surveillant, etc.) peut numériser
router.post('/scan', authenticateToken, requireSchoolAdmin, scanAndUploadDocument);

// Les parents ou l'administration peuvent lire les pièces numérisées d'un élève
router.get('/student/:studentId', authenticateToken, getStudentDocuments);

// Seule la direction peut supprimer un document
router.delete('/:id', authenticateToken, requireSchoolAdmin, deleteDocument);

module.exports = router;
