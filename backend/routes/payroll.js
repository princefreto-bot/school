const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { authenticateToken, requireSchool, requireSchoolAdmin } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireSchool);
router.use(requireSchoolAdmin);

router.get('/config', payrollController.getConfig);
router.get('/staff', payrollController.getStaffSalaries);
router.post('/staff/:personnelId/salary', payrollController.setStaffSalary);
router.post('/payslips', payrollController.generatePayslip);
router.get('/payslips', payrollController.getPayslips);

module.exports = router;
