import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import Header from './Header';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function CalendarioComidas({ onBack }) {
  const { t } = useLanguage();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [semanaActual, setSemanaActual] = useState(0); // 0 = semana actual
  const [comidasCongeladas, setComidasCongeladas] = useState([]);
  const [comidasPlanificadas, setComidasPlanificadas] = useState([]);
  const [nuevaComida, setNuevaComida] = useState('');
  const [comidaExpandida, setComidaExpandida] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [pulseCell, setPulseCell] = useState(null); // {fecha, tipoComida} para animación pulse
  const [modoTextoLibre, setModoTextoLibre] = useState(null); // {fecha, tipoComida}
  const [textoLibre, setTextoLibre] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // {type: 'success'|'error', message: string}
  const [deleteModal, setDeleteModal] = useState(null); // {comida, type: 'complete'|'both'}
  const [mostrarUsados, setMostrarUsados] = useState(false);
  const [moveModal, setMoveModal] = useState(null);
  const [comidaEnEdicion, setComidaEnEdicion] = useState(null); // {id, nuevoNombre}
  const [notasCalendarioAbiertas, setNotasCalendarioAbiertas] = useState(null); // id de comida planificada

  // Toast automático
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Limpiar animación pulse después de 600ms
  useEffect(() => {
    if (pulseCell) {
      const timer = setTimeout(() => setPulseCell(null), 600);
      return () => clearTimeout(timer);
    }
  }, [pulseCell]);

  // Detectar cambios de tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cargar datos
  const cargarComidasCongeladas = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/comidas-congeladas`);
      setComidasCongeladas(res.data);
    } catch (err) {
      console.error('Error al cargar comidas congeladas:', err);
    }
  }, []);

  const cargarComidasPlanificadas = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/comidas-planificadas`);
      setComidasPlanificadas(res.data);
    } catch (err) {
      console.error('Error al cargar comidas planificadas:', err);
    }
  }, []);

  // Limpiar comidas planificadas vencidas (fecha anterior a hoy)
  const limpiarComidasVencidas = useCallback(async () => {
    try {
      const hoy = new Date();
      const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay();
      
      // Calcular el lunes de la semana actual
      const lunesActual = new Date(hoy);
      lunesActual.setDate(hoy.getDate() - diaSemana + 1);
      lunesActual.setHours(0, 0, 0, 0);
      
      const response = await axios.get(`${API_URL}/comidas-planificadas`);
      const comidasVencidas = response.data.filter(comida => {
        const fechaComida = new Date(comida.fecha);
        fechaComida.setHours(0, 0, 0, 0);
        return fechaComida < lunesActual; // Anterior al lunes de la semana actual
      });

      if (comidasVencidas.length === 0) return;

      // Agrupar comidas vencidas por comida_id para optimizar
      const comidasPorId = new Map();
      comidasVencidas.forEach(comida => {
        if (comida.comida_id) {
          if (!comidasPorId.has(comida.comida_id)) {
            comidasPorId.set(comida.comida_id, []);
          }
          comidasPorId.get(comida.comida_id).push(comida.id);
        }
      });

      // Eliminar las comidas vencidas
      await Promise.all(comidasVencidas.map(comida => 
        axios.delete(`${API_URL}/comidas-planificadas/${comida.id}`)
      ));

      // Verificar qué comidas del inventario destachar
      const comidasADestachar = [];
      for (const [comidaId, idsVencidos] of comidasPorId.entries()) {
        // Verificar si hay otras planificaciones NO vencidas de esta comida
        const otrasPlanificaciones = response.data.filter(
          cp => cp.comida_id === comidaId && !idsVencidos.includes(cp.id)
        );
        
        // Solo destachar si no hay otras planificaciones activas
        if (otrasPlanificaciones.length === 0) {
          comidasADestachar.push(comidaId);
        }
      }

      // Destachar comidas del inventario en paralelo
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

  useEffect(() => {
    // Primero limpiar comidas vencidas
    limpiarComidasVencidas().then(() => {
      // Luego cargar los datos limpios
      cargarComidasCongeladas();
      cargarComidasPlanificadas();
    });
    
    // Limpiar comidas tachadas de semanas pasadas
    axios.delete(`${API_URL}/comidas-congeladas/limpiar/pasadas`).catch(console.error);
  }, [cargarComidasCongeladas, cargarComidasPlanificadas, limpiarComidasVencidas]);

  // Calcular fechas de la quincena (2 semanas) - MEMOIZADO
  const fechasQuincena = useMemo(() => {
    const hoy = new Date();
    const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay();
    
    // Calcular el lunes de la semana actual
    const lunesActual = new Date(hoy);
    lunesActual.setDate(hoy.getDate() - diaSemana + 1);
    
    // Ajustar según semanaActual (ahora en semanas de 7 días)
    lunesActual.setDate(lunesActual.getDate() + (semanaActual * 7));
    
    const fechas = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(lunesActual);
      fecha.setDate(lunesActual.getDate() + i);
      fechas.push(fecha);
    }
    
    return fechas;
  }, [semanaActual]); // Solo recalcular cuando cambia la semana

  const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  // Añadir comida al inventario
  const handleAñadirComida = async (e) => {
    e.preventDefault();
    if (!nuevaComida.trim()) return;

    try {
      await axios.post(`${API_URL}/comidas-congeladas`, { nombre: nuevaComida });
      setNuevaComida('');
      cargarComidasCongeladas();
    } catch (err) {
      alert(t('errorAnadirComida'));
    }
  };

  // Actualizar notas de una comida
  const handleActualizarNotas = async (id, notas) => {
    try {
      const comida = comidasCongeladas.find(c => c.id === id);
      await axios.put(`${API_URL}/comidas-congeladas/${id}`, {
        nombre: comida.nombre,
        notas
      });
      cargarComidasCongeladas();
    } catch (err) {
      alert(t('errorActualizarNotas'));
    }
  };

  // Eliminar comida del inventario
  const handleEliminarComida = async (id) => {
    if (!window.confirm(t('seguro'))) return;

    try {
      await axios.delete(`${API_URL}/comidas-congeladas/${id}`);
      cargarComidasCongeladas();
    } catch (err) {
      alert(t('errorEliminarComida'));
    }
  };

  // Drag & Drop - Inicio
  const handleDragStart = (e, item, source) => {
    setDraggedItem({ item, source });
    e.dataTransfer.effectAllowed = 'move';
    
    // Crear imagen de arrastre personalizada
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
    // Solo limpia el drop target si se sale completamente de la celda
    // (no cuando entras en un elemento hijo)
    if (e.target === e.currentTarget) {
      setDropTarget(null);
    }
  };

  // Añadir comida de texto libre al calendario
  const handleAñadirTextoLibre = async () => {
    if (!textoLibre.trim() || !modoTextoLibre) return;

    setLoading(true);
    try {
      const fechaStr = modoTextoLibre.fecha.toISOString().split('T')[0];
      await axios.post(`${API_URL}/comidas-planificadas`, {
        comida_id: null,
        comida_nombre: textoLibre,
        fecha: fechaStr,
        tipo_comida: modoTextoLibre.tipoComida
      });
      
      setToast({ type: 'success', message: `"${textoLibre}" añadido ✓` });
      setTextoLibre('');
      setModoTextoLibre(null);
      cargarComidasPlanificadas();
    } catch (err) {
      setToast({ type: 'error', message: 'Error al añadir' });
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (e, fecha, tipoComida) => {
    e.preventDefault();
    setDropTarget(null);

    if (!draggedItem) return;

    // Activar animación pulse en la celda
    setPulseCell({ fecha: fecha.getTime(), tipoComida });

    const fechaStr = fecha.toISOString().split('T')[0];

    // Si es desde inventario sin tachar, añadir directamente sin modal
    if (draggedItem.source === 'inventario' && !draggedItem.item.tachada) {
      setLoading(true);
      try {
        await axios.post(`${API_URL}/comidas-planificadas`, {
          comida_id: draggedItem.item.id,
          comida_nombre: draggedItem.item.nombre,
          fecha: fechaStr,
          tipo_comida: tipoComida
        });
        setToast({ type: 'success', message: `"${draggedItem.item.nombre}" añadido al calendario ✓` });
        cargarComidasPlanificadas();
        
        // Tachar comida en inventario
        await axios.put(`${API_URL}/comidas-congeladas/${draggedItem.item.id}`, {
          tachada: true
        });
        cargarComidasCongeladas();
      } catch (err) {
        setToast({ type: 'error', message: 'Error al añadir la comida' });
      } finally {
        setLoading(false);
        setDraggedItem(null);
      }
    } else {
      // Si es desde calendario o desde inventario tachado, mostrar modal mover/repetir
      setMoveModal({
        item: draggedItem.item,
        source: draggedItem.source,
        fecha: fecha,
        tipoComida: tipoComida
      });
      setDraggedItem(null);
    }
  };

  // Eliminar comida planificada
  const handleEliminarPlanificada = async (comida) => {
    // Abrir modal con las opciones
    setDeleteModal({
      comida,
      type: comida.comida_id ? 'both' : 'complete' // 'both' = opciones, 'complete' = solo eliminar
    });
  };

  // Confirmar eliminación desde el modal
  const handleConfirmarEliminar = async (opcion) => {
    if (!deleteModal) return;

    const comida = deleteModal.comida;
    setLoading(true);

    try {
      await axios.delete(`${API_URL}/comidas-planificadas/${comida.id}`);

      if (opcion === 'quitar' && comida.comida_id) {
        // Volver al listado - destachar
        await axios.put(`${API_URL}/comidas-congeladas/${comida.comida_id}`, {
          tachada: false
        });
      }

      setToast({ type: 'success', message: `"${comida.comida_nombre}" ${opcion === 'quitar' ? 'quitado del calendario ✓' : 'eliminado ✓'}` });
      cargarComidasCongeladas();
      cargarComidasPlanificadas();
    } catch (err) {
      setToast({ type: 'error', message: 'Error al eliminar' });
    } finally {
      setLoading(false);
      setDeleteModal(null);
    }
  };

  // Obtener comidas planificadas para una fecha y tipo (puede haber m\u00faltiples)
  const getComidasPlanificadas = (fecha, tipoComida) => {
    const fechaStr = fecha.toISOString().split('T')[0];
    return comidasPlanificadas.filter(
      c => c.fecha && c.fecha.split('T')[0] === fechaStr && c.tipo_comida === tipoComida
    );
  };


  // Manejar mover/repetir item
  const handleMoverORepetir = async (accion) => {
    if (!moveModal) return;

    setLoading(true);
    const fechaStr = moveModal.fecha.toISOString().split('T')[0];

    try {
      if (accion === 'repetir') {
        // Crear nueva entrada planificada
        if (moveModal.source === 'calendario') {
          await axios.post(`${API_URL}/comidas-planificadas`, {
            comida_id: moveModal.item.comida_id,
            comida_nombre: moveModal.item.comida_nombre,
            fecha: fechaStr,
            tipo_comida: moveModal.tipoComida
          });
        } else {
          // Desde inventario tachado
          await axios.post(`${API_URL}/comidas-planificadas`, {
            comida_id: moveModal.item.id,
            comida_nombre: moveModal.item.nombre,
            fecha: fechaStr,
            tipo_comida: moveModal.tipoComida
          });
        }
        setToast({ type: 'success', message: 'Item repetido ✓' });
      } else {
        // Mover
        if (moveModal.source === 'calendario') {
          await axios.put(`${API_URL}/comidas-planificadas/${moveModal.item.id}`, {
            fecha: fechaStr,
            tipo_comida: moveModal.tipoComida
          });
          setToast({ type: 'success', message: 'Item movido ✓' });
        } else {
          // Desde inventario tachado - crear nueva y dejar tachado
          await axios.post(`${API_URL}/comidas-planificadas`, {
            comida_id: moveModal.item.id,
            comida_nombre: moveModal.item.nombre,
            fecha: fechaStr,
            tipo_comida: moveModal.tipoComida
          });
          setToast({ type: 'success', message: 'Item añadido ✓' });
        }
      }
      cargarComidasPlanificadas();
    } catch (err) {
      setToast({ type: 'error', message: 'Error al procesar' });
    } finally {
      setLoading(false);
      setMoveModal(null);
    }
  };

  // Eliminar comida tachada del inventario con warning
  const handleEliminarComidaTachada = async (comida) => {
    const comidaPlanificada = comidasPlanificadas.find(cp => cp.comida_id === comida.id);
    const mensaje = comidaPlanificada 
      ? `Si eliminas "${comida.nombre}", también se borrará del calendario. ¿Continuar?`
      : `¿Eliminar "${comida.nombre}"?`;
    
    if (!window.confirm(mensaje)) return;

    setLoading(true);
    try {
      // Eliminar del inventario
      await axios.delete(`${API_URL}/comidas-congeladas/${comida.id}`);
      
      // Las comidas planificadas se eliminarán automáticamente por la FK CASCADE
      setToast({ type: 'success', message: 'Eliminado ✓' });
      cargarComidasCongeladas();
      cargarComidasPlanificadas();
    } catch (err) {
      setToast({ type: 'error', message: 'Error al eliminar' });
    } finally {
      setLoading(false);
    }
  };

  // Actualizar notas de comida planificada
  const handleActualizarNotasPlanificada = async (id, notas) => {
    try {
      await axios.put(`${API_URL}/comidas-planificadas/${id}`, { notas });
      // No necesita recargar porque ya se actualiza en el onChange
      // Solo mostramos toast de confirmación
      setToast({ type: 'success', message: 'Notas guardadas ✓' });
    } catch (err) {
      setToast({ type: 'error', message: 'Error al guardar notas' });
      // En caso de error, recargar para recuperar el estado original
      cargarComidasPlanificadas();
    }
  };

  // Obtener la fecha más reciente de planificación para una comida - MEMOIZADO
  const getFechaUltimaPlanificacion = useCallback((comidaId) => {
    const planificaciones = comidasPlanificadas.filter(cp => cp.comida_id === comidaId);
    if (planificaciones.length === 0) return null;
    
    // Ordenar por fecha descendente y coger la más reciente (sin mutar el array original)
    const fechaStr = [...planificaciones].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0].fecha;
    const fecha = new Date(fechaStr);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}`;
  }, [comidasPlanificadas]);

  // Guardar nombre editado de una comida
  const handleGuardarNombreComida = async (comidaId, nuevoNombre) => {
    if (!nuevoNombre.trim()) {
      setToast({ type: 'error', message: 'El nombre no puede estar vacío' });
      setComidaEnEdicion(null);
      return;
    }

    try {
      const comida = comidasCongeladas.find(c => c.id === comidaId);
      await axios.put(`${API_URL}/comidas-congeladas/${comidaId}`, {
        nombre: nuevoNombre,
        notas: comida.notas
      });
      cargarComidasCongeladas();
      setToast({ type: 'success', message: 'Nombre actualizado ✓' });
      setComidaEnEdicion(null);
    } catch (err) {
      setToast({ type: 'error', message: 'Error al actualizar nombre' });
    }
  };

  // Memoizar getComidasPlanificadas para evitar recálculos
  const getComidasPlanificadasMemo = useCallback((fecha, tipoComida) => {
    const fechaStr = fecha.toISOString().split('T')[0];
    return comidasPlanificadas.filter(
      c => c.fecha && c.fecha.split('T')[0] === fechaStr && c.tipo_comida === tipoComida
    );
  }, [comidasPlanificadas]);

  // Memoizar listas filtradas de comidas para evitar recalcular en cada render
  const comidasNoUsadas = useMemo(() => 
    comidasCongeladas.filter(c => !c.tachada), 
    [comidasCongeladas]
  );

  const comidasUsadas = useMemo(() => 
    comidasCongeladas.filter(c => c.tachada), 
    [comidasCongeladas]
  );

  return (
    <div style={{
      background: '#f5f5f7',
      padding: isMobile ? '20px 12px' : '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative'
    }}>
      {/* Animaciones CSS */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 rgba(0, 122, 255, 0);
          }
          50% {
            transform: scale(1.02);
            box-shadow: 0 0 20px rgba(0, 122, 255, 0.4);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 rgba(0, 122, 255, 0);
          }
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          background: toast.type === 'success' ? '#34C759' : '#FF3B30',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 500,
          zIndex: 9999,
          animation: 'slideIn 0.3s ease-out',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          maxWidth: isMobile ? 'calc(100% - 40px)' : '300px'
        }}>
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>

      {/* Modal Mover/Repetir */}
      {moveModal && (
        <div style={{
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
        }}>
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
              {/* Opción: Mover */}
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
                  if (!loading) {
                    e.target.style.background = '#f0f8ff';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#fff';
                }}
              >
                {loading ? '⏳ Moviendo...' : '↔️ Mover (cambiar de lugar)'}
              </button>

              {/* Opción: Repetir */}
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
                  if (!loading) {
                    e.target.style.background = '#f0fff4';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#fff';
                }}
              >
                {loading ? '⏳ Repitiendo...' : '🔁 Repetir (mantener original)'}
              </button>

              {/* Botón Cancelar */}
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
                  if (!loading) {
                    e.target.style.background = '#efefef';
                  }
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

      {/* Modal de Eliminar */}
      {deleteModal && (
        <div style={{
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
        }}>
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
              {/* Opción 1: Eliminar completamente */}
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
                  if (!loading) {
                    e.target.style.background = '#fff5f5';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#fff';
                }}
              >
                {loading ? '⏳ Eliminando...' : '🗑️ Eliminar completamente'}
              </button>

              {/* Opción 2: Quitar del calendario (solo si viene del inventario) */}
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
                    if (!loading) {
                      e.target.style.background = '#f0f8ff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#fff';
                  }}
                >
                  {loading ? '⏳ Quitando...' : '↩️ Quitarlo del calendario'}
                </button>
              )}

              {/* Botón Cancelar */}
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
                  if (!loading) {
                    e.target.style.background = '#efefef';
                  }
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

      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <Header title={t('calendarioComidas')} />

        {/* Botón atrás */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button
            onClick={onBack}
            style={{
              background: '#fff',
              border: '1px solid #e5e5e7',
              padding: '10px 16px',
              borderRadius: 12,
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 500,
              color: '#007AFF',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#f5f5f7';
              e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#fff';
              e.target.style.boxShadow = 'none';
            }}
          >
            ← {t('volver')}
          </button>
        </div>

        {/* Grid principal: Inventario + Calendario */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '300px 1fr', 
          gap: 24,
          marginBottom: 32 
        }}>
          {/* INVENTARIO DE COMIDAS CONGELADAS */}
          <div style={{
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            border: '1px solid #f0f0f0',
            padding: 20,
            maxHeight: isMobile ? 'auto' : '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ 
              fontSize: 18, 
              fontWeight: 700, 
              color: '#1d1d1f', 
              marginBottom: 16,
              textAlign: 'center'
            }}>
              {t('comidasCongeladas')}
            </h3>

            {/* Formulario añadir comida */}
            <form onSubmit={handleAñadirComida} style={{ marginBottom: 20 }}>
              <input
                type="text"
                value={nuevaComida}
                onChange={(e) => setNuevaComida(e.target.value)}
                placeholder={t('nuevaComida')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #e5e5e7',
                  fontSize: 14,
                  marginBottom: 8,
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(90deg, #007aff 60%, #00c6fb 100%)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                + {t('anadir')}
              </button>
            </form>

            {/* Lista de comidas */}
            {/* Lista de comidas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Items SIN USAR (arriba) */}
              {comidasNoUsadas.map((comida) => (
                <div key={comida.id}>
                  <div
                    draggable={comidaEnEdicion?.id !== comida.id}
                    onDragStart={(e) => handleDragStart(e, comida, 'inventario')}
                    onClick={() => setComidaExpandida(comidaExpandida === comida.id ? null : comida.id)}
                    style={{
                      padding: '10px 12px',
                      background: '#fff',
                      border: '1px solid #e5e5e7',
                      borderRadius: 8,
                      cursor: comidaEnEdicion?.id === comida.id ? 'text' : 'grab',
                      color: '#1d1d1f',
                      fontSize: 14,
                      fontWeight: 500,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#f5f5f7';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#fff';
                    }}
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
                            fontSize: 14,
                            fontWeight: 500,
                            fontFamily: 'inherit',
                            boxSizing: 'border-box'
                          }}
                        />
                      ) : (
                        <span>{comida.nombre}</span>
                      )}
                      {comida.notas && (
                        <span style={{ 
                          fontSize: 11, 
                          padding: '2px 6px',
                          background: '#e8e8ed',
                          borderRadius: 4,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }} 
                        title="Tiene notas"
                        onMouseEnter={(e) => {
                          e.target.style.background = '#007AFF';
                          e.target.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#e8e8ed';
                          e.target.style.color = 'inherit';
                        }}
                        >
                          📝
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 12, color: '#007AFF', userSelect: 'none' }}>
                        {comidaExpandida === comida.id ? '▲' : '▼'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setComidaEnEdicion({ id: comida.id, nuevoNombre: comida.nombre });
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 14,
                          color: '#007AFF',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center'
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
                          fontSize: 16,
                          color: '#ff3b30',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center'
                        }}
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
                        placeholder={t('anadirNotas')}
                        style={{
                          width: '100%',
                          minHeight: 50,
                          padding: 6,
                          borderRadius: 6,
                          border: '1px solid #e5e5e7',
                          fontSize: 12,
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* Separador y pestaña para items USADOS */}
              {comidasUsadas.length > 0 && (
                <>
                  <div style={{ 
                    height: 1, 
                    background: '#e5e5e7', 
                    margin: '8px 0' 
                  }} />
                  
                  <button
                    onClick={() => setMostrarUsados(!mostrarUsados)}
                    style={{
                      padding: '8px 12px',
                      background: '#f5f5f7',
                      border: '1px solid #e5e5e7',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#666',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#efefef';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#f5f5f7';
                    }}
                  >
                    <span>📋 Comidas ya planificadas ({comidasUsadas.length})</span>
                    <span>{mostrarUsados ? '▲' : '▼'}</span>
                  </button>
                </>
              )}

              {/* Items USADOS (tachados) - solo si la pestaña está abierta */}
              {mostrarUsados && comidasUsadas.map((comida) => (
                <div key={comida.id}>
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, comida, 'inventario')}
                    onClick={() => setComidaExpandida(comidaExpandida === comida.id ? null : comida.id)}
                    style={{
                      padding: '10px 12px',
                      background: '#f5f5f7',
                      border: '1px solid #e5e5e7',
                      borderRadius: 8,
                      cursor: 'pointer',
                      textDecoration: 'line-through',
                      color: '#999',
                      fontSize: 14,
                      fontWeight: 500,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#efefef';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#f5f5f7';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span>{comida.nombre}</span>
                        {getFechaUltimaPlanificacion(comida.id) && (
                          <span style={{ fontSize: 11, color: '#999' }}>
                            📅 {getFechaUltimaPlanificacion(comida.id)}
                          </span>
                        )}
                      </div>
                      {comida.notas && (
                        <span style={{ 
                          fontSize: 11, 
                          padding: '2px 6px',
                          background: '#d0d0d0',
                          borderRadius: 4,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }} 
                        title="Tiene notas"
                        onMouseEnter={(e) => {
                          e.target.style.background = '#007AFF';
                          e.target.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#d0d0d0';
                          e.target.style.color = 'inherit';
                        }}
                        >
                          📝
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 12, color: '#999', userSelect: 'none' }}>
                        {comidaExpandida === comida.id ? '▲' : '▼'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEliminarComidaTachada(comida);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 16,
                          color: '#ff3b30',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          opacity: 0.7
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Notas expandibles para items tachados */}
                  {comidaExpandida === comida.id && (
                    <div style={{
                      padding: '8px',
                      background: '#fafafa',
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
                        placeholder={t('anadirNotas')}
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
                          background: '#fff'
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}

              {comidasCongeladas.length === 0 && (
                <div style={{
                  padding: 20,
                  textAlign: 'center',
                  color: '#999',
                  fontSize: 14
                }}>
                  {t('sinComidasCongeladas')}
                </div>
              )}
            </div>

          </div>

          {/* CALENDARIO BISEMANAL */}
          <div style={{
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            border: '1px solid #f0f0f0',
            padding: 20
          }}>
            {/* Navegación de semanas */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: isMobile ? 8 : 16, 
              marginBottom: 24,
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setSemanaActual(prev => prev - 1)}
                style={{
                  background: '#f5f5f7',
                  border: 'none',
                  fontSize: isMobile ? 14 : 16,
                  cursor: 'pointer',
                  padding: isMobile ? '6px 12px' : '8px 16px',
                  color: '#007AFF',
                  borderRadius: 8,
                  fontWeight: 600,
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#efefef'}
                onMouseOut={(e) => e.target.style.background = '#f5f5f7'}
              >
                ◀ {isMobile ? '' : t('anterior')}
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
                  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
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
                onClick={() => setSemanaActual(prev => prev + 1)}
                style={{
                  background: '#f5f5f7',
                  border: 'none',
                  fontSize: isMobile ? 14 : 16,
                  cursor: 'pointer',
                  padding: isMobile ? '6px 12px' : '8px 16px',
                  color: '#007AFF',
                  borderRadius: 8,
                  fontWeight: 600,
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#efefef'}
                onMouseOut={(e) => e.target.style.background = '#f5f5f7'}
              >
                {isMobile ? '' : t('siguiente')} ▶
              </button>
            </div>

            {/* Calendario */}
            <div style={{ overflowX: 'auto', margin: isMobile ? '0 -20px' : 0, padding: isMobile ? '0 20px' : 0 }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                minWidth: isMobile ? '100%' : 'auto',
                tableLayout: 'fixed'
              }}>
                <thead>
                  <tr style={{ background: '#f1f3f4' }}>
                    <th style={{ 
                      padding: '10px 8px', 
                      fontWeight: 600, 
                      fontSize: 13,
                      borderBottom: '2px solid #e5e5e7',
                      textAlign: 'center',
                      width: 50
                    }}></th>
                    {fechasQuincena.map((fecha, idx) => (
                      <th key={idx} style={{
                        padding: isMobile ? '6px 4px' : '10px 8px',
                        fontWeight: 600,
                        fontSize: isMobile ? 11 : 13,
                        borderBottom: '2px solid #e5e5e7',
                        textAlign: 'center',
                        width: isMobile ? '12%' : '13%',
                        maxWidth: isMobile ? 80 : 120,
                        background: fecha.getDay() === 0 || fecha.getDay() === 6 ? '#f9f9f9' : '#f1f3f4'
                      }}>
                        <div>{diasSemana[fecha.getDay() === 0 ? 6 : fecha.getDay() - 1]}</div>
                        <div style={{ fontSize: isMobile ? 9 : 11, color: '#666', marginTop: 2 }}>
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
                      padding: isMobile ? '4px' : '8px',
                      fontWeight: 600,
                      fontSize: isMobile ? 10 : 12,
                      background: '#fff3cd',
                      borderRight: '1px solid #e5e5e7',
                      textAlign: 'center',
                      color: '#856404',
                      minWidth: isMobile ? 40 : 50
                    }}>
                      🍽️<br/>{t('comida')}
                    </td>
                    {fechasQuincena.map((fecha, idx) => {
                      const comidas = getComidasPlanificadasMemo(fecha, 'comida');
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
                          style={{
                            padding: isMobile ? 4 : 8,
                            minHeight: isMobile ? 50 : 60,
                            border: isDropTarget ? '3px solid #007AFF' : '1px solid #e5e5e7',
                            background: isDropTarget ? '#e3f2fd' : (fecha.getDay() === 0 || fecha.getDay() === 6 ? '#fafafa' : '#fff'),
                            transition: 'all 0.2s',
                            verticalAlign: 'top',
                            position: 'relative',
                            boxShadow: isDropTarget ? '0 0 8px rgba(0, 122, 255, 0.3)' : 'none',
                            animation: isPulsing ? 'pulse 0.6s ease-out' : 'none'
                          }}
                        >
                          {isTextoLibreMode ? (
                            <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={textoLibre}
                                onChange={(e) => setTextoLibre(e.target.value)}
                                placeholder={t('escribirProducto')}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAñadirTextoLibre();
                                  if (e.key === 'Escape') { setTextoLibre(''); setModoTextoLibre(null); }
                                }}
                                style={{
                                  flex: 1,
                                  padding: '4px 6px',
                                  borderRadius: 4,
                                  border: '1px solid #007AFF',
                                  fontSize: 11,
                                  boxSizing: 'border-box'
                                }}
                              />
                              <button
                                onClick={handleAñadirTextoLibre}
                                style={{
                                  padding: '2px 8px',
                                  background: '#007AFF',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 4,
                                  fontSize: 11,
                                  cursor: 'pointer'
                                }}
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => { setTextoLibre(''); setModoTextoLibre(null); }}
                                style={{
                                  padding: '2px 8px',
                                  background: '#ccc',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 4,
                                  fontSize: 11,
                                  cursor: 'pointer'
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {comidas.map((comida) => (
                                <div key={comida.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  <div
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, comida, 'calendario')}
                                    style={{
                                      background: comida.comida_id 
                                        ? 'linear-gradient(135deg, #ffeaa7 0%, #ffd93d 100%)' 
                                        : 'linear-gradient(135deg, #b3e5fc 0%, #81d4fa 100%)',
                                      padding: isMobile ? '4px 6px' : '6px 8px',
                                      borderRadius: 6,
                                      fontSize: isMobile ? 10 : 12,
                                      fontWeight: 600,
                                      color: '#1d1d1f',
                                      cursor: 'grab',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      gap: 4,
                                      border: '1px solid rgba(0,0,0,0.08)',
                                      animation: 'fadeIn 0.3s ease-in',
                                      pointerEvents: 'auto'
                                    }}
                                  >
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                                      {comida.comida_nombre}
                                    </span>
                                    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setNotasCalendarioAbiertas(notasCalendarioAbiertas === comida.id ? null : comida.id);
                                        }}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          cursor: 'pointer',
                                          fontSize: 11,
                                          padding: 0,
                                          color: comida.notas ? '#007AFF' : '#999',
                                          opacity: notasCalendarioAbiertas === comida.id ? 1 : 0.7
                                        }}
                                        title={comida.notas ? 'Ver notas' : 'Añadir notas'}
                                      >
                                        📝
                                      </button>
                                      <button
                                        onClick={() => handleEliminarPlanificada(comida)}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          cursor: 'pointer',
                                          fontSize: 12,
                                          padding: 0,
                                          color: '#d32f2f'
                                        }}
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>

                                  {/* Notas desplegables del calendario */}
                                  {notasCalendarioAbiertas === comida.id && (
                                    <div style={{
                                      padding: '6px',
                                      background: '#fff',
                                      borderRadius: 6,
                                      border: '1px solid #e5e5e7',
                                      marginTop: 2
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    >
                                      <textarea
                                        value={comida.notas || ''}
                                        onChange={(e) => {
                                          const nuevasNotas = e.target.value;
                                          setComidasPlanificadas(prev =>
                                            prev.map(c => c.id === comida.id ? { ...c, notas: nuevasNotas } : c)
                                          );
                                        }}
                                        onBlur={() => handleActualizarNotasPlanificada(comida.id, comida.notas)}
                                        placeholder="Añadir notas..."
                                        autoFocus
                                        style={{
                                          width: '100%',
                                          minHeight: 40,
                                          padding: 4,
                                          borderRadius: 4,
                                          border: '1px solid #007AFF',
                                          fontSize: 11,
                                          fontFamily: 'inherit',
                                          resize: 'vertical',
                                          boxSizing: 'border-box'
                                        }}
                                      />
                                    </div>
                                  )}
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
                      padding: isMobile ? '4px' : '8px',
                      fontWeight: 600,
                      fontSize: isMobile ? 10 : 12,
                      background: '#e3f2fd',
                      borderRight: '1px solid #e5e5e7',
                      textAlign: 'center',
                      color: '#1565c0',
                      minWidth: isMobile ? 40 : 50
                    }}>
                      🌙<br/>{t('cena')}
                    </td>
                    {fechasQuincena.map((fecha, idx) => {
                      const comidas = getComidasPlanificadasMemo(fecha, 'cena');
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
                          style={{
                            padding: isMobile ? 4 : 8,
                            minHeight: isMobile ? 50 : 60,
                            border: isDropTarget ? '3px solid #007AFF' : '1px solid #e5e5e7',
                            background: isDropTarget ? '#e3f2fd' : (fecha.getDay() === 0 || fecha.getDay() === 6 ? '#fafafa' : '#fff'),
                            transition: 'all 0.2s',
                            verticalAlign: 'top',
                            boxShadow: isDropTarget ? '0 0 8px rgba(0, 122, 255, 0.3)' : 'none',
                            animation: isPulsing ? 'pulse 0.6s ease-out' : 'none'
                          }}
                        >
                          {isTextoLibreMode ? (
                            <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={textoLibre}
                                onChange={(e) => setTextoLibre(e.target.value)}
                                placeholder={t('escribirProducto')}
                                autoFocus
                                disabled={loading}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !loading) handleAñadirTextoLibre();
                                  if (e.key === 'Escape') { setTextoLibre(''); setModoTextoLibre(null); }
                                }}
                                style={{
                                  flex: 1,
                                  padding: '4px 6px',
                                  borderRadius: 4,
                                  border: '1px solid #007AFF',
                                  fontSize: 11,
                                  boxSizing: 'border-box',
                                  opacity: loading ? 0.6 : 1
                                }}
                              />
                              <button
                                onClick={handleAñadirTextoLibre}
                                disabled={loading}
                                style={{
                                  padding: '2px 8px',
                                  background: loading ? '#ccc' : '#007AFF',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 4,
                                  fontSize: 11,
                                  cursor: loading ? 'not-allowed' : 'pointer',
                                  opacity: loading ? 0.6 : 1
                                }}
                              >
                                {loading ? '...' : '✓'}
                              </button>
                              <button
                                onClick={() => { setTextoLibre(''); setModoTextoLibre(null); }}
                                style={{
                                  padding: '2px 8px',
                                  background: '#ccc',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 4,
                                  fontSize: 11,
                                  cursor: 'pointer'
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {comidas.map((comida) => (
                                <div key={comida.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  <div
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, comida, 'calendario')}
                                    style={{
                                      background: comida.comida_id 
                                        ? 'linear-gradient(135deg, #c5e1a5 0%, #aed581 100%)' 
                                        : 'linear-gradient(135deg, #b3e5fc 0%, #81d4fa 100%)',
                                      padding: isMobile ? '4px 6px' : '6px 8px',
                                      borderRadius: 6,
                                      fontSize: isMobile ? 10 : 12,
                                      fontWeight: 600,
                                      color: '#1d1d1f',
                                      cursor: 'grab',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      gap: 4,
                                      border: '1px solid rgba(0,0,0,0.08)',
                                      opacity: loading ? 0.6 : 1,
                                      animation: 'fadeIn 0.3s ease-in',
                                      pointerEvents: 'auto'
                                    }}
                                  >
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                                      {comida.comida_nombre}
                                    </span>
                                    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setNotasCalendarioAbiertas(notasCalendarioAbiertas === comida.id ? null : comida.id);
                                        }}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          cursor: 'pointer',
                                          fontSize: 11,
                                          padding: 0,
                                          color: comida.notas ? '#007AFF' : '#999',
                                          opacity: notasCalendarioAbiertas === comida.id ? 1 : 0.7
                                        }}
                                        title={comida.notas ? 'Ver notas' : 'Añadir notas'}
                                      >
                                        📝
                                      </button>
                                      <button
                                        onClick={() => handleEliminarPlanificada(comida)}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          cursor: 'pointer',
                                          fontSize: 12,
                                          padding: 0,
                                          color: '#d32f2f'
                                        }}
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>

                                  {/* Notas desplegables del calendario */}
                                  {notasCalendarioAbiertas === comida.id && (
                                    <div style={{
                                      padding: '6px',
                                      background: '#fff',
                                      borderRadius: 6,
                                      border: '1px solid #e5e5e7',
                                      marginTop: 2
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    >
                                      <textarea
                                        value={comida.notas || ''}
                                        onChange={(e) => {
                                          const nuevasNotas = e.target.value;
                                          setComidasPlanificadas(prev =>
                                            prev.map(c => c.id === comida.id ? { ...c, notas: nuevasNotas } : c)
                                          );
                                        }}
                                        onBlur={() => handleActualizarNotasPlanificada(comida.id, comida.notas)}
                                        placeholder="Añadir notas..."
                                        autoFocus
                                        style={{
                                          width: '100%',
                                          minHeight: 40,
                                          padding: 4,
                                          borderRadius: 4,
                                          border: '1px solid #007AFF',
                                          fontSize: 11,
                                          fontFamily: 'inherit',
                                          resize: 'vertical',
                                          boxSizing: 'border-box'
                                        }}
                                      />
                                    </div>
                                  )}
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarioComidas;
