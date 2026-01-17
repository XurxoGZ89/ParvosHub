import React, { useState, useEffect, useCallback } from 'react';
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

  useEffect(() => {
    cargarComidasCongeladas();
    cargarComidasPlanificadas();
    
    // Limpiar comidas tachadas de semanas pasadas
    axios.delete(`${API_URL}/comidas-congeladas/limpiar/pasadas`).catch(console.error);
  }, [cargarComidasCongeladas, cargarComidasPlanificadas]);

  // Calcular fechas de la quincena (2 semanas)
  const getQuincenaDates = () => {
    const hoy = new Date();
    const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay();
    
    // Calcular el lunes de la semana actual
    const lunesActual = new Date(hoy);
    lunesActual.setDate(hoy.getDate() - diaSemana + 1);
    
    // Ajustar según semanaActual
    lunesActual.setDate(lunesActual.getDate() + (semanaActual * 14));
    
    const fechas = [];
    for (let i = 0; i < 14; i++) {
      const fecha = new Date(lunesActual);
      fecha.setDate(lunesActual.getDate() + i);
      fechas.push(fecha);
    }
    
    return fechas;
  };

  const fechasQuincena = getQuincenaDates();
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

  const handleDrop = async (e, fecha, tipoComida) => {
    e.preventDefault();
    setDropTarget(null);

    if (!draggedItem) return;

    const fechaStr = fecha.toISOString().split('T')[0];

    if (draggedItem.source === 'inventario') {
      // Arrastrar desde inventario al calendario
      const mensaje = `${draggedItem.item.nombre}\n\n${t('esPara')} ${tipoComida === 'comida' ? t('comida') : t('cena')}?`;
      const confirmar = window.confirm(mensaje);
      
      if (!confirmar) {
        // Si cancela, preguntamos si quiere el otro tipo
        const otroTipo = tipoComida === 'comida' ? 'cena' : 'comida';
        const otroMensaje = `${t('entoncesEsPara')} ${otroTipo === 'comida' ? t('comida') : t('cena')}?`;
        const confirmarOtro = window.confirm(otroMensaje);
        
        if (!confirmarOtro) {
          setDraggedItem(null);
          return;
        }
        tipoComida = otroTipo;
      }

      try {
        // Crear comida planificada
        await axios.post(`${API_URL}/comidas-planificadas`, {
          comida_id: draggedItem.item.id,
          comida_nombre: draggedItem.item.nombre,
          fecha: fechaStr,
          tipo_comida: tipoComida
        });

        // Tachar comida en inventario
        await axios.put(`${API_URL}/comidas-congeladas/${draggedItem.item.id}`, {
          tachada: true
        });

        cargarComidasCongeladas();
        cargarComidasPlanificadas();
      } catch (err) {
        alert(t('errorPlanificarComida'));
      }
    } else if (draggedItem.source === 'calendario') {
      // Mover dentro del calendario
      try {
        await axios.put(`${API_URL}/comidas-planificadas/${draggedItem.item.id}`, {
          fecha: fechaStr,
          tipo_comida: tipoComida
        });
        cargarComidasPlanificadas();
      } catch (err) {
        alert(t('errorMoverComida'));
      }
    }

    setDraggedItem(null);
  };

  // Eliminar comida planificada
  const handleEliminarPlanificada = async (comida) => {
    const opciones = [
      `1 - ${t('eliminarCompletamente')}`,
      `2 - ${t('volverAlListado')}`
    ].join('\n');

    const opcion = window.prompt(`${t('queHacerConComida')}:\n\n${opciones}`, '2');

    if (!opcion || (opcion !== '1' && opcion !== '2')) return;

    try {
      await axios.delete(`${API_URL}/comidas-planificadas/${comida.id}`);

      if (opcion === '2' && comida.comida_id) {
        // Volver al listado - destachar
        await axios.put(`${API_URL}/comidas-congeladas/${comida.comida_id}`, {
          tachada: false
        });
      }

      cargarComidasCongeladas();
      cargarComidasPlanificadas();
    } catch (err) {
      alert(t('errorEliminarPlanificada'));
    }
  };

  // Obtener comida planificada para una fecha y tipo
  const getComidaPlanificada = (fecha, tipoComida) => {
    const fechaStr = fecha.toISOString().split('T')[0];
    return comidasPlanificadas.find(
      c => c.fecha === fechaStr && c.tipo_comida === tipoComida
    );
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f5f7', 
      padding: '40px 20px', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
    }}>
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
              ❄️ {t('comidasCongeladas')}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {comidasCongeladas.map((comida) => (
                <div key={comida.id}>
                  <div
                    draggable={!comida.tachada}
                    onDragStart={(e) => handleDragStart(e, comida, 'inventario')}
                    onClick={() => setComidaExpandida(comidaExpandida === comida.id ? null : comida.id)}
                    style={{
                      padding: '10px 12px',
                      background: comida.tachada ? '#f5f5f7' : '#fff',
                      border: '1px solid #e5e5e7',
                      borderRadius: 8,
                      cursor: comida.tachada ? 'default' : 'grab',
                      textDecoration: comida.tachada ? 'line-through' : 'none',
                      color: comida.tachada ? '#999' : '#1d1d1f',
                      fontSize: 14,
                      fontWeight: 500,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      if (!comida.tachada) e.currentTarget.style.background = '#f5f5f7';
                    }}
                    onMouseOut={(e) => {
                      if (!comida.tachada) e.currentTarget.style.background = '#fff';
                    }}
                  >
                    <span>{comida.nombre}</span>
                    {!comida.tachada && (
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
                          color: '#ff3b30'
                        }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>

                  {/* Notas expandibles */}
                  {comidaExpandida === comida.id && !comida.tachada && (
                    <div style={{
                      padding: '10px',
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
                          minHeight: 60,
                          padding: 8,
                          borderRadius: 6,
                          border: '1px solid #e5e5e7',
                          fontSize: 13,
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          boxSizing: 'border-box'
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
              gap: 16, 
              marginBottom: 24 
            }}>
              <button
                onClick={() => setSemanaActual(prev => prev - 1)}
                style={{
                  background: '#f5f5f7',
                  border: 'none',
                  fontSize: 16,
                  cursor: 'pointer',
                  padding: '8px 16px',
                  color: '#007AFF',
                  borderRadius: 8,
                  fontWeight: 600,
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#efefef'}
                onMouseOut={(e) => e.target.style.background = '#f5f5f7'}
              >
                ◀ {t('anterior')}
              </button>

              <div style={{ 
                fontSize: 16, 
                fontWeight: 600, 
                color: '#1d1d1f',
                textAlign: 'center',
                minWidth: 200
              }}>
                {fechasQuincena[0].getDate()}/{fechasQuincena[0].getMonth() + 1} - {fechasQuincena[13].getDate()}/{fechasQuincena[13].getMonth() + 1}
              </div>

              <button
                onClick={() => setSemanaActual(prev => prev + 1)}
                style={{
                  background: '#f5f5f7',
                  border: 'none',
                  fontSize: 16,
                  cursor: 'pointer',
                  padding: '8px 16px',
                  color: '#007AFF',
                  borderRadius: 8,
                  fontWeight: 600,
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#efefef'}
                onMouseOut={(e) => e.target.style.background = '#f5f5f7'}
              >
                {t('siguiente')} ▶
              </button>
            </div>

            {/* Calendario */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                minWidth: isMobile ? 600 : 'auto'
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
                        padding: '10px 8px',
                        fontWeight: 600,
                        fontSize: 13,
                        borderBottom: '2px solid #e5e5e7',
                        textAlign: 'center',
                        minWidth: 80,
                        background: fecha.getDay() === 0 || fecha.getDay() === 6 ? '#f9f9f9' : '#f1f3f4'
                      }}>
                        <div>{diasSemana[fecha.getDay() === 0 ? 6 : fecha.getDay() - 1]}</div>
                        <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
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
                      padding: '8px',
                      fontWeight: 600,
                      fontSize: 12,
                      background: '#fff3cd',
                      borderRight: '1px solid #e5e5e7',
                      textAlign: 'center',
                      color: '#856404'
                    }}>
                      🍽️<br/>{t('comida')}
                    </td>
                    {fechasQuincena.map((fecha, idx) => {
                      const comida = getComidaPlanificada(fecha, 'comida');
                      const isDropTarget = dropTarget?.fecha?.getTime() === fecha.getTime() && dropTarget?.tipoComida === 'comida';
                      
                      return (
                        <td
                          key={idx}
                          onDragOver={handleDragOver}
                          onDragEnter={() => handleDragEnter(fecha, 'comida')}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, fecha, 'comida')}
                          style={{
                            padding: 8,
                            minHeight: 60,
                            border: '1px solid #e5e5e7',
                            background: isDropTarget ? '#e3f2fd' : (fecha.getDay() === 0 || fecha.getDay() === 6 ? '#fafafa' : '#fff'),
                            transition: 'background 0.2s',
                            verticalAlign: 'top'
                          }}
                        >
                          {comida && (
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, comida, 'calendario')}
                              style={{
                                background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
                                padding: '6px 8px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 500,
                                cursor: 'grab',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {comida.comida_nombre}
                              </span>
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
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Fila CENA */}
                  <tr>
                    <td style={{
                      padding: '8px',
                      fontWeight: 600,
                      fontSize: 12,
                      background: '#e3f2fd',
                      borderRight: '1px solid #e5e5e7',
                      textAlign: 'center',
                      color: '#1565c0'
                    }}>
                      🌙<br/>{t('cena')}
                    </td>
                    {fechasQuincena.map((fecha, idx) => {
                      const comida = getComidaPlanificada(fecha, 'cena');
                      const isDropTarget = dropTarget?.fecha?.getTime() === fecha.getTime() && dropTarget?.tipoComida === 'cena';
                      
                      return (
                        <td
                          key={idx}
                          onDragOver={handleDragOver}
                          onDragEnter={() => handleDragEnter(fecha, 'cena')}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, fecha, 'cena')}
                          style={{
                            padding: 8,
                            minHeight: 60,
                            border: '1px solid #e5e5e7',
                            background: isDropTarget ? '#e3f2fd' : (fecha.getDay() === 0 || fecha.getDay() === 6 ? '#fafafa' : '#fff'),
                            transition: 'background 0.2s',
                            verticalAlign: 'top'
                          }}
                        >
                          {comida && (
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, comida, 'calendario')}
                              style={{
                                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                                padding: '6px 8px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 500,
                                cursor: 'grab',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {comida.comida_nombre}
                              </span>
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
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Instrucciones */}
            <div style={{
              marginTop: 20,
              padding: 16,
              background: '#f9f9f9',
              borderRadius: 12,
              fontSize: 13,
              color: '#666'
            }}>
              <strong>💡 {t('instrucciones')}:</strong>
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                <li>{t('instruccion1')}</li>
                <li>{t('instruccion2')}</li>
                <li>{t('instruccion3')}</li>
                <li>{t('instruccion4')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarioComidas;
