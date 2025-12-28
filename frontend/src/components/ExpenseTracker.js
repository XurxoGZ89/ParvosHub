import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ReactPaginate from 'react-paginate';
import bbvaLogo from '../assets/BBVA_2019.svg.png';
import imaginLogoWebp from '../assets/imagin.webp';
import '../styles/pagination.css';

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const categorias = [
  'Vacaciones', 'Ocio', 'Hogar', 'Vehículos', 'Extra', 'Alimentación'
];

const usuarios = ['Xurxo', 'Sonia'];
const cuentas = ['Imagin', 'BBVA'];

// Colores por categoría
const colorsPorCategoria = {
  'Vacaciones': '#b8a5d6',    // Lila
  'Ocio': '#a64a5c',          // Granate
  'Hogar': '#d9a07e',         // Naranja
  'Vehículos': '#7ec9e8',     // Azul
  'Extra': '#f4e4a1',         // Amarillo
  'Alimentación': '#a8d4a3'   // Verde
};

const colorTipos = {
  'Retirada Hucha': '#a64a5c',  // Granate
  'Gasto': '#ef4444'            // Rojo para gastos
};

const editBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 18,
  marginRight: 8,
  color: '#222',
};
const deleteBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 18,
  color: '#222',
};
const inputStyle = {
  padding: '12px 16px',
  borderRadius: 12,
  border: '1px solid #e0e0e0',
  fontSize: 16,
  background: '#fff',
  outline: 'none',
  boxShadow: '0 1px 2px #0001',
  transition: 'border 0.2s',
};
const buttonStyle = {
  padding: '14px 0',
  borderRadius: 12,
  border: 'none',
  background: 'linear-gradient(90deg, #007aff 60%, #00c6fb 100%)',
  color: '#fff',
  fontWeight: 700,
  fontSize: 18,
  cursor: 'pointer',
  boxShadow: '0 2px 8px #007aff22',
  marginTop: 8,
  letterSpacing: 0.5,
  transition: 'background 0.2s',
};
const thStyle = {
  padding: '10px 8px',
  fontWeight: 600,
  fontSize: 15,
  borderBottom: '2px solid #e0e0e0',
  textAlign: 'center',
  background: '#f1f3f4',
  cursor: 'pointer',
  userSelect: 'none',
  whiteSpace: 'nowrap',
};
const tdStyle = {
  padding: '10px 8px',
  textAlign: 'center',
  fontSize: 15,
  background: '#fff',
};

