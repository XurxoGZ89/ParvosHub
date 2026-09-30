// Recuerda el mes elegido en las cuentas (personal y familiar) entre visitas.
// Si el mes guardado ya ha pasado, se vuelve al mes actual.
const CLAVE = 'parvoshub_mes_seleccionado';

export const getMesRecordado = () => {
  const hoy = new Date();
  const actual = { mesIdx: hoy.getMonth(), año: hoy.getFullYear() };
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) || 'null');
    if (!guardado || typeof guardado.mesIdx !== 'number' || typeof guardado.año !== 'number') return actual;
    const esPasado = guardado.año < actual.año || (guardado.año === actual.año && guardado.mesIdx < actual.mesIdx);
    return esPasado ? actual : guardado;
  } catch (e) {
    return actual;
  }
};

export const guardarMesRecordado = (mesIdx, año) => {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ mesIdx, año }));
  } catch (e) {
    // sin almacenamiento disponible: no pasa nada
  }
};
