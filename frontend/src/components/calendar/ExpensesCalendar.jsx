import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useCalendarEvents } from '../../contexts/CalendarEventsContext';
import { ChevronLeft, ChevronRight, Plus, X, Calendar, CalendarDays, AlertTriangle, TrendingUp, Clock, CheckCircle2, Repeat, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

// ─── Categorías ampliadas con iconos y colores ──────────────────────────
const CATEGORIAS = [
  { value: 'factura',      label: 'Factura',       emoji: '📄', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400', dot: 'bg-orange-500' },
  { value: 'suscripcion',  label: 'Suscripción',   emoji: '🔄', color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400', dot: 'bg-violet-500' },
  { value: 'seguro',       label: 'Seguro',        emoji: '🛡️', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  { value: 'impuesto',     label: 'Impuesto',      emoji: '🏛️', color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400', dot: 'bg-red-500' },
  { value: 'cumpleanos',   label: 'Cumpleaños',    emoji: '🎂', color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' },
  { value: 'viaje',        label: 'Viaje',         emoji: '✈️', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  { value: 'medico',       label: 'Médico',        emoji: '🏥', color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400', dot: 'bg-teal-500' },
  { value: 'educacion',    label: 'Educación',     emoji: '📚', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400', dot: 'bg-indigo-500' },
  { value: 'hogar',        label: 'Hogar',         emoji: '🏠', color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400', dot: 'bg-cyan-500' },
  { value: 'vehiculo',     label: 'Vehículo',      emoji: '🚗', color: 'bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400', dot: 'bg-slate-500' },
  { value: 'dia_especial', label: 'Día Especial',  emoji: '⭐', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
  { value: 'otro',         label: 'Otro',          emoji: '📌', color: 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400', dot: 'bg-gray-500' },
];

const getCategoriaInfo = (valor) => {
  const mapLegacy = {
    'Cumpleaños': 'cumpleanos', 'Seguro': 'seguro', 'Viaje': 'viaje', 'Día Especial': 'dia_especial',
  };
  const key = mapLegacy[valor] || valor;
  return CATEGORIAS.find(c => c.value === key) || CATEGORIAS[CATEGORIAS.length - 1];
};

const TIPOS_RECURRENCIA = [
  { value: 'unica',      label: 'Una vez',         icon: '📍' },
  { value: 'mensual',    label: 'Mensual',         icon: '🔁' },
  { value: 'trimestral', label: 'Trimestral',      icon: '📅' },
  { value: 'semestral',  label: 'Semestral',       icon: '📅' },
  { value: 'anual',      label: 'Anual',           icon: '🗓️' },
  { value: 'cadaX',      label: 'Personalizado',   icon: '⚙️' },
];

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DIAS_POR_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const esAnoBisiesto = (a) => (a % 4 === 0 && a % 100 !== 0) || (a % 400 === 0);
const diasEnMes = (m, a) => m === 1 && esAnoBisiesto(a) ? 29 : DIAS_POR_MES[m];

const formatRecurrencia = (rec) => {
  if (!rec) return 'Anual';
  const r = typeof rec === 'string' ? JSON.parse(rec) : rec;
  switch (r.tipo) {
    case 'unica': return 'Una vez';
    case 'mensual': return 'Cada mes';
    case 'trimestral': return 'Trimestral';
    case 'semestral': return 'Semestral';
    case 'anual': return 'Anual';
    case 'cadaX': return `Cada ${r.cadaX || '?'} meses`;
    default: return r.tipo || 'Anual';
  }
};

function ExpensesCalendar({ onBack }) {
  const location = useLocation();
  const eventosRef = useRef(null);
  const { getEventosPorMes, crearEvento, actualizarEvento, desactivarEvento } = useCalendarEvents();

  const [vistaAnual, setVistaAnual] = useState(false);
  const [mesActual, setMesActual] = useState(location.state?.mes ?? new Date().getMonth());
  const [anioActual, setAnioActual] = useState(location.state?.anio ?? new Date().getFullYear());
  const [diaSeleccionado, setDiaSeleccionado] = useState(new Date().getDate());
  const [mostrarModal, setMostrarModal] = useState(location.state?.newEvent ?? false);
  const [editando, setEditando] = useState(null);
  const [errores, setErrores] = useState({});
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '', dia_mes: '', cantidad_min: '', cantidad_max: '', categoria: 'factura',
    recurrencia: { tipo: 'mensual', mes: new Date().getMonth(), mesInicio: new Date().getMonth(), cadaX: 2, mesAno: '' }
  });

  useEffect(() => {
    if (location.state?.scrollToEventos && eventosRef.current) {
      setTimeout(() => eventosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  }, [location.state?.scrollToEventos]);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
  }, [toast]);

  const hoy = new Date();
  const eventosMes = getEventosPorMes(anioActual, mesActual);
  const primerDia = new Date(anioActual, mesActual, 1).getDay();
  const diasAnteriores = primerDia === 0 ? 6 : primerDia - 1;

  const eventosPorDia = (dia) => eventosMes.filter(e => e.dia_mes === dia);
  const eventosDelDia = eventosPorDia(diaSeleccionado);
  const totalDia = eventosDelDia.reduce((s, e) => s + (e.cantidad_max || e.cantidad_min || 0), 0);

  const resumenMes = useMemo(() => {
    const totalMes = eventosMes.reduce((s, e) => s + (e.cantidad_max || e.cantidad_min || 0), 0);
    const totalMin = eventosMes.reduce((s, e) => s + (e.cantidad_min || 0), 0);
    const diaHoy = hoy.getDate();
    const esMesActual = mesActual === hoy.getMonth() && anioActual === hoy.getFullYear();
    const pasados = esMesActual ? eventosMes.filter(e => e.dia_mes < diaHoy) : (mesActual < hoy.getMonth() || anioActual < hoy.getFullYear()) ? eventosMes : [];
    const pendientes = esMesActual ? eventosMes.filter(e => e.dia_mes >= diaHoy) : (mesActual > hoy.getMonth() || anioActual > hoy.getFullYear()) ? eventosMes : [];
    const totalPasados = pasados.reduce((s, e) => s + (e.cantidad_max || e.cantidad_min || 0), 0);
    const totalPendientes = pendientes.reduce((s, e) => s + (e.cantidad_max || e.cantidad_min || 0), 0);
    return { totalMes, totalMin, pasados: pasados.length, pendientes: pendientes.length, totalPasados, totalPendientes, total: eventosMes.length };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventosMes, mesActual, anioActual]);

  const alertasProximas = useMemo(() => {
    const alertas = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      const mes = fecha.getMonth();
      const anio = fecha.getFullYear();
      const dia = fecha.getDate();
      const eventosDelDiaFuturo = getEventosPorMes(anio, mes).filter(e => e.dia_mes === dia);
      eventosDelDiaFuturo.forEach(ev => {
        alertas.push({ ...ev, fechaReal: new Date(fecha), diasFalta: i });
      });
    }
    return alertas;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getEventosPorMes]);

  const cambiarMes = (dir) => {
    let m = mesActual + dir, a = anioActual;
    if (m > 11) { m = 0; a++; } else if (m < 0) { m = 11; a--; }
    setMesActual(m); setAnioActual(a);
  };
  const irHoy = () => { setMesActual(hoy.getMonth()); setAnioActual(hoy.getFullYear()); setDiaSeleccionado(hoy.getDate()); };

  const abrirModal = (evento = null, dia = null) => {
    if (evento) {
      const catInfo = getCategoriaInfo(evento.categoria);
      setEditando(evento);
      setFormData({
        nombre: evento.nombre, dia_mes: evento.dia_mes,
        cantidad_min: evento.cantidad_min || '', cantidad_max: evento.cantidad_max || '',
        categoria: catInfo.value,
        recurrencia: evento.recurrencia && typeof evento.recurrencia === 'object' ? evento.recurrencia :
          (typeof evento.recurrencia === 'string' ? JSON.parse(evento.recurrencia) : { tipo: 'anual', mes: 0, mesInicio: 0, cadaX: 1, mesAno: '' })
      });
    } else {
      setFormData({
        nombre: '', dia_mes: dia || '', cantidad_min: '', cantidad_max: '', categoria: 'factura',
        recurrencia: { tipo: 'mensual', mes: mesActual, mesInicio: mesActual, cadaX: 2, mesAno: anioActual + '-' + String(mesActual + 1).padStart(2, '0') }
      });
    }
    setErrores({}); setMostrarModal(true);
  };

  const cerrarModal = () => { setMostrarModal(false); setEditando(null); setErrores({}); };

  const validar = () => {
    const err = {};
    if (!formData.nombre.trim()) err.nombre = 'Obligatorio';
    if (!formData.dia_mes || formData.dia_mes < 1 || formData.dia_mes > 31) err.dia_mes = 'Día 1-31';
    if (!formData.cantidad_min || formData.cantidad_min <= 0) err.cantidad_min = 'Requerido';
    if (formData.cantidad_max && parseFloat(formData.cantidad_max) < parseFloat(formData.cantidad_min)) err.cantidad_max = 'Mayor que mín';
    if (formData.recurrencia.tipo === 'cadaX' && (!formData.recurrencia.cadaX || formData.recurrencia.cadaX < 1)) err.cadaX = 'Mínimo 1 mes';
    setErrores(err);
    return Object.keys(err).length === 0;
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    const payload = {
      ...formData,
      cantidad_min: formData.cantidad_min ? parseFloat(formData.cantidad_min) : null,
      cantidad_max: formData.cantidad_max ? parseFloat(formData.cantidad_max) : null,
      dia_mes: parseInt(formData.dia_mes),
    };
    try {
      if (editando) { await actualizarEvento(editando.id, payload); setToast({ msg: '✓ Evento actualizado', tipo: 'success' }); }
      else { await crearEvento(payload); setToast({ msg: '✓ Evento creado', tipo: 'success' }); }
      cerrarModal();
    } catch (error) {
      console.error('Error al guardar evento:', error);
      setToast({ msg: 'Error al guardar', tipo: 'error' });
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este evento programado?')) return;
    try { await desactivarEvento(id); cerrarModal(); setToast({ msg: '✓ Evento eliminado', tipo: 'success' }); }
    catch (err) { setToast({ msg: 'Error al eliminar', tipo: 'error' }); }
  };

  const esHoy = (dia) => dia === hoy.getDate() && mesActual === hoy.getMonth() && anioActual === hoy.getFullYear();
  const esMesActualReal = mesActual === hoy.getMonth() && anioActual === hoy.getFullYear();
  const esPasado = (dia) => esMesActualReal && dia < hoy.getDate();
  const esProximo = (dia) => esMesActualReal && dia >= hoy.getDate() && dia < hoy.getDate() + 7;

  const renderCalendario = () => {
    const dias = [];
    const totalDias = diasEnMes(mesActual, anioActual);
    const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
    const anioAnterior = mesActual === 0 ? anioActual - 1 : anioActual;
    const diasMesAnterior = diasEnMes(mesAnterior, anioAnterior);

    for (let i = diasAnteriores; i > 0; i--) {
      dias.push(
        <div key={'ant-' + i} className="bg-slate-50/50 dark:bg-slate-900/20 p-1.5 sm:p-2 min-h-[80px] sm:min-h-[100px]">
          <span className="text-xs font-medium text-slate-300 dark:text-slate-600">{diasMesAnterior - i + 1}</span>
        </div>
      );
    }

    for (let dia = 1; dia <= totalDias; dia++) {
      const eventos = eventosPorDia(dia);
      const pasado = esPasado(dia);
      const proximo = esProximo(dia) && eventos.length > 0;
      const hoyDia = esHoy(dia);
      const seleccionado = dia === diaSeleccionado;
      const esFinde = [0, 6].includes(new Date(anioActual, mesActual, dia).getDay());

      dias.push(
        <div
          key={'dia-' + dia}
          onClick={() => setDiaSeleccionado(dia)}
          className={
            'p-1.5 sm:p-2 min-h-[80px] sm:min-h-[100px] transition-all cursor-pointer relative ' +
            (hoyDia ? 'bg-indigo-50 dark:bg-indigo-950/40 ring-2 ring-indigo-500 ' :
              seleccionado ? 'bg-indigo-50/40 dark:bg-indigo-950/20 ring-1 ring-indigo-400 ' :
              pasado ? 'bg-slate-50/80 dark:bg-slate-900/40 ' :
              proximo ? 'bg-amber-50/50 dark:bg-amber-950/20 ' :
              'bg-white dark:bg-slate-800/60 ') +
            (pasado && !hoyDia ? 'opacity-60 ' : '') +
            'hover:bg-slate-100/80 dark:hover:bg-slate-700/40'
          }
        >
          <div className="flex items-center justify-between">
            <span className={
              'text-xs sm:text-sm font-semibold leading-none ' +
              (hoyDia ? 'bg-indigo-600 text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center' :
                esFinde ? 'text-indigo-500 dark:text-indigo-400' :
                pasado ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300')
            }>
              {dia}
            </span>
            {proximo && !hoyDia && (
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" title="Próximamente" />
            )}
          </div>
          <div className="mt-1 space-y-0.5">
            {eventos.slice(0, 2).map((ev, idx) => {
              const cat = getCategoriaInfo(ev.categoria);
              return (
                <div
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); abrirModal(ev); }}
                  className={'text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md font-medium truncate flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer ' + cat.color}
                >
                  <span className="hidden sm:inline">{cat.emoji}</span>
                  <span className="truncate">{ev.nombre}</span>
                </div>
              );
            })}
            {eventos.length > 2 && (
              <div className="text-[10px] text-slate-400 dark:text-slate-500 pl-1 font-medium">+{eventos.length - 2} más</div>
            )}
          </div>
        </div>
      );
    }

    const rest = 42 - dias.length;
    for (let i = 1; i <= rest; i++) {
      dias.push(
        <div key={'sig-' + i} className="bg-slate-50/50 dark:bg-slate-900/20 p-1.5 sm:p-2 min-h-[80px] sm:min-h-[100px]">
          <span className="text-xs font-medium text-slate-300 dark:text-slate-600">{i}</span>
        </div>
      );
    }
    return dias;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {toast && (
        <div className={'fixed top-4 right-4 z-[200] px-4 py-3 rounded-xl shadow-lg text-sm font-medium ' +
          (toast.tipo === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white')
        }>{toast.msg}</div>
      )}

      <main className="max-w-[1920px] mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-4 sm:gap-6">

        {/* SIDEBAR */}
        <aside className="w-full lg:w-80 flex flex-col gap-4 sm:gap-5 order-2 lg:order-1">

          {/* Alertas próximos 7 días */}
          {alertasProximas.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 rounded-2xl p-4 sm:p-5 border border-amber-200 dark:border-amber-800/50 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-amber-500/15 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300">Próximos 7 días</h3>
                  <p className="text-[11px] text-amber-600/80 dark:text-amber-400/70">{alertasProximas.length} gasto{alertasProximas.length !== 1 ? 's' : ''} pendiente{alertasProximas.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                {alertasProximas.slice(0, 5).map((alerta, idx) => {
                  const cat = getCategoriaInfo(alerta.categoria);
                  return (
                    <div
                      key={alerta.id + '-' + idx}
                      onClick={() => { setDiaSeleccionado(alerta.dia_mes); setMesActual(alerta.fechaReal.getMonth()); setAnioActual(alerta.fechaReal.getFullYear()); }}
                      className="flex items-center gap-2.5 p-2 bg-white/70 dark:bg-slate-800/50 rounded-lg border border-amber-200/50 dark:border-amber-800/30 cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors"
                    >
                      <span className="text-base">{cat.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{alerta.nombre}</p>
                        <p className="text-[10px] text-slate-500">{alerta.cantidad_min}€ · {alerta.diasFalta === 0 ? 'Hoy' : alerta.diasFalta === 1 ? 'Mañana' : 'En ' + alerta.diasFalta + ' días'}</p>
                      </div>
                      <span className={'text-[10px] font-bold px-1.5 py-0.5 rounded ' +
                        (alerta.diasFalta === 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' :
                         alerta.diasFalta <= 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                         'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400')}>
                        Día {alerta.dia_mes}
                      </span>
                    </div>
                  );
                })}
                {alertasProximas.length > 5 && (
                  <p className="text-[10px] text-amber-600/60 text-center pt-1">+{alertasProximas.length - 5} más</p>
                )}
              </div>
            </div>
          )}

          {/* Resumen Mensual */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                Resumen {MESES[mesActual]}
              </h3>
              <span className="text-xs font-medium text-slate-400">{resumenMes.total} evento{resumenMes.total !== 1 ? 's' : ''}</span>
            </div>

            {resumenMes.total > 0 ? (
              <>
                <div className="text-center mb-4">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Total Previsto</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white">
                    {resumenMes.totalMin === resumenMes.totalMes ? resumenMes.totalMes.toFixed(0) + '€' : resumenMes.totalMin.toFixed(0) + ' - ' + resumenMes.totalMes.toFixed(0) + '€'}
                  </p>
                </div>

                {esMesActualReal && (
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Pasados ({resumenMes.pasados})</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-500" /> Pendientes ({resumenMes.pendientes})</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                      <div className="h-full bg-emerald-500 rounded-l-full transition-all" style={{ width: resumenMes.total > 0 ? (resumenMes.pasados / resumenMes.total) * 100 + '%' : '0%' }} />
                      <div className="h-full bg-amber-400 rounded-r-full transition-all" style={{ width: resumenMes.total > 0 ? (resumenMes.pendientes / resumenMes.total) * 100 + '%' : '0%' }} />
                    </div>
                    <div className="flex justify-between text-[10px] mt-1">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">{resumenMes.totalPasados.toFixed(0)}€</span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium">{resumenMes.totalPendientes.toFixed(0)}€</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  {(() => {
                    const cats = {};
                    eventosMes.forEach(e => {
                      const c = getCategoriaInfo(e.categoria);
                      if (!cats[c.value]) cats[c.value] = { ...c, count: 0, total: 0 };
                      cats[c.value].count++;
                      cats[c.value].total += (e.cantidad_max || e.cantidad_min || 0);
                    });
                    return Object.values(cats).sort((a, b) => b.total - a.total).map(c => (
                      <div key={c.value} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <span className={'w-2 h-2 rounded-full ' + c.dot} />
                          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{c.emoji} {c.label}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">({c.count})</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{c.total.toFixed(0)}€</span>
                      </div>
                    ));
                  })()}
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-slate-400">Sin gastos programados</p>
                <p className="text-xs text-slate-400/70 mt-1">¡Mes libre! 🎉</p>
              </div>
            )}
          </div>

          {/* Detalle del día */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{diaSeleccionado} {MESES[mesActual].slice(0, 3)}</h2>
                <p className="text-slate-400 text-xs">{DIAS_SEMANA[(new Date(anioActual, mesActual, diaSeleccionado).getDay() + 6) % 7]}, {anioActual}</p>
              </div>
              <Button onClick={() => abrirModal(null, diaSeleccionado)} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl" size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
              {eventosDelDia.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Sin gastos este día</p>
                </div>
              ) : (
                eventosDelDia.map((ev) => {
                  const cat = getCategoriaInfo(ev.categoria);
                  const pasado = esPasado(ev.dia_mes);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => abrirModal(ev)}
                      className={'group p-3 sm:p-4 rounded-xl border transition-all cursor-pointer ' +
                        (pasado ? 'border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30 opacity-60' :
                        'border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-700/50')
                      }
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md ' + cat.color}>
                          {cat.emoji} {cat.label}
                        </span>
                        <span className="font-bold text-sm text-slate-800 dark:text-white">
                          {ev.cantidad_max ? ev.cantidad_min + '-' + ev.cantidad_max + '€' : ev.cantidad_min + '€'}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">{ev.nombre}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1"><Repeat className="w-3 h-3" /> {formatRecurrencia(ev.recurrencia)}</span>
                        {pasado && <span className="flex items-center gap-1 text-emerald-500"><CheckCircle2 className="w-3 h-3" /> Pasado</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {eventosDelDia.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs text-slate-500">Total del día</span>
                <span className="text-base font-bold text-slate-800 dark:text-white">{totalDia.toFixed(2)}€</span>
              </div>
            )}
          </div>
        </aside>

        {/* CALENDARIO PRINCIPAL */}
        <section className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden order-1 lg:order-2">

          <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <h1 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white">{MESES[mesActual]} {anioActual}</h1>
              <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
                <Button onClick={() => cambiarMes(-1)} variant="ghost" size="sm" className="p-1 h-8 w-8"><ChevronLeft className="w-4 h-4" /></Button>
                <Button onClick={irHoy} variant="ghost" size="sm" className="px-2 py-1 text-xs font-medium h-8">Hoy</Button>
                <Button onClick={() => cambiarMes(1)} variant="ghost" size="sm" className="p-1 h-8 w-8"><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => setVistaAnual(!vistaAnual)} variant="outline" size="sm"
                className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-none hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs h-8">
                <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                {vistaAnual ? 'Mes' : 'Año'}
              </Button>
              <Button onClick={() => abrirModal()} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Nuevo
              </Button>
            </div>
          </div>

          {!vistaAnual && (
            <>
              <div className="grid grid-cols-7 gap-px border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
                {DIAS_SEMANA.map((d, i) => (
                  <div key={d} className={'py-2.5 text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest ' + (i >= 5 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400')}>{d}</div>
                ))}
              </div>
              <div className="flex-1 grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 overflow-y-auto">
                {renderCalendario()}
              </div>
            </>
          )}

          {vistaAnual && (
            <div ref={eventosRef} className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {MESES.map((mes, idx) => {
                  const evMes = getEventosPorMes(anioActual, idx);
                  const totalMes = evMes.reduce((s, e) => s + (e.cantidad_max || e.cantidad_min || 0), 0);
                  const esMesAct = idx === hoy.getMonth() && anioActual === hoy.getFullYear();

                  return (
                    <div
                      key={mes}
                      onClick={() => { setVistaAnual(false); setMesActual(idx); }}
                      className={'rounded-xl p-3 sm:p-4 border cursor-pointer hover:shadow-md transition-all ' +
                        (esMesAct ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30' :
                        'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-500')
                      }
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className={'text-sm font-bold ' + (esMesAct ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-100')}>{mes}</h3>
                        {evMes.length > 0 && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                            {evMes.length}
                          </span>
                        )}
                      </div>

                      {evMes.length > 0 ? (
                        <>
                          <div className="space-y-1 mb-2">
                            {evMes.slice(0, 3).map(ev => {
                              const cat = getCategoriaInfo(ev.categoria);
                              return (
                                <div key={ev.id} className="flex items-center gap-1.5 text-[10px]"
                                  onClick={(e) => { e.stopPropagation(); setMesActual(idx); setDiaSeleccionado(ev.dia_mes); setVistaAnual(false); setTimeout(() => abrirModal(ev), 100); }}>
                                  <span className={'w-1.5 h-1.5 rounded-full ' + cat.dot} />
                                  <span className="truncate font-medium text-slate-700 dark:text-slate-300">{ev.nombre}</span>
                                  <span className="text-slate-400 ml-auto shrink-0">{ev.cantidad_min}€</span>
                                </div>
                              );
                            })}
                            {evMes.length > 3 && <p className="text-[10px] text-slate-400 pl-3">+{evMes.length - 3} más</p>}
                          </div>
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-600 flex justify-between text-xs">
                            <span className="text-slate-500">Total</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{totalMes.toFixed(0)}€</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-[10px] text-slate-400 text-center py-3">Sin gastos</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700 flex items-center gap-3 sm:gap-5 overflow-x-auto">
            {CATEGORIAS.slice(0, 8).map(c => (
              <div key={c.value} className="flex items-center gap-1.5 shrink-0">
                <span className={'w-2 h-2 rounded-full ' + c.dot} />
                <span className="text-[10px] sm:text-xs font-medium text-slate-500">{c.emoji} {c.label}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* MODAL */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={cerrarModal}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editando ? 'Editar Gasto' : 'Nuevo Gasto Programado'}</h3>
              <Button onClick={cerrarModal} variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={guardar} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <Label htmlFor="nombre" className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Concepto</Label>
                <Input id="nombre" type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className={'h-10 ' + (errores.nombre ? 'border-red-500 focus:ring-red-500' : '')} placeholder="Ej: Factura de luz, Netflix..." />
                {errores.nombre && <p className="text-[10px] text-red-500 mt-1">{errores.nombre}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="dia_mes" className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Día del mes</Label>
                  <Input id="dia_mes" type="number" min="1" max="31" value={formData.dia_mes} onChange={(e) => setFormData({ ...formData, dia_mes: e.target.value })}
                    className={'h-10 ' + (errores.dia_mes ? 'border-red-500' : '')} placeholder="1-31" />
                  {errores.dia_mes && <p className="text-[10px] text-red-500 mt-1">{errores.dia_mes}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Categoría</label>
                  <select value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 text-sm focus:ring-indigo-500 focus:border-indigo-500 px-3">
                    {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cant_min" className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Importe mín (€)</Label>
                  <Input id="cant_min" type="number" step="0.01" value={formData.cantidad_min} onChange={(e) => setFormData({ ...formData, cantidad_min: e.target.value })}
                    className={'h-10 ' + (errores.cantidad_min ? 'border-red-500' : '')} placeholder="0.00" />
                  {errores.cantidad_min && <p className="text-[10px] text-red-500 mt-1">{errores.cantidad_min}</p>}
                </div>
                <div>
                  <Label htmlFor="cant_max" className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Importe máx (€)</Label>
                  <Input id="cant_max" type="number" step="0.01" value={formData.cantidad_max} onChange={(e) => setFormData({ ...formData, cantidad_max: e.target.value })}
                    className={'h-10 ' + (errores.cantidad_max ? 'border-red-500' : '')} placeholder="Opcional" />
                  {errores.cantidad_max && <p className="text-[10px] text-red-500 mt-1">{errores.cantidad_max}</p>}
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-slate-400">Si el importe varía cada mes (ej: luz), pon el rango mín-máx. Si es fijo, solo el mínimo.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Recurrencia</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {TIPOS_RECURRENCIA.map(t => (
                    <button key={t.value} type="button"
                      onClick={() => setFormData({ ...formData, recurrencia: { ...formData.recurrencia, tipo: t.value } })}
                      className={'px-2 py-2 rounded-lg text-[10px] sm:text-[11px] font-medium border transition-all ' +
                        (formData.recurrencia.tipo === t.value
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300')
                      }>
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {formData.recurrencia.tipo === 'anual' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Mes del evento</label>
                  <select value={formData.recurrencia.mes} onChange={(e) => setFormData({ ...formData, recurrencia: { ...formData.recurrencia, mes: parseInt(e.target.value) } })}
                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 text-sm px-3">
                    {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                </div>
              )}

              {(formData.recurrencia.tipo === 'semestral' || formData.recurrencia.tipo === 'trimestral') && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Mes de inicio</label>
                  <select value={formData.recurrencia.mesInicio} onChange={(e) => setFormData({ ...formData, recurrencia: { ...formData.recurrencia, mesInicio: parseInt(e.target.value) } })}
                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 text-sm px-3">
                    {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                </div>
              )}

              {formData.recurrencia.tipo === 'cadaX' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Cada X meses</label>
                    <Input type="number" min="1" max="36" value={formData.recurrencia.cadaX}
                      onChange={(e) => setFormData({ ...formData, recurrencia: { ...formData.recurrencia, cadaX: parseInt(e.target.value) || 1 } })}
                      className={'h-10 ' + (errores.cadaX ? 'border-red-500' : '')} />
                    {errores.cadaX && <p className="text-[10px] text-red-500 mt-1">{errores.cadaX}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Mes de inicio</label>
                    <select value={formData.recurrencia.mesInicio} onChange={(e) => setFormData({ ...formData, recurrencia: { ...formData.recurrencia, mesInicio: parseInt(e.target.value) } })}
                      className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 text-sm px-3">
                      {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {formData.recurrencia.tipo === 'unica' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Mes y año</label>
                  <Input type="month" value={formData.recurrencia.mesAno}
                    onChange={(e) => setFormData({ ...formData, recurrencia: { ...formData.recurrencia, mesAno: e.target.value } })}
                    className="h-10" />
                </div>
              )}
            </form>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2 shrink-0">
              {editando && (
                <Button type="button" onClick={() => eliminar(editando.id)} variant="destructive" className="flex-1 h-10 text-sm">
                  Eliminar
                </Button>
              )}
              <Button type="button" onClick={cerrarModal} variant="outline" className="flex-1 h-10 text-sm">Cancelar</Button>
              <Button type="submit" onClick={guardar} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-10 text-sm">
                {editando ? 'Guardar' : 'Crear'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpensesCalendar;
