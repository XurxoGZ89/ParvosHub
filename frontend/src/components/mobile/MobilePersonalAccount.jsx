import React, { useState, useEffect, useCallback } from 'react';
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
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showCategorias, setShowCategorias] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showEditBudget, setShowEditBudget] = useState(false);
  const [newBudget, setNewBudget] = useState('');

  const cuentasUsuario = user?.username === 'xurxo' ? ['Santander', 'Prepago'] : ['BBVA', 'Virtual'];

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0], tipo: 'gasto', cantidad: '',
    descripcion: '', categoria: 'Alimentación', cuenta: cuentasUsuario[0],
    cuentaOrigen: 'Ahorro', cuentaDestino: cuentasUsuario[0]
  });

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const mesIdx = meses.indexOf(mesSeleccionado);
      const mesFormato = `${añoSeleccionado}-${String(mesIdx + 1).padStart(2, '0')}`;
      const [opsRes, allOpsRes] = await Promise.all([
        api.get('/api/user/operations', { params: { mes: mesFormato } }),
        api.get('/api/user/operations')
      ]);
      setOperaciones((opsRes.data || []).map(op => ({ ...op, type: tipoEnToEs(op.type) })));
      setTodasLasOperaciones((allOpsRes.data || []).map(op => ({ ...op, type: tipoEnToEs(op.type) })));
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  }, [mesSeleccionado, añoSeleccionado]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const operacionesDelMes = operaciones;

  // Totales
  const calcularTotales = () => {
    const calcCuenta = (nombre) => todasLasOperaciones.filter(op => op.account_name === nombre)
      .reduce((sum, op) => {
        if (op.type === 'ingreso' || op.type === 'retirada-hucha') return sum + parseFloat(op.amount || 0);
        if (op.type === 'gasto') return sum - parseFloat(op.amount || 0);
        if (op.type === 'hucha') return sum + parseFloat(op.amount || 0);
        return sum;
      }, 0);
    const c1 = calcCuenta(cuentasUsuario[0]);
    const c2 = calcCuenta(cuentasUsuario[1]);
    const ingresos = operacionesDelMes.filter(op => op.type === 'ingreso' || op.type === 'retirada-hucha').reduce((s, op) => s + parseFloat(op.amount || 0), 0);
    const gastos = operacionesDelMes.filter(op => op.type === 'gasto').reduce((s, op) => s + parseFloat(op.amount || 0), 0);
    return { cuenta1: c1, cuenta2: c2, total: c1 + c2, ingresos, gastos };
  };

  // Ahorro
  const calcularAhorro = () => {
    const mesIdx = meses.indexOf(mesSeleccionado);
    const filtrar = (hasta) => todasLasOperaciones.filter(op => { const f = new Date(op.date); return f.getFullYear() < hasta.y || (f.getFullYear() === hasta.y && f.getMonth() <= hasta.m); })
      .filter(op => { const esH = (op.type === 'hucha') && (op.account_name === 'Ahorro' || !op.account_name); const esR = op.type === 'retirada-hucha' && op.account_name === 'Ahorro'; return esH || esR; })
      .reduce((s, op) => op.type === 'hucha' ? s + parseFloat(op.amount || 0) : s - parseFloat(op.amount || 0), 0);
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

  const handleEliminar = async (id) => {
    try { await api.delete(`/api/user/operations/${id}`); cargarDatos(); setDeleteConfirm(null); setToast('✓ Eliminado'); setTimeout(() => setToast(null), 2500); }
    catch (e) { setToast('Error al eliminar'); setTimeout(() => setToast(null), 3000); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        type: formData.tipo === 'gasto' ? 'expense' : formData.tipo === 'ingreso' ? 'income' : formData.tipo === 'hucha' ? 'savings' : 'savings_withdrawal',
        date: formData.fecha, amount: parseFloat(formData.cantidad), description: formData.descripcion,
        category: formData.tipo === 'gasto' ? formData.categoria : '', account_name: formData.cuenta
      };
      await api.post('/api/user/operations', payload);
      setShowAddSheet(false);
      setFormData({ fecha: new Date().toISOString().split('T')[0], tipo: 'gasto', cantidad: '', descripcion: '', categoria: 'Alimentación', cuenta: cuentasUsuario[0], cuentaOrigen: 'Ahorro', cuentaDestino: cuentasUsuario[0] });
      cargarDatos();
      setToast('✓ Movimiento creado'); setTimeout(() => setToast(null), 2500);
    } catch (error) { setToast('Error al crear'); setTimeout(() => setToast(null), 3000); }
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
      <div className="px-4 py-4 pb-28 space-y-4">
        {/* Selector de mes */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl px-2 py-1.5 border border-slate-200 dark:border-slate-800">
          <button onClick={() => cambiarMes(-1)} className="p-2 text-slate-400 active:scale-90"><ChevronLeft className="w-5 h-5" /></button>
          <span className="text-sm font-bold text-slate-800 dark:text-white capitalize">{mesSeleccionado} {añoSeleccionado}</span>
          <button onClick={() => cambiarMes(1)} className="p-2 text-slate-400 active:scale-90"><ChevronRight className="w-5 h-5" /></button>
        </div>

        {/* Saldo total */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saldo Total</p>
            {(() => {
              const mesIdx = meses.indexOf(mesSeleccionado);
              const mesAnteriorIdx = mesIdx === 0 ? 11 : mesIdx - 1;
              const añoAnterior = mesIdx === 0 ? añoSeleccionado - 1 : añoSeleccionado;
              const opsAnterior = todasLasOperaciones.filter(op => {
                const f = new Date(op.date);
                return f.getMonth() === mesAnteriorIdx && f.getFullYear() === añoAnterior;
              });
              const totalAnterior = opsAnterior.reduce((sum, op) => {
                if (op.type === 'ingreso' || op.type === 'retirada-hucha') return sum + parseFloat(op.amount || 0);
                if (op.type === 'gasto') return sum - parseFloat(op.amount || 0);
                return sum;
              }, 0);
              const diff = totales.total - totalAnterior;
              const pct = totalAnterior !== 0 ? ((diff / Math.abs(totalAnterior)) * 100) : 0;
              return diff !== 0 ? (
                <div className={`flex items-center gap-1 text-xs font-bold ${
                  diff > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {diff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{diff > 0 ? '+' : ''}{formatAmount(Math.abs(diff))}€ ({pct.toFixed(1)}%)</span>
                </div>
              ) : null;
            })()}
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{formatAmount(totales.total)}€</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {cuentasUsuario.map((c, i) => (
              <div key={c} className="bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg flex justify-between">
                <span className="text-xs font-medium text-slate-500">{c}</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{formatAmount(i === 0 ? totales.cuenta1 : totales.cuenta2)}€</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <div className="flex-1 bg-green-50 dark:bg-green-900/10 px-3 py-2 rounded-lg flex justify-between">
              <span className="text-[10px] font-bold text-green-600 uppercase">Ingresos</span>
              <span className="text-xs font-bold text-green-700">+{formatAmount(totales.ingresos)}€</span>
            </div>
            <div className="flex-1 bg-red-50 dark:bg-red-900/10 px-3 py-2 rounded-lg flex justify-between">
              <span className="text-[10px] font-bold text-red-600 uppercase">Gastos</span>
              <span className="text-xs font-bold text-red-700">-{formatAmount(totales.gastos)}€</span>
            </div>
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
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase">Presupuesto vs Real</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => { setNewBudget(totales.ingresos.toString()); setShowEditBudget(true); }}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 active:scale-95">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <span className={`text-xs font-bold ${
                totales.gastos <= totales.ingresos ? 'text-green-600' : 'text-red-600'
              }`}>
                {totales.gastos <= totales.ingresos ? '✔️ OK' : '⚠️ Sobre'}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-600 dark:text-slate-400">Presupuesto</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{formatAmount(totales.ingresos)}€</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-600 dark:text-slate-400">Gastado</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{formatAmount(totales.gastos)}€</span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {totales.ingresos > 0 ? Math.round((totales.gastos / totales.ingresos) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div className={`h-2 rounded-full ${
                  totales.gastos <= totales.ingresos ? 'bg-green-500' : 'bg-red-500'
                }`} style={{ width: `${Math.min((totales.gastos / (totales.ingresos || 1)) * 100, 100)}%` }} />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Disponible</span>
              <span className={`text-sm font-extrabold ${
                (totales.ingresos - totales.gastos) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatAmount(totales.ingresos - totales.gastos)}€
              </span>
            </div>
          </div>

          {/* Desglose por categorías */}
          <button onClick={() => setShowCategorias(!showCategorias)}
            className="w-full flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">Ver por categorías</span>
            <ChevronDown className={`w-4 h-4 text-purple-600 dark:text-purple-400 transition-transform duration-200 ${showCategorias ? 'rotate-180' : ''}`} />
          </button>
          {showCategorias && (() => {
            const catColorHex = { amber: '#f59e0b', red: '#ef4444', emerald: '#10b981', indigo: '#6366f1', purple: '#8b5cf6', slate: '#64748b', blue: '#3b82f6' };
            const gastosPorCat = categorias.map(cat => {
              const total = operacionesDelMes.filter(op => op.type === 'gasto' && op.category === cat.nombre)
                .reduce((s, op) => s + parseFloat(op.amount || 0), 0);
              return { ...cat, total };
            }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
            const maxCat = gastosPorCat.length > 0 ? gastosPorCat[0].total : 1;
            return (
              <div className="mt-3 space-y-2.5">
                {gastosPorCat.length > 0 ? gastosPorCat.map(cat => {
                  const CatIcon = cat.icon;
                  return (
                    <div key={cat.nombre}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${colorMap[cat.color] || colorMap.slate}`}>
                            <CatIcon className="w-3 h-3" />
                          </div>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{cat.nombre}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{formatAmount(cat.total)}€</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${(cat.total / maxCat) * 100}%`, backgroundColor: catColorHex[cat.color] || '#8b5cf6' }} />
                      </div>
                    </div>
                  );
                }) : <p className="text-xs text-slate-400 text-center py-2">Sin gastos este mes</p>}
              </div>
            );
          })()}
        </div>

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
            return (
              <div key={op.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3 active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorMap[cat.color] || colorMap.slate}`}>
                  <CatIcon className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{op.description || op.category || op.type}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {new Date(op.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} · {op.account_name}
                  </p>
                </div>
                <div className="text-right shrink-0 flex items-center gap-2">
                  <span className={`text-sm font-bold ${tipoColor(op.type)}`}>
                    {tipoSign(op.type)}{formatAmount(op.amount)}€
                  </span>
                  <button onClick={() => setDeleteConfirm(op.id)} className="p-1.5 text-slate-300 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
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
        className="fixed right-4 bottom-24 z-50 w-14 h-14 bg-purple-600 rounded-full shadow-lg shadow-purple-600/30 flex items-center justify-center text-white active:scale-90 transition-transform">
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
      <MobileSheet isOpen={showAddSheet} onClose={() => setShowAddSheet(false)} title="Nuevo Movimiento Personal" fullHeight>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            {['ingreso','gasto','hucha','retirada-hucha'].map(t => (
              <button key={t} type="button" onClick={() => setFormData({...formData, tipo: t})}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${formData.tipo === t ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm' : 'text-slate-500'}`}>
                {t === 'retirada-hucha' ? 'Retirada' : t === 'hucha' ? 'Ahorro' : t.charAt(0).toUpperCase() + t.slice(1)}
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
              <div className="grid grid-cols-4 gap-2">
                {categorias.map(cat => (
                  <button key={cat.nombre} type="button" onClick={() => setFormData({...formData, categoria: cat.nombre})}
                    className={`py-2.5 rounded-xl text-[11px] font-semibold ${formData.categoria === cat.nombre ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
                    {cat.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Cuenta</label>
            <div className="flex gap-2">
              {cuentasUsuario.map(c => (
                <button key={c} type="button" onClick={() => setFormData({...formData, cuenta: c})}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold ${formData.cuenta === c ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full py-3.5 bg-purple-600 text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-transform text-sm">
            Añadir Movimiento
          </button>
        </form>
      </MobileSheet>

      {/* Edit Budget Sheet */}
      <MobileSheet isOpen={showEditBudget} onClose={() => setShowEditBudget(false)} title="Editar Presupuesto">
        <form onSubmit={(e) => { e.preventDefault(); const val = parseFloat(newBudget); if (val > 0) { setToast('✓ Presupuesto: ' + val + '€'); setTimeout(() => setToast(null), 2500); setShowEditBudget(false); } }} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Nuevo presupuesto mensual</label>
            <div className="relative">
              <input type="number" step="0.01" inputMode="decimal" value={newBudget} onChange={(e) => setNewBudget(e.target.value)}
                className="w-full h-14 px-4 pr-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-bold text-center" 
                placeholder="0,00" required autoFocus />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">€</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Este es el límite mensual de ingresos para calcular tu presupuesto
            </p>
          </div>
          <button type="submit" className="w-full py-3.5 bg-purple-600 text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-transform text-sm">
            Guardar Presupuesto
          </button>
        </form>
      </MobileSheet>
    </div>
  );
};

export default MobilePersonalAccount;
