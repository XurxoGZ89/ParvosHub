import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function CalendarioComidasV2({ onBack }) {
  const { t } = useLanguage();
  
  // Estados de UI
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarAbierta, setSidebarAbierta] = useState(window.innerWidth >= 768);
  const [semanaActual, setSemanaActual] = useState(0);
  
  // Estados de datos
  const [comidasCongeladas, setComidasCongeladas] = useState([]);
  const [comidasPlanificadas, setComidasPlanificadas] = useState([]);
  const [nuevaComida, setNuevaComida] = useState('');
  
  // Estados de interacción
  const [comidaExpandida, setComidaExpandida] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [pulseCell, setPulseCell] = useState(null);
  const [modoTextoLibre, setModoTextoLibre] = useState(null);
  const [textoLibre, setTextoLibre] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [moveModal, setMoveModal] = useState(null);
  const [notaEditandose, setNotaEditandose] = useState(null);
  const [comidaEnEdicion, setComidaEnEdicion] = useState(null);
  const [mobileSelectModal, setMobileSelectModal] = useState(null);

  // Refs
  const moveModalRef = useRef(null);
  const deleteModalRef = useRef(null);

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

  // Hook: Detectar cambios de tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      const esMovil = window.innerWidth < 768;
      setIsMobile(esMovil);
      // En móvil cerrar sidebar al cambiar tamaño
      if (esMovil) {
        setSidebarAbierta(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cargar datos desde API
  const cargarComidasCongeladas = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/comidas-congeladas`);
      setComidasCongeladas(res.data);
    } catch (err) {
      console.error('Error al cargar comidas congeladas:', err);
      setToast({ type: 'error', message: 'Error al cargar comidas' });
    }
  }, []);

  const cargarComidasPlanificadas = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/comidas-planificadas`);
      setComidasPlanificadas(res.data);
    } catch (err) {
      console.error('Error al cargar comidas planificadas:', err);
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

  // Añadir comida al inventario
  const handleAñadirComida = async (e) => {
    e.preventDefault();
    if (!nuevaComida.trim()) return;
    
    try {
      const response = await axios.post(`${API_URL}/comidas-congeladas`, { nombre: nuevaComida });
      setComidasCongeladas(prev => [response.data, ...prev]);
      setNuevaComida('');
      setToast({ type: 'success', message: '✓ Comida añadida' });
    } catch (err) {
      console.error('Error al añadir comida:', err);
      setToast({ type: 'error', message: 'Error al añadir comida' });
    }
  };

  // Eliminar comida del inventario
  const handleEliminarComida = async (id) => {
    if (!window.confirm('¿Eliminar esta comida del inventario?')) return;
    
    try {
      await axios.delete(`${API_URL}/comidas-congeladas/${id}`);
      setComidasCongeladas(prev => prev.filter(c => c.id !== id));
      setToast({ type: 'success', message: '✓ Comida eliminada' });
    } catch (err) {
      console.error('Error al eliminar comida:', err);
      setToast({ type: 'error', message: 'Error al eliminar' });
    }
  };

  // Actualizar notas de una comida del inventario
  const handleActualizarNotas = async (id, notas) => {
    try {
      const comida = comidasCongeladas.find(c => c.id === id);
      if (comida.notas === notas) return;

      await axios.put(`${API_URL}/comidas-congeladas/${id}`, {
        nombre: comida.nombre,
        notas
      });
      
      setComidasCongeladas(prev =>
        prev.map(c => c.id === id ? { ...c, notas } : c)
      );
      
      setComidasPlanificadas(prev =>
        prev.map(cp => cp.comida_id === id ? { ...cp, notas } : cp)
      );
      
      setToast({ type: 'success', message: '✓ Notas guardadas' });
    } catch (err) {
      console.error('Error al guardar notas:', err);
      setToast({ type: 'error', message: 'Error al guardar notas' });
    }
  };

  // Guardar nombre editado
  const handleGuardarNombreComida = async (comidaId, nuevoNombre) => {
    if (!nuevoNombre.trim()) {
      setToast({ type: 'error', message: 'El nombre no puede estar vacío' });
      setComidaEnEdicion(null);
      return;
    }
    
    try {
      const comida = comidasCongeladas.find(c => c.id === comidaId);
      if (!comida) {
        setToast({ type: 'error', message: 'Comida no encontrada' });
        setComidaEnEdicion(null);
        return;
      }
      
      await axios.put(`${API_URL}/comidas-congeladas/${comidaId}`, {
        nombre: nuevoNombre,
        notas: comida.notas
      });
      
      setComidasCongeladas(prev =>
        prev.map(c => c.id === comidaId ? { ...c, nombre: nuevoNombre } : c)
      );
      
      setToast({ type: 'success', message: '✓ Nombre actualizado' });
      setComidaEnEdicion(null);
    } catch (err) {
      console.error('Error al actualizar nombre:', err);
      setToast({ type: 'error', message: 'Error al actualizar' });
    }
  };

  // Filtrar comidas no usadas (memoizado)
  const comidasNoUsadas = useMemo(() => 
    comidasCongeladas.filter(c => !c.tachada), 
    [comidasCongeladas]
  );

  // Obtener fecha de última planificación
  const getFechaUltimaPlanificacion = useCallback((comidaId) => {
    const planificaciones = comidasPlanificadas.filter(cp => cp.comida_id === comidaId);
    if (planificaciones.length === 0) return null;
    
    const fechaStr = [...planificaciones].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0].fecha;
    const fecha = new Date(fechaStr);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}`;
  }, [comidasPlanificadas]);

  // Calcular fechas de la semana
  const fechasQuincena = useMemo(() => {
    const hoy = new Date();
    const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay();
    const lunesActual = new Date(hoy);
    lunesActual.setDate(hoy.getDate() - diaSemana + 1);
    lunesActual.setDate(lunesActual.getDate() + (semanaActual * 7));
    
    const fechas = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(lunesActual);
      fecha.setDate(lunesActual.getDate() + i);
      fechas.push(fecha);
    }
    return fechas;
  }, [semanaActual]);

  const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  // Obtener comidas planificadas para una fecha y tipo
  const getComidasPlanificadas = useCallback((fecha, tipoComida) => {
    const fechaStr = fecha.toISOString().split('T')[0];
    return comidasPlanificadas.filter(
      c => c.fecha && c.fecha.split('T')[0] === fechaStr && c.tipo_comida === tipoComida
    );
  }, [comidasPlanificadas]);

  // Drag & Drop handlers
  const handleDragStart = (e, item, source) => {
    setDraggedItem({ item, source });
    e.dataTransfer.effectAllowed = 'move';
    
    const dragImage = document.createElement('div');
    dragImage.style.background = 'linear-gradient(135deg, #ffeaa7 0%, #ffd93d 100%)';
    dragImage.style.padding = '6px 8px';
    dragImage.style.borderRadius = '6px';
    dragImage.style.fontSize = '12px';
    dragImage.style.fontWeight = '600';
    dragImage.style.color = '#1d1d1f';
    dragImage.style.position = 'absolute';
    dragImage.style.left = '-9999px';
    dragImage.textContent = item.nombre || item.comida_nombre;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (fecha, tipoComida) => {
    setDropTarget({ fecha, tipoComida });
  };

  const handleDragLeave = (e) => {
    if (e.target === e.currentTarget) {
      setDropTarget(null);
    }
  };

  const handleDrop = async (e, fecha, tipoComida) => {
    e.preventDefault();
    setDropTarget(null);
    if (!draggedItem || !draggedItem.item) {
      console.warn('Drag item inválido');
      return;
    }

    setPulseCell({ fecha: fecha.getTime(), tipoComida });
    const fechaStr = fecha.toISOString().split('T')[0];

    if (draggedItem.source === 'inventario' && !draggedItem.item.tachada) {
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
    } else {
      setMoveModal({
        item: draggedItem.item,
        source: draggedItem.source,
        fecha: fecha,
        tipoComida: tipoComida
      });
      setDraggedItem(null);
    }
  };

  // Añadir comida de texto libre
  const handleAñadirTextoLibre = async () => {
    if (!textoLibre.trim() || !modoTextoLibre) return;
    setLoading(true);
    
    try {
      if (!modoTextoLibre.fecha) {
        throw new Error('Fecha no válida');
      }
      
      const fechaStr = modoTextoLibre.fecha.toISOString().split('T')[0];
      const nombreComida = textoLibre.trim();
      
      const response = await axios.post(`${API_URL}/comidas-planificadas`, {
        comida_id: null,
        comida_nombre: nombreComida,
        fecha: fechaStr,
        tipo_comida: modoTextoLibre.tipoComida
      });
      
      if (!response.data || !response.data.id) {
        throw new Error('Respuesta inválida del servidor');
      }
      
      const nuevoItem = {
        id: response.data.id,
        comida_id: null,
        comida_nombre: nombreComida,
        fecha: fechaStr,
        tipo_comida: modoTextoLibre.tipoComida,
        notas: null
      };
      
      setComidasPlanificadas(prev => [...prev, nuevoItem]);
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

  // Planificar comida desde móvil (selector modal)
  const handlePlanificarDesdeMobil = async (comidaId) => {
    if (!mobileSelectModal) return;
    setLoading(true);
    
    try {
      const fechaStr = mobileSelectModal.fecha.toISOString().split('T')[0];
      const comida = comidasCongeladas.find(c => c.id === comidaId);
      
      const response = await axios.post(`${API_URL}/comidas-planificadas`, {
        comida_id: comidaId,
        fecha: fechaStr,
        tipo_comida: mobileSelectModal.tipoComida,
        notas: comida.notas || ''
      });
      
      const newPlanificada = response.data;
      if (!newPlanificada || !newPlanificada.id) {
        throw new Error('Respuesta inválida del servidor');
      }
      
      setComidasPlanificadas(prev => [...prev, newPlanificada]);
      setPulseCell({ fecha: mobileSelectModal.fecha.getTime(), tipoComida: mobileSelectModal.tipoComida });
      
      // Marcar comida como tachada si es la primera vez
      const otrasPlanificaciones = comidasPlanificadas.filter(cp => cp.comida_id === comidaId);
      if (otrasPlanificaciones.length === 0) {
        await axios.put(`${API_URL}/comidas-congeladas/${comidaId}`, { tachada: true });
        setComidasCongeladas(prev =>
          prev.map(c => c.id === comidaId ? { ...c, tachada: true } : c)
        );
      }
      
      setToast({ type: 'success', message: `✓ ${comida.nombre} planificada` });
      setMobileSelectModal(null);
    } catch (err) {
      console.error('Error al planificar:', err);
      setToast({ type: 'error', message: err.response?.data?.error || 'Error al planificar' });
    } finally {
      setLoading(false);
    }
  };

  // Eliminar comida planificada
  const handleEliminarPlanificada = async (comida) => {
    setDeleteModal({
      comida,
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
    const fechaStr = moveModal.fecha.toISOString().split('T')[0];
    
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

  // Actualizar notas de comida planificada
  const handleActualizarNotasPlanificada = async (id, notas) => {
    try {
      const comida = comidasPlanificadas.find(c => c.id === id);
      if (comida.notas === notas) return;

      await axios.put(`${API_URL}/comidas-planificadas/${id}/notas`, { notas });
      setComidasPlanificadas(prev =>
        prev.map(c => c.id === id ? { ...c, notas } : c)
      );
      setToast({ type: 'success', message: '✓ Notas guardadas' });
    } catch (err) {
      console.error('Error:', err);
      setToast({ type: 'error', message: 'Error al guardar notas' });
    }
  };

  return (
    <div style={{
      background: '#f5f5f7',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Animaciones CSS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 rgba(0, 122, 255, 0); }
          50% { transform: scale(1.02); box-shadow: 0 0 20px rgba(0, 122, 255, 0.4); }
          100% { transform: scale(1); box-shadow: 0 0 0 rgba(0, 122, 255, 0); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* HEADER FIJO */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #e5e5e7',
        padding: isMobile ? '10px 16px' : '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? 10 : 16,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        minHeight: isMobile ? 56 : 'auto'
      }}>
        {/* Botón menú a la izquierda - TÁCTIL OPTIMIZADO */}
        <button
          onClick={() => setSidebarAbierta(!sidebarAbierta)}
          style={{
            background: sidebarAbierta ? '#007AFF' : '#f5f5f7',
            border: 'none',
            borderRadius: isMobile ? 10 : 8,
            padding: isMobile ? '10px 14px' : '8px 12px',
            cursor: 'pointer',
            color: sidebarAbierta ? '#fff' : '#007AFF',
            fontWeight: 600,
            fontSize: isMobile ? 22 : 18,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            minWidth: isMobile ? 44 : 'auto',
            minHeight: isMobile ? 44 : 'auto'
          }}
        >
          {sidebarAbierta ? '✕' : '☰'}
        </button>

        <button
          onClick={onBack}
          style={{
            background: '#f5f5f7',
            border: 'none',
            borderRadius: isMobile ? 10 : 8,
            padding: isMobile ? '10px 16px' : '8px 12px',
            fontSize: isMobile ? 15 : 16,
            cursor: 'pointer',
            color: '#007AFF',
            fontWeight: 600,
            transition: 'background 0.2s',
            minHeight: isMobile ? 44 : 'auto'
          }}
          onMouseEnter={(e) => e.target.style.background = '#e5e5e7'}
          onMouseLeave={(e) => e.target.style.background = '#f5f5f7'}
        >
          ← {t('volver')}
        </button>
        
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontSize: isMobile ? 18 : 24,
            fontWeight: 700,
            color: '#1d1d1f',
            margin: 0
          }}>
            {t('calendarioComidas')}
          </h1>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        position: 'relative'
      }}>
        
        {/* SIDEBAR FLOTANTE - INVENTARIO DE COMIDAS */}
        {sidebarAbierta && (
          <div style={{
            position: isMobile ? 'fixed' : 'relative',
            left: 0,
            top: isMobile ? '56px' : 0,
            width: isMobile ? '85%' : '300px',
            maxWidth: isMobile ? '360px' : '300px',
            height: isMobile ? 'calc(100vh - 56px)' : '100%',
            background: '#fff',
            borderRight: '1px solid #e5e5e7',
            overflowY: 'auto',
            zIndex: isMobile ? 90 : 1,
            boxShadow: isMobile ? '6px 0 20px rgba(0,0,0,0.25)' : 'none',
            padding: isMobile ? '20px 20px' : '20px 16px',
            animation: isMobile ? 'slideInLeft 0.3s ease-out' : 'none'
          }}>
            <h3 style={{
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 16,
              color: '#1d1d1f',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              ❄️ {t('comidasCongeladas')}
            </h3>

            {/* FORMULARIO AÑADIR COMIDA */}
            <form onSubmit={handleAñadirComida} style={{ marginBottom: 20 }}>
              <input
                type="text"
                value={nuevaComida}
                onChange={(e) => setNuevaComida(e.target.value)}
                placeholder={t('nuevaComida') || 'Nueva comida...'}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #e5e5e7',
                  fontSize: 14,
                  marginBottom: 10,
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#007AFF'}
                onBlur={(e) => e.target.style.borderColor = '#e5e5e7'}
              />
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(90deg, #007aff 0%, #00c6fb 100%)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0,122,255,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                + {t('anadir') || 'Añadir'}
              </button>
            </form>

            {/* LISTA DE COMIDAS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {comidasNoUsadas.length === 0 ? (
                <div style={{
                  padding: 20,
                  textAlign: 'center',
                  color: '#999',
                  fontSize: 13
                }}>
                  {t('sinComidasCongeladas') || 'Sin comidas'}
                </div>
              ) : (
                comidasNoUsadas.map((comida) => (
                  <div key={comida.id}>
                    <div
                      draggable={comidaEnEdicion?.id !== comida.id}
                      onDragStart={(e) => handleDragStart(e, comida, 'inventario')}
                      onClick={() => setComidaExpandida(comidaExpandida === comida.id ? null : comida.id)}
                      style={{
                        padding: '8px 10px',
                        background: '#fff',
                        border: '1px solid #e5e5e7',
                        borderRadius: 8,
                        cursor: comidaEnEdicion?.id === comida.id ? 'text' : 'grab',
                        color: '#1d1d1f',
                        fontSize: 13,
                        fontWeight: 500,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f7'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                        {comidaEnEdicion?.id === comida.id ? (
                          <input
                            type="text"
                            value={comidaEnEdicion.nuevoNombre}
                            onChange={(e) => setComidaEnEdicion({ ...comidaEnEdicion, nuevoNombre: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleGuardarNombreComida(comida.id, comidaEnEdicion.nuevoNombre);
                              }
                              if (e.key === 'Escape') {
                                setComidaEnEdicion(null);
                              }
                            }}
                            onBlur={() => handleGuardarNombreComida(comida.id, comidaEnEdicion.nuevoNombre)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              flex: 1,
                              padding: '6px 8px',
                              borderRadius: 6,
                              border: '2px solid #007AFF',
                              fontSize: 13,
                              fontWeight: 500,
                              fontFamily: 'inherit',
                              boxSizing: 'border-box'
                            }}
                          />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                            <span>{comida.nombre}</span>
                            {getFechaUltimaPlanificacion(comida.id) && (
                              <span style={{ fontSize: 10, color: '#999' }}>
                                📅 {getFechaUltimaPlanificacion(comida.id)}
                              </span>
                            )}
                          </div>
                        )}
                        {comida.notas && (
                          <span style={{ 
                            fontSize: 11, 
                            padding: '2px 6px',
                            background: '#e8e8ed',
                            borderRadius: 4,
                            cursor: 'pointer'
                          }} 
                          title="Tiene notas">
                            📝
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setComidaExpandida(comidaExpandida === comida.id ? null : comida.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 14,
                            padding: 0,
                            color: comida.notas ? '#007AFF' : '#ccc',
                            transition: 'color 0.2s'
                          }}
                          title="Ver/editar notas"
                        >
                          📔
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setComidaEnEdicion({ id: comida.id, nuevoNombre: comida.nombre });
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 13,
                            padding: 0
                          }}
                          title="Editar nombre"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEliminarComida(comida.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 14,
                            padding: 0
                          }}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    {/* Notas expandibles */}
                    {comidaExpandida === comida.id && (
                      <div style={{
                        padding: '8px',
                        background: '#f9f9f9',
                        borderRadius: 8,
                        marginTop: 4,
                        border: '1px solid #e5e5e7'
                      }}>
                        <textarea
                          value={comida.notas || ''}
                          onChange={(e) => {
                            const nuevasNotas = e.target.value;
                            setComidasCongeladas(prev =>
                              prev.map(c => c.id === comida.id ? { ...c, notas: nuevasNotas } : c)
                            );
                          }}
                          onBlur={() => handleActualizarNotas(comida.id, comida.notas)}
                          placeholder={t('anadirNotas') || 'Añadir notas...'}
                          style={{
                            width: '100%',
                            minHeight: 50,
                            padding: 6,
                            borderRadius: 6,
                            border: '1px solid #e5e5e7',
                            fontSize: 12,
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            boxSizing: 'border-box',
                            outline: 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* OVERLAY en móvil cuando sidebar abierto */}
        {isMobile && sidebarAbierta && (
          <div
            onClick={() => setSidebarAbierta(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 80,
              top: '56px',
              animation: 'fadeIn 0.2s ease-out',
              WebkitTapHighlightColor: 'transparent'
            }}
          />
        )}

        {/* ÁREA PRINCIPAL - CALENDARIO + COMIDAS PLANIFICADAS */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: isMobile ? '16px 12px' : '24px 20px',
          transition: 'margin-left 0.3s ease'
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            
            {/* MÓDULO CALENDARIO */}
            <div style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
              border: '1px solid #f0f0f0',
              padding: isMobile ? '16px' : '24px',
              marginBottom: 20
            }}>
              <h2 style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#1d1d1f',
                marginBottom: 16,
                textAlign: 'center'
              }}>
                📅 Calendario Semanal
              </h2>

              {/* Navegación de semanas */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: isMobile ? 8 : 16,
                marginBottom: 20,
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => setSemanaActual(prev => prev - 1)}
                  style={{
                    background: '#f5f5f7',
                    border: 'none',
                    borderRadius: 8,
                    padding: isMobile ? '6px 12px' : '8px 16px',
                    cursor: 'pointer',
                    color: '#007AFF',
                    fontWeight: 600,
                    fontSize: isMobile ? 14 : 16,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#efefef'}
                  onMouseLeave={(e) => e.target.style.background = '#f5f5f7'}
                >
                  ◀ {!isMobile && 'Anterior'}
                </button>
                
                <div style={{
                  fontSize: isMobile ? 13 : 16,
                  fontWeight: 600,
                  color: '#1d1d1f',
                  textAlign: 'center',
                  minWidth: isMobile ? 150 : 250,
                  flex: isMobile ? '1 0 100%' : 'initial',
                  order: isMobile ? -1 : 0
                }}>
                  {(() => {
                    const inicio = fechasQuincena[0];
                    const fin = fechasQuincena[6];
                    const meses = ['enero', 'feb', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'sept', 'oct', 'nov', 'dic'];
                    const mesInicio = meses[inicio.getMonth()];
                    const mesFin = meses[fin.getMonth()];
                    if (inicio.getMonth() === fin.getMonth()) {
                      return `${inicio.getDate()} - ${fin.getDate()} ${mesInicio}`;
                    } else {
                      return `${inicio.getDate()} ${mesInicio} - ${fin.getDate()} ${mesFin}`;
                    }
                  })()}
                </div>

                <button
                  onClick={() => setSemanaActual(0)}
                  style={{
                    background: semanaActual === 0 ? '#007AFF' : '#f5f5f7',
                    border: 'none',
                    borderRadius: 8,
                    padding: isMobile ? '6px 12px' : '8px 14px',
                    cursor: 'pointer',
                    color: semanaActual === 0 ? '#fff' : '#007AFF',
                    fontWeight: 600,
                    fontSize: isMobile ? 12 : 14,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (semanaActual !== 0) e.target.style.background = '#efefef';
                  }}
                  onMouseLeave={(e) => {
                    if (semanaActual !== 0) e.target.style.background = '#f5f5f7';
                  }}
                >
                  🏠 Hoy
                </button>

                <button
                  onClick={() => setSemanaActual(prev => prev + 1)}
                  style={{
                    background: '#f5f5f7',
                    border: 'none',
                    borderRadius: 8,
                    padding: isMobile ? '6px 12px' : '8px 16px',
                    cursor: 'pointer',
                    color: '#007AFF',
                    fontWeight: 600,
                    fontSize: isMobile ? 14 : 16,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#efefef'}
                  onMouseLeave={(e) => e.target.style.background = '#f5f5f7'}
                >
                  {!isMobile && 'Siguiente'} ▶
                </button>
              </div>

              {/* Tabla calendario con scroll */}
              <div style={{
                overflowX: 'auto',
                overflowY: 'hidden',
                WebkitOverflowScrolling: 'touch',
                marginLeft: isMobile ? '-16px' : '-24px',
                marginRight: isMobile ? '-16px' : '-24px',
                paddingLeft: isMobile ? '16px' : '24px',
                paddingRight: isMobile ? '16px' : '24px',
                paddingBottom: '8px'
              }}>
                <table style={{
                  width: 'auto',
                  borderCollapse: 'collapse',
                  minWidth: isMobile ? '100%' : 'auto'
                }}>
                  <thead>
                    <tr style={{ background: '#f1f3f4' }}>
                      <th style={{
                        padding: isMobile ? '8px 6px' : '10px 8px',
                        fontWeight: 600,
                        fontSize: isMobile ? 11 : 13,
                        borderBottom: '2px solid #e5e5e7',
                        textAlign: 'center',
                        width: isMobile ? 40 : 50,
                        position: 'sticky',
                        left: 0,
                        background: '#f1f3f4',
                        zIndex: 2
                      }}></th>
                      {fechasQuincena.map((fecha, idx) => {
                        const esHoy = fecha.getDate() === new Date().getDate() && 
                                      fecha.getMonth() === new Date().getMonth() && 
                                      fecha.getFullYear() === new Date().getFullYear();
                        return (
                        <th key={idx} style={{
                          padding: isMobile ? '10px 6px' : '10px 6px',
                          fontWeight: 600,
                          fontSize: isMobile ? 12 : 13,
                          borderBottom: esHoy ? '3px solid #007AFF' : '2px solid #e5e5e7',
                          textAlign: 'center',
                          minWidth: isMobile ? 120 : 110,
                          width: isMobile ? 120 : 110,
                          background: esHoy ? '#e3f2fd' : (fecha.getDay() === 0 || fecha.getDay() === 6 ? '#f9f9f9' : '#f1f3f4')
                        }}>
                          <div style={{ fontSize: isMobile ? 13 : 'inherit' }}>{diasSemana[fecha.getDay() === 0 ? 6 : fecha.getDay() - 1]}</div>
                          <div style={{ fontSize: isMobile ? 11 : 11, color: '#666', marginTop: 2 }}>
                            {fecha.getDate()}/{fecha.getMonth() + 1}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Fila COMIDA */}
                    <tr>
                      <td style={{
                        padding: isMobile ? '4px' : '6px',
                        fontWeight: 600,
                        fontSize: isMobile ? 10 : 11,
                        background: '#fff3cd',
                        borderRight: '1px solid #e5e5e7',
                        textAlign: 'center',
                        color: '#856404',
                        minWidth: isMobile ? 40 : 50,
                        width: isMobile ? 40 : 50
                      }}>
                        🍽️<br/>{t('comida') || 'Comida'}
                      </td>
                      {fechasQuincena.map((fecha, idx) => {
                        const esHoy = fecha.getDate() === new Date().getDate() && 
                                      fecha.getMonth() === new Date().getMonth() && 
                                      fecha.getFullYear() === new Date().getFullYear();
                        const comidas = getComidasPlanificadas(fecha, 'comida');
                        const isDropTarget = dropTarget?.fecha?.getTime() === fecha.getTime() && dropTarget?.tipoComida === 'comida';
                        const isPulsing = pulseCell?.fecha === fecha.getTime() && pulseCell?.tipoComida === 'comida';
                        const isTextoLibreMode = modoTextoLibre?.fecha?.getTime() === fecha.getTime() && modoTextoLibre?.tipoComida === 'comida';
                        
                        return (
                          <td
                            key={idx}
                            onDragOver={handleDragOver}
                            onDragEnter={() => handleDragEnter(fecha, 'comida')}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, fecha, 'comida')}
                            onMouseEnter={(e) => {
                              if (!isDropTarget && !isTextoLibreMode) {
                                e.currentTarget.style.borderColor = '#b3d9ff';
                                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0, 122, 255, 0.2)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isDropTarget && !isTextoLibreMode) {
                                e.currentTarget.style.borderColor = '#e5e5e7';
                                e.currentTarget.style.boxShadow = 'none';
                              }
                            }}
                            style={{
                              padding: isMobile ? 6 : 6,
                              minWidth: isMobile ? 120 : 110,
                              width: isMobile ? 120 : 110,
                              minHeight: isMobile ? 80 : 65,
                              border: isDropTarget ? '3px solid #007AFF' : '1px solid #e5e5e7',
                              background: esHoy ? '#e3f2fd' : (isDropTarget ? '#e3f2fd' : (fecha.getDay() === 0 || fecha.getDay() === 6 ? '#fafafa' : '#fff')),
                              transition: 'all 0.2s',
                              verticalAlign: 'top',
                              position: 'relative',
                              boxShadow: isDropTarget ? '0 0 8px rgba(0, 122, 255, 0.3)' : 'none',
                              animation: isPulsing ? 'pulse 0.6s ease-out' : 'none'
                            }}
                          >
                            {isTextoLibreMode ? (
                              <div style={{ display: 'flex', gap: 2 }} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={textoLibre}
                                  onChange={(e) => setTextoLibre(e.target.value)}
                                  placeholder="Escribir..."
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAñadirTextoLibre();
                                    if (e.key === 'Escape') { setModoTextoLibre(null); setTextoLibre(''); }
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '3px 4px',
                                    borderRadius: 3,
                                    border: '1px solid #007AFF',
                                    fontSize: isMobile ? 11 : 12,
                                    boxSizing: 'border-box'
                                  }}
                                />
                                <button
                                  onClick={handleAñadirTextoLibre}
                                  style={{
                                    padding: '2px 4px',
                                    background: '#007AFF',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 3,
                                    fontSize: isMobile ? 11 : 12,
                                    cursor: 'pointer'
                                  }}
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => { setModoTextoLibre(null); setTextoLibre(''); }}
                                  style={{
                                    padding: '2px 4px',
                                    background: '#ccc',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 3,
                                    fontSize: isMobile ? 11 : 12,
                                    cursor: 'pointer'
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
                                {comidas.length === 0 && (
                                  <button
                                    onClick={() => {
                                      if (isMobile) {
                                        setMobileSelectModal({ fecha, tipoComida: 'comida' });
                                      } else {
                                        setModoTextoLibre({ fecha, tipoComida: 'comida' });
                                      }
                                    }}
                                    style={{
                                      background: 'transparent',
                                      border: '2px dashed #007AFF',
                                      borderRadius: 6,
                                      padding: isMobile ? '14px 8px' : '12px 8px',
                                      cursor: 'pointer',
                                      fontSize: isMobile ? 13 : 13,
                                      color: '#007AFF',
                                      transition: 'all 0.2s',
                                      flex: 1,
                                      fontWeight: isMobile ? 600 : 'normal',
                                      minHeight: isMobile ? 48 : 'auto'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = '#f0f8ff';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'transparent';
                                    }}
                                  >
                                    {isMobile ? '📋 Planificar' : '+ Añadir'}
                                  </button>
                                )}
                                {comidas.map((comida) => (
                                  <div
                                    key={comida.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, comida, 'calendario')}
                                    title={comida.comida_nombre}
                                    style={{
                                      background: comida.comida_id 
                                        ? 'linear-gradient(135deg, #ffeaa7 0%, #ffd93d 100%)' 
                                        : 'linear-gradient(135deg, #c8f7dc 0%, #a5ead7 100%)',
                                      padding: isMobile ? '4px 6px' : '5px 7px',
                                      borderRadius: 4,
                                      fontSize: isMobile ? 11 : 12,
                                      fontWeight: 500,
                                      color: '#2c2c2c',
                                      cursor: 'grab',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      border: '1px solid rgba(0,0,0,0.06)',
                                      transition: 'all 0.15s ease',
                                      height: 'auto',
                                      minHeight: '28px',
                                      overflow: 'visible',
                                      whiteSpace: 'normal',
                                      wordWrap: 'break-word',
                                      maxWidth: '100%',
                                      lineHeight: '1.2'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                      e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.boxShadow = 'none';
                                      e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                  >
                                    <span style={{
                                      fontSize: isMobile ? 12 : 14,
                                      color: '#999',
                                      opacity: 0.4,
                                      flexShrink: 0
                                    }}>⋮⋮</span>
                                    <span style={{
                                      flex: 1,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'normal',
                                      wordWrap: 'break-word',
                                      fontSize: isMobile ? 11 : 12
                                    }}>
                                      {comida.comida_nombre}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    
                    {/* Fila CENA */}
                    <tr>
                      <td style={{
                        padding: isMobile ? '4px' : '6px',
                        fontWeight: 600,
                        fontSize: isMobile ? 10 : 11,
                        background: '#e3f2fd',
                        borderRight: '1px solid #e5e5e7',
                        textAlign: 'center',
                        color: '#1565c0',
                        minWidth: isMobile ? 40 : 50,
                        width: isMobile ? 40 : 50
                      }}>
                        🌙<br/>{t('cena') || 'Cena'}
                      </td>
                      {fechasQuincena.map((fecha, idx) => {
                        const esHoy = fecha.getDate() === new Date().getDate() && 
                                      fecha.getMonth() === new Date().getMonth() && 
                                      fecha.getFullYear() === new Date().getFullYear();
                        const comidas = getComidasPlanificadas(fecha, 'cena');
                        const isDropTarget = dropTarget?.fecha?.getTime() === fecha.getTime() && dropTarget?.tipoComida === 'cena';
                        const isPulsing = pulseCell?.fecha === fecha.getTime() && pulseCell?.tipoComida === 'cena';
                        const isTextoLibreMode = modoTextoLibre?.fecha?.getTime() === fecha.getTime() && modoTextoLibre?.tipoComida === 'cena';
                        
                        return (
                          <td
                            key={idx}
                            onDragOver={handleDragOver}
                            onDragEnter={() => handleDragEnter(fecha, 'cena')}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, fecha, 'cena')}
                            onMouseEnter={(e) => {
                              if (!isDropTarget && !isTextoLibreMode) {
                                e.currentTarget.style.borderColor = '#b3d9ff';
                                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0, 122, 255, 0.2)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isDropTarget && !isTextoLibreMode) {
                                e.currentTarget.style.borderColor = '#e5e5e7';
                                e.currentTarget.style.boxShadow = 'none';
                              }
                            }}
                            style={{
                              padding: isMobile ? 6 : 6,
                              minWidth: isMobile ? 120 : 110,
                              width: isMobile ? 120 : 110,
                              minHeight: isMobile ? 80 : 65,
                              border: isDropTarget ? '3px solid #007AFF' : '1px solid #e5e5e7',
                              background: esHoy ? '#e3f2fd' : (isDropTarget ? '#e3f2fd' : (fecha.getDay() === 0 || fecha.getDay() === 6 ? '#fafafa' : '#fff')),
                              transition: 'all 0.2s',
                              verticalAlign: 'top',
                              position: 'relative',
                              boxShadow: isDropTarget ? '0 0 8px rgba(0, 122, 255, 0.3)' : 'none',
                              animation: isPulsing ? 'pulse 0.6s ease-out' : 'none'
                            }}
                          >
                            {isTextoLibreMode ? (
                              <div style={{ display: 'flex', gap: 2 }} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={textoLibre}
                                  onChange={(e) => setTextoLibre(e.target.value)}
                                  placeholder="Escribir..."
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAñadirTextoLibre();
                                    if (e.key === 'Escape') { setModoTextoLibre(null); setTextoLibre(''); }
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '3px 4px',
                                    borderRadius: 3,
                                    border: '1px solid #007AFF',
                                    fontSize: isMobile ? 11 : 12,
                                    boxSizing: 'border-box'
                                  }}
                                />
                                <button
                                  onClick={handleAñadirTextoLibre}
                                  style={{
                                    padding: '2px 4px',
                                    background: '#007AFF',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 3,
                                    fontSize: isMobile ? 11 : 12,
                                    cursor: 'pointer'
                                  }}
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => { setModoTextoLibre(null); setTextoLibre(''); }}
                                  style={{
                                    padding: '2px 4px',
                                    background: '#ccc',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 3,
                                    fontSize: isMobile ? 11 : 12,
                                    cursor: 'pointer'
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
                                {comidas.length === 0 && (
                                  <button
                                    onClick={() => {
                                      if (isMobile) {
                                        setMobileSelectModal({ fecha, tipoComida: 'cena' });
                                      } else {
                                        setModoTextoLibre({ fecha, tipoComida: 'cena' });
                                      }
                                    }}
                                    style={{
                                      background: 'transparent',
                                      border: '2px dashed #007AFF',
                                      borderRadius: 6,
                                      padding: isMobile ? '14px 8px' : '12px 8px',
                                      cursor: 'pointer',
                                      fontSize: isMobile ? 13 : 13,
                                      color: '#007AFF',
                                      transition: 'all 0.2s',
                                      flex: 1,
                                      fontWeight: isMobile ? 600 : 'normal',
                                      minHeight: isMobile ? 48 : 'auto'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = '#f0f8ff';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'transparent';
                                    }}
                                  >
                                    {isMobile ? '📋 Planificar' : '+ Añadir'}
                                  </button>
                                )}
                                {comidas.map((comida) => (
                                  <div
                                    key={comida.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, comida, 'calendario')}
                                    title={comida.comida_nombre}
                                    style={{
                                      background: comida.comida_id 
                                        ? 'linear-gradient(135deg, #81d4fa 0%, #4fc3f7 100%)' 
                                        : 'linear-gradient(135deg, #c8f7dc 0%, #a5ead7 100%)',
                                      padding: isMobile ? '4px 6px' : '5px 7px',
                                      borderRadius: 4,
                                      fontSize: isMobile ? 11 : 12,
                                      fontWeight: 500,
                                      color: '#2c2c2c',
                                      cursor: 'grab',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      border: '1px solid rgba(0,0,0,0.06)',
                                      transition: 'all 0.15s ease',
                                      height: 'auto',
                                      minHeight: '28px',
                                      overflow: 'visible',
                                      whiteSpace: 'normal',
                                      wordWrap: 'break-word',
                                      maxWidth: '100%',
                                      lineHeight: '1.2'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                      e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.boxShadow = 'none';
                                      e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                  >
                                    <span style={{
                                      fontSize: isMobile ? 12 : 14,
                                      color: '#999',
                                      opacity: 0.4,
                                      flexShrink: 0
                                    }}>⋮⋮</span>
                                    <span style={{
                                      flex: 1,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'normal',
                                      wordWrap: 'break-word',
                                      fontSize: isMobile ? 11 : 12
                                    }}>
                                      {comida.comida_nombre}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* COMIDAS PLANIFICADAS - DENTRO DEL MISMO MÓDULO */}
              <div style={{
                marginTop: 24,
                paddingTop: 24,
                borderTop: '2px solid #f5f5f7'
              }}>
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#1d1d1f',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  📋 Comidas Planificadas
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {comidasPlanificadas.length === 0 ? (
                    <div style={{
                      padding: 20,
                      textAlign: 'center',
                      color: '#999',
                      fontSize: 14
                    }}>
                      No hay comidas planificadas
                    </div>
                  ) : (
                    (() => {
                      // Agrupar por fecha
                      const comidasPorFecha = {};
                      comidasPlanificadas.forEach(comida => {
                        const fecha = new Date(comida.fecha);
                        const fechaStr = `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
                        if (!comidasPorFecha[fechaStr]) {
                          comidasPorFecha[fechaStr] = { fecha, comidas: [], cenas: [] };
                        }
                        if (comida.tipo_comida === 'comida') {
                          comidasPorFecha[fechaStr].comidas.push(comida);
                        } else {
                          comidasPorFecha[fechaStr].cenas.push(comida);
                        }
                      });
                      
                      // Ordenar por fecha
                      const fechasOrdenadas = Object.entries(comidasPorFecha).sort((a, b) => 
                        a[1].fecha - b[1].fecha
                      );
                      
                      return fechasOrdenadas.map(([fechaStr, { fecha, comidas, cenas }]) => (
                        <div key={fechaStr} style={{
                          background: '#f9f9f9',
                          borderRadius: 12,
                          padding: '12px 14px',
                          border: '1px solid #e5e5e7'
                        }}>
                          <div style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#1d1d1f',
                            marginBottom: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}>
                            📆 {fechaStr} - {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][fecha.getDay()]}
                          </div>
                          
                          {comidas.length > 0 && (
                            <div style={{ marginBottom: cenas.length > 0 ? 8 : 0 }}>
                              <div style={{ fontSize: 11, color: '#856404', fontWeight: 600, marginBottom: 4 }}>
                                🍽️ Comida:
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {comidas.map(comida => (
                                  <div key={comida.id}>
                                    <div
                                      onClick={() => setNotaEditandose(notaEditandose === comida.id ? null : comida.id)}
                                      style={{
                                        background: comida.comida_id 
                                          ? 'linear-gradient(135deg, #ffeaa7 0%, #ffd93d 100%)'
                                          : 'linear-gradient(135deg, #b3e5fc 0%, #81d4fa 100%)',
                                        padding: '6px 8px',
                                        borderRadius: 6,
                                        fontSize: 12,
                                        color: '#2c2c2c',
                                        fontWeight: 500,
                                        border: '1px solid rgba(0,0,0,0.06)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                      }}
                                    >
                                      <span style={{ flex: 1 }}>{comida.comida_nombre}</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        {comida.notas && (
                                          <span style={{ 
                                            fontSize: 10, 
                                            color: '#666',
                                            background: 'rgba(255,255,255,0.8)',
                                            padding: '2px 4px',
                                            borderRadius: 3
                                          }} 
                                          title={comida.notas}>📝</span>
                                        )}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEliminarPlanificada(comida);
                                          }}
                                          title="Eliminar"
                                          style={{
                                            background: 'rgba(255, 59, 48, 0.1)',
                                            border: 'none',
                                            borderRadius: 4,
                                            padding: '2px 6px',
                                            cursor: 'pointer',
                                            fontSize: 10,
                                            color: '#ff3b30'
                                          }}
                                        >
                                          🗑️
                                        </button>
                                      </div>
                                    </div>
                                    
                                    {notaEditandose === comida.id && (
                                      <div style={{
                                        marginTop: 4,
                                        padding: 8,
                                        background: '#fff',
                                        borderRadius: 6,
                                        border: '1px solid #e0e0e0'
                                      }}>
                                        <textarea
                                          value={comida.notas || ''}
                                          onChange={(e) => {
                                            const nuevasNotas = e.target.value;
                                            setComidasPlanificadas(prev =>
                                              prev.map(c => c.id === comida.id ? { ...c, notas: nuevasNotas } : c)
                                            );
                                          }}
                                          onBlur={() => handleActualizarNotasPlanificada(comida.id, comida.notas)}
                                          placeholder="Añade notas..."
                                          style={{
                                            width: '100%',
                                            minHeight: 50,
                                            padding: 6,
                                            borderRadius: 4,
                                            border: '1px solid #ddd',
                                            fontSize: 11,
                                            fontFamily: 'inherit',
                                            resize: 'vertical',
                                            boxSizing: 'border-box',
                                            outline: 'none'
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {cenas.length > 0 && (
                            <div>
                              <div style={{ fontSize: 11, color: '#1565c0', fontWeight: 600, marginBottom: 4 }}>
                                🌙 Cena:
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {cenas.map(comida => (
                                  <div key={comida.id}>
                                    <div
                                      onClick={() => setNotaEditandose(notaEditandose === comida.id ? null : comida.id)}
                                      style={{
                                        background: comida.comida_id 
                                          ? 'linear-gradient(135deg, #ffeaa7 0%, #ffd93d 100%)'
                                          : 'linear-gradient(135deg, #b3e5fc 0%, #81d4fa 100%)',
                                        padding: '6px 8px',
                                        borderRadius: 6,
                                        fontSize: 12,
                                        color: '#2c2c2c',
                                        fontWeight: 500,
                                        border: '1px solid rgba(0,0,0,0.06)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                      }}
                                    >
                                      <span style={{ flex: 1 }}>{comida.comida_nombre}</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        {comida.notas && (
                                          <span style={{ 
                                            fontSize: 10, 
                                            color: '#666',
                                            background: 'rgba(255,255,255,0.8)',
                                            padding: '2px 4px',
                                            borderRadius: 3
                                          }} 
                                          title={comida.notas}>📝</span>
                                        )}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEliminarPlanificada(comida);
                                          }}
                                          title="Eliminar"
                                          style={{
                                            background: 'rgba(255, 59, 48, 0.1)',
                                            border: 'none',
                                            borderRadius: 4,
                                            padding: '2px 6px',
                                            cursor: 'pointer',
                                            fontSize: 10,
                                            color: '#ff3b30'
                                          }}
                                        >
                                          🗑️
                                        </button>
                                      </div>
                                    </div>
                                    
                                    {notaEditandose === comida.id && (
                                      <div style={{
                                        marginTop: 4,
                                        padding: 8,
                                        background: '#fff',
                                        borderRadius: 6,
                                        border: '1px solid #e0e0e0'
                                      }}>
                                        <textarea
                                          value={comida.notas || ''}
                                          onChange={(e) => {
                                            const nuevasNotas = e.target.value;
                                            setComidasPlanificadas(prev =>
                                              prev.map(c => c.id === comida.id ? { ...c, notas: nuevasNotas } : c)
                                            );
                                          }}
                                          onBlur={() => handleActualizarNotasPlanificada(comida.id, comida.notas)}
                                          placeholder="Añade notas..."
                                          style={{
                                            width: '100%',
                                            minHeight: 50,
                                            padding: 6,
                                            borderRadius: 4,
                                            border: '1px solid #ddd',
                                            fontSize: 11,
                                            fontFamily: 'inherit',
                                            resize: 'vertical',
                                            boxSizing: 'border-box',
                                            outline: 'none'
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ));
                    })()
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          background: toast.type === 'success' ? '#34C759' : '#FF3B30',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          zIndex: 9999,
          animation: 'slideIn 0.3s ease-out',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          maxWidth: isMobile ? 'calc(100% - 40px)' : '300px'
        }}>
          {toast.message}
        </div>
      )}

      {/* MODAL MOVER/REPETIR */}
      {moveModal && (
        <div 
          ref={moveModalRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '32px 24px',
            maxWidth: 400,
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <h2 style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#1d1d1f',
              marginBottom: 8,
              textAlign: 'center'
            }}>
              ¿Mover o repetir?
            </h2>
            <p style={{
              fontSize: 14,
              color: '#666',
              marginBottom: 24,
              textAlign: 'center',
              fontWeight: 500
            }}>
              "{moveModal.item.comida_nombre || moveModal.item.nombre}"
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={() => handleMoverORepetir('mover')}
                disabled={loading}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1px solid #007AFF',
                  background: '#fff',
                  color: '#007AFF',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.background = '#f0f8ff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#fff';
                }}
              >
                {loading ? '⏳ Moviendo...' : '↔️ Mover (cambiar de lugar)'}
              </button>
              
              <button
                onClick={() => handleMoverORepetir('repetir')}
                disabled={loading}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1px solid #34C759',
                  background: '#fff',
                  color: '#34C759',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.background = '#f0fff4';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#fff';
                }}
              >
                {loading ? '⏳ Repitiendo...' : '🔁 Repetir (mantener original)'}
              </button>
              
              <button
                onClick={() => setMoveModal(null)}
                disabled={loading}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: 'none',
                  background: '#f5f5f7',
                  color: '#1d1d1f',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.background = '#efefef';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f5f5f7';
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {deleteModal && (
        <div 
          ref={deleteModalRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '32px 24px',
            maxWidth: 400,
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <h2 style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#1d1d1f',
              marginBottom: 8,
              textAlign: 'center'
            }}>
              ¿Qué acción quieres realizar?
            </h2>
            <p style={{
              fontSize: 14,
              color: '#666',
              marginBottom: 24,
              textAlign: 'center',
              fontWeight: 500
            }}>
              Con "{deleteModal.comida.comida_nombre}"
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={() => handleConfirmarEliminar('eliminar')}
                disabled={loading}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1px solid #FF3B30',
                  background: '#fff',
                  color: '#FF3B30',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.background = '#fff5f5';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#fff';
                }}
              >
                {loading ? '⏳ Eliminando...' : '🗑️ Eliminar completamente'}
              </button>
              
              {deleteModal.type === 'both' && (
                <button
                  onClick={() => handleConfirmarEliminar('quitar')}
                  disabled={loading}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1px solid #007AFF',
                    background: '#fff',
                    color: '#007AFF',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: loading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.target.style.background = '#f0f8ff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#fff';
                  }}
                >
                  {loading ? '⏳ Quitando...' : '↩️ Quitarlo del calendario'}
                </button>
              )}
              
              <button
                onClick={() => setDeleteModal(null)}
                disabled={loading}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: 'none',
                  background: '#f5f5f7',
                  color: '#1d1d1f',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.background = '#efefef';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f5f5f7';
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SELECCIÓN DE COMIDAS - MÓVIL */}
      {mobileSelectModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 10000,
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setMobileSelectModal(null)}
        >
          <div 
            style={{
              background: '#fff',
              borderRadius: '20px 20px 0 0',
              padding: '24px',
              maxWidth: '100%',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
              animation: 'slideInUp 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#1d1d1f',
              marginBottom: 16,
              textAlign: 'center'
            }}>
              🍽️ Selecciona una comida
            </div>
            <div style={{
              fontSize: 13,
              color: '#666',
              marginBottom: 16,
              textAlign: 'center'
            }}>
              {mobileSelectModal.tipoComida === 'comida' ? '🍽️ Comida' : '🌙 Cena'} -{' '}
              {mobileSelectModal.fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxHeight: 'calc(70vh - 120px)',
              overflowY: 'auto'
            }}>
              {comidasNoUsadas.length === 0 ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#999',
                  fontSize: 13
                }}>
                  Sin comidas disponibles
                </div>
              ) : (
                comidasNoUsadas.map((comida) => (
                  <button
                    key={comida.id}
                    onClick={() => handlePlanificarDesdeMobil(comida.id)}
                    disabled={loading}
                    style={{
                      padding: '12px 14px',
                      background: '#f5f5f7',
                      border: '1px solid #e5e5e7',
                      borderRadius: 10,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#1d1d1f',
                      transition: 'all 0.2s',
                      opacity: loading ? 0.6 : 1,
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) e.currentTarget.style.background = '#efefef';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f5f5f7';
                    }}
                  >
                    <div>
                      <div>{comida.nombre}</div>
                      {comida.notas && (
                        <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                          📝 {comida.notas.substring(0, 30)}...
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 16 }}>→</span>
                  </button>
                ))
              )}
            </div>

            <button
              onClick={() => setMobileSelectModal(null)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: 16,
                borderRadius: 10,
                border: 'none',
                background: '#f5f5f7',
                color: '#1d1d1f',
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = '#efefef';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f5f5f7';
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarioComidasV2;
