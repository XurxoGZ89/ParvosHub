import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ShoppingCart, Home as HomeIcon, Car, Plus, PiggyBank, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, ChevronDown, Trash2, DollarSign, FileText, CreditCard, Utensils, Edit2 } from 'lucide-react';
import MobileHeader from './MobileHeader';
import MobileSheet from './MobileSheet';
import api from '../../lib/api';
import useAuthStore from '../../stores/authStore';
import { usePrivacyFormatter } from '../../utils/privacyFormatter';

const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

const tipoEnToEs = (tipo) => {
  const map = { 'expense': 'gasto', 'income': 'ingreso', 'savings': 'hucha', 'savings_withdrawal': 'retirada-hucha' };
  return map[tipo] || tipo;
};

const categorias = [
  { nombre: 'Alimentación', icon: ShoppingCart, color: 'amber' },
  { nombre: 'Ocio', icon: Utensils, color: 'red' },
  { nombre: 'Hogar', icon: HomeIcon, color: 'emerald' },
  { nombre: 'Alquiler', icon: DollarSign, color: 'indigo' },
  { nombre: 'Extra', icon: Plus, color: 'purple' },
  { nombre: 'Recibos', icon: FileText, color: 'slate' },
  { nombre: 'Movilidad', icon: Car, color: 'blue' }
];

const colorMap = {
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30', red: 'bg-red-100 text-red-600 dark:bg-red-900/30',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30', indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30', slate: 'bg-slate-100 text-slate-600 dark:bg-slate-700',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
};

