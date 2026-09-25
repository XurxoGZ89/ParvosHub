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
    res.json({ coleccion, cromos });
  } catch (err) {
    console.error('Error al obtener cromos:', err);
    res.status(500).json({ error: 'Error al obtener los cromos' });
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
