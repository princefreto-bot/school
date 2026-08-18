const router = require('express').Router();
const { authenticateToken, requireSchool, requireSchoolAdmin } = require('../middleware/auth');
const {
    getExpenseLabels,
    createExpenseLabel,
    deleteExpenseLabel,
    getStudentExpenses,
    createStudentExpense,
    deleteStudentExpense,
    payStudentExpense,
} = require('../controllers/studentExpensesController');

router.use(authenticateToken, requireSchool);

// Catalogue de libellés (Paramètres > Frais divers)
router.get('/expense-labels', getExpenseLabels);
router.post('/expense-labels', requireSchoolAdmin, createExpenseLabel);
router.delete('/expense-labels/:id', requireSchoolAdmin, deleteExpenseLabel);

// Dépenses d'un élève précis
router.get('/students/:studentId/expenses', getStudentExpenses);
router.post('/students/:studentId/expenses', requireSchoolAdmin, createStudentExpense);
router.delete('/students/:studentId/expenses/:expenseId', requireSchoolAdmin, deleteStudentExpense);
router.post('/students/:studentId/expenses/:expenseId/pay', requireSchoolAdmin, payStudentExpense);

module.exports = router;
