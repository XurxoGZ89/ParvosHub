import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Dumbbell, 
  PartyPopper, 
  Home as HomeIcon, 
  Car, 
  Film,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '../../lib/api';

const ParvosAccount = () => {
  const [operaciones, setOperaciones] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [filtros, setFiltros] = useState({
    tipo: 'todos',
    categoria: 'todas',
    cuenta: 'todas'
  });
  const [mesSeleccionado, setMesSeleccionado] = useState('enero'); // Mes actual
  const [añoSeleccionado, setAñoSeleccionado] = useState(2026); // Año actual
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  const [formNuevaOperacion, setFormNuevaOperacion] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'gasto',
    cantidad: '',
    descripcion: '',
    categoria: 'Alimentación',
    cuenta: 'BBVA',
    usuario_id: 2 // Sonia por defecto
  });

  const categorias = [
    { nombre: 'Alimentación', icon: ShoppingCart, color: 'amber' },
    { nombre: 'Deporte', icon: Dumbbell, color: 'cyan' },
    { nombre: 'Ocio', icon: Film, color: 'red' },
    { nombre: 'Hogar', icon: HomeIcon, color: 'emerald' },
    { nombre: 'Movilidad', icon: Car, color: 'blue' },
    { nombre: 'Extra', icon: PartyPopper, color: 'purple' },
    { nombre: 'Vacaciones', icon: PartyPopper, color: 'purple' }
  ];

  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  // Cargar operaciones
  useEffect(() => {
    cargarDatos();
  }, [mesSeleccionado, añoSeleccionado]);

  const cargarDatos = async () => {
    try {
      const [opsResponse, presResponse] = await Promise.all([
        api.get('/operaciones'),
        api.get('/presupuestos')
      ]);

      console.log('Operaciones cargadas:', opsResponse.data);
      console.log('Presupuestos cargados:', presResponse.data);
      console.log('Total operaciones:', opsResponse.data?.length || 0);
      console.log('Total presupuestos:', presResponse.data?.length || 0);

      setOperaciones(opsResponse.data || []);
      setPresupuestos(presResponse.data || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  // Filtrar operaciones por mes y año
  const operacionesDelMes = operaciones.filter(op => {
    const fecha = new Date(op.fecha);
    const mesOp = fecha.getMonth();
    const añoOp = fecha.getFullYear();
    const mesIdx = meses.indexOf(mesSeleccionado);
    
    return mesOp === mesIdx && añoOp === añoSeleccionado;
  });

  console.log('Operaciones del mes seleccionado:', operacionesDelMes.length);
  console.log('Mes seleccionado:', mesSeleccionado, añoSeleccionado);
  console.log('Índice del mes:', meses.indexOf(mesSeleccionado));

  // Calcular totales (usando TODAS las operaciones, no solo del mes)
  const calcularTotales = () => {
    const totalBBVA = operaciones
      .filter(op => op.cuenta === 'BBVA')
      .reduce((sum, op) => {
        if (op.tipo === 'ingreso' || op.tipo === 'retirada-hucha') return sum + parseFloat(op.cantidad || 0);
        if (op.tipo === 'gasto') return sum - parseFloat(op.cantidad || 0);
        return sum;
      }, 0);

    const totalImagin = operaciones
      .filter(op => op.cuenta === 'Imagin')
      .reduce((sum, op) => {
        if (op.tipo === 'ingreso' || op.tipo === 'retirada-hucha') return sum + parseFloat(op.cantidad || 0);
        if (op.tipo === 'gasto') return sum - parseFloat(op.cantidad || 0);
        return sum;
      }, 0);

    return {
      bbva: totalBBVA,
      imagin: totalImagin,
      total: totalBBVA + totalImagin
    };
  };

  // Calcular gastos por categoría (solo del mes seleccionado)
  const calcularGastosPorCategoria = () => {
    return categorias.map(cat => {
      const gastos = operacionesDelMes
        .filter(op => op.tipo === 'gasto' && op.categoria === cat.nombre)
        .reduce((sum, op) => sum + parseFloat(op.cantidad || 0), 0);

      return {
        categoria: cat.nombre,
        cantidad: gastos,
        icon: cat.icon,
        color: cat.color
      };
    });
  };

  // Calcular presupuesto vs real (solo del mes seleccionado)
  const calcularPresupuestoVsReal = () => {
    // Crear clave de mes en formato YYYY-MM (ej: "2026-01")
    const mesIdx = meses.indexOf(mesSeleccionado);
    const mesClave = `${añoSeleccionado}-${String(mesIdx + 1).padStart(2, '0')}`;
    
    // Filtrar presupuestos por mes
    const presupuestosDelMes = presupuestos.filter(p => p.mes === mesClave);
    
    return categorias.map(cat => {
      const presupuesto = presupuestosDelMes.find(p => p.categoria === cat.nombre)?.cantidad || 0;
      const gastado = operacionesDelMes
        .filter(op => op.tipo === 'gasto' && op.categoria === cat.nombre)
        .reduce((sum, op) => sum + parseFloat(op.cantidad || 0), 0);

      return {
        categoria: cat.nombre,
        presupuesto,
        gastado,
        diferencia: presupuesto - gastado
      };
    });
  };

  // Filtrar operaciones (aplicar filtros adicionales sobre operacionesDelMes)
  const operacionesFiltradas = operacionesDelMes.filter(op => {
    if (filtros.tipo !== 'todos' && op.tipo !== filtros.tipo) return false;
    if (filtros.categoria !== 'todas' && op.categoria !== filtros.categoria) return false;
    if (filtros.cuenta !== 'todas' && op.cuenta !== filtros.cuenta) return false;
    return true;
  });

  // Paginación
  const indexOfLastItem = paginaActual * itemsPorPagina;
  const indexOfFirstItem = indexOfLastItem - itemsPorPagina;
  
  // Ordenar por fecha descendente (más reciente primero)
  const operacionesOrdenadas = [...operacionesFiltradas].sort((a, b) => 
    new Date(b.fecha) - new Date(a.fecha)
  );
  
  const operacionesPaginadas = operacionesOrdenadas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPaginas = Math.ceil(operacionesFiltradas.length / itemsPorPagina);

  console.log('Operaciones paginadas:', operacionesPaginadas.length);
  console.log('Total páginas:', totalPaginas);
  console.log('Operaciones filtradas:', operacionesFiltradas.length);

  // Handlers
  const handleCrearOperacion = async (e) => {
    e.preventDefault();
    try {
      await api.post('/operaciones', formNuevaOperacion);
      
      setFormNuevaOperacion({
        fecha: new Date().toISOString().split('T')[0],
        tipo: 'gasto',
        cantidad: '',
        descripcion: '',
        categoria: 'Alimentación',
        cuenta: 'BBVA',
        usuario_id: 2
      });

      cargarDatos();
    } catch (error) {
      console.error('Error al crear operación:', error);
      alert('Error al crear la operación');
    }
  };

  const handleEliminarOperacion = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta operación?')) return;
    
    try {
      await api.delete(`/operaciones/${id}`);
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar operación:', error);
      alert('Error al eliminar la operación');
    }
  };

  const totales = calcularTotales();
  const gastosPorCategoria = calcularGastosPorCategoria();
  const presupuestoVsReal = calcularPresupuestoVsReal();

  return (
    <div className="p-8 space-y-8">
      {/* Header con selector de mes */}
      <div className="flex items-center gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Cuenta Parvos</h1>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-stone-900 p-1 rounded-lg">
          <select 
            value={`${mesSeleccionado} ${añoSeleccionado}`}
            onChange={(e) => {
              const [mes, año] = e.target.value.split(' ');
              setMesSeleccionado(mes);
              setAñoSeleccionado(parseInt(año));
            }}
            className="bg-transparent border-none text-xs font-bold py-1 pl-2 pr-8 focus:ring-0"
          >
            {meses.map((mes, idx) => (
              <option key={`${mes}-2026`} value={`${mes} 2026`}>{mes.charAt(0).toUpperCase() + mes.slice(1)} 2026</option>
            ))}
            {meses.map((mes, idx) => (
              <option key={`${mes}-2024`} value={`${mes} 2024`}>{mes.charAt(0).toUpperCase() + mes.slice(1)} 2024</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tarjetas de Balance */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        <div className="md:col-span-4 bg-white dark:bg-stone-900 p-6 rounded-3xl border border-slate-200 dark:border-stone-800 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Balance Total</p>
          <h2 className="text-4xl font-extrabold text-emerald-500">{totales.total.toFixed(2)} €</h2>
        </div>

        <div className="md:col-span-3 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-slate-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">BBVA Principal</p>
            <h3 className="text-xl font-bold">{totales.bbva.toFixed(2)} €</h3>
          </div>
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-800/30">
            <span className="text-blue-700 dark:text-blue-400 font-black text-[10px] italic">BBVA</span>
          </div>
        </div>

        <div className="md:col-span-3 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-slate-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ahorro Imagin</p>
            <h3 className="text-xl font-bold">{totales.imagin.toFixed(2)} €</h3>
          </div>
          <div className="w-10 h-10 bg-[#00FFAB]/10 rounded-xl flex items-center justify-center border border-[#00FFAB]/20">
            <div className="w-2 h-2 bg-[#00E599] rounded-full"></div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-slate-200 dark:border-stone-800 shadow-sm border-dashed flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity cursor-pointer">
          <span className="text-xs font-bold text-slate-400">+ Añadir</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Columna Principal */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Gráficos */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Gastos por Categoría */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-slate-200 dark:border-stone-800 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  Gastos por Categoría
                </h3>
              </div>
              <div className="h-64 flex items-end justify-around gap-2 px-2">
                {gastosPorCategoria.map((item, idx) => {
                  const Icon = item.icon;
                  const maxGasto = Math.max(...gastosPorCategoria.map(g => g.cantidad));
                  const altura = maxGasto > 0 ? (item.cantidad / maxGasto) * 100 : 0;

                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 w-full">
                      <div 
                        className={`w-full bg-${item.color}-400 rounded-t-lg relative transition-all hover:opacity-80`}
                        style={{ height: `${altura}%`, minHeight: '10px' }}
                      >
                        <div className={`absolute -top-1 left-0 w-full border-t-2 border-${item.color}-600 border-dashed`}></div>
                      </div>
                      <Icon className="text-slate-400 w-5 h-5" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Presupuesto vs Real */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-slate-200 dark:border-stone-800 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="font-bold flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  Presupuesto vs Real
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 font-bold uppercase tracking-wider text-left border-b border-slate-100 dark:border-stone-800">
                      <th className="pb-3">Categoría</th>
                      <th className="pb-3">Presp.</th>
                      <th className="pb-3">Real</th>
                      <th className="pb-3 text-right">Dif.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-stone-800">
                    {presupuestoVsReal.slice(0, 4).map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 font-semibold">{item.categoria}</td>
                        <td className="py-3">{item.presupuesto.toFixed(0)} €</td>
                        <td className="py-3 text-blue-500 font-bold">{item.gastado.toFixed(2)} €</td>
                        <td className={`py-3 font-bold text-right ${item.diferencia >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {item.diferencia >= 0 ? '+' : ''}{item.diferencia.toFixed(2)} €
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50/50 dark:bg-stone-800/30">
                      <td className="py-3 font-bold">TOTAL</td>
                      <td className="py-3 font-bold">{presupuestoVsReal.reduce((sum, item) => sum + item.presupuesto, 0).toFixed(0)} €</td>
                      <td className="py-3 text-blue-600 font-bold">{presupuestoVsReal.reduce((sum, item) => sum + item.gastado, 0).toFixed(2)} €</td>
                      <td className={`py-3 font-bold text-right ${presupuestoVsReal.reduce((sum, item) => sum + item.diferencia, 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {presupuestoVsReal.reduce((sum, item) => sum + item.diferencia, 0).toFixed(2)} €
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Tabla de Movimientos */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-slate-200 dark:border-stone-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-stone-800 bg-slate-50/50 dark:bg-stone-900/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="font-bold text-lg">Listado de Movimientos</h3>
                <div className="flex items-center gap-2">
                  <select 
                    value={filtros.tipo}
                    onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
                    className="bg-white dark:bg-stone-800 border-slate-200 dark:border-stone-700 rounded-lg text-[10px] font-bold py-1.5 focus:ring-pink-500/20"
                  >
                    <option value="todos">Tipo: Todos</option>
                    <option value="gasto">Gasto</option>
                    <option value="ingreso">Ingreso</option>
                    <option value="retirada-hucha">Retirada Hucha</option>
                  </select>
                  <select 
                    value={filtros.categoria}
                    onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}
                    className="bg-white dark:bg-stone-800 border-slate-200 dark:border-stone-700 rounded-lg text-[10px] font-bold py-1.5 focus:ring-pink-500/20"
                  >
                    <option value="todas">Categoría: Todas</option>
                    {categorias.map(cat => (
                      <option key={cat.nombre} value={cat.nombre}>{cat.nombre}</option>
                    ))}
                  </select>
                  <select 
                    value={filtros.cuenta}
                    onChange={(e) => setFiltros({...filtros, cuenta: e.target.value})}
                    className="bg-white dark:bg-stone-800 border-slate-200 dark:border-stone-700 rounded-lg text-[10px] font-bold py-1.5 focus:ring-pink-500/20"
                  >
                    <option value="todas">Cuenta: Todas</option>
                    <option value="BBVA">BBVA</option>
                    <option value="Imagin">Imagin</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/80 dark:bg-stone-800/50 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4 text-right">Cantidad</th>
                    <th className="px-6 py-4">Concepto</th>
                    <th className="px-6 py-4">Categoría</th>
                    <th className="px-6 py-4">Cuenta</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-stone-800">
                  {operacionesPaginadas.map((op) => (
                    <tr key={op.id} className="hover:bg-slate-50 dark:hover:bg-stone-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-400">{op.fecha}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          op.tipo === 'gasto' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                          op.tipo === 'ingreso' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {op.tipo}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${
                        op.tipo === 'gasto' ? 'text-red-500' : 'text-emerald-500'
                      }`}>
                        {parseFloat(op.cantidad).toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 text-slate-500 italic">{op.info || op.descripcion || '-'}</td>
                      <td className="px-6 py-4 font-medium">{op.categoria}</td>
                      <td className="px-6 py-4">
                        {op.cuenta === 'BBVA' ? (
                          <span className="text-[10px] font-black italic text-blue-700 dark:text-blue-400">BBVA</span>
                        ) : (
                          <div className="w-3 h-3 bg-[#00E599] rounded-full"></div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-1 hover:text-pink-500 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEliminarOperacion(op.id)}
                            className="p-1 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="p-4 border-t border-slate-100 dark:border-stone-800 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400">
                Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, operacionesFiltradas.length)} de {operacionesFiltradas.length} movimientos
              </span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                  disabled={paginaActual === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-stone-800 text-slate-500 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(Math.min(3, totalPaginas))].map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPaginaActual(idx + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                      paginaActual === idx + 1 
                        ? 'bg-pink-500 text-white' 
                        : 'hover:bg-slate-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button 
                  onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-stone-800 text-slate-500 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Derecha */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Formulario Nueva Operación */}
          <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-slate-200 dark:border-stone-800 shadow-sm">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <span className="text-lg">➕</span>
              Nueva Operación
            </h3>
            <form onSubmit={handleCrearOperacion} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Concepto</label>
                  <input 
                    type="text"
                    value={formNuevaOperacion.descripcion}
                    onChange={(e) => setFormNuevaOperacion({...formNuevaOperacion, descripcion: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-stone-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-pink-500/20"
                    placeholder="Ej: Mercadona"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Importe</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={formNuevaOperacion.cantidad}
                    onChange={(e) => setFormNuevaOperacion({...formNuevaOperacion, cantidad: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-stone-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-pink-500/20"
                    placeholder="0.00 €"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Categoría</label>
                <select 
                  value={formNuevaOperacion.categoria}
                  onChange={(e) => setFormNuevaOperacion({...formNuevaOperacion, categoria: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-stone-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-pink-500/20"
                >
                  {categorias.map(cat => (
                    <option key={cat.nombre} value={cat.nombre}>{cat.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Cuenta</label>
                <select 
                  value={formNuevaOperacion.cuenta}
                  onChange={(e) => setFormNuevaOperacion({...formNuevaOperacion, cuenta: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-stone-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-pink-500/20"
                >
                  <option value="BBVA">BBVA Principal</option>
                  <option value="Imagin">Ahorro Imagin</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full bg-pink-500 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-pink-200 dark:shadow-none hover:bg-pink-600 transition-all mt-2"
              >
                Registrar Movimiento
              </button>
            </form>
          </div>

          {/* Card de Meta Familiar */}
          <div className="bg-gradient-to-br from-pink-500 to-rose-400 p-8 rounded-3xl text-white shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <span className="text-2xl">✈️</span>
              </div>
              <span className="bg-white/20 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Meta Familiar</span>
            </div>
            <h3 className="text-xl font-bold mb-1">Viaje a Japón 2025</h3>
            <p className="text-white/80 text-sm mb-6 font-medium">Habéis ahorrado el 65% del objetivo planeado</p>
            <div className="w-full bg-white/20 h-4 rounded-full overflow-hidden mb-3 p-1">
              <div className="bg-white h-full rounded-full" style={{ width: '65%' }}></div>
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span>3.250 €</span>
              <span>5.000 €</span>
            </div>
          </div>

          {/* Actividad Reciente */}
          <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-slate-200 dark:border-stone-800 shadow-sm">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <span className="text-lg">🔔</span>
              Actividad Reciente
            </h3>
            <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-stone-800">
              <div className="flex gap-4 relative">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 border-4 border-white dark:border-stone-900 z-10"></div>
                <div className="flex-1">
                  <p className="text-sm leading-tight"><span className="font-bold">Sonia</span> adjuntó un ticket a <span className="text-pink-500 font-medium">Mercadona</span></p>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Hace 15 min</span>
                </div>
              </div>
              <div className="flex gap-4 relative">
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border-4 border-white dark:border-stone-900 z-10"></div>
                <div className="flex-1">
                  <p className="text-sm leading-tight"><span className="font-bold">Xurxo</span> movió 200€ a <span className="text-pink-500 font-medium">Ahorros Japón</span></p>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Hace 3 horas</span>
                </div>
              </div>
            </div>
            <button className="w-full mt-8 py-3 border border-slate-100 dark:border-stone-800 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-stone-800/50 transition-all">
              Ver historial completo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParvosAccount;
