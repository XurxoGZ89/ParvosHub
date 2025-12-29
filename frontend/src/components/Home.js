import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { useCalendarEvents } from '../contexts/CalendarEventsContext';
import Header from './Header';

const mesKeys = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Helper para convertir categoría español a clave de traducción
const categoriaToKey = {
  'Vacaciones': 'vacaciones',
  'Ocio': 'ocio',
  'Hogar': 'hogar',
  'Vehículos': 'vehiculos',
  'Extra': 'extra',
  'Alimentación': 'alimentacion'
};

const colorsPorCategoria = {
  'Vacaciones': '#FF9500',     // Naranja Apple
  'Ocio': '#FF3B30',           // Rojo Apple
  'Hogar': '#34C759',          // Verde Apple
  'Vehículos': '#007AFF',      // Azul Apple
  'Extra': '#AF52DE',          // Púrpura Apple
  'Alimentación': '#FFB400'    // Amarillo Apple
};

const Home = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { getEventosPorMes } = useCalendarEvents();
  const [operaciones, setOperaciones] = useState([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [mesCalendario, setMesCalendario] = useState(new Date().getMonth());
  const [anioCalendario, setAnioCalendario] = useState(new Date().getFullYear());
  const [datosMensuales, setDatosMensuales] = useState([]);

  const cargarOperaciones = useCallback(async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const res = await axios.get(`${API_URL}/operaciones`);
      const filtradas = res.data.filter(op => {
        if (!op.fecha) return false;
        const fecha = new Date(op.fecha);
        return fecha.getFullYear() >= 2025;
      });
      setOperaciones(filtradas);
    } catch (err) {
      console.error('Error al cargar operaciones:', err);
    }
  }, []);

  const procesarDatos = useCallback(() => {
    const datos = Array(12).fill(null).map((_, mesIndex) => ({
      mes: mesIndex + 1,
      'Vacaciones': 0,
      'Ocio': 0,
      'Hogar': 0,
      'Vehículos': 0,
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

    setDatosMensuales(datos);
  }, [operaciones, anioSeleccionado]);

  useEffect(() => {
    cargarOperaciones();
  }, [cargarOperaciones]);

  useEffect(() => {
    procesarDatos();
  }, [procesarDatos]);

  const aniosDisponibles = Array.from(
    new Set(
      operaciones
        .filter(op => op.fecha)
        .map(op => new Date(op.fecha).getFullYear())
    )
  ).sort((a, b) => b - a);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7', padding: '20px 20px 40px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Header title={t('parvosHub')} subtitle={t('homeSubtitle')} />

        {/* Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
          {/* Card Gastos */}
          <div
            onClick={() => onNavigate('gastos')}
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '20px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              border: '1px solid #f0f0f0'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>💰</div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, marginBottom: 6, color: '#1d1d1f' }}>{t('registro')}</h2>
            <p style={{ fontSize: '0.8rem', color: '#86868b', margin: 0, lineHeight: 1.4 }}>{t('registroDesc')}</p>
          </div>

          {/* Card Estadísticas */}
          <div
            onClick={() => onNavigate('resumen')}
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '20px 16px',
              textAlign: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              cursor: 'pointer',
              border: '1px solid #f0f0f0'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>📊</div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, marginBottom: 6, color: '#1d1d1f' }}>{t('resumen')}</h2>
            <p style={{ fontSize: '0.8rem', color: '#86868b', margin: 0, lineHeight: 1.4 }}>{t('resumenDesc')}</p>
          </div>

          {/* Card Presupuestos (Future) */}
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '20px 16px',
              textAlign: 'center',
              cursor: 'not-allowed',
              opacity: 0.6,
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              border: '1px solid #f0f0f0'
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>📋</div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, marginBottom: 6, color: '#1d1d1f' }}>{t('presupuestos')}</h2>
            <p style={{ fontSize: '0.8rem', color: '#86868b', margin: 0, lineHeight: 1.4 }}>{t('proximamente')}</p>
          </div>

          {/* Card Calendario */}
          <div
            onClick={() => onNavigate('calendario')}
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '20px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              border: '1px solid #f0f0f0'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>📅</div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, marginBottom: 6, color: '#1d1d1f' }}>Calendario</h2>
            <p style={{ fontSize: '0.8rem', color: '#86868b', margin: 0, lineHeight: 1.4 }}>Eventos y gastos recurrentes</p>
          </div>
        </div>

        {/* Card de Próximos Eventos del Calendario */}
        {getEventosPorMes(anioCalendario, mesCalendario).length > 0 && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', marginBottom: 32, marginTop: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1d1d1f', margin: 0 }}>📌 Próximos Eventos</h2>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => {
                    if (mesCalendario === 0) {
                      setMesCalendario(11);
                      setAnioCalendario(anioCalendario - 1);
                    } else {
                      setMesCalendario(mesCalendario - 1);
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
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => {
                    if (mesCalendario === 11) {
                      setMesCalendario(0);
                      setAnioCalendario(anioCalendario + 1);
                    } else {
                      setMesCalendario(mesCalendario + 1);
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
                >
                  Siguiente →
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
              {getEventosPorMes(anioCalendario, mesCalendario).slice(0, 4).map(evento => (
                <div
                  key={evento.id}
                  onClick={() => onNavigate('calendario')}
                  style={{
                    background: '#f9f9fb',
                    padding: 16,
                    borderRadius: 12,
                    border: '1px solid #e5e5e7',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#007AFF', marginBottom: 4 }}>
                    {evento.dia_mes} de {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][mesCalendario]}
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f', margin: 0, marginBottom: 8 }}>
                    {evento.nombre}
                  </h4>
                  <span style={{ fontSize: 12, color: '#999', background: '#f5f5f7', padding: '4px 8px', borderRadius: 6, display: 'inline-block', marginBottom: 8 }}>
                    {evento.categoria}
                  </span>
                  <div style={{ fontSize: 13, color: '#86868b', marginTop: 8 }}>
                    <strong>Monto:</strong> {evento.cantidad_min}€{evento.cantidad_max ? ` - ${evento.cantidad_max}€` : ''}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => onNavigate('calendario')}
              style={{
                width: '100%',
                marginTop: 16,
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
              Ver Calendario Completo
            </button>
          </div>
        )}

        {/* Gráfico de Resumen Anual */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 40, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#1d1d1f' }}>📈 {t('resumenDelAno')}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button 
                onClick={() => {
                  const currentIndex = aniosDisponibles.indexOf(anioSeleccionado);
                  if (currentIndex < aniosDisponibles.length - 1) {
                    setAnioSeleccionado(aniosDisponibles[currentIndex + 1]);
                  }
                }}
                style={{ background: '#f5f5f7', border: 'none', fontSize: 16, cursor: 'pointer', padding: '8px 12px', color: '#007aff', borderRadius: 8, fontWeight: 600, transition: 'background 0.2s' }}
                onMouseOver={(e) => e.target.style.background = '#efefef'}
                onMouseOut={(e) => e.target.style.background = '#f5f5f7'}
              >
                ◀
              </button>
              <select 
                value={anioSeleccionado} 
                onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
                style={{ 
                  fontSize: 15, 
                  padding: '8px 12px', 
                  borderRadius: 8, 
                  border: '1px solid #e5e5e7',
                  background: '#fff',
                  cursor: 'pointer',
                  color: '#1d1d1f',
                  fontWeight: 500
                }}
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
                style={{ background: '#f5f5f7', border: 'none', fontSize: 16, cursor: 'pointer', padding: '8px 12px', color: '#007aff', borderRadius: 8, fontWeight: 600, transition: 'background 0.2s' }}
                onMouseOver={(e) => e.target.style.background = '#efefef'}
                onMouseOut={(e) => e.target.style.background = '#f5f5f7'}
              >
                ▶
              </button>
            </div>
          </div>

          {datosMensuales.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart
                  data={datosMensuales.map(d => ({
                    ...d,
                    mes: `${t(mesKeys[d.mes - 1]).substring(0, 3)}`
                  }))}
                  margin={{ top: 20, right: 30, bottom: 20, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 13, fill: '#666' }} />
                  <YAxis tick={{ fontSize: 13, fill: '#666' }} />
                  <Tooltip formatter={v => `${v.toFixed(2)} €`} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <Bar dataKey="Vacaciones" stackId="a" fill={colorsPorCategoria['Vacaciones']} radius={[8, 8, 0, 0]} name={t('vacaciones')} />
                  <Bar dataKey="Ocio" stackId="a" fill={colorsPorCategoria['Ocio']} name={t('ocio')} />
                  <Bar dataKey="Hogar" stackId="a" fill={colorsPorCategoria['Hogar']} name={t('hogar')} />
                  <Bar dataKey="Vehículos" stackId="a" fill={colorsPorCategoria['Vehículos']} name={t('vehiculos')} />
                  <Bar dataKey="Extra" stackId="a" fill={colorsPorCategoria['Extra']} name={t('extra')} />
                  <Bar dataKey="Alimentación" stackId="a" fill={colorsPorCategoria['Alimentación']} name={t('alimentacion')} />
                </BarChart>
              </ResponsiveContainer>

              {/* Resumen de totales */}
              <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 16, marginTop: 40 }}>
                {['Vacaciones', 'Ocio', 'Hogar', 'Vehículos', 'Extra', 'Alimentación'].map(categoria => {
                  const total = datosMensuales.reduce((sum, mes) => sum + mes[categoria], 0);
                  return (
                    <div key={categoria} style={{ background: '#f5f5f7', borderRadius: 16, padding: 20, textAlign: 'center', borderLeft: `3px solid ${colorsPorCategoria[categoria]}`, transition: 'all 0.3s' }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#efefef';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#f5f5f7';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ fontSize: 13, color: '#666', marginBottom: 10, fontWeight: 600, letterSpacing: '0.3px' }}>{t(categoriaToKey[categoria])}</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: colorsPorCategoria[categoria] }}>{total.toFixed(2)} €</div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
              <p style={{ fontSize: '1rem', margin: 0 }}>Sin datos disponibles para este año</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
