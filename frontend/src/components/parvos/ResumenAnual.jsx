import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, BarChart3, ArrowUpRight, ArrowDownRight, Minus, Wallet } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import usePrivacyStore from '../../stores/privacyStore';
import api from '../../lib/api';

const mesKeys = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const categorias = ['Vacaciones', 'Ocio', 'Hogar', 'Movilidad', 'Deporte', 'Extra', 'Alimentación'];

const categoriaToKey = {
  'Vacaciones': 'vacaciones',
  'Ocio': 'ocio',
  'Hogar': 'hogar',
  'Movilidad': 'movilidad',
  'Deporte': 'deporte',
  'Extra': 'extra',
  'Alimentación': 'alimentacion'
};

const colorsPorCategoria = {
  'Vacaciones': '#FB923C',      // orange-400
  'Ocio': '#F87171',            // red-400
  'Hogar': '#6EE7B7',           // emerald-400
  'Movilidad': '#60A5FA',       // blue-400
  'Deporte': '#06B6D4',         // cyan-400
  'Extra': '#A78BFA',           // purple-400
  'Alimentación': '#FBBF24'     // amber-400
};

const formatearMoneda = (numero) => {
  const formateado = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numero);
  if (formateado.endsWith(',00')) {
    return formateado.slice(0, -3);
  }
  return formateado;
};

// Tooltip personalizado para el gráfico
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

