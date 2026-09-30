import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, BarChart3, ArrowUpRight, ArrowDownRight, Minus, Wallet, CreditCard, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import usePrivacyStore from '../../stores/privacyStore';
import useAuthStore from '../../stores/authStore';
import api from '../../lib/api';
import { esCobee, tieneCobee, getCuentasSaldo } from '../../config/cuentasPersonales';

const mesKeys = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Categorías de la cuenta personal (mismas que en Mi Cuenta Personal)
const categorias = ['Alimentación', 'Ocio', 'Hogar', 'Alquiler', 'Extra', 'Recibos', 'Movilidad'];

const colorsPorCategoria = {
  'Alimentación': '#FBBF24', // amber-400
  'Ocio': '#F87171',         // red-400
  'Hogar': '#6EE7B7',        // emerald-300
  'Alquiler': '#818CF8',     // indigo-400
  'Extra': '#A78BFA',        // purple-400
  'Recibos': '#94A3B8',      // slate-400
  'Movilidad': '#60A5FA'     // blue-400
};

const tipoEnToEs = (tipo) => {
  const map = { expense: 'gasto', income: 'ingreso', savings: 'hucha', savings_withdrawal: 'retirada-hucha' };
  return map[tipo] || tipo;
};

const formatearMoneda = (numero) => {
  const formateado = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true
  }).format(numero);
  return formateado.endsWith(',00') ? formateado.slice(0, -3) : formateado;
};

// Fecha 'YYYY-MM-DD...' -> { y, m } sin problemas de zona horaria
const parseFecha = (date) => {
  const str = String(date);
  const match = str.match(/^(\d{4})-(\d{2})/);
  if (match) return { y: Number(match[1]), m: Number(match[2]) - 1 };
  const d = new Date(date);
  return { y: d.getFullYear(), m: d.getMonth() };
};

const CustomTooltip = ({ active, payload, label, hiddenNumbers }) => {
  if (!active || !payload || !payload.length) return null;
  const total = payload.reduce((sum, p) => sum + (p.value || 0), 0);
  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl border border-slate-200 dark:border-stone-700 shadow-lg p-3 min-w-[160px]">
      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2 border-b border-slate-100 dark:border-stone-700 pb-1.5">{label}</p>
      {payload.filter(p => p.value > 0).map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-[11px] text-slate-600 dark:text-slate-400">{p.name}</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
            {hiddenNumbers ? '•••' : `${formatearMoneda(p.value)} €`}
          </span>
        </div>
      ))}
      <div className="flex items-center justify-between gap-4 pt-1.5 mt-1 border-t border-slate-100 dark:border-stone-700">
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Total</span>
        <span className="text-[11px] font-bold text-slate-900 dark:text-white">
          {hiddenNumbers ? '•••' : `${formatearMoneda(total)} €`}
        </span>
      </div>
    </div>
  );
};

