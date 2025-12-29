import React, { useState, useEffect } from 'react';
import { useCalendarEvents } from '../contexts/CalendarEventsContext';
import Header from './Header';

const CATEGORIAS = ['Cumpleaños', 'Seguro', 'Viaje', 'Día Especial'];
const TIPOS_RECURRENCIA = [
  { value: 'unica', label: 'Una sola vez' },
  { value: 'anual', label: 'Anual' },
  { value: 'semestral', label: 'Semestral (cada 6 meses)' },
  { value: 'trimestral', label: 'Trimestral (cada 3 meses)' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'cadaX', label: 'Cada X meses' }
];

function Calendario({ onBack }) {
  const { getEventosPorMes, crearEvento, actualizarEvento, desactivarEvento } = useCalendarEvents();
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [vistaAnual, setVistaAnual] = useState(false);
  const [mesActual, setMesActual] = useState(new Date().getMonth());
  const [anioActual, setAnioActual] = useState(new Date().getFullYear());
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
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
  const [errores, setErrores] = useState({});

  // Detectar cambios de tamaño de ventana para responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // Ajustar febrero en años bisiestos
  const esAñoBisiesto = (anio) => (anio % 4 === 0 && anio % 100 !== 0) || (anio % 400 === 0);
  const diasEnMes = (mes, anio) => mes === 1 && esAñoBisiesto(anio) ? 29 : diasPorMes[mes];

  const abrirModal = (evento = null, dia = null) => {
    if (evento) {
      setEditando(evento.id);
      const recurrencia = typeof evento.recurrencia === 'string' 
        ? JSON.parse(evento.recurrencia) 
        : evento.recurrencia;
      setFormData({
        nombre: evento.nombre,
        dia_mes: evento.dia_mes,
        cantidad_min: evento.cantidad_min,
        cantidad_max: evento.cantidad_max || '',
        categoria: evento.categoria,
        recurrencia
      });
      setDiaSeleccionado(null);
    } else {
      setEditando(null);
      setDiaSeleccionado(dia);
      setFormData({
        nombre: '',
        dia_mes: dia || '',
        cantidad_min: '',
        cantidad_max: '',
        categoria: 'Seguro',
        recurrencia: {
          tipo: 'anual',
          mes: mesActual,
          mesInicio: mesActual,
          cadaX: 1,
          mesAno: ''
        }
      });
    }
    setErrores({});
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setEditando(null);
    setDiaSeleccionado(null);
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
    setErrores({});
  };

  const validarFormulario = () => {
    const nuevosErrores = {};
    if (!formData.nombre.trim()) nuevosErrores.nombre = 'El nombre es obligatorio';
    if (!formData.dia_mes || formData.dia_mes < 1 || formData.dia_mes > 31) nuevosErrores.dia_mes = 'Día inválido';
    if (!formData.cantidad_min || formData.cantidad_min <= 0) nuevosErrores.cantidad_min = 'Cantidad mínima obligatoria y mayor a 0';
    if (formData.cantidad_max && formData.cantidad_max <= 0) nuevosErrores.cantidad_max = 'Cantidad máxima debe ser mayor a 0';
    if (formData.cantidad_max && formData.cantidad_min > formData.cantidad_max) {
      nuevosErrores.cantidad_max = 'Debe ser mayor que la cantidad mínima';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    try {
      const datosEvento = {
        nombre: formData.nombre,
        dia_mes: parseInt(formData.dia_mes),
        cantidad_min: parseFloat(formData.cantidad_min),
        cantidad_max: formData.cantidad_max ? parseFloat(formData.cantidad_max) : null,
        categoria: formData.categoria,
        recurrencia: {
          tipo: formData.recurrencia.tipo,
          mes: formData.recurrencia.tipo === 'anual' ? formData.recurrencia.mes : undefined,
          mesInicio: formData.recurrencia.tipo === 'semestral' || formData.recurrencia.tipo === 'trimestral' || formData.recurrencia.tipo === 'cadaX' 
            ? formData.recurrencia.mesInicio 
            : undefined,
          cadaX: formData.recurrencia.tipo === 'cadaX' ? parseInt(formData.recurrencia.cadaX) : undefined,
          mesAno: formData.recurrencia.tipo === 'unica' ? formData.recurrencia.mesAno : undefined
        }
      };

      if (editando) {
        await actualizarEvento(editando, datosEvento);
      } else {
        await crearEvento(datosEvento);
      }
      cerrarModal();
    } catch (err) {
      console.error('Error al guardar evento:', err);
    }
  };

  const manejarEliminarEvento = async (id) => {
    if (window.confirm('¿Desactivar este evento?')) {
      try {
        await desactivarEvento(id);
      } catch (err) {
        console.error('Error al desactivar evento:', err);
      }
    }
  };

  const eventosMesActual = getEventosPorMes(anioActual, mesActual);

  // Renderizar calendario mensual simplificado
  const renderCalendarioMensual = () => {
    const primerDia = new Date(anioActual, mesActual, 1).getDay();
    const diasDelMes = diasEnMes(mesActual, anioActual);
    const dias = [];

    // Días vacíos del mes anterior
    for (let i = 0; i < primerDia; i++) {
      dias.push(null);
    }

    // Días del mes
    for (let i = 1; i <= diasDelMes; i++) {
      dias.push(i);
    }

    const semanas = [];
    for (let i = 0; i < dias.length; i += 7) {
      semanas.push(dias.slice(i, i + 7));
    }

    return (
      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 16 }}>
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(dia => (
            <div key={dia} style={{ textAlign: 'center', fontWeight: 600, color: '#86868b', fontSize: 13, padding: 8 }}>
              {dia}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {semanas.map((semana, semanaIdx) =>
            semana.map((dia, diaIdx) => {
              const eventosDelDia = dia ? eventosMesActual.filter(evt => evt.dia_mes === dia) : [];
              const tieneEventos = eventosDelDia.length > 0;

              return (
                <div
                  key={`${semanaIdx}-${diaIdx}`}
                  onClick={() => dia && abrirModal(null, dia)}
                  style={{
                    minHeight: tieneEventos ? 'auto' : 60,
                    padding: tieneEventos ? 12 : 8,
                    borderRadius: 10,
                    background: dia ? '#f9f9fb' : 'transparent',
                    border: tieneEventos ? '2px solid #007AFF' : '1px solid #e5e5e7',
                    cursor: dia ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}
                  onMouseOver={(e) => {
                    if (dia) {
                      e.currentTarget.style.background = tieneEventos ? '#f0f0f0' : '#e8e8ed';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (dia) {
                      e.currentTarget.style.background = tieneEventos ? '#f9f9fb' : '#f5f5f7';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {dia && (
                    <>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#1d1d1f' }}>
                        {dia}
                      </span>
                      {tieneEventos && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {eventosDelDia.slice(0, 2).map(evt => (
                            <div
                              key={evt.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirModal(evt);
                              }}
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                background: '#007AFF',
                                color: '#fff',
                                padding: '4px 6px',
                                borderRadius: 4,
                                cursor: 'pointer',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background = '#0051D5';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background = '#007AFF';
                              }}
                            >
                              {evt.nombre}
                            </div>
                          ))}
                          {eventosDelDia.length > 2 && (
                            <div style={{ fontSize: 10, color: '#007AFF', fontWeight: 600 }}>
                              +{eventosDelDia.length - 2} más
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // Renderizar vista anual simplificada
  const renderVistaAnual = () => {
    return (
      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {meses.map((mes, idx) => {
            const eventosDelMes = getEventosPorMes(anioActual, idx);
            return (
              <div
                key={mes}
                style={{
                  background: '#f5f5f7',
                  borderRadius: 12,
                  padding: 14,
                  border: '1px solid #e5e5e7',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => {
                  setVistaAnual(false);
                  setMesActual(idx);
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#e8e8ed';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#f5f5f7';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', margin: 0, marginBottom: 10 }}>
                  {mes}
                </h3>
                {eventosDelMes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {eventosDelMes.slice(0, 3).map(evento => (
                      <div
                        key={evento.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirModal(evento);
                        }}
                        style={{
                          background: '#fff',
                          padding: '8px 10px',
                          borderRadius: 6,
                          border: '1px solid #e5e5e7',
                          fontSize: 12,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#007AFF';
                          e.currentTarget.style.color = '#fff';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = '#fff';
                          e.currentTarget.style.color = '#1d1d1f';
                        }}
                      >
                        <strong>{evento.dia_mes}:</strong> {evento.nombre}
                      </div>
                    ))}
                    {eventosDelMes.length > 3 && (
                      <div style={{ fontSize: 11, color: '#999', paddingTop: 4, borderTop: '1px solid #e5e5e7' }}>
                        +{eventosDelMes.length - 3} más
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ color: '#999', fontSize: 12, margin: 0 }}>Sin eventos</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7', padding: '40px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Header title="Calendario de Gastos" />

        {/* Botón atrás y controles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
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
            ← Volver
          </button>

          <button
            onClick={() => abrirModal(null)}
            style={{
              background: '#007AFF',
              color: '#fff',
              border: 'none',
              padding: '10px 16px',
              borderRadius: 12,
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#0051D5';
              e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#007AFF';
              e.target.style.boxShadow = 'none';
            }}
          >
            + Nuevo evento
          </button>

          <button
            onClick={() => setVistaAnual(!vistaAnual)}
            style={{
              background: '#fff',
              border: '1px solid #e5e5e7',
              padding: '10px 16px',
              borderRadius: 12,
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 500,
              color: '#1d1d1f',
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
            {vistaAnual ? 'Ver Mes' : 'Ver Año'}
          </button>
        </div>

        {/* Mostrar eventos si hay un formulario abierto */}
        {mostrarModal && editando && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f', marginBottom: 16 }}>
              ✏️ Editando evento
            </h3>
            {/* El formulario estará en el modal, pero mostraremos el preview aquí */}
          </div>
        )}

        {/* Card de eventos encima del calendario */}
        {!vistaAnual && eventosMesActual.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: isMobile ? 16 : 24, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', marginBottom: 24 }}>
            <h3 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 600, color: '#1d1d1f', marginBottom: 16 }}>
              📌 Eventos de {meses[mesActual]}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
              {eventosMesActual.map(evento => (
                <div
                  key={evento.id}
                  style={{
                    background: '#f9f9fb',
                    padding: 16,
                    borderRadius: 12,
                    border: '1px solid #e5e5e7',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#007AFF', marginBottom: 4 }}>
                        {evento.dia_mes} de {meses[mesActual]}
                      </div>
                      <h4 style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f', margin: 0, marginBottom: 4, cursor: 'pointer' }} onClick={() => abrirModal(evento)}>
                        {evento.nombre}
                      </h4>
                      <span style={{ fontSize: 12, color: '#999', background: '#f5f5f7', padding: '4px 8px', borderRadius: 6, display: 'inline-block' }}>
                        {evento.categoria}
                      </span>
                    </div>
                  </div>
                  <div style={{ background: '#fff', padding: 12, borderRadius: 8, marginBottom: 12 }}>
                    <div style={{ fontSize: 13, color: '#86868b', marginBottom: 8 }}>
                      <strong>Monto:</strong> {evento.cantidad_min}€{evento.cantidad_max ? ` - ${evento.cantidad_max}€` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => abrirModal(evento)}
                      style={{
                        flex: 1,
                        background: '#007AFF',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = '#0051D5';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = '#007AFF';
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => manejarEliminarEvento(evento.id)}
                      style={{
                        flex: 1,
                        background: '#fff',
                        color: '#FF3B30',
                        border: '1px solid #FF3B30',
                        padding: '8px 12px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = '#ffebee';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = '#fff';
                      }}
                    >
                      Desactivar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contenedor calendario */}
        <div style={{ background: '#fff', borderRadius: 20, padding: isMobile ? 16 : 32, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
          {!vistaAnual && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <button
                onClick={() => {
                  if (mesActual === 0) {
                    setMesActual(11);
                    setAnioActual(anioActual - 1);
                  } else {
                    setMesActual(mesActual - 1);
                  }
                }}
                style={{
                  background: '#f5f5f7',
                  border: '1px solid #e5e5e7',
                  padding: '8px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#e8e8ed';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#f5f5f7';
                }}
              >
                ← Anterior
              </button>

              <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1d1d1f' }}>
                {meses[mesActual]} {anioActual}
              </h2>

              <button
                onClick={() => {
                  if (mesActual === 11) {
                    setMesActual(0);
                    setAnioActual(anioActual + 1);
                  } else {
                    setMesActual(mesActual + 1);
                  }
                }}
                style={{
                  background: '#f5f5f7',
                  border: '1px solid #e5e5e7',
                  padding: '8px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#e8e8ed';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#f5f5f7';
                }}
              >
                Siguiente →
              </button>
            </div>
          )}

          {vistaAnual && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <button
                onClick={() => setAnioActual(anioActual - 1)}
                style={{
                  background: '#f5f5f7',
                  border: '1px solid #e5e5e7',
                  padding: '8px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#e8e8ed';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#f5f5f7';
                }}
              >
                ← {anioActual - 1}
              </button>

              <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1d1d1f' }}>
                {anioActual}
              </h2>

              <button
                onClick={() => setAnioActual(anioActual + 1)}
                style={{
                  background: '#f5f5f7',
                  border: '1px solid #e5e5e7',
                  padding: '8px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#e8e8ed';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#f5f5f7';
                }}
              >
                {anioActual + 1} →
              </button>
            </div>
          )}

          {!vistaAnual && renderCalendarioMensual()}

          {vistaAnual && renderVistaAnual()}
        </div>
      </div>

      {/* Modal para crear/editar evento */}
      {mostrarModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={cerrarModal}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: 32,
              maxWidth: 500,
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1d1d1f', marginBottom: 24 }}>
              {editando ? '✏️ Editar Evento' : '➕ Nuevo Evento'}
            </h2>

            <form onSubmit={manejarSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Nombre */}
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginBottom: 8 }}>
                  Nombre del evento *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: `1px solid ${errores.nombre ? '#FF3B30' : '#e5e5e7'}`,
                    fontSize: 16,
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Ej: Seguro de la moto"
                />
                {errores.nombre && <span style={{ fontSize: 12, color: '#FF3B30', marginTop: 4 }}>{errores.nombre}</span>}
              </div>

              {/* Día del mes */}
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginBottom: 8 }}>
                  Día del mes *
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dia_mes}
                  onChange={(e) => setFormData({ ...formData, dia_mes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: `1px solid ${errores.dia_mes ? '#FF3B30' : '#e5e5e7'}`,
                    fontSize: 16,
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Ej: 5"
                />
                {errores.dia_mes && <span style={{ fontSize: 12, color: '#FF3B30', marginTop: 4 }}>{errores.dia_mes}</span>}
              </div>

              {/* Cantidad mínima */}
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginBottom: 8 }}>
                  Cantidad mínima (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cantidad_min}
                  onChange={(e) => setFormData({ ...formData, cantidad_min: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: `1px solid ${errores.cantidad_min ? '#FF3B30' : '#e5e5e7'}`,
                    fontSize: 16,
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Ej: 120"
                />
                {errores.cantidad_min && <span style={{ fontSize: 12, color: '#FF3B30', marginTop: 4 }}>{errores.cantidad_min}</span>}
              </div>

              {/* Cantidad máxima */}
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginBottom: 8 }}>
                  Cantidad máxima (€) (opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cantidad_max}
                  onChange={(e) => setFormData({ ...formData, cantidad_max: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: `1px solid ${errores.cantidad_max ? '#FF3B30' : '#e5e5e7'}`,
                    fontSize: 16,
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Ej: 150"
                />
                {errores.cantidad_max && <span style={{ fontSize: 12, color: '#FF3B30', marginTop: 4 }}>{errores.cantidad_max}</span>}
              </div>

              {/* Categoría */}
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginBottom: 8 }}>
                  Categoría *
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1px solid #e5e5e7',
                    fontSize: 16,
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                >
                  {CATEGORIAS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Tipo de recurrencia */}
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginBottom: 8 }}>
                  Recurrencia *
                </label>
                <select
                  value={formData.recurrencia.tipo}
                  onChange={(e) => setFormData({
                    ...formData,
                    recurrencia: { ...formData.recurrencia, tipo: e.target.value }
                  })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1px solid #e5e5e7',
                    fontSize: 16,
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                >
                  {TIPOS_RECURRENCIA.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                  ))}
                </select>
              </div>

              {/* Opciones específicas de recurrencia */}
              {formData.recurrencia.tipo === 'anual' && (
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginBottom: 8 }}>
                    Mes
                  </label>
                  <select
                    value={formData.recurrencia.mes}
                    onChange={(e) => setFormData({
                      ...formData,
                      recurrencia: { ...formData.recurrencia, mes: parseInt(e.target.value) }
                    })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: '1px solid #e5e5e7',
                      fontSize: 16,
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  >
                    {meses.map((mes, idx) => (
                      <option key={idx} value={idx}>{mes}</option>
                    ))}
                  </select>
                </div>
              )}

              {(formData.recurrencia.tipo === 'semestral' || formData.recurrencia.tipo === 'trimestral' || formData.recurrencia.tipo === 'cadaX') && (
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginBottom: 8 }}>
                    Mes de inicio
                  </label>
                  <select
                    value={formData.recurrencia.mesInicio}
                    onChange={(e) => setFormData({
                      ...formData,
                      recurrencia: { ...formData.recurrencia, mesInicio: parseInt(e.target.value) }
                    })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: '1px solid #e5e5e7',
                      fontSize: 16,
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  >
                    {meses.map((mes, idx) => (
                      <option key={idx} value={idx}>{mes}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.recurrencia.tipo === 'cadaX' && (
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginBottom: 8 }}>
                    Cada cuántos meses
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.recurrencia.cadaX}
                    onChange={(e) => setFormData({
                      ...formData,
                      recurrencia: { ...formData.recurrencia, cadaX: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: '1px solid #e5e5e7',
                      fontSize: 16,
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Ej: 3"
                  />
                </div>
              )}

              {formData.recurrencia.tipo === 'unica' && (
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginBottom: 8 }}>
                    Mes y Año (YYYY-MM)
                  </label>
                  <input
                    type="month"
                    value={formData.recurrencia.mesAno}
                    onChange={(e) => setFormData({
                      ...formData,
                      recurrencia: { ...formData.recurrencia, mesAno: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: '1px solid #e5e5e7',
                      fontSize: 16,
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {/* Botones */}
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={cerrarModal}
                  style={{
                    flex: 1,
                    background: '#f5f5f7',
                    border: 'none',
                    padding: '12px 16px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#1d1d1f',
                    transition: 'all 0.2s'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: '#007AFF',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 16px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    fontSize: 16,
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  {editando ? 'Guardar Cambios' : 'Crear Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendario;
