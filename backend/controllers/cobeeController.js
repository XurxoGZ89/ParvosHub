const db = require('../db');

/**
 * Cobee (retribución flexible)
 * - Dos subcuentas de saldo restringido: "Cobee Comida" y "Cobee Transporte".
 * - La carga mensual se registra automáticamente como ingreso en cada subcuenta
 *   el día de carga (por defecto el 15) de los meses marcados.
 * - El periodo va del día de carga al día anterior del mes siguiente; el saldo
 *   que no se usa se pierde (el saldo se calcula por periodo en el frontend).
 * - Cada carga generada se anota en user_cobee_cargas para no duplicarla y para
 *   no volver a crearla si el usuario la borra a mano.
 */

const SUBCUENTAS = [
  { key: 'comida', account: 'Cobee Comida', label: 'Comida' },
  { key: 'transporte', account: 'Cobee Transporte', label: 'Transporte' }
];

const pad = (n) => String(n).padStart(2, '0');

const parseMeses = (meses) => {
  let arr = meses;
  if (typeof arr === 'string') {
    try { arr = JSON.parse(arr); } catch (e) { arr = null; }
  }
  if (!Array.isArray(arr) || arr.length !== 12) {
    return [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  }
  return arr.map(v => (v ? 1 : 0));
};

const formatConfig = (row) => ({
  enabled: true,
  activo: row.activo,
  comida: parseFloat(row.comida) || 0,
  transporte: parseFloat(row.transporte) || 0,
  meses: parseMeses(row.meses),
  dia_carga: row.dia_carga || 1,
  fecha_inicio: row.fecha_inicio instanceof Date
    ? `${row.fecha_inicio.getFullYear()}-${pad(row.fecha_inicio.getMonth() + 1)}`
    : String(row.fecha_inicio).slice(0, 7)
});

/**
 * Genera las cargas mensuales pendientes (desde fecha_inicio hasta hoy).
 * Es idempotente: se puede llamar en cada petición.
 */
async function ensureCobeeLoads(userId) {
  const cfgResult = await db.query('SELECT * FROM user_cobee_config WHERE user_id = $1', [userId]);
  if (cfgResult.rows.length === 0) return 0;
  const cfg = formatConfig(cfgResult.rows[0]);
  if (!cfg.activo) return 0;

  const [startYear, startMonth] = cfg.fecha_inicio.split('-').map(Number);
  const dia = Math.min(Math.max(parseInt(cfg.dia_carga, 10) || 1, 1), 28);
  const hoy = new Date();
  const hoyKey = `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`;

  let creadas = 0;
  let y = startYear;
  let m = startMonth;
  // Límite de seguridad: como mucho 36 meses hacia atrás
  let guard = 0;
  while (guard++ < 36) {
    const mesKey = `${y}-${pad(m)}`;
    const fecha = `${mesKey}-${pad(dia)}`;
    if (fecha > hoyKey) break;

    if (cfg.meses[m - 1]) {
      for (const sub of SUBCUENTAS) {
        const importe = cfg[sub.key];
        if (!importe || importe <= 0) continue;

        // Reservar la carga (evita duplicados incluso con peticiones concurrentes)
        const claim = await db.query(
          `INSERT INTO user_cobee_cargas (user_id, mes, subcuenta)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, mes, subcuenta) DO NOTHING
           RETURNING id`,
          [userId, mesKey, sub.key]
        );
        if (claim.rows.length === 0) continue;

        const op = await db.query(
          `INSERT INTO user_operations
           (user_id, account_name, date, type, amount, description, category)
           VALUES ($1, $2, $3, 'income', $4, $5, '')
           RETURNING id`,
          [userId, sub.account, fecha, importe, `Carga Cobee · ${sub.label}`]
        );
        await db.query('UPDATE user_cobee_cargas SET operation_id = $1 WHERE id = $2', [op.rows[0].id, claim.rows[0].id]);
        creadas++;
      }
    }

    m++;
    if (m > 12) { m = 1; y++; }
  }

  if (creadas > 0) {
    console.log(`Cobee: ${creadas} carga(s) automática(s) creada(s) para usuario ${userId}`);
  }
  return creadas;
}

/**
 * GET /api/user/cobee
 */
exports.getCobeeConfig = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM user_cobee_config WHERE user_id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.json({ enabled: false });
    }
    res.json(formatConfig(result.rows[0]));
  } catch (error) {
    console.error('Error al obtener configuración Cobee:', error);
    res.status(500).json({ error: 'Error al obtener configuración Cobee', details: error.message });
  }
};

/**
 * PUT /api/user/cobee
 * Body: { comida, transporte, meses: [12 x 0/1], fecha_inicio: 'YYYY-MM', activo }
 * Los cambios de importe se aplican a las cargas que aún no se han generado.
 */
exports.updateCobeeConfig = async (req, res) => {
  try {
    const userId = req.user.id;
    const comida = parseFloat(req.body.comida);
    const transporte = parseFloat(req.body.transporte);
    const meses = parseMeses(req.body.meses);
    const activo = req.body.activo !== false;
    const fechaInicio = req.body.fecha_inicio;
    const diaCarga = parseInt(req.body.dia_carga, 10) || 15;

    if (isNaN(comida) || comida < 0 || isNaN(transporte) || transporte < 0) {
      return res.status(400).json({ error: 'Los importes deben ser números positivos' });
    }
    if (diaCarga < 1 || diaCarga > 28) {
      return res.status(400).json({ error: 'El día de carga debe estar entre 1 y 28' });
    }
    if (!/^\d{4}-\d{2}$/.test(fechaInicio || '')) {
      return res.status(400).json({ error: 'fecha_inicio debe tener formato YYYY-MM' });
    }

    const result = await db.query(
      `INSERT INTO user_cobee_config (user_id, comida, transporte, meses, fecha_inicio, activo, dia_carga, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         comida = EXCLUDED.comida,
         transporte = EXCLUDED.transporte,
         meses = EXCLUDED.meses,
         fecha_inicio = EXCLUDED.fecha_inicio,
         activo = EXCLUDED.activo,
         dia_carga = EXCLUDED.dia_carga,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, comida, transporte, JSON.stringify(meses), `${fechaInicio}-01`, activo, diaCarga]
    );

    await ensureCobeeLoads(userId);
    res.json(formatConfig(result.rows[0]));
  } catch (error) {
    console.error('Error al guardar configuración Cobee:', error);
    res.status(500).json({ error: 'Error al guardar configuración Cobee', details: error.message });
  }
};

exports.ensureCobeeLoads = ensureCobeeLoads;
exports.COBEE_ACCOUNTS = SUBCUENTAS.map(s => s.account);