function ExpenseTracker({ onBack }) {
  const hoy = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState(hoy.getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(hoy.getFullYear());
  const [form, setForm] = useState({
    fecha: '',
    tipo: 'gasto',
    cantidad: '',
    concepto: '',
    categoria: '',
    usuario: '',
    cuenta: ''
  });
  const [operaciones, setOperaciones] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'fecha', direction: 'desc' });
  const [filtros, setFiltros] = useState({ tipo: '', categoria: '', cuenta: '' });
  const [presupuestos, setPresupuestos] = useState({
    'Vacaciones': 500,
    'Ocio': 200,
    'Hogar': 400,
    'Vehículos': 150,
    'Extra': 100,
    'Alimentación': 350
  });
  const [editingPresupuestoCat, setEditingPresupuestoCat] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cargarOperaciones = async () => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    const res = await axios.get(`${API_URL}/operaciones`);
    const filtradas = res.data.filter(op => {
      if (!op.fecha) return false;
      const fecha = new Date(op.fecha);
      return fecha.getFullYear() >= 2025;
    });
    setOperaciones(filtradas);
  };

  // Cargar operaciones al montar el componente
  useEffect(() => {
    cargarOperaciones();
  }, []);

  // Actualizar fecha del formulario cuando cambien mes/año
  useEffect(() => {
    if (form.fecha) {
      const [year, month, day] = form.fecha.split('-');
      if (Number(month) !== mesSeleccionado + 1 || Number(year) !== anioSeleccionado) {
        const nuevoMes = String(mesSeleccionado + 1).padStart(2, '0');
        setForm(f => ({...f, fecha: `${anioSeleccionado}-${nuevoMes}-${String(day || '01').padStart(2, '0')}`}));
      }
    }
  }, [mesSeleccionado, anioSeleccionado]);

  const operacionesMes = operaciones.filter(op => {
    if (!op.fecha) return false;
    const fecha = new Date(op.fecha);
    return fecha.getMonth() === mesSeleccionado && fecha.getFullYear() === anioSeleccionado;
  });

  const operacionesFiltradasTabla = operacionesMes.filter(op => {
    // Aplicar filtros solo a la tabla
    if (filtros.tipo && op.tipo !== filtros.tipo) return false;
    if (filtros.categoria && op.categoria !== filtros.categoria) return false;
    if (filtros.cuenta && op.cuenta !== filtros.cuenta) return false;
    return true;
  }).sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];
    
    if (sortConfig.key === 'fecha') {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    } else if (sortConfig.key === 'cantidad') {
      aVal = Number(aVal);
      bVal = Number(bVal);
    }
    
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Obtener categorías disponibles según el tipo
  const getCategoriasDisponibles = () => {
    if (form.tipo === 'gasto') {
      return categorias;
    } else if (form.tipo === 'hucha') {
      return ['Hucha'];
    } else if (form.tipo === 'ingreso' || form.tipo === 'retirada-hucha') {
      return ['Ingreso'];
    }
    return [];
  };

  const handleChange = e => {
    const { name, value } = e.target;
    let newForm = { ...form, [name]: value };

    // Cambio de tipo
    if (name === 'tipo') {
      newForm.tipo = value;
      
      // Limpiar categoria al cambiar tipo
      newForm.categoria = '';

      // Si es hucha, seleccionar automáticamente
      if (value === 'hucha') {
        newForm.categoria = 'Hucha';
        newForm.cuenta = '';
      }
      // Si es ingreso, seleccionar automáticamente
      else if (value === 'ingreso' || value === 'retirada-hucha') {
        newForm.categoria = 'Ingreso';
      }
    }

    // Si cambia categoría y es hucha o ingreso, reseteamos
    if (name === 'categoria') {
      if (form.tipo === 'hucha' && value !== 'Hucha') {
        newForm.categoria = 'Hucha';
      } else if ((form.tipo === 'ingreso' || form.tipo === 'retirada-hucha') && value !== 'Ingreso') {
        newForm.categoria = 'Ingreso';
      }
    }

    // Si es hucha, deshabilitar cuenta
    if (newForm.tipo === 'hucha') {
      newForm.cuenta = '';
    }

    setForm(newForm);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    const isHucha = form.tipo === 'hucha';
    const requiredFields = isHucha
      ? ['fecha', 'cantidad', 'categoria', 'usuario'] 
      : ['fecha', 'cantidad', 'categoria', 'usuario', 'cuenta'];
    
    const incompleto = requiredFields.some(field => !form[field]);
    
    if (incompleto) {
      setMensaje('Por favor, completa todos los campos obligatorios.');
      return;
    }
    
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const dataToSave = isHucha
        ? { ...form, cuenta: null }
        : form;
      
      if (editandoId) {
        await axios.put(`${API_URL}/operaciones/${editandoId}`, dataToSave);
        setMensaje('Operación actualizada correctamente.');
      } else {
        await axios.post(`${API_URL}/operaciones`, dataToSave);
        setMensaje('Operación añadida correctamente.');
      }
      setForm({ fecha: '', tipo: 'gasto', cantidad: '', concepto: '', categoria: '', usuario: '', cuenta: '' });
      setEditandoId(null);
      cargarOperaciones();
      setCurrentPage(0);
    } catch (err) {
      setMensaje('Error al guardar la operación.');
    }
  };

  async function handleBorrar(id) {
    if (window.confirm('¿Seguro que quieres borrar este movimiento?')) {
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        await axios.delete(`${API_URL}/operaciones/${id}`);
        setMensaje('Movimiento borrado.');
        cargarOperaciones();
      } catch (err) {
        alert('Error al borrar el movimiento');
      }
    }
  }

  const formRef = React.useRef(null);

  function handleEditar(op) {
    setForm({
      fecha: op.fecha,
      tipo: op.tipo,
      cantidad: op.cantidad,
      concepto: op.concepto || '',
      categoria: op.categoria || '',
      usuario: op.usuario || '',
      cuenta: op.cuenta || ''
    });
    setEditandoId(op.id);
    setMensaje('Editando movimiento. Haz los cambios y pulsa "Guardar cambios".');
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  const handlePresupuestoChange = (cat, value) => {
    setPresupuestos(prev => ({ ...prev, [cat]: Number(value) }));
  };

  // Cálculos - Hucha separada (basados en mes, no en filtros)
  const gastosPorCategoria = categorias.map(cat => ({
    name: cat,
    value: operacionesMes
      .filter(op => op.tipo === 'gasto' && op.categoria === cat)
      .reduce((acc, op) => acc + Number(op.cantidad), 0)
  }));

  // Ingresos y Gastos (sin hucha)
  const ingresosTotales = operacionesMes
    .filter(op => (op.tipo === 'ingreso' || op.tipo === 'retirada-hucha') && op.tipo !== 'hucha')
    .reduce((acc, op) => acc + Number(op.cantidad), 0);

  const gastosTotales = operacionesMes
    .filter(op => op.tipo === 'gasto' && op.tipo !== 'hucha')
    .reduce((acc, op) => acc + Number(op.cantidad), 0);

  // Situación global SIN Hucha
  const situacionGlobal = ingresosTotales - gastosTotales;

  const huchaTotal = operacionesMes
    .filter(op => op.tipo === 'hucha')
    .reduce((acc, op) => acc + Number(op.cantidad), 0);

  const retiradaHuchaTotal = operacionesMes
    .filter(op => op.tipo === 'retirada-hucha')
    .reduce((acc, op) => acc + Number(op.cantidad), 0);

  const huchaNeta = huchaTotal - retiradaHuchaTotal;

  // Calcular hucha del mes anterior
  const mesAnterior = mesSeleccionado === 0 ? 11 : mesSeleccionado - 1;
  const anioAnterior = mesSeleccionado === 0 ? anioSeleccionado - 1 : anioSeleccionado;
  const huchaMesAnterior = operaciones
    .filter(op => {
      if (!op.fecha || op.tipo !== 'hucha') return false;
      const fecha = new Date(op.fecha);
      return fecha.getMonth() === mesAnterior && fecha.getFullYear() === anioAnterior;
    })
    .reduce((acc, op) => acc + Number(op.cantidad), 0);

  const huchaDiferencia = huchaNeta - huchaMesAnterior;
  const huchaPercentaje = huchaMesAnterior !== 0 ? ((huchaDiferencia / huchaMesAnterior) * 100).toFixed(1) : 0;

  // Calcular saldo del mes anterior por cuenta
  const saldoMesAnteriorPorCuenta = cuentas.reduce((acc, cuenta) => {
    const operacionesMesAnterior = operaciones.filter(op => {
      if (!op.fecha) return false;
      const fecha = new Date(op.fecha);
      return fecha.getMonth() === mesAnterior && fecha.getFullYear() === anioAnterior && op.tipo !== 'hucha' && op.cuenta === cuenta;
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

  // Paginación
  const offset = currentPage * itemsPerPage;
  const paginatedOperaciones = operacionesFiltradasTabla.slice(offset, offset + itemsPerPage);
  const pageCount = Math.ceil(operacionesFiltradasTabla.length / itemsPerPage);

  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(0);
  };

  // Mapear nombres de tipos
  const getTipoDisplay = (tipo) => {
    const tipoMap = {
      'gasto': 'Gasto',
      'ingreso': 'Ingreso',
      'hucha': 'Hucha',
      'retirada-hucha': 'Retirada Hucha'
    };
    return tipoMap[tipo] || tipo;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: isMobile ? '12px' : '20px', fontFamily: 'SF Pro Display, Arial, sans-serif' }}>
      <div style={{ maxWidth: isMobile ? '100%' : 1200, margin: '0 auto' }}>
        {/* Header con botón atrás */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
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
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#222' }}>Registro de Gastos</h1>
        </div>

        {/* Selector de mes y año */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: isMobile ? 8 : 12, marginBottom: isMobile ? 16 : 24, flexWrap: 'wrap' }}>
          <button 
            onClick={() => {
              if (mesSeleccionado === 0) {
                setMesSeleccionado(11);
                setAnioSeleccionado(anioSeleccionado - 1);
              } else {
                setMesSeleccionado(mesSeleccionado - 1);
              }
            }}
            style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', padding: '4px 8px', color: '#007aff' }}
          >
            ◀
          </button>
          <select value={mesSeleccionado} onChange={e => setMesSeleccionado(Number(e.target.value))} style={{ fontSize: 16, padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0' }}>
            {meses.map((mes, idx) => (
              <option key={mes} value={idx}>{mes}</option>
            ))}
          </select>
          <select value={anioSeleccionado} onChange={e => setAnioSeleccionado(Number(e.target.value))} style={{ fontSize: 16, padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0' }}>
            {Array.from({length: 2}, (_, i) => 2025 + i).map(anio => (
              <option key={anio} value={anio}>{anio}</option>
            ))}
          </select>
          <button 
            onClick={() => {
              if (mesSeleccionado === 11) {
                setMesSeleccionado(0);
                setAnioSeleccionado(anioSeleccionado + 1);
              } else {
                setMesSeleccionado(mesSeleccionado + 1);
              }
            }}
            style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', padding: '4px 8px', color: '#007aff' }}
          >
            ▶
          </button>
        </div>

        <h2 style={{ textAlign: 'center', fontWeight: 700, color: '#222', letterSpacing: 0.5, marginBottom: 32 }}>
          {meses[mesSeleccionado]} {anioSeleccionado}
        </h2>

        {/* Formulario + Tarjetas (Situación Global + Hucha) en una fila */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: isMobile ? 16 : 24, marginBottom: 32 }}>
          {/* Formulario - izquierda (2/3) */}
          <div style={{ 
            background: editandoId ? '#f0f0f0' : '#fff', 
            borderRadius: 16, 
            boxShadow: '0 2px 8px #0001', 
            padding: isMobile ? 16 : 24, 
            transition: 'background 0.3s'
          }}>
            {editandoId && (
              <div style={{ padding: '12px', background: '#fff3cd', borderRadius: 8, marginBottom: 16, fontSize: 14, color: '#666' }}>
                ✏️ Editando movimiento
              </div>
            )}
            <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input 
                type="date" 
                name="fecha" 
                value={form.fecha} 
                onChange={handleChange} 
                required 
                style={{...inputStyle, fontSize: 14, padding: '10px 12px'}}
                min={`${anioSeleccionado}-${String(mesSeleccionado + 1).padStart(2, '0')}-01`}
                max={`${anioSeleccionado}-${String(mesSeleccionado + 1).padStart(2, '0')}-31`}
              />
              <select name="tipo" value={form.tipo} onChange={handleChange} required style={{...inputStyle, fontSize: 14, padding: '10px 12px'}}>
                <option value="gasto">Gasto</option>
                <option value="ingreso">Ingreso</option>
                <option value="hucha">Hucha (Ahorro)</option>
                <option value="retirada-hucha">Retirada Hucha</option>
              </select>
              <input type="number" name="cantidad" value={form.cantidad} onChange={handleChange} placeholder="Cantidad" required step="0.01" style={{...inputStyle, fontSize: 14, padding: '10px 12px'}} />
              <input type="text" name="concepto" value={form.concepto} onChange={handleChange} placeholder="Descripción o información (opcional)" style={{...inputStyle, fontSize: 14, padding: '10px 12px'}} />
              <select name="categoria" value={form.categoria} onChange={handleChange} required style={{...inputStyle, fontSize: 14, padding: '10px 12px'}}>
                <option value="">Selecciona categoría</option>
                {getCategoriasDisponibles().map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select name="usuario" value={form.usuario} onChange={handleChange} required style={{...inputStyle, fontSize: 14, padding: '10px 12px'}}>
                <option value="">Selecciona usuario</option>
                {usuarios.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <select 
                name="cuenta" 
                value={form.cuenta} 
                onChange={handleChange} 
                disabled={form.tipo === 'hucha'}
                required={form.tipo !== 'hucha'}
                style={{...inputStyle, fontSize: 14, padding: '10px 12px', background: form.tipo === 'hucha' ? '#f0f0f0' : '#fff', opacity: form.tipo === 'hucha' ? 0.6 : 1}}
              >
                <option value="">Selecciona cuenta</option>
                {cuentas.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="submit" style={{...buttonStyle, padding: '12px 0', fontSize: 16, marginTop: 4}}>{editandoId ? 'Guardar cambios' : 'Añadir'}</button>
              {editandoId && (
                <button type="button" style={{...buttonStyle, padding: '12px 0', fontSize: 16, background: '#e0e0e0', color: '#222'}} onClick={() => { setEditandoId(null); setForm({ fecha: '', tipo: 'gasto', cantidad: '', concepto: '', categoria: '', usuario: '', cuenta: '' }); setMensaje('Edición cancelada.'); }}>
                  Cancelar
                </button>
              )}
            </form>
            {mensaje && <p style={{ textAlign: 'center', color: '#007aff', marginTop: 12, fontSize: 13 }}>{mensaje}</p>}
          </div>

          {/* Tarjetas apiladas: Situación Global + Hucha */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Situación Global */}
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #0001', padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 14, fontWeight: 700 }}>💰 SITUACIÓN GLOBAL</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: situacionGlobal >= 0 ? '#007aff' : '#ff6961', marginBottom: 16 }}>{situacionGlobal.toFixed(2)} €</div>
              
              {/* Cuentas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #e0e0e0' }}>
                {situacionPorCuenta.map(c => {
                  const logo = c.cuenta.toLowerCase() === 'bbva' ? bbvaLogo : imaginLogoWebp;
                  return (
                    <div key={c.cuenta} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px', background: '#f8f9fa', borderRadius: 10 }}>
                      <img src={logo} alt={c.cuenta} style={{ height: 28, objectFit: 'contain' }} />
                      <div style={{ fontSize: 12, color: '#222', fontWeight: 700 }}>{c.saldo.toFixed(2)} €</div>
                    </div>
                  );
                })}
              </div>
              
              {/* Ingresos y Gastos */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: '10px', background: '#e8f5e9', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: '#2e7d32', fontWeight: 600, marginBottom: 4 }}>Ingresos</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>+{ingresosTotales.toFixed(2)} €</div>
                </div>
                <div style={{ padding: '10px', background: '#ffebee', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: '#b71c1c', fontWeight: 600, marginBottom: 4 }}>Gastos</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#ef4444' }}>-{gastosTotales.toFixed(2)} €</div>
                </div>
              </div>
            </div>

            {/* Hucha */}
            <div style={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', borderRadius: 16, boxShadow: '0 2px 8px #0001', padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#2e7d32', marginBottom: 12, fontWeight: 700 }}>🐷 TOTAL HUCHA</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#1b5e20', marginBottom: 16 }}>{huchaNeta.toFixed(2)} €</div>
              <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: 10, marginTop: 10 }}>
                <div style={{ fontSize: 11, color: '#558b2f', fontWeight: 600, marginBottom: 6 }}>vs mes anterior</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: huchaDiferencia >= 0 ? '#2e7d32' : '#d32f2f', marginBottom: 6 }}>
                  {huchaDiferencia >= 0 ? '+' : ''}{huchaDiferencia.toFixed(2)} € ({huchaPercentaje}%)
                </div>
                <div style={{ fontSize: 11, color: '#558b2f', fontWeight: 500, borderTop: '1px solid rgba(46, 125, 50, 0.2)', paddingTop: 8 }}>
                  Mes anterior: <span style={{ fontWeight: 700, fontSize: 12 }}>{huchaMesAnterior.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen mensual */}
        <h3 style={{ textAlign: 'center', color: '#222', fontWeight: 600, marginBottom: 24 }}>Resumen mensual</h3>

        {/* Gráfico + Presupuesto vs Real en una fila */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 16 : 24, marginBottom: 32 }}>
          {/* Gráfico de Gastos por Categoría */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #0001', padding: isMobile ? 14 : 20, minHeight: isMobile ? 280 : 350 }}>
            <div style={{ fontSize: 16, color: '#888', marginBottom: 16, fontWeight: 600, textAlign: 'center' }}>📊 Gastos por Categoría</div>
            <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
              <BarChart data={gastosPorCategoria} margin={{ top: 20, right: 30, bottom: 80, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  interval={0} 
                  tick={{ fontSize: 12 }} 
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={v => `${v.toFixed(2)} €`} contentStyle={{ borderRadius: 8 }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} shape={<BarWithColor />} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Presupuesto vs Real */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #0001', padding: isMobile ? 14 : 20 }}>
            <div style={{ fontSize: 16, color: '#222', marginBottom: 16, fontWeight: 700, textAlign: 'center' }}>📋 Presupuesto vs Real</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 'auto' }}>
              <thead>
                <tr style={{ background: '#f1f3f4' }}>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', fontWeight: 700, fontSize: 13, textAlign: 'left' }}>Categoría</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', fontWeight: 700, fontSize: 13, textAlign: 'right' }}>Presupuesto</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', fontWeight: 700, fontSize: 13, textAlign: 'right' }}>Real</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', fontWeight: 700, fontSize: 13, textAlign: 'right' }}>Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(presupuestos).map(cat => {
                  const real = gastosPorCategoria.find(g => g.name === cat)?.value || 0;
                  const presupuesto = presupuestos[cat];
                  const diferencia = presupuesto - real;
                  const isEditing = editingPresupuestoCat === cat;
                  return (
                    <tr key={cat} style={{ background: '#fff', borderBottom: '1px solid #f1f3f4' }}>
                      <td style={{ padding: '8px 6px', fontWeight: 600, textAlign: 'left', fontSize: 13 }}>{cat}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', fontSize: 13 }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={presupuesto}
                            min={0}
                            step={1}
                            autoFocus
                            style={{ width: 60, padding: '4px 6px', borderRadius: 6, border: '1px solid #007aff', fontSize: 12, background: '#f6f6f6', textAlign: 'right', outline: 'none' }}
                            onChange={e => handlePresupuestoChange(cat, e.target.value)}
                            onBlur={() => setEditingPresupuestoCat(null)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') setEditingPresupuestoCat(null);
                            }}
                          />
                        ) : (
                          <span
                            style={{ cursor: 'pointer', display: 'inline-block', minWidth: 60, padding: '4px 6px', borderRadius: 6, background: '#f6f6f6', border: '1px solid transparent', color: '#222', fontSize: 13 }}
                            title="Haz click para editar"
                            onClick={() => setEditingPresupuestoCat(cat)}
                            tabIndex={0}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setEditingPresupuestoCat(cat); }}
                          >
                            {presupuesto} € <span style={{ color: '#007aff', fontSize: 11, marginLeft: 2 }}>✎</span>
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px 6px', color: '#007aff', fontWeight: 600, textAlign: 'right', fontSize: 13 }}>{real.toFixed(2)} €</td>
                      <td style={{ padding: '8px 6px', color: diferencia < 0 ? '#ef4444' : '#22c55e', fontWeight: 700, textAlign: 'right', fontSize: 13 }}>{diferencia.toFixed(2)} €</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Últimos movimientos */}
        <h3 style={{ textAlign: 'center', color: '#222', fontWeight: 600, marginTop: 40, marginBottom: 24 }}>Últimos movimientos</h3>
        
        {/* Filtros visuales */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #0001', padding: isMobile ? 12 : 16, marginBottom: 16, display: 'flex', gap: isMobile ? 8 : 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: isMobile ? 12 : 13, color: '#666', fontWeight: 600 }}>Filtrar por:</label>
          </div>
          
          {/* Filtro Tipo */}
          <div style={{ position: 'relative' }}>
            <select 
              value={filtros.tipo} 
              onChange={(e) => { setFiltros({...filtros, tipo: e.target.value}); setCurrentPage(0); }}
              style={{ fontSize: 13, padding: '8px 10px', borderRadius: 6, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', appearance: 'none', paddingRight: 24 }}
            >
              <option value="">📌 Tipo</option>
              <option value="gasto">Gasto</option>
              <option value="ingreso">Ingreso</option>
              <option value="hucha">Hucha</option>
              <option value="retirada-hucha">Retirada Hucha</option>
            </select>
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 12, color: '#666' }}>▼</span>
          </div>
          
          {/* Filtro Categoría */}
          <div style={{ position: 'relative' }}>
            <select 
              value={filtros.categoria} 
              onChange={(e) => { setFiltros({...filtros, categoria: e.target.value}); setCurrentPage(0); }}
              style={{ fontSize: 13, padding: '8px 10px', borderRadius: 6, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', appearance: 'none', paddingRight: 24 }}
            >
              <option value="">🏷️ Categoría</option>
              {[...new Set(operacionesMes.map(op => op.categoria))].sort().map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 12, color: '#666' }}>▼</span>
          </div>
          
          {/* Filtro Cuenta */}
          <div style={{ position: 'relative' }}>
            <select 
              value={filtros.cuenta} 
              onChange={(e) => { setFiltros({...filtros, cuenta: e.target.value}); setCurrentPage(0); }}
              style={{ fontSize: 13, padding: '8px 10px', borderRadius: 6, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', appearance: 'none', paddingRight: 24 }}
            >
              <option value="">💳 Cuenta</option>
              {cuentas.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 12, color: '#666' }}>▼</span>
          </div>
          
          {/* Botón Limpiar Filtros */}
          {(filtros.tipo || filtros.categoria || filtros.cuenta) && (
            <button 
              onClick={() => { setFiltros({ tipo: '', categoria: '', cuenta: '' }); setCurrentPage(0); }}
              style={{ fontSize: 13, padding: '8px 12px', borderRadius: 6, border: '1px solid #e0e0e0', background: '#f0f0f0', color: '#666', fontWeight: 600, cursor: 'pointer' }}
            >
              ✕ Limpiar
            </button>
          )}
          
          <div style={{ marginLeft: 'auto', fontSize: 13, color: '#888', fontWeight: 600 }}>
            Total: {operacionesFiltradasTabla.length} movimientos
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #0001', overflowX: 'auto', marginBottom: isMobile ? 16 : 32 }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 900 }}>
            <thead>
              <tr style={{ background: '#f1f3f4', color: '#555' }}>
                <th style={{...thStyle, cursor: 'pointer', userSelect: 'none'}} onClick={() => handleSort('fecha')}>Fecha <span style={{fontSize: 11, color: '#007aff', fontWeight: 'bold'}}>{sortConfig.key === 'fecha' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span></th>
                <th style={{...thStyle, cursor: 'pointer', userSelect: 'none'}} onClick={() => handleSort('tipo')}>Tipo <span style={{fontSize: 11, color: '#007aff', fontWeight: 'bold'}}>{sortConfig.key === 'tipo' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span></th>
                <th style={{...thStyle, cursor: 'pointer', userSelect: 'none'}} onClick={() => handleSort('cantidad')}>Cantidad <span style={{fontSize: 11, color: '#007aff', fontWeight: 'bold'}}>{sortConfig.key === 'cantidad' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span></th>
                <th style={{...thStyle, cursor: 'pointer', userSelect: 'none'}} onClick={() => handleSort('categoria')}>Categoría <span style={{fontSize: 11, color: '#007aff', fontWeight: 'bold'}}>{sortConfig.key === 'categoria' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span></th>
                <th style={{...thStyle, cursor: 'pointer', userSelect: 'none'}} onClick={() => handleSort('usuario')}>Usuario <span style={{fontSize: 11, color: '#007aff', fontWeight: 'bold'}}>{sortConfig.key === 'usuario' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span></th>
                <th style={{...thStyle, cursor: 'pointer', userSelect: 'none'}} onClick={() => handleSort('cuenta')}>Cuenta <span style={{fontSize: 11, color: '#007aff', fontWeight: 'bold'}}>{sortConfig.key === 'cuenta' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span></th>
                <th style={{...thStyle}}>Concepto</th>
                <th style={{...thStyle}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOperaciones.map((op, idx) => {
                const tipoDisplay = getTipoDisplay(op.tipo);
                const isIngreso = op.tipo === 'ingreso';
                const isGasto = op.tipo === 'gasto';
                const isRetiradaHucha = op.tipo === 'retirada-hucha';
                
                return (
                  <tr
                    key={op.id}
                    style={{
                      borderBottom: '1px solid #f1f3f4',
                      color: '#222',
                      fontWeight: 500,
                      background: idx % 2 === 0 ? '#f8fafc' : '#fff',
                    }}
                  >
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#6366f1' }}>{op.fecha}</td>
                    <td style={{
                      ...tdStyle,
                      fontWeight: 600,
                      color: colorTipos[tipoDisplay] || (isIngreso || isRetiradaHucha ? '#22c55e' : isGasto ? '#ef4444' : '#1b5e20'),
                      textTransform: 'capitalize',
                    }}>{tipoDisplay}</td>
                    <td style={{
                      ...tdStyle,
                      fontWeight: 700,
                      color: isIngreso || isRetiradaHucha ? '#22c55e' : isGasto ? '#ef4444' : '#1b5e20',
                      background: '#f1f3f4',
                    }}>{Number(op.cantidad).toFixed(2)} €</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: colorsPorCategoria[op.categoria] || '#222', background: '#fff' }}>{op.categoria}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#6366f1' }}>{op.usuario}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#f59e42', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {op.cuenta && op.cuenta.trim().toLowerCase() === 'bbva' && (
                        <img src={bbvaLogo} alt="BBVA" style={{ height: 22, verticalAlign: 'middle' }} />
                      )}
                      {op.cuenta && op.cuenta.trim().toLowerCase() === 'imagin' && (
                        <img src={imaginLogoWebp} alt="Imagin" style={{ height: 22, verticalAlign: 'middle' }} />
                      )}
                    </td>
                    <td style={{ ...tdStyle, fontStyle: 'italic', color: op.concepto ? '#555' : '#bbb', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{op.concepto || '-'}</td>
                    <td style={{ ...tdStyle, minWidth: 80 }}>
                      <button onClick={() => handleEditar(op)} style={editBtnStyle} title="Editar">✏️</button>
                      <button onClick={() => handleBorrar(op.id)} style={deleteBtnStyle} title="Borrar">🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Controles de paginación y elementos por página - FUSIONADOS */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #0001', padding: 16, marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          {/* Elementos por página */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 14, color: '#666', fontWeight: 600 }}>Elementos por página:</label>
            <select value={itemsPerPage} onChange={handleItemsPerPageChange} style={{ fontSize: 14, padding: '6px 10px', borderRadius: 6, border: '1px solid #e0e0e0', background: '#fff' }}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          
          {/* Paginación en el centro-derecha */}
          {pageCount > 1 && (
            <ReactPaginate
              breakLabel="..."
              nextLabel="Siguiente >"
              onPageChange={handlePageClick}
              pageRangeDisplayed={5}
              pageCount={pageCount}
              previousLabel="< Anterior"
              renderOnZeroPageCount={null}
              containerClassName="pagination"
              activeClassName="active"
              pageLinkClassName="pagination-link"
              previousLinkClassName="pagination-link"
              nextLinkClassName="pagination-link"
              breakLinkClassName="pagination-link"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Componente personalizado para Bar con colores
function BarWithColor(props) {
  const { x, y, width, height, payload } = props;
  const color = colorsPorCategoria[payload.name] || '#999';
  
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={color}
      radius={[8, 8, 0, 0]}
    />
  );
}

export default ExpenseTracker;
