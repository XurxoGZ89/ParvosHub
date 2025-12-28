// importar_csv_con_fecha.js
// Script para importar datos del CSV 'Migración.csv' a la base de datos 'database.sqlite' usando la fecha del CSV

const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Rutas
const csvPath = path.join(__dirname, '../Migración.csv');
const dbPath = path.join(__dirname, '../database.sqlite');

const db = new sqlite3.Database(dbPath, err => {
  if (err) {
    console.error('Error abriendo la base de datos:', err.message);
    process.exit(1);
  }
});

function parseFecha(fechaStr) {
  // Convierte 2/12/25 a 2025-12-02
  if (!fechaStr) return '';
  const [d, m, y] = fechaStr.split('/');
  if (!d || !m || !y) return '';
  const year = y.length === 2 ? '20' + y : y;
  return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

fs.readFile(csvPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error leyendo el archivo CSV:', err.message);
    process.exit(1);
  }
  const lines = data.trim().split('\n');
  const header = lines[0].split(';');
  const idxFecha = header.indexOf('Fecha');
  const idxCantidad = header.indexOf('Cantidad');
  const idxInfo = header.indexOf('Información');
  const idxCategoria = header.indexOf('Categoría');
  const idxUsuario = header.indexOf('Usuario');
  const idxCuenta = header.indexOf('Cuenta');

  let total = 0;
  let cuentaStats = {};
  let pending = lines.length - 1;
  if (pending === 0) {
    console.log('No hay datos para importar.');
    db.close();
    return;
  }

  // Vaciar la tabla antes de importar
  db.run('DELETE FROM operaciones', (err) => {
    if (err) {
      console.error('Error al vaciar la tabla operaciones:', err.message);
      db.close();
      return;
    }
    lines.slice(1).forEach((line, idx) => {
    const cols = line.split(';');
    const fecha = parseFecha(cols[idxFecha]);
    let cantidadRaw = cols[idxCantidad] || '';
    let concepto = cols[idxInfo] ? cols[idxInfo].trim() : '';
    let categoria = cols[idxCategoria] ? cols[idxCategoria].replace(/\r|\n/g, '').trim() : '';
    let usuario = cols[idxUsuario] ? cols[idxUsuario].trim() : 'Xurxo';
    let cuenta = cols[idxCuenta] ? cols[idxCuenta].replace(/\r|\n/g, '').trim() : 'IMAGIN';
    console.log(`Línea ${idx+2} - Cuenta original: '${cols[idxCuenta]}' -> Normalizada: '${cuenta}'`);

    // Normalizar mayúsculas
    categoria = categoria.charAt(0).toUpperCase() + categoria.slice(1).toLowerCase();
    usuario = usuario.charAt(0).toUpperCase() + usuario.slice(1).toLowerCase();
    // Normalizar cuenta: si es 'bbva' o 'imagin' (ignorando mayúsculas/minúsculas), poner en mayúsculas, si no, dejar como está
    if (cuenta.toLowerCase() === 'bbva') {
      cuenta = 'BBVA';
    } else if (cuenta.toLowerCase() === 'imagin') {
      cuenta = 'IMAGIN';
    } // si hay otros valores, se dejan tal cual

    // Validar cantidad
    let cantidadStr = cantidadRaw
      .replace(/,/g, '.')
      .replace(/\s?€/, '')
      .replace(/€/g, '')
      .replace(/</g, '')
      .trim();
    let cantidad = parseFloat(cantidadStr);
    if (isNaN(cantidad)) {
      console.warn(`Línea ${idx+2}: cantidad no válida ('${cantidadRaw}'), se guarda como 0`);
      cantidad = 0;
    }
    db.run(
      `INSERT INTO operaciones (fecha, tipo, cantidad, concepto, categoria, usuario, cuenta)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [fecha, 'salida', cantidad, concepto, categoria, usuario, cuenta],
      err => {
        if (err) {
          console.error('Error insertando línea', idx+2, ':', err.message);
        } else {
          total++;
          cuentaStats[cuenta] = (cuentaStats[cuenta] || 0) + 1;
        }
        pending--;
        if (pending === 0) {
          console.log('Importación completada. Total registros insertados:', total);
          Object.keys(cuentaStats).forEach(c => {
            console.log(`Cuenta ${c}: ${cuentaStats[c]} registros insertados.`);
          });
          db.close();
        }
      }
    );
    });
  });
});