const MobilePersonalAccount = () => {
  const { user } = useAuthStore();
  const formatAmount = usePrivacyFormatter();
  const [operaciones, setOperaciones] = useState([]);
  const [todasLasOperaciones, setTodasLasOperaciones] = useState([]);
  const [mesSeleccionado, setMesSeleccionado] = useState(meses[new Date().getMonth()]);
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear());
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingOperacion, setEditingOperacion] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showCategorias, setShowCategorias] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showEditBudget, setShowEditBudget] = useState(false);

  // Presupuestos por categoría - cargar del API
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [editBudgets, setEditBudgets] = useState({});

  const cuentasUsuario = useMemo(
    () => (user?.username === 'xurxo' ? ['Santander', 'Prepago'] : ['BBVA', 'Virtual']),
    [user?.username]
  );

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0], tipo: 'gasto', cantidad: '',
    descripcion: '', categoria: 'Alimentación', cuenta: cuentasUsuario[0],
    cuentaOrigen: 'Ahorro', cuentaDestino: cuentasUsuario[0]
  });

  const resetForm = useCallback(() => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0], tipo: 'gasto', cantidad: '',
      descripcion: '', categoria: 'Alimentación', cuenta: cuentasUsuario[0],
      cuentaOrigen: 'Ahorro', cuentaDestino: cuentasUsuario[0]
    });
    setEditingOperacion(null);
  }, [cuentasUsuario]);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const mesIdx = meses.indexOf(mesSeleccionado);
      const mesFormato = `${añoSeleccionado}-${String(mesIdx + 1).padStart(2, '0')}`;
      const [opsRes, allOpsRes, budgetsRes] = await Promise.all([
        api.get('/api/user/operations', { params: { mes: mesFormato } }),
        api.get('/api/user/operations'),
        api.get(`/api/user/budgets/${añoSeleccionado}/${mesIdx}`)
      ]);
      setOperaciones((opsRes.data || []).map(op => ({ ...op, type: tipoEnToEs(op.type) })));
      setTodasLasOperaciones((allOpsRes.data || []).map(op => ({ ...op, type: tipoEnToEs(op.type) })));
      // Cargar presupuestos del API
      if (budgetsRes.data?.presupuestos) {
        setCategoryBudgets(budgetsRes.data.presupuestos);
      }
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  }, [mesSeleccionado, añoSeleccionado]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // Las operaciones ya vienen filtradas por mes desde el backend
  const operacionesDelMes = operaciones;

  // Totales
  const calcularTotales = () => {
    const calcCuenta = (nombre) => todasLasOperaciones.filter(op => op.account_name === nombre)
      .reduce((sum, op) => {
        if (op.type === 'ingreso' || op.type === 'income' || op.type === 'retirada-hucha' || op.type === 'savings_withdrawal') return sum + parseFloat(op.amount || 0);
        if (op.type === 'gasto' || op.type === 'expense') return sum - parseFloat(op.amount || 0);
        if (op.type === 'hucha' || op.type === 'savings') return sum + parseFloat(op.amount || 0);
        return sum;
      }, 0);
    const c1 = calcCuenta(cuentasUsuario[0]);
    const c2 = calcCuenta(cuentasUsuario[1]);
    // Ingresos del mes incluyen ingresos y retiradas a cuentas principales (igual que web)
    const ingresos = operacionesDelMes
      .filter(op => op.type === 'ingreso' || 
        (op.type === 'retirada-hucha' && (op.account_name === cuentasUsuario[0] || op.account_name === cuentasUsuario[1])))
      .reduce((s, op) => s + parseFloat(op.amount || 0), 0);
    const gastos = operacionesDelMes.filter(op => op.type === 'gasto').reduce((s, op) => s + parseFloat(op.amount || 0), 0);
    const ahorroMes = operacionesDelMes.filter(op => (op.type === 'hucha' || op.type === 'savings') && (op.account_name === 'Ahorro' || op.account_name === null)).reduce((s, op) => s + parseFloat(op.amount || 0), 0);
    return { cuenta1: c1, cuenta2: c2, total: c1 + c2, ingresos, gastos, ahorroMes };
  };

  // Ahorro
  const calcularAhorro = () => {
    const mesIdx = meses.indexOf(mesSeleccionado);
    const filtrar = (hasta) => todasLasOperaciones.filter(op => {
      const f = new Date(op.date);
      return f.getFullYear() < hasta.y || (f.getFullYear() === hasta.y && f.getMonth() <= hasta.m);
    })
    .filter(op => {
      const esHucha = (op.type === 'hucha' || op.type === 'savings') && (op.account_name === 'Ahorro' || op.account_name === null);
      const esRetirada = (op.type === 'retirada-hucha' || op.type === 'savings_withdrawal') && op.account_name === 'Ahorro';
      return esHucha || esRetirada;
    })
    .reduce((s, op) => s + parseFloat(op.amount || 0), 0);
    const actual = filtrar({ y: añoSeleccionado, m: mesIdx });
    const anterior = filtrar({ y: mesIdx === 0 ? añoSeleccionado - 1 : añoSeleccionado, m: mesIdx === 0 ? 11 : mesIdx - 1 });
    return { actual, diferencia: actual - anterior };
  };

  const totales = calcularTotales();
  const ahorro = calcularAhorro();

  const cambiarMes = (dir) => {
    const idx = meses.indexOf(mesSeleccionado) + dir;
    if (idx > 11) { setMesSeleccionado(meses[0]); setAñoSeleccionado(añoSeleccionado + 1); }
    else if (idx < 0) { setMesSeleccionado(meses[11]); setAñoSeleccionado(añoSeleccionado - 1); }
    else setMesSeleccionado(meses[idx]);
  };

  const opsFiltradas = operacionesDelMes.filter(op => filtroTipo === 'todos' || op.type === filtroTipo)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Calcular saldos acumulados para cada operación
  const calcularSaldosAcumulados = () => {
    // Ordenar por fecha y luego por ID (orden de inserción)
    const opsOrdenadas = [...operaciones].sort((a, b) => {
      const fechaA = new Date(a.date);
      const fechaB = new Date(b.date);
      if (fechaA.getTime() !== fechaB.getTime()) return fechaA - fechaB;
      return a.id - b.id;
    });
    
    const saldos = {};
    let saldoCuenta1 = 0;
    let saldoCuenta2 = 0;
    
    opsOrdenadas.forEach(op => {
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

  const handleEliminar = async (id) => {
    try { await api.delete(`/api/user/operations/${id}`); cargarDatos(); setDeleteConfirm(null); setToast('✓ Eliminado'); setTimeout(() => setToast(null), 2500); }
    catch (e) { setToast('Error al eliminar'); setTimeout(() => setToast(null), 3000); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let payload;
      if (formData.tipo === 'retirada-hucha') {
        payload = {
          type: 'savings_withdrawal',
          date: formData.fecha, amount: parseFloat(formData.cantidad),
          description: `Traspaso ${formData.cuentaOrigen} a ${formData.cuentaDestino}${formData.descripcion ? ' - ' + formData.descripcion : ''}`,
          category: '', account_name: formData.cuentaDestino
        };
      } else {
        payload = {
          type: formData.tipo === 'gasto' ? 'expense' : formData.tipo === 'ingreso' ? 'income' : 'savings',
          date: formData.fecha, amount: parseFloat(formData.cantidad), description: formData.descripcion,
          category: formData.tipo === 'gasto' ? formData.categoria : '', account_name: formData.cuenta
        };
      }
      if (editingOperacion?.id) {
        await api.put(`/api/user/operations/${editingOperacion.id}`, payload);
      } else {
        await api.post('/api/user/operations', payload);
      }
      setShowAddSheet(false);
      resetForm();
      cargarDatos();
      setToast(editingOperacion?.id ? '✓ Movimiento actualizado' : '✓ Movimiento creado');
      setTimeout(() => setToast(null), 2500);
    } catch (error) { setToast('Error al crear'); setTimeout(() => setToast(null), 3000); }
  };

  const handleEditar = (op) => {
    const tipo = op.type === 'hucha' ? 'ahorro' : op.type;
    setEditingOperacion(op);
    setFormData({
      fecha: op.date || new Date().toISOString().split('T')[0],
      tipo,
      cantidad: op.amount ?? '',
      descripcion: op.description || '',
      categoria: op.category || 'Alimentación',
      cuenta: op.account_name || cuentasUsuario[0],
      cuentaOrigen: 'Ahorro',
      cuentaDestino: op.account_name || cuentasUsuario[0]
    });
    setShowAddSheet(true);
  };

  const getCatInfo = (nombre) => {
    const cat = categorias.find(c => c.nombre === nombre);
    return cat || { icon: CreditCard, color: 'slate', nombre };
  };

  const tipoColor = (type) => {
    if (type === 'ingreso') return 'text-green-600';
    if (type === 'gasto') return 'text-red-600';
    if (type === 'hucha') return 'text-emerald-600';
    return 'text-blue-600';
  };

  const tipoSign = (type) => {
    if (type === 'gasto') return '-';
    if (type === 'hucha') return '→';
    return '+';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <MobileHeader title={`Cuenta ${user?.username === 'xurxo' ? 'Xurxo' : 'Sonia'}`} />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-16 left-4 right-4 z-[200] py-3 px-4 rounded-xl text-sm font-semibold text-center shadow-lg animate-fadeIn ${
          toast.startsWith('✓') ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>{toast}</div>
      )}

      {loading && !operacionesDelMes.length ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
      <div className="px-4 py-4 pb-6 space-y-4">
        {/* Selector de mes */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl px-2 py-1.5 border border-slate-200 dark:border-slate-800">
          <button onClick={() => cambiarMes(-1)} className="p-2 text-slate-400 active:scale-90"><ChevronLeft className="w-5 h-5" /></button>
          <span className="text-sm font-bold text-slate-800 dark:text-white capitalize">{mesSeleccionado} {añoSeleccionado}</span>
          <button onClick={() => cambiarMes(1)} className="p-2 text-slate-400 active:scale-90"><ChevronRight className="w-5 h-5" /></button>
        </div>

        {/* Saldo total */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Saldo Total</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{formatAmount(totales.total)}€</p>
          {(() => {
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
            const saldoAnterior = totalCuenta1Anterior + totalCuenta2Anterior;
            const nombreMesAnterior = meses[mesAnteriorIdx].charAt(0).toUpperCase() + meses[mesAnteriorIdx].slice(1);
            return (
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {formatAmount(saldoAnterior)}€ de {nombreMesAnterior}
              </p>
            );
          })()}
          <div className="grid grid-cols-2 gap-2 mt-3">
            {cuentasUsuario.map((c, i) => (
              <div key={c} className="bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg flex justify-between">
                <span className="text-xs font-medium text-slate-500">{c}</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{formatAmount(i === 0 ? totales.cuenta1 : totales.cuenta2)}€</span>
              </div>
            ))}
          </div>
          <div className={`grid gap-2 mt-3 ${totales.ahorroMes > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div className="bg-green-50 dark:bg-green-900/10 px-3 py-2 rounded-lg text-center">
              <span className="text-xs font-bold text-green-600 uppercase block">Ingresos</span>
              <span className="text-xs font-bold text-green-700">+{formatAmount(totales.ingresos)}€</span>
            </div>
            <div className="bg-red-50 dark:bg-red-900/10 px-3 py-2 rounded-lg text-center">
              <span className="text-xs font-bold text-red-600 uppercase block">Gastos</span>
              <span className="text-xs font-bold text-red-700">-{formatAmount(totales.gastos)}€</span>
            </div>
            {totales.ahorroMes > 0 && (
              <div className="bg-teal-50 dark:bg-teal-900/10 px-3 py-2 rounded-lg text-center">
                <span className="text-xs font-bold text-emerald-500 uppercase block">Ahorro</span>
                <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400">-{formatAmount(totales.ahorroMes)}€</span>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Resultado</span>
            <span className={`text-sm font-extrabold ${(totales.ingresos - totales.gastos - totales.ahorroMes) > 0 ? 'text-teal-600' : (totales.ingresos - totales.gastos - totales.ahorroMes) === 0 ? 'text-amber-500' : 'text-orange-500'}`}>
              {(totales.ingresos - totales.gastos - totales.ahorroMes) > 0 ? '+' : ''}{formatAmount(totales.ingresos - totales.gastos - totales.ahorroMes)}€
            </span>
          </div>
        </div>

        {/* Ahorro */}
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Ahorro acumulado</span>
            </div>
            <div className="flex items-center gap-1">
              {ahorro.diferencia >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : <TrendingDown className="w-3.5 h-3.5 text-red-600" />}
              <span className={`text-xs font-bold ${ahorro.diferencia >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {ahorro.diferencia >= 0 ? '+' : ''}{formatAmount(ahorro.diferencia)}€
              </span>
            </div>
          </div>
          <p className="text-xl font-extrabold text-emerald-900 dark:text-emerald-100 mt-1">{formatAmount(ahorro.actual)}€</p>
        </div>

        {/* Presupuesto vs Real */}
        {(() => {
          // Calcular totalBudget solo de categorías definidas (igual que la web)
          const totalBudget = categorias.reduce((s, cat) => s + (parseFloat(categoryBudgets[cat.nombre]) || 0), 0);
          // Calcular gastado de todas las categorías (igual que la web: suma diferencia por categoría)
          const gastado = categorias.reduce((sum, cat) => {
            const budget = parseFloat(categoryBudgets[cat.nombre]) || 0;
            const spent = operacionesDelMes.filter(op => op.type === 'gasto' && op.category === cat.nombre)
              .reduce((s, op) => s + parseFloat(op.amount || 0), 0);
            return sum + (budget > 0 || spent > 0 ? spent : 0);
          }, 0);
          const disponible = totalBudget - gastado;
          const porcentaje = totalBudget > 0 ? (gastado / totalBudget) * 100 : 0;
          const overBudget = gastado > totalBudget;
          const catColorHex = { amber: '#f59e0b', red: '#ef4444', emerald: '#10b981', indigo: '#6366f1', purple: '#8b5cf6', slate: '#64748b', blue: '#3b82f6' };

          return (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase">Presupuesto Mensual</h3>
                <button onClick={() => { setEditBudgets({...categoryBudgets}); setShowEditBudget(true); }}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 active:scale-95">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Barra principal única */}
              <div className="mb-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                      {formatAmount(totalBudget)}€
                    </p>
                    <p className={`text-sm font-bold ${overBudget ? 'text-red-600' : 'text-slate-500 dark:text-slate-400'}`}>
                      {formatAmount(gastado)}€ <span className="text-[10px] font-medium text-slate-400">gastado</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-extrabold ${overBudget ? 'text-red-600' : (disponible === 0 ? 'text-amber-600' : 'text-green-600')}`}>
                      {overBudget ? '-' : ''}{formatAmount(Math.abs(disponible))}€
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">{overBudget ? 'sobrepasado' : (disponible === 0 ? 'exacto' : 'disponible')}</p>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-700 ${overBudget ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(porcentaje, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] font-bold text-slate-400">{Math.round(porcentaje)}%</span>
                  <span className={`text-[10px] font-bold ${overBudget ? 'text-red-500' : 'text-green-500'}`}>
                    {overBudget ? '⚠️ Sobre presupuesto' : '✔️ Dentro del presupuesto'}
                  </span>
                </div>
              </div>

              {/* Desglose por categorías */}
              <button onClick={() => setShowCategorias(!showCategorias)}
                className="w-full flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">Ver por categorías</span>
                <ChevronDown className={`w-4 h-4 text-purple-600 dark:text-purple-400 transition-transform duration-200 ${showCategorias ? 'rotate-180' : ''}`} />
              </button>

              {showCategorias && (
                <div className="mt-3 space-y-3">
                  {categorias.map(cat => {
                    const CatIcon = cat.icon;
                    const budget = parseFloat(categoryBudgets[cat.nombre]) || 0;
                    const spent = operacionesDelMes.filter(op => op.type === 'gasto' && op.category === cat.nombre)
                      .reduce((s, op) => s + parseFloat(op.amount || 0), 0);
                    if (budget === 0 && spent === 0) return null;
                    const remaining = budget - spent;
                    const pct = budget > 0 ? (spent / budget) * 100 : (spent > 0 ? 100 : 0);
                    const over = spent > budget;
                    return (
                      <div key={cat.nombre}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${colorMap[cat.color] || colorMap.slate}`}>
                              <CatIcon className="w-3 h-3" />
                            </div>
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
                  {categorias.every(cat => {
                    const budget = parseFloat(categoryBudgets[cat.nombre]) || 0;
                    const spent = operacionesDelMes.filter(op => op.type === 'gasto' && op.category === cat.nombre)
                      .reduce((s, op) => s + parseFloat(op.amount || 0), 0);
                    return budget === 0 && spent === 0;
                  }) && <p className="text-xs text-slate-400 text-center py-2">Sin gastos este mes</p>}
                </div>
              )}
            </div>
          );
        })()}

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[{ v: 'todos', l: 'Todos' }, { v: 'gasto', l: 'Gastos' }, { v: 'ingreso', l: 'Ingresos' }, { v: 'hucha', l: 'Ahorro' }, { v: 'retirada-hucha', l: 'Retiradas' }].map(f => (
            <button key={f.v}
              onClick={() => setFiltroTipo(f.v)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                filtroTipo === f.v ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>

        {/* Lista de operaciones como cards */}
        <div className="space-y-2">
          {opsFiltradas.length > 0 ? opsFiltradas.map((op) => {
            const cat = getCatInfo(op.category);
            const CatIcon = cat.icon;
            const saldoInfo = saldosAcumulados[op.id] || {};
            return (
              <div key={op.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3 active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorMap[cat.color] || colorMap.slate}`}>
                  <CatIcon className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{op.description || op.category || op.type}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-[11px] text-slate-400">
                      {new Date(op.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} · {op.account_name}
                    </p>
                    {(op.account_name === cuentasUsuario[0] || op.account_name === cuentasUsuario[1]) && op.type !== 'savings' && (
                      <>
                        <span className="text-[11px] text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          Saldo: {formatAmount(saldoInfo.cuenta || 0)}€
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 flex items-center gap-2">
                  <div className="flex flex-col items-end">
                    <span className={`text-sm font-bold ${tipoColor(op.type)}`}>
                      {tipoSign(op.type)}{formatAmount(op.amount)}€
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                      {formatAmount(saldoInfo.total || 0)}€
                    </span>
                  </div>
                  <button onClick={() => handleEditar(op)} className="p-2 text-slate-300 active:text-purple-600" aria-label="Editar movimiento">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteConfirm(op.id)} className="p-2 -mr-1 text-slate-300 active:text-red-500" aria-label="Eliminar movimiento">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-10">
              <p className="text-sm text-slate-400">Sin operaciones este mes</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* FAB */}
      <button onClick={() => setShowAddSheet(true)}
        aria-label="Añadir movimiento"
        className="fixed right-5 bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] z-[60] w-14 h-14 bg-purple-600 rounded-full shadow-lg shadow-purple-600/30 flex items-center justify-center text-white active:scale-90 transition-transform">
        <Plus className="w-6 h-6" />
      </button>

      {/* Confirm Delete */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end justify-center" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl w-full p-5 space-y-3 safe-area-bottom animate-slideUp" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-bold text-slate-900 dark:text-white text-center">¿Eliminar esta operación?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-slate-600">Cancelar</button>
              <button onClick={() => handleEliminar(deleteConfirm)} className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Sheet */}
      <MobileSheet isOpen={showAddSheet} onClose={() => {
        setShowAddSheet(false);
        resetForm();
      }} title={editingOperacion ? 'Editar Movimiento Personal' : 'Nuevo Movimiento Personal'} fullHeight>
        <form onSubmit={handleSubmit} className="space-y-5 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
            {['ingreso','gasto','ahorro','retirada-hucha'].map(t => (
              <button key={t} type="button" onClick={() => setFormData({...formData, tipo: t})}
                className={`py-2.5 rounded-lg text-xs font-semibold transition-all text-center ${formData.tipo === t ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm' : 'text-slate-500'}`}>
                {t === 'retirada-hucha' ? 'Retirada' : t === 'ahorro' ? 'Ahorro' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Fecha</label>
              <input type="date" value={formData.fecha} onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                className="w-full h-12 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" required />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Importe</label>
              <input type="number" step="0.01" inputMode="decimal" value={formData.cantidad} onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                className="w-full h-12 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold" placeholder="0,00" required />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Descripción</label>
            <input type="text" value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              className="w-full h-12 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" placeholder="Ej. Compra semanal" />
          </div>
          {formData.tipo === 'gasto' && (
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">Categoría</label>
              <div className="grid grid-cols-3 gap-2">
                {categorias.map(cat => (
                  <button key={cat.nombre} type="button" onClick={() => setFormData({...formData, categoria: cat.nombre})}
                    className={`py-2.5 rounded-xl text-[11px] font-semibold ${formData.categoria === cat.nombre ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                    {cat.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}
          {formData.tipo !== 'retirada-hucha' && (
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">
              {formData.tipo === 'ahorro' ? 'Cuenta de origen' : 'Cuenta'}
            </label>
            <div className="flex gap-2">
              {cuentasUsuario.map(c => (
                <button key={c} type="button" onClick={() => setFormData({...formData, cuenta: c})}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold ${formData.cuenta === c ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          )}
          {formData.tipo === 'retirada-hucha' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Origen</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Ahorro', ...cuentasUsuario].map(c => (
                    <button key={c} type="button" onClick={() => setFormData({...formData, cuentaOrigen: c})}
                      className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                        formData.cuentaOrigen === c ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Destino</label>
                <div className="grid grid-cols-2 gap-2">
                  {cuentasUsuario.map(c => (
                    <button key={c} type="button" onClick={() => setFormData({...formData, cuentaDestino: c})}
                      className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                        formData.cuentaDestino === c ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>{c}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.25rem)] bg-white dark:bg-slate-900 -mx-5 px-5 border-t border-slate-100 dark:border-slate-800 mt-2">
            <button type="submit" className="w-full py-3.5 bg-purple-600 text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-transform text-sm">
              {editingOperacion ? 'Guardar cambios' : 'Añadir Movimiento'}
            </button>
          </div>
        </form>
      </MobileSheet>

      {/* Edit Budget Sheet - por categoría */}
      <MobileSheet isOpen={showEditBudget} onClose={() => setShowEditBudget(false)} title="Presupuesto por Categoría" fullHeight>
        <div className="space-y-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define cuánto quieres gastar como máximo en cada categoría este mes.
          </p>

          <div className="space-y-3">
            {categorias.map(cat => {
              const CatIcon = cat.icon;
              return (
                <div key={cat.nombre} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorMap[cat.color] || colorMap.slate}`}>
                    <CatIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{cat.nombre}</label>
                    <div className="relative">
                      <input
                        type="number" step="1" inputMode="numeric"
                        value={editBudgets[cat.nombre] || ''}
                        onChange={(e) => setEditBudgets({...editBudgets, [cat.nombre]: parseFloat(e.target.value) || 0})}
                        className="w-full h-11 px-3 pr-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">€</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/20 rounded-xl p-3 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase">Total presupuesto</span>
              <span className="text-base font-extrabold text-purple-700 dark:text-purple-300">
                {formatAmount(Object.values(editBudgets).reduce((s, v) => s + (v || 0), 0))}€
              </span>
            </div>
          </div>

          <button
            onClick={async () => {
              try {
                const mesIdx = meses.indexOf(mesSeleccionado);
                await api.post(`/api/user/budgets/${añoSeleccionado}/${mesIdx}`, { presupuestos: editBudgets });
                setCategoryBudgets(editBudgets);
                setShowEditBudget(false);
                setToast('✓ Presupuesto guardado');
                setTimeout(() => setToast(null), 2500);
              } catch (error) {
                setToast('Error al guardar presupuesto');
                setTimeout(() => setToast(null), 3000);
              }
            }}
            className="w-full py-3.5 bg-purple-600 text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-transform text-sm"
          >
            Guardar Presupuesto
          </button>
        </div>
      </MobileSheet>
    </div>
  );
};

export default MobilePersonalAccount;
