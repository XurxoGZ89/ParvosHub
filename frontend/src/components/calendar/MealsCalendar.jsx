import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { 
  ChevronLeft, ChevronRight, Plus, X, Search, Sun, Moon, 
  Edit2, Trash2, Check, Calendar, Package, 
  ShoppingCart, BarChart3, AlertTriangle, ArrowLeft
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';


const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const CATEGORIAS = [
  { value: 'carne', label: 'Carne', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', emoji: '🥩' },
  { value: 'pescado', label: 'Pescado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', emoji: '🐟' },
  { value: 'vegetariano', label: 'Vegetariano', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', emoji: '🥬' },
  { value: 'otros', label: 'Otros', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', emoji: '🍽️' },
];

const CATEGORIAS_WIDGET = [
  ...[
    { value: 'carne', label: 'Carne', emoji: '🥩', barColor: 'bg-red-400' },
    { value: 'pescado', label: 'Pescado', emoji: '🐟', barColor: 'bg-blue-400' },
    { value: 'vegetariano', label: 'Vegetariano', emoji: '🥬', barColor: 'bg-green-400' },
    { value: 'comer_fuera', label: 'Comer Fuera', emoji: '🍴', barColor: 'bg-amber-400' },
    { value: 'otros', label: 'Otros', emoji: '🍽️', barColor: 'bg-slate-400' },
  ]
];

const getCategoriaInfo = (cat) => CATEGORIAS.find(c => c.value === cat) || CATEGORIAS[3];

// Normaliza fecha para input type="date" (siempre YYYY-MM-DD)
const normalizeDateForInput = (fechaRaw) => {
  if (!fechaRaw) return '';
  try {
    // Si es Date object
    if (fechaRaw instanceof Date) {
      const year = fechaRaw.getFullYear();
      const month = String(fechaRaw.getMonth() + 1).padStart(2, '0');
      const day = String(fechaRaw.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    // Si es ISO string (ej: "2026-02-10T00:00:00.000Z"), convertir a fecha local
    if (typeof fechaRaw === 'string' && fechaRaw.includes('T')) {
      const date = new Date(fechaRaw);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    // Si ya es formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaRaw)) {
      return fechaRaw;
    }
    return '';
  } catch {
    return '';
  }
};

const formatFechaCaducidad = (fechaRaw) => {
  if (!fechaRaw) return null;
  try {
    // Handle various date formats from PostgreSQL
    let dateStr = fechaRaw;
    
    // If it's already a Date object, convert to ISO string
    if (fechaRaw instanceof Date) {
      dateStr = fechaRaw.toISOString().split('T')[0];
    }
    // If it's a full ISO string (e.g., "2026-02-10T00:00:00.000Z"), extract date part
    else if (typeof fechaRaw === 'string' && fechaRaw.includes('T')) {
      dateStr = fechaRaw.split('T')[0];
    }
    // Should now be YYYY-MM-DD format
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return null;
    
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return null;
    
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  } catch {
    return null;
  }
};

function MealsCalendar({ onBack }) {
  // Estados de UI
  const [semanaActual, setSemanaActual] = useState(0);
  const [mobileDay, setMobileDay] = useState(null);
  
  // Estados de datos
  const [comidasCongeladas, setComidasCongeladas] = useState([]);
  const [comidasPlanificadas, setComidasPlanificadas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [listaCompra, setListaCompra] = useState([]);
  
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
  const [comidaPlanificadaEditando, setComidaPlanificadaEditando] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [busquedaOpen, setBusquedaOpen] = useState(false);
  
  // Add product modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState('');
  const [nuevoProductoCategoria, setNuevoProductoCategoria] = useState('otros');
  const [nuevoProductoCaducidad, setNuevoProductoCaducidad] = useState('');

  // Edit product modal
  const [editModal, setEditModal] = useState(null);

  // Lista de compra
  const [nuevoItemCompra, setNuevoItemCompra] = useState('');
  
  // Refs
  const moveModalRef = useRef(null);
  const deleteModalRef = useRef(null);
  const addInputRef = useRef(null);

  // Cargar datos
  const cargarComidasCongeladas = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/comidas-congeladas`);
      setComidasCongeladas(response.data);
    } catch (error) {
      console.error('Error cargando comidas:', error);
      setToast({ tipo: 'error', mensaje: 'Error al cargar despensa' });
    }
  }, []);

  const cargarComidasPlanificadas = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/comidas-planificadas`);
      setComidasPlanificadas(response.data);
    } catch (error) {
      console.error('Error cargando planificadas:', error);
      setToast({ tipo: 'error', mensaje: 'Error al cargar planificadas' });
    }
  }, []);

  const limpiarComidasVencidas = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/comidas-planificadas/vencidas`);
      const comidasVencidas = response.data;
      if (comidasVencidas.length === 0) return;

      await Promise.all(comidasVencidas.map(comida => 
        axios.delete(`${API_URL}/comidas-planificadas/${comida.id}`)
      ));

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
    } catch (err) {
      console.error('Error al limpiar vencidas:', err);
    }
  }, []);

  useEffect(() => {
    limpiarComidasVencidas().then(() => {
      cargarComidasCongeladas();
      cargarComidasPlanificadas();
    });
    axios.delete(`${API_URL}/comidas-congeladas/limpiar/pasadas`).catch(console.error);

    const saved = localStorage.getItem('parvos_lista_compra');
    if (saved) setListaCompra(JSON.parse(saved));
  }, [cargarComidasCongeladas, cargarComidasPlanificadas, limpiarComidasVencidas]);

  useEffect(() => {
    localStorage.setItem('parvos_lista_compra', JSON.stringify(listaCompra));
  }, [listaCompra]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (pulseCell) {
      const timer = setTimeout(() => setPulseCell(null), 600);
      return () => clearTimeout(timer);
    }
  }, [pulseCell]);

  useEffect(() => {
    if (mobileDay === null) {
      const hoy = new Date();
      const diaIdx = (hoy.getDay() + 6) % 7;
      setMobileDay(diaIdx);
    }
  }, [mobileDay]);

  // Calcular fechas de la semana
  const fechasSemana = useMemo(() => {
    const hoy = new Date();
    const primerDia = new Date(hoy);
    primerDia.setDate(hoy.getDate() - hoy.getDay() + 1 + (semanaActual * 7));
    
    const fechas = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(primerDia);
      fecha.setDate(primerDia.getDate() + i);
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      fechas.push(`${year}-${month}-${day}`);
    }
    return fechas;
  }, [semanaActual]);

  const hoyStr = useMemo(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  }, []);

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const diasCortos = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const getComidasPlanificadas = useCallback((fecha, tipoComida) => {
    return comidasPlanificadas.filter(c => c.fecha === fecha && c.tipo_comida === tipoComida);
  }, [comidasPlanificadas]);

  // ===== Estadísticas =====
  const resumenSemanal = useMemo(() => {
    const productosDisponibles = comidasCongeladas.filter(c => !c.tachada).length;
    const planificadosSemana = comidasPlanificadas.filter(c => fechasSemana.includes(c.fecha)).length;
    const totalSlots = 14;
    const sinPlanificar = totalSlots - planificadosSemana;
    
    const ultimaFechaSemana = fechasSemana[6];
    const proximosCaducar = comidasCongeladas.filter(c => {
      if (!c.fecha_caducidad || c.tachada) return false;
      return c.fecha_caducidad <= ultimaFechaSemana;
    }).length;

    return { productosDisponibles, planificadosSemana, sinPlanificar, proximosCaducar };
  }, [comidasCongeladas, comidasPlanificadas, fechasSemana]);

  const distribucionMensual = useMemo(() => {
    const hoy = new Date();
    const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    
    const comidasMes = comidasPlanificadas.filter(c => c.fecha && c.fecha.startsWith(mesActual));
    const total = comidasMes.length;
    
    if (total === 0) return { carne: 0, pescado: 0, vegetariano: 0, comer_fuera: 0, otros: 0, total: 0 };

    const conteo = { carne: 0, pescado: 0, vegetariano: 0, comer_fuera: 0, otros: 0 };
    comidasMes.forEach(c => {
      // Items manuales (sin comida_id) y sin categoría van a "comer_fuera"
      // El resto usa su categoría normalmente
      const cat = c.categoria || (!c.comida_id ? 'comer_fuera' : 'otros');
      if (conteo[cat] !== undefined) conteo[cat]++;
      else conteo.otros++;
    });

    return { ...conteo, total };
  }, [comidasPlanificadas]);

  // ===== Handlers de producto (despensa) =====
  const handleAñadirProducto = async (e) => {
    e.preventDefault();
    if (!nuevoProducto.trim()) return;

    try {
      // Convertir fecha local a medianoche UTC del día siguiente para evitar problemas de timezone
      let fechaCaducidadFinal = null;
      if (nuevoProductoCaducidad) {
        const [year, month, day] = nuevoProductoCaducidad.split('-').map(Number);
        const dateLocal = new Date(year, month - 1, day, 12, 0, 0);
        fechaCaducidadFinal = dateLocal.toISOString();
      }
      
      await axios.post(`${API_URL}/comidas-congeladas`, { 
        nombre: nuevoProducto.trim(),
        categoria: nuevoProductoCategoria,
        fecha_caducidad: fechaCaducidadFinal
      });
      await cargarComidasCongeladas();
      setNuevoProducto('');
      setNuevoProductoCategoria('otros');
      setNuevoProductoCaducidad('');
      setShowAddModal(false);
      setToast({ mensaje: '✓ Producto añadido a la despensa', tipo: 'success' });
    } catch (error) {
      console.error('Error añadiendo producto:', error);
      setToast({ mensaje: 'Error al añadir producto', tipo: 'error' });
    }
  };

  const handleEliminarComida = async (id) => {
    if (!window.confirm('¿Eliminar este producto de la despensa?')) return;
    try {
      await axios.delete(`${API_URL}/comidas-congeladas/${id}`);
      await cargarComidasCongeladas();
      setToast({ mensaje: '✓ Producto eliminado', tipo: 'success' });
    } catch (error) {
      setToast({ mensaje: 'Error al eliminar', tipo: 'error' });
    }
  };

  const handleGuardarComidaEdit = async () => {
    if (!editModal || !editModal.nombre.trim()) return;
    try {
      // Convertir fecha local a medianoche UTC del día siguiente para evitar problemas de timezone
      let fechaCaducidadFinal = null;
      if (editModal.fecha_caducidad) {
        const [year, month, day] = editModal.fecha_caducidad.split('-').map(Number);
        const dateLocal = new Date(year, month - 1, day, 12, 0, 0);
        fechaCaducidadFinal = dateLocal.toISOString();
      }
      
      await axios.put(`${API_URL}/comidas-congeladas/${editModal.id}`, { 
        nombre: editModal.nombre.trim(),
        categoria: editModal.categoria,
        fecha_caducidad: fechaCaducidadFinal
      });
      await cargarComidasCongeladas();
      setEditModal(null);
      setToast({ mensaje: '✓ Producto actualizado', tipo: 'success' });
    } catch (error) {
      setToast({ mensaje: 'Error al actualizar', tipo: 'error' });
    }
  };

  const handleGuardarNombrePlanificada = async (comidaId, nuevoNombre) => {
    if (!nuevoNombre.trim()) return;
    try {
      await axios.put(`${API_URL}/comidas-planificadas/${comidaId}`, { comida_nombre: nuevoNombre.trim() });
      await cargarComidasPlanificadas();
      setComidaPlanificadaEditando(null);
      setToast({ mensaje: '✓ Actualizado', tipo: 'success' });
    } catch (error) {
      setToast({ mensaje: 'Error al actualizar', tipo: 'error' });
    }
  };

  // ===== Lista de compra =====
  const handleAddItemCompra = (e) => {
    e.preventDefault();
    if (!nuevoItemCompra.trim()) return;
    setListaCompra(prev => [...prev, { id: Date.now(), nombre: nuevoItemCompra.trim(), checked: false }]);
    setNuevoItemCompra('');
  };

  const handleToggleItemCompra = (id) => {
    setListaCompra(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleDeleteItemCompra = (id) => {
    setListaCompra(prev => prev.filter(item => item.id !== id));
  };

  // ===== Drag & Drop =====
  const handleDragStart = (e, item, source) => {
    setDraggedItem({ item, source });
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
    e.currentTarget.style.transform = 'scale(1.05) rotate(2deg)';
    e.currentTarget.style.transition = 'all 0.2s';
    document.body.style.cursor = 'grabbing';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
    setDraggedItem(null);
    setDropTarget(null);
    document.body.style.cursor = 'default';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, fecha, tipoComida) => {
    e.preventDefault();
    setDropTarget(prev => {
      if (prev?.fecha === fecha && prev?.tipoComida === tipoComida) return prev;
      return { fecha, tipoComida };
    });
  };

  const handleDragLeave = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDropTarget(null);
    }
  };

  const handleDropOnSidebar = async (e) => {
    e.preventDefault();
    setDropTarget(null);
    if (!draggedItem || draggedItem.source !== 'calendario') return;

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
      
      setToast({ tipo: 'success', mensaje: `✓ "${draggedItem.item.comida_nombre}" devuelto a la despensa` });
    } catch (err) {
      setToast({ tipo: 'error', mensaje: 'Error al devolver' });
    } finally {
      setLoading(false);
      setDraggedItem(null);
    }
  };

  const handleDrop = async (e, fechaStr, tipoComida) => {
    e.preventDefault();
    setDropTarget(null);
    if (!draggedItem || !draggedItem.item) return;

    const fecha = new Date(fechaStr + 'T12:00:00');
    setPulseCell({ fecha: fecha.getTime(), tipoComida });

    if (draggedItem.source === 'inventario' && !draggedItem.item.tachada) {
      setLoading(true);
      try {
        const newPlanificada = await axios.post(`${API_URL}/comidas-planificadas`, {
          comida_id: draggedItem.item.id,
          comida_nombre: draggedItem.item.nombre,
          fecha: fechaStr,
          tipo_comida: tipoComida,
          categoria: draggedItem.item.categoria || 'otros'
        });
        
        if (!newPlanificada.data || !newPlanificada.data.id) throw new Error('Respuesta inválida');
        
        setToast({ tipo: 'success', mensaje: `✓ "${draggedItem.item.nombre}" planificado` });
        setComidasPlanificadas(prev => [...prev, newPlanificada.data]);
        
        await axios.put(`${API_URL}/comidas-congeladas/${draggedItem.item.id}`, { tachada: true });
        setComidasCongeladas(prev =>
          prev.map(c => c.id === draggedItem.item.id ? { ...c, tachada: true } : c)
        );
      } catch (err) {
        setToast({ tipo: 'error', mensaje: err.response?.data?.error || 'Error al planificar' });
      } finally {
        setLoading(false);
        setDraggedItem(null);
      }
    } else if (draggedItem.source === 'calendario' && draggedItem.item.id) {
      setMoveModal({
        item: draggedItem.item,
        source: draggedItem.source,
        fecha, fechaStr, tipoComida
      });
      setDraggedItem(null);
    } else {
      setMoveModal({
        item: draggedItem.item,
        source: draggedItem.source,
        fecha, fechaStr, tipoComida
      });
      setDraggedItem(null);
    }
  };

  const handleEliminarPlanificada = async (comida) => {
    setDeleteModal({
      comida,
      type: comida.comida_id ? 'both' : 'complete'
    });
  };

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
      
      setToast({ tipo: 'success', mensaje: `✓ "${comida.comida_nombre}" ${opcion === 'quitar' ? 'devuelto' : 'eliminado'}` });
    } catch (err) {
      setToast({ tipo: 'error', mensaje: 'Error al eliminar' });
    } finally {
      setLoading(false);
      setDeleteModal(null);
    }
  };

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
            tipo_comida: moveModal.tipoComida,
            categoria: moveModal.item.categoria
          });
        } else {
          response = await axios.post(`${API_URL}/comidas-planificadas`, {
            comida_id: moveModal.item.id,
            comida_nombre: moveModal.item.nombre,
            fecha: fechaStr,
            tipo_comida: moveModal.tipoComida,
            categoria: moveModal.item.categoria
          });
        }
        setComidasPlanificadas(prev => [...prev, response.data]);
        setToast({ tipo: 'success', mensaje: '✓ Repetido correctamente' });
      } else {
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
          setToast({ tipo: 'success', mensaje: '✓ Movido correctamente' });
        } else {
          const response = await axios.post(`${API_URL}/comidas-planificadas`, {
            comida_id: moveModal.item.id,
            comida_nombre: moveModal.item.nombre,
            fecha: fechaStr,
            tipo_comida: moveModal.tipoComida,
            categoria: moveModal.item.categoria
          });
          setComidasPlanificadas(prev => [...prev, response.data]);
          setToast({ tipo: 'success', mensaje: '✓ Añadido correctamente' });
        }
      }
    } catch (err) {
      setToast({ tipo: 'error', mensaje: 'Error al procesar' });
    } finally {
      setLoading(false);
      setMoveModal(null);
    }
  };

  const handleAñadirTextoLibre = async () => {
    if (!textoLibre.trim() || !modoTextoLibre) return;
    setLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/comidas-planificadas`, {
        comida_id: null,
        comida_nombre: textoLibre.trim(),
        fecha: modoTextoLibre.fechaStr,
        tipo_comida: modoTextoLibre.tipoComida,
        categoria: 'comer_fuera'
      });
      
      if (!response.data || !response.data.id) throw new Error('Respuesta inválida');
      
      setComidasPlanificadas(prev => [...prev, response.data]);
      setToast({ tipo: 'success', mensaje: `✓ "${textoLibre.trim()}" añadido` });
      setTextoLibre('');
      setModoTextoLibre(null);
    } catch (err) {
      setToast({ tipo: 'error', mensaje: 'Error al añadir' });
    } finally {
      setLoading(false);
    }
  };

  const comidasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return comidasCongeladas.filter(c => !c.tachada);
    return comidasCongeladas.filter(
      c => !c.tachada && c.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [comidasCongeladas, busqueda]);

  const rangoFechas = useMemo(() => {
    const inicio = new Date(fechasSemana[0] + 'T12:00:00');
    const fin = new Date(fechasSemana[6] + 'T12:00:00');
    const mesInicio = inicio.toLocaleDateString('es-ES', { month: 'short' });
    const mesFin = fin.toLocaleDateString('es-ES', { month: 'short' });
    if (mesInicio === mesFin) {
      return `${inicio.getDate()} - ${fin.getDate()} ${mesInicio}`;
    }
    return `${inicio.getDate()} ${mesInicio} - ${fin.getDate()} ${mesFin}`;
  }, [fechasSemana]);

  const getCaducidadStatus = (fechaCad) => {
    if (!fechaCad) return null;
    try {
      const hoy = new Date();
      hoy.setHours(0,0,0,0);
      
      // Parse fecha robustamente
      let dateStr = fechaCad;
      if (typeof fechaCad === 'string' && fechaCad.includes('T')) {
        dateStr = fechaCad.split('T')[0];
      }
      const [year, month, day] = dateStr.split('-').map(Number);
      if (!year || !month || !day) return null;
      
      const cad = new Date(year, month - 1, day);
      if (isNaN(cad.getTime())) return null;
      
      const diff = Math.ceil((cad - hoy) / (1000 * 60 * 60 * 24));
      if (diff < 0) return { label: 'Caducado', class: 'bg-red-500 text-white', urgent: true };
      if (diff <= 2) return { label: `${diff}d`, class: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400', urgent: true };
      if (diff <= 7) return { label: `${diff}d`, class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400', urgent: false };
      return null;
    } catch {
      return null;
    }
  };

  const getCategoryBorderColor = (cat, esManual) => {
    if (esManual) return 'border-l-amber-400';
    switch(cat) {
      case 'carne': return 'border-l-red-400';
      case 'pescado': return 'border-l-blue-400';
      case 'vegetariano': return 'border-l-green-400';
      default: return 'border-l-slate-300 dark:border-l-slate-500';
    }
  };

  // Render celda del calendario (reutilizable comida/cena)
  const renderCalendarCell = (fecha, tipoComida, idx) => {
    const comidas = getComidasPlanificadas(fecha, tipoComida);
    const isDragOver = dropTarget?.fecha === fecha && dropTarget?.tipoComida === tipoComida;
    const esHoy = fecha === hoyStr;
    const esFinSemana = idx >= 5;
    const isPulsing = pulseCell?.fecha === new Date(fecha + 'T12:00:00').getTime() && pulseCell?.tipoComida === tipoComida;

    return (
      <div
        key={`${tipoComida}-${fecha}`}
        onDragOver={handleDragOver}
        onDragEnter={(e) => handleDragEnter(e, fecha, tipoComida)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, fecha, tipoComida)}
        className={`p-1.5 sm:p-2 border-r border-slate-100 dark:border-slate-700 last:border-r-0 min-h-[80px] transition-all duration-200 relative ${
          esHoy ? 'bg-indigo-50/50 dark:bg-indigo-900/15' : tipoComida === 'cena' ? 'bg-slate-50/30 dark:bg-slate-800/40' : ''
        } ${esFinSemana && !esHoy ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''} ${isDragOver ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-inset ring-indigo-400 dark:ring-indigo-500' : ''} ${isPulsing ? 'pulse-animation' : ''}`}
      >
        {isDragOver && comidas.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-indigo-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg">
              Soltar aquí
            </div>
          </div>
        )}
        {comidas.length > 0 ? (
          <div className="space-y-1">
            {comidas.map((comida) => {
              const esDeInventario = !!comida.comida_id;
              const borderColor = getCategoryBorderColor(comida.categoria, !esDeInventario);
              const catInfo = getCategoriaInfo(comida.categoria);
              return (
                <div
                  key={comida.id}
                  draggable={comidaPlanificadaEditando !== comida.id}
                  onDragStart={(e) => handleDragStart(e, comida, 'calendario')}
                  onDragEnd={handleDragEnd}
                  title={`${comida.comida_nombre || comida.nombre}${!esDeInventario ? ' (Comer Fuera)' : ` (${catInfo.label})`}`}
                  className={`group relative border-l-[3px] ${borderColor} rounded-r-md py-1 px-1.5 sm:px-2 transition-all cursor-grab active:cursor-grabbing hover:shadow-md ${
                    esDeInventario 
                      ? 'bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20' 
                      : 'bg-amber-50/80 dark:bg-amber-900/15 hover:bg-amber-100/80 dark:hover:bg-amber-900/25'
                  }`}
                >
                  {comidaPlanificadaEditando === comida.id ? (
                    <Input
                      type="text"
                      defaultValue={comida.comida_nombre || comida.nombre}
                      onBlur={(e) => handleGuardarNombrePlanificada(comida.id, e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleGuardarNombrePlanificada(comida.id, e.target.value); }}
                      autoFocus
                      className="text-xs h-6 p-1"
                    />
                  ) : (
                    <p className="text-[11px] sm:text-xs font-medium leading-snug pr-6 break-words">
                      {comida.comida_nombre || comida.nombre}
                    </p>
                  )}
                  <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 flex gap-px transition-opacity z-10">
                    <button onClick={(e) => { 
                      e.stopPropagation(); 
                      // Abrir modal de edición (para items de inventario usa datos del producto original)
                      if (esDeInventario && comida.comida_id) {
                        const original = comidasCongeladas.find(c => c.id === comida.comida_id);
                        if (original) {
                          setEditModal({ 
                            id: original.id, 
                            nombre: original.nombre, 
                            categoria: original.categoria || 'otros', 
                            fecha_caducidad: normalizeDateForInput(original.fecha_caducidad)
                          });
                        }
                      } else {
                        setComidaPlanificadaEditando(comida.id);
                      }
                    }} className="p-0.5 bg-white dark:bg-slate-700 text-blue-500 rounded shadow-sm hover:bg-blue-50 transition-colors">
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleEliminarPlanificada(comida); }} className="p-0.5 bg-white dark:bg-slate-700 text-red-500 rounded shadow-sm hover:bg-red-50 transition-colors">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              );
            })}
            {/* Mini botón + debajo de items existentes */}
            <button
              onClick={() => setModoTextoLibre({ fechaStr: fecha, tipoComida, dia: diasSemana[idx] })}
              className="w-full py-0.5 rounded text-slate-300 dark:text-slate-600 hover:text-indigo-400 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors flex items-center justify-center"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setModoTextoLibre({ fechaStr: fecha, tipoComida, dia: diasSemana[idx] })}
            className="w-full h-full min-h-[60px] rounded-lg border border-dashed border-slate-200 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-500 flex items-center justify-center transition-all hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 group"
          >
            <Plus className="w-4 h-4 text-slate-200 dark:text-slate-700 group-hover:text-indigo-400 transition-colors" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      
      {/* Mobile: Overlay backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ===== SIDEBAR - DESPENSA ===== */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        onDragOver={draggedItem?.source === 'calendario' ? handleDragOver : undefined}
        onDrop={draggedItem?.source === 'calendario' ? handleDropOnSidebar : undefined}
        onDragEnter={draggedItem?.source === 'calendario' ? (e) => { e.preventDefault(); setDropTarget({ fecha: 'sidebar', tipoComida: 'inventario' }); } : undefined}
        onDragLeave={draggedItem?.source === 'calendario' ? () => setDropTarget(null) : undefined}
      >
        <div className="p-4 sm:p-6 flex-1 overflow-hidden flex flex-col">
          {/* Header sidebar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <Package className="w-4 h-4" />
              </div>
              <h1 className="font-bold text-lg tracking-tight">
                ParvosHub <span className="text-indigo-600">V2</span>
              </h1>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drop zone indicator */}
          {draggedItem?.source === 'calendario' && (
            <div className={`mb-3 p-3 rounded-xl border-2 border-dashed text-center text-sm font-medium transition-all ${
              dropTarget?.fecha === 'sidebar' 
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 scale-[1.02]' 
                : 'border-indigo-300 bg-indigo-50/50 dark:bg-indigo-900/10 text-indigo-600'
            }`}>
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              Soltar aquí para devolver a despensa
            </div>
          )}

          {/* Título despensa + buscador + botón añadir */}
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0">
              Despensa ({comidasFiltradas.length})
            </h3>
            <div className="flex-1" />
            {busquedaOpen ? (
              <div className="flex-1 relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
                <Input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onBlur={() => { if (!busqueda) setBusquedaOpen(false); }}
                  autoFocus
                  className="w-full pl-7 pr-2 h-7 text-xs bg-slate-100 dark:bg-slate-700 border-none"
                  placeholder="Buscar..."
                />
              </div>
            ) : (
              <button onClick={() => setBusquedaOpen(true)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <Search className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
            <button 
              onClick={() => setShowAddModal(true)} 
              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Lista de productos */}
          <div className="space-y-0.5 overflow-y-auto flex-1 custom-scrollbar pr-1">
            {comidasFiltradas.map((comida) => {
              const cadStatus = getCaducidadStatus(comida.fecha_caducidad);
              const getCategoryDot = (cat) => {
                switch(cat) {
                  case 'carne': return 'bg-red-400';
                  case 'pescado': return 'bg-blue-400';
                  case 'vegetariano': return 'bg-green-400';
                  default: return 'bg-slate-300 dark:bg-slate-500';
                }
              };
              return (
                <div
                  key={comida.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, comida, 'inventario')}
                  onDragEnd={handleDragEnd}
                  className="group flex items-center gap-2 px-2.5 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-700 rounded-lg transition-all cursor-grab active:cursor-grabbing"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getCategoryDot(comida.categoria)}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{comida.nombre}</span>
                    {comida.fecha_caducidad && (
                      <span className={`text-[10px] leading-none font-semibold ${
                        cadStatus?.urgent ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {cadStatus?.urgent && '⚠ '}
                        Cad: {formatFechaCaducidad(comida.fecha_caducidad) || 'N/A'}
                      </span>
                    )}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity flex-shrink-0">
                    <button onClick={() => setEditModal({ id: comida.id, nombre: comida.nombre, categoria: comida.categoria || 'otros', fecha_caducidad: normalizeDateForInput(comida.fecha_caducidad) })} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors">
                      <Edit2 className="w-3 h-3 text-slate-400" />
                    </button>
                    <button onClick={() => handleEliminarComida(comida.id)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors">
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
            {comidasFiltradas.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Despensa vacía</p>
                <p className="text-xs mt-1">Pulsa + para añadir</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer sidebar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-orange-400 flex items-center justify-center text-[10px] text-white font-bold border-2 border-white dark:border-slate-800">S</div>
              <div className="w-7 h-7 rounded-full bg-indigo-400 flex items-center justify-center text-[10px] text-white font-bold border-2 border-white dark:border-slate-800">X</div>
            </div>
            <div className="text-xs">
              <p className="font-semibold">Sonia & Xurxo</p>
              <p className="text-slate-500">Planificador Familiar</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== CONTENIDO PRINCIPAL ===== */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 sm:gap-6">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
              <Package className="w-5 h-5" />
            </button>
            <h2 className="text-lg sm:text-2xl font-bold hidden sm:block">Planificador Semanal</h2>
            <div className="flex items-center gap-1 sm:gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-0.5 sm:p-1">
              <Button onClick={() => setSemanaActual(s => s - 1)} variant="ghost" size="sm" className="p-1 h-7 w-7 sm:h-8 sm:w-8">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs sm:text-sm font-medium px-1 sm:px-2 whitespace-nowrap">{rangoFechas}</span>
              <Button onClick={() => setSemanaActual(s => s + 1)} variant="ghost" size="sm" className="p-1 h-7 w-7 sm:h-8 sm:w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            {semanaActual !== 0 && (
              <button onClick={() => setSemanaActual(0)} className="text-xs text-indigo-600 font-medium hover:underline hidden sm:block">
                Hoy
              </button>
            )}
          </div>

          <div className="flex gap-2 sm:gap-3">
            {semanaActual !== 0 && (
              <Button onClick={() => setSemanaActual(0)} variant="outline" size="sm" className="sm:hidden text-xs h-8">
                Hoy
              </Button>
            )}
          </div>
        </header>

        {/* Grid del Calendario */}
        <div className="flex-1 overflow-auto p-3 sm:p-6 lg:p-8">
          
          {/* Desktop/tablet: Grid completo */}
          <div className="hidden md:block">
            <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
              {/* Cabecera de días */}
              <div className="grid grid-cols-[80px_repeat(7,1fr)] sm:grid-cols-[100px_repeat(7,1fr)] border-b border-slate-200 dark:border-slate-700">
                <div className="p-3 sm:p-4 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50"></div>
                {diasSemana.map((dia, idx) => {
                  const fechaStr = fechasSemana[idx];
                  const fecha = new Date(fechaStr + 'T12:00:00');
                  const esFinSemana = idx >= 5;
                  const esHoy = fechaStr === hoyStr;
                  return (
                    <div 
                      key={dia} 
                      className={`p-2 sm:p-4 text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0 ${
                        esHoy ? 'bg-indigo-600' : esFinSemana ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : 'bg-slate-50 dark:bg-slate-700/50'
                      }`}
                    >
                      <p className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-widest ${esHoy ? 'text-white' : 'text-slate-400'}`}>
                        <span className="hidden lg:inline">{dia}</span>
                        <span className="lg:hidden">{diasCortos[idx]}</span>
                      </p>
                      <p className={`text-base sm:text-lg font-bold ${esHoy ? 'text-white' : esFinSemana ? 'text-indigo-600' : ''}`}>
                        {fecha.getDate()}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Fila: Comida */}
              <div className="grid grid-cols-[80px_repeat(7,1fr)] sm:grid-cols-[100px_repeat(7,1fr)] border-b border-slate-100 dark:border-slate-700">
                <div className="p-3 sm:p-6 bg-slate-50 dark:bg-slate-700/50 border-r border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-1">
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-tighter">Comida</span>
                </div>
                {fechasSemana.map((fecha, idx) => renderCalendarCell(fecha, 'comida', idx))}
              </div>

              {/* Fila: Cena */}
              <div className="grid grid-cols-[80px_repeat(7,1fr)] sm:grid-cols-[100px_repeat(7,1fr)] bg-indigo-50/50 dark:bg-indigo-950/20">
                <div className="p-3 sm:p-6 bg-indigo-100/70 dark:bg-indigo-900/30 border-r border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-1">
                  <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-tighter text-indigo-600 dark:text-indigo-400">Cena</span>
                </div>
                {fechasSemana.map((fecha, idx) => renderCalendarCell(fecha, 'cena', idx))}
              </div>
            </div>
          </div>

          {/* Mobile: Vista de día individual */}
          <div className="md:hidden">
            <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
              {diasCortos.map((dia, idx) => {
                const fechaStr = fechasSemana[idx];
                const fecha = new Date(fechaStr + 'T12:00:00');
                const esHoy = fechaStr === hoyStr;
                const isSelected = mobileDay === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setMobileDay(idx)}
                    className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-all ${
                      isSelected 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                        : esHoy 
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' 
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase">{dia}</span>
                    <span className="text-lg font-bold">{fecha.getDate()}</span>
                  </button>
                );
              })}
            </div>

            {mobileDay !== null && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/10 border-b border-slate-200 dark:border-slate-700">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold">Comida</span>
                  </div>
                  <div className="p-3">
                    {renderCalendarCell(fechasSemana[mobileDay], 'comida', mobileDay)}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/10 border-b border-slate-200 dark:border-slate-700">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-bold">Cena</span>
                  </div>
                  <div className="p-3">
                    {renderCalendarCell(fechasSemana[mobileDay], 'cena', mobileDay)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ===== TARJETAS INFERIORES ===== */}
          <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            
            {/* 1. Resumen Semanal */}
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg">
              <h3 className="font-bold flex items-center gap-2 mb-4 text-sm sm:text-base">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                Resumen Semanal
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Productos en despensa</span>
                  <span className="text-sm sm:text-base font-bold text-indigo-600">{resumenSemanal.productosDisponibles}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Planificados esta semana</span>
                  <span className="text-sm sm:text-base font-bold text-emerald-600">{resumenSemanal.planificadosSemana} / 14</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mt-1">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (resumenSemanal.planificadosSemana / 14) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Huecos sin planificar</span>
                  <span className={`text-sm sm:text-base font-bold ${resumenSemanal.sinPlanificar > 7 ? 'text-amber-500' : 'text-slate-500'}`}>
                    {resumenSemanal.sinPlanificar}
                  </span>
                </div>
                {resumenSemanal.proximosCaducar > 0 && (
                  <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <span className="text-xs sm:text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" /> Próximos a caducar
                    </span>
                    <span className="text-sm sm:text-base font-bold text-amber-600">{resumenSemanal.proximosCaducar}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Lista de la Compra */}
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2 text-sm sm:text-base">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                  Lista de la Compra
                </h3>
                <span className="text-[10px] sm:text-xs text-slate-500">
                  {listaCompra.filter(i => !i.checked).length} pendientes
                </span>
              </div>
              
              <form onSubmit={handleAddItemCompra} className="flex gap-1.5 mb-3">
                <Input
                  type="text"
                  value={nuevoItemCompra}
                  onChange={(e) => setNuevoItemCompra(e.target.value)}
                  className="flex-1 h-8 text-xs sm:text-sm"
                  placeholder="+ Añadir item..."
                />
                {nuevoItemCompra.trim() && (
                  <Button type="submit" size="sm" className="h-8 px-2 bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-3 h-3" />
                  </Button>
                )}
              </form>

              <ul className="space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar">
                {listaCompra.filter(i => !i.checked).map(item => (
                  <li key={item.id} className="flex items-center gap-2 text-xs sm:text-sm group">
                    <input 
                      type="checkbox" 
                      checked={false}
                      onChange={() => handleToggleItemCompra(item.id)}
                      className="rounded text-indigo-600 focus:ring-indigo-600 w-3.5 h-3.5 cursor-pointer" 
                    />
                    <span className="flex-1">{item.nombre}</span>
                    <button onClick={() => handleDeleteItemCompra(item.id)} className="opacity-0 group-hover:opacity-100 p-0.5 transition-opacity">
                      <X className="w-3 h-3 text-slate-400" />
                    </button>
                  </li>
                ))}
                {listaCompra.filter(i => i.checked).map(item => (
                  <li key={item.id} className="flex items-center gap-2 text-xs sm:text-sm opacity-50 group">
                    <input 
                      type="checkbox" 
                      checked={true}
                      onChange={() => handleToggleItemCompra(item.id)}
                      className="rounded text-indigo-600 focus:ring-indigo-600 w-3.5 h-3.5 cursor-pointer" 
                    />
                    <span className="flex-1 line-through">{item.nombre}</span>
                    <button onClick={() => handleDeleteItemCompra(item.id)} className="opacity-0 group-hover:opacity-100 p-0.5 transition-opacity">
                      <X className="w-3 h-3 text-slate-400" />
                    </button>
                  </li>
                ))}
                {listaCompra.length === 0 && (
                  <li className="text-center py-4 text-slate-400 text-xs">Lista vacía</li>
                )}
              </ul>

              {listaCompra.filter(i => i.checked).length > 0 && (
                <button 
                  onClick={() => setListaCompra(prev => prev.filter(i => !i.checked))}
                  className="mt-2 text-[10px] sm:text-xs text-slate-400 hover:text-red-500 transition-colors"
                >
                  Limpiar completados
                </button>
              )}
            </div>

            {/* 3. Distribución Mensual por Categoría */}
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg">
              <h3 className="font-bold flex items-center gap-2 mb-4 text-sm sm:text-base">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                Balance Mensual
              </h3>
              
              {distribucionMensual.total === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Sin datos este mes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {CATEGORIAS_WIDGET.filter(c => (distribucionMensual[c.value] || 0) > 0).map(cat => {
                    const count = distribucionMensual[cat.value] || 0;
                    const pct = Math.round((count / distribucionMensual.total) * 100);
                    return (
                      <div key={cat.value}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs sm:text-sm flex items-center gap-1.5">
                            <span>{cat.emoji}</span>
                            <span className="font-medium">{cat.label}</span>
                          </span>
                          <span className="text-xs font-bold text-slate-500">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-700 ${cat.barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Total comidas planificadas</span>
                      <span className="text-sm font-bold">{distribucionMensual.total}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ===== MODALES ===== */}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[200] animate-slide-up">
          <div className={`px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-lg border ${
            toast.tipo === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}>
            <div className="flex items-center gap-2 sm:gap-3">
              {toast.tipo === 'success' ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <X className="w-4 h-4 sm:w-5 sm:h-5" />}
              <span className="font-medium text-sm">{toast.mensaje || toast.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Mover o Repetir */}
      {moveModal && (
        <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center p-4">
          <div ref={moveModalRef} className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 animate-slide-up">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">¿Qué deseas hacer?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
              ¿Quieres mover o repetir "{moveModal.item.comida_nombre || moveModal.item.nombre}"?
            </p>
            <div className="flex gap-2 sm:gap-3">
              <Button onClick={() => handleMoverORepetir('mover')} disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-sm">
                {loading ? 'Procesando...' : 'Mover'}
              </Button>
              <Button onClick={() => handleMoverORepetir('repetir')} disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-sm">
                {loading ? 'Procesando...' : 'Repetir'}
              </Button>
              <Button onClick={() => setMoveModal(null)} disabled={loading} variant="outline" size="icon">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Eliminar */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center p-4">
          <div ref={deleteModalRef} className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 animate-slide-up">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Eliminar planificación</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
              ¿Qué deseas hacer con "{deleteModal.comida.comida_nombre}"?
            </p>
            <div className="flex flex-col gap-2 sm:gap-3">
              {deleteModal.type === 'both' && (
                <Button onClick={() => handleConfirmarEliminar('quitar')} disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 text-left px-4 justify-start text-sm">
                  {loading ? 'Procesando...' : 'Devolver a la despensa'}
                </Button>
              )}
              <Button onClick={() => handleConfirmarEliminar('eliminar')} disabled={loading} variant="destructive" className="w-full text-sm">
                {loading ? 'Procesando...' : 'Eliminar completamente'}
              </Button>
              <Button onClick={() => setDeleteModal(null)} disabled={loading} variant="outline" className="w-full text-sm">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Texto libre (Comer Fuera) */}
      {modoTextoLibre && (
        <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 animate-slide-up">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <span className="text-2xl">🍴</span>
              <h3 className="text-lg sm:text-xl font-bold">Comer Fuera</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {modoTextoLibre.dia} — {modoTextoLibre.tipoComida === 'comida' ? '☀️ Comida' : '🌙 Cena'}
            </p>
            <Input
              type="text"
              value={textoLibre}
              onChange={(e) => setTextoLibre(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAñadirTextoLibre(); }}
              className="mb-4"
              placeholder="Ej: Restaurante, Casa de los abuelos..."
              autoFocus
            />
            
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-4 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Se contará como "Comer Fuera" en el balance mensual
            </p>

            <div className="flex gap-2 sm:gap-3">
              <Button onClick={handleAñadirTextoLibre} disabled={loading || !textoLibre.trim()} className="flex-1 bg-amber-500 hover:bg-amber-600 text-sm">
                {loading ? 'Añadiendo...' : 'Añadir'}
              </Button>
              <Button onClick={() => { setModoTextoLibre(null); setTextoLibre(''); }} disabled={loading} variant="outline" size="icon">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Añadir Producto */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Añadir Producto</h3>
              <button onClick={() => { setShowAddModal(false); setNuevoProducto(''); setNuevoProductoCategoria('otros'); setNuevoProductoCaducidad(''); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAñadirProducto} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase block mb-1.5">Nombre</label>
                <Input
                  ref={addInputRef}
                  type="text"
                  value={nuevoProducto}
                  onChange={(e) => setNuevoProducto(e.target.value)}
                  className="w-full text-sm"
                  placeholder="Ej: Salmón, Pollo, Verduras..."
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase block mb-1.5">Categoría</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORIAS.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setNuevoProductoCategoria(cat.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        nuevoProductoCategoria === cat.value 
                          ? cat.color + ' ring-2 ring-indigo-500' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase block mb-1.5">Caducidad (opcional)</label>
                <Input
                  type="date"
                  value={nuevoProductoCaducidad}
                  onChange={(e) => setNuevoProductoCaducidad(e.target.value)}
                  className="w-full text-sm"
                />
              </div>
              <Button 
                type="submit" 
                disabled={!nuevoProducto.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Añadir a Despensa
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Producto */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Editar Producto</h3>
              <button onClick={() => setEditModal(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase block mb-1.5">Nombre</label>
                <Input
                  type="text"
                  value={editModal.nombre}
                  onChange={(e) => setEditModal(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase block mb-1.5">Categoría</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORIAS.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setEditModal(prev => ({ ...prev, categoria: cat.value }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        editModal.categoria === cat.value 
                          ? cat.color + ' ring-2 ring-indigo-500' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase block mb-1.5">Caducidad</label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={editModal.fecha_caducidad}
                    onChange={(e) => setEditModal(prev => ({ ...prev, fecha_caducidad: e.target.value }))}
                    className="flex-1 text-sm"
                  />
                  {editModal.fecha_caducidad && (
                    <button
                      type="button"
                      onClick={() => setEditModal(prev => ({ ...prev, fecha_caducidad: '' }))}
                      className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleGuardarComidaEdit}
                  disabled={!editModal.nombre.trim()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-sm font-medium"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Guardar
                </Button>
                <Button onClick={() => setEditModal(null)} variant="outline" className="text-sm">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        @keyframes pulse-cell {
          0% { transform: scale(1); box-shadow: 0 0 0 rgba(99, 102, 241, 0); }
          50% { transform: scale(1.03); box-shadow: 0 0 15px rgba(99, 102, 241, 0.4); }
          100% { transform: scale(1); box-shadow: 0 0 0 rgba(99, 102, 241, 0); }
        }
        .pulse-animation { animation: pulse-cell 0.5s ease-out; }
      `}</style>
    </div>
  );
}

export default MealsCalendar;
