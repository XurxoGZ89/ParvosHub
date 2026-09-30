// Configuración centralizada de las cuentas personales de cada usuario.

export const COBEE_COMIDA = 'Cobee Comida';
export const COBEE_TRANSPORTE = 'Cobee Transporte';
export const CUENTAS_COBEE = [COBEE_COMIDA, COBEE_TRANSPORTE];

// Categorías permitidas para gastos pagados con cada subcuenta Cobee
export const CATEGORIAS_COBEE = {
  [COBEE_COMIDA]: ['Ocio', 'Alimentación'],
  [COBEE_TRANSPORTE]: ['Movilidad']
};

export const esCobee = (cuenta) => CUENTAS_COBEE.includes(cuenta);

export const cuentaLabel = (cuenta) => {
  if (cuenta === COBEE_COMIDA) return 'Cobee · Comida';
  if (cuenta === COBEE_TRANSPORTE) return 'Cobee · Transporte';
  return cuenta;
};

export const tieneCobee = (username) => username === 'xurxo';

// Cuentas de dinero que cuentan para el saldo líquido.
// Incluye cuentas antiguas (p. ej. Prepago) para no perder su saldo si lo tuvieran.
export const getCuentasSaldo = (username) =>
  username === 'xurxo' ? ['Santander', 'Prepago'] : ['BBVA', 'Virtual'];

// Cuentas de dinero seleccionables en formularios (ahorro, traspasos…)
export const getCuentasDinero = (username) =>
  username === 'xurxo' ? ['Santander'] : ['BBVA', 'Virtual'];

// Cuentas seleccionables para gastos e ingresos (dinero + Cobee)
export const getCuentasOperacion = (username) => [
  ...getCuentasDinero(username),
  ...(tieneCobee(username) ? CUENTAS_COBEE : [])
];

// Saldo de una cuenta a partir de operaciones con tipos en español
export const calcularSaldoCuenta = (ops, cuenta) =>
  ops
    .filter(op => op.account_name === cuenta)
    .reduce((sum, op) => {
      const amount = parseFloat(op.amount || 0);
      if (op.type === 'gasto' || op.type === 'expense') return sum - amount;
      return sum + amount;
    }, 0);
