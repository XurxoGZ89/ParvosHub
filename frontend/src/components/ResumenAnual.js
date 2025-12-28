import React, { useState, useEffect } from 'react';
import axios from 'axios';

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const categorias = [
  'Vacaciones', 'Ocio', 'Hogar', 'Vehículos', 'Extra', 'Alimentación'
];

const colorsPorCategoria = {
  'Vacaciones': '#b8a5d6',
  'Ocio': '#a64a5c',
  'Hogar': '#d9a07e',
  'Vehículos': '#7ec9e8',
  'Extra': '#f4e4a1',
  'Alimentación': '#a8d4a3'
};

const ResumenAnual = ({ onBack }) => {
  const [operaciones, setOperaciones] = useState([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [datosTabulares, setDatosTabulares] = useState([]);
  const [aniosDisponibles, setAniosDisponibles] = useState([]);

  useEffect(() => {
    cargarOperaciones();
  }, []);

  useEffect(() => {
    procesarDatos();
  }, [operaciones, anioSeleccionado]);

  const cargarOperaciones = async () => {
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
      console.error('Error al cargar operaciones:', err);
    }
  };

  const procesarDatos = () => {
    const datos = meses.map((mes, mesIndex) => ({
      mes,
      mesNum: mesIndex + 1,
      'Vacaciones': 0,
      'Ocio': 0,
      'Hogar': 0,
      'Vehículos': 0,
      'Extra': 0,
      'Alimentación': 0,
      'Ingresos': 0,
      'Total': 0
    }));

    operaciones.forEach(op => {
      if (!op.fecha || op.tipo === 'hucha' || op.tipo === 'retirada-hucha') return; // Excluir Hucha
      const fecha = new Date(op.fecha);
      if (fecha.getFullYear() !== anioSeleccionado) return;

      const mesIndex = fecha.getMonth();
      const cantidad = Number(op.cantidad);

      if (op.tipo === 'ingreso') {
        datos[mesIndex]['Ingresos'] += cantidad;
      } else if (op.tipo === 'gasto' && op.categoria) {
        datos[mesIndex][op.categoria] = (datos[mesIndex][op.categoria] || 0) + cantidad;
        datos[mesIndex]['Total'] += cantidad;
      }
    });

    setDatosTabulares(datos);
  };

  // Calcular totales por columna
  const totalesPorCategoria = categorias.reduce((acc, cat) => {
    acc[cat] = datosTabulares.reduce((sum, mes) => sum + mes[cat], 0);
    return acc;
  }, {});

  const totalIngresos = datosTabulares.reduce((sum, mes) => sum + mes['Ingresos'], 0);
  const totalGastos = datosTabulares.reduce((sum, mes) => sum + mes['Total'], 0);
  const diferencia = totalIngresos - totalGastos;

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '20px', fontFamily: 'SF Pro Display, Arial, sans-serif' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header con botón atrás */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: '1px solid #e0e0e0',
                padding: '10px 16px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 600,
                color: '#222'
              }}
            >
              ← Volver
            </button>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#222' }}>Resumen Anual</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button 
              onClick={() => {
                const currentIndex = aniosDisponibles.indexOf(anioSeleccionado);
                if (currentIndex < aniosDisponibles.length - 1) {
                  setAnioSeleccionado(aniosDisponibles[currentIndex + 1]);
                }
              }}
              style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', padding: '4px 8px', color: '#007aff' }}
            >
              ◀
            </button>
            <select 
              value={anioSeleccionado} 
              onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
              style={{ 
                fontSize: 16, 
                padding: '8px 12px', 
                borderRadius: 8, 
                border: '1px solid #e0e0e0',
                background: '#fff',
                cursor: 'pointer'
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
              style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', padding: '4px 8px', color: '#007aff' }}
            >
              ▶
            </button>
          </div>
        </div>

        {/* Tabla de datos anuales */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #0001', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 1000 }}>
            <thead>
              <tr style={{ background: '#f1f3f4' }}>
                <th style={{ padding: '10px 8px', borderBottom: '2px solid #e0e0e0', fontWeight: 700, textAlign: 'left', background: '#fff5e1' }}>MES</th>
                {categorias.map(cat => (
                  <th 
                    key={cat}
                    style={{ 
                      padding: '10px 8px', 
                      borderBottom: '2px solid #e0e0e0', 
                      fontWeight: 700, 
                      textAlign: 'center',
                      background: `${colorsPorCategoria[cat]}30`,
                      color: colorsPorCategoria[cat]
                    }}
                  >
                    {cat.toUpperCase()}
                  </th>
                ))}
                <th style={{ padding: '10px 8px', borderBottom: '2px solid #e0e0e0', fontWeight: 700, textAlign: 'center', background: '#e8f5e9' }}>GASTO</th>
                <th style={{ padding: '10px 8px', borderBottom: '2px solid #e0e0e0', fontWeight: 700, textAlign: 'center', background: '#c8e6c9' }}>Ingresos - Gastos</th>
              </tr>
            </thead>
            <tbody>
              {datosTabulares.map((mes, idx) => (
                <tr key={mes.mes} style={{ background: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #e0e0e0', fontWeight: 600, textAlign: 'left', background: idx % 2 === 0 ? '#fffde7' : '#fffbf5' }}>{mes.mes}</td>
                  {categorias.map(cat => (
                    <td 
                      key={`${mes.mes}-${cat}`}
                      style={{ 
                        padding: '10px 8px', 
                        borderBottom: '1px solid #e0e0e0', 
                        textAlign: 'right',
                        fontWeight: mes[cat] > 0 ? 600 : 400,
                        color: mes[cat] > 0 ? colorsPorCategoria[cat] : '#999'
                      }}
                    >
                      {mes[cat] > 0 ? `${mes[cat].toFixed(2)} €` : '0,00 €'}
                    </td>
                  ))}
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #e0e0e0', textAlign: 'right', fontWeight: 700, color: '#ef4444', background: '#ffebee' }}>
                    {mes['Total'].toFixed(2)} €
                  </td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #e0e0e0', textAlign: 'right', fontWeight: 700, color: (mes['Ingresos'] - mes['Total']) >= 0 ? '#22c55e' : '#ef4444', background: (mes['Ingresos'] - mes['Total']) >= 0 ? '#f0f4c3' : '#ffcdd2' }}>
                    {(mes['Ingresos'] - mes['Total']).toFixed(2)} €
                  </td>
                </tr>
              ))}
              {/* Fila de totales */}
              <tr style={{ background: '#f1f3f4', fontWeight: 700 }}>
                <td style={{ padding: '12px 8px', borderBottom: '2px solid #222', borderTop: '2px solid #222', fontWeight: 700, textAlign: 'left', background: '#fff9c4' }}>TOTALES</td>
                {categorias.map(cat => (
                  <td 
                    key={`total-${cat}`}
                    style={{ 
                      padding: '12px 8px', 
                      borderBottom: '2px solid #222',
                      borderTop: '2px solid #222',
                      textAlign: 'right',
                      fontWeight: 700,
                      color: colorsPorCategoria[cat],
                      background: `${colorsPorCategoria[cat]}30`
                    }}
                  >
                    {totalesPorCategoria[cat].toFixed(2)} €
                  </td>
                ))}
                <td style={{ padding: '12px 8px', borderBottom: '2px solid #222', borderTop: '2px solid #222', textAlign: 'right', fontWeight: 700, color: '#fff', background: '#ef4444' }}>
                  {totalGastos.toFixed(2)} €
                </td>
                <td style={{ padding: '12px 8px', borderBottom: '2px solid #222', borderTop: '2px solid #222', textAlign: 'right', fontWeight: 700, color: '#fff', background: diferencia >= 0 ? '#22c55e' : '#ef4444' }}>
                  {diferencia.toFixed(2)} €
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Resumen de totales por categoría */}
        <div style={{ marginTop: 40, marginBottom: 40 }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#222', marginBottom: 24, textAlign: 'center' }}>Desglose de Gastos por Categoría - {anioSeleccionado}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
            {categorias.map(cat => {
              const total = totalesPorCategoria[cat];
              const porcentaje = totalGastos > 0 ? ((total / totalGastos) * 100).toFixed(1) : 0;
              return (
                <div key={cat} style={{ background: `${colorsPorCategoria[cat]}15`, borderRadius: 12, padding: 16, textAlign: 'center', borderLeft: `4px solid ${colorsPorCategoria[cat]}` }}>
                  <div style={{ fontSize: 14, color: '#666', marginBottom: 8, fontWeight: 600 }}>{cat}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: colorsPorCategoria[cat], marginBottom: 4 }}>{total.toFixed(2)} €</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{porcentaje}% del gasto</div>
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
