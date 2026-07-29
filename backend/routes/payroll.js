const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { authenticateToken, requireSchool, requireSchoolAdmin } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireSchool);

// ── Libre-service salarié (tout membre authentifié de l'établissement) ──
// Doit rester AVANT le verrou requireSchoolAdmin ci-dessous.
router.get('/self/roster', payrollController.getSelfRoster);
router.get('/self/payslips/mine', payrollController.getMySelfPayslips);
router.post('/self/payslips', payrollController.getSelfPayslips);

// ── Espace administrateur (direction / comptabilité) ──
router.use(requireSchoolAdmin);

router.get('/config', payrollController.getConfig);
router.get('/staff', payrollController.getStaffSalaries);
router.post('/staff/:personnelId/salary', payrollController.setStaffSalary);
router.patch('/staff/:personnelId/paie', payrollController.setStaffPaieInfo);
router.get('/staff/:personnelId/missed-hours-suggestion', payrollController.getMissedHoursSuggestion);
router.post('/payslips', payrollController.generatePayslip);
router.get('/payslips', payrollController.getPayslips);

module.exports = router;
