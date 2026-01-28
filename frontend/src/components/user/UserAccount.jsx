import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CreditCard,
  Coffee,
  Briefcase,
  Building2
} from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../stores/authStore';
import bbvaLogo from '../../assets/BBVA_2019.svg.png';
import { usePrivacyFormatter } from '../../utils/privacyFormatter';

const meses = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const UserAccount = () => {
  const { user } = useAuthStore();
  const formatAmount = usePrivacyFormatter();
  const [operaciones, setOperaciones] = useState([]);
  const [filtros, setFiltros] = useState({
    tipo: 'todos',
    categoria: 'todas',
    cuenta: 'todas'
  });
  
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
  const [modalEliminar, setModalEliminar] = useState({ abierto: false, id: null });
  const [modalEditarOperacion, setModalEditarOperacion] = useState({ abierto: false, operacion: null });
  const [modalEditarPresupuesto, setModalEditarPresupuesto] = useState(false);

  // Estados para presupuestos
  const [presupuestos, setPresupuestos] = useState([]);
  const [presupuestosEditables, setPresupuestosEditables] = useState({});
  
  // Todas las operaciones (sin filtrar) para cálculos de ahorro
  const [todasLasOperaciones, setTodasLasOperaciones] = useState([]);

  // Cuentas según usuario
  const cuentasUsuario = user?.username === 'xurxo' 
    ? ['Santander', 'Prepago']
    : ['BBVA', 'Virtual'];

  const [formNuevaOperacion, setFormNuevaOperacion] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'expense',
    cantidad: '',
    descripcion: '',
    categoria: 'Alimentación',
    cuenta: cuentasUsuario[0],
    cuentaOrigen: 'Ahorro',
    cuentaDestino: cuentasUsuario[0]
  });

  const categorias = [
    { nombre: 'Alimentación', icon: ShoppingCart, color: 'amber' },
    { nombre: 'Deporte', icon: Dumbbell, color: 'cyan' },
    { nombre: 'Ocio', icon: Utensils, color: 'red' },
    { nombre: 'Hogar', icon: HomeIcon, color: 'emerald' },
    { nombre: 'Movilidad', icon: Car, color: 'blue' },
    { nombre: 'Extra', icon: Plus, color: 'purple' },
    { nombre: 'Vacaciones', icon: Plane, color: 'orange' },
    { nombre: 'Café', icon: Coffee, color: 'orange' },
    { nombre: 'Trabajo', icon: Briefcase, color: 'slate' },
    { nombre: 'Banco', icon: Building2, color: 'indigo' }
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

  const cargarDatos = useCallback(async () => {
    try {
      const mesIdx = meses.indexOf(mesSeleccionado);
      const mesFormato = `${añoSeleccionado}-${String(mesIdx + 1).padStart(2, '0')}`;
      
      // Cargar operaciones del mes
      try {
        const opsResponse = await api.get('/api/user/operations', { params: { mes: mesFormato } });
        setOperaciones(opsResponse.data || []);
      } catch (opsError) {
        console.error('Error al cargar operaciones:', opsError);
        setOperaciones([]);
      }

      // Cargar todas las operaciones (sin filtrar) para cálculos de ahorro acumulado
      try {
        const allOpsResponse = await api.get('/api/user/operations');
        setTodasLasOperaciones(allOpsResponse.data || []);
      } catch (allOpsError) {
        console.error('Error al cargar todas las operaciones:', allOpsError);
        setTodasLasOperaciones([]);
      }

      // Cargar presupuestos
      try {
        const budgetsResponse = await api.get('/api/user/budgets');
        setPresupuestos(budgetsResponse.data || []);
      } catch (budgetsError) {
        console.error('Error al cargar presupuestos:', budgetsError);
        setPresupuestos([]);
      }
    } catch (error) {
      console.error('Error al cargar datos personales:', error);
    }
  }, [mesSeleccionado, añoSeleccionado]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Las operaciones ya vienen filtradas por mes desde el backend
  const operacionesDelMes = operaciones;

  // Calcular totales
  const calcularTotales = () => {
    const cuenta1 = cuentasUsuario[0];
    const cuenta2 = cuentasUsuario[1];

    const totalCuenta1 = todasLasOperaciones
      .filter(op => op.account_name === cuenta1 && op.type !== 'savings')
      .reduce((sum, op) => {
        if (op.type === 'income' || op.type === 'savings_withdrawal') return sum + parseFloat(op.amount || 0);
        if (op.type === 'expense') return sum - parseFloat(op.amount || 0);
        return sum;
      }, 0);

    const totalCuenta2 = todasLasOperaciones
      .filter(op => op.account_name === cuenta2 && op.type !== 'savings')
      .reduce((sum, op) => {
        if (op.type === 'income' || op.type === 'savings_withdrawal') return sum + parseFloat(op.amount || 0);
        if (op.type === 'expense') return sum - parseFloat(op.amount || 0);
        return sum;
      }, 0);

    return {
      cuenta1: totalCuenta1,
      cuenta2: totalCuenta2,
      total: totalCuenta1 + totalCuenta2
    };
  };

  // Calcular ahorro acumulado hasta el mes seleccionado
  const calcularAhorro = () => {
    const mesIdx = meses.indexOf(mesSeleccionado);
    
    const operacionesHastaAhora = todasLasOperaciones.filter(op => {
      const fecha = new Date(op.date);
      const mesOp = fecha.getMonth();
      const añoOp = fecha.getFullYear();
      
      if (añoOp < añoSeleccionado) return true;
      if (añoOp === añoSeleccionado && mesOp <= mesIdx) return true;
      return false;
    });

    const ahorroAcumulado = operacionesHastaAhora
      .filter(op => op.type === 'savings')
      .reduce((sum, op) => sum + parseFloat(op.amount || 0), 0);

    const retiradaAcumulada = operacionesHastaAhora
      .filter(op => op.type === 'savings_withdrawal' && op.account_name === 'Ahorro')
      .reduce((sum, op) => sum + Math.abs(parseFloat(op.amount || 0)), 0);

    const ahorroActual = ahorroAcumulado - retiradaAcumulada;

    // Calcular ahorro del mes anterior
    const mesAnteriorIdx = mesIdx === 0 ? 11 : mesIdx - 1;
    const añoAnterior = mesIdx === 0 ? añoSeleccionado - 1 : añoSeleccionado;

    const operacionesHastaMesAnterior = todasLasOperaciones.filter(op => {
      const fecha = new Date(op.date);
      const mesOp = fecha.getMonth();
      const añoOp = fecha.getFullYear();
      
      if (añoOp < añoAnterior) return true;
      if (añoOp === añoAnterior && mesOp <= mesAnteriorIdx) return true;
      return false;
    });

    const ahorroAnterior = operacionesHastaMesAnterior
      .filter(op => op.type === 'savings')
      .reduce((sum, op) => sum + parseFloat(op.amount || 0), 0) -
      operacionesHastaMesAnterior
      .filter(op => op.type === 'savings_withdrawal' && op.account_name === 'Ahorro')
      .reduce((sum, op) => sum + Math.abs(parseFloat(op.amount || 0)), 0);

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
        .filter(op => op.type === 'expense' && op.category === cat.nombre)
        .reduce((sum, op) => sum + parseFloat(op.amount || 0), 0);

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
        .filter(op => op.type === 'expense' && op.category === cat.nombre)
        .reduce((sum, op) => sum + parseFloat(op.amount || 0), 0);

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
    if (filtros.tipo !== 'todos' && op.type !== filtros.tipo) return false;
    if (filtros.categoria !== 'todas' && op.category !== filtros.categoria) return false;
    if (filtros.cuenta !== 'todas' && op.account_name !== filtros.cuenta) return false;
    
    // Búsqueda por texto
    if (busqueda.trim() !== '') {
      const searchTerm = busqueda.toLowerCase();
      const concepto = (op.description || '').toLowerCase();
      const categoria = (op.category || '').toLowerCase();
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
        comparacion = new Date(a.date) - new Date(b.date);
        break;
      case 'tipo':
        comparacion = (a.type || '').localeCompare(b.type || '');
        break;
      case 'cantidad':
        comparacion = parseFloat(a.amount || 0) - parseFloat(b.amount || 0);
        break;
      case 'categoria':
        comparacion = (a.category || '').localeCompare(b.category || '');
        break;
      case 'cuenta':
        comparacion = (a.account_name || '').localeCompare(b.account_name || '');
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
      // Para traspasos (retiradas), construir descripción especial y usar cuenta destino
      let accountName = formNuevaOperacion.cuenta;
      let description = formNuevaOperacion.descripcion;
      
      if (formNuevaOperacion.tipo === 'savings_withdrawal') {
        accountName = formNuevaOperacion.cuentaDestino;
        description = `Traspaso desde ${formNuevaOperacion.cuentaOrigen} a ${formNuevaOperacion.cuentaDestino}${formNuevaOperacion.descripcion ? ' - ' + formNuevaOperacion.descripcion : ''}`;
      }
      
      await api.post('/api/user/operations', {
        account_name: accountName,
        date: formNuevaOperacion.fecha,
        type: formNuevaOperacion.tipo,
        amount: parseFloat(formNuevaOperacion.cantidad),
        description: description,
        category: formNuevaOperacion.tipo === 'expense' ? formNuevaOperacion.categoria : ''
      });
      
      setFormNuevaOperacion({
        fecha: new Date().toISOString().split('T')[0],
        tipo: 'expense',
        cantidad: '',
        descripcion: '',
        categoria: 'Alimentación',
        cuenta: cuentasUsuario[0],
        cuentaOrigen: 'Ahorro',
        cuentaDestino: cuentasUsuario[0]
      });
      cargarDatos();
    } catch (error) {
      console.error('Error al crear operación personal:', error);
    }
  };

  const handleEliminarOperacion = async (id) => {
    try {
      await api.delete(`/api/user/operations/${id}`);
      setModalEliminar({ abierto: false, id: null });
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar operación personal:', error);
    }
  };

  const handleEditarOperacion = async (e) => {
    e.preventDefault();
    try {
      let accountName = modalEditarOperacion.operacion.account_name;
      let description = modalEditarOperacion.operacion.description;
      
      // Si es un traspaso y tiene cuentaOrigen y cuentaDestino, reconstruir la descripción
      if (modalEditarOperacion.operacion.type === 'savings_withdrawal' && 
          modalEditarOperacion.operacion.cuentaOrigen && 
          modalEditarOperacion.operacion.cuentaDestino) {
        accountName = modalEditarOperacion.operacion.cuentaDestino;
        // Extraer el concepto adicional si existe
        const conceptoMatch = modalEditarOperacion.operacion.description.match(/Traspaso desde .+ a .+(?: - (.+))?$/);
        const concepto = conceptoMatch && conceptoMatch[1] ? conceptoMatch[1] : '';
        description = `Traspaso desde ${modalEditarOperacion.operacion.cuentaOrigen} a ${modalEditarOperacion.operacion.cuentaDestino}${concepto ? ' - ' + concepto : ''}`;
      }
      
      await api.put(`/api/user/operations/${modalEditarOperacion.operacion.id}`, {
        account_name: accountName,
        date: modalEditarOperacion.operacion.date,
        type: modalEditarOperacion.operacion.type,
        amount: parseFloat(modalEditarOperacion.operacion.amount),
        description: description,
        category: modalEditarOperacion.operacion.type === 'expense' ? modalEditarOperacion.operacion.category : ''
      });
      setModalEditarOperacion({ abierto: false, operacion: null });
      cargarDatos();
    } catch (error) {
      console.error('Error al actualizar operación personal:', error);
    }
  };

  const handleGuardarPresupuestos = async () => {
    try {
      const mesIdx = meses.indexOf(mesSeleccionado);
      await api.post(`/api/user/budgets/${añoSeleccionado}/${mesIdx}`, {
        presupuestos: presupuestosEditables
      });
      setModalEditarPresupuesto(false);
      cargarDatos();
    } catch (error) {
      console.error('Error al guardar presupuestos:', error);
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

  // Mapeo de tipos para mostrar
  const tipoLabel = (tipo) => {
    const tipos = {
      'expense': 'Gasto',
      'income': 'Ingreso',
      'savings': 'Ahorro',
      'savings_withdrawal': 'Retirada'
    };
    return tipos[tipo] || tipo;
  };

  // Formatear fecha de Date a YYYY-MM-DD
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toISOString().split('T')[0];
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
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight lg:order-1">
            Mi Cuenta Personal - {user?.username === 'xurxo' ? 'Xurxo' : 'Sonia'}
          </h1>
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

      {/* Tarjetas de Balance */}
      <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 lg:gap-6 p-4 lg:p-0">
        {/* Balance Total */}
        <div className="col-span-2 lg:col-span-3 bg-white dark:bg-stone-900 p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-slate-200 dark:border-stone-800 shadow-sm">
          <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Balance Total</p>
          <h2 className="text-2xl lg:text-4xl font-extrabold text-emerald-500">{formatAmount(totales.total || 0)} €</h2>
        </div>

        {/* Cuenta 1 */}
        <div className="lg:col-span-3 bg-white dark:bg-stone-900 p-4 lg:p-5 rounded-2xl border border-slate-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{cuentasUsuario[0]}</p>
            <h3 className="text-lg lg:text-xl font-bold">{formatAmount(totales.cuenta1 || 0)} €</h3>
          </div>
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-800/30">
            {cuentasUsuario[0] === 'BBVA' ? (
              <img src={bbvaLogo} alt="BBVA" className="w-8 h-8 lg:w-10 lg:h-10 object-contain" />
            ) : (
              <CreditCard className="w-6 h-6 lg:w-7 lg:h-7 text-blue-600" />
            )}
          </div>
        </div>

        {/* Cuenta 2 */}
        <div className="lg:col-span-3 bg-white dark:bg-stone-900 p-4 lg:p-5 rounded-2xl border border-slate-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{cuentasUsuario[1]}</p>
            <h3 className="text-lg lg:text-xl font-bold">{formatAmount(totales.cuenta2 || 0)} €</h3>
          </div>
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center border border-purple-100 dark:border-purple-800/30">
            <CreditCard className="w-6 h-6 lg:w-7 lg:h-7 text-purple-600" />
          </div>
        </div>

        {/* Ahorro Total */}
        <div className="col-span-2 lg:col-span-3 bg-gradient-to-br from-emerald-500 to-teal-600 p-4 lg:p-5 rounded-2xl shadow-sm flex flex-col justify-between text-white">
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
          {/* Gráfico de Gastos por Categoría */}
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
                
                const coloresBarras = {
                  'amber': 'bg-amber-400',
                  'cyan': 'bg-cyan-400',
                  'red': 'bg-red-400',
                  'emerald': 'bg-emerald-400',
                  'blue': 'bg-blue-400',
                  'purple': 'bg-purple-400',
                  'orange': 'bg-orange-400',
                  'slate': 'bg-slate-400',
                  'indigo': 'bg-indigo-400'
                };

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 w-full h-full">
                    <div className="relative w-full flex-1 flex flex-col justify-end">
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
                      <td className="py-3">{formatAmount(item.presupuesto || 0)} €</td>
                      <td className="py-3 text-blue-500 font-bold">{formatAmount(item.gastado || 0)} €</td>
                      <td className={`py-3 font-bold text-right ${item.diferencia >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {item.diferencia >= 0 ? '+' : ''}{formatAmount(item.diferencia || 0)} €
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50/50 dark:bg-stone-800/30 font-bold">
                    <td className="py-3">TOTAL</td>
                    <td className="py-3">{formatAmount(presupuestoVsReal.reduce((sum, item) => sum + item.presupuesto, 0))} €</td>
                    <td className="py-3 text-blue-600">{formatAmount(presupuestoVsReal.reduce((sum, item) => sum + item.gastado, 0))} €</td>
                    <td className={`py-3 text-right ${presupuestoVsReal.reduce((sum, item) => sum + item.diferencia, 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatAmount(presupuestoVsReal.reduce((sum, item) => sum + item.diferencia, 0))} €
                    </td>
                  </tr>
                </tbody>
              </table>
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
                      <option value="expense">Gasto</option>
                      <option value="income">Ingreso</option>
                      <option value="savings">Ahorro</option>
                      <option value="savings_withdrawal">Retirada</option>
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
                      {cuentasUsuario.map(cuenta => (
                        <option key={cuenta} value={cuenta}>{cuenta}</option>
                      ))}
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
                            op.type === 'expense' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                            op.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            op.type === 'savings' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                            'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {tipoLabel(op.type)}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">{formatearFecha(op.date)}</span>
                        </div>
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {op.description || op.category}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500 dark:text-slate-400">{op.category}</span>
                          <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{op.account_name}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-lg font-bold ${
                          op.type === 'expense' ? 'text-red-500' : 'text-emerald-500'
                        }`}>
                          {formatAmount(parseFloat(op.amount) || 0)} €
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
                        <td className="px-6 py-4 font-medium text-slate-400">{formatearFecha(op.date)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            op.type === 'expense' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                            op.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            op.type === 'savings' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                            'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {tipoLabel(op.type)}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-right font-bold ${
                          op.type === 'expense' ? 'text-red-500' : 'text-emerald-500'
                        }`}>
                          {formatAmount(parseFloat(op.amount) || 0)} €
                        </td>
                        <td className="px-6 py-4 text-slate-500 italic">{op.description || '-'}</td>
                        <td className="px-6 py-4 font-medium">{op.category}</td>
                        <td className="px-6 py-4 font-medium">{op.account_name}</td>
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
                    onClick={() => setFormNuevaOperacion({...formNuevaOperacion, tipo: 'expense'})}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      formNuevaOperacion.tipo === 'expense'
                        ? 'bg-white text-purple-600 shadow-lg'
                        : 'bg-white/20 border border-white/30 text-white'
                    }`}
                  >
                    Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormNuevaOperacion({...formNuevaOperacion, tipo: 'income'})}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      formNuevaOperacion.tipo === 'income'
                        ? 'bg-white text-purple-600 shadow-lg'
                        : 'bg-white/20 border border-white/30 text-white'
                    }`}
                  >
                    Ingreso
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormNuevaOperacion({...formNuevaOperacion, tipo: 'savings'})}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      formNuevaOperacion.tipo === 'savings'
                        ? 'bg-white text-purple-600 shadow-lg'
                        : 'bg-white/20 border border-white/30 text-white'
                    }`}
                  >
                    Ahorro
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormNuevaOperacion({...formNuevaOperacion, tipo: 'savings_withdrawal'})}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      formNuevaOperacion.tipo === 'savings_withdrawal'
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

              {formNuevaOperacion.tipo === 'expense' && (
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

              {formNuevaOperacion.tipo === 'savings_withdrawal' ? (
                <>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider opacity-90 block mb-2">Cuenta Origen</label>
                    <select
                      value={formNuevaOperacion.cuentaOrigen}
                      onChange={(e) => setFormNuevaOperacion({...formNuevaOperacion, cuentaOrigen: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white focus:ring-2 focus:ring-white/50 focus:border-white/50"
                    >
                      <option value="Ahorro" className="text-slate-900">Ahorro</option>
                      {cuentasUsuario.map(cuenta => (
                        <option key={cuenta} value={cuenta} className="text-slate-900">{cuenta}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider opacity-90 block mb-2">Cuenta Destino</label>
                    <select
                      value={formNuevaOperacion.cuentaDestino}
                      onChange={(e) => setFormNuevaOperacion({...formNuevaOperacion, cuentaDestino: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white focus:ring-2 focus:ring-white/50 focus:border-white/50"
                    >
                      {cuentasUsuario.map(cuenta => (
                        <option key={cuenta} value={cuenta} className="text-slate-900">{cuenta}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : formNuevaOperacion.tipo === 'savings' ? (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider opacity-90 block mb-2">Cuenta de origen</label>
                  <select
                    value={formNuevaOperacion.cuenta}
                    onChange={(e) => setFormNuevaOperacion({...formNuevaOperacion, cuenta: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  >
                    {cuentasUsuario.map(cuenta => (
                      <option key={cuenta} value={cuenta} className="text-slate-900">{cuenta}</option>
                    ))}
                  </select>
                </div>
              ) : formNuevaOperacion.tipo !== 'savings_withdrawal' ? (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider opacity-90 block mb-2">Cuenta</label>
                  <select
                    value={formNuevaOperacion.cuenta}
                    onChange={(e) => setFormNuevaOperacion({...formNuevaOperacion, cuenta: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  >
                    {cuentasUsuario.map(cuenta => (
                      <option key={cuenta} value={cuenta} className="text-slate-900">{cuenta}</option>
                    ))}
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
        </div>
      </div>

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
                  value={formatearFecha(modalEditarOperacion.operacion?.date) || ''}
                  onChange={(e) => setModalEditarOperacion({
                    ...modalEditarOperacion,
                    operacion: { ...modalEditarOperacion.operacion, date: e.target.value }
                  })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Tipo</label>
                <select
                  value={modalEditarOperacion.operacion?.type || 'expense'}
                  onChange={(e) => setModalEditarOperacion({
                    ...modalEditarOperacion,
                    operacion: { ...modalEditarOperacion.operacion, type: e.target.value }
                  })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800"
                  required
                >
                  <option value="expense">Gasto</option>
                  <option value="income">Ingreso</option>
                  <option value="savings">Ahorro</option>
                  <option value="savings_withdrawal">Retirada</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Cantidad</label>
                <input
                  type="number"
                  step="0.01"
                  value={modalEditarOperacion.operacion?.amount || ''}
                  onChange={(e) => setModalEditarOperacion({
                    ...modalEditarOperacion,
                    operacion: { ...modalEditarOperacion.operacion, amount: e.target.value }
                  })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Concepto</label>
                <input
                  type="text"
                  value={modalEditarOperacion.operacion?.description || ''}
                  onChange={(e) => setModalEditarOperacion({
                    ...modalEditarOperacion,
                    operacion: { ...modalEditarOperacion.operacion, description: e.target.value }
                  })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800"
                />
              </div>

              {modalEditarOperacion.operacion?.type === 'expense' && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Categoría</label>
                  <select
                    value={modalEditarOperacion.operacion?.category || ''}
                    onChange={(e) => setModalEditarOperacion({
                      ...modalEditarOperacion,
                      operacion: { ...modalEditarOperacion.operacion, category: e.target.value }
                    })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800"
                  >
                    {categorias.map(cat => (
                      <option key={cat.nombre} value={cat.nombre}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              {modalEditarOperacion.operacion?.type === 'savings_withdrawal' ? (
                <>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Cuenta Origen</label>
                    <select
                      value={(() => {
                        if (modalEditarOperacion.operacion?.cuentaOrigen) return modalEditarOperacion.operacion.cuentaOrigen;
                        const match = modalEditarOperacion.operacion?.description?.match(/Traspaso desde (.+?) a/);
                        return match ? match[1] : 'Ahorro';
                      })()}
                      onChange={(e) => setModalEditarOperacion({
                        ...modalEditarOperacion,
                        operacion: { ...modalEditarOperacion.operacion, cuentaOrigen: e.target.value }
                      })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800"
                    >
                      <option value="Ahorro">Ahorro</option>
                      {cuentasUsuario.map(cuenta => (
                        <option key={cuenta} value={cuenta}>{cuenta}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Cuenta Destino</label>
                    <select
                      value={(() => {
                        if (modalEditarOperacion.operacion?.cuentaDestino) return modalEditarOperacion.operacion.cuentaDestino;
                        const match = modalEditarOperacion.operacion?.description?.match(/a (.+?)(?:\s*-|$)/);
                        return match ? match[1] : modalEditarOperacion.operacion?.account_name || cuentasUsuario[0];
                      })()}
                      onChange={(e) => setModalEditarOperacion({
                        ...modalEditarOperacion,
                        operacion: { ...modalEditarOperacion.operacion, cuentaDestino: e.target.value }
                      })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800"
                    >
                      {cuentasUsuario.map(cuenta => (
                        <option key={cuenta} value={cuenta}>{cuenta}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : modalEditarOperacion.operacion?.type !== 'savings' ? (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Cuenta</label>
                  <select
                    value={modalEditarOperacion.operacion?.account_name || ''}
                    onChange={(e) => setModalEditarOperacion({
                      ...modalEditarOperacion,
                      operacion: { ...modalEditarOperacion.operacion, account_name: e.target.value }
                    })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800"
                  >
                    {cuentasUsuario.map(cuenta => (
                      <option key={cuenta} value={cuenta}>{cuenta}</option>
                    ))}
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
    </div>
  );
};

export default UserAccount;
