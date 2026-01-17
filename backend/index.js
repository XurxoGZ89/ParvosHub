
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

// ===== ENDPOINTS PARA CALENDARIO DE COMIDAS =====

// Obtener todas las comidas congeladas del inventario
app.get('/comidas-congeladas', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM comidas_congeladas ORDER BY fecha_creacion DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener comidas congeladas:', err);
    res.status(500).json({ error: err.message });
  }
});

// Crear una nueva comida congelada
app.post('/comidas-congeladas', async (req, res) => {
  const { nombre, notas, categoria, fecha_caducidad, cantidad } = req.body;
  
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  try {
    const result = await db.query(
      'INSERT INTO comidas_congeladas (nombre, notas, categoria, fecha_caducidad, cantidad) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nombre, notas || null, categoria || 'otros', fecha_caducidad || null, cantidad || 1]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear comida congelada:', err);
    res.status(500).json({ error: err.message });
  }
});

// Actualizar una comida congelada (notas o estado tachada)
app.put('/comidas-congeladas/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, notas, tachada, categoria, fecha_caducidad, cantidad } = req.body;

  try {
    let query, params;
    
    if (tachada !== undefined) {
      // Actualizar estado tachada
      query = 'UPDATE comidas_congeladas SET tachada = $1, fecha_tachada = $2 WHERE id = $3 RETURNING *';
      params = [tachada, tachada ? new Date().toISOString() : null, id];
    } else {
      // Actualizar todos los campos
      query = 'UPDATE comidas_congeladas SET nombre = $1, notas = $2, categoria = $3, fecha_caducidad = $4, cantidad = $5 WHERE id = $6 RETURNING *';
      params = [nombre, notas || null, categoria || 'otros', fecha_caducidad || null, cantidad || 1, id];
    }
    
    const result = await db.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comida no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar comida congelada:', err);
    res.status(500).json({ error: err.message });
  }
});

// Eliminar una comida congelada
app.delete('/comidas-congeladas/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM comidas_congeladas WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Comida no encontrada' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error al eliminar comida congelada:', err);
    res.status(500).json({ error: err.message });
  }
});

// Limpiar comidas tachadas de semanas pasadas
app.delete('/comidas-congeladas/limpiar/pasadas', async (req, res) => {
  try {
    // Calcular fecha límite (inicio de la semana actual - lunes)
    const hoy = new Date();
    const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay(); // Domingo = 7
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - diaSemana + 1);
    inicioSemana.setHours(0, 0, 0, 0);

    const result = await db.query(
      'DELETE FROM comidas_congeladas WHERE tachada = true AND fecha_tachada < $1 RETURNING id',
      [inicioSemana.toISOString()]
    );
    
    res.json({ success: true, deleted: result.rowCount });
  } catch (err) {
    console.error('Error al limpiar comidas pasadas:', err);
    res.status(500).json({ error: err.message });
  }
});

// Obtener comidas planificadas vencidas (anteriores al lunes de esta semana)
app.get('/comidas-planificadas/vencidas', async (req, res) => {
  try {
    // Calcular el lunes de la semana actual
    const hoy = new Date();
    const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay();
    const lunesActual = new Date(hoy);
    lunesActual.setDate(hoy.getDate() - diaSemana + 1);
    lunesActual.setHours(0, 0, 0, 0);

    const result = await db.query(`
      SELECT cp.*, cc.nombre as comida_nombre 
      FROM comidas_planificadas cp
      LEFT JOIN comidas_congeladas cc ON cp.comida_id = cc.id
      WHERE cp.fecha < $1
      ORDER BY cp.fecha ASC, cp.tipo_comida ASC
    `, [lunesActual.toISOString()]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener comidas vencidas:', err);
    res.status(500).json({ error: err.message });
  }
});

// Obtener todas las comidas planificadas
app.get('/comidas-planificadas', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT cp.*, cc.nombre as comida_nombre 
      FROM comidas_planificadas cp
      LEFT JOIN comidas_congeladas cc ON cp.comida_id = cc.id
      ORDER BY cp.fecha ASC, cp.tipo_comida ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener comidas planificadas:', err);
    res.status(500).json({ error: err.message });
  }
});

// Crear una comida planificada
app.post('/comidas-planificadas', async (req, res) => {
  const { comida_id, comida_nombre, fecha, tipo_comida } = req.body;
  
  if (!fecha || !tipo_comida) {
    return res.status(400).json({ error: 'Fecha y tipo de comida son obligatorios' });
  }

  try {
    const result = await db.query(
      'INSERT INTO comidas_planificadas (comida_id, comida_nombre, fecha, tipo_comida) VALUES ($1, $2, $3, $4) RETURNING *',
      [comida_id || null, comida_nombre, fecha, tipo_comida]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear comida planificada:', err);
    res.status(500).json({ error: err.message });
  }
});

// Actualizar una comida planificada (mover en el calendario)
app.put('/comidas-planificadas/:id', async (req, res) => {
  const { id } = req.params;
  const { fecha, tipo_comida, notas } = req.body;

  try {
    // Construir UPDATE dinámico según qué campos se envíen
    let updateQuery = 'UPDATE comidas_planificadas SET ';
    const params = [];
    let paramIndex = 1;

    if (fecha !== undefined) {
      updateQuery += `fecha = $${paramIndex}`;
      params.push(fecha);
      paramIndex++;
    }
    if (tipo_comida !== undefined) {
      if (params.length > 0) updateQuery += ', ';
      updateQuery += `tipo_comida = $${paramIndex}`;
      params.push(tipo_comida);
      paramIndex++;
    }
    if (notas !== undefined) {
      if (params.length > 0) updateQuery += ', ';
      updateQuery += `notas = $${paramIndex}`;
      params.push(notas);
      paramIndex++;
    }

    updateQuery += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(id);

    const result = await db.query(updateQuery, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comida planificada no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar comida planificada:', err);
    res.status(500).json({ error: err.message });
  }
});

// Eliminar una comida planificada
app.delete('/comidas-planificadas/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM comidas_planificadas WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Comida planificada no encontrada' });
    }
    res.json({ success: true, comida: result.rows[0] });
  } catch (err) {
    console.error('Error al eliminar comida planificada:', err);
    res.status(500).json({ error: err.message });
  }
});

// Puerto
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});

