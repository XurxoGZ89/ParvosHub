const { body, validationResult } = require('express-validator');

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * Reglas de validación para login
 */
const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('El usuario es requerido')
    .isLength({ min: 3 })
    .withMessage('El usuario debe tener al menos 3 caracteres'),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  handleValidationErrors
];

/**
 * Reglas de validación para operaciones de usuario
 */
const validateUserOperation = [
  body('date')
    .notEmpty()
    .withMessage('La fecha es requerida')
    .isISO8601()
    .withMessage('Formato de fecha inválido'),
  body('type')
    .notEmpty()
    .withMessage('El tipo es requerido')
    .isIn(['income', 'expense', 'savings', 'savings_withdrawal'])
    .withMessage('Tipo de operación inválido'),
  body('amount')
    .notEmpty()
    .withMessage('La cantidad es requerida')
    .isFloat({ min: 0.01 })
    .withMessage('La cantidad debe ser mayor a 0'),
  body('category')
    .optional()
    .trim(),
  body('description')
    .optional()
    .trim(),
  body('account_id')
    .optional()
    .isInt()
    .withMessage('ID de cuenta inválido'),
  handleValidationErrors
];

/**
 * Reglas de validación para presupuestos
 */
const validateBudget = [
  body('month')
    .notEmpty()
    .withMessage('El mes es requerido')
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('Formato de mes inválido (debe ser YYYY-MM)'),
  body('category')
    .notEmpty()
    .withMessage('La categoría es requerida')
    .trim(),
  body('amount')
    .notEmpty()
    .withMessage('La cantidad es requerida')
    .isFloat({ min: 0 })
    .withMessage('La cantidad debe ser mayor o igual a 0'),
  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateUserOperation,
  validateBudget,
  handleValidationErrors
};
