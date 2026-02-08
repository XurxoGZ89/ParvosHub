import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, FileText, RefreshCw, Shield, Landmark, Cake, Plane, Heart, GraduationCap, Home as HomeIcon, Car, Star, Pin } from 'lucide-react';
import MobileHeader from './MobileHeader';
import MobileSheet from './MobileSheet';
import { useCalendarEvents } from '../../contexts/CalendarEventsContext';

const CATEGORIAS = [
  { value: 'factura', label: 'Factura', icon: FileText, dot: 'bg-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' },
  { value: 'suscripcion', label: 'Suscripción', icon: RefreshCw, dot: 'bg-violet-500', bg: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600' },
  { value: 'seguro', label: 'Seguro', icon: Shield, dot: 'bg-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' },
  { value: 'impuesto', label: 'Impuesto', icon: Landmark, dot: 'bg-red-500', bg: 'bg-red-100 dark:bg-red-900/30 text-red-600' },
  { value: 'cumpleanos', label: 'Cumpleaños', icon: Cake, dot: 'bg-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600' },
  { value: 'viaje', label: 'Viaje', icon: Plane, dot: 'bg-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' },
  { value: 'medico', label: 'Médico', icon: Heart, dot: 'bg-teal-500', bg: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600' },
  { value: 'educacion', label: 'Educación', icon: GraduationCap, dot: 'bg-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' },
  { value: 'hogar', label: 'Hogar', icon: HomeIcon, dot: 'bg-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600' },
  { value: 'vehiculo', label: 'Vehículo', icon: Car, dot: 'bg-slate-500', bg: 'bg-slate-200 dark:bg-slate-700 text-slate-600' },
  { value: 'dia_especial', label: 'Día Especial', icon: Star, dot: 'bg-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' },
  { value: 'otro', label: 'Otro', icon: Pin, dot: 'bg-gray-500', bg: 'bg-gray-100 dark:bg-gray-800 text-gray-600' },
];

const LEGACY_MAP = { 'Cumpleaños': 'cumpleanos', 'Seguro': 'seguro', 'Viaje': 'viaje', 'Día Especial': 'dia_especial' };
const getCatInfo = (v) => CATEGORIAS.find(c => c.value === (LEGACY_MAP[v] || v)) || CATEGORIAS[CATEGORIAS.length - 1];

const TIPOS_REC = [
  { value: 'unica', label: 'Una vez' }, { value: 'mensual', label: 'Mensual' },
  { value: 'trimestral', label: 'Trimestral' }, { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' }, { value: 'cadaX', label: 'Personalizado' },
];

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_SEMANA = ['L','M','X','J','V','S','D'];
const DIAS_POR_MES = [31,28,31,30,31,30,31,31,30,31,30,31];
const esAnoBisiesto = (a) => (a % 4 === 0 && a % 100 !== 0) || (a % 400 === 0);
const diasEnMes = (m, a) => m === 1 && esAnoBisiesto(a) ? 29 : DIAS_POR_MES[m];

const formatRec = (r) => {
  if (!r) return 'Anual';
  const rec = typeof r === 'string' ? JSON.parse(r) : r;
  const map = { unica: 'Una vez', mensual: 'Mensual', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual', cadaX: `Cada ${rec.cadaX || '?'} meses` };
  return map[rec.tipo] || rec.tipo || 'Anual';
};

const MobileExpensesCalendar = () => {
  const { getEventosPorMes, crearEvento, actualizarEvento, desactivarEvento } = useCalendarEvents();
  const [mesActual, setMesActual] = useState(() => new Date().getMonth());
  const [anioActual, setAnioActual] = useState(() => new Date().getFullYear());
  const [diaSeleccionado, setDiaSeleccionado] = useState(() => new Date().getDate());
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '', dia_mes: '', cantidad_min: '', cantidad_max: '', categoria: 'factura',
    recurrencia: { tipo: 'mensual', mes: mesActual, mesInicio: mesActual, cadaX: 2, mesAno: '' }
  });

  const eventosMes = getEventosPorMes(anioActual, mesActual);
  const eventosPorDia = (dia) => eventosMes.filter(e => e.dia_mes === dia);
  const eventosDelDia = eventosPorDia(diaSeleccionado);
  const totalDia = eventosDelDia.reduce((s, e) => s + (e.cantidad_max || e.cantidad_min || 0), 0);

  const resumenMes = useMemo(() => {
    const ahora = new Date();
    const total = eventosMes.reduce((s, e) => s + (e.cantidad_max || e.cantidad_min || 0), 0);
    const esMesActual = mesActual === ahora.getMonth() && anioActual === ahora.getFullYear();
    const pendientes = esMesActual ? eventosMes.filter(e => e.dia_mes >= ahora.getDate()) : eventosMes;
    const totalPendientes = pendientes.reduce((s, e) => s + (e.cantidad_max || e.cantidad_min || 0), 0);
    return { total, pendientes: pendientes.length, totalPendientes, count: eventosMes.length };
  }, [eventosMes, mesActual, anioActual]);

  const cambiarMes = (dir) => {
    let m = mesActual + dir, a = anioActual;
    if (m > 11) { m = 0; a++; } else if (m < 0) { m = 11; a--; }
    setMesActual(m); setAnioActual(a);
  };

  const irHoy = () => { const h = new Date(); setMesActual(h.getMonth()); setAnioActual(h.getFullYear()); setDiaSeleccionado(h.getDate()); };

  const esHoy = (dia) => { const h = new Date(); return dia === h.getDate() && mesActual === h.getMonth() && anioActual === h.getFullYear(); };
  const esPasado = (dia) => { const h = new Date(); return mesActual === h.getMonth() && anioActual === h.getFullYear() && dia < h.getDate(); };

  const abrirForm = (evento = null, dia = null) => {
    if (evento) {
      setEditando(evento);
      const catInfo = getCatInfo(evento.categoria);
      setFormData({
        nombre: evento.nombre, dia_mes: evento.dia_mes, cantidad_min: evento.cantidad_min || '',
        cantidad_max: evento.cantidad_max || '', categoria: catInfo.value,
        recurrencia: evento.recurrencia && typeof evento.recurrencia === 'object' ? evento.recurrencia :
          (typeof evento.recurrencia === 'string' ? JSON.parse(evento.recurrencia) : { tipo: 'anual', mes: 0, mesInicio: 0, cadaX: 1, mesAno: '' })
      });
    } else {
      setEditando(null);
      setFormData({ nombre: '', dia_mes: dia || diaSeleccionado, cantidad_min: '', cantidad_max: '', categoria: 'factura',
        recurrencia: { tipo: 'mensual', mes: mesActual, mesInicio: mesActual, cadaX: 2, mesAno: anioActual + '-' + String(mesActual + 1).padStart(2, '0') } });
    }
    setShowForm(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.dia_mes || !formData.cantidad_min) return;
    const payload = { ...formData, cantidad_min: parseFloat(formData.cantidad_min), cantidad_max: formData.cantidad_max ? parseFloat(formData.cantidad_max) : null, dia_mes: parseInt(formData.dia_mes) };
    try {
      if (editando) { await actualizarEvento(editando.id, payload); setToast('✓ Actualizado'); }
      else { await crearEvento(payload); setToast('✓ Creado'); }
      setShowForm(false); setEditando(null);
    } catch { setToast('Error'); }
    setTimeout(() => setToast(null), 2000);
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const eliminar = async (id) => {
    try { await desactivarEvento(id); setToast('✓ Eliminado'); } catch { setToast('Error'); }
    setTimeout(() => setToast(null), 2000);
    setDeleteConfirmId(null);
  };

  // Calendar grid
  const primerDia = new Date(anioActual, mesActual, 1).getDay();
  const diasAnteriores = primerDia === 0 ? 6 : primerDia - 1;
  const totalDias = diasEnMes(mesActual, anioActual);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <MobileHeader title="Calendario Gastos" />

      <div className="px-4 py-3 pb-28 space-y-3">
        {/* Mes + nav */}
        <div className="flex items-center justify-between">
          <button onClick={() => cambiarMes(-1)} className="p-2 text-slate-400 active:scale-90"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={irHoy} className="text-center">
            <span className="text-base font-bold text-slate-800 dark:text-white">{MESES[mesActual]}</span>
            <span className="text-sm text-slate-400 ml-1.5">{anioActual}</span>
          </button>
          <button onClick={() => cambiarMes(1)} className="p-2 text-slate-400 active:scale-90"><ChevronRight className="w-5 h-5" /></button>
        </div>

        {/* Resumen mini */}
        <div className="flex gap-2">
          <div className="flex-1 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">{resumenMes.total.toFixed(0)}€</p>
          </div>
          <div className="flex-1 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Eventos</p>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">{resumenMes.count}</p>
          </div>
          <div className="flex-1 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-800 text-center">
            <p className="text-[10px] font-bold text-purple-600 uppercase">Pendiente</p>
            <p className="text-sm font-extrabold text-purple-700 dark:text-purple-300">{resumenMes.totalPendientes.toFixed(0)}€</p>
          </div>
        </div>

        {/* Calendario grid */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DIAS_SEMANA.map(d => <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: diasAnteriores }, (_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: totalDias }, (_, i) => {
              const dia = i + 1;
              const eventos = eventosPorDia(dia);
              const selected = dia === diaSeleccionado;
              const isToday = esHoy(dia);
              const past = esPasado(dia);
              return (
                <button key={dia} onClick={() => setDiaSeleccionado(dia)}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all active:scale-90 ${
                    selected ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' :
                    isToday ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 font-bold' :
                    past ? 'text-slate-300 dark:text-slate-600' :
                    'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}>
                  <span className={`text-xs ${selected ? 'font-bold' : ''}`}>{dia}</span>
                  {eventos.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {eventos.slice(0, 3).map((ev, j) => {
                        const cat = getCatInfo(ev.categoria);
                        return <div key={j} className={`w-1 h-1 rounded-full ${selected ? 'bg-white' : cat.dot}`} />;
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detalle del día seleccionado */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-white">Día {diaSeleccionado}</span>
              {eventosDelDia.length > 0 && <span className="text-xs text-slate-400 ml-2">{totalDia.toFixed(2)}€</span>}
            </div>
            <button onClick={() => abrirForm(null, diaSeleccionado)} className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white active:scale-90">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {eventosDelDia.length > 0 ? (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {eventosDelDia.map(ev => {
                const cat = getCatInfo(ev.categoria);
                const CatIcon = cat.icon;
                return (
                  <button key={ev.id} onClick={() => abrirForm(ev)} className="w-full flex items-center gap-3 px-4 py-3 active:bg-slate-50 dark:active:bg-slate-800 transition-colors text-left">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cat.bg}`}>
                      <CatIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{ev.nombre}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatRec(ev.recurrencia)}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-800 dark:text-white shrink-0">
                      {ev.cantidad_max ? `${ev.cantidad_min}–${ev.cantidad_max}€` : `${ev.cantidad_min}€`}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <Calendar className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Sin gastos este día</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[110] bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg animate-fadeIn">
          {toast}
        </div>
      )}

      {/* FAB */}
      <button onClick={() => abrirForm()} className="fixed right-4 bottom-20 z-50 w-14 h-14 bg-purple-600 rounded-full shadow-lg shadow-purple-600/30 flex items-center justify-center text-white active:scale-90 transition-transform">
        <Plus className="w-6 h-6" />
      </button>

      {/* Form Sheet */}
      <MobileSheet isOpen={showForm} onClose={() => { setShowForm(false); setEditando(null); }} title={editando ? 'Editar Evento' : 'Nuevo Evento'} fullHeight>
        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Nombre</label>
            <input type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              className="w-full h-12 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" placeholder="Ej. Seguro coche" required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Día</label>
              <input type="number" min="1" max="31" value={formData.dia_mes} onChange={(e) => setFormData({...formData, dia_mes: e.target.value})}
                className="w-full h-12 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-center font-bold" required />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Mín €</label>
              <input type="number" step="0.01" inputMode="decimal" value={formData.cantidad_min} onChange={(e) => setFormData({...formData, cantidad_min: e.target.value})}
                className="w-full h-12 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold" required />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Máx €</label>
              <input type="number" step="0.01" inputMode="decimal" value={formData.cantidad_max} onChange={(e) => setFormData({...formData, cantidad_max: e.target.value})}
                className="w-full h-12 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" placeholder="Opcional" />
            </div>
          </div>
          {/* Categoría grid */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">Categoría</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIAS.map(cat => {
                const CatIcon = cat.icon;
                return (
                  <button key={cat.value} type="button" onClick={() => setFormData({...formData, categoria: cat.value})}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-semibold transition-all ${
                      formData.categoria === cat.value ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                    <CatIcon className="w-4 h-4" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Recurrencia */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">Recurrencia</label>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS_REC.map(t => (
                <button key={t.value} type="button"
                  onClick={() => setFormData({...formData, recurrencia: {...formData.recurrencia, tipo: t.value}})}
                  className={`py-2.5 rounded-xl text-[11px] font-semibold transition-all ${
                    formData.recurrencia.tipo === t.value ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
            {formData.recurrencia.tipo === 'anual' && (
              <select value={formData.recurrencia.mes} onChange={(e) => setFormData({...formData, recurrencia: {...formData.recurrencia, mes: parseInt(e.target.value)}})}
                className="w-full h-12 px-3 mt-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            )}
            {formData.recurrencia.tipo === 'unica' && (
              <input type="month" value={formData.recurrencia.mesAno} onChange={(e) => setFormData({...formData, recurrencia: {...formData.recurrencia, mesAno: e.target.value}})}
                className="w-full h-12 px-3 mt-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
            )}
            {formData.recurrencia.tipo === 'cadaX' && (
              <input type="number" min="1" value={formData.recurrencia.cadaX} onChange={(e) => setFormData({...formData, recurrencia: {...formData.recurrencia, cadaX: parseInt(e.target.value)}})}
                placeholder="Cada X meses" className="w-full h-12 px-3 mt-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
            )}
            {(formData.recurrencia.tipo === 'semestral' || formData.recurrencia.tipo === 'trimestral') && (
              <select value={formData.recurrencia.mesInicio} onChange={(e) => setFormData({...formData, recurrencia: {...formData.recurrencia, mesInicio: parseInt(e.target.value)}})}
                className="w-full h-12 px-3 mt-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            {editando && (
              <button type="button" onClick={() => setDeleteConfirmId(editando.id)}
                className="px-5 py-3.5 bg-red-100 dark:bg-red-900/20 text-red-600 font-bold rounded-xl text-sm">
                Eliminar
              </button>
            )}
            <button type="submit" className="flex-1 py-3.5 bg-purple-600 text-white font-bold rounded-xl shadow-lg active:scale-[0.98] text-sm">
              {editando ? 'Guardar Cambios' : 'Crear Evento'}
            </button>
          </div>
        </form>
      </MobileSheet>

      {/* Confirm Delete Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-end justify-center" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl w-full p-5 space-y-3 safe-area-bottom animate-slideUp" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-bold text-slate-900 dark:text-white text-center">¿Eliminar este evento?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-slate-600">Cancelar</button>
              <button onClick={() => { eliminar(deleteConfirmId); setShowForm(false); }} className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileExpensesCalendar;
