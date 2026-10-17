const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Colección de cromos compartida (un único álbum para toda la casa).
// cantidad: 0 = falta, 1 = lo tengo, 2+ = lo tengo y hay (cantidad - 1) repetidos.
// Solo se guardan los cromos con cantidad > 0.

router.use(authenticateToken);

const COLECCION_POR_DEFECTO = 'liga-2026-27';
const ID_VALIDO = /^[a-z0-9-]{1,40}$/i;

// GET /api/cromos → { coleccion, cromos: { [cromoId]: cantidad } }
router.get('/', async (req, res) => {
  const coleccion = req.query.coleccion || COLECCION_POR_DEFECTO;
  try {
    const result = await db.query(
      'SELECT cromo_id, cantidad FROM cromos_coleccion WHERE coleccion = $1',
      [coleccion]
    );
    const cromos = {};
    result.rows.forEach((r) => { cromos[r.cromo_id] = r.cantidad; });
    const nombresDb = await db.query(
      'SELECT cromo_id, nombre FROM cromos_nombres WHERE coleccion = $1',
      [coleccion]
    );
    const nombres = {};
    nombresDb.rows.forEach((r) => { nombres[r.cromo_id] = r.nombre; });
    const retiradosDb = await db.query(
      'SELECT cromo_id, retirado FROM cromos_retirados WHERE coleccion = $1',
      [coleccion]
    );
    const retirados = {};
    retiradosDb.rows.forEach((r) => { retirados[r.cromo_id] = r.retirado; });
    res.json({ coleccion, cromos, nombres, retirados });
  } catch (err) {
    console.error('Error al obtener cromos:', err);
    res.status(500).json({ error: 'Error al obtener los cromos' });
  }
});

// PUT /api/cromos/:cromoId/retirado  body: { retirado: true | false | null, coleccion? }
// true = retirar el cromo, false = restaurarlo (aunque el checklist lo dé por retirado),
// null = volver al estado que marca el checklist.
router.put('/:cromoId/retirado', async (req, res) => {
  const { cromoId } = req.params;
  const coleccion = req.body.coleccion || COLECCION_POR_DEFECTO;
  const { retirado } = req.body;

  if (!ID_VALIDO.test(cromoId) || !ID_VALIDO.test(coleccion)) {
    return res.status(400).json({ error: 'Identificador de cromo no válido' });
  }
  if (retirado !== true && retirado !== false && retirado !== null) {
    return res.status(400).json({ error: 'Valor de retirado no válido' });
  }

  try {
    if (retirado === null) {
      await db.query(
        'DELETE FROM cromos_retirados WHERE coleccion = $1 AND cromo_id = $2',
        [coleccion, cromoId]
      );
    } else {
      await db.query(
        `INSERT INTO cromos_retirados (coleccion, cromo_id, retirado, updated_by, updated_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (coleccion, cromo_id)
         DO UPDATE SET retirado = EXCLUDED.retirado, updated_by = EXCLUDED.updated_by, updated_at = CURRENT_TIMESTAMP`,
        [coleccion, cromoId, retirado, req.user?.id || null]
      );
    }
    res.json({ cromoId, retirado });
  } catch (err) {
    console.error('Error al guardar cromo retirado:', err);
    res.status(500).json({ error: 'Error al guardar el cambio' });
  }
});

// PUT /api/cromos/:cromoId/nombre  body: { nombre, coleccion? }
// Cambia el nombre que se muestra de un cromo. Un nombre vacío restaura el original del checklist.
router.put('/:cromoId/nombre', async (req, res) => {
  const { cromoId } = req.params;
  const coleccion = req.body.coleccion || COLECCION_POR_DEFECTO;
  const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';

  if (!ID_VALIDO.test(cromoId) || !ID_VALIDO.test(coleccion)) {
    return res.status(400).json({ error: 'Identificador de cromo no válido' });
  }
  if (nombre.length > 80) {
    return res.status(400).json({ error: 'El nombre es demasiado largo (máx. 80)' });
  }

  try {
    if (!nombre) {
      await db.query(
        'DELETE FROM cromos_nombres WHERE coleccion = $1 AND cromo_id = $2',
        [coleccion, cromoId]
      );
    } else {
      await db.query(
        `INSERT INTO cromos_nombres (coleccion, cromo_id, nombre, updated_by, updated_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (coleccion, cromo_id)
         DO UPDATE SET nombre = EXCLUDED.nombre, updated_by = EXCLUDED.updated_by, updated_at = CURRENT_TIMESTAMP`,
        [coleccion, cromoId, nombre, req.user?.id || null]
      );
    }
    res.json({ cromoId, nombre });
  } catch (err) {
    console.error('Error al guardar nombre de cromo:', err);
    res.status(500).json({ error: 'Error al guardar el nombre' });
  }
});

// PUT /api/cromos/:cromoId  body: { cantidad, coleccion? }
router.put('/:cromoId', async (req, res) => {
  const { cromoId } = req.params;
  const coleccion = req.body.coleccion || COLECCION_POR_DEFECTO;
  const cantidad = Number(req.body.cantidad);

  if (!ID_VALIDO.test(cromoId) || !ID_VALIDO.test(coleccion)) {
    return res.status(400).json({ error: 'Identificador de cromo no válido' });
  }
  if (!Number.isInteger(cantidad) || cantidad < 0 || cantidad > 99) {
    return res.status(400).json({ error: 'Cantidad no válida (0-99)' });
  }

  try {
    if (cantidad === 0) {
      await db.query(
        'DELETE FROM cromos_coleccion WHERE coleccion = $1 AND cromo_id = $2',
        [coleccion, cromoId]
      );
    } else {
      await db.query(
        `INSERT INTO cromos_coleccion (coleccion, cromo_id, cantidad, updated_by, updated_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (coleccion, cromo_id)
         DO UPDATE SET cantidad = EXCLUDED.cantidad, updated_by = EXCLUDED.updated_by, updated_at = CURRENT_TIMESTAMP`,
        [coleccion, cromoId, cantidad, req.user?.id || null]
      );
    }
    res.json({ cromoId, cantidad });
  } catch (err) {
    console.error('Error al guardar cromo:', err);
    res.status(500).json({ error: 'Error al guardar el cromo' });
  }
});

module.exports = router;
