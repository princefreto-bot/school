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

// La secrétaire numérise aussi les dossiers élèves (sans les droits admin complets).
const requireSchoolAdminOrSecretaire = (req, res, next) => {
    if (req.user && req.user.role === 'secretaire') return next();
    return requireSchoolAdmin(req, res, next);
};

// Seul le personnel d'établissement (directeur, surveillant, secrétaire, etc.) peut numériser
router.post('/scan', authenticateToken, requireSchoolAdminOrSecretaire, scanAndUploadDocument);

// Les parents ou l'administration peuvent lire les pièces numérisées d'un élève
router.get('/student/:studentId', authenticateToken, getStudentDocuments);

// Route sécurisée pour télécharger ou visionner un document spécifique
router.get('/file/:filename', authenticateToken, downloadDocumentFile);

// Seule la direction peut supprimer un document
router.delete('/:id', authenticateToken, requireSchoolAdmin, deleteDocument);

module.exports = router;
