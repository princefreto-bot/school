// ============================================================
// ROUTES — Admission Requests
// ============================================================
'use strict';
const router = require('express').Router();
const { authenticateToken, requireSchoolAdmin } = require('../middleware/auth');
const { submitAdmissionRequest, listAdmissionRequests, resolveAdmissionRequest } = require('../controllers/admissionController');

// Route publique pour soumettre une demande
router.post('/request', submitAdmissionRequest);

// Routes sécurisées pour l'administration de l'établissement
router.get('/list', authenticateToken, requireSchoolAdmin, listAdmissionRequests);
router.post('/resolve/:id', authenticateToken, requireSchoolAdmin, resolveAdmissionRequest);

module.exports = router;
