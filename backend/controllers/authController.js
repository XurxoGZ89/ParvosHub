const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

/**
 * Login de usuario
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Buscar usuario por username
    const userResult = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = userResult.rows[0];

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token JWT (sin expiración para cookies de sesión)
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET
    );

    // Guardar sesión en base de datos (expira en 1 año por defecto, pero se eliminará al hacer logout)
    await db.query(
      'INSERT INTO user_sessions (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'1 year\')',
      [user.id, token]
    );

    // Devolver token y datos del usuario
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

/**
 * Logout de usuario
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    const token = req.token;

    // Eliminar sesión de la base de datos
    await db.query('DELETE FROM user_sessions WHERE token = $1', [token]);

    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

/**
 * Verificar token actual
 * GET /api/auth/verify
 */
const verifyToken = async (req, res) => {
  try {
    // Si llegó aquí, el middleware authenticateToken ya validó el token
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        fullName: req.user.full_name
      }
    });
  } catch (error) {
    console.error('Error en verify:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

/**
 * Obtener perfil del usuario autenticado
 * GET /api/auth/profile
 */
const getProfile = async (req, res) => {
  try {
    // Obtener cuentas del usuario
    const accountsResult = await db.query(
      'SELECT id, account_name, account_type, is_active FROM user_accounts WHERE user_id = $1 AND is_active = true',
      [req.user.id]
    );

    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        fullName: req.user.full_name
      },
      accounts: accountsResult.rows
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

module.exports = {
  login,
  logout,
  verifyToken,
  getProfile
};
