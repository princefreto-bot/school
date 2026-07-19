const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accountingController');
const { authenticateToken, requireSchool, requireSchoolAdmin } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireSchool);
router.use(requireSchoolAdmin);

router.get('/accounts', accountingController.getAccounts);
router.get('/entries', accountingController.getJournalEntries);
router.post('/expenses', accountingController.addExpense);
router.post('/expenses/upload-proof', accountingController.uploadExpenseProof);
router.get('/balance', accountingController.getBalance);
router.get('/bilan', accountingController.getBilan);
router.get('/compte-resultat', accountingController.getCompteResultat);

module.exports = router;