const ResumenAnualUsuario = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { hiddenNumbers } = usePrivacyStore();
  const { user } = useAuthStore();
  const conCobee = tieneCobee(user?.username);
  const cuentasDinero = useMemo(() => getCuentasSaldo(user?.username), [user?.username]);
  const nombreUsuario = user?.username === 'xurxo' ? 'Xurxo' : 'Sonia';

  const [operaciones, setOperaciones] = useState([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [aniosDisponibles, setAniosDisponibles] = useState([new Date().getFullYear()]);
  const [cargando, setCargando] = useState(true);

  const cargarOperaciones = useCallback(async () => {
    try {
      setCargando(true);
      const res = await api.get('/api/user/operations');
      const ops = (res.data || []).map(op => ({ ...op, type: tipoEnToEs(op.type) }));
      setOperaciones(ops);
      const anios = Array.from(new Set([
        new Date().getFullYear(),
        ...ops.filter(op => op.date).map(op => parseFecha(op.date).y)
      ])).filter(a => a >= 2024).sort((a, b) => b - a);
      setAniosDisponibles(anios);
    } catch (err) {
      console.error('Error al cargar operaciones personales:', err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarOperaciones();
  }, [cargarOperaciones]);

  // Datos por mes del año seleccionado
  const datos = useMemo(() => {
    const filas = mesKeys.map((mesKey, i) => ({
      mes: mesKey,
      mesNum: i + 1,
      ...Object.fromEntries(categorias.map(c => [c, 0])),
      ingreso: 0,
      ingresoCobee: 0,
      gastoCobee: 0,
      ahorro: 0,
      Total: 0
    }));

    operaciones.forEach(op => {
      if (!op.date) return;
      const { y, m } = parseFecha(op.date);
      if (y !== anioSeleccionado) return;
      const fila = filas[m];
      const cantidad = parseFloat(op.amount || 0);

      if (op.type === 'ingreso') {
        // Ingresos: dinero + Cobee (en especie)
        fila.ingreso += cantidad;
        if (esCobee(op.account_name)) fila.ingresoCobee += cantidad;
      } else if (op.type === 'retirada-hucha' && cuentasDinero.includes(op.account_name)) {
        // Igual que en la cuenta personal: las retiradas a cuentas de dinero cuentan como ingreso
        fila.ingreso += cantidad;
      } else if (op.type === 'gasto') {
        const cat = categorias.includes(op.category) ? op.category : 'Extra';
        fila[cat] += cantidad;
        fila.Total += cantidad;
        if (esCobee(op.account_name)) fila.gastoCobee += cantidad;
      } else if (op.type === 'hucha' && (op.account_name === 'Ahorro' || op.account_name === null)) {
        fila.ahorro += cantidad;
      }
    });

    return filas;
  }, [operaciones, anioSeleccionado, cuentasDinero]);

  const sum = (key) => datos.reduce((s, d) => s + (Number(d[key]) || 0), 0);
  const totalIngresos = sum('ingreso');
  const totalGastos = sum('Total');
  const totalIngresosCobee = sum('ingresoCobee');
  const totalGastosCobee = sum('gastoCobee');
  const totalAhorro = sum('ahorro');
  const diferencia = totalIngresos - totalGastos;
  const totalesPorCategoria = Object.fromEntries(categorias.map(c => [c, sum(c)]));

  const mesesConDatos = datos.filter(m => m.Total > 0).length;
  const mediaMensual = mesesConDatos > 0 ? totalGastos / mesesConDatos : 0;
  const mesMasGasto = datos.reduce((max, d) => (d.Total > (max?.Total || 0) ? d : max), null);
  const categoriaMasGasto = categorias.reduce((max, c) => (totalesPorCategoria[c] > (max ? totalesPorCategoria[max] : 0) ? c : max), null);
  const tasaAhorro = totalIngresos > 0 ? (diferencia / totalIngresos) * 100 : 0;
  const aprovechamientoCobee = totalIngresosCobee > 0 ? (totalGastosCobee / totalIngresosCobee) * 100 : 0;

  const money = (v) => (hiddenNumbers ? '•••' : formatearMoneda(v));

  const cambiarAnio = (direccion) => {
    const idx = aniosDisponibles.indexOf(anioSeleccionado);
    const nuevo = idx - direccion;
    if (nuevo >= 0 && nuevo < aniosDisponibles.length) setAnioSeleccionado(aniosDisponibles[nuevo]);
  };

  const cardCls = 'bg-white dark:bg-stone-900 p-2.5 lg:p-3 rounded-2xl border border-slate-200 dark:border-stone-800 shadow-sm';
  const eyebrow = 'text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest';
  const thCls = 'px-2 lg:px-3 py-3.5 border-b border-slate-200 dark:border-stone-700 font-bold text-right text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest';

  return (
    <div className="pb-8 lg:p-8 lg:space-y-8">
      {/* Header con selector de año */}
      <div className="sticky top-0 z-30 bg-white dark:bg-stone-950 lg:bg-transparent lg:relative p-4 lg:p-0 border-b lg:border-0 border-slate-200 dark:border-stone-800">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-4">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight flex items-center gap-2 lg:order-1">
            <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" />
            {t('resumenAnual') || 'Resumen Anual'} - {nombreUsuario}
          </h1>
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-stone-900 p-1.5 rounded-xl shadow-sm lg:order-2 lg:mx-auto">
            <button
              onClick={() => cambiarAnio(-1)}
              disabled={aniosDisponibles.indexOf(anioSeleccionado) === aniosDisponibles.length - 1}
              className="p-2.5 hover:bg-white dark:hover:bg-stone-800 rounded-lg transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-6 py-2 text-sm lg:text-base font-bold whitespace-nowrap min-w-[100px] text-center">{anioSeleccionado}</div>
            <button
              onClick={() => cambiarAnio(1)}
              disabled={aniosDisponibles.indexOf(anioSeleccionado) === 0}
              className="p-2.5 hover:bg-white dark:hover:bg-stone-800 rounded-lg transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="lg:order-3 lg:w-[120px] flex lg:justify-end">
            <button
              onClick={() => navigate('/user-account')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" />
              Mi cuenta
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 lg:gap-6 p-4 lg:p-0">
        <div className={`col-span-1 lg:col-span-3 ${cardCls}`}>
          <div className="flex items-center justify-between mb-1">
            <p className={eyebrow}>Ingresos</p>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <h3 className="text-lg lg:text-2xl font-extrabold text-emerald-500">{money(totalIngresos)} €</h3>
          {conCobee && totalIngresosCobee > 0 ? (
            <p className="text-[10px] lg:text-xs text-purple-600 dark:text-purple-400 mt-0.5 font-semibold">
              de ellos Cobee: {money(totalIngresosCobee)} €
            </p>
          ) : (
            <p className="text-[10px] lg:text-xs text-slate-400 mt-0.5">{anioSeleccionado}</p>
          )}
        </div>

        <div className={`col-span-1 lg:col-span-3 ${cardCls}`}>
          <div className="flex items-center justify-between mb-1">
            <p className={eyebrow}>Gastos</p>
            <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
          </div>
          <h3 className="text-lg lg:text-2xl font-extrabold text-red-500">{money(totalGastos)} €</h3>
          <p className="text-[10px] lg:text-xs text-slate-400 mt-0.5">Media: {money(mediaMensual)} €/mes</p>
        </div>

        <div className={`col-span-1 lg:col-span-3 p-2.5 lg:p-3 rounded-2xl border shadow-sm text-white ${
          diferencia >= 0
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400/30'
            : 'bg-gradient-to-br from-red-500 to-orange-600 border-red-400/30'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest opacity-90">Resultado</p>
            {diferencia >= 0 ? <TrendingUp className="w-3.5 h-3.5 opacity-80" /> : <TrendingDown className="w-3.5 h-3.5 opacity-80" />}
          </div>
          <h3 className="text-lg lg:text-2xl font-extrabold">{diferencia > 0 ? '+' : ''}{money(diferencia)} €</h3>
          <p className="text-[10px] lg:text-xs opacity-80 mt-0.5">
            {totalIngresos > 0 ? `${tasaAhorro.toFixed(1)}% de los ingresos` : `${diferencia >= 0 ? 'Superávit' : 'Déficit'} en ${anioSeleccionado}`}
          </p>
        </div>

        <div className={`col-span-1 lg:col-span-3 ${cardCls}`}>
          <div className="flex items-center justify-between mb-1">
            <p className={eyebrow}>Highlights</p>
            <Wallet className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="space-y-1">
            {mesMasGasto && mesMasGasto.Total > 0 && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] lg:text-xs text-slate-500">Mes pico</span>
                <span className="text-[10px] lg:text-xs font-bold text-slate-800 dark:text-slate-200 text-right">
                  {t(mesMasGasto.mes)} ({money(mesMasGasto.Total)} €)
                </span>
              </div>
            )}
            {categoriaMasGasto && totalesPorCategoria[categoriaMasGasto] > 0 && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] lg:text-xs text-slate-500">Mayor gasto</span>
                <span className="text-[10px] lg:text-xs font-bold text-slate-800 dark:text-slate-200">{categoriaMasGasto}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] lg:text-xs text-slate-500">A la hucha</span>
              <span className="text-[10px] lg:text-xs font-bold text-emerald-600">{money(totalAhorro)} €</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] lg:text-xs text-slate-500">Meses con datos</span>
              <span className="text-[10px] lg:text-xs font-bold text-slate-800 dark:text-slate-200">{mesesConDatos}/12</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cobee del año */}
      {conCobee && totalIngresosCobee > 0 && (
        <div className="p-4 lg:p-0">
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40 rounded-2xl p-4 lg:p-5 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-8">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <span className="font-bold text-sm">Cobee {anioSeleccionado}</span>
              <span className="text-[8px] font-extrabold tracking-wider px-1.5 py-0.5 rounded-full bg-purple-600 text-white">EN ESPECIE</span>
            </div>
            <div className="grid grid-cols-3 gap-3 flex-1 text-sm">
              <div><p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Cargado</p><p className="font-extrabold">{money(totalIngresosCobee)} €</p></div>
              <div><p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Usado</p><p className="font-extrabold">{money(totalGastosCobee)} €</p></div>
              <div><p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">No usado (se pierde)</p><p className="font-extrabold text-purple-600">{money(totalIngresosCobee - totalGastosCobee)} €</p></div>
            </div>
            <div className="lg:w-56">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                <span>Aprovechado</span><span>{aprovechamientoCobee.toFixed(0)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white dark:bg-stone-800 overflow-hidden">
                <div className="h-full rounded-full bg-purple-600" style={{ width: `${Math.min(100, aprovechamientoCobee)}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico */}
      <div className="p-4 lg:p-0">
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 lg:p-8 border border-slate-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm lg:text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Gastos Mensuales por Categoría ({nombreUsuario})
            </h2>
            <span className="text-[9px] lg:text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{anioSeleccionado}</span>
          </div>

          {cargando ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : totalGastos > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart
                  data={datos.map(d => ({ ...d, mesLabel: (t(d.mes) || d.mes).substring(0, 3) }))}
                  margin={{ top: 10, right: 10, bottom: 10, left: -10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-stone-800" />
                  <XAxis dataKey="mesLabel" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => (hiddenNumbers ? '•••' : `${v}€`)} />
                  <Tooltip content={<CustomTooltip hiddenNumbers={hiddenNumbers} />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} iconType="circle" iconSize={8} />
                  {categorias.map((cat, i) => (
                    <Bar
                      key={cat}
                      dataKey={cat}
                      stackId="a"
                      fill={colorsPorCategoria[cat]}
                      name={cat}
                      radius={i === categorias.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 lg:gap-3 mt-6">
                {categorias.map(cat => {
                  const total = totalesPorCategoria[cat];
                  const pct = totalGastos > 0 ? ((total / totalGastos) * 100).toFixed(1) : 0;
                  return (
                    <div
                      key={cat}
                      className="bg-slate-50 dark:bg-stone-800 rounded-xl p-3 text-center border-l-4 hover:bg-slate-100 dark:hover:bg-stone-700 transition-all hover:-translate-y-0.5"
                      style={{ borderLeftColor: colorsPorCategoria[cat] }}
                    >
                      <div className="text-[9px] lg:text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 tracking-wide uppercase">{cat}</div>
                      <div className="text-base lg:text-lg font-extrabold mb-0.5" style={{ color: colorsPorCategoria[cat] }}>{money(total)} €</div>
                      <div className="text-[9px] lg:text-[10px] font-semibold text-slate-400 dark:text-slate-500">{pct}%</div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-slate-400 dark:text-slate-600">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Sin gastos registrados en {anioSeleccionado}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabla anual */}
      <div className="p-4 lg:p-0">
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-slate-200 dark:border-stone-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-stone-800">
                  <th className={`${thCls} text-left px-3 lg:px-4`}>Mes</th>
                  <th className={thCls}>Ingresos</th>
                  {categorias.map(cat => (
                    <th key={cat} className={thCls}>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: colorsPorCategoria[cat] }} />
                        {cat}
                      </span>
                    </th>
                  ))}
                  <th className={thCls}>Gastos</th>
                  <th className={thCls}>Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-stone-800">
                {datos.map(mes => {
                  const saldo = mes.ingreso - mes.Total;
                  const tieneDatos = mes.Total > 0 || mes.ingreso !== 0;
                  return (
                    <tr key={mes.mes} className={`transition-colors ${tieneDatos ? 'hover:bg-slate-50 dark:hover:bg-stone-800/50' : 'opacity-50'}`}>
                      <td className="px-3 lg:px-4 py-3 text-left text-slate-800 dark:text-slate-200 font-semibold text-xs capitalize">{t(mes.mes) || mes.mes}</td>
                      <td className="px-2 lg:px-3 py-3 text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {mes.ingreso !== 0 ? (
                          <span title={mes.ingresoCobee > 0 ? `Incluye ${formatearMoneda(mes.ingresoCobee)} € de Cobee` : undefined}>
                            {money(mes.ingreso)} €{mes.ingresoCobee > 0 && <span className="text-purple-500">*</span>}
                          </span>
                        ) : '–'}
                      </td>
                      {categorias.map(cat => (
                        <td key={cat} className={`px-2 lg:px-3 py-3 text-right text-xs ${mes[cat] > 0 ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-slate-300 dark:text-stone-700'}`}>
                          {mes[cat] > 0 ? `${money(mes[cat])} €` : '–'}
                        </td>
                      ))}
                      <td className="px-2 lg:px-3 py-3 text-right text-xs font-bold text-red-500 dark:text-red-400">
                        {mes.Total > 0 ? `${money(mes.Total)} €` : '–'}
                      </td>
                      <td className={`px-2 lg:px-3 py-3 text-right text-xs font-bold ${
                        saldo > 0 ? 'text-emerald-500 dark:text-emerald-400' : saldo < 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-600'
                      }`}>
                        {tieneDatos ? (
                          <span className="inline-flex items-center gap-0.5 justify-end">
                            {saldo > 0 && <ArrowUpRight className="w-3 h-3" />}
                            {saldo < 0 && <ArrowDownRight className="w-3 h-3" />}
                            {saldo === 0 && <Minus className="w-3 h-3" />}
                            {money(saldo)} €
                          </span>
                        ) : '–'}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50 dark:bg-stone-800 border-t-2 border-slate-300 dark:border-stone-600">
                  <td className="px-3 lg:px-4 py-3.5 font-bold text-left text-slate-800 dark:text-slate-100 text-[10px] uppercase tracking-widest">Totales</td>
                  <td className="px-2 lg:px-3 py-3.5 text-right font-bold text-xs text-emerald-600 dark:text-emerald-400">{money(totalIngresos)} €</td>
                  {categorias.map(cat => (
                    <td key={cat} className="px-2 lg:px-3 py-3.5 text-right font-bold text-xs text-slate-800 dark:text-slate-100">{money(totalesPorCategoria[cat])} €</td>
                  ))}
                  <td className="px-2 lg:px-3 py-3.5 text-right font-bold text-xs text-red-600 dark:text-red-400">{money(totalGastos)} €</td>
                  <td className={`px-2 lg:px-3 py-3.5 text-right font-bold text-xs ${diferencia >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {diferencia > 0 ? '+' : ''}{money(diferencia)} €
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {conCobee && totalIngresosCobee > 0 && (
            <p className="px-4 py-2.5 text-[11px] text-slate-400 border-t border-slate-100 dark:border-stone-800">
              <span className="text-purple-500">*</span> Incluye la carga de Cobee (retribución en especie). Los gastos pagados con Cobee están incluidos en su categoría.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumenAnualUsuario;
