const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Operaciones de usuario
router.get('/operations', userController.getUserOperations);
router.post('/operations', userController.createUserOperation);
router.put('/operations/:id', userController.updateUserOperation);
router.delete('/operations/:id', userController.deleteUserOperation);

// Cuentas de usuario
router.get('/accounts', userController.getUserAccounts);

// Presupuestos de usuario
router.get('/budgets', userController.getUserBudgets);
router.get('/budgets/:year/:month', userController.getUserBudgetsByMonth);
router.post('/budgets/:year/:month', userController.saveUserBudgets);

// Metas de ahorro de usuario
router.get('/goals', userController.getUserGoals);
router.post('/goals', userController.createUserGoal);
router.put('/goals/:id', userController.updateUserGoal);
router.delete('/goals/:id', userController.deleteUserGoal);

// Resúmenes
router.get('/dashboard-summary', userController.getUserDashboardSummary);
router.get('/summary/:month', userController.getUserMonthlySummary);
router.get('/summary/year/:year', userController.getUserAnnualSummary);
router.get('/total-savings', userController.getTotalSavings);

module.exports = router;
