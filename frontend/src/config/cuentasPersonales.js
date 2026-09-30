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

// ---------------------------------------------------------------------------
// Periodo Cobee: va del día de carga (por defecto el 15) al día anterior del
// mes siguiente. El saldo que no se usa en un periodo se pierde, así que el
// saldo de cada subcuenta se calcula solo con las operaciones del periodo.
// ---------------------------------------------------------------------------
export const DIA_CARGA_COBEE = 15;

const pad2 = (n) => String(n).padStart(2, '0');

// Fecha de operación ('YYYY-MM-DD...' o Date) -> 'YYYY-MM-DD'
export const fechaISO = (date) => {
  const match = String(date).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

export const hoyISO = () => fechaISO(new Date());

// Periodo que contiene la fecha dada: { inicio, fin } en formato 'YYYY-MM-DD'
export const periodoCobee = (fecha, dia = DIA_CARGA_COBEE) => {
  let [y, m, d] = fechaISO(fecha).split('-').map(Number);
  if (d < dia) {
    m -= 1;
    if (m < 1) { m = 12; y -= 1; }
  }
  const inicio = `${y}-${pad2(m)}-${pad2(dia)}`;
  const finDate = new Date(Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, dia));
  finDate.setUTCDate(finDate.getUTCDate() - 1);
  const fin = finDate.toISOString().slice(0, 10);
  return { inicio, fin };
};

const enPeriodo = (op, periodo) => {
  const f = fechaISO(op.date);
  return f >= periodo.inicio && f <= periodo.fin;
};

// Resumen de una subcuenta Cobee en el periodo que contiene la fecha
export const resumenCobeePeriodo = (ops, cuenta, fecha = new Date(), dia = DIA_CARGA_COBEE) => {
  const periodo = periodoCobee(fecha, dia);
  let cargado = 0;
  let usado = 0;
  ops
    .filter(op => op.account_name === cuenta && enPeriodo(op, periodo))
    .forEach(op => {
      const amount = parseFloat(op.amount || 0);
      if (op.type === 'gasto' || op.type === 'expense') usado += amount;
      else cargado += amount;
    });
  return { ...periodo, cargado, usado, saldo: cargado - usado };
};

// Días que quedan del periodo (incluido hoy)
export const diasRestantesPeriodo = (periodo) => {
  const hoy = new Date(`${hoyISO()}T00:00:00Z`);
  const fin = new Date(`${periodo.fin}T00:00:00Z`);
  return Math.max(0, Math.round((fin - hoy) / 86400000) + 1);
};

// '2026-10-14' -> '14 oct'
export const fechaCorta = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' }).replace('.', '');
};

// Estilo de la parte pagada con Cobee en barras por categoría:
// mismo color de la categoría, rayado, para distinguirla del gasto con dinero.
export const COLOR_COBEE = '#9333ea';
export const estiloCobee = (color) => ({
  backgroundColor: color,
  backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.6) 0 3px, transparent 3px 6px)'
});
