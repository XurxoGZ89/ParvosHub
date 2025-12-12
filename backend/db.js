const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ruta del archivo de la base de datos
const dbPath = path.resolve(__dirname, 'gastos_familia.db');
const db = new sqlite3.Database(dbPath, (err) => {
	if (err) {
		console.error('Error al conectar a SQLite:', err.message);
	} else {
		console.log('Conexión a SQLite establecida');
	}
});

module.exports = db;
