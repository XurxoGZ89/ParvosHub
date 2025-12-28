import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import Header from './Header';

const mesKeys = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const categorias = ['Vacaciones', 'Ocio', 'Hogar', 'Vehículos', 'Extra', 'Alimentación'];

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

const ResumenAnual = ({ onBack }) => {
  const { t } = useLanguage();
  const [operaciones, setOperaciones] = useState([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [datosTabulares, setDatosTabulares] = useState([]);
  const [aniosDisponibles, setAniosDisponibles] = useState([]);

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

      // Obtener años disponibles
      const anios = Array.from(
        new Set(
          filtradas
            .filter(op => op.fecha)
            .map(op => new Date(op.fecha).getFullYear())
        )
      ).sort((a, b) => b - a);
      setAniosDisponibles(anios);
    } catch (err) {
      console.error(t('errorCargarOperaciones') + ':', err);
    }
  }, [t]);

  useEffect(() => {
    cargarOperaciones();
  }, [cargarOperaciones]);

  const procesarDatos = useCallback(() => {
    const datos = mesKeys.map((mesKey, mesIndex) => ({
      mes: mesKey,
      mesNum: mesIndex + 1,
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

    setDatosTabulares(datos);
  }, [operaciones, anioSeleccionado]);

  useEffect(() => {
    cargarOperaciones();
  }, [cargarOperaciones]);

  useEffect(() => {
    procesarDatos();
  }, [procesarDatos]);

  // Calcular totales por columna
  const totalesPorCategoria = categorias.reduce((acc, cat) => {
    acc[cat] = datosTabulares.reduce((sum, mes) => sum + (Number(mes[cat]) || 0), 0);
    return acc;
  }, {});

  const totalIngresos = datosTabulares.reduce((sum, mes) => sum + (Number(mes['ingreso']) || 0), 0);
  const totalGastos = datosTabulares.reduce((sum, mes) => sum + (Number(mes['Total']) || 0), 0);
  const diferencia = totalIngresos - totalGastos;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7', padding: '40px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header con Fecha/Hora e Idioma */}
        <Header title={t('resumenDelAno')} />

        {/* Botón atrás */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40, justifyContent: 'space-between', flexWrap: 'wrap' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              onClick={() => {
                const currentIndex = aniosDisponibles.indexOf(anioSeleccionado);
                if (currentIndex < aniosDisponibles.length - 1) {
                  setAnioSeleccionado(aniosDisponibles[currentIndex + 1]);
                }
              }}
              style={{ background: '#f5f5f7', border: 'none', fontSize: 16, cursor: 'pointer', padding: '8px 12px', color: '#007AFF', borderRadius: 8, fontWeight: 600, transition: 'background 0.2s' }}
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
              style={{ background: '#f5f5f7', border: 'none', fontSize: 16, cursor: 'pointer', padding: '8px 12px', color: '#007AFF', borderRadius: 8, fontWeight: 600, transition: 'background 0.2s' }}
              onMouseOver={(e) => e.target.style.background = '#efefef'}
              onMouseOut={(e) => e.target.style.background = '#f5f5f7'}
            >
              ▶
            </button>
          </div>
        </div>

        {/* Tabla de datos anuales */}
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', overflowX: 'auto', marginBottom: 60 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 1000 }}>
            <thead>
              <tr style={{ background: '#f5f5f7' }}>
                <th style={{ padding: '16px 12px', borderBottom: '1px solid #e5e5e7', fontWeight: 600, textAlign: 'left', color: '#1d1d1f', fontSize: 13 }}>MES</th>
                {categorias.map(cat => (
                  <th 
                    key={cat}
                    style={{ 
                      padding: '16px 12px', 
                      borderBottom: '1px solid #e5e5e7', 
                      fontWeight: 600, 
                      textAlign: 'center',
                      color: '#1d1d1f',
                      fontSize: 13
                    }}
                  >
                    {t(categoriaToKey[cat])}
                  </th>
                ))}
                <th style={{ padding: '16px 12px', borderBottom: '1px solid #e5e5e7', fontWeight: 600, textAlign: 'center', color: '#1d1d1f', fontSize: 13 }}>TOTAL</th>
                <th style={{ padding: '16px 12px', borderBottom: '1px solid #e5e5e7', fontWeight: 600, textAlign: 'center', color: '#1d1d1f', fontSize: 13 }}>SALDO</th>
              </tr>
            </thead>
            <tbody>
              {datosTabulares.map((mes, idx) => (
                <tr key={mes.mes} style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '14px 12px', textAlign: 'left', color: '#1d1d1f', fontWeight: 500 }}>{t(mes.mes)}</td>
                  {categorias.map(cat => (
                    <td 
                      key={`${mes.mes}-${cat}`}
                      style={{ 
                        padding: '14px 12px', 
                        textAlign: 'right',
                        color: mes[cat] > 0 ? '#1d1d1f' : '#86868b',
                        fontWeight: mes[cat] > 0 ? 500 : 400,
                        fontSize: 13
                      }}
                    >
                      {mes[cat] > 0 ? `${mes[cat].toFixed(2)} €` : '-'}
                    </td>
                  ))}
                  <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 600, color: '#FF3B30', fontSize: 13 }}>
                    {mes['Total'].toFixed(2)} €
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 600, color: (mes['ingreso'] - mes['Total']) >= 0 ? '#34C759' : '#FF3B30', fontSize: 13 }}>
                    {(mes['ingreso'] - mes['Total']).toFixed(2)} €
                  </td>
                </tr>
              ))}
              {/* Fila de totales */}
              <tr style={{ background: '#f5f5f7', fontWeight: 700, borderTop: '1px solid #e5e5e7' }}>
                <td style={{ padding: '16px 12px', fontWeight: 600, textAlign: 'left', color: '#1d1d1f' }}>TOTALES</td>
                {categorias.map(cat => (
                  <td 
                    key={`total-${cat}`}
                    style={{ 
                      padding: '16px 12px', 
                      textAlign: 'right',
                      fontWeight: 600,
                      color: '#1d1d1f',
                      fontSize: 13
                    }}
                  >
                    {totalesPorCategoria[cat].toFixed(2)} €
                  </td>
                ))}
                <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 600, color: '#1d1d1f', fontSize: 13 }}>
                  {totalGastos.toFixed(2)} €
                </td>
                <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 600, color: diferencia >= 0 ? '#34C759' : '#FF3B30', fontSize: 13 }}>
                  {diferencia.toFixed(2)} €
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Resumen de totales por categoría */}
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1d1d1f', marginBottom: 40, textAlign: 'center', letterSpacing: '-0.5px' }}>Desglose de Gastos por Categoría</h2>
          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
            {categorias.map(cat => {
              const total = totalesPorCategoria[cat];
              const porcentaje = totalGastos > 0 ? ((total / totalGastos) * 100).toFixed(1) : 0;
              return (
                <div key={cat} style={{ background: '#fff', borderRadius: 16, padding: 24, textAlign: 'center', borderLeft: `3px solid ${colorsPorCategoria[cat]}`, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', transition: 'all 0.3s' }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
                  }}
                >
                  <div style={{ fontSize: 13, color: '#86868b', marginBottom: 10, fontWeight: 600, letterSpacing: '0.3px' }}>{t(categoriaToKey[cat])}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: colorsPorCategoria[cat], marginBottom: 8 }}>{total.toFixed(2)} €</div>
                  <div style={{ fontSize: 12, color: '#86868b', fontWeight: 500 }}>{porcentaje}% del total</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumenAnual;
