// ============================================================
// ROUTES DOCUMENTS — Numérisation
// ============================================================
const router = require('express').Router();
const { authenticateToken, requireSchoolAdmin } = require('../middleware/auth');
const {
    scanAndUploadDocument,
    getStudentDocuments,
    deleteDocument,
    downloadDocumentFile
} = require('../controllers/documentController');

// Seul le personnel d'établissement (directeur, surveillant, etc.) peut numériser
router.post('/scan', authenticateToken, requireSchoolAdmin, scanAndUploadDocument);

// Les parents ou l'administration peuvent lire les pièces numérisées d'un élève
router.get('/student/:studentId', authenticateToken, getStudentDocuments);

// Route sécurisée pour télécharger ou visionner un document spécifique
router.get('/file/:filename', authenticateToken, downloadDocumentFile);

// Seule la direction peut supprimer un document
router.delete('/:id', authenticateToken, requireSchoolAdmin, deleteDocument);

module.exports = router;
