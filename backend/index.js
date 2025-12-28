
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

// Puerto
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});

