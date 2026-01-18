import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useCalendarEvents } from '../contexts/CalendarEventsContext';
import Header from './Header';
import bbvaLogo from '../assets/BBVA_2019.svg.png';
import imaginLogoWebp from '../assets/imagin.webp';

const cuentas = ['Imagin', 'BBVA'];
const mesKeys = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Función para formatear moneda al formato europeo
const formatearMoneda = (numero) => {
  const formateado = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numero);
  
  // Si termina en ",00", quitar los ceros
  if (formateado.endsWith(',00')) {
    return formateado.slice(0, -3);
  }
  return formateado;
};

const Home = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { getEventosPorMes } = useCalendarEvents();
  const [operaciones, setOperaciones] = useState([]);
  const [mesActual] = useState(new Date().getMonth());
  const [anioActual] = useState(new Date().getFullYear());
  const [mesCalendario, setMesCalendario] = useState(new Date().getMonth());
  const [anioCalendario, setAnioCalendario] = useState(new Date().getFullYear());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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

  useEffect(() => {
    cargarOperaciones();
  }, [cargarOperaciones]);

  // Detectar cambios de tamaño de ventana para responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calcular situación global ACUMULADA del mes anterior
  const operacionesAnteriores = operaciones.filter(op => {
    if (!op.fecha || op.tipo === 'hucha') return false;
    const fecha = new Date(op.fecha);
    const anioOp = fecha.getFullYear();
    const mesOp = fecha.getMonth();
    
    return (anioOp < anioActual) || (anioOp === anioActual && mesOp < mesActual);
  });
  
  const ingresosTotalesAnteriores = operacionesAnteriores
    .filter(op => op.tipo === 'ingreso' || op.tipo === 'retirada-hucha')
    .reduce((acc, op) => acc + Number(op.cantidad), 0);
  
  const gastosTotalesAnteriores = operacionesAnteriores
    .filter(op => op.tipo === 'gasto')
    .reduce((acc, op) => acc + Number(op.cantidad), 0);
  
  const situacionMesAnterior = ingresosTotalesAnteriores - gastosTotalesAnteriores;

  // Operaciones del mes actual
  const operacionesMes = operaciones.filter(op => {
    if (!op.fecha) return false;
    const fecha = new Date(op.fecha);
    return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
  });

  const ingresosTotales = operacionesMes
    .filter(op => op.tipo === 'ingreso' || op.tipo === 'retirada-hucha')
    .reduce((acc, op) => acc + Number(op.cantidad), 0);

  const gastosTotales = operacionesMes
    .filter(op => op.tipo === 'gasto' && op.tipo !== 'hucha')
    .reduce((acc, op) => acc + Number(op.cantidad), 0);

  const situacionGlobal = situacionMesAnterior + ingresosTotales - gastosTotales;

  // Calcular saldo por cuenta
  const saldoMesAnteriorPorCuenta = cuentas.reduce((acc, cuenta) => {
    const operacionesMesAnterior = operaciones.filter(op => {
      if (!op.fecha) return false;
      const fecha = new Date(op.fecha);
      const anioOp = fecha.getFullYear();
      const mesOp = fecha.getMonth();
      return ((anioOp < anioActual) || (anioOp === anioActual && mesOp < mesActual)) && op.tipo !== 'hucha' && op.cuenta === cuenta;
    });
    
    acc[cuenta] = operacionesMesAnterior.reduce((saldo, op) => {
      if (op.tipo === 'ingreso' || op.tipo === 'retirada-hucha') return saldo + Number(op.cantidad);
      if (op.tipo === 'gasto') return saldo - Number(op.cantidad);
      return saldo;
    }, 0);
    return acc;
  }, {});

  const situacionPorCuenta = cuentas.map(cuenta => ({
    cuenta,
    saldo: (saldoMesAnteriorPorCuenta[cuenta] || 0) + operacionesMes
      .filter(op => op.tipo !== 'hucha' && op.cuenta === cuenta)
      .reduce((acc, op) => {
        if (op.tipo === 'ingreso' || op.tipo === 'retirada-hucha') return acc + Number(op.cantidad);
        if (op.tipo === 'gasto') return acc - Number(op.cantidad);
        return acc;
      }, 0)
  }));



  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7', padding: '40px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Header title={t('parvosHub')} subtitle={t('homeSubtitle')} />

        {/* Navegación con iconos pequeños */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 20, 
          marginBottom: 40, 
          flexWrap: 'wrap',
          background: '#fff',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          border: '1px solid #f0f0f0'
        }}>
          {/* Registro de Gastos */}
          <div
            onClick={() => onNavigate('gastos')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'all 0.3s',
              padding: 12
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div style={{ fontSize: '1.8rem' }}>💰</div>
            <div style={{ fontSize: '0.75rem', textAlign: 'center', color: '#1d1d1f', fontWeight: 500, maxWidth: 70 }}>
              {t('registroDeGastos')}
            </div>
          </div>

          {/* Resumen del Año */}
          <div
            onClick={() => onNavigate('resumen')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'all 0.3s',
              padding: 12
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div style={{ fontSize: '1.8rem' }}>📊</div>
            <div style={{ fontSize: '0.75rem', textAlign: 'center', color: '#1d1d1f', fontWeight: 500, maxWidth: 70 }}>
              {t('resumenAnual')}
            </div>
          </div>

          {/* Calendario de Gastos */}
          <div
            onClick={() => onNavigate('calendario')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'all 0.3s',
              padding: 12
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div style={{ fontSize: '1.8rem' }}>📅</div>
            <div style={{ fontSize: '0.75rem', textAlign: 'center', color: '#1d1d1f', fontWeight: 500, maxWidth: 70 }}>
              {t('calendarioGastos')}
            </div>
          </div>

          {/* Calendario de Comidas */}
          <div
            onClick={() => onNavigate('calendariocomidas')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'all 0.3s',
              padding: 12
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div style={{ fontSize: '1.8rem' }}>🍽️</div>
            <div style={{ fontSize: '0.75rem', textAlign: 'center', color: '#1d1d1f', fontWeight: 500, maxWidth: 70 }}>
              {t('calendarioComidas')}
            </div>
          </div>

          {/* Calendario de Comidas V2 - NUEVO DISEÑO */}
          <div
            onClick={() => onNavigate('calendariocomidasv2')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'all 0.3s',
              padding: 12,
              position: 'relative'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div style={{ fontSize: '1.8rem' }}>🍽️✨</div>
            <div style={{ fontSize: '0.75rem', textAlign: 'center', color: '#1d1d1f', fontWeight: 500, maxWidth: 80 }}>
              Comidas V2
            </div>
            <span style={{
              position: 'absolute',
              top: 5,
              right: 5,
              background: 'linear-gradient(90deg, #007aff, #00c6fb)',
              color: '#fff',
              fontSize: '0.5rem',
              padding: '2px 4px',
              borderRadius: 4,
              fontWeight: 700
            }}>
              NUEVO
            </span>
          </div>

          {/* Receteario */}
          <div
            onClick={() => onNavigate('receteario')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'all 0.3s',
              padding: 12,
              opacity: 0.7
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.opacity = '1';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.opacity = '0.7';
            }}
          >
            <div style={{ fontSize: '1.8rem' }}>👨‍🍳</div>
            <div style={{ fontSize: '0.75rem', textAlign: 'center', color: '#1d1d1f', fontWeight: 500, maxWidth: 70 }}>
              {t('receteario')}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#999' }}>{t('proximamente')}</div>
          </div>

          {/* Lista de la Compra */}
          <div
            onClick={() => onNavigate('listacompra')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'all 0.3s',
              padding: 12,
              opacity: 0.7
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.opacity = '1';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.opacity = '0.7';
            }}
          >
            <div style={{ fontSize: '1.8rem' }}>🛒</div>
            <div style={{ fontSize: '0.75rem', textAlign: 'center', color: '#1d1d1f', fontWeight: 500, maxWidth: 70 }}>
              {t('listaCompra')}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#999' }}>{t('proximamente')}</div>
          </div>
        </div>

        {/* Grid de tarjetas: Situación Global + Calendario */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24, marginBottom: 32 }}>
          {/* Card Situación Global */}
          <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 16, fontWeight: 700 }}>{t('situacionGlobal')}</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: situacionGlobal >= 0 ? '#007aff' : '#ff6961', marginBottom: 20 }}>{formatearMoneda(situacionGlobal)} €</div>
            
            {/* Cuentas */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e5e5e7' }}>
              {situacionPorCuenta.map(c => {
                const logo = c.cuenta.toLowerCase() === 'bbva' ? bbvaLogo : imaginLogoWebp;
                return (
                  <div key={c.cuenta} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px', background: '#f5f5f7', borderRadius: 10 }}>
                    <img src={logo} alt={c.cuenta} style={{ height: 24, objectFit: 'contain' }} />
                    <div style={{ fontSize: 12, color: '#1d1d1f', fontWeight: 700 }}>{formatearMoneda(c.saldo)} €</div>
                  </div>
                );
              })}
            </div>
            
            {/* Ingresos y Gastos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: '10px', background: '#e8f5e9', borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: '#2e7d32', fontWeight: 600, marginBottom: 4 }}>{t('ingresos')}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>+{formatearMoneda(ingresosTotales)} €</div>
              </div>
              <div style={{ padding: '10px', background: '#ffebee', borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: '#b71c1c', fontWeight: 600, marginBottom: 4 }}>{t('gastos')}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#ef4444' }}>-{formatearMoneda(gastosTotales)} €</div>
              </div>
            </div>
          </div>

          {/* Card Calendario con Eventos */}
          <div 
            style={{ 
              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', 
              borderRadius: 20, 
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)', 
              border: '1px solid #f0f0f0', 
              padding: isMobile ? 20 : 24
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: '#1565c0', margin: 0 }}>📅 {t('calendarioGastos')}</h2>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => {
                    if (mesCalendario === 0) {
                      setMesCalendario(11);
                      if (anioCalendario > 2025) {
                        setAnioCalendario(anioCalendario - 1);
                      }
                    } else {
                      setMesCalendario(mesCalendario - 1);
                    }
                  }}
                  style={{
                    background: '#fff',
                    border: '1px solid #1565c0',
                    padding: '6px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#1565c0'
                  }}
                >
                  ←
                </button>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1565c0', minWidth: 140, textAlign: 'center' }}>
                  {t(mesKeys[mesCalendario])} {anioCalendario}
                </div>
                <button
                  onClick={() => {
                    if (mesCalendario === 11) {
                      setMesCalendario(0);
                      if (anioCalendario < 2030) {
                        setAnioCalendario(anioCalendario + 1);
                      }
                    } else {
                      setMesCalendario(mesCalendario + 1);
                    }
                  }}
                  style={{
                    background: '#fff',
                    border: '1px solid #1565c0',
                    padding: '6px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#1565c0'
                  }}
                >
                  →
                </button>
              </div>
            </div>
            
            {getEventosPorMes(anioCalendario, mesCalendario).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {getEventosPorMes(anioCalendario, mesCalendario).slice(0, 3).map(evento => (
                  <div
                    key={evento.id}
                    onClick={() => onNavigate('calendario', { mes: mesCalendario, anio: anioCalendario, scrollToEventos: true })}
                    style={{
                      background: '#fff',
                      padding: 12,
                      borderRadius: 12,
                      border: '1px solid #1565c0',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1565c0', marginBottom: 4 }}>
                      {evento.dia_mes} de {t(mesKeys[mesCalendario])}
                    </div>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', margin: 0, marginBottom: 6 }}>
                      {evento.nombre}
                    </h4>
                    <div style={{ fontSize: 12, color: '#86868b' }}>
                      {evento.cantidad_min}€{evento.cantidad_max ? ` - ${evento.cantidad_max}€` : ''}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => onNavigate('calendario', { mes: mesCalendario, anio: anioCalendario })}
                  style={{
                    width: '100%',
                    background: '#1565c0',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    marginTop: 8
                  }}
                >
                  {t('verTodos')}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>{t('sinEventosEstesMes')}</p>
                <button
                  onClick={() => onNavigate('calendario', { mes: mesCalendario, anio: anioCalendario, newEvent: true })}
                  style={{
                    background: '#1565c0',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  Añadir Evento
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
