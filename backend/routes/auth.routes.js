const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateLogin } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// Rutas públicas
router.post('/login', validateLogin, authController.login);

// Rutas protegidas (requieren autenticación)
router.post('/logout', authenticateToken, authController.logout);
router.get('/verify', authenticateToken, authController.verifyToken);
router.get('/profile', authenticateToken, authController.getProfile);

module.exports = router;
