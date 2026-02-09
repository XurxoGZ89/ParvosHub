import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactPaginate from 'react-paginate';
import { 
  ShoppingCart, 
  Home as HomeIcon, 
  Car, 
  Utensils,
  Plus,
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
  ArrowDown,
  CreditCard,
  DollarSign,
  FileText,
  BarChart3,
  ClipboardList
} from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../stores/authStore';
import bbvaLogo from '../../assets/BBVA_2019.svg.png';
import santanderLogo from '../../assets/santander.png';
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
  const [modalEditarMeta, setModalEditarMeta] = useState({ abierto: false, meta: null });

  // Estados para presupuestos
  const [presupuestos, setPresupuestos] = useState([]);
  const [presupuestosEditables, setPresupuestosEditables] = useState({});
  
  // Estados para metas y actividad
  const [metas, setMetas] = useState([]);
  const [actividad, setActividad] = useState([]);
  
  // Todas las operaciones (sin filtrar) para cálculos de ahorro
  const [todasLasOperaciones, setTodasLasOperaciones] = useState([]);

  // Cuentas según usuario
  const cuentasUsuario = user?.username === 'xurxo' 
    ? ['Santander', 'Prepago']
    : ['BBVA', 'Virtual'];

  const [formNuevaOperacion, setFormNuevaOperacion] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'gasto',
    cantidad: '',
    descripcion: '',
    categoria: 'Alimentación',
    cuenta: cuentasUsuario[0],
    cuentaOrigen: 'Ahorro',
    cuentaDestino: cuentasUsuario[0]
  });

  const categorias = [
    { nombre: 'Alimentación', icon: ShoppingCart, color: 'amber' },
    { nombre: 'Ocio', icon: Utensils, color: 'red' },
    { nombre: 'Hogar', icon: HomeIcon, color: 'emerald' },
    { nombre: 'Alquiler', icon: DollarSign, color: 'indigo' },
    { nombre: 'Extra', icon: Plus, color: 'purple' },
    { nombre: 'Recibos', icon: FileText, color: 'slate' },
    { nombre: 'Movilidad', icon: Car, color: 'blue' }
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
        const ops = (opsResponse.data || []).map(op => ({
          ...op,
          type: tipoEnToEs(op.type)
        }));
        setOperaciones(ops);
      } catch (opsError) {
        console.error('Error al cargar operaciones:', opsError);
        setOperaciones([]);
      }

      // Cargar todas las operaciones (sin filtrar) para cálculos de ahorro acumulado y actividad
      try {
        const allOpsResponse = await api.get('/api/user/operations');
        const ops = (allOpsResponse.data || []).map(op => ({
          ...op,
          type: tipoEnToEs(op.type)
        }));
        setTodasLasOperaciones(ops);
        
        // Cargar las últimas 5 operaciones para actividad reciente (ordenadas por fecha desc)
        const actividadReciente = [...ops]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5);
        setActividad(actividadReciente);
      } catch (allOpsError) {
        console.error('Error al cargar todas las operaciones:', allOpsError);
        setTodasLasOperaciones([]);
        setActividad([]);
      }

      // Cargar presupuestos
      try {
        const budgetsResponse = await api.get('/api/user/budgets');
        setPresupuestos(budgetsResponse.data || []);
      } catch (budgetsError) {
        console.error('Error al cargar presupuestos:', budgetsError);
        setPresupuestos([]);
      }

      // Cargar metas
      try {
        const metasResponse = await api.get('/api/user/goals');
        setMetas(metasResponse.data || []);
      } catch (metasError) {
        console.error('Error al cargar metas:', metasError);
        setMetas([]);
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
      .filter(op => op.account_name === cuenta1)
      .reduce((sum, op) => {
        // Ingresos y retiradas suman (positivos), gastos restan (negativos)
        // Operaciones de ahorro (savings): negativas restan, positivas suman
        if (op.type === 'ingreso' || op.type === 'income' || op.type === 'retirada-hucha' || op.type === 'savings_withdrawal') {
          return sum + parseFloat(op.amount || 0);
        }
        if (op.type === 'gasto' || op.type === 'expense') {
          return sum - parseFloat(op.amount || 0);
        }
        if (op.type === 'hucha' || op.type === 'savings') {
          return sum + parseFloat(op.amount || 0); // Ya viene negativo del backend
        }
        return sum;
      }, 0);

    const totalCuenta2 = todasLasOperaciones
      .filter(op => op.account_name === cuenta2)
      .reduce((sum, op) => {
        // Ingresos y retiradas suman (positivos), gastos restan (negativos)
        // Operaciones de ahorro (savings): negativas restan, positivas suman
        if (op.type === 'ingreso' || op.type === 'income' || op.type === 'retirada-hucha' || op.type === 'savings_withdrawal') {
          return sum + parseFloat(op.amount || 0);
        }
        if (op.type === 'gasto' || op.type === 'expense') {
          return sum - parseFloat(op.amount || 0);
        }
        if (op.type === 'hucha' || op.type === 'savings') {
          return sum + parseFloat(op.amount || 0); // Ya viene negativo del backend
        }
        return sum;
      }, 0);

    // Ingresos del mes incluyen ingresos y retiradas a las cuentas principales
    const ingresos = operacionesDelMes
      .filter(op => op.type === 'ingreso' || 
        (op.type === 'retirada-hucha' && (op.account_name === cuenta1 || op.account_name === cuenta2)))
      .reduce((sum, op) => sum + parseFloat(op.amount || 0), 0);

    const gastos = operacionesDelMes
      .filter(op => op.type === 'gasto')
      .reduce((sum, op) => sum + parseFloat(op.amount || 0), 0);

    return {
      cuenta1: totalCuenta1,
      cuenta2: totalCuenta2,
      total: totalCuenta1 + totalCuenta2,
      ingresos,
      gastos
    };
  };

  // Calcular saldos acumulados para cada operación
  const calcularSaldosAcumulados = () => {
    // Ordenar todas las operaciones cronológicamente (fecha + ID para orden de inserción)
    const opsOrdenadas = [...todasLasOperaciones].sort((a, b) => {
      const fechaA = new Date(a.date);
      const fechaB = new Date(b.date);
      if (fechaA.getTime() !== fechaB.getTime()) return fechaA - fechaB;
      return a.id - b.id; // Mismo día: ordenar por ID (orden de inserción)
    });
    
    const saldos = {};
    let saldoCuenta1 = 0;
    let saldoCuenta2 = 0;
    
    opsOrdenadas.forEach(op => {
      // Calcular cambio para cada cuenta (excluyendo savings)
      if (op.account_name === cuentasUsuario[0] && op.type !== 'savings') {
        if (op.type === 'expense' || op.type === 'gasto') {
          saldoCuenta1 -= parseFloat(op.amount || 0);
        } else {
          saldoCuenta1 += parseFloat(op.amount || 0);
        }
      } else if (op.account_name === cuentasUsuario[1] && op.type !== 'savings') {
        if (op.type === 'expense' || op.type === 'gasto') {
          saldoCuenta2 -= parseFloat(op.amount || 0);
        } else {
          saldoCuenta2 += parseFloat(op.amount || 0);
        }
      }
      
      // Guardar saldos para esta operación
      saldos[op.id] = {
        cuenta1: saldoCuenta1,
        cuenta2: saldoCuenta2,
        total: saldoCuenta1 + saldoCuenta2,
        cuenta: op.account_name === cuentasUsuario[0] ? saldoCuenta1 : op.account_name === cuentasUsuario[1] ? saldoCuenta2 : 0
      };
    });
    
    return saldos;
  };

  const saldosAcumulados = calcularSaldosAcumulados();

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

    // Calcular ahorro total: hucha suma, retirada-hucha resta
    const ahorroActual = operacionesHastaAhora
      .filter(op => {
        // Reconocer tanto tipos español como inglés para compatibilidad
        const esHucha = (op.type === 'hucha' || op.type === 'savings') && (op.account_name === 'Ahorro' || op.account_name === null);
        const esRetirada = (op.type === 'retirada-hucha' || op.type === 'savings_withdrawal') && op.account_name === 'Ahorro';
        return esHucha || esRetirada;
      })
      .reduce((sum, op) => {
        if (op.type === 'hucha' || op.type === 'savings') {
          return sum + parseFloat(op.amount || 0);
        } else if (op.type === 'retirada-hucha' || op.type === 'savings_withdrawal') {
          return sum - parseFloat(op.amount || 0);
        }
        return sum;
      }, 0);

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
      .filter(op => {
        // Reconocer tanto tipos español como inglés para compatibilidad
        const esHucha = (op.type === 'hucha' || op.type === 'savings') && (op.account_name === 'Ahorro' || op.account_name === null);
        const esRetirada = (op.type === 'retirada-hucha' || op.type === 'savings_withdrawal') && op.account_name === 'Ahorro';
        return esHucha || esRetirada;
      })
      .reduce((sum, op) => {
        if (op.type === 'hucha' || op.type === 'savings') {
          return sum + parseFloat(op.amount || 0);
        } else if (op.type === 'retirada-hucha' || op.type === 'savings_withdrawal') {
          return sum - parseFloat(op.amount || 0);
        }
        return sum;
      }, 0);

    const diferencia = ahorroActual - ahorroAnterior;
    const porcentaje = ahorroAnterior !== 0 ? ((diferencia / Math.abs(ahorroAnterior)) * 100) : 0;

    return {
      actual: ahorroActual,
      anterior: ahorroAnterior,
      diferencia,
      porcentaje
    };
  };

  // Calcular el saldo total del mes anterior
  const calcularSaldoMesAnterior = () => {
    const mesIdx = meses.indexOf(mesSeleccionado);
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

    const totalCuenta1Anterior = operacionesHastaMesAnterior
      .filter(op => op.account_name === cuentasUsuario[0] && op.type !== 'hucha')
      .reduce((sum, op) => {
        if (op.type === 'ingreso' || op.type === 'retirada-hucha') return sum + parseFloat(op.amount || 0);
        if (op.type === 'gasto') return sum - parseFloat(op.amount || 0);
        return sum;
      }, 0);

    const totalCuenta2Anterior = operacionesHastaMesAnterior
      .filter(op => op.account_name === cuentasUsuario[1] && op.type !== 'hucha')
      .reduce((sum, op) => {
        if (op.type === 'ingreso' || op.type === 'retirada-hucha') return sum + parseFloat(op.amount || 0);
        if (op.type === 'gasto') return sum - parseFloat(op.amount || 0);
        return sum;
      }, 0);

    const nombreMesAnterior = meses[mesAnteriorIdx].charAt(0).toUpperCase() + meses[mesAnteriorIdx].slice(1);

    return {
      total: totalCuenta1Anterior + totalCuenta2Anterior,
      nombreMes: nombreMesAnterior
    };
  };

  // Calcular ingresos y gastos del mes seleccionado
  // eslint-disable-next-line no-unused-vars
  const calcularIngresosGastosDelMes = () => {
    const ingresos = operacionesDelMes
      .filter(op => 
        op.type === 'ingreso' || 
        (op.type === 'retirada-hucha' && op.account_name !== 'Ahorro' && parseFloat(op.amount) > 0)
      )
      .reduce((sum, op) => sum + parseFloat(op.amount || 0), 0);

    const gastos = operacionesDelMes
      .filter(op => op.type === 'gasto')
      .reduce((sum, op) => sum + parseFloat(op.amount || 0), 0);

    return { ingresos, gastos };
  };

  // Calcular gastos por categoría
  const calcularGastosPorCategoria = () => {
    return categorias.map(cat => {
      const gastos = operacionesDelMes
        .filter(op => op.type === 'gasto' && op.category === cat.nombre)
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
      const presupuestoRaw = presupuestosDelMes.find(p => p.categoria === cat.nombre)?.cantidad;
      const presupuesto = parseFloat(presupuestoRaw) || 0;
      const gastado = operacionesDelMes
        .filter(op => op.type === 'gasto' && op.category === cat.nombre)
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
      
      if (formNuevaOperacion.tipo === 'retirada-hucha') {
        accountName = formNuevaOperacion.cuentaDestino;
        description = `Traspaso ${formNuevaOperacion.cuentaOrigen} a ${formNuevaOperacion.cuentaDestino}${formNuevaOperacion.descripcion ? ' - ' + formNuevaOperacion.descripcion : ''}`;
      }
      
      await api.post('/api/user/operations', {
        account_name: accountName,
        date: formNuevaOperacion.fecha,
        type: tipoEsToEn(formNuevaOperacion.tipo),
        amount: parseFloat(formNuevaOperacion.cantidad),
        description: description,
        category: formNuevaOperacion.tipo === 'gasto' ? formNuevaOperacion.categoria : ''
      });
      
      setFormNuevaOperacion({
        fecha: new Date().toISOString().split('T')[0],
        tipo: 'gasto',
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
      if (modalEditarOperacion.operacion.type === 'retirada-hucha' && 
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
        type: tipoEsToEn(modalEditarOperacion.operacion.type),
        amount: parseFloat(modalEditarOperacion.operacion.amount),
        description: description,
        category: modalEditarOperacion.operacion.type === 'gasto' ? modalEditarOperacion.operacion.category : ''
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

  const handleGuardarMeta = async (e) => {
    e.preventDefault();
    try {
      if (modalEditarMeta.meta.id) {
        await api.put(`/api/user/goals/${modalEditarMeta.meta.id}`, modalEditarMeta.meta);
      } else {
        await api.post('/api/user/goals', modalEditarMeta.meta);
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

  // Mapeo de tipos para mostrar
  const tipoLabel = (tipo) => {
    const tipos = {
      'gasto': 'Gasto',
      'ingreso': 'Ingreso',
      'hucha': 'Ahorro',
      'retirada-hucha': 'Retirada'
    };
    return tipos[tipo] || tipo;
  };

  // Formatear fecha de Date a YYYY-MM-DD
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toISOString().split('T')[0];
  };

  // Mapear tipos español -> inglés para API
  const tipoEsToEn = (tipo) => {
    const map = {
      'gasto': 'expense',
      'ingreso': 'income',
      'hucha': 'savings',
      'retirada-hucha': 'savings_withdrawal'
    };
    return map[tipo] || tipo;
  };

  // Mapear tipos inglés -> español para UI
  const tipoEnToEs = (tipo) => {
    const map = {
      'expense': 'gasto',
      'income': 'ingreso',
      'savings': 'hucha',
      'savings_withdrawal': 'retirada-hucha'
    };
    return map[tipo] || tipo;
  };

  const totales = calcularTotales();
  const ahorro = calcularAhorro();
  const saldoMesAnterior = calcularSaldoMesAnterior();
  // const ingresosGastosDelMes = calcularIngresosGastosDelMes();
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
        {/* Saldo Actual */}
        <div className="col-span-2 lg:col-span-3 bg-white dark:bg-stone-900 p-2.5 lg:p-3 rounded-2xl lg:rounded-3xl border border-slate-200 dark:border-stone-800 shadow-sm flex flex-col justify-between">
          <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Saldo Actual</p>
          <h2 className="text-xl lg:text-4xl font-extrabold text-emerald-500">{formatAmount(totales.total || 0)} €</h2>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {formatAmount(saldoMesAnterior.total || 0)} € de {saldoMesAnterior.nombreMes}
          </p>
        </div>

        {/* Card 2: Cuentas */}
        <div className="col-span-2 lg:col-span-3 bg-white dark:bg-stone-900 p-2.5 lg:p-3 rounded-2xl border border-slate-200 dark:border-stone-800 shadow-sm">
          <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Cuentas</p>
          <div className="space-y-1.5">
            {/* Cuenta Principal */}
            <div className="flex items-center justify-between">
              {user?.username === 'xurxo' ? (
                <img src={santanderLogo} alt="Santander" className="w-12 h-12 lg:w-14 lg:h-14 object-contain" />
              ) : (
                <img src={bbvaLogo} alt="BBVA" className="w-12 h-12 lg:w-14 lg:h-14 object-contain" />
              )}
              <h3 className="text-base lg:text-lg font-bold">{formatAmount(totales.cuenta1 || 0)} €</h3>
            </div>
            {/* Segunda Cuenta */}
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center border border-purple-100 dark:border-purple-800/30">
                <CreditCard className="w-6 h-6 lg:w-7 lg:h-7 text-purple-600" />
              </div>
              <h3 className="text-base lg:text-lg font-bold">{formatAmount(totales.cuenta2 || 0)} €</h3>
            </div>
          </div>
        </div>

        {/* Card 3: Balance del Mes (Ingresos/Gastos/Resultado) */}
        <div className="col-span-2 lg:col-span-3 bg-white dark:bg-stone-900 p-2.5 lg:p-3 rounded-2xl border border-slate-200 dark:border-stone-800 shadow-sm">
          <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Balance del Mes</p>
          <div className="space-y-1.5">
            {/* Ingresos */}
            <div className="flex items-center justify-between">
              <span className="text-xs lg:text-sm font-semibold text-emerald-600 dark:text-emerald-400">Ingresos</span>
              <span className="text-sm lg:text-base font-bold text-emerald-600 dark:text-emerald-400">+{formatAmount(totales.ingresos || 0)} €</span>
            </div>
            {/* Gastos */}
            <div className="flex items-center justify-between">
              <span className="text-xs lg:text-sm font-semibold text-red-600 dark:text-red-400">Gastos</span>
              <span className="text-sm lg:text-base font-bold text-red-600 dark:text-red-400">-{formatAmount(totales.gastos || 0)} €</span>
            </div>
            {/* Separador */}
            <div className="border-t border-slate-200 dark:border-stone-700 pt-1.5">
              {/* Resultado */}
              <div className="flex items-center justify-between">
                <span className="text-xs lg:text-sm font-bold text-slate-700 dark:text-slate-300">Resultado</span>
                <span className={`text-base lg:text-lg font-extrabold ${
                  (totales.ingresos - totales.gastos) > 0 
                    ? 'text-teal-500 dark:text-teal-400' 
                    : (totales.ingresos - totales.gastos) === 0
                    ? 'text-amber-500 dark:text-amber-400'
                    : 'text-orange-500 dark:text-orange-400'
                }`}>
                  {(totales.ingresos - totales.gastos) > 0 ? '+' : ''}{formatAmount((totales.ingresos - totales.gastos) || 0)} €
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Ahorro Total */}
        <div className="col-span-2 lg:col-span-3 bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 lg:p-3 rounded-2xl shadow-sm flex flex-col justify-between text-white">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest opacity-90">Ahorro Total</p>
            <PiggyBank className="w-4 h-4 lg:w-5 lg:h-5 opacity-80" />
          </div>
          <h3 className="text-xl lg:text-4xl font-extrabold">{formatAmount(ahorro.actual || 0)} €</h3>
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

      <div className="grid grid-cols-12 gap-4 lg:gap-6 p-4 lg:p-0">
        {/* Columna Principal */}
        <div className="col-span-12 lg:col-span-8 space-y-4 lg:space-y-6">
          {/* Gráficos - Colapsables en móvil */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
            {/* Presupuesto — Barras de Progreso */}
            <div className="bg-white dark:bg-stone-900 p-5 rounded-xl border border-slate-200 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow">
              {(() => {
                const mesIdx = meses.indexOf(mesSeleccionado);
                const mesClave = `${añoSeleccionado}-${String(mesIdx + 1).padStart(2, '0')}`;
                const presupuestosDelMes = presupuestos.filter(p => p.mes === mesClave);
                const catColorHex = { amber: '#f59e0b', cyan: '#06b6d4', red: '#ef4444', emerald: '#10b981', blue: '#3b82f6', purple: '#8b5cf6', orange: '#f97316', slate: '#64748b', indigo: '#6366f1' };

                const totalBudget = categorias.reduce((s, cat) => s + (parseFloat(presupuestosDelMes.find(p => p.categoria === cat.nombre)?.cantidad) || 0), 0);
                const totalGastado = categorias.reduce((sum, cat) => {
                  const budget = parseFloat(presupuestosDelMes.find(p => p.categoria === cat.nombre)?.cantidad) || 0;
                  const spent = operacionesDelMes.filter(op => op.type === 'gasto' && op.category === cat.nombre)
                    .reduce((s, op) => s + parseFloat(op.amount || 0), 0);
                  return sum + (budget > 0 || spent > 0 ? spent : 0);
                }, 0);
                const disponible = totalBudget - totalGastado;
                const porcentajeTotal = totalBudget > 0 ? (totalGastado / totalBudget) * 100 : 0;
                const overBudgetTotal = totalGastado > totalBudget;

                return (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-slate-500" />
                        Presupuesto Mensual
                      </h3>
                      <button 
                        onClick={() => {
                          const editables = {};
                          categorias.forEach(cat => {
                            editables[cat.nombre] = presupuestosDelMes.find(p => p.categoria === cat.nombre)?.cantidad || 0;
                          });
                          setPresupuestosEditables(editables);
                          setModalEditarPresupuesto(true);
                        }}
                        className="p-1.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors group"
                        title="Editar presupuestos"
                      >
                        <Edit className="w-4 h-4 text-purple-600 group-hover:text-purple-700" />
                      </button>
                    </div>

                    {/* Barra principal */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                            {formatAmount(totalBudget)}€
                          </p>
                          <p className={`text-sm font-bold ${overBudgetTotal ? 'text-red-600' : 'text-slate-500 dark:text-slate-400'}`}>
                            {formatAmount(totalGastado)}€ <span className="text-[10px] font-medium text-slate-400">gastado</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-extrabold ${overBudgetTotal ? 'text-red-600' : (disponible === 0 ? 'text-amber-600' : 'text-green-600')}`}>
                            {overBudgetTotal ? '-' : ''}{formatAmount(Math.abs(disponible))}€
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">{overBudgetTotal ? 'sobrepasado' : (disponible === 0 ? 'exacto' : 'disponible')}</p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all duration-700 ${overBudgetTotal ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min(porcentajeTotal, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] font-bold text-slate-400">{Math.round(porcentajeTotal)}%</span>
                        <span className={`text-[10px] font-bold ${overBudgetTotal ? 'text-red-500' : 'text-green-500'}`}>
                          {overBudgetTotal ? '⚠️ Sobre presupuesto' : '✔️ Dentro del presupuesto'}
                        </span>
                      </div>
                    </div>

                    {/* Barras por categoría */}
                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-stone-800">
                      {categorias.map(cat => {
                        const CatIcon = cat.icon;
                        const budget = parseFloat(presupuestosDelMes.find(p => p.categoria === cat.nombre)?.cantidad) || 0;
                        const spent = operacionesDelMes
                          .filter(op => op.type === 'gasto' && op.category === cat.nombre)
                          .reduce((s, op) => s + parseFloat(op.amount || 0), 0);
                        if (budget === 0 && spent === 0) return null;
                        const remaining = budget - spent;
                        const pct = budget > 0 ? (spent / budget) * 100 : (spent > 0 ? 100 : 0);
                        const over = spent > budget;
                        return (
                          <div key={cat.nombre}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <CatIcon className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{cat.nombre}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${over ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>{formatAmount(spent)}€</span>
                                <span className="text-[10px] text-slate-400">/ {formatAmount(budget)}€</span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-2 rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(pct, 100)}%`,
                                  backgroundColor: catColorHex[cat.color] || '#8b5cf6'
                                }}
                              />
                            </div>
                            <div className="flex justify-between mt-0.5">
                              <span className="text-[10px] text-slate-400">{Math.round(pct)}%</span>
                              <span className={`text-[10px] font-bold ${over ? 'text-red-500' : (remaining === 0 ? 'text-amber-600' : 'text-green-600')}`}>
                                {over ? `-${formatAmount(Math.abs(remaining))}€` : (remaining === 0 ? 'exacto' : `${formatAmount(remaining)}€ libre`)}
                              </span>
                            </div>
                          </div>
                        );
                      }).filter(Boolean)}
                    </div>
                  </>
                );
              })()}
            </div>

          {/* Distribución del Gasto */}
          <div className="bg-white dark:bg-stone-900 p-5 rounded-xl border border-slate-200 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-slate-500" />
                Distribución del Gasto
              </h3>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                {mesSeleccionado.charAt(0).toUpperCase() + mesSeleccionado.slice(1)}
              </span>
            </div>
            {(() => {
              const catColorHex = { amber: '#f59e0b', cyan: '#06b6d4', red: '#ef4444', emerald: '#10b981', blue: '#3b82f6', purple: '#8b5cf6', orange: '#f97316', slate: '#64748b', indigo: '#6366f1' };
              const totalGastos = gastosPorCategoria.reduce((sum, g) => sum + g.cantidad, 0);
              const categoriasConGasto = gastosPorCategoria.filter(g => g.cantidad > 0).sort((a, b) => b.cantidad - a.cantidad);

              if (totalGastos === 0) return (
                <div className="text-center py-8 text-slate-400">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-medium">Sin gastos este mes</p>
                </div>
              );

              return (
                <>
                  {/* Total del mes */}
                  <div className="text-center mb-4">
                    <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{formatAmount(totalGastos)}€</p>
                    <p className="text-[10px] text-slate-400 font-medium">total gastado este mes</p>
                  </div>

                  {/* Barra apilada horizontal */}
                  <div className="w-full h-7 rounded-xl overflow-visible flex mb-5 relative bg-slate-100 dark:bg-slate-800">
                    {categoriasConGasto.map((g, idx) => {
                      const pct = ((g.cantidad / totalGastos) * 100).toFixed(1);
                      const isFirst = idx === 0;
                      const isLast = idx === categoriasConGasto.length - 1;
                      return (
                        <div
                          key={idx}
                          className={`h-full transition-all duration-500 relative group/seg cursor-pointer hover:brightness-110 ${isFirst ? 'rounded-l-xl' : ''} ${isLast ? 'rounded-r-xl' : ''}`}
                          style={{
                            width: `${(g.cantidad / totalGastos) * 100}%`,
                            backgroundColor: catColorHex[g.color] || '#8b5cf6'
                          }}
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg opacity-0 group-hover/seg:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                            {g.categoria}: {formatAmount(g.cantidad)}€ ({pct}%)
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-slate-800"></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cards por categoría */}
                  <div className="grid grid-cols-2 gap-2">
                    {categoriasConGasto.map((g, idx) => {
                      const Icon = g.icon;
                      const pct = ((g.cantidad / totalGastos) * 100).toFixed(1);
                      return (
                        <div
                          key={idx}
                          className="bg-slate-50 dark:bg-stone-800 rounded-lg p-2.5 border-l-[3px] hover:bg-slate-100 dark:hover:bg-stone-700 transition-all"
                          style={{ borderLeftColor: catColorHex[g.color] || '#8b5cf6' }}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <Icon className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">{g.categoria}</span>
                          </div>
                          <div className="flex items-baseline justify-between">
                            <span className="text-sm font-extrabold" style={{ color: catColorHex[g.color] || '#8b5cf6' }}>
                              {formatAmount(g.cantidad)}€
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </div>

          {/* Tabla de Movimientos */}
          <div ref={tablaRef} className="bg-white dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="p-4 lg:p-5 border-b border-slate-100 dark:border-stone-800 bg-slate-50/50 dark:bg-stone-900/50">
              <div className="flex flex-col gap-3 lg:gap-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-4">
                  <h3 className="font-bold text-base lg:text-lg">Movimientos</h3>
                  
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
                  <div className={`${isMobile ? 'hidden' : 'flex'} items-center gap-2 flex-nowrap`}>
                    <select 
                      value={filtros.tipo}
                      onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
                      className={`bg-white dark:bg-stone-800 border-2 rounded-lg text-xs font-semibold px-2 py-1.5 cursor-pointer transition-all focus:ring-2 focus:ring-purple-500/20 focus:outline-none flex-1 min-w-[120px] ${
                        filtros.tipo !== 'todos' 
                          ? 'border-purple-500 dark:border-purple-400 text-purple-700 dark:text-purple-300' 
                          : 'border-slate-200 dark:border-stone-700 hover:border-slate-300 dark:hover:border-stone-600'
                      }`}
                    >
                      <option value="todos">Tipo: Todos</option>
                      <option value="gasto">Gasto</option>
                      <option value="ingreso">Ingreso</option>
                      <option value="hucha">Ahorro</option>
                      <option value="retirada-hucha">Retirada</option>
                    </select>
                    <select 
                      value={filtros.categoria}
                      onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}
                      className={`bg-white dark:bg-stone-800 border-2 rounded-lg text-xs font-semibold px-2 py-1.5 cursor-pointer transition-all focus:ring-2 focus:ring-purple-500/20 focus:outline-none flex-1 min-w-[130px] ${
                        filtros.categoria !== 'todas' 
                          ? 'border-purple-500 dark:border-purple-400 text-purple-700 dark:text-purple-300' 
                          : 'border-slate-200 dark:border-stone-700 hover:border-slate-300 dark:hover:border-stone-600'
                      }`}
                    >
                      <option value="todas">Categoría: Todas</option>
                      {categorias.map(cat => (
                        <option key={cat.nombre} value={cat.nombre}>{cat.nombre}</option>
                      ))}
                    </select>
                    <select 
                      value={filtros.cuenta}
                      onChange={(e) => setFiltros({...filtros, cuenta: e.target.value})}
                      className={`bg-white dark:bg-stone-800 border-2 rounded-lg text-xs font-semibold px-2 py-1.5 cursor-pointer transition-all focus:ring-2 focus:ring-purple-500/20 focus:outline-none flex-1 min-w-[120px] ${
                        filtros.cuenta !== 'todas' 
                          ? 'border-purple-500 dark:border-purple-400 text-purple-700 dark:text-purple-300' 
                          : 'border-slate-200 dark:border-stone-700 hover:border-slate-300 dark:hover:border-stone-600'
                      }`}
                    >
                      <option value="todas">Cuenta: Todas</option>
                      {cuentasUsuario.map(cuenta => (
                        <option key={cuenta} value={cuenta}>{cuenta}</option>
                      ))}
                    </select>
                    {/* Botón limpiar filtros */}
                    {(filtros.tipo !== 'todos' || filtros.categoria !== 'todas' || filtros.cuenta !== 'todas') && (
                      <button
                        onClick={() => setFiltros({ tipo: 'todos', categoria: 'todas', cuenta: 'todas' })}
                        className="h-[34px] px-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-all active:scale-95 flex items-center justify-center flex-shrink-0"
                        title="Limpiar todos los filtros"
                      >
                        <X className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    )}
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
                {operacionesPaginadas.map((op) => {
                  const saldoInfo = saldosAcumulados[op.id] || {};
                  return (
                  <div key={op.id} className="p-4 hover:bg-slate-50 dark:hover:bg-stone-800/50 active:bg-slate-100 dark:active:bg-stone-800 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            op.type === 'gasto' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                            op.type === 'ingreso' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            op.type === 'hucha' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
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
                          {(op.account_name === cuentasUsuario[0] || op.account_name === cuentasUsuario[1]) && op.type !== 'savings' && (
                            <>
                              <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                              <span className="text-[11px] font-semibold text-slate-400">
                                Saldo: {formatAmount(saldoInfo.cuenta || 0)}€
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex flex-col items-end">
                          <span className={`text-lg font-bold ${
                            op.type === 'gasto' ? 'text-red-500' : 'text-emerald-500'
                          }`}>
                            {formatAmount(parseFloat(op.amount) || 0)} €
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                            {formatAmount(saldoInfo.total || 0)}€
                          </span>
                        </div>
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
                );
                })}
              </div>
            ) : (
              /* Vista de Tabla para Desktop */
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="sticky top-0 bg-slate-50/95 dark:bg-stone-800/95 backdrop-blur-sm z-10 border-b-2 border-slate-200 dark:border-stone-700">
                    <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <th className="pl-5 pr-3 py-3 whitespace-nowrap">
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
                      <th className="px-3 py-3 whitespace-nowrap">
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
                      <th className="px-3 py-3 text-right whitespace-nowrap">
                        <button 
                          onClick={() => handleOrdenar('cantidad')}
                          className="inline-flex items-center gap-1 ml-auto hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        >
                          Importe
                          {ordenamiento.columna === 'cantidad' ? (
                            ordenamiento.direccion === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                          )}
                        </button>
                      </th>
                      <th className="px-3 py-3 whitespace-nowrap">
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
                      <th className="px-3 py-3">
                        <button
                          onClick={() => handleOrdenar('categoria')}
                          className="flex items-center gap-1 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        >
                          Concepto
                          {ordenamiento.columna === 'categoria' ? (
                            ordenamiento.direccion === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                          )}
                        </button>
                      </th>
                      <th className="pl-3 pr-5 py-3 text-right whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-stone-800">
                    {operacionesPaginadas.map((op) => {
                      const saldoInfo = saldosAcumulados[op.id] || {};
                      const fechaFormateada = formatearFecha(op.date); // YYYY-MM-DD
                      const [anyo, mes, dia] = fechaFormateada.split('-').map(Number);
                      const fechaObj = new Date(fechaFormateada);
                      const mesNombre = fechaObj.toLocaleString('es-ES', { month: 'short' }).replace('.', '');
                      const anyoActual = new Date().getFullYear();
                      return (
                      <tr key={op.id} className="group hover:bg-purple-50/30 dark:hover:bg-stone-800/40 transition-colors">
                        {/* Fecha */}
                        <td className="pl-5 pr-3 py-3 whitespace-nowrap">
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{dia}</span>
                            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 capitalize">{mesNombre}</span>
                            {anyo !== anyoActual && (
                              <span className="text-[10px] text-slate-300 dark:text-slate-600">{anyo}</span>
                            )}
                          </div>
                        </td>
                        {/* Tipo */}
                        <td className="px-3 py-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${
                            op.type === 'gasto' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                            op.type === 'ingreso' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            op.type === 'hucha' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                            'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {tipoLabel(op.type)}
                          </span>
                        </td>
                        {/* Importe + Saldo total */}
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <div className="flex flex-col items-end">
                            <span className={`text-sm font-bold tabular-nums ${
                              op.type === 'gasto' ? 'text-red-500' : 
                              op.type === 'retirada-hucha' && parseFloat(op.amount) < 0 ? 'text-red-500' :
                              'text-emerald-500'
                            }`}>
                              {op.type === 'gasto' ? '−' : '+'}{formatAmount(Math.abs(parseFloat(op.amount)) || 0)} €
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tabular-nums mt-0.5">
                              {formatAmount(saldoInfo.total || 0)}€
                            </span>
                          </div>
                        </td>
                        {/* Cuenta */}
                        <td className="px-3 py-3">
                          <div className="flex flex-col items-center gap-1">
                            {user?.username === 'xurxo' && op.account_name === 'Santander' ? (
                              <img src={santanderLogo} alt="Santander" className="w-6 h-6 object-contain" title="Santander" />
                            ) : user?.username !== 'xurxo' && op.account_name === 'BBVA' ? (
                              <img src={bbvaLogo} alt="BBVA" className="w-6 h-6 object-contain" title="BBVA" />
                            ) : op.account_name === 'Prepago' ? (
                              <div className="w-6 h-6 bg-purple-50 dark:bg-purple-900/20 rounded flex items-center justify-center border border-purple-100 dark:border-purple-800/30" title="Prepago">
                                <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                              </div>
                            ) : op.account_name === 'Ahorro' ? (
                              <div className="w-6 h-6 bg-emerald-50 dark:bg-emerald-900/20 rounded flex items-center justify-center border border-emerald-100 dark:border-emerald-800/30" title="Ahorro">
                                <PiggyBank className="w-3.5 h-3.5 text-emerald-600" />
                              </div>
                            ) : null}
                            {(op.account_name === cuentasUsuario[0] || op.account_name === cuentasUsuario[1]) && op.type !== 'savings' && (
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tabular-nums">
                                {formatAmount(saldoInfo.cuenta || 0)}€
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Concepto + categoría */}
                        <td className="px-3 py-3">
                          <p className={`text-sm font-medium text-slate-800 dark:text-slate-200 ${
                            op.category ? 'truncate max-w-[240px]' : 'line-clamp-2 max-w-[280px]'
                          }`}>
                            {op.description || '-'}
                          </p>
                          {op.category && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">{op.category}</span>
                          )}
                        </td>
                        {/* Acciones */}
                        <td className="pl-3 pr-5 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button 
                              onClick={() => setModalEditarOperacion({ abierto: true, operacion: {...op} })}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 dark:bg-stone-800 dark:hover:bg-purple-900/30 text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 transition-all active:scale-95"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setModalEliminar({ abierto: true, id: op.id })}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-100 dark:bg-stone-800 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-all active:scale-95"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                    })}
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
        <div className="col-span-12 lg:col-span-4 space-y-5">
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow text-white sticky top-8">
            <h3 className="font-bold text-sm mb-3.5 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nueva Operación
            </h3>
            <form onSubmit={handleCrearOperacion} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-90 block mb-1.5">Fecha</label>
                <input
                  type="date"
                  value={formNuevaOperacion.fecha}
                  onChange={(e) => setFormNuevaOperacion({...formNuevaOperacion, fecha: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-white/20 border border-white/30 text-white text-xs placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-90 block mb-1.5">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormNuevaOperacion({...formNuevaOperacion, tipo: 'gasto'})}
                    className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all ${
                      formNuevaOperacion.tipo === 'gasto'
                        ? 'bg-white text-purple-600 shadow-md'
                        : 'bg-white/20 border border-white/30 text-white'
                    }`}
                  >
                    Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormNuevaOperacion({...formNuevaOperacion, tipo: 'ingreso'})}
                    className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all ${
                      formNuevaOperacion.tipo === 'ingreso'
                        ? 'bg-white text-purple-600 shadow-md'
                        : 'bg-white/20 border border-white/30 text-white'
                    }`}
                  >
                    Ingreso
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormNuevaOperacion({...formNuevaOperacion, tipo: 'hucha'})}
                    className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all ${
                      formNuevaOperacion.tipo === 'hucha'
                        ? 'bg-white text-purple-600 shadow-md'
                        : 'bg-white/20 border border-white/30 text-white'
                    }`}
                  >
                    Ahorro
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormNuevaOperacion({...formNuevaOperacion, tipo: 'retirada-hucha'})}
                    className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all ${
                      formNuevaOperacion.tipo === 'retirada-hucha'
                        ? 'bg-white text-purple-600 shadow-md'
                        : 'bg-white/20 border border-white/30 text-white'
                    }`}
                  >
                    Retirada
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-90 block mb-1.5">Cantidad</label>
                <input
                  type="number"
                  step="0.01"
                  value={formNuevaOperacion.cantidad}
                  onChange={(e) => setFormNuevaOperacion({...formNuevaOperacion, cantidad: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-white/20 border border-white/30 text-white text-xs placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-90 block mb-1.5">Concepto</label>
                <input
                  type="text"
                  value={formNuevaOperacion.descripcion}
                  onChange={(e) => setFormNuevaOperacion({...formNuevaOperacion, descripcion: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-white/20 border border-white/30 text-white text-xs placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  placeholder="Descripción..."
                />
              </div>

              {formNuevaOperacion.tipo === 'gasto' && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-90 block mb-1.5">Categoría</label>
                  <select
                    value={formNuevaOperacion.categoria}
                    onChange={(e) => setFormNuevaOperacion({...formNuevaOperacion, categoria: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg bg-white/20 border border-white/30 text-white text-xs focus:ring-2 focus:ring-white/50 focus:border-white/50"
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
                    <label className="text-[10px] font-bold uppercase tracking-wider opacity-90 block mb-1.5">Cuenta Origen</label>
                    <select
                      value={formNuevaOperacion.cuentaOrigen}
                      onChange={(e) => setFormNuevaOperacion({...formNuevaOperacion, cuentaOrigen: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg bg-white/20 border border-white/30 text-white text-xs focus:ring-2 focus:ring-white/50 focus:border-white/50"
                    >
                      <option value="Ahorro" className="text-slate-900">Ahorro</option>
                      {cuentasUsuario.map(cuenta => (
                        <option key={cuenta} value={cuenta} className="text-slate-900">{cuenta}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider opacity-90 block mb-1.5">Cuenta Destino</label>
                    <select
                      value={formNuevaOperacion.cuentaDestino}
                      onChange={(e) => setFormNuevaOperacion({...formNuevaOperacion, cuentaDestino: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg bg-white/20 border border-white/30 text-white text-xs focus:ring-2 focus:ring-white/50 focus:border-white/50"
                    >
                      {cuentasUsuario.map(cuenta => (
                        <option key={cuenta} value={cuenta} className="text-slate-900">{cuenta}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : formNuevaOperacion.tipo === 'hucha' ? (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-90 block mb-1.5">Cuenta de origen</label>
                  <select
                    value={formNuevaOperacion.cuenta}
                    onChange={(e) => setFormNuevaOperacion({...formNuevaOperacion, cuenta: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg bg-white/20 border border-white/30 text-white text-xs focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  >
                    {cuentasUsuario.map(cuenta => (
                      <option key={cuenta} value={cuenta} className="text-slate-900">{cuenta}</option>
                    ))}
                  </select>
                </div>
              ) : formNuevaOperacion.tipo !== 'retirada-hucha' ? (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-90 block mb-1.5">Cuenta</label>
                  <select
                    value={formNuevaOperacion.cuenta}
                    onChange={(e) => setFormNuevaOperacion({...formNuevaOperacion, cuenta: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg bg-white/20 border border-white/30 text-white text-xs focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  >
                    {cuentasUsuario.map(cuenta => (
                      <option key={cuenta} value={cuenta} className="text-slate-900">{cuenta}</option>
                    ))}
                  </select>
                </div>
              ) : null}

              <button
                type="submit"
                className="w-full py-2.5 bg-white text-purple-600 rounded-lg font-bold text-sm hover:bg-purple-50 active:scale-98 transition-all shadow-md hover:shadow-lg"
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
                  const esTraspaso = act.type === 'retirada-hucha' && act.description?.includes('Traspaso');
                  const getTipoLabel = (tipo) => {
                    const tipos = {
                      'gasto': 'Gasto',
                      'ingreso': 'Ingreso',
                      'hucha': 'Ahorro',
                      'retirada-hucha': 'Retirada'
                    };
                    return tipos[tipo] || tipo;
                  };
                  const tipoLabelText = esTraspaso ? 'Traspaso' : getTipoLabel(act.type);
                  
                  return (
                    <div key={act.id || idx} className="flex gap-3 relative">
                      <div className={`w-6 h-6 rounded-full ${
                        esTraspaso ? 'bg-blue-100 dark:bg-blue-900/40' :
                        act.type === 'gasto' ? 'bg-red-100 dark:bg-red-900/40' :
                        act.type === 'ingreso' ? 'bg-green-100 dark:bg-green-900/40' :
                        'bg-purple-100 dark:bg-purple-900/40'
                      } border-4 border-white dark:border-stone-900 z-10 flex-shrink-0`}></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <span className={`text-sm font-bold ${
                              esTraspaso ? 'text-blue-600 dark:text-blue-400' :
                              act.type === 'gasto' ? 'text-red-600 dark:text-red-400' :
                              act.type === 'ingreso' ? 'text-green-600 dark:text-green-400' :
                              'text-purple-600 dark:text-purple-400'
                            }`}>
                              {tipoLabelText}
                            </span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {parseFloat(act.amount) < 0 ? '-' : '+'}{Math.abs(parseFloat(act.amount) || 0).toFixed(2)}€
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            {new Date(act.date).toLocaleDateString('es-ES', { 
                              day: '2-digit', 
                              month: 'short', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {act.category && (
                            <>
                              <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
                              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                {act.category}
                              </span>
                            </>
                          )}
                        </div>
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

          {/* Widget de Meta Personal */}
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
                      <span className="bg-white/20 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Meta {user?.username}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{meta.nombre}</h3>
                    <p className="text-white/80 text-sm mb-6 font-medium">
                      Has ahorrado el {progreso.toFixed(0)}%
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
                  <span className="bg-white/20 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Meta {user?.username}</span>
                </div>
                <h3 className="text-xl font-bold mb-1">Sin meta activa</h3>
                <p className="text-white/80 text-sm mb-6 font-medium">Crea una meta para empezar a ahorrar</p>
                <button
                  onClick={() => setModalEditarMeta({ abierto: true, meta: {
                    nombre: 'Mi objetivo 2026',
                    cantidad_objetivo: 2000,
                    cantidad_actual: 0,
                    fecha_inicio: new Date().toISOString().split('T')[0],
                    fecha_objetivo: '',
                    categoria: 'Personal',
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
                  value={modalEditarOperacion.operacion?.type || 'gasto'}
                  onChange={(e) => setModalEditarOperacion({
                    ...modalEditarOperacion,
                    operacion: { ...modalEditarOperacion.operacion, type: e.target.value }
                  })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-stone-800"
                  required
                >
                  <option value="gasto">Gasto</option>
                  <option value="ingreso">Ingreso</option>
                  <option value="hucha">Ahorro</option>
                  <option value="retirada-hucha">Retirada</option>
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

              {modalEditarOperacion.operacion?.type === 'gasto' && (
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

              {modalEditarOperacion.operacion?.type === 'retirada-hucha' ? (
                <>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Cuenta Origen</label>
                    <select
                      value={(() => {
                        if (modalEditarOperacion.operacion?.cuentaOrigen) return modalEditarOperacion.operacion.cuentaOrigen;
                        const match = modalEditarOperacion.operacion?.description?.match(/Traspaso (?:desde )?(.+?) a/);
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
              ) : modalEditarOperacion.operacion?.type !== 'hucha' ? (
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
    </div>
  );
};

export default UserAccount;
