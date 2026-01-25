const jwt = require('jsonwebtoken');
const db = require('../db');
const crypto = require('crypto');

// Generar JWT_SECRET si no está configurado (solo para desarrollo)
// En producción, DEBE estar configurado en las variables de entorno
let JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ CRÍTICO: JWT_SECRET no está configurado en producción');
    console.error('Configura JWT_SECRET en las variables de entorno de Render');
    // Generar uno para que el servidor al menos no falle
    JWT_SECRET = crypto.randomBytes(64).toString('hex');
    console.warn('⚠️  Se generó un JWT_SECRET temporal (los tokens serán inválidos después de reiniciar)');
  } else {
    JWT_SECRET = 'dev-secret-key-change-in-production';
    console.warn('⚠️  Usando JWT_SECRET por defecto (solo para desarrollo)');
  }
}

/**
 * Middleware para verificar el token JWT
 * Se añade a las rutas que requieren autenticación
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    // Verificar el token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verificar que la sesión existe en la base de datos
    const sessionResult = await db.query(
      'SELECT * FROM user_sessions WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ error: 'Sesión inválida o expirada' });
    }

    // Obtener datos del usuario
    const userResult = await db.query(
      'SELECT id, username, email, full_name FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Agregar información del usuario a la request
    req.user = userResult.rows[0];
    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Token expirado' });
    }
    console.error('Error en autenticación:', error);
    return res.status(500).json({ error: 'Error en la autenticación' });
  }
};

/**
 * Middleware opcional de autenticación
 * Agrega información del usuario si hay token, pero no falla si no lo hay
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userResult = await db.query(
      'SELECT id, username, email, full_name FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length > 0) {
      req.user = userResult.rows[0];
    }

    next();
  } catch (error) {
    // Si hay error, simplemente continuar sin usuario
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  JWT_SECRET
};
