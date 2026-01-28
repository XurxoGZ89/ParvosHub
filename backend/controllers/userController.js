const db = require('../db');

/**
 * Obtener operaciones del usuario logueado
 * GET /api/user/operations
 * Query params: tipo, categoria, cuenta, fecha_desde, fecha_hasta, mes
 */
exports.getUserOperations = async (req, res) => {
  try {
    const userId = req.user.id; // Viene del middleware de autenticación
    
    let query = 'SELECT * FROM user_operations WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    // Filtros opcionales
    if (req.query.tipo) {
      query += ` AND type = $${paramIndex++}`;
      params.push(req.query.tipo);
    }

    if (req.query.categoria) {
      query += ` AND category = $${paramIndex++}`;
      params.push(req.query.categoria);
    }

    if (req.query.cuenta) {
      query += ` AND account_name = $${paramIndex++}`;
      params.push(req.query.cuenta);
    }

    if (req.query.fecha_desde) {
      query += ` AND date >= $${paramIndex++}`;
      params.push(req.query.fecha_desde);
    }

    if (req.query.fecha_hasta) {
      query += ` AND date <= $${paramIndex++}`;
      params.push(req.query.fecha_hasta);
    }

    // Filtro por mes específico (formato: YYYY-MM)
    if (req.query.mes) {
      query += ` AND TO_CHAR(date, 'YYYY-MM') = $${paramIndex++}`;
      params.push(req.query.mes);
    }

    query += ' ORDER BY date DESC, id DESC';

    const result = await db.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener operaciones de usuario:', error);
    res.status(500).json({ error: 'Error al obtener operaciones', details: error.message });
  }
};

/**
 * Crear nueva operación para el usuario logueado
 * POST /api/user/operations
 */
