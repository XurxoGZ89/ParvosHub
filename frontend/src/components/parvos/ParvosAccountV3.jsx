import React, { useState, useEffect, useRef } from 'react';
import ReactPaginate from 'react-paginate';
import { 
  ShoppingCart, 
  Dumbbell, 
  Home as HomeIcon, 
  Car, 
  Utensils,
  Plus,
  Plane,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../stores/authStore';
import bbvaLogo from '../../assets/BBVA_2019.svg.png';
import imaginLogo from '../../assets/imagin.webp';
import { usePrivacyFormatter } from '../../utils/privacyFormatter';

const ParvosAccount = () => {
  const { user } = useAuthStore();
  const formatAmount = usePrivacyFormatter();
  const [operaciones, setOperaciones] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [metas, setMetas] = useState([]);
  const [actividad, setActividad] = useState([]);
  const [filtros, setFiltros] = useState({
    tipo: 'todos',
    categoria: 'todas',
    cuenta: 'todas'
  });

  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  
  const mesActual = new Date().getMonth();
  const añoActual = new Date().getFullYear();

  const [mesSeleccionado, setMesSeleccionado] = useState(meses[mesActual]);
  const [añoSeleccionado, setAñoSeleccionado] = useState(añoActual);
  const [paginaActual, setPaginaActual] = useState(0);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);
  const [busqueda, setBusqueda] = useState('');
  const [ordenamiento, setOrdenamiento] = useState({ columna: 'fecha', direccion: 'desc' });

  // Estados para móvil
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Estados para modales
  const [modalEditarPresupuesto, setModalEditarPresupuesto] = useState(false);
  const [modalEliminar, setModalEliminar] = useState({ abierto: false, id: null });
  const [modalEditarOperacion, setModalEditarOperacion] = useState({ abierto: false, operacion: null });
  const [modalEditarMeta, setModalEditarMeta] = useState({ abierto: false, meta: null });
  const [presupuestosEditables, setPresupuestosEditables] = useState({});

  const [formNuevaOperacion, setFormNuevaOperacion] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'gasto',
    cantidad: '',
    descripcion: '',
    categoria: 'Alimentación',
    cuenta: 'BBVA',
    cuentaOrigen: 'Ahorro',
    cuentaDestino: 'BBVA'
  });

  const categorias = [
    { nombre: 'Alimentación', icon: ShoppingCart, color: 'amber' },
    { nombre: 'Deporte', icon: Dumbbell, color: 'cyan' },
    { nombre: 'Ocio', icon: Utensils, color: 'red' },
    { nombre: 'Hogar', icon: HomeIcon, color: 'emerald' },
    { nombre: 'Movilidad', icon: Car, color: 'blue' },
    { nombre: 'Extra', icon: Plus, color: 'purple' },
    { nombre: 'Vacaciones', icon: Plane, color: 'orange' }
  ];

  const tablaRef = useRef(null);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [mesSeleccionado, añoSeleccionado]);

  const cargarDatos = async () => {
    try {
      const [opsResponse, presResponse, metasResponse] = await Promise.all([
        api.get('/operaciones'),
        api.get('/presupuestos'),
        api.get('/metas')
      ]);

      const ops = opsResponse.data || [];
      setOperaciones(ops);
      setPresupuestos(presResponse.data || []);
      setMetas(metasResponse.data || []);
      
      // Cargar las últimas 5 operaciones para actividad reciente (ordenadas por fecha desc)
      const actividadReciente = [...ops]
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 5);
      setActividad(actividadReciente);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  // Filtrar operaciones del mes actual y mes anterior para calcular ahorro
  const operacionesDelMes = operaciones.filter(op => {
    const fecha = new Date(op.fecha);
    const mesOp = fecha.getMonth();
    const añoOp = fecha.getFullYear();
    const mesIdx = meses.indexOf(mesSeleccionado);
    return mesOp === mesIdx && añoOp === añoSeleccionado;
  });

  // Calcular totales
  const calcularTotales = () => {
    const totalBBVA = operaciones
      .filter(op => op.cuenta === 'BBVA' && op.tipo !== 'hucha')
      .reduce((sum, op) => {
        if (op.tipo === 'ingreso' || op.tipo === 'retirada-hucha') return sum + parseFloat(op.cantidad || 0);
        if (op.tipo === 'gasto') return sum - parseFloat(op.cantidad || 0);
        return sum;
      }, 0);

    const totalImagin = operaciones
      .filter(op => op.cuenta === 'Imagin' && op.tipo !== 'hucha')
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

  // Calcular ahorro acumulado hasta el mes seleccionado
  const calcularAhorro = () => {
    const mesIdx = meses.indexOf(mesSeleccionado);
    
    // Calcular ahorro acumulado: SOLO hucha - retirada-hucha
    const operacionesHastaAhora = operaciones.filter(op => {
      const fecha = new Date(op.fecha);
      const mesOp = fecha.getMonth();
      const añoOp = fecha.getFullYear();
      
      // Incluir si es antes del mes/año seleccionado, o es el mes/año seleccionado
      if (añoOp < añoSeleccionado) return true;
      if (añoOp === añoSeleccionado && mesOp <= mesIdx) return true;
      return false;
    });

    const huchaAcumulada = operacionesHastaAhora
      .filter(op => op.tipo === 'hucha' && op.cuenta === 'Ahorro')
      .reduce((sum, op) => sum + parseFloat(op.cantidad || 0), 0);

    const retiradaHuchaAcumulada = operacionesHastaAhora
      .filter(op => op.tipo === 'retirada-hucha' && op.cuenta === 'Ahorro')
      .reduce((sum, op) => sum + Math.abs(parseFloat(op.cantidad || 0)), 0);

    const ahorroActual = huchaAcumulada - retiradaHuchaAcumulada;

    // Calcular ahorro del mes anterior (para comparativa)
    const mesAnteriorIdx = mesIdx === 0 ? 11 : mesIdx - 1;
    const añoAnterior = mesIdx === 0 ? añoSeleccionado - 1 : añoSeleccionado;

    const operacionesHastaMesAnterior = operaciones.filter(op => {
      const fecha = new Date(op.fecha);
      const mesOp = fecha.getMonth();
      const añoOp = fecha.getFullYear();
      
      if (añoOp < añoAnterior) return true;
      if (añoOp === añoAnterior && mesOp <= mesAnteriorIdx) return true;
      return false;
    });

    const huchaAnterior = operacionesHastaMesAnterior
      .filter(op => op.tipo === 'hucha' && op.cuenta === 'Ahorro')
      .reduce((sum, op) => sum + parseFloat(op.cantidad || 0), 0);

    const retiradaHuchaAnterior = operacionesHastaMesAnterior
      .filter(op => op.tipo === 'retirada-hucha' && op.cuenta === 'Ahorro')
      .reduce((sum, op) => sum + Math.abs(parseFloat(op.cantidad || 0)), 0);

    const ahorroAnterior = huchaAnterior - retiradaHuchaAnterior;

    const diferencia = ahorroActual - ahorroAnterior;
    const porcentaje = ahorroAnterior !== 0 ? ((diferencia / Math.abs(ahorroAnterior)) * 100) : 0;

    return {
      actual: ahorroActual,
      anterior: ahorroAnterior,
      diferencia,
      porcentaje
    };
  };

  // Calcular gastos por categoría
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

  // Calcular presupuesto vs real
  const calcularPresupuestoVsReal = () => {
    const mesIdx = meses.indexOf(mesSeleccionado);
    const mesClave = `${añoSeleccionado}-${String(mesIdx + 1).padStart(2, '0')}`;
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
        diferencia: presupuesto - gastado,
        icon: categorias.find(c => c.nombre === cat.nombre)?.icon,
        color: categorias.find(c => c.nombre === cat.nombre)?.color
      };
    });
  };

  // Filtrar, buscar y ordenar
  const operacionesFiltradas = operacionesDelMes.filter(op => {
    // Filtros dropdown
    if (filtros.tipo !== 'todos' && op.tipo !== filtros.tipo) return false;
    if (filtros.categoria !== 'todas' && op.categoria !== filtros.categoria) return false;
    if (filtros.cuenta !== 'todas' && op.cuenta !== filtros.cuenta) return false;
    
    // Búsqueda por texto
    if (busqueda.trim() !== '') {
      const searchTerm = busqueda.toLowerCase();
      const concepto = (op.info || op.descripcion || '').toLowerCase();
      const categoria = (op.categoria || '').toLowerCase();
      if (!concepto.includes(searchTerm) && !categoria.includes(searchTerm)) {
        return false;
      }
    }
    
    return true;
  });

  // Ordenar
  const operacionesOrdenadas = [...operacionesFiltradas].sort((a, b) => {
    let comparacion = 0;
    
    switch (ordenamiento.columna) {
      case 'fecha':
        comparacion = new Date(a.fecha) - new Date(b.fecha);
        break;
      case 'tipo':
        comparacion = (a.tipo || '').localeCompare(b.tipo || '');
        break;
      case 'cantidad':
        comparacion = parseFloat(a.cantidad || 0) - parseFloat(b.cantidad || 0);
        break;
      case 'categoria':
        comparacion = (a.categoria || '').localeCompare(b.categoria || '');
        break;
      case 'cuenta':
        comparacion = (a.cuenta || '').localeCompare(b.cuenta || '');
        break;
      default:
        comparacion = 0;
    }
    
    return ordenamiento.direccion === 'asc' ? comparacion : -comparacion;
  });

  const indexOfFirstItem = paginaActual * itemsPorPagina;
  const indexOfLastItem = indexOfFirstItem + itemsPorPagina;
  const operacionesPaginadas = operacionesOrdenadas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPaginas = Math.ceil(operacionesFiltradas.length / itemsPorPagina);

  // Handler para cambiar ordenamiento
  const handleOrdenar = (columna) => {
    if (ordenamiento.columna === columna) {
      setOrdenamiento({
        columna,
        direccion: ordenamiento.direccion === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setOrdenamiento({ columna, direccion: 'asc' });
    }
  };

  // Handlers
  const handleCrearOperacion = async (e) => {
    e.preventDefault();
    try {
      const username = user?.username || 'Sonia';
      
      // Para traspasos (retirada-hucha), construir descripción especial y usar cuenta destino
      let operacionData = { ...formNuevaOperacion, usuario: username };
      
      if (formNuevaOperacion.tipo === 'retirada-hucha') {
        operacionData.cuenta = formNuevaOperacion.cuentaDestino;
        operacionData.descripcion = `Traspaso desde ${formNuevaOperacion.cuentaOrigen} a ${formNuevaOperacion.cuentaDestino}${formNuevaOperacion.descripcion ? ' - ' + formNuevaOperacion.descripcion : ''}`;
      }
      
      await api.post('/operaciones', operacionData);
      setFormNuevaOperacion({
        fecha: new Date().toISOString().split('T')[0],
        tipo: 'gasto',
        cantidad: '',
        descripcion: '',
        categoria: 'Alimentación',
        cuenta: 'BBVA',
        cuentaOrigen: 'Ahorro',
        cuentaDestino: 'BBVA'
      });
      cargarDatos();
    } catch (error) {
      console.error('Error al crear operación:', error);
    }
  };

  const handleEliminarOperacion = async (id) => {
    try {
      await api.delete(`/operaciones/${id}`);
      setModalEliminar({ abierto: false, id: null });
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar operación:', error);
    }
  };

  const handleEditarOperacion = async (e) => {
    e.preventDefault();
    try {
      let operacionData = { ...modalEditarOperacion.operacion };
      
      // Si es un traspaso y tiene cuentaOrigen y cuentaDestino, reconstruir la descripción
      if (operacionData.tipo === 'retirada-hucha' && 
          operacionData.cuentaOrigen && 
          operacionData.cuentaDestino) {
        operacionData.cuenta = operacionData.cuentaDestino;
        // Extraer el concepto adicional si existe
        const conceptoMatch = operacionData.info?.match(/Traspaso desde .+ a .+(?: - (.+))?$/);
        const concepto = conceptoMatch && conceptoMatch[1] ? conceptoMatch[1] : '';
        operacionData.info = `Traspaso desde ${operacionData.cuentaOrigen} a ${operacionData.cuentaDestino}${concepto ? ' - ' + concepto : ''}`;
        // Limpiar campos temporales
        delete operacionData.cuentaOrigen;
        delete operacionData.cuentaDestino;
      }
      
      await api.put(`/operaciones/${operacionData.id}`, operacionData);
      setModalEditarOperacion({ abierto: false, operacion: null });
      cargarDatos();
    } catch (error) {
      console.error('Error al actualizar operación:', error);
    }
  };

  const handleGuardarPresupuestos = async () => {
    try {
      const mesIdx = meses.indexOf(mesSeleccionado);
      await api.post(`/presupuestos/${añoSeleccionado}/${mesIdx}`, {
        presupuestos: presupuestosEditables
      });
      setModalEditarPresupuesto(false);
      cargarDatos();
    } catch (error) {
      console.error('Error al guardar presupuestos:', error);
    }
  };

  const handleGuardarMeta = async (e) => {
    e.preventDefault();
    try {
      if (modalEditarMeta.meta.id) {
        await api.put(`/metas/${modalEditarMeta.meta.id}`, modalEditarMeta.meta);
      } else {
        await api.post('/metas', modalEditarMeta.meta);
      }
      setModalEditarMeta({ abierto: false, meta: null });
      cargarDatos();
    } catch (error) {
      console.error('Error al guardar meta:', error);
    }
  };

  const cambiarMes = (direccion) => {
    const mesIdx = meses.indexOf(mesSeleccionado);
    let nuevoMesIdx = mesIdx + direccion;
    let nuevoAño = añoSeleccionado;

    if (nuevoMesIdx < 0) {
      nuevoMesIdx = 11;
      nuevoAño--;
    } else if (nuevoMesIdx > 11) {
      nuevoMesIdx = 0;
      nuevoAño++;
    }

    setMesSeleccionado(meses[nuevoMesIdx]);
    setAñoSeleccionado(nuevoAño);
  };

  const totales = calcularTotales();
  const ahorro = calcularAhorro();
  const gastosPorCategoria = calcularGastosPorCategoria();
  const presupuestoVsReal = calcularPresupuestoVsReal();

  return (
    <div className="pb-8 lg:p-8 lg:space-y-8">
      {/* Header con selector de mes - Sticky en móvil */}
      <div className="sticky top-0 z-30 bg-white dark:bg-stone-950 lg:bg-transparent lg:relative p-4 lg:p-0 border-b lg:border-0 border-slate-200 dark:border-stone-800">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-4">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight lg:order-1">Cuenta Parvos</h1>
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-stone-900 p-1.5 rounded-xl shadow-sm lg:order-2 lg:mx-auto">
            <button 
              onClick={() => cambiarMes(-1)}
              className="p-2.5 hover:bg-white dark:hover:bg-stone-800 rounded-lg transition-colors active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-6 py-2 text-sm lg:text-base font-bold whitespace-nowrap min-w-[160px] text-center">
              {mesSeleccionado.charAt(0).toUpperCase() + mesSeleccionado.slice(1)} {añoSeleccionado}
            </div>
            <button 
              onClick={() => cambiarMes(1)}
              className="p-2.5 hover:bg-white dark:hover:bg-stone-800 rounded-lg transition-colors active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="hidden lg:block lg:order-3 lg:w-[120px]"></div>
        </div>
      </div>

      {/* Tarjetas de Balance - Swipeable en móvil */}
      <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 lg:gap-6 p-4 lg:p-0">
        {/* Balance Total */}
        <div className="col-span-2 lg:md:col-span-3 bg-white dark:bg-stone-900 p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-slate-200 dark:border-stone-800 shadow-sm">
          <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Balance Total</p>
          <h2 className="text-2xl lg:text-4xl font-extrabold text-emerald-500">{formatAmount(totales.total || 0)} €</h2>
        </div>

        {/* BBVA */}
        <div className="lg:md:col-span-3 bg-white dark:bg-stone-900 p-4 lg:p-5 rounded-2xl border border-slate-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">BBVA Principal</p>
            <h3 className="text-lg lg:text-xl font-bold">{formatAmount(totales.bbva || 0)} €</h3>
          </div>
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-800/30 overflow-hidden">
            <img src={bbvaLogo} alt="BBVA" className="w-8 h-8 lg:w-10 lg:h-10 object-contain" />
          </div>
        </div>

        {/* Imagin */}
        <div className="lg:md:col-span-3 bg-white dark:bg-stone-900 p-4 lg:p-5 rounded-2xl border border-slate-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ahorro Imagin</p>
            <h3 className="text-lg lg:text-xl font-bold">{formatAmount(totales.imagin || 0)} €</h3>
          </div>
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#00FFAB]/10 rounded-xl flex items-center justify-center border border-[#00FFAB]/20 overflow-hidden">
            <img src={imaginLogo} alt="Imagin" className="w-9 h-9 lg:w-11 lg:h-11 object-contain" />
          </div>
        </div>

        {/* Ahorro Total */}
        <div className="col-span-2 lg:md:col-span-3 bg-gradient-to-br from-emerald-500 to-teal-600 p-4 lg:p-5 rounded-2xl shadow-sm flex flex-col justify-between text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest opacity-90">Ahorro Total</p>
            <PiggyBank className="w-4 h-4 lg:w-5 lg:h-5 opacity-80" />
          </div>
          <h3 className="text-xl lg:text-2xl font-bold mb-1">{formatAmount(ahorro.actual || 0)} €</h3>
          <div className="flex items-center gap-2 text-xs">
            {ahorro.diferencia >= 0 ? (
              <>
                <TrendingUp className="w-3 h-3" />
                <span className="font-semibold">+{formatAmount(ahorro.diferencia || 0)} € ({ahorro.porcentaje.toFixed(1)}%)</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3" />
                <span className="font-semibold">{formatAmount(ahorro.diferencia || 0)} € ({ahorro.porcentaje.toFixed(1)}%)</span>
              </>
            )}
            <span className="opacity-75 hidden lg:inline">vs mes anterior</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 lg:gap-8 p-4 lg:p-0">
        {/* Columna Principal */}
        <div className="col-span-12 lg:col-span-8 space-y-4 lg:space-y-8">
          {/* Gráficos - Colapsables en móvil */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-8">
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
                  const maxGasto = Math.max(...gastosPorCategoria.map(g => g.cantidad), 1);
                  const altura = (item.cantidad / maxGasto) * 100;
                  
                  // Encontrar presupuesto de esta categoría
                  const mesIdx = meses.indexOf(mesSeleccionado);
                  const mesClave = `${añoSeleccionado}-${String(mesIdx + 1).padStart(2, '0')}`;
                  const presupuestosDelMes = presupuestos.filter(p => p.mes === mesClave);
                  const presupuestoCategoria = presupuestosDelMes.find(p => p.categoria === item.categoria)?.cantidad || 0;
                  const alturaPresupuesto = presupuestoCategoria > 0 ? (presupuestoCategoria / maxGasto) * 100 : 0;
                  
                  const coloresBarras = {
                    'amber': 'bg-amber-400',
                    'cyan': 'bg-cyan-400',
                    'red': 'bg-red-400',
                    'emerald': 'bg-emerald-400',
                    'blue': 'bg-blue-400',
                    'purple': 'bg-purple-400',
                    'orange': 'bg-orange-400'
                  };

                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 w-full h-full">
                      <div className="relative w-full flex-1 flex flex-col justify-end">
                        {presupuestoCategoria > 0 && (
                          <div 
                            className="absolute w-full border-t-2 border-black dark:border-white border-dashed z-10"
                            style={{ bottom: `${alturaPresupuesto}%` }}
                            title={`Presupuesto: ${presupuestoCategoria}€`}
                          />
                        )}
                        <div 
                          className={`w-full ${coloresBarras[item.color] || 'bg-slate-400'} rounded-t-lg transition-all hover:opacity-80 relative`}
                          style={{ height: `${altura}%`, minHeight: item.cantidad > 0 ? '20px' : '0px' }}
                        >
                          {item.cantidad > 0 && (
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-[10px] font-bold whitespace-nowrap">
                              {formatAmount(item.cantidad || 0)}€
                            </div>
                          )}
                        </div>
                      </div>
                      <Icon className="text-slate-400 w-5 h-5" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Presupuesto vs Real */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-slate-200 dark:border-stone-800 shadow-sm">
              <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="font-bold flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  Presupuesto vs Real
                </h3>
                <button 
                  onClick={() => {
                    const mesIdx = meses.indexOf(mesSeleccionado);
                    const mesClave = `${añoSeleccionado}-${String(mesIdx + 1).padStart(2, '0')}`;
                    const presupuestosDelMes = presupuestos.filter(p => p.mes === mesClave);
                    const editables = {};
                    categorias.forEach(cat => {
                      editables[cat.nombre] = presupuestosDelMes.find(p => p.categoria === cat.nombre)?.cantidad || 0;
                    });
                    setPresupuestosEditables(editables);
                    setModalEditarPresupuesto(true);
                  }}
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  Editar
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white dark:bg-stone-900">
                    <tr className="text-slate-400 font-bold uppercase tracking-wider text-left border-b border-slate-100 dark:border-stone-800">
                      <th className="pb-3">Categoría</th>
                      <th className="pb-3">Presp.</th>
                      <th className="pb-3">Real</th>
                      <th className="pb-3 text-right">Dif.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-stone-800">
                    {presupuestoVsReal.filter(item => item.presupuesto > 0 || item.gastado > 0).map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 font-semibold">{item.categoria}</td>
                        <td className="py-3">{item.presupuesto.toFixed(0)} €</td>
                        <td className="py-3 text-blue-500 font-bold">{item.gastado.toFixed(2)} €</td>
                        <td className={`py-3 font-bold text-right ${item.diferencia >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {item.diferencia >= 0 ? '+' : ''}{item.diferencia.toFixed(2)} €
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50/50 dark:bg-stone-800/30 font-bold">
                      <td className="py-3">TOTAL</td>
                      <td className="py-3">{presupuestoVsReal.reduce((sum, item) => sum + item.presupuesto, 0).toFixed(0)} €</td>
                      <td className="py-3 text-blue-600">{presupuestoVsReal.reduce((sum, item) => sum + item.gastado, 0).toFixed(2)} €</td>
                      <td className={`py-3 text-right ${presupuestoVsReal.reduce((sum, item) => sum + item.diferencia, 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {presupuestoVsReal.reduce((sum, item) => sum + item.diferencia, 0).toFixed(2)} €
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Tabla de Movimientos */}
          <div ref={tablaRef} className="bg-white dark:bg-stone-900 rounded-2xl lg:rounded-3xl border border-slate-200 dark:border-stone-800 shadow-sm overflow-hidden">
            <div className="p-4 lg:p-6 border-b border-slate-100 dark:border-stone-800 bg-slate-50/50 dark:bg-stone-900/50">
              <div className="flex flex-col gap-3 lg:gap-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-4">
                  <h3 className="font-bold text-base lg:text-lg">Listado de Movimientos</h3>
                  
                  {/* Botón de filtros en móvil */}
                  {isMobile && (
                    <button
                      onClick={() => setShowMobileFilters(!showMobileFilters)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      Filtros
                    </button>
                  )}
                  
                  {/* Filtros desktop */}
                  <div className={`${isMobile ? 'hidden' : 'flex'} items-center gap-2 flex-wrap`}>
                    <select 
                      value={filtros.tipo}
                      onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
                      className="bg-white dark:bg-stone-800 border-slate-200 dark:border-stone-700 rounded-lg text-[10px] font-bold py-1.5 focus:ring-purple-500/20"
                    >
                      <option value="todos">Tipo: Todos</option>
                      <option value="gasto">Gasto</option>
                      <option value="ingreso">Ingreso</option>
                      <option value="hucha">Hucha</option>
                      <option value="retirada-hucha">Retirada Hucha</option>
                    </select>
                    <select 
                      value={filtros.categoria}
                      onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}
                      className="bg-white dark:bg-stone-800 border-slate-200 dark:border-stone-700 rounded-lg text-[10px] font-bold py-1.5 focus:ring-purple-500/20"
                    >
                      <option value="todas">Categoría: Todas</option>
                      {categorias.map(cat => (
                        <option key={cat.nombre} value={cat.nombre}>{cat.nombre}</option>
                      ))}
                    </select>
                    <select 
                      value={filtros.cuenta}
                      onChange={(e) => setFiltros({...filtros, cuenta: e.target.value})}
                      className="bg-white dark:bg-stone-800 border-slate-200 dark:border-stone-700 rounded-lg text-[10px] font-bold py-1.5 focus:ring-purple-500/20"
                    >
                      <option value="todas">Cuenta: Todas</option>
                      <option value="BBVA">BBVA</option>
                      <option value="Imagin">Imagin</option>
                    </select>
                  </div>
                </div>
                {/* Búsqueda */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => {
                      setBusqueda(e.target.value);
                      setPaginaActual(0);
                    }}
                    placeholder="Buscar por concepto o categoría..."
                    className="w-full pl-10 pr-4 py-3 lg:py-2.5 bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-xl lg:rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 dark:focus:border-purple-700 transition-all"
                  />
                  {busqueda && (
                    <button
                      onClick={() => setBusqueda('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 active:scale-95"
                    >
                      <X className="w-5 h-5 lg:w-4 lg:h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tabla Desktop / Cards Móvil */}
            {isMobile ? (
              /* Vista de Cards para Móvil */
              <div className="divide-y divide-slate-100 dark:divide-stone-800">
                {operacionesPaginadas.map((op) => (
                  <div key={op.id} className="p-4 hover:bg-slate-50 dark:hover:bg-stone-800/50 active:bg-slate-100 dark:active:bg-stone-800 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            op.tipo === 'gasto' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                            op.tipo === 'ingreso' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            op.tipo === 'hucha' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                            'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {op.tipo === 'gasto' ? 'Gasto' :
                             op.tipo === 'ingreso' ? 'Ingreso' :
                             op.tipo === 'hucha' ? 'Ahorro' :
                             op.tipo === 'retirada-hucha' ? 'Retirada' : op.tipo}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">{op.fecha}</span>
                        </div>
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {op.info || op.descripcion || op.categoria}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500 dark:text-slate-400">{op.categoria}</span>
                          <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                          {op.cuenta === 'BBVA' ? (
                            <div className="inline-flex items-center justify-center w-12 h-6 bg-white dark:bg-white rounded border border-slate-200 p-0.5">
                              <img src={bbvaLogo} alt="BBVA" className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center w-12 h-6 bg-white dark:bg-white rounded border border-slate-200 p-0.5">
                              <img src={imaginLogo} alt="Imagin" className="w-full h-full object-contain" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-lg font-bold ${
                          op.tipo === 'gasto' ? 'text-red-500' : 'text-emerald-500'
                        }`}>
                          {formatAmount(parseFloat(op.cantidad) || 0)} €
                        </span>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => setModalEditarOperacion({ abierto: true, operacion: {...op} })}
                            className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 active:scale-95 transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setModalEliminar({ abierto: true, id: op.id })}
                            className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 active:scale-95 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Vista de Tabla para Desktop */
              <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="sticky top-0 bg-slate-50/95 dark:bg-stone-800/95 backdrop-blur-sm text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest z-10 border-b-2 border-slate-200 dark:border-stone-700">
                  <tr>
                    <th className="px-6 py-4">
                      <button 
                        onClick={() => handleOrdenar('fecha')}
                        className="flex items-center gap-1 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        Fecha
                        {ordenamiento.columna === 'fecha' ? (
                          ordenamiento.direccion === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4">
                      <button 
                        onClick={() => handleOrdenar('tipo')}
                        className="flex items-center gap-1 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        Tipo
                        {ordenamiento.columna === 'tipo' ? (
                          ordenamiento.direccion === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOrdenar('cantidad')}
                        className="flex items-center gap-1 ml-auto hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        Cantidad
                        {ordenamiento.columna === 'cantidad' ? (
                          ordenamiento.direccion === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4">Concepto</th>
                    <th className="px-6 py-4">
                      <button 
                        onClick={() => handleOrdenar('categoria')}
                        className="flex items-center gap-1 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        Categoría
                        {ordenamiento.columna === 'categoria' ? (
                          ordenamiento.direccion === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4">
                      <button 
                        onClick={() => handleOrdenar('cuenta')}
                        className="flex items-center gap-1 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        Cuenta
                        {ordenamiento.columna === 'cuenta' ? (
                          ordenamiento.direccion === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </button>
                    </th>
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
                          op.tipo === 'hucha' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                          'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {op.tipo === 'gasto' ? 'Gasto' :
                           op.tipo === 'ingreso' ? 'Ingreso' :
                           op.tipo === 'hucha' ? 'Ahorro' :
                           op.tipo === 'retirada-hucha' ? 'Retirada' : op.tipo}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${
                        op.tipo === 'gasto' ? 'text-red-500' : 'text-emerald-500'
                      }`}>
                        {formatAmount(parseFloat(op.cantidad) || 0)} €
                      </td>
                      <td className="px-6 py-4 text-slate-500 italic">{op.info || op.descripcion || '-'}</td>
                      <td className="px-6 py-4 font-medium">{op.categoria}</td>
                      <td className="px-6 py-4">
                        {op.cuenta === 'BBVA' ? (
                          <div className="inline-flex items-center justify-center w-16 h-10 bg-white dark:bg-white rounded-lg border border-slate-200 dark:border-slate-300 p-1.5">
                            <img src={bbvaLogo} alt="BBVA" className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-16 h-10 bg-white dark:bg-white rounded-lg border border-slate-200 dark:border-slate-300 p-1.5">
                            <img src={imaginLogo} alt="Imagin" className="w-full h-full object-contain" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => setModalEditarOperacion({ abierto: true, operacion: {...op} })}
                            className="p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all"
                            title="Editar operación"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setModalEliminar({ abierto: true, id: op.id })}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
                            title="Eliminar operación"
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
            )}

            {/* Paginación */}
            <div className="p-4 border-t border-slate-100 dark:border-stone-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Mostrando <span className="font-semibold text-slate-700 dark:text-slate-300">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, operacionesFiltradas.length)}</span> de <span className="font-semibold text-slate-700 dark:text-slate-300">{operacionesFiltradas.length}</span> movimientos
                  </span>
                  <select
                    value={itemsPorPagina}
                    onChange={(e) => {
                      setItemsPorPagina(Number(e.target.value));
                      setPaginaActual(0);
                    }}
                    className="bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-lg text-xs font-medium py-1.5 px-3 cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 transition-colors focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value={10}>10 por página</option>
                    <option value={20}>20 por página</option>
                    <option value={30}>30 por página</option>
                    <option value={50}>50 por página</option>
                    <option value={100}>100 por página</option>
                  </select>
                </div>
                <ReactPaginate
                  breakLabel="..."
                  nextLabel={<ChevronRight className="w-4 h-4" />}
                  onPageChange={(e) => setPaginaActual(e.selected)}
                  pageRangeDisplayed={3}
                  marginPagesDisplayed={1}
                  pageCount={totalPaginas}
                  previousLabel={<ChevronLeft className="w-4 h-4" />}
                  renderOnZeroPageCount={null}
                  forcePage={paginaActual}
                  containerClassName="flex gap-1 items-center"
                  pageClassName="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-stone-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer"
                  pageLinkClassName="w-full h-full flex items-center justify-center"
                  previousClassName="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-stone-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer"
                  previousLinkClassName="w-full h-full flex items-center justify-center"
                  nextClassName="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-stone-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer"
                  nextLinkClassName="w-full h-full flex items-center justify-center"
                  breakClassName="w-9 h-9 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm"
                  breakLinkClassName="w-full h-full flex items-center justify-center"
                  activeClassName="!bg-purple-600 !border-purple-600 !text-white shadow-md"
                  disabledClassName="opacity-40 cursor-not-allowed pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar con formulario */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-3xl shadow-lg text-white sticky top-8">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="text-xl">➕</span>
              Nueva Operación
            </h3>
            <form onSubmit={handleCrearOperacion} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider opacity-90 block mb-2">Fecha</label>
                <input
                  type="date"
                  value={formNuevaOperacion.fecha}
                  onChange={(e) => setFormNuevaOperacion({...formNuevaOperacion, fecha: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider opacity-90 block mb-2">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormNuevaOperacion({...formNuevaOperacion, tipo: 'gasto'})}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      formNuevaOperacion.tipo === 'gasto'
                        ? 'bg-white text-purple-600 shadow-lg'
                        : 'bg-white/20 border border-white/30 text-white'
                    }`}
                  >
                    Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormNuevaOperacion({...formNuevaOperacion, tipo: 'ingreso'})}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      formNuevaOperacion.tipo === 'ingreso'
                        ? 'bg-white text-purple-600 shadow-lg'
                        : 'bg-white/20 border border-white/30 text-white'
                    }`}
                  >
                    Ingreso
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormNuevaOperacion({...formNuevaOperacion, tipo: 'hucha'})}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      formNuevaOperacion.tipo === 'hucha'
                        ? 'bg-white text-purple-600 shadow-lg'
                        : 'bg-white/20 border border-white/30 text-white'
                    }`}
                  >
                    Ahorro
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormNuevaOperacion({...formNuevaOperacion, tipo: 'retirada-hucha'})}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      formNuevaOperacion.tipo === 'retirada-hucha'
                        ? 'bg-white text-purple-600 shadow-lg'
                        : 'bg-white/20 border border-white/30 text-white'
                    }`}
                  >
                    Retirada
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider opacity-90 block mb-2">Cantidad</label>
                <input
                  type="number"
                  step="0.01"
                  value={formNuevaOperacion.cantidad}
                  onChange={(e) => setFormNuevaOperacion({...formNuevaOperacion, cantidad: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider opacity-90 block mb-2">Concepto</label>
                <input
                  type="text"
                  value={formNuevaOperacion.descripcion}
                  onChange={(e) => setFormNuevaOperacion({...formNuevaOperacion, descripcion: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  placeholder="Descripción..."
                />
              </div>

              {formNuevaOperacion.tipo === 'gasto' && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider opacity-90 block mb-2">Categoría</label>
                  <select
                    value={formNuevaOperacion.categoria}
                    onChange={(e) => setFormNuevaOperacion({...formNuevaOperacion, categoria: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  >
                    {categorias.map(cat => (
                      <option key={cat.nombre} value={cat.nombre} className="text-slate-900">{cat.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              {formNuevaOperacion.tipo === 'retirada-hucha' ? (
                <>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider opacity-90 block mb-2">Cuenta Origen</label>
                    <select
                      value={formNuevaOperacion.cuentaOrigen}
                      onChange={(e) => setFormNuevaOperacion({...formNuevaOperacion, cuentaOrigen: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white focus:ring-2 focus:ring-white/50 focus:border-white/50"
                    >
                      <option value="Ahorro" className="text-slate-900">Ahorro (Imagin)</option>
                      <option value="BBVA" className="text-slate-900">BBVA</option>
                      <option value="Imagin" className="text-slate-900">Imagin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider opacity-90 block mb-2">Cuenta Destino</label>
                    <select
                      value={formNuevaOperacion.cuentaDestino}
                      onChange={(e) => setFormNuevaOperacion({...formNuevaOperacion, cuentaDestino: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white focus:ring-2 focus:ring-white/50 focus:border-white/50"
                    >
                      <option value="BBVA" className="text-slate-900">BBVA</option>
                      <option value="Imagin" className="text-slate-900">Imagin</option>
                    </select>
                  </div>
                </>
              ) : formNuevaOperacion.tipo === 'hucha' ? (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider opacity-90 block mb-2">Cuenta de origen</label>
                  <select
                    value={formNuevaOperacion.cuenta}
                    onChange={(e) => setFormNuevaOperacion({...formNuevaOperacion, cuenta: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  >
                    <option value="BBVA" className="text-slate-900">BBVA</option>
                    <option value="Imagin" className="text-slate-900">Imagin</option>
                  </select>
                </div>
              ) : formNuevaOperacion.tipo !== 'retirada-hucha' ? (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider opacity-90 block mb-2">Cuenta</label>
                  <select
                    value={formNuevaOperacion.cuenta}
                    onChange={(e) => setFormNuevaOperacion({...formNuevaOperacion, cuenta: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  >
                    <option value="BBVA" className="text-slate-900">BBVA</option>
                    <option value="Imagin" className="text-slate-900">Imagin</option>
                  </select>
                </div>
              ) : null}

              <button
                type="submit"
                className="w-full py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition-colors shadow-lg"
              >
                Guardar Operación
              </button>
            </form>
          </div>

          {/* Widget de Actividad Reciente */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-slate-200 dark:border-stone-800 shadow-sm">
            <h3 className="font-bold flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-purple-600" />
              Actividad Reciente
            </h3>
            {actividad.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-stone-800">
                {actividad.slice(0, 5).map((act, idx) => {
                  // Detectar tipo de operación
                  const esTraspaso = act.tipo === 'retirada-hucha' && act.info?.includes('Traspaso desde');
                  const tipoLabel = esTraspaso ? 'Traspaso' :
                                   act.tipo === 'gasto' ? 'Gasto' :
                                   act.tipo === 'ingreso' ? 'Ingreso' : 
                                   act.tipo === 'hucha' ? 'Ahorro' : act.tipo;
                  
                  return (
                    <div key={act.id || idx} className="flex gap-3 relative">
                      <div className={`w-6 h-6 rounded-full ${
                        esTraspaso ? 'bg-blue-100 dark:bg-blue-900/40' :
                        act.tipo === 'gasto' ? 'bg-red-100 dark:bg-red-900/40' :
                        act.tipo === 'ingreso' ? 'bg-green-100 dark:bg-green-900/40' :
                        'bg-purple-100 dark:bg-purple-900/40'
                      } border-4 border-white dark:border-stone-900 z-10 flex-shrink-0`}></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <span className={`text-sm font-bold ${
                              esTraspaso ? 'text-blue-600 dark:text-blue-400' :
                              act.tipo === 'gasto' ? 'text-red-600 dark:text-red-400' :
                              act.tipo === 'ingreso' ? 'text-green-600 dark:text-green-400' :
                              'text-purple-600 dark:text-purple-400'
                            }`}>
                              {tipoLabel}
                            </span>
                            <span className={`text-sm font-semibold ${
                              parseFloat(act.cantidad) < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                            }`}>
                              {parseFloat(act.cantidad) < 0 ? '-' : '+'}{Math.abs(parseFloat(act.cantidad) || 0).toFixed(2)}€
                            </span>
                          </div>
                          {act.usuario && (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-slate-400 flex-shrink-0">
                              {act.usuario}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {new Date(act.fecha).toLocaleDateString('es-ES', { 
                            day: '2-digit', 
                            month: 'short', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No hay actividad reciente</p>
              </div>
            )}
          </div>

          {/* Widget de Meta - Viaje a Japón */}
          <div className="bg-gradient-to-br from-purple-600 to-rose-400 p-8 rounded-3xl text-white shadow-xl">
            {metas.filter(m => !m.completada).length > 0 ? (
              metas.filter(m => !m.completada).map(meta => {
                const progreso = (meta.cantidad_actual / meta.cantidad_objetivo) * 100;
                return (
                  <div key={meta.id}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                        <Target className="w-6 h-6" />
                      </div>
                      <span className="bg-white/20 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Meta Familiar</span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{meta.nombre}</h3>
                    <p className="text-white/80 text-sm mb-6 font-medium">
                      Habéis ahorrado el {progreso.toFixed(0)}%
                    </p>
                    <div className="w-full bg-white/20 h-4 rounded-full overflow-hidden mb-3 p-1">
                      <div 
                        className="bg-white h-full rounded-full transition-all"
                        style={{ width: `${Math.min(progreso, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                      <span>{formatAmount(meta.cantidad_actual || 0)} €</span>
                      <span>{formatAmount(meta.cantidad_objetivo || 0)} €</span>
                    </div>
                    <button
                      onClick={() => setModalEditarMeta({ abierto: true, meta })}
                      className="w-full mt-6 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all"
                    >
                      Editar Meta
                    </button>
                  </div>
                );
              })
            ) : (
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <Target className="w-6 h-6" />
                  </div>
                  <span className="bg-white/20 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Meta Familiar</span>
                </div>
                <h3 className="text-xl font-bold mb-1">Sin meta activa</h3>
                <p className="text-white/80 text-sm mb-6 font-medium">Crea una meta para empezar a ahorrar</p>
                <button
                  onClick={() => setModalEditarMeta({ abierto: true, meta: {
                    nombre: 'Viaje a Japón 2025',
                    cantidad_objetivo: 5000,
                    cantidad_actual: 0,
                    fecha_inicio: new Date().toISOString().split('T')[0],
                    fecha_objetivo: '',
                    categoria: 'Viajes',
                    notas: '',
                    completada: false
                  }})}
                  className="w-full mt-6 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all"
                >
                  Crear Meta
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Editar Presupuesto */}
      {modalEditarPresupuesto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-stone-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-stone-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Editar Presupuesto Mensual</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Define tus objetivos de gasto para {mesSeleccionado.charAt(0).toUpperCase() + mesSeleccionado.slice(1)} {añoSeleccionado}
                </p>
              </div>
              <button 
                onClick={() => setModalEditarPresupuesto(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {categorias.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.nombre} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-${cat.color}-100 dark:bg-${cat.color}-900/30 flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 text-${cat.color}-600 dark:text-${cat.color}-400`} />
                      </div>
                      <span className="font-semibold">{cat.nombre}</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={presupuestosEditables[cat.nombre] || 0}
                      onChange={(e) => setPresupuestosEditables({
                        ...presupuestosEditables,
                        [cat.nombre]: parseFloat(e.target.value) || 0
                      })}
                      className="w-32 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800 text-right font-bold"
                    />
                  </div>
                );
              })}
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-stone-800 flex justify-end gap-3">
              <button
                onClick={() => setModalEditarPresupuesto(false)}
                className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarPresupuestos}
                className="px-6 py-2.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {modalEliminar.abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-stone-800 overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-center mb-2">Confirmar Eliminación</h2>
              <p className="text-slate-500 dark:text-slate-400 text-center mb-6">
                ¿Estás seguro de que quieres eliminar esta operación? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setModalEliminar({ abierto: false, id: null })}
                  className="flex-1 px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleEliminarOperacion(modalEliminar.id)}
                  className="flex-1 px-6 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Operación */}
      {modalEditarOperacion.abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-stone-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-stone-800 flex justify-between items-center">
              <h2 className="text-xl font-bold">Editar Operación</h2>
              <button 
                onClick={() => setModalEditarOperacion({ abierto: false, operacion: null })}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditarOperacion} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Fecha</label>
                <input
                  type="date"
                  value={modalEditarOperacion.operacion?.fecha || ''}
                  onChange={(e) => setModalEditarOperacion({
                    ...modalEditarOperacion,
                    operacion: { ...modalEditarOperacion.operacion, fecha: e.target.value }
                  })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Tipo</label>
                <select
                  value={modalEditarOperacion.operacion?.tipo || 'gasto'}
                  onChange={(e) => setModalEditarOperacion({
                    ...modalEditarOperacion,
                    operacion: { ...modalEditarOperacion.operacion, tipo: e.target.value }
                  })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800"
                  required
                >
                  <option value="gasto">Gasto</option>
                  <option value="ingreso">Ingreso</option>
                  <option value="hucha">Hucha</option>
                  <option value="retirada-hucha">Retirada Hucha</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Cantidad</label>
                <input
                  type="number"
                  step="0.01"
                  value={modalEditarOperacion.operacion?.cantidad || ''}
                  onChange={(e) => setModalEditarOperacion({
                    ...modalEditarOperacion,
                    operacion: { ...modalEditarOperacion.operacion, cantidad: e.target.value }
                  })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Concepto</label>
                <input
                  type="text"
                  value={modalEditarOperacion.operacion?.info || ''}
                  onChange={(e) => setModalEditarOperacion({
                    ...modalEditarOperacion,
                    operacion: { ...modalEditarOperacion.operacion, info: e.target.value }
                  })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800"
                />
              </div>

              {modalEditarOperacion.operacion?.tipo === 'gasto' && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Categoría</label>
                  <select
                    value={modalEditarOperacion.operacion?.categoria || ''}
                    onChange={(e) => setModalEditarOperacion({
                      ...modalEditarOperacion,
                      operacion: { ...modalEditarOperacion.operacion, categoria: e.target.value }
                    })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800"
                  >
                    {categorias.map(cat => (
                      <option key={cat.nombre} value={cat.nombre}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              {modalEditarOperacion.operacion?.tipo === 'retirada-hucha' ? (
                <>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Cuenta Origen</label>
                    <select
                      value={(() => {
                        if (modalEditarOperacion.operacion?.cuentaOrigen) return modalEditarOperacion.operacion.cuentaOrigen;
                        const match = modalEditarOperacion.operacion?.info?.match(/Traspaso desde (.+?) a/);
                        return match ? match[1] : 'Ahorro';
                      })()}
                      onChange={(e) => setModalEditarOperacion({
                        ...modalEditarOperacion,
                        operacion: { ...modalEditarOperacion.operacion, cuentaOrigen: e.target.value }
                      })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800"
                    >
                      <option value="Ahorro">Ahorro (Imagin)</option>
                      <option value="BBVA">BBVA</option>
                      <option value="Imagin">Imagin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Cuenta Destino</label>
                    <select
                      value={(() => {
                        if (modalEditarOperacion.operacion?.cuentaDestino) return modalEditarOperacion.operacion.cuentaDestino;
                        const match = modalEditarOperacion.operacion?.info?.match(/a (.+?)(?:\s*-|$)/);
                        return match ? match[1] : modalEditarOperacion.operacion?.cuenta || 'BBVA';
                      })()}
                      onChange={(e) => setModalEditarOperacion({
                        ...modalEditarOperacion,
                        operacion: { ...modalEditarOperacion.operacion, cuentaDestino: e.target.value }
                      })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800"
                    >
                      <option value="BBVA">BBVA</option>
                      <option value="Imagin">Imagin</option>
                    </select>
                  </div>
                </>
              ) : modalEditarOperacion.operacion?.tipo !== 'ahorro' ? (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Cuenta</label>
                  <select
                    value={modalEditarOperacion.operacion?.cuenta || ''}
                    onChange={(e) => setModalEditarOperacion({
                      ...modalEditarOperacion,
                      operacion: { ...modalEditarOperacion.operacion, cuenta: e.target.value }
                    })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800"
                  >
                    <option value="BBVA">BBVA</option>
                    <option value="Imagin">Imagin</option>
                  </select>
                </div>
              ) : null}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalEditarOperacion({ abierto: false, operacion: null })}
                  className="flex-1 px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-2.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Meta */}
      {modalEditarMeta.abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-stone-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-stone-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">
                  {modalEditarMeta.meta?.id ? 'Editar Meta' : 'Nueva Meta de Ahorro'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Define tu objetivo de ahorro
                </p>
              </div>
              <button 
                onClick={() => setModalEditarMeta({ abierto: false, meta: null })}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGuardarMeta} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Nombre de la Meta</label>
                <input
                  type="text"
                  value={modalEditarMeta.meta?.nombre || ''}
                  onChange={(e) => setModalEditarMeta({
                    ...modalEditarMeta,
                    meta: { ...modalEditarMeta.meta, nombre: e.target.value }
                  })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800"
                  placeholder="Ej: Vacaciones, Coche nuevo..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Cantidad Objetivo</label>
                  <input
                    type="number"
                    step="0.01"
                    value={modalEditarMeta.meta?.cantidad_objetivo || 0}
                    onChange={(e) => setModalEditarMeta({
                      ...modalEditarMeta,
                      meta: { ...modalEditarMeta.meta, cantidad_objetivo: parseFloat(e.target.value) }
                    })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Cantidad Actual</label>
                  <input
                    type="number"
                    step="0.01"
                    value={modalEditarMeta.meta?.cantidad_actual || 0}
                    onChange={(e) => setModalEditarMeta({
                      ...modalEditarMeta,
                      meta: { ...modalEditarMeta.meta, cantidad_actual: parseFloat(e.target.value) }
                    })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Fecha Inicio</label>
                  <input
                    type="date"
                    value={modalEditarMeta.meta?.fecha_inicio || ''}
                    onChange={(e) => setModalEditarMeta({
                      ...modalEditarMeta,
                      meta: { ...modalEditarMeta.meta, fecha_inicio: e.target.value }
                    })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Fecha Objetivo</label>
                  <input
                    type="date"
                    value={modalEditarMeta.meta?.fecha_objetivo || ''}
                    onChange={(e) => setModalEditarMeta({
                      ...modalEditarMeta,
                      meta: { ...modalEditarMeta.meta, fecha_objetivo: e.target.value }
                    })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Notas</label>
                <textarea
                  value={modalEditarMeta.meta?.notas || ''}
                  onChange={(e) => setModalEditarMeta({
                    ...modalEditarMeta,
                    meta: { ...modalEditarMeta.meta, notas: e.target.value }
                  })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800"
                  rows="3"
                  placeholder="Notas adicionales..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalEditarMeta({ abierto: false, meta: null })}
                  className="flex-1 px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-2.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
                >
                  Guardar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Cierre del div principal className="p-8 space-y-8" */}
    </div>
  );
};

export default ParvosAccount;