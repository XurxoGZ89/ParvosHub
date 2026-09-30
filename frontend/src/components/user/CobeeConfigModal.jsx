import React, { useMemo, useState } from 'react';
import { X, Utensils, Bus, Lightbulb } from 'lucide-react';
import api from '../../lib/api';
import { COBEE_COMIDA, COBEE_TRANSPORTE } from '../../config/cuentasPersonales';
import { usePrivacyFormatter } from '../../utils/privacyFormatter';

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const mesActualKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Modal para configurar la carga mensual de Cobee (retribución flexible).
 * Las cargas se registran automáticamente como ingreso en cada subcuenta.
 */
const CobeeConfigModal = ({ config, operaciones = [], onClose, onSaved }) => {
  const formatAmount = usePrivacyFormatter();
  const [comida, setComida] = useState(config?.comida ?? 220);
  const [transporte, setTransporte] = useState(config?.transporte ?? 0);
  const [meses, setMeses] = useState(config?.meses ?? [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
  const [fechaInicio, setFechaInicio] = useState(config?.fecha_inicio ?? mesActualKey());
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const numMeses = meses.filter(Boolean).length;
  const totalMensual = (parseFloat(comida) || 0) + (parseFloat(transporte) || 0);

  // Uso medio mensual de cada subcuenta (meses con gasto registrado)
  const usoMedio = useMemo(() => {
    const calc = (cuenta) => {
      const porMes = {};
      operaciones
        .filter(op => op.account_name === cuenta && (op.type === 'gasto' || op.type === 'expense'))
        .forEach(op => {
          const key = String(op.date).slice(0, 7);
          porMes[key] = (porMes[key] || 0) + parseFloat(op.amount || 0);
        });
      const valores = Object.values(porMes);
      return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null;
    };
    return { comida: calc(COBEE_COMIDA), transporte: calc(COBEE_TRANSPORTE) };
  }, [operaciones]);

  const sobranteTransporte = usoMedio.transporte !== null ? (parseFloat(transporte) || 0) - usoMedio.transporte : null;

  const guardar = async () => {
    setError('');
    setGuardando(true);
    try {
      const res = await api.put('/api/user/cobee', {
        comida: parseFloat(comida) || 0,
        transporte: parseFloat(transporte) || 0,
        meses,
        fecha_inicio: fechaInicio,
        activo: true
      });
      onSaved(res.data);
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo guardar la configuración');
    } finally {
      setGuardando(false);
    }
  };

  const inputCls = 'w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800';
  const labelCls = 'text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-stone-800">
          <div>
            <h2 className="text-xl font-bold">Cobee · carga mensual</h2>
            <p className="text-xs text-slate-500 mt-0.5">Se registra sola como ingreso el día 1 de cada mes marcado.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-stone-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}><Utensils className="w-3 h-3 inline mr-1" />Comida (€/mes)</label>
              <input type="number" step="0.01" min="0" value={comida} onChange={(e) => setComida(e.target.value)} className={inputCls} />
              {usoMedio.comida !== null && (
                <p className="text-[11px] text-slate-400 mt-1">Uso medio: {formatAmount(usoMedio.comida)} €/mes</p>
              )}
            </div>
            <div>
              <label className={labelCls}><Bus className="w-3 h-3 inline mr-1" />Transporte (€/mes)</label>
              <input type="number" step="0.01" min="0" value={transporte} onChange={(e) => setTransporte(e.target.value)} className={inputCls} />
              {usoMedio.transporte !== null && (
                <p className="text-[11px] text-slate-400 mt-1">Uso medio: {formatAmount(usoMedio.transporte)} €/mes</p>
              )}
            </div>
          </div>

          <div>
            <label className={labelCls}>Meses con carga</label>
            <div className="grid grid-cols-6 gap-1.5">
              {MESES_CORTOS.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMeses(meses.map((v, j) => (j === i ? (v ? 0 : 1) : v)))}
                  className={`py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    meses[i]
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'border-slate-200 dark:border-stone-700 text-slate-500'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">Desmarca los meses sin carga (vacaciones). {numMeses} meses marcados.</p>
          </div>

          <div>
            <label className={labelCls}>Primer mes de carga</label>
            <input type="month" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className={inputCls} />
            <p className="text-[11px] text-slate-400 mt-1">Se crean las cargas desde este mes hasta hoy (las que falten).</p>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-stone-800 p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Total mensual</span><b>{formatAmount(totalMensual)} €</b></div>
            <div className="flex justify-between"><span className="text-slate-500">Total anual previsto</span><b>{formatAmount(totalMensual * numMeses)} €</b></div>
          </div>

          {sobranteTransporte !== null && sobranteTransporte > 20 && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 p-3 text-xs text-amber-800 dark:text-amber-300 flex gap-2">
              <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                En transporte sobran ~{formatAmount(sobranteTransporte)} €/mes (~{formatAmount(sobranteTransporte * numMeses)} €/año).
                Es sueldo que no puedes usar libremente: valora ajustar el importe en Cobee.
              </span>
            </div>
          )}

          <p className="text-[11px] text-slate-400">
            Los cambios de importe se aplican a las próximas cargas. Una carga ya registrada puedes editarla desde Movimientos.
          </p>

          {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancelar
            </button>
            <button type="button" onClick={guardar} disabled={guardando} className="flex-1 px-6 py-2.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60">
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CobeeConfigModal;
