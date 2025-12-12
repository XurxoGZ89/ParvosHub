
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Crear tabla operaciones si no existe
db.run(`CREATE TABLE IF NOT EXISTS operaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL,
  tipo TEXT NOT NULL, -- entrada, salida, hucha
  cantidad REAL NOT NULL,
  info TEXT,
  categoria TEXT,
  usuario TEXT, -- Xurxo o Sonia
  cuenta TEXT   -- Imagin o BBVA
)`);

// Endpoint de prueba
app.get('/', (req, res) => {
  res.send('API de gastos familiares funcionando');
});

// Endpoint para agregar una operación
app.post('/operaciones', (req, res) => {
  const { fecha, tipo, cantidad, info, categoria, usuario, cuenta } = req.body;
  if (!fecha || !tipo || !cantidad) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }
  db.run(
    'INSERT INTO operaciones (fecha, tipo, cantidad, info, categoria, usuario, cuenta) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [fecha, tipo, cantidad, info, categoria, usuario, cuenta],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Endpoint para obtener todas las operaciones (con filtros opcionales)
app.get('/operaciones', (req, res) => {
  let query = 'SELECT * FROM operaciones WHERE 1=1';
  const params = [];
  if (req.query.categoria) {
    query += ' AND categoria = ?';
    params.push(req.query.categoria);
  }
  if (req.query.tipo) {
    query += ' AND tipo = ?';
    params.push(req.query.tipo);
  }
  if (req.query.usuario) {
    query += ' AND usuario = ?';
    params.push(req.query.usuario);
  }
  if (req.query.cuenta) {
    query += ' AND cuenta = ?';
    params.push(req.query.cuenta);
  }
  query += ' ORDER BY fecha DESC';
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Eliminar una operación por id
app.delete('/operaciones/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM operaciones WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'No encontrado' });
    }
    res.json({ success: true });
  });
});

// Actualizar una operación por id
app.put('/operaciones/:id', (req, res) => {
  const { id } = req.params;
  const { fecha, tipo, cantidad, info, categoria, usuario, cuenta } = req.body;
  db.run(
    'UPDATE operaciones SET fecha = ?, tipo = ?, cantidad = ?, info = ?, categoria = ?, usuario = ?, cuenta = ? WHERE id = ?',
    [fecha, tipo, cantidad, info, categoria, usuario, cuenta, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'No encontrado' });
      }
      res.json({ success: true });
    }
  );
});

// Puerto
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});
