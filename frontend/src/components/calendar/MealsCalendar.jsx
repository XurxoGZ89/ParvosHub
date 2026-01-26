import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Plus, X, Search, Sun, Moon, Edit2, Trash2, Check, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function MealsCalendar({ onBack }) {
  // Estados de UI
  const [semanaActual, setSemanaActual] = useState(0);
  
  // Estados de datos
  const [comidasCongeladas, setComidasCongeladas] = useState([]);
  const [comidasPlanificadas, setComidasPlanificadas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  
  // Estados de interacción
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [pulseCell, setPulseCell] = useState(null);
  const [modoTextoLibre, setModoTextoLibre] = useState(null);
  const [textoLibre, setTextoLibre] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [moveModal, setMoveModal] = useState(null);
  const [mostrarModalNueva, setMostrarModalNueva] = useState(false);
  const [comidaEditando, setComidaEditando] = useState(null);
  const [nuevaComida, setNuevaComida] = useState('');
  
  // Refs
  const moveModalRef = useRef(null);
  const deleteModalRef = useRef(null);

  // Cargar datos
  const cargarComidasCongeladas = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/comidas-congeladas`);
      setComidasCongeladas(response.data);
    } catch (error) {
      console.error('Error cargando comidas congeladas:', error);
      setToast({ type: 'error', message: 'Error al cargar comidas' });
    }
  }, []);

  const cargarComidasPlanificadas = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/comidas-planificadas`);
      setComidasPlanificadas(response.data);
    } catch (error) {
      console.error('Error cargando comidas planificadas:', error);
      setToast({ type: 'error', message: 'Error al cargar planificadas' });
    }
  }, []);

  // Limpiar comidas vencidas
  const limpiarComidasVencidas = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/comidas-planificadas/vencidas`);
      const comidasVencidas = response.data;
      if (comidasVencidas.length === 0) return;

      // Eliminar las comidas vencidas
      await Promise.all(comidasVencidas.map(comida => 
        axios.delete(`${API_URL}/comidas-planificadas/${comida.id}`)
      ));

      // Verificar qué comidas destachar del inventario
      const comidasPorId = new Map();
      comidasVencidas.forEach(comida => {
        if (comida.comida_id) {
          if (!comidasPorId.has(comida.comida_id)) {
            comidasPorId.set(comida.comida_id, []);
          }
          comidasPorId.get(comida.comida_id).push(comida.id);
        }
      });

      const todasPlanificadas = await axios.get(`${API_URL}/comidas-planificadas`);
      const comidasADestachar = [];

      for (const [comidaId, idsVencidos] of comidasPorId.entries()) {
        const otrasPlanificaciones = todasPlanificadas.data.filter(
          cp => cp.comida_id === comidaId && !idsVencidos.includes(cp.id)
        );
        if (otrasPlanificaciones.length === 0) {
          comidasADestachar.push(comidaId);
        }
      }

      if (comidasADestachar.length > 0) {
        await Promise.all(comidasADestachar.map(comidaId =>
          axios.put(`${API_URL}/comidas-congeladas/${comidaId}`, { tachada: false })
        ));
      }

      console.log(`✓ Limpiadas ${comidasVencidas.length} comidas vencidas`);
    } catch (err) {
      console.error('Error al limpiar comidas vencidas:', err);
    }
  }, []);

  // Hook: Cargar datos al iniciar
  useEffect(() => {
    limpiarComidasVencidas().then(() => {
      cargarComidasCongeladas();
      cargarComidasPlanificadas();
    });
    // Limpiar comidas tachadas de semanas pasadas
    axios.delete(`${API_URL}/comidas-congeladas/limpiar/pasadas`).catch(console.error);
  }, [cargarComidasCongeladas, cargarComidasPlanificadas, limpiarComidasVencidas]);

  // Hook: Toast automático
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Hook: Limpiar animación pulse
  useEffect(() => {
    if (pulseCell) {
      const timer = setTimeout(() => setPulseCell(null), 600);
      return () => clearTimeout(timer);
    }
  }, [pulseCell]);



  // Calcular fechas de la semana
  const fechasSemana = useMemo(() => {
    const hoy = new Date();
    const primerDia = new Date(hoy);
    primerDia.setDate(hoy.getDate() - hoy.getDay() + 1 + (semanaActual * 7));
    
    const fechas = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(primerDia);
      fecha.setDate(primerDia.getDate() + i);
      // Formatear usando la fecha local (sin conversión UTC)
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      fechas.push(`${year}-${month}-${day}`);
    }
    return fechas;
  }, [semanaActual]);

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Obtener comidas planificadas para una fecha y tipo
  const getComidasPlanificadas = useCallback((fecha, tipoComida) => {
    return comidasPlanificadas.filter(c => {
      // Comparar directamente - la API ya devuelve fecha como string YYYY-MM-DD
      return c.fecha === fecha && c.tipo_comida === tipoComida;
    });
  }, [comidasPlanificadas]);

  // Añadir comida al inventario
  const handleAñadirComida = async (e) => {
    e.preventDefault();
    if (!nuevaComida.trim()) return;

    try {
      await axios.post(`${API_URL}/comidas-congeladas`, { nombre: nuevaComida.trim() });
      await cargarComidasCongeladas();
      setNuevaComida('');
      setMostrarModalNueva(false);
      setToast({ mensaje: 'Comida añadida al inventario', tipo: 'success' });
    } catch (error) {
      console.error('Error añadiendo comida:', error);
      setToast({ mensaje: 'Error al añadir comida', tipo: 'error' });
    }
  };

  // Eliminar comida del inventario
  const handleEliminarComida = async (id) => {
    if (!window.confirm('¿Eliminar esta comida del inventario?')) return;

    try {
      await axios.delete(`${API_URL}/comidas-congeladas/${id}`);
      await cargarComidasCongeladas();
      setToast({ mensaje: 'Comida eliminada', tipo: 'success' });
    } catch (error) {
      console.error('Error eliminando comida:', error);
      setToast({ mensaje: 'Error al eliminar', tipo: 'error' });
    }
  };

  // Guardar nombre editado de comida
  const handleGuardarNombreComida = async (comidaId, nuevoNombre) => {
    if (!nuevoNombre.trim()) return;

    try {
      await axios.put(`${API_URL}/comidas-congeladas/${comidaId}`, { nombre: nuevoNombre.trim() });
      await cargarComidasCongeladas();
      setComidaEditando(null);
      setToast({ mensaje: 'Nombre actualizado', tipo: 'success' });
    } catch (error) {
      console.error('Error actualizando nombre:', error);
      setToast({ mensaje: 'Error al actualizar', tipo: 'error' });
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (e, item, source) => {
    setDraggedItem({ item, source });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (fecha, tipoComida) => {
    setDropTarget({ fecha, tipoComida });
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e, fechaStr, tipoComida) => {
    e.preventDefault();
    setDropTarget(null);
    if (!draggedItem || !draggedItem.item) {
      console.warn('Drag item inválido');
      return;
    }

    const fecha = new Date(fechaStr + 'T12:00:00');
    setPulseCell({ fecha: fecha.getTime(), tipoComida });

    if (draggedItem.source === 'inventario' && !draggedItem.item.tachada) {
      // Planificar desde inventario (primera vez)
      setLoading(true);
      try {
        const newPlanificada = await axios.post(`${API_URL}/comidas-planificadas`, {
          comida_id: draggedItem.item.id,
          comida_nombre: draggedItem.item.nombre,
          fecha: fechaStr,
          tipo_comida: tipoComida
        });
        
        if (!newPlanificada.data || !newPlanificada.data.id) {
          throw new Error('Respuesta inválida del servidor');
        }
        
        setToast({ type: 'success', message: `✓ "${draggedItem.item.nombre}" añadido` });
        setComidasPlanificadas(prev => [...prev, newPlanificada.data]);
        
        await axios.put(`${API_URL}/comidas-congeladas/${draggedItem.item.id}`, { tachada: true });
        setComidasCongeladas(prev =>
          prev.map(c => c.id === draggedItem.item.id ? { ...c, tachada: true } : c)
        );
      } catch (err) {
        console.error('Error al añadir comida planificada:', err);
        setToast({ type: 'error', message: err.response?.data?.error || 'Error al añadir' });
      } finally {
        setLoading(false);
        setDraggedItem(null);
      }
    } else if (draggedItem.source === 'calendario' && draggedItem.item.id) {
      // Devolver comida planificada al inventario (soltar en zona de inventario)
      if (tipoComida === 'inventario') {
        setLoading(true);
        try {
          await axios.delete(`${API_URL}/comidas-planificadas/${draggedItem.item.id}`);
          setComidasPlanificadas(prev => prev.filter(c => c.id !== draggedItem.item.id));
          
          if (draggedItem.item.comida_id) {
            await axios.put(`${API_URL}/comidas-congeladas/${draggedItem.item.comida_id}`, { tachada: false });
            setComidasCongeladas(prev =>
              prev.map(c => c.id === draggedItem.item.comida_id ? { ...c, tachada: false } : c)
            );
          }
          
          setToast({ type: 'success', message: `✓ "${draggedItem.item.comida_nombre}" devuelto al inventario` });
        } catch (err) {
          console.error('Error al devolver comida:', err);
          setToast({ type: 'error', message: err.response?.data?.error || 'Error al devolver' });
        } finally {
          setLoading(false);
          setDraggedItem(null);
        }
      } else {
        // Mover/Repetir: mostrar modal
        setMoveModal({
          item: draggedItem.item,
          source: draggedItem.source,
          fecha: fecha,
          fechaStr: fechaStr,
          tipoComida: tipoComida
        });
        setDraggedItem(null);
      }
    } else {
      // Ya está tachada: mostrar modal mover/repetir
      setMoveModal({
        item: draggedItem.item,
        source: draggedItem.source,
        fecha: fecha,
        fechaStr: fechaStr,
        tipoComida: tipoComida
      });
      setDraggedItem(null);
    }
  };

  // Eliminar comida planificada - Abrir modal de confirmación
  const handleEliminarPlanificada = async (comida) => {
    setDeleteModal({
      comida: comida,
      type: comida.comida_id ? 'both' : 'complete'
    });
  };

  // Confirmar eliminación
  const handleConfirmarEliminar = async (opcion) => {
    if (!deleteModal) return;
    const comida = deleteModal.comida;
    setLoading(true);
    
    try {
      await axios.delete(`${API_URL}/comidas-planificadas/${comida.id}`);
      setComidasPlanificadas(prev => prev.filter(c => c.id !== comida.id));
      
      if (opcion === 'quitar' && comida.comida_id) {
        await axios.put(`${API_URL}/comidas-congeladas/${comida.comida_id}`, { tachada: false });
        setComidasCongeladas(prev =>
          prev.map(c => c.id === comida.comida_id ? { ...c, tachada: false } : c)
        );
      }
      
      setToast({ 
        type: 'success', 
        message: `✓ "${comida.comida_nombre}" ${opcion === 'quitar' ? 'quitado' : 'eliminado'}` 
      });
    } catch (err) {
      console.error('Error:', err);
      setToast({ type: 'error', message: 'Error al eliminar' });
    } finally {
      setLoading(false);
      setDeleteModal(null);
    }
  };

  // Mover/Repetir comida
  const handleMoverORepetir = async (accion) => {
    if (!moveModal) return;
    setLoading(true);
    const fechaStr = moveModal.fechaStr;
    
    try {
      if (accion === 'repetir') {
        let response;
        if (moveModal.source === 'calendario') {
          response = await axios.post(`${API_URL}/comidas-planificadas`, {
            comida_id: moveModal.item.comida_id,
            comida_nombre: moveModal.item.comida_nombre,
            fecha: fechaStr,
            tipo_comida: moveModal.tipoComida
          });
        } else {
          response = await axios.post(`${API_URL}/comidas-planificadas`, {
            comida_id: moveModal.item.id,
            comida_nombre: moveModal.item.nombre,
            fecha: fechaStr,
            tipo_comida: moveModal.tipoComida
          });
        }
        setComidasPlanificadas(prev => [...prev, response.data]);
        setToast({ type: 'success', message: '✓ Item repetido' });
      } else {
        // mover
        if (moveModal.source === 'calendario') {
          await axios.put(`${API_URL}/comidas-planificadas/${moveModal.item.id}`, {
            fecha: fechaStr,
            tipo_comida: moveModal.tipoComida
          });
          setComidasPlanificadas(prev =>
            prev.map(c => c.id === moveModal.item.id 
              ? { ...c, fecha: fechaStr, tipo_comida: moveModal.tipoComida }
              : c
            )
          );
          setToast({ type: 'success', message: '✓ Item movido' });
        } else {
          const response = await axios.post(`${API_URL}/comidas-planificadas`, {
            comida_id: moveModal.item.id,
            comida_nombre: moveModal.item.nombre,
            fecha: fechaStr,
            tipo_comida: moveModal.tipoComida
          });
          setComidasPlanificadas(prev => [...prev, response.data]);
          setToast({ type: 'success', message: '✓ Item añadido' });
        }
      }
    } catch (err) {
      console.error('Error:', err);
      setToast({ type: 'error', message: 'Error al procesar' });
    } finally {
      setLoading(false);
      setMoveModal(null);
    }
  };

  // Añadir comida de texto libre
  const handleAñadirTextoLibre = async () => {
    if (!textoLibre.trim() || !modoTextoLibre) return;
    setLoading(true);
    
    try {
      if (!modoTextoLibre.fechaStr) {
        throw new Error('Fecha no válida');
      }
      
      const nombreComida = textoLibre.trim();
      
      const response = await axios.post(`${API_URL}/comidas-planificadas`, {
        comida_id: null,
        comida_nombre: nombreComida,
        fecha: modoTextoLibre.fechaStr,
        tipo_comida: modoTextoLibre.tipoComida
      });
      
      if (!response.data || !response.data.id) {
        throw new Error('Respuesta inválida del servidor');
      }
      
      setComidasPlanificadas(prev => [...prev, response.data]);
      setToast({ type: 'success', message: `✓ "${nombreComida}" añadido` });
      setTextoLibre('');
      setModoTextoLibre(null);
    } catch (err) {
      console.error('Error al añadir texto libre:', err);
      setToast({ type: 'error', message: err.response?.data?.error || 'Error al añadir' });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar comidas por búsqueda
  const comidasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return comidasCongeladas.filter(c => !c.tachada);
    return comidasCongeladas.filter(
      c => !c.tachada && c.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [comidasCongeladas, busqueda]);

  const rangoFechas = `${new Date(fechasSemana[0]).getDate()} - ${new Date(fechasSemana[6]).getDate()} ${new Date(fechasSemana[0]).toLocaleDateString('es-ES', { month: 'long' })}`;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Sidebar - Inventario */}
      <aside className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <Sun className="w-4 h-4" />
              </div>
              <h1 className="font-bold text-xl tracking-tight">
                ParvosHub <span className="text-indigo-600">V2</span>
              </h1>
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border-none"
              placeholder="Buscar recetas..."
            />
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Inventario ({comidasFiltradas.length})
            </h3>
            <Button
              onClick={() => setMostrarModalNueva(true)}
              variant="ghost"
              size="icon"
              className="p-1 h-auto"
            >
              <Plus className="w-4 h-4 text-indigo-600" />
            </Button>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-320px)] custom-scrollbar">
            {comidasFiltradas.map((comida) => (
              <div
                key={comida.id}
                draggable
                onDragStart={(e) => handleDragStart(e, comida, 'inventario')}
                className="group flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg transition-colors cursor-move"
              >
                {comidaEditando === comida.id ? (
                  <Input
                    type="text"
                    defaultValue={comida.nombre}
                    onBlur={(e) => handleGuardarNombreComida(comida.id, e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleGuardarNombreComida(comida.id, e.target.value);
                      }
                    }}
                    autoFocus
                    className="flex-1 text-sm"
                  />
                ) : (
                  <span className="flex-1 text-sm font-medium truncate">{comida.nombre}</span>
                )}
                <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                  <Button
                    onClick={() => setComidaEditando(comida.id)}
                    variant="ghost"
                    size="icon"
                    className="h-auto p-1"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={() => handleEliminarComida(comida.id)}
                    variant="ghost"
                    size="icon"
                    className="h-auto p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-[10px] text-white font-bold border-2 border-white dark:border-slate-800">
                S
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center text-[10px] text-white font-bold border-2 border-white dark:border-slate-800">
                X
              </div>
            </div>
            <div className="text-xs">
              <p className="font-semibold">Sonia & Xurxo</p>
              <p className="text-slate-500">Planificador Familiar</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-bold">Calendario de Comidas</h2>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-1">
              <Button
                onClick={() => setSemanaActual(s => s - 1)}
                variant="ghost"
                size="sm"
                className="p-1"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium px-2">{rangoFechas}</span>
              <Button
                onClick={() => setSemanaActual(s => s + 1)}
                variant="ghost"
                size="sm"
                className="p-1"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setMostrarModalNueva(true)}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Receta
            </Button>
          </div>
        </header>

        {/* Grid del Calendario */}
        <div className="flex-1 overflow-auto p-8">
          <div className="min-w-[1000px] bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
            {/* Cabecera de días */}
            <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
              <div className="p-4 border-r border-slate-200 dark:border-slate-700"></div>
              {diasSemana.map((dia, idx) => {
                const fecha = new Date(fechasSemana[idx]);
                const esFinSemana = idx >= 5;
                return (
                  <div key={dia} className={`p-4 text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0 ${esFinSemana ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{dia}</p>
                    <p className={`text-lg font-bold ${esFinSemana ? 'text-indigo-600' : ''}`}>
                      {fecha.getDate()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Fila: Comida */}
            <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-slate-100 dark:border-slate-700">
              <div className="p-6 bg-slate-50 dark:bg-slate-700/50 border-r border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-1">
                <Sun className="w-5 h-5 text-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Comida</span>
              </div>
              {fechasSemana.map((fecha, idx) => {
                const comidas = getComidasPlanificadas(fecha, 'comida');
                const isDragOver = dropTarget?.fecha === fecha && dropTarget?.tipoComida === 'comida';
                const esFinSemana = idx >= 5;
                const isPulsing = pulseCell?.fecha === new Date(fecha + 'T12:00:00').getTime() && pulseCell?.tipoComida === 'comida';

                return (
                  <div
                    key={`comida-${fecha}`}
                    onDragOver={handleDragOver}
                    onDragEnter={() => handleDragEnter(fecha, 'comida')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, fecha, 'comida')}
                    className={`p-3 border-r border-slate-100 dark:border-slate-700 last:border-r-0 min-h-[100px] bg-slate-50/30 dark:bg-transparent ${
                      esFinSemana ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''
                    } ${isDragOver ? 'bg-indigo-100 dark:bg-indigo-900/30' : ''} ${isPulsing ? 'pulse-animation' : ''}`}
                  >
                    {comidas.length > 0 ? (
                      <div className="space-y-2">
                        {comidas.map((comida) => (
                          <div
                            key={comida.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, comida, 'calendario')}
                            className="group relative h-full p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary transition-all cursor-move"
                          >
                            <p className="text-sm font-medium mb-1 group-hover:text-primary">{comida.comida_nombre || comida.nombre}</p>
                            {comida.comida_id && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Saludable</span>
                            )}
                            <button
                              onClick={() => handleEliminarPlanificada(comida)}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-red-100 dark:bg-red-900/30 text-red-600 rounded transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Button
                        onClick={() => setModoTextoLibre({ fechaStr: fecha, tipoComida: 'comida', dia: diasSemana[idx] })}
                        variant="ghost"
                        className="w-full h-full min-h-[80px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800"
                      >
                        <Plus className="w-5 h-5 text-slate-300" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Fila: Cena */}
            <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-slate-100 dark:border-slate-700">
              <div className="p-6 bg-slate-50 dark:bg-slate-700/50 border-r border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-1">
                <Moon className="w-5 h-5 text-indigo-400" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Cena</span>
              </div>
              {fechasSemana.map((fecha, idx) => {
                const cenas = getComidasPlanificadas(fecha, 'cena');
                const isDragOver = dropTarget?.fecha === fecha && dropTarget?.tipoComida === 'cena';
                const esFinSemana = idx >= 5;
                const isPulsing = pulseCell?.fecha === new Date(fecha + 'T12:00:00').getTime() && pulseCell?.tipoComida === 'cena';

                return (
                  <div
                    key={`cena-${fecha}`}
                    onDragOver={handleDragOver}
                    onDragEnter={() => handleDragEnter(fecha, 'cena')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, fecha, 'cena')}
                    className={`p-3 border-r border-slate-100 dark:border-slate-700 last:border-r-0 ${
                      esFinSemana ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''
                    } ${isDragOver ? 'bg-indigo-100 dark:bg-indigo-900/30' : ''} ${isPulsing ? 'pulse-animation' : ''}`}
                  >
                    {cenas.length > 0 ? (
                      <div className="space-y-2">
                        {cenas.map((comida) => (
                          <div
                            key={comida.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, comida, 'calendario')}
                            className="group relative h-full p-4 bg-white dark:bg-slate-700 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-600 hover:border-indigo-600 transition-all cursor-move"
                          >
                            <p className="text-sm font-medium mb-1 group-hover:text-indigo-600">{comida.comida_nombre || comida.nombre}</p>
                            <button
                              onClick={() => handleEliminarPlanificada(comida)}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-red-100 dark:bg-red-900/30 text-red-600 rounded transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Button
                        onClick={() => setModoTextoLibre({ fechaStr: fecha, tipoComida: 'cena', dia: diasSemana[idx] })}
                        variant="ghost"
                        className="w-full h-full min-h-[80px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-600"
                      >
                        <Plus className="w-5 h-5 text-slate-300" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Componentes debajo del calendario */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Lista de la Compra */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-600" />
                  Lista de la Compra
                </h3>
                <span className="text-xs text-slate-500">8 items</span>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center gap-3 text-sm">
                  <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-600 dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
                  <span className="flex-1">Pechuga de pollo</span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">500g</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-600 dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
                  <span className="flex-1">Tomates rama</span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">1kg</span>
                </li>
                <li className="flex items-center gap-3 text-sm opacity-50">
                  <input type="checkbox" checked className="rounded text-indigo-600 focus:ring-indigo-600 dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
                  <span className="flex-1 line-through">Leche entera</span>
                </li>
              </ul>
            </div>

            {/* Sugerencia Semanal */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <Sun className="w-32 h-32" />
              </div>
              <h3 className="font-bold mb-2">Sugerencia Semanal</h3>
              <p className="text-indigo-100 text-sm mb-4">
                Parece que tenéis muchos huevos. ¿Qué tal una Tortilla de Patatas para el jueves?
              </p>
              <button className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all">
                PLANIFICAR AHORA
              </button>
            </div>

            {/* Plan Mensual */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm mb-1">Plan Mensual</h3>
              <p className="text-xs text-slate-500 mb-4">
                Exporta o sincroniza tu calendario con Google Calendar.
              </p>
              <button className="w-full py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-xs font-bold transition-colors">
                CONFIGURAR
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Nueva Comida */}
      {mostrarModalNueva && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Nueva Receta</h3>
              <Button
                onClick={() => {
                  setMostrarModalNueva(false);
                  setNuevaComida('');
                }}
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleAñadirComida} className="space-y-4">
              <div>
                <Label htmlFor="nombre-receta" className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la receta
                </Label>
                <Input
                  id="nombre-receta"
                  type="text"
                  required
                  value={nuevaComida}
                  onChange={(e) => setNuevaComida(e.target.value)}
                  placeholder="Ej: Lentejas con chorizo"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                Añadir al Inventario
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] animate-slide-up">
          <div className={`px-6 py-4 rounded-xl shadow-lg border ${
            toast.tipo === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {toast.tipo === 'success' ? (
                <Check className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
              <span className="font-medium">{toast.mensaje || toast.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Mover o Repetir */}
      {moveModal && (
        <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center p-4">
          <div ref={moveModalRef} className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
            <h3 className="text-xl font-bold mb-4">¿Qué deseas hacer?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              ¿Quieres mover o repetir "{moveModal.item.comida_nombre || moveModal.item.nombre}"?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => handleMoverORepetir('mover')}
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {loading ? 'Procesando...' : 'Mover'}
              </Button>
              <Button
                onClick={() => handleMoverORepetir('repetir')}
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? 'Procesando...' : 'Repetir'}
              </Button>
              <Button
                onClick={() => setMoveModal(null)}
                disabled={loading}
                variant="outline"
                size="icon"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Eliminar con opciones */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center p-4">
          <div ref={deleteModalRef} className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
            <h3 className="text-xl font-bold mb-4">Eliminar planificación</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              ¿Qué deseas hacer con "{deleteModal.comida.comida_nombre}"?
            </p>
            <div className="flex flex-col gap-3">
              {deleteModal.type === 'both' && (
                <Button
                  onClick={() => handleConfirmarEliminar('quitar')}
                  disabled={loading}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-left px-4 justify-start"
                >
                  {loading ? 'Procesando...' : 'Quitar de la planificación (devolver al inventario)'}
                </Button>
              )}
              <Button
                onClick={() => handleConfirmarEliminar('eliminar')}
                disabled={loading}
                variant="destructive"
                className="w-full"
              >
                {loading ? 'Procesando...' : 'Eliminar completamente'}
              </Button>
              <Button
                onClick={() => setDeleteModal(null)}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Texto libre */}
      {modoTextoLibre && (
        <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
            <h3 className="text-xl font-bold mb-4">Añadir comida personalizada</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Escribe el nombre de la comida para el {modoTextoLibre.dia} ({modoTextoLibre.tipoComida})
            </p>
            <Input
              type="text"
              value={textoLibre}
              onChange={(e) => setTextoLibre(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleAñadirTextoLibre();
              }}
              className="mb-4"
              placeholder="Ej: Pizza casera"
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                onClick={handleAñadirTextoLibre}
                disabled={loading || !textoLibre.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {loading ? 'Añadiendo...' : 'Añadir'}
              </Button>
              <Button
                onClick={() => {
                  setModoTextoLibre(null);
                  setTextoLibre('');
                }}
                disabled={loading}
                variant="outline"
                size="icon"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
        }
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        @keyframes pulse-cell {
          0% { transform: scale(1); box-shadow: 0 0 0 rgba(99, 102, 241, 0); }
          50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(99, 102, 241, 0.5); }
          100% { transform: scale(1); box-shadow: 0 0 0 rgba(99, 102, 241, 0); }
        }
        .pulse-animation {
          animation: pulse-cell 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}

export default MealsCalendar;
