
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint de prueba
app.get('/', (req, res) => {
  res.send('API de gastos familiares funcionando');
});

// Endpoint para agregar una operación
app.post('/operaciones', async (req, res) => {
  const { fecha, tipo, cantidad, concepto, categoria, usuario, cuenta } = req.body;
  if (!fecha || !tipo || !cantidad) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }
  try {
    const result = await db.query(
      'INSERT INTO operaciones (fecha, tipo, cantidad, info, categoria, usuario, cuenta) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [fecha, tipo, cantidad, concepto, categoria, usuario, cuenta]
    );
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    console.error('Error al insertar:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para obtener todas las operaciones (con filtros opcionales)
app.get('/operaciones', async (req, res) => {
  try {
    let query = 'SELECT * FROM operaciones WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (req.query.categoria) {
      query += ` AND categoria = $${paramIndex++}`;
      params.push(req.query.categoria);
    }
    if (req.query.tipo) {
      query += ` AND tipo = $${paramIndex++}`;
      params.push(req.query.tipo);
    }
    if (req.query.usuario) {
      query += ` AND usuario = $${paramIndex++}`;
      params.push(req.query.usuario);
    }
    if (req.query.cuenta) {
      query += ` AND cuenta = $${paramIndex++}`;
      params.push(req.query.cuenta);
    }
    query += ' ORDER BY fecha DESC';

    const result = await db.query(query, params);
    const cleanRows = result.rows.map(row => ({
      ...row,
      categoria: row.categoria ? row.categoria.replace(/\r|\n/g, '').trim() : '',
      concepto: row.info || '',
    }));
    res.json(cleanRows);
  } catch (err) {
    console.error('Error al obtener operaciones:', err);
    res.status(500).json({ error: err.message });
  }
});

// Eliminar una operación por id
app.delete('/operaciones/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM operaciones WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No encontrado' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error al eliminar:', err);
    res.status(500).json({ error: err.message });
  }
});

// Actualizar una operación por id
app.put('/operaciones/:id', async (req, res) => {
  const { id } = req.params;
  const { fecha, tipo, cantidad, concepto, categoria, usuario, cuenta } = req.body;
  try {
    const result = await db.query(
      'UPDATE operaciones SET fecha = $1, tipo = $2, cantidad = $3, info = $4, categoria = $5, usuario = $6, cuenta = $7 WHERE id = $8',
      [fecha, tipo, cantidad, concepto, categoria, usuario, cuenta, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No encontrado' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error al actualizar:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para obtener presupuestos de un mes específico
app.get('/presupuestos/:anio/:mes', async (req, res) => {
  const { anio, mes } = req.params;
  const mesFormatted = String(Number(mes) + 1).padStart(2, '0');
  const keyMes = `${anio}-${mesFormatted}`;
  
  try {
    const result = await db.query(
      'SELECT categoria, cantidad FROM presupuestos WHERE mes = $1',
      [keyMes]
    );
    
    const presupuestos = {};
    result.rows.forEach(row => {
      presupuestos[row.categoria] = row.cantidad;
    });
    
    res.json({ mes: keyMes, presupuestos });
  } catch (err) {
    console.error('Error al obtener presupuestos:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para guardar/actualizar presupuestos
app.post('/presupuestos/:anio/:mes', async (req, res) => {
  const { anio, mes } = req.params;
  const { presupuestos } = req.body;
  
  if (!presupuestos || typeof presupuestos !== 'object') {
    return res.status(400).json({ error: 'Presupuestos inválidos' });
  }
  
  const mesFormatted = String(Number(mes) + 1).padStart(2, '0');
  const keyMes = `${anio}-${mesFormatted}`;
  
  try {
    // Primero, eliminar presupuestos existentes para ese mes
    await db.query('DELETE FROM presupuestos WHERE mes = $1', [keyMes]);
    
    // Luego, insertar los nuevos presupuestos
    const insertPromises = Object.entries(presupuestos).map(([categoria, cantidad]) => {
      return db.query(
        'INSERT INTO presupuestos (mes, categoria, cantidad) VALUES ($1, $2, $3)',
        [keyMes, categoria, cantidad]
      );
    });
    
    await Promise.all(insertPromises);
    
    res.status(201).json({ mes: keyMes, presupuestos });
  } catch (err) {
    console.error('Error al guardar presupuestos:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== ENDPOINTS PARA CALENDAR EVENTS =====

// Obtener todos los eventos del calendario
app.get('/calendar-events', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM calendar_events WHERE activo = true ORDER BY dia_mes ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener eventos:', err);
    res.status(500).json({ error: err.message });
  }
});

// Crear un nuevo evento del calendario
app.post('/calendar-events', async (req, res) => {
  const { nombre, dia_mes, cantidad_min, cantidad_max, categoria, recurrencia } = req.body;
  
  if (!nombre || !dia_mes || !cantidad_min || !categoria || !recurrencia) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    const result = await db.query(
      'INSERT INTO calendar_events (nombre, dia_mes, cantidad_min, cantidad_max, categoria, recurrencia) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [nombre, dia_mes, cantidad_min, cantidad_max || null, categoria, JSON.stringify(recurrencia)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear evento:', err);
    res.status(500).json({ error: err.message });
  }
});

// Actualizar un evento del calendario
app.put('/calendar-events/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, dia_mes, cantidad_min, cantidad_max, categoria, recurrencia } = req.body;

  try {
    const result = await db.query(
      'UPDATE calendar_events SET nombre = $1, dia_mes = $2, cantidad_min = $3, cantidad_max = $4, categoria = $5, recurrencia = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [nombre, dia_mes, cantidad_min, cantidad_max || null, categoria, JSON.stringify(recurrencia), id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar evento:', err);
    res.status(500).json({ error: err.message });
  }
});

// Desactivar un evento del calendario (soft delete)
app.delete('/calendar-events/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      'UPDATE calendar_events SET activo = false WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error al desactivar evento:', err);
    res.status(500).json({ error: err.message });
  }
});

// Descartar warning para un mes específico
app.post('/dismissed-warnings', async (req, res) => {
  const { evento_id, mes_ano } = req.body;

  if (!evento_id || !mes_ano) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    await db.query(
      'INSERT INTO dismissed_warnings (evento_id, mes_ano) VALUES ($1, $2) ON CONFLICT (evento_id, mes_ano) DO NOTHING',
      [evento_id, mes_ano]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Error al descartar warning:', err);
    res.status(500).json({ error: err.message });
  }
});

// Obtener warnings descartados para un mes específico
app.get('/dismissed-warnings/:mes_ano', async (req, res) => {
  const { mes_ano } = req.params;

  try {
    const result = await db.query(
      'SELECT evento_id FROM dismissed_warnings WHERE mes_ano = $1',
      [mes_ano]
    );
    const dismissedIds = result.rows.map(row => row.evento_id);
    res.json(dismissedIds);
  } catch (err) {
    console.error('Error al obtener warnings descartados:', err);
    res.status(500).json({ error: err.message });
  }
});

// Puerto
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});

