#!/usr/bin/env node

/**
 * Script para importar datos del CSV a PostgreSQL
 * Uso: node importar_csv.js
 */

const fs = require('fs');
const path = require('path');
const pool = require('./db');
const csv = require('csv-parser');

const csvPath = path.resolve(__dirname, '../Migración.csv');

if (!fs.existsSync(csvPath)) {
  console.error(`❌ Archivo no encontrado: ${csvPath}`);
  process.exit(1);
}

console.log(`📂 Leyendo: ${csvPath}`);

let count = 0;
const errors = [];

fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', async (row) => {
    try {
      // Ajusta los nombres de columnas según tu CSV
      const fecha = row.fecha || row.Fecha || '';
      const tipo = row.tipo || row.Tipo || '';
      const cantidad = parseFloat(row.cantidad || row.Cantidad || 0);
      const info = row.info || row.Info || row.concepto || row.Concepto || '';
      const categoria = row.categoria || row.Categoría || '';
      const usuario = row.usuario || row.Usuario || '';
      const cuenta = row.cuenta || row.Cuenta || '';

      if (!fecha || !tipo || !cantidad) {
        errors.push(`Fila ${count + 1}: Datos incompletos - ${JSON.stringify(row)}`);
        return;
      }

      await pool.query(
        'INSERT INTO operaciones (fecha, tipo, cantidad, info, categoria, usuario, cuenta) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [fecha, tipo, cantidad, info, categoria, usuario, cuenta]
      );

      count++;
      if (count % 10 === 0) {
        console.log(`✅ ${count} registros importados...`);
      }
    } catch (err) {
      errors.push(`Error importando: ${err.message}`);
    }
  })
  .on('end', async () => {
    console.log(`\n✅ Importación completada: ${count} registros insertados`);
    
    if (errors.length > 0) {
      console.log(`\n⚠️ ${errors.length} errores encontrados:`);
      errors.forEach((e) => console.log(`  - ${e}`));
    }

    await pool.end();
    process.exit(0);
  })
  .on('error', (err) => {
    console.error(`❌ Error leyendo CSV: ${err.message}`);
    process.exit(1);
  });