exports.createUserOperation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { account_name, date, type, amount, description, category } = req.body;

    // Validación de campos requeridos
    if (!account_name || !date || !type || !amount) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos: account_name, date, type, amount' 
      });
    }

    // Validar tipo de operación
    const validTypes = ['income', 'expense', 'savings', 'savings_withdrawal'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: `Tipo inválido. Debe ser uno de: ${validTypes.join(', ')}` 
      });
    }

    // Si es un traspaso (savings_withdrawal), crear dos operaciones: salida y entrada
    if (type === 'savings_withdrawal') {
      // Extraer la cuenta origen de la descripción: "Traspaso desde X a Y"
      const origenMatch = description.match(/Traspaso desde (.+?) a/);
      const cuentaOrigen = origenMatch ? origenMatch[1] : null;
      
      if (!cuentaOrigen) {
        return res.status(400).json({ 
          error: 'Formato de descripción inválido para traspaso. Debe ser: "Traspaso desde X a Y"' 
        });
      }

      // Crear operación de salida en la cuenta origen
      await db.query(
        `INSERT INTO user_operations 
         (user_id, account_name, date, type, amount, description, category) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, cuentaOrigen, date, 'savings_withdrawal', -amount, description, '']
      );

      // Crear operación de entrada en la cuenta destino
      const result = await db.query(
        `INSERT INTO user_operations 
         (user_id, account_name, date, type, amount, description, category) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [userId, account_name, date, 'savings_withdrawal', amount, description, '']
      );

      console.log(`Traspaso creado para usuario ${userId}: ${cuentaOrigen} -> ${account_name} (${amount}€)`);
      res.status(201).json(result.rows[0]);
    } else {
      // Para otros tipos, crear una única operación
      const result = await db.query(
        `INSERT INTO user_operations 
         (user_id, account_name, date, type, amount, description, category) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [userId, account_name, date, type, amount, description || '', category || '']
      );

      console.log(`Operación personal creada para usuario ${userId}:`, result.rows[0]);
      res.status(201).json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error al crear operación de usuario:', error);
    res.status(500).json({ error: 'Error al crear operación', details: error.message });
  }
};

/**
 * Actualizar operación del usuario logueado
 * PUT /api/user/operations/:id
 */
exports.updateUserOperation = async (req, res) => {
  try {
    const userId = req.user.id;
    const operationId = req.params.id;
    const { account_name, date, type, amount, description, category } = req.body;

    // Verificar que la operación pertenece al usuario
    const checkResult = await db.query(
      'SELECT * FROM user_operations WHERE id = $1 AND user_id = $2',
      [operationId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Operación no encontrada o no pertenece al usuario' });
    }

    const operacionAntigua = checkResult.rows[0];

    // Si es un traspaso, necesitamos manejar las dos operaciones
    if (type === 'savings_withdrawal') {
      // Extraer la cuenta origen de la descripción
      const origenMatch = description.match(/Traspaso desde (.+?) a/);
      const cuentaOrigen = origenMatch ? origenMatch[1] : null;
      
      if (!cuentaOrigen) {
        return res.status(400).json({ 
          error: 'Formato de descripción inválido para traspaso. Debe ser: "Traspaso desde X a Y"' 
        });
      }

      // Si la operación antigua era también un traspaso, eliminar ambas operaciones del antiguo traspaso
      if (operacionAntigua.type === 'savings_withdrawal') {
        // Buscar la operación complementaria (con monto opuesto)
        const complementaria = await db.query(
          `SELECT id FROM user_operations 
           WHERE user_id = $1 AND type = 'savings_withdrawal' AND date = $2 
           AND description = $3 AND amount = $4 AND id != $5
           LIMIT 1`,
          [userId, operacionAntigua.date, operacionAntigua.description, -operacionAntigua.amount, operationId]
        );
        
        if (complementaria.rows.length > 0) {
          // Eliminar la operación complementaria
          await db.query(
            'DELETE FROM user_operations WHERE id = $1',
            [complementaria.rows[0].id]
          );
        }
      }

      // Eliminar la operación original
      await db.query(
        'DELETE FROM user_operations WHERE id = $1',
        [operationId]
      );

      // Crear las dos nuevas operaciones
      // Operación de salida en la cuenta origen
      await db.query(
        `INSERT INTO user_operations 
         (user_id, account_name, date, type, amount, description, category) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, cuentaOrigen, date, 'savings_withdrawal', -amount, description, '']
      );

      // Operación de entrada en la cuenta destino
      const result = await db.query(
        `INSERT INTO user_operations 
         (user_id, account_name, date, type, amount, description, category) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [userId, account_name, date, 'savings_withdrawal', amount, description, '']
      );

      console.log(`Traspaso ${operationId} actualizado para usuario ${userId}: ${cuentaOrigen} -> ${account_name}`);
      res.json(result.rows[0]);
    } else {
      // Si la operación antigua era un traspaso y ahora no lo es, eliminar la operación complementaria
      if (operacionAntigua.type === 'savings_withdrawal') {
        const complementaria = await db.query(
          `SELECT id FROM user_operations 
           WHERE user_id = $1 AND type = 'savings_withdrawal' AND date = $2 
           AND description = $3 AND amount = $4 AND id != $5
           LIMIT 1`,
          [userId, operacionAntigua.date, operacionAntigua.description, -operacionAntigua.amount, operationId]
        );
        
        if (complementaria.rows.length > 0) {
          await db.query(
            'DELETE FROM user_operations WHERE id = $1',
            [complementaria.rows[0].id]
          );
        }
      }

      // Actualizar la operación normal
      const result = await db.query(
        `UPDATE user_operations 
         SET account_name = $1, date = $2, type = $3, amount = $4, 
             description = $5, category = $6, updated_at = CURRENT_TIMESTAMP
         WHERE id = $7 AND user_id = $8
         RETURNING *`,
        [account_name, date, type, amount, description || '', category || '', operationId, userId]
      );

      console.log(`Operación ${operationId} actualizada para usuario ${userId}`);
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error al actualizar operación de usuario:', error);
    res.status(500).json({ error: 'Error al actualizar operación', details: error.message });
  }
};

/**
 * Eliminar operación del usuario logueado
 * DELETE /api/user/operations/:id
 */
exports.deleteUserOperation = async (req, res) => {
  try {
    const userId = req.user.id;
    const operationId = req.params.id;

    // Obtener la operación a eliminar
    const checkResult = await db.query(
      'SELECT * FROM user_operations WHERE id = $1 AND user_id = $2',
      [operationId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Operación no encontrada o no pertenece al usuario' });
    }

    const operacion = checkResult.rows[0];

    // Si es un traspaso, eliminar también la operación complementaria
    if (operacion.type === 'savings_withdrawal') {
      const complementaria = await db.query(
        `SELECT id FROM user_operations 
         WHERE user_id = $1 AND type = 'savings_withdrawal' AND date = $2 
         AND description = $3 AND amount = $4 AND id != $5
         LIMIT 1`,
        [userId, operacion.date, operacion.description, -operacion.amount, operationId]
      );
      
      if (complementaria.rows.length > 0) {
        await db.query(
          'DELETE FROM user_operations WHERE id = $1',
          [complementaria.rows[0].id]
        );
      }
    }

    // Eliminar la operación principal
    const result = await db.query(
      'DELETE FROM user_operations WHERE id = $1 AND user_id = $2 RETURNING *',
      [operationId, userId]
    );

    console.log(`Operación ${operationId} eliminada para usuario ${userId}`);
    res.json({ message: 'Operación eliminada correctamente', operation: result.rows[0] });
  } catch (error) {
    console.error('Error al eliminar operación de usuario:', error);
    res.status(500).json({ error: 'Error al eliminar operación', details: error.message });
  }
};

/**
 * Obtener cuentas del usuario logueado
 * GET /api/user/accounts
 */
exports.getUserAccounts = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      'SELECT * FROM user_accounts WHERE user_id = $1 AND is_active = true ORDER BY id',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener cuentas de usuario:', error);
    res.status(500).json({ error: 'Error al obtener cuentas', details: error.message });
  }
};

/**
 * Obtener resumen mensual del usuario logueado
 * GET /api/user/summary/:month
 * Parámetro: month (formato YYYY-MM)
 */
exports.getUserMonthlySummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const month = req.params.month; // Formato: YYYY-MM

    // Validar formato de mes
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Formato de mes inválido. Use YYYY-MM' });
    }

    // Obtener todas las operaciones del mes
    const operationsResult = await db.query(
      `SELECT * FROM user_operations 
       WHERE user_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2
       ORDER BY date DESC`,
      [userId, month]
    );

    // Calcular totales por tipo
    const totales = {
      ingresos: 0,
      gastos: 0,
      ahorros: 0,
      retiradas: 0
    };

    operationsResult.rows.forEach(op => {
      switch (op.type) {
        case 'income':
          totales.ingresos += parseFloat(op.amount);
          break;
        case 'expense':
          totales.gastos += parseFloat(op.amount);
          break;
        case 'savings':
          totales.ahorros += parseFloat(op.amount);
          break;
        case 'savings_withdrawal':
          totales.retiradas += parseFloat(op.amount);
          break;
      }
    });

    // Calcular balance
    const balance = totales.ingresos - totales.gastos - totales.ahorros + totales.retiradas;

    // Agrupar gastos por categoría
    const gastosPorCategoria = {};
    operationsResult.rows
      .filter(op => op.type === 'expense' && op.category)
      .forEach(op => {
        const cat = op.category;
        if (!gastosPorCategoria[cat]) {
          gastosPorCategoria[cat] = 0;
        }
        gastosPorCategoria[cat] += parseFloat(op.amount);
      });

    // Agrupar por cuenta
    const porCuenta = {};
    operationsResult.rows.forEach(op => {
      const cuenta = op.account_name;
      if (!porCuenta[cuenta]) {
        porCuenta[cuenta] = {
          ingresos: 0,
          gastos: 0,
          ahorros: 0,
          retiradas: 0,
          balance: 0
        };
      }

      switch (op.type) {
        case 'income':
          porCuenta[cuenta].ingresos += parseFloat(op.amount);
          break;
        case 'expense':
          porCuenta[cuenta].gastos += parseFloat(op.amount);
          break;
        case 'savings':
          porCuenta[cuenta].ahorros += parseFloat(op.amount);
          break;
        case 'savings_withdrawal':
          porCuenta[cuenta].retiradas += parseFloat(op.amount);
          break;
      }

      porCuenta[cuenta].balance = 
        porCuenta[cuenta].ingresos - 
        porCuenta[cuenta].gastos - 
        porCuenta[cuenta].ahorros + 
        porCuenta[cuenta].retiradas;
    });

    res.json({
      month,
      totales,
      balance,
      gastosPorCategoria,
      porCuenta,
      operaciones: operationsResult.rows
    });
  } catch (error) {
    console.error('Error al obtener resumen mensual de usuario:', error);
    res.status(500).json({ error: 'Error al obtener resumen', details: error.message });
  }
};

/**
 * Obtener resumen anual del usuario logueado
 * GET /api/user/summary/year/:year
 */
exports.getUserAnnualSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const year = req.params.year;

    // Validar año
    if (!/^\d{4}$/.test(year)) {
      return res.status(400).json({ error: 'Formato de año inválido. Use YYYY' });
    }

    // Obtener todas las operaciones del año
    const result = await db.query(
      `SELECT * FROM user_operations 
       WHERE user_id = $1 AND EXTRACT(YEAR FROM date) = $2
       ORDER BY date`,
      [userId, year]
    );

    // Agrupar por mes
    const porMes = {};
    for (let i = 1; i <= 12; i++) {
      const mes = i.toString().padStart(2, '0');
      porMes[`${year}-${mes}`] = {
        ingresos: 0,
        gastos: 0,
        ahorros: 0,
        retiradas: 0,
        balance: 0
      };
    }

    result.rows.forEach(op => {
      const mes = op.date.toISOString().slice(0, 7); // YYYY-MM
      
      if (porMes[mes]) {
        switch (op.type) {
          case 'income':
            porMes[mes].ingresos += parseFloat(op.amount);
            break;
          case 'expense':
            porMes[mes].gastos += parseFloat(op.amount);
            break;
          case 'savings':
            porMes[mes].ahorros += parseFloat(op.amount);
            break;
          case 'savings_withdrawal':
            porMes[mes].retiradas += parseFloat(op.amount);
            break;
        }

        porMes[mes].balance = 
          porMes[mes].ingresos - 
          porMes[mes].gastos - 
          porMes[mes].ahorros + 
          porMes[mes].retiradas;
      }
    });

    // Totales anuales
    const totalesAnuales = Object.values(porMes).reduce((acc, mes) => ({
      ingresos: acc.ingresos + mes.ingresos,
      gastos: acc.gastos + mes.gastos,
      ahorros: acc.ahorros + mes.ahorros,
      retiradas: acc.retiradas + mes.retiradas,
      balance: acc.balance + mes.balance
    }), { ingresos: 0, gastos: 0, ahorros: 0, retiradas: 0, balance: 0 });

    res.json({
      year,
      porMes,
      totalesAnuales
    });
  } catch (error) {
    console.error('Error al obtener resumen anual de usuario:', error);
    res.status(500).json({ error: 'Error al obtener resumen anual', details: error.message });
  }
};

/**
 * Obtener resumen para el dashboard (saldos + mes actual)
 * GET /api/user/dashboard-summary
 */
exports.getUserDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Obtener todas las cuentas del usuario con sus saldos (excluyendo ahorros)
    const accountsQuery = `
      SELECT account_name, initial_balance
      FROM user_accounts
      WHERE user_id = $1 AND account_type != 'savings'
      ORDER BY id
    `;
    const accountsResult = await db.query(accountsQuery, [userId]);
    
    // Calcular saldo actual de cada cuenta
    const accounts = [];
    let totalBalance = 0;
    
    for (const account of accountsResult.rows) {
      const balanceQuery = `
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'ingreso' THEN amount ELSE -amount END), 0) as operations_balance
        FROM user_operations
        WHERE user_id = $1 AND account_name = $2
      `;
      const balanceResult = await db.query(balanceQuery, [userId, account.account_name]);
      const currentBalance = parseFloat(account.initial_balance) + parseFloat(balanceResult.rows[0].operations_balance);
      
      accounts.push({
        account_name: account.account_name,
        balance: currentBalance
      });
      
      totalBalance += currentBalance;
    }
    
    // Obtener ingresos y gastos del mes actual
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const monthSummaryQuery = `
      SELECT 
        type,
        COALESCE(SUM(amount), 0) as total
      FROM user_operations
      WHERE user_id = $1 
        AND EXTRACT(YEAR FROM date) = $2
        AND EXTRACT(MONTH FROM date) = $3
      GROUP BY type
    `;
    const monthSummaryResult = await db.query(monthSummaryQuery, [userId, currentYear, currentMonth]);
    
    const ingresos = monthSummaryResult.rows.find(r => r.type === 'ingreso')?.total || 0;
    const gastos = monthSummaryResult.rows.find(r => r.type === 'gasto')?.total || 0;
    
    res.json({
      totalBalance,
      accounts,
      currentMonth: {
        ingresos: parseFloat(ingresos),
        gastos: parseFloat(gastos)
      }
    });
  } catch (error) {
    console.error('Error getting dashboard summary:', error);
    res.status(500).json({ error: 'Error al obtener el resumen del dashboard' });
  }
};

/**
 * Obtener todos los presupuestos del usuario
 * GET /api/user/budgets
 */
exports.getUserBudgets = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      'SELECT * FROM user_budgets WHERE user_id = $1 ORDER BY mes DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener presupuestos de usuario:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener presupuestos de un mes específico
 * GET /api/user/budgets/:year/:month
 */
exports.getUserBudgetsByMonth = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month } = req.params;
    const mesFormatted = String(Number(month) + 1).padStart(2, '0');
    const keyMes = `${year}-${mesFormatted}`;
    
    const result = await db.query(
      'SELECT categoria, cantidad FROM user_budgets WHERE user_id = $1 AND mes = $2',
      [userId, keyMes]
    );
    
    const presupuestos = {};
    result.rows.forEach(row => {
      presupuestos[row.categoria] = row.cantidad;
    });
    
    res.json({ mes: keyMes, presupuestos });
  } catch (error) {
    console.error('Error al obtener presupuestos del mes:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Guardar/actualizar presupuestos de un mes
 * POST /api/user/budgets/:year/:month
 * Body: { presupuestos: { "Alimentación": 500, "Deporte": 100, ... } }
 */
exports.saveUserBudgets = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month } = req.params;
    const { presupuestos } = req.body;
    
    if (!presupuestos || typeof presupuestos !== 'object') {
      return res.status(400).json({ error: 'Presupuestos inválidos' });
    }
    
    const mesFormatted = String(Number(month) + 1).padStart(2, '0');
    const keyMes = `${year}-${mesFormatted}`;
    
    // Primero, eliminar presupuestos existentes para ese mes
    await db.query(
      'DELETE FROM user_budgets WHERE user_id = $1 AND mes = $2',
      [userId, keyMes]
    );
    
    // Luego, insertar los nuevos presupuestos
    const insertPromises = Object.entries(presupuestos).map(([categoria, cantidad]) => {
      return db.query(
        'INSERT INTO user_budgets (user_id, mes, categoria, cantidad) VALUES ($1, $2, $3, $4)',
        [userId, keyMes, categoria, cantidad]
      );
    });
    
    await Promise.all(insertPromises);
    
    res.status(201).json({ mes: keyMes, presupuestos });
  } catch (error) {
    console.error('Error al guardar presupuestos:', error);
    res.status(500).json({ error: error.message });
  }
};
