import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useCalendarEvents } from '../../contexts/CalendarEventsContext';
import { ChevronLeft, ChevronRight, Plus, X, Calendar, Filter, CalendarDays } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';

const CATEGORIAS = ['Cumpleaños', 'Seguro', 'Viaje', 'Día Especial'];
const TIPOS_RECURRENCIA = [
  { value: 'unica', label: 'Una sola vez' },
  { value: 'anual', label: 'Anual' },
  { value: 'semestral', label: 'Semestral (cada 6 meses)' },
  { value: 'trimestral', label: 'Trimestral (cada 3 meses)' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'cadaX', label: 'Cada X meses' }
];

const categoriasColores = {
  'Cumpleaños': 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
  'Seguro': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  'Viaje': 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  'Día Especial': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
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
  const [formData, setFormData] = useState({
    nombre: '',
    dia_mes: '',
    cantidad_min: '',
    cantidad_max: '',
    categoria: 'Seguro',
    recurrencia: {
      tipo: 'anual',
      mes: 0,
      mesInicio: 0,
      cadaX: 1,
      mesAno: ''
    }
  });

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  const esAñoBisiesto = (anio) => (anio % 4 === 0 && anio % 100 !== 0) || (anio % 400 === 0);
  const diasEnMes = (mes, anio) => mes === 1 && esAñoBisiesto(anio) ? 29 : diasPorMes[mes];

  // Scroll automático cuando viene de Home
  useEffect(() => {
    if (location.state?.scrollToEventos && eventosRef.current) {
      setTimeout(() => {
        eventosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [location.state?.scrollToEventos]);

  const eventosMes = getEventosPorMes(anioActual, mesActual);

  const primerDia = new Date(anioActual, mesActual, 1).getDay();
  const diasAnteriores = primerDia === 0 ? 6 : primerDia - 1;

  const cambiarMes = (direccion) => {
    let nuevoMes = mesActual + direccion;
    let nuevoAnio = anioActual;
    
    if (nuevoMes > 11) {
      nuevoMes = 0;
      nuevoAnio++;
    } else if (nuevoMes < 0) {
      nuevoMes = 11;
      nuevoAnio--;
    }
    
    setMesActual(nuevoMes);
    setAnioActual(nuevoAnio);
  };

  const irHoy = () => {
    const hoy = new Date();
    setMesActual(hoy.getMonth());
    setAnioActual(hoy.getFullYear());
    setDiaSeleccionado(hoy.getDate());
  };

  const abrirModal = (evento = null, dia = null) => {
    if (evento) {
      setEditando(evento);
      setFormData({
        nombre: evento.nombre,
        dia_mes: evento.dia_mes,
        cantidad_min: evento.cantidad_min || '',
        cantidad_max: evento.cantidad_max || '',
        categoria: evento.categoria,
        recurrencia: evento.recurrencia || {
          tipo: 'anual',
          mes: 0,
          mesInicio: 0,
          cadaX: 1,
          mesAno: ''
        }
      });
    } else if (dia) {
      setFormData(prev => ({ ...prev, dia_mes: dia }));
    }
    setErrores({});
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setEditando(null);
    setErrores({});
    setFormData({
      nombre: '',
      dia_mes: '',
      cantidad_min: '',
      cantidad_max: '',
      categoria: 'Seguro',
      recurrencia: {
        tipo: 'anual',
        mes: 0,
        mesInicio: 0,
        cadaX: 1,
        mesAno: ''
      }
    });
  };

  const validarFormulario = () => {
    const nuevosErrores = {};
    if (!formData.nombre.trim()) nuevosErrores.nombre = 'El nombre es obligatorio';
    if (!formData.dia_mes || formData.dia_mes < 1 || formData.dia_mes > 31) nuevosErrores.dia_mes = 'Día inválido (1-31)';
    if (!formData.cantidad_min || formData.cantidad_min <= 0) nuevosErrores.cantidad_min = 'Cantidad mínima requerida';
    if (formData.cantidad_max && parseFloat(formData.cantidad_max) < parseFloat(formData.cantidad_min)) {
      nuevosErrores.cantidad_max = 'Debe ser mayor que la cantidad mínima';
    }
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    
    const payload = {
      ...formData,
      cantidad_min: formData.cantidad_min ? parseFloat(formData.cantidad_min) : null,
      cantidad_max: formData.cantidad_max ? parseFloat(formData.cantidad_max) : null,
      dia_mes: parseInt(formData.dia_mes)
    };

    try {
      if (editando) {
        await actualizarEvento(editando.id, payload);
      } else {
        await crearEvento(payload);
      }
      cerrarModal();
    } catch (error) {
      console.error('Error al guardar evento:', error);
    }
  };

  const manejarEliminar = async (id) => {
    if (window.confirm('¿Eliminar este evento?')) {
      await desactivarEvento(id);
    }
  };

  const eventosPorDia = (dia) => {
    return eventosMes.filter(e => e.dia_mes === dia);
  };

  const eventosDelDia = eventosPorDia(diaSeleccionado);
  const totalDia = eventosDelDia.reduce((sum, e) => sum + (e.cantidad_max || e.cantidad_min || 0), 0);

  const renderCalendario = () => {
    const dias = [];
    const totalDias = diasEnMes(mesActual, anioActual);
    const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
    const anioAnterior = mesActual === 0 ? anioActual - 1 : anioActual;
    const diasMesAnterior = diasEnMes(mesAnterior, anioAnterior);

    // Días del mes anterior
    for (let i = diasAnteriores; i > 0; i--) {
      dias.push(
        <div key={`ant-${i}`} className="bg-slate-50/50 dark:bg-slate-900/20 p-2 min-h-[120px]">
          <span className="text-sm font-medium text-slate-300">{diasMesAnterior - i + 1}</span>
        </div>
      );
    }

    // Días del mes actual
    const hoy = new Date();
    const esHoy = (dia) => dia === hoy.getDate() && mesActual === hoy.getMonth() && anioActual === hoy.getFullYear();
    const esDiaSeleccionado = (dia) => dia === diaSeleccionado;

    for (let dia = 1; dia <= totalDias; dia++) {
      const eventos = eventosPorDia(dia);
      const esFinSemana = new Date(anioActual, mesActual, dia).getDay() === 0 || new Date(anioActual, mesActual, dia).getDay() === 6;

      dias.push(
        <div
          key={`actual-${dia}`}
          onClick={() => setDiaSeleccionado(dia)}
          className={`
            p-2 min-h-[120px] transition-colors cursor-pointer
            ${esHoy(dia) ? 'bg-indigo-50/50 dark:bg-primary/10 border-2 border-primary' : 
              esDiaSeleccionado(dia) ? 'bg-indigo-50/30 dark:bg-primary/5 border border-primary' :
              'bg-white dark:bg-card-dark border border-transparent'}
            hover:bg-slate-50 dark:hover:bg-slate-800/40
          `}
        >
          <span className={`text-sm font-medium ${esHoy(dia) ? 'text-primary font-bold' : esFinSemana ? 'text-primary' : ''}`}>
            {dia}
          </span>
          <div className="mt-2 space-y-1">
            {eventos.slice(0, 3).map((evento, idx) => (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  abrirModal(evento);
                }}
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold truncate ${categoriasColores[evento.categoria] || 'bg-slate-100 text-slate-600'}`}
              >
                {evento.nombre}
              </div>
            ))}
            {eventos.length > 3 && (
              <div className="text-[10px] text-slate-400 pl-2">+{eventos.length - 3} más</div>
            )}
          </div>
        </div>
      );
    }

    // Días del mes siguiente
    const diasRestantes = 42 - dias.length;
    for (let i = 1; i <= diasRestantes; i++) {
      dias.push(
        <div key={`sig-${i}`} className="bg-slate-50/50 dark:bg-slate-900/20 p-2 min-h-[120px]">
          <span className="text-sm font-medium text-slate-300">{i}</span>
        </div>
      );
    }

    return dias;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <main className="max-w-[1920px] mx-auto p-6 flex gap-6 h-[calc(100vh-64px)]">
        {/* Sidebar - Eventos del día */}
        <aside className="w-80 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{diaSeleccionado} {meses[mesActual].slice(0, 3)}</h2>
                <p className="text-slate-500 text-sm">{diasSemana[new Date(anioActual, mesActual, diaSeleccionado).getDay() || 6]}, {anioActual}</p>
              </div>
              <Button
                onClick={() => abrirModal(null, diaSeleccionado)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl"
                size="icon"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Gastos Programados
              </h3>
              
              <div className="space-y-4">
                {eventosDelDia.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No hay eventos programados</p>
                ) : (
                  eventosDelDia.map((evento) => (
                    <div
                      key={evento.id}
                      onClick={() => abrirModal(evento)}
                      className="group p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-700/50 transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${categoriasColores[evento.categoria]}`}>
                          {evento.categoria}
                        </span>
                        <span className="font-bold">
                          {evento.cantidad_max ? `${evento.cantidad_min}-${evento.cantidad_max}€` : `${evento.cantidad_min}€`}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-1">{evento.nombre}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        <span>{evento.recurrencia?.tipo || 'Anual'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {eventosDelDia.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-slate-500">Total Día</span>
                  <span className="text-lg font-bold">{totalDia.toFixed(2)}€</span>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Calendario Principal */}
        <section className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">{meses[mesActual]} {anioActual}</h1>
              <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                <Button
                  onClick={() => cambiarMes(-1)}
                  variant="ghost"
                  size="sm"
                  className="p-1"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  onClick={irHoy}
                  variant="ghost"
                  size="sm"
                  className="px-3 py-1 text-sm font-medium"
                >
                  Hoy
                </Button>
                <Button
                  onClick={() => cambiarMes(1)}
                  variant="ghost"
                  size="sm"
                  className="p-1"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                onClick={() => setVistaAnual(!vistaAnual)}
                variant="outline"
                className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-none hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                {vistaAnual ? 'Ver Mes' : 'Ver Año'}
              </Button>
              <Button 
                variant="outline"
                className="border-slate-200 dark:border-slate-600"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>

          {/* Días de la semana - Solo en vista mensual */}
          {!vistaAnual && (
            <div className="grid grid-cols-7 gap-px border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
              {diasSemana.map((dia, idx) => (
                <div
                  key={dia}
                  className={`py-3 text-center text-xs font-bold uppercase tracking-widest ${
                    idx >= 5 ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                >
                  {dia}
                </div>
              ))}
            </div>
          )}

          {/* Grid del calendario mensual */}
          {!vistaAnual && (
            <div className="flex-1 grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 overflow-y-auto">
              {renderCalendario()}
            </div>
          )}

          {/* Vista anual */}
          {vistaAnual && (
            <div ref={eventosRef} className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {meses.map((mes, idx) => {
                  const eventosDelMes = getEventosPorMes(anioActual, idx);
                  const totalMes = eventosDelMes.reduce((sum, e) => sum + (e.cantidad_max || e.cantidad_min || 0), 0);
                  
                  return (
                    <div
                      key={mes}
                      onClick={() => {
                        setVistaAnual(false);
                        setMesActual(idx);
                      }}
                      className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{mes}</h3>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                          {eventosDelMes.length}
                        </span>
                      </div>
                      
                      {eventosDelMes.length > 0 ? (
                        <>
                          <div className="space-y-2 mb-3">
                            {eventosDelMes.slice(0, 3).map(evento => (
                              <div
                                key={evento.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMesActual(idx);
                                  setDiaSeleccionado(evento.dia_mes);
                                  setVistaAnual(false);
                                  setTimeout(() => abrirModal(evento), 100);
                                }}
                                className="flex items-start gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-600 hover:border-indigo-400 transition-colors"
                              >
                                <span className="text-xs font-bold text-slate-500 min-w-[20px]">{evento.dia_mes}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{evento.nombre}</p>
                                  <p className="text-[10px] text-slate-500">{evento.cantidad_min}€</p>
                                </div>
                              </div>
                            ))}
                            {eventosDelMes.length > 3 && (
                              <p className="text-[10px] text-slate-400 pl-2">+{eventosDelMes.length - 3} más eventos</p>
                            )}
                          </div>
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Total mes</span>
                              <span className="font-bold text-slate-800 dark:text-slate-100">{totalMes.toFixed(2)}€</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-4">Sin eventos</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Leyenda */}
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700 flex items-center gap-6 overflow-x-auto">
            {Object.entries(categoriasColores).map(([categoria, color]) => (
              <div key={categoria} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color.split(' ')[0]}`}></div>
                <span className="text-xs font-medium text-slate-500">{categoria}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Modal Nuevo/Editar Evento */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{editando ? 'Editar Evento' : 'Nuevo Evento'}</h3>
              <Button
                onClick={cerrarModal}
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={manejarSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nombre" className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Concepto
                </Label>
                <Input
                  id="nombre"
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className={errores.nombre ? 'border-red-500' : ''}
                  placeholder="Ej: Pago de luz"
                />
                {errores.nombre && <p className="text-xs text-red-600 mt-1">{errores.nombre}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dia_mes" className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Día del mes
                  </Label>
                  <Input
                    id="dia_mes"
                    type="number"
                    required
                    min="1"
                    max="31"
                    value={formData.dia_mes}
                    onChange={(e) => setFormData({ ...formData, dia_mes: e.target.value })}
                    className={errores.dia_mes ? 'border-red-500' : ''}
                  />
                  {errores.dia_mes && <p className="text-xs text-red-600 mt-1">{errores.dia_mes}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full rounded-lg border-slate-200 dark:border-slate-600 dark:bg-slate-700 focus:ring-indigo-600 focus:border-indigo-600"
                  >
                    {CATEGORIAS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cantidad_min" className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Importe mín (€)
                  </Label>
                  <Input
                    id="cantidad_min"
                    type="number"
                    step="0.01"
                    value={formData.cantidad_min}
                    onChange={(e) => setFormData({ ...formData, cantidad_min: e.target.value })}
                    className={errores.cantidad_min ? 'border-red-500' : ''}
                    placeholder="0.00"
                  />
                  {errores.cantidad_min && <p className="text-xs text-red-600 mt-1">{errores.cantidad_min}</p>}
                </div>
                <div>
                  <Label htmlFor="cantidad_max" className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Importe máx (€)
                  </Label>
                  <Input
                    id="cantidad_max"
                    type="number"
                    step="0.01"
                    value={formData.cantidad_max}
                    onChange={(e) => setFormData({ ...formData, cantidad_max: e.target.value })}
                    className={errores.cantidad_max ? 'border-red-500' : ''}
                    placeholder="0.00"
                  />
                  {errores.cantidad_max && <p className="text-xs text-red-600 mt-1">{errores.cantidad_max}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Recurrencia
                </label>
                <select
                  value={formData.recurrencia.tipo}
                  onChange={(e) => setFormData({
                    ...formData,
                    recurrencia: { ...formData.recurrencia, tipo: e.target.value }
                  })}
                  className="w-full rounded-lg border-slate-200 dark:border-slate-600 dark:bg-slate-700 focus:ring-indigo-600 focus:border-indigo-600"
                >
                  {TIPOS_RECURRENCIA.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                {editando && (
                  <Button
                    type="button"
                    onClick={() => {
                      manejarEliminar(editando.id);
                      cerrarModal();
                    }}
                    variant="destructive"
                    className="flex-1"
                  >
                    Eliminar
                  </Button>
                )}
                <Button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {editando ? 'Actualizar' : 'Crear Evento'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpensesCalendar;
