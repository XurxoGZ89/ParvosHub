import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../lib/api';

const mesKeys = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const categorias = ['Vacaciones', 'Ocio', 'Hogar', 'Movilidad', 'Deporte', 'Extra', 'Alimentación'];

// Helper para convertir categoría español a clave de traducción
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
  'Vacaciones': '#FF9500',     // Naranja Apple
  'Ocio': '#FF3B30',           // Rojo Apple
  'Hogar': '#34C759',          // Verde Apple
  'Movilidad': '#007AFF',      // Azul Apple
  'Deporte': '#5AC8FA',        // Azul Claro Apple
  'Extra': '#AF52DE',          // Púrpura Apple
  'Alimentación': '#FFB400'    // Amarillo Apple
};

// Función para formatear moneda al formato europeo
const formatearMoneda = (numero) => {
  const formateado = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numero);
  
  // Si termina en ",00", quitar los ceros
  if (formateado.endsWith(',00')) {
    return formateado.slice(0, -3);
  }
  return formateado;
};

const ResumenAnual = ({ onBack }) => {
  const { t } = useLanguage();
  const [operaciones, setOperaciones] = useState([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [datosTabulares, setDatosTabulares] = useState([]);
  const [datosMensuales, setDatosMensuales] = useState([]);
  const [aniosDisponibles, setAniosDisponibles] = useState([]);

  const cargarOperaciones = useCallback(async () => {
    try {
      const res = await api.get('/operaciones');
      const filtradas = res.data.filter(op => {
        if (!op.fecha) return false;
        const fecha = new Date(op.fecha);
        return fecha.getFullYear() >= 2025;
      });
      setOperaciones(filtradas);

      // Obtener años disponibles
      const anios = Array.from(
        new Set(
          filtradas
            .filter(op => op.fecha)
            .map(op => new Date(op.fecha).getFullYear())
        )
      ).sort((a, b) => b - a);
      setAniosDisponibles(anios);
    } catch (err) {
      console.error(t('errorCargarOperaciones') + ':', err);
    }
  }, [t]);

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
      if (!op.fecha || op.tipo === 'hucha' || op.tipo === 'retirada-hucha') return;
      const fecha = new Date(op.fecha);
      if (fecha.getFullYear() !== anioSeleccionado) return;

      const mesIndex = fecha.getMonth();
      const cantidad = Number(op.cantidad);

      if (op.tipo === 'ingreso') {
        datos[mesIndex]['ingreso'] += cantidad;
      } else if (op.tipo === 'gasto' && op.categoria) {
        datos[mesIndex][op.categoria] = (datos[mesIndex][op.categoria] || 0) + cantidad;
        datos[mesIndex]['Total'] += cantidad;
      }
    });

    setDatosTabulares(datos);
    // Preparar datos para el gráfico
    setDatosMensuales(datos.map(d => ({
      mes: mesKeys[d.mesNum - 1],
      mesNum: d.mesNum,
      'Vacaciones': d['Vacaciones'],
      'Ocio': d['Ocio'],
      'Hogar': d['Hogar'],
      'Movilidad': d['Movilidad'],
      'Deporte': d['Deporte'],
      'Extra': d['Extra'],
      'Alimentación': d['Alimentación'],
      'ingreso': d['ingreso'],
      'Total': d['Total']
    })));
  }, [operaciones, anioSeleccionado]);

  useEffect(() => {
    cargarOperaciones();
  }, [cargarOperaciones]);

  useEffect(() => {
    procesarDatos();
  }, [procesarDatos]);

  // Calcular totales por columna
  const totalesPorCategoria = categorias.reduce((acc, cat) => {
    acc[cat] = datosTabulares.reduce((sum, mes) => sum + (Number(mes[cat]) || 0), 0);
    return acc;
  }, {});

  const totalIngresos = datosTabulares.reduce((sum, mes) => sum + (Number(mes['ingreso']) || 0), 0);
  const totalGastos = datosTabulares.reduce((sum, mes) => sum + (Number(mes['Total']) || 0), 0);
  const diferencia = totalIngresos - totalGastos;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-stone-950 p-4 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Título y navegación */}
        <div className="flex items-center justify-between mb-6 lg:mb-10 flex-wrap gap-4">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">
            {t('resumenDelAno')}
          </h1>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-stone-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('volver')}
            </button>
          </div>
        </div>

        {/* Selector de año */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <button 
            onClick={() => {
              const currentIndex = aniosDisponibles.indexOf(anioSeleccionado);
              if (currentIndex < aniosDisponibles.length - 1) {
                setAnioSeleccionado(aniosDisponibles[currentIndex + 1]);
              }
            }}
            disabled={aniosDisponibles.indexOf(anioSeleccionado) === aniosDisponibles.length - 1}
            className="p-2 bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-lg hover:bg-slate-50 dark:hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
          
          <select 
            value={anioSeleccionado} 
            onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
            className="px-4 py-2 bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 transition-all focus:ring-2 focus:ring-purple-500/20"
          >
            {aniosDisponibles.map(anio => (
              <option key={anio} value={anio}>{anio}</option>
            ))}
          </select>
          
          <button 
            onClick={() => {
              const currentIndex = aniosDisponibles.indexOf(anioSeleccionado);
              if (currentIndex > 0) {
                setAnioSeleccionado(aniosDisponibles[currentIndex - 1]);
              }
            }}
            disabled={aniosDisponibles.indexOf(anioSeleccionado) === 0}
            className="p-2 bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-lg hover:bg-slate-50 dark:hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
        </div>

        {/* Gráfico de Resumen Anual */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl lg:rounded-3xl p-6 lg:p-10 shadow-sm border border-slate-200 dark:border-stone-800 mb-8">
          <h2 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-8 text-center">
            📈 {t('resumenDelAno')}
          </h2>

          {datosMensuales.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart
                  data={datosMensuales.map(d => ({
                    ...d,
                    mes: `${t(mesKeys[d.mesNum - 1]).substring(0, 3)}`
                  }))}
                  margin={{ top: 20, right: 30, bottom: 20, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-stone-800" />
                  <XAxis dataKey="mes" tick={{ fontSize: 13, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 13, fill: '#64748b' }} />
                  <Tooltip 
                    formatter={v => `${formatearMoneda(v)} €`} 
                    contentStyle={{ 
                      borderRadius: 12, 
                      border: 'none', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      backgroundColor: '#fff'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="Vacaciones" stackId="a" fill={colorsPorCategoria['Vacaciones']} radius={[8, 8, 0, 0]} name={t('vacaciones')} />
                  <Bar dataKey="Ocio" stackId="a" fill={colorsPorCategoria['Ocio']} name={t('ocio')} />
                  <Bar dataKey="Hogar" stackId="a" fill={colorsPorCategoria['Hogar']} name={t('hogar')} />
                  <Bar dataKey="Movilidad" stackId="a" fill={colorsPorCategoria['Movilidad']} name={t('movilidad')} />
                  <Bar dataKey="Deporte" stackId="a" fill={colorsPorCategoria['Deporte']} name={t('deporte')} />
                  <Bar dataKey="Extra" stackId="a" fill={colorsPorCategoria['Extra']} name={t('extra')} />
                  <Bar dataKey="Alimentación" stackId="a" fill={colorsPorCategoria['Alimentación']} name={t('alimentacion')} />
                </BarChart>
              </ResponsiveContainer>

              {/* Resumen de totales del gráfico */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 mt-8">
                {['Vacaciones', 'Ocio', 'Hogar', 'Movilidad', 'Deporte', 'Extra', 'Alimentación'].map(categoria => {
                  const total = datosMensuales.reduce((sum, mes) => sum + mes[categoria], 0);
                  const porcentaje = totalGastos > 0 ? ((total / totalGastos) * 100).toFixed(1) : 0;
                  return (
                    <div 
                      key={categoria} 
                      className="bg-slate-50 dark:bg-stone-800 rounded-xl p-4 text-center border-l-4 hover:bg-slate-100 dark:hover:bg-stone-700 transition-all hover:-translate-y-1"
                      style={{ borderLeftColor: colorsPorCategoria[categoria] }}
                    >
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 tracking-wide uppercase">
                        {t(categoriaToKey[categoria])}
                      </div>
                      <div className="text-2xl lg:text-3xl font-bold mb-2" style={{ color: colorsPorCategoria[categoria] }}>
                        {formatearMoneda(total)} €
                      </div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-500">
                        {porcentaje}% del total
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-slate-400 dark:text-slate-600">
              <p className="text-base">Sin datos disponibles para este año</p>
            </div>
          )}
        </div>

        {/* Tabla de datos anuales */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-200 dark:border-stone-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-stone-800">
                  <th className="px-3 lg:px-4 py-4 border-b border-slate-200 dark:border-stone-700 font-semibold text-left text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wide">
                    MES
                  </th>
                  {categorias.map(cat => (
                    <th 
                      key={cat}
                      className="px-3 lg:px-4 py-4 border-b border-slate-200 dark:border-stone-700 font-semibold text-center text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wide"
                    >
                      {t(categoriaToKey[cat])}
                    </th>
                  ))}
                  <th className="px-3 lg:px-4 py-4 border-b border-slate-200 dark:border-stone-700 font-semibold text-center text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wide">
                    TOTAL
                  </th>
                  <th className="px-3 lg:px-4 py-4 border-b border-slate-200 dark:border-stone-700 font-semibold text-center text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wide">
                    SALDO
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-stone-800">
                {datosTabulares.map((mes, idx) => (
                  <tr key={mes.mes} className="hover:bg-slate-50 dark:hover:bg-stone-800/50 transition-colors">
                    <td className="px-3 lg:px-4 py-3.5 text-left text-slate-900 dark:text-slate-100 font-medium">
                      {t(mes.mes)}
                    </td>
                    {categorias.map(cat => (
                      <td 
                        key={`${mes.mes}-${cat}`}
                        className={`px-3 lg:px-4 py-3.5 text-right ${
                          mes[cat] > 0 
                            ? 'text-slate-900 dark:text-slate-100 font-medium' 
                            : 'text-slate-400 dark:text-slate-600'
                        }`}
                      >
                        {mes[cat] > 0 ? `${formatearMoneda(mes[cat])} €` : '-'}
                      </td>
                    ))}
                    <td className="px-3 lg:px-4 py-3.5 text-right font-semibold text-red-500 dark:text-red-400">
                      {formatearMoneda(mes['Total'])} €
                    </td>
                    <td className={`px-3 lg:px-4 py-3.5 text-right font-semibold ${
                      (mes['ingreso'] - mes['Total']) >= 0 
                        ? 'text-emerald-500 dark:text-emerald-400' 
                        : 'text-red-500 dark:text-red-400'
                    }`}>
                      {formatearMoneda(mes['ingreso'] - mes['Total'])} €
                    </td>
                  </tr>
                ))}
                {/* Fila de totales */}
                <tr className="bg-slate-50 dark:bg-stone-800 border-t-2 border-slate-300 dark:border-stone-700">
                  <td className="px-3 lg:px-4 py-4 font-bold text-left text-slate-900 dark:text-slate-100 uppercase text-xs tracking-wide">
                    TOTALES
                  </td>
                  {categorias.map(cat => (
                    <td 
                      key={`total-${cat}`}
                      className="px-3 lg:px-4 py-4 text-right font-bold text-slate-900 dark:text-slate-100"
                    >
                      {formatearMoneda(totalesPorCategoria[cat])} €
                    </td>
                  ))}
                  <td className="px-3 lg:px-4 py-4 text-right font-bold text-slate-900 dark:text-slate-100">
                    {formatearMoneda(totalGastos)} €
                  </td>
                  <td className={`px-3 lg:px-4 py-4 text-right font-bold ${
                    diferencia >= 0 
                      ? 'text-emerald-500 dark:text-emerald-400' 
                      : 'text-red-500 dark:text-red-400'
                  }`}>
                    {formatearMoneda(diferencia)} €
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
