import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const meses = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const colorsPorCategoria = {
  'Vacaciones': '#b8a5d6',    // Lila
  'Ocio': '#a64a5c',          // Granate
  'Hogar': '#d9a07e',         // Naranja
  'Vehículos': '#7ec9e8',     // Azul
  'Extra': '#f4e4a1',         // Amarillo
  'Alimentación': '#a8d4a3'   // Verde
};

const Home = ({ onNavigate }) => {
  const [operaciones, setOperaciones] = useState([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [datosMensuales, setDatosMensuales] = useState([]);

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
    } catch (err) {
      console.error('Error al cargar operaciones:', err);
    }
  };

  const procesarDatos = () => {
    const datos = Array(12).fill(null).map((_, mesIndex) => ({
      mes: meses[mesIndex],
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

    setDatosMensuales(datos);
  };

  const aniosDisponibles = Array.from(
    new Set(
      operaciones
        .filter(op => op.fecha)
        .map(op => new Date(op.fecha).getFullYear())
    )
  ).sort((a, b) => b - a);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '40px 20px', fontFamily: 'SF Pro Display, Arial, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', color: '#fff', marginBottom: 60 }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 700, margin: 0, marginBottom: 10 }}>Parvos Hub</h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9, margin: 0 }}>Dashboard de Control Familiar</p>
        </div>

        {/* Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 40 }}>
          {/* Card Gastos */}
          <div
            onClick={() => onNavigate('gastos')}
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 32,
              textAlign: 'center',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s, boxShadow 0.3s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>💰</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, marginBottom: 8, color: '#222' }}>Registro de Gastos</h2>
            <p style={{ fontSize: '0.95rem', color: '#666', margin: 0 }}>Controla y registra todos los gastos familiares</p>
          </div>

          {/* Card Estadísticas */}
          <div
            onClick={() => onNavigate('resumen')}
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 32,
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s, boxShadow 0.3s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📊</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, marginBottom: 8, color: '#222' }}>Resumen Anual</h2>
            <p style={{ fontSize: '0.95rem', color: '#666', margin: 0 }}>Ver el resumen anual en tabla</p>
          </div>

          {/* Card Presupuestos (Future) */}
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 32,
              textAlign: 'center',
              opacity: 0.5,
              cursor: 'not-allowed'
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📋</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, marginBottom: 8, color: '#222' }}>Presupuestos</h2>
            <p style={{ fontSize: '0.95rem', color: '#666', margin: 0 }}>Próximamente</p>
          </div>
        </div>

        {/* Gráfico de Resumen Anual */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#222' }}>📈 Resumen del Año</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button 
                onClick={() => {
                  const currentIndex = aniosDisponibles.indexOf(anioSeleccionado);
                  if (currentIndex < aniosDisponibles.length - 1) {
                    setAnioSeleccionado(aniosDisponibles[currentIndex + 1]);
                  }
                }}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: '4px 8px', color: '#007aff' }}
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
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: '4px 8px', color: '#007aff' }}
              >
                ▶
              </button>
            </div>
          </div>

          {datosMensuales.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={datosMensuales}
                  margin={{ top: 20, right: 30, bottom: 20, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={v => `${v.toFixed(2)} €`} contentStyle={{ borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="Vacaciones" stackId="a" fill={colorsPorCategoria['Vacaciones']} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Ocio" stackId="a" fill={colorsPorCategoria['Ocio']} />
                  <Bar dataKey="Hogar" stackId="a" fill={colorsPorCategoria['Hogar']} />
                  <Bar dataKey="Vehículos" stackId="a" fill={colorsPorCategoria['Vehículos']} />
                  <Bar dataKey="Extra" stackId="a" fill={colorsPorCategoria['Extra']} />
                  <Bar dataKey="Alimentación" stackId="a" fill={colorsPorCategoria['Alimentación']} />
                </BarChart>
              </ResponsiveContainer>

              {/* Resumen de totales */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginTop: 32 }}>
                {['Vacaciones', 'Ocio', 'Hogar', 'Vehículos', 'Extra', 'Alimentación'].map(categoria => {
                  const total = datosMensuales.reduce((sum, mes) => sum + mes[categoria], 0);
                  return (
                    <div key={categoria} style={{ background: `${colorsPorCategoria[categoria]}15`, borderRadius: 12, padding: 16, textAlign: 'center', borderLeft: `4px solid ${colorsPorCategoria[categoria]}` }}>
                      <div style={{ fontSize: 14, color: '#666', marginBottom: 8, fontWeight: 600 }}>{categoria}</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: colorsPorCategoria[categoria] }}>{total.toFixed(2)} €</div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
              Sin datos disponibles para este año
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
