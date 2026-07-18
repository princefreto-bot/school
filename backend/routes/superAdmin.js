// ============================================================
// ROUTES SUPER ADMIN — Plateforme SaaS
// ============================================================
const router = require('express').Router();
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const {
    getAllSchools,
    createSchool,
    updateSchoolStatus,
    updateSchool,
    deleteSchool,
    getGlobalStats,
    impersonateSchool,
    approveSchool,
    getExpenses,
    addExpense,
    deleteExpense,
    getWithdrawals,
    approveWithdrawal,
    rejectWithdrawal,
    uploadWithdrawalAdminProof
} = require('../controllers/superAdminController');

const {
    getAllCreators,
    createCreator,
    deleteCreator,
    linkCreatorToSchool,
    unlinkCreatorFromSchool
} = require('../controllers/creatorController');

// Toutes ces routes sont protégées par le double middleware :
// 1. authenticateToken : vérifie le JWT
// 2. requireSuperAdmin : vérifie que le rôle est 'superadmin'

router.get('/stats', authenticateToken, requireSuperAdmin, getGlobalStats);
router.get('/schools', authenticateToken, requireSuperAdmin, getAllSchools);
router.post('/schools', authenticateToken, requireSuperAdmin, createSchool);
router.put('/schools/:id', authenticateToken, requireSuperAdmin, updateSchool);
router.patch('/schools/:id/status', authenticateToken, requireSuperAdmin, updateSchoolStatus);
router.patch('/schools/:id/approve', authenticateToken, requireSuperAdmin, approveSchool);
router.delete('/schools/:id', authenticateToken, requireSuperAdmin, deleteSchool);
router.post('/schools/:id/impersonate', authenticateToken, requireSuperAdmin, impersonateSchool);

// ── RÉSÉRVÉ SUPERADMIN : GESTION DES CRÉATEURS ──
router.get('/creators', authenticateToken, requireSuperAdmin, getAllCreators);
router.post('/creators', authenticateToken, requireSuperAdmin, createCreator);
router.delete('/creators/:id', authenticateToken, requireSuperAdmin, deleteCreator);
router.post('/creators/:id/link', authenticateToken, requireSuperAdmin, linkCreatorToSchool);
router.delete('/creators/:id/link/:schoolId', authenticateToken, requireSuperAdmin, unlinkCreatorFromSchool);

// ── RÉSÉRVÉ SUPERADMIN : GESTION DES DÉPENSES ──
router.get('/expenses', authenticateToken, requireSuperAdmin, getExpenses);
router.post('/expenses', authenticateToken, requireSuperAdmin, addExpense);
router.delete('/expenses/:id', authenticateToken, requireSuperAdmin, deleteExpense);

// ── RÉSÉRVÉ SUPERADMIN : RETRAITS DES ÉCOLES (RISTOURNES) ──
router.get('/withdrawals', authenticateToken, requireSuperAdmin, getWithdrawals);
router.patch('/withdrawals/:id/approve', authenticateToken, requireSuperAdmin, approveWithdrawal);
router.patch('/withdrawals/:id/reject', authenticateToken, requireSuperAdmin, rejectWithdrawal);
router.post('/withdrawals/upload-proof', authenticateToken, requireSuperAdmin, uploadWithdrawalAdminProof);

module.exports = router;