const ResumenAnual = () => {
  const { t } = useLanguage();
  const { hiddenNumbers } = usePrivacyStore();
  const [operaciones, setOperaciones] = useState([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [datosTabulares, setDatosTabulares] = useState([]);
  const [datosMensuales, setDatosMensuales] = useState([]);
  const [aniosDisponibles, setAniosDisponibles] = useState([]);
  const [mesMasGasto, setMesMasGasto] = useState(null);
  const [categoriaMasGasto, setCategoriaMasGasto] = useState(null);

  const cargarOperaciones = useCallback(async () => {
    try {
      const res = await api.get('/operaciones');
      const filtradas = res.data.filter(op => {
        if (!op.fecha) return false;
        const fecha = new Date(op.fecha);
        return fecha.getFullYear() >= 2025;
      });
      setOperaciones(filtradas);

      const anios = Array.from(
        new Set(
          filtradas
            .filter(op => op.fecha)
            .map(op => new Date(op.fecha).getFullYear())
        )
      ).sort((a, b) => b - a);
      setAniosDisponibles(anios);
    } catch (err) {
      console.error('Error al cargar operaciones:', err);
    }
  }, []);

  useEffect(() => {
    cargarOperaciones();
  }, [cargarOperaciones]);

  const procesarDatos = useCallback(() => {
    const datos = mesKeys.map((mesKey, mesIndex) => ({
      mes: mesKey,
      mesNum: mesIndex + 1,
      'Vacaciones': 0,
      'Ocio': 0,
      'Hogar': 0,
      'Movilidad': 0,
      'Deporte': 0,
      'Extra': 0,
      'Alimentación': 0,
      'ingreso': 0,
      'Total': 0
    }));

    operaciones.forEach(op => {
      if (!op.fecha || op.tipo === 'hucha') return;
      const fecha = new Date(op.fecha);
      if (fecha.getFullYear() !== anioSeleccionado) return;

      const mesIndex = fecha.getMonth();
      const cantidad = Number(op.cantidad);

      // INGRESOS: 'ingreso' o 'retirada-hucha' de BBVA/Imagin (igual que ParvosAccountV3)
      if (op.tipo === 'ingreso' || (op.tipo === 'retirada-hucha' && (op.cuenta === 'BBVA' || op.cuenta === 'Imagin'))) {
        datos[mesIndex]['ingreso'] += cantidad;
      } 
      // GASTOS: solo 'gasto'
      else if (op.tipo === 'gasto' && op.categoria) {
        datos[mesIndex][op.categoria] = (datos[mesIndex][op.categoria] || 0) + cantidad;
        datos[mesIndex]['Total'] += cantidad;
      }
    });

    // Mes con más gasto
    const mesMax = datos.reduce((max, d) => d['Total'] > (max?.['Total'] || 0) ? d : max, null);
    setMesMasGasto(mesMax);

    // Categoría con más gasto
    const totalsPorCat = categorias.map(cat => ({
      cat,
      total: datos.reduce((s, d) => s + (d[cat] || 0), 0)
    }));
    const catMax = totalsPorCat.reduce((max, c) => c.total > (max?.total || 0) ? c : max, null);
    setCategoriaMasGasto(catMax);

    setDatosTabulares(datos);
    setDatosMensuales(datos.map(d => ({
      ...d,
      mes: mesKeys[d.mesNum - 1],
    })));
  }, [operaciones, anioSeleccionado]);

  useEffect(() => {
    procesarDatos();
  }, [procesarDatos]);

  // Calcular totales
  const totalesPorCategoria = useMemo(() => categorias.reduce((acc, cat) => {
    acc[cat] = datosTabulares.reduce((sum, mes) => sum + (Number(mes[cat]) || 0), 0);
    return acc;
  }, {}), [datosTabulares]);

  const totalIngresos = useMemo(() => datosTabulares.reduce((sum, mes) => sum + (Number(mes['ingreso']) || 0), 0), [datosTabulares]);
  const totalGastos = useMemo(() => datosTabulares.reduce((sum, mes) => sum + (Number(mes['Total']) || 0), 0), [datosTabulares]);
  const diferencia = totalIngresos - totalGastos;

  // Media mensual de gastos
  const mesesConDatos = datosTabulares.filter(m => m['Total'] > 0).length;
  const mediaMensual = mesesConDatos > 0 ? totalGastos / mesesConDatos : 0;

  const cambiarAnio = (direccion) => {
    const currentIndex = aniosDisponibles.indexOf(anioSeleccionado);
    const newIndex = currentIndex - direccion;
    if (newIndex >= 0 && newIndex < aniosDisponibles.length) {
      setAnioSeleccionado(aniosDisponibles[newIndex]);
    }
  };

  return (
    <div className="pb-8 lg:p-8 lg:space-y-8">
      {/* Header con selector de año */}
      <div className="sticky top-0 z-30 bg-white dark:bg-stone-950 lg:bg-transparent lg:relative p-4 lg:p-0 border-b lg:border-0 border-slate-200 dark:border-stone-800">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-4">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight flex items-center gap-2 lg:order-1">
            <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" />
            {t('resumenAnual')} - Familiar
          </h1>
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-stone-900 p-1.5 rounded-xl shadow-sm lg:order-2 lg:mx-auto">
            <button
              onClick={() => cambiarAnio(-1)}
              disabled={aniosDisponibles.indexOf(anioSeleccionado) === aniosDisponibles.length - 1}
              className="p-2.5 hover:bg-white dark:hover:bg-stone-800 rounded-lg transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-6 py-2 text-sm lg:text-base font-bold whitespace-nowrap min-w-[100px] text-center">
              {anioSeleccionado}
            </div>
            <button
              onClick={() => cambiarAnio(1)}
              disabled={aniosDisponibles.indexOf(anioSeleccionado) === 0}
              className="p-2.5 hover:bg-white dark:hover:bg-stone-800 rounded-lg transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="hidden lg:block lg:order-3 lg:w-[120px]"></div>
        </div>
      </div>

      {/* Tarjetas de resumen rápido */}
      <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 lg:gap-6 p-4 lg:p-0">
        {/* Total Ingresos */}
        <div className="col-span-1 lg:col-span-3 bg-white dark:bg-stone-900 p-2.5 lg:p-3 rounded-2xl border border-slate-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ingresos</p>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <h3 className="text-lg lg:text-2xl font-extrabold text-emerald-500">
            {hiddenNumbers ? '•••' : formatearMoneda(totalIngresos)} €
          </h3>
          <p className="text-[10px] lg:text-xs text-slate-400 mt-0.5">
            {anioSeleccionado}
          </p>
        </div>

        {/* Total Gastos */}
        <div className="col-span-1 lg:col-span-3 bg-white dark:bg-stone-900 p-2.5 lg:p-3 rounded-2xl border border-slate-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gastos</p>
            <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
          </div>
          <h3 className="text-lg lg:text-2xl font-extrabold text-red-500">
            {hiddenNumbers ? '•••' : formatearMoneda(totalGastos)} €
          </h3>
          <p className="text-[10px] lg:text-xs text-slate-400 mt-0.5">
            Media: {hiddenNumbers ? '•••' : formatearMoneda(mediaMensual)} €/mes
          </p>
        </div>

        {/* Diferencia / Resultado */}
        <div className={`col-span-1 lg:col-span-3 p-2.5 lg:p-3 rounded-2xl border shadow-sm ${
          diferencia >= 0
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400/30 text-white'
            : 'bg-gradient-to-br from-red-500 to-orange-600 border-red-400/30 text-white'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest opacity-90">Resultado</p>
            {diferencia >= 0 ? <TrendingUp className="w-3.5 h-3.5 opacity-80" /> : <TrendingDown className="w-3.5 h-3.5 opacity-80" />}
          </div>
          <h3 className="text-lg lg:text-2xl font-extrabold">
            {diferencia > 0 ? '+' : ''}{hiddenNumbers ? '•••' : formatearMoneda(diferencia)} €
          </h3>
          <p className="text-[10px] lg:text-xs opacity-75 mt-0.5">
            {diferencia >= 0 ? 'Ahorrado' : 'Déficit'} en {anioSeleccionado}
          </p>
        </div>

        {/* Highlights */}
        <div className="col-span-1 lg:col-span-3 bg-white dark:bg-stone-900 p-2.5 lg:p-3 rounded-2xl border border-slate-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Highlights</p>
            <Wallet className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="space-y-1.5">
            {mesMasGasto && mesMasGasto['Total'] > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] lg:text-xs text-slate-500">Mes pico</span>
                <span className="text-[10px] lg:text-xs font-bold text-slate-800 dark:text-slate-200">
                  {t(mesMasGasto.mes)} ({hiddenNumbers ? '•••' : `${formatearMoneda(mesMasGasto['Total'])} €`})
                </span>
              </div>
            )}
            {categoriaMasGasto && categoriaMasGasto.total > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] lg:text-xs text-slate-500">Mayor gasto</span>
                <span className="text-[10px] lg:text-xs font-bold text-slate-800 dark:text-slate-200">
                  {t(categoriaToKey[categoriaMasGasto.cat])}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[10px] lg:text-xs text-slate-500">Meses con datos</span>
              <span className="text-[10px] lg:text-xs font-bold text-slate-800 dark:text-slate-200">{mesesConDatos}/12</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Resumen Anual */}
      <div className="p-4 lg:p-0">
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 lg:p-8 border border-slate-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm lg:text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Gastos Mensuales por Categoría (Familiar)
            </h2>
            <span className="text-[9px] lg:text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              {anioSeleccionado}
            </span>
          </div>

          {datosMensuales.length > 0 && totalGastos > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart
                  data={datosMensuales.map(d => ({
                    ...d,
                    mes: t(mesKeys[d.mesNum - 1]).substring(0, 3)
                  }))}
                  margin={{ top: 10, right: 10, bottom: 10, left: -10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-stone-800" />
                  <XAxis
                    dataKey="mesNum"
                    tick={{ fontSize: 11, fontWeight: 600 }}
                    className="text-slate-500 dark:text-slate-400"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="text-slate-400 dark:text-slate-500"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => hiddenNumbers ? '•••' : `${v}€`}
                  />
                  <Tooltip content={<CustomTooltip hiddenNumbers={hiddenNumbers} />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, fontWeight: 600 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  {categorias.map((cat, i) => (
                    <Bar
                      key={cat}
                      dataKey={cat}
                      stackId="a"
                      fill={colorsPorCategoria[cat]}
                      name={t(categoriaToKey[cat])}
                      radius={i === categorias.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>

              {/* Resumen de categorías */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 lg:gap-3 mt-6">
                {categorias.map(categoria => {
                  const total = datosMensuales.reduce((sum, mes) => sum + mes[categoria], 0);
                  const porcentaje = totalGastos > 0 ? ((total / totalGastos) * 100).toFixed(1) : 0;
                  return (
                    <div
                      key={categoria}
                      className="bg-slate-50 dark:bg-stone-800 rounded-xl p-3 text-center border-l-4 hover:bg-slate-100 dark:hover:bg-stone-700 transition-all hover:-translate-y-0.5"
                      style={{ borderLeftColor: colorsPorCategoria[categoria] }}
                    >
                      <div className="text-[9px] lg:text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 tracking-wide uppercase">
                        {t(categoriaToKey[categoria])}
                      </div>
                      <div className="text-base lg:text-lg font-extrabold mb-0.5" style={{ color: colorsPorCategoria[categoria] }}>
                        {hiddenNumbers ? '•••' : formatearMoneda(total)} €
                      </div>
                      <div className="text-[9px] lg:text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                        {porcentaje}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-slate-400 dark:text-slate-600">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Sin datos disponibles para {anioSeleccionado}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de datos anuales */}
      <div className="p-4 lg:p-0">
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-slate-200 dark:border-stone-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-stone-800">
                  <th className="px-3 lg:px-4 py-3.5 border-b border-slate-200 dark:border-stone-700 font-bold text-left text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest">
                    Mes
                  </th>
                  {categorias.map(cat => (
                    <th
                      key={cat}
                      className="px-2 lg:px-3 py-3.5 border-b border-slate-200 dark:border-stone-700 font-bold text-right text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest"
                    >
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: colorsPorCategoria[cat] }} />
                        {t(categoriaToKey[cat])}
                      </span>
                    </th>
                  ))}
                  <th className="px-2 lg:px-3 py-3.5 border-b border-slate-200 dark:border-stone-700 font-bold text-right text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest">
                    Total
                  </th>
                  <th className="px-2 lg:px-3 py-3.5 border-b border-slate-200 dark:border-stone-700 font-bold text-right text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest">
                    Saldo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-stone-800">
                {datosTabulares.map((mes) => {
                  const saldo = mes['ingreso'] - mes['Total'];
                  const tieneDatos = mes['Total'] > 0 || mes['ingreso'] > 0;
                  return (
                    <tr
                      key={mes.mes}
                      className={`transition-colors ${tieneDatos ? 'hover:bg-slate-50 dark:hover:bg-stone-800/50' : 'opacity-50'}`}
                    >
                      <td className="px-3 lg:px-4 py-3 text-left text-slate-800 dark:text-slate-200 font-semibold text-xs">
                        {t(mes.mes)}
                      </td>
                      {categorias.map(cat => (
                        <td
                          key={`${mes.mes}-${cat}`}
                          className={`px-2 lg:px-3 py-3 text-right text-xs ${
                            mes[cat] > 0
                              ? 'text-slate-800 dark:text-slate-200 font-semibold'
                              : 'text-slate-300 dark:text-stone-700'
                          }`}
                        >
                          {mes[cat] > 0 ? (hiddenNumbers ? '•••' : `${formatearMoneda(mes[cat])} €`) : '–'}
                        </td>
                      ))}
                      <td className="px-2 lg:px-3 py-3 text-right text-xs font-bold text-red-500 dark:text-red-400">
                        {mes['Total'] > 0 ? (hiddenNumbers ? '•••' : `${formatearMoneda(mes['Total'])} €`) : '–'}
                      </td>
                      <td className={`px-2 lg:px-3 py-3 text-right text-xs font-bold ${
                        saldo > 0
                          ? 'text-emerald-500 dark:text-emerald-400'
                          : saldo < 0
                          ? 'text-red-500 dark:text-red-400'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}>
                        {tieneDatos ? (
                          <span className="inline-flex items-center gap-0.5 justify-end">
                            {saldo > 0 && <ArrowUpRight className="w-3 h-3" />}
                            {saldo < 0 && <ArrowDownRight className="w-3 h-3" />}
                            {saldo === 0 && <Minus className="w-3 h-3" />}
                            {hiddenNumbers ? '•••' : `${formatearMoneda(saldo)} €`}
                          </span>
                        ) : '–'}
                      </td>
                    </tr>
                  );
                })}
                {/* Fila de totales */}
                <tr className="bg-slate-50 dark:bg-stone-800 border-t-2 border-slate-300 dark:border-stone-600">
                  <td className="px-3 lg:px-4 py-3.5 font-bold text-left text-slate-800 dark:text-slate-100 text-[10px] uppercase tracking-widest">
                    Totales
                  </td>
                  {categorias.map(cat => (
                    <td
                      key={`total-${cat}`}
                      className="px-2 lg:px-3 py-3.5 text-right font-bold text-xs text-slate-800 dark:text-slate-100"
                    >
                      {hiddenNumbers ? '•••' : `${formatearMoneda(totalesPorCategoria[cat])} €`}
                    </td>
                  ))}
                  <td className="px-2 lg:px-3 py-3.5 text-right font-bold text-xs text-red-600 dark:text-red-400">
                    {hiddenNumbers ? '•••' : `${formatearMoneda(totalGastos)} €`}
                  </td>
                  <td className={`px-2 lg:px-3 py-3.5 text-right font-bold text-xs ${
                    diferencia >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {hiddenNumbers ? '•••' : `${diferencia > 0 ? '+' : ''}${formatearMoneda(diferencia)} €`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumenAnual;
