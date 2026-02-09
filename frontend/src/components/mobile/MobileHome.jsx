import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, User, Users, PiggyBank, UtensilsCrossed, Sun, Moon, CreditCard, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import MobileHeader from './MobileHeader';
import MobileSheet from './MobileSheet';
import api from '../../lib/api';
import useAuthStore from '../../stores/authStore';
import { usePrivacyFormatter } from '../../utils/privacyFormatter';
import { useCalendarEvents } from '../../contexts/CalendarEventsContext';

const MobileHome = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const formatAmount = usePrivacyFormatter();
  const { getEventosPorMes } = useCalendarEvents();
  const [userStats, setUserStats] = useState(null);
  const [parvosStats, setParvosStats] = useState(null);
  const [totalSavingsStats, setTotalSavingsStats] = useState(null);
  const [mealData, setMealData] = useState([]);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [modalType, setModalType] = useState('personal');
  const [formData, setFormData] = useState({
    tipo: 'gasto', fecha: new Date().toISOString().split('T')[0],
    cantidad: '', descripcion: '', categoria: 'Hogar',
    cuenta: 'BBVA Personal', cuentaOrigen: 'Ahorro', cuentaDestino: 'BBVA'
  });
  const [toast, setToast] = useState(null);

  const fetchData = async () => {
    try {
      const profileResponse = await api.get('/api/auth/profile');
      const userDashboardResponse = await api.get('/api/user/dashboard-summary');
      const userDashboard = userDashboardResponse.data;
      const totalSavingsResponse = await api.get('/api/user/total-savings');
      setTotalSavingsStats(totalSavingsResponse.data);
      const operationsResponse = await api.get('/operaciones');
      const mealsResponse = await api.get('/comidas-planificadas');
      const meals = Array.isArray(mealsResponse.data) ? mealsResponse.data : [];
      const operations = Array.isArray(operationsResponse.data) ? operationsResponse.data : [];

      const today = new Date(); today.setHours(0,0,0,0);
      const todayStr = today.toISOString().split('T')[0];
      const sevenDaysLater = new Date(today); sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      const sevenDaysStr = sevenDaysLater.toISOString().split('T')[0];
      const relevantMeals = meals.filter(m => m.fecha >= todayStr && m.fecha <= sevenDaysStr)
        .sort((a, b) => {
          const dc = a.fecha.localeCompare(b.fecha);
          if (dc !== 0) return dc;
          return a.tipo_comida === 'comida' ? -1 : 1;
        });
      setMealData(relevantMeals.length > 0 ? relevantMeals : meals.filter(m => new Date(m.fecha) >= today).sort((a, b) => new Date(a.fecha) - new Date(b.fecha)).slice(0, 4));

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthOps = operations.filter(op => { const d = new Date(op.fecha); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; });
      const ingresos = monthOps.filter(op => op.tipo === 'ingreso' || (op.tipo === 'retirada-hucha' && (op.cuenta === 'BBVA' || op.cuenta === 'Imagin'))).reduce((s, op) => s + parseFloat(op.cantidad || 0), 0);
      const gastos = monthOps.filter(op => op.tipo === 'gasto').reduce((s, op) => s + parseFloat(op.cantidad || 0), 0);
      const bbvaTotal = operations.filter(op => op.cuenta === 'BBVA').reduce((s, op) => op.tipo === 'gasto' ? s - parseFloat(op.cantidad || 0) : s + parseFloat(op.cantidad || 0), 0);
      const imaginTotal = operations.filter(op => op.cuenta === 'Imagin').reduce((s, op) => op.tipo === 'gasto' ? s - parseFloat(op.cantidad || 0) : s + parseFloat(op.cantidad || 0), 0);
      setParvosStats({ total: bbvaTotal + imaginTotal, bbva: bbvaTotal, imagin: imaginTotal, ingresosMes: ingresos, gastosMes: gastos });
      setUserStats({
        ...profileResponse.data, totalBalance: userDashboard.totalBalance,
        accounts: userDashboard.accounts, ingresosMes: userDashboard.currentMonth.ingresos,
        gastosMes: userDashboard.currentMonth.gastos
      });
    } catch (error) { console.error('Error:', error); }
  };

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let payload;
      let endpoint;
      
      if (modalType === 'personal') {
        // Personal: endpoint /api/user/operations con campos en inglés
        endpoint = '/api/user/operations';
        const typeMap = { gasto: 'expense', ingreso: 'income', ahorro: 'savings', 'retirada-hucha': 'savings_withdrawal' };
        payload = {
          type: typeMap[formData.tipo] || 'expense',
          date: formData.fecha,
          amount: parseFloat(formData.cantidad),
          description: formData.tipo === 'retirada-hucha' 
            ? `Traspaso ${formData.cuentaOrigen} a ${formData.cuentaDestino}${formData.descripcion ? ' - ' + formData.descripcion : ''}`
            : formData.descripcion,
          category: formData.tipo === 'gasto' ? formData.categoria : '',
          account_name: formData.tipo === 'retirada-hucha' ? formData.cuentaDestino : formData.cuenta
        };
      } else {
        // Parvos: endpoint /operaciones con campos en español
        endpoint = '/operaciones';
        if (formData.tipo === 'retirada-hucha') {
          payload = { tipo: formData.tipo, fecha: formData.fecha, cantidad: parseFloat(formData.cantidad), descripcion: `Traspaso ${formData.cuentaOrigen} a ${formData.cuentaDestino}${formData.descripcion ? ' - ' + formData.descripcion : ''}`, categoria: '', cuenta: formData.cuentaDestino, usuario: user?.username || 'Sonia' };
        } else if (formData.tipo === 'ahorro') {
          payload = { tipo: formData.tipo, fecha: formData.fecha, cantidad: parseFloat(formData.cantidad), descripcion: formData.descripcion, categoria: '', cuenta: formData.cuenta, usuario: user?.username || 'Sonia' };
        } else {
          payload = { tipo: formData.tipo, fecha: formData.fecha, cantidad: parseFloat(formData.cantidad), descripcion: formData.descripcion, categoria: formData.tipo === 'gasto' ? formData.categoria : '', cuenta: formData.cuenta, usuario: user?.username || 'Sonia' };
        }
      }
      await api.post(endpoint, payload);
      setShowAddSheet(false);
      setToast('✓ Movimiento creado');
      setTimeout(() => setToast(null), 2500);
      fetchData();
    } catch (error) { setToast('Error al crear el movimiento'); setTimeout(() => setToast(null), 3000); }
  };

  // Calendar events
  const currentMonthIdx = new Date().getMonth();
  const currentYearIdx = new Date().getFullYear();
  const eventosMesActual = getEventosPorMes(currentYearIdx, currentMonthIdx);
  const monthNames = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const today = new Date().getDate();

  if (!parvosStats || !userStats || !totalSavingsStats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <MobileHeader />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-16 left-4 right-4 z-[200] py-3 px-4 rounded-xl text-sm font-semibold text-center shadow-lg animate-fadeIn ${
          toast.startsWith('✓') ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>{toast}</div>
      )}
      
      <div className="px-4 py-4 pb-28 space-y-4">
        {/* Saludo */}
        <div className="mb-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            ¡Hola, {user?.fullName || user?.username}!
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Cards: Personal + Familiar */}
        <div className="grid grid-cols-2 gap-3">
          {/* Personal */}
          <button onClick={() => navigate('/user-account')} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-left active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Personal</span>
            </div>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">
              {formatAmount(userStats?.totalBalance || 0)}€
            </p>
            <div className="flex gap-2 mt-2">
              <span className="text-[10px] font-bold text-green-600">+{formatAmount(userStats?.ingresosMes || 0)}€</span>
              <span className="text-[10px] font-bold text-red-500">-{formatAmount(userStats?.gastosMes || 0)}€</span>
            </div>
          </button>

          {/* Familiar */}
          <button onClick={() => navigate('/gastos')} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-left active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Familiar</span>
            </div>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">
              {formatAmount(parvosStats?.total || 0)}€
            </p>
            <div className="flex gap-2 mt-2">
              <span className="text-[10px] font-bold text-green-600">+{formatAmount(parvosStats?.ingresosMes || 0)}€</span>
              <span className="text-[10px] font-bold text-red-500">-{formatAmount(parvosStats?.gastosMes || 0)}€</span>
            </div>
          </button>
        </div>

        {/* Ahorro Total Compacto */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-4 rounded-xl text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-white/90" />
              <span className="text-xs font-bold text-white/90 uppercase">Ahorro Total</span>
            </div>
            <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-lg">
              {totalSavingsStats?.difference > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span className="text-xs font-bold">
                {totalSavingsStats?.difference > 0 ? '+' : ''}{formatAmount(totalSavingsStats?.difference || 0)}€
              </span>
              <span className="text-[10px] text-white/80">
                ({totalSavingsStats?.differencePercentage > 0 ? '+' : ''}{totalSavingsStats?.differencePercentage?.toFixed(1) || 0}%)
              </span>
            </div>
          </div>
          <p className="text-2xl font-extrabold mb-3">
            {formatAmount(totalSavingsStats?.totalSavings || 0)}€
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/20 px-2 py-1.5 rounded-lg">
              <p className="text-[9px] text-white/70 uppercase">Parvos</p>
              <p className="text-xs font-bold">{formatAmount(totalSavingsStats?.parvos || 0)}€</p>
            </div>
            <div className="bg-white/20 px-2 py-1.5 rounded-lg">
              <p className="text-[9px] text-white/70 uppercase">Xurxo</p>
              <p className="text-xs font-bold">{formatAmount(totalSavingsStats?.xurxo || 0)}€</p>
            </div>
            <div className="bg-white/20 px-2 py-1.5 rounded-lg">
              <p className="text-[9px] text-white/70 uppercase">Sonia</p>
              <p className="text-xs font-bold">{formatAmount(totalSavingsStats?.sonia || 0)}€</p>
            </div>
          </div>
        </div>

        {/* Menú de hoy */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <button onClick={() => navigate('/calendario-comidas')} className="w-full flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Menú próximo</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {mealData.filter(m => { const d = new Date(m.fecha + 'T12:00:00'); const t = new Date(); t.setHours(0,0,0,0); return d >= t; }).slice(0, 4).map((meal, idx) => {
              const mealDate = new Date(meal.fecha + 'T12:00:00');
              const todayDate = new Date(); todayDate.setHours(0,0,0,0);
              const diff = Math.floor((mealDate - todayDate) / 86400000);
              const label = diff === 0 ? 'Hoy' : diff === 1 ? 'Mañana' : ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][mealDate.getDay()];
              const isComida = meal.tipo_comida === 'comida';
              const getCatDot = (cat, manual) => {
                if (manual || cat === 'comer_fuera') return 'bg-amber-400';
                if (cat === 'carne') return 'bg-red-400';
                if (cat === 'pescado') return 'bg-blue-400';
                if (cat === 'vegetariano') return 'bg-green-400';
                return 'bg-slate-300';
              };
              return (
                <div key={meal.id || idx} className="flex items-center gap-3 px-4 py-2.5">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${getCatDot(meal.categoria, !meal.comida_id)}`} />
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isComida ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-indigo-50 dark:bg-indigo-900/20'}`}>
                    {isComida ? <Sun className="w-3 h-3 text-amber-500" /> : <Moon className="w-3 h-3 text-indigo-400" />}
                  </div>
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 truncate">{meal.comida_nombre}</span>
                  <div className="text-right shrink-0">
                    <p className={`text-[10px] font-bold ${diff === 0 ? 'text-purple-600' : 'text-slate-400'}`}>{label}</p>
                  </div>
                </div>
              );
            })}
            {mealData.length === 0 && (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-slate-400">Sin comidas planificadas</p>
              </div>
            )}
          </div>
        </div>

        {/* Próximos gastos extraordinarios */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <button onClick={() => navigate('/calendario-gastos')} className="w-full flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5 text-pink-500" />
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Gastos {monthNames[currentMonthIdx]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">
                {eventosMesActual.reduce((s, e) => s + parseFloat(e.cantidad_min || 0), 0).toFixed(0)}€
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </button>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {eventosMesActual.sort((a, b) => a.dia_mes - b.dia_mes).slice(0, 4).map((ev, idx) => {
              const isPast = ev.dia_mes < today;
              const isToday = ev.dia_mes === today;
              return (
                <div key={ev.id || idx} className={`flex items-center gap-3 px-4 py-2.5 ${isPast ? 'opacity-40' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    isToday ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    {ev.dia_mes}
                  </div>
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 truncate">{ev.nombre}</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-white shrink-0">
                    {ev.cantidad_max ? `${ev.cantidad_min}–${ev.cantidad_max}€` : `${ev.cantidad_min}€`}
                  </span>
                </div>
              );
            })}
            {eventosMesActual.length === 0 && (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-slate-400">Sin gastos extraordinarios</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => { setModalType('parvos'); setShowAddSheet(true); }}
        className="fixed right-5 bottom-[5.5rem] z-[60] w-14 h-14 bg-purple-600 rounded-full shadow-lg shadow-purple-600/30 flex items-center justify-center text-white active:scale-90 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Sheet: Añadir movimiento */}
      <MobileSheet isOpen={showAddSheet} onClose={() => setShowAddSheet(false)} title={`Nuevo Movimiento ${modalType === 'parvos' ? 'Familiar' : 'Personal'}`} fullHeight>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tipo selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            {['ingreso', 'gasto', 'ahorro', 'retirada-hucha'].map(tipo => (
              <button key={tipo} type="button"
                onClick={() => setFormData({...formData, tipo})}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  formData.tipo === tipo ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                {tipo === 'retirada-hucha' ? 'Retirada' : tipo.charAt(0).toUpperCase() + tipo.slice(1)}
              </button>
            ))}
          </div>

          {/* Tipo cuenta */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            {['parvos', 'personal'].map(t => (
              <button key={t} type="button"
                onClick={() => {
                  setModalType(t);
                  setFormData({...formData, cuenta: t === 'personal' ? 'Santander' : 'BBVA'});
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  modalType === t ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                {t === 'parvos' ? 'Familiar' : 'Personal'}
              </button>
            ))}
          </div>

          {/* Fecha + Cantidad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Fecha</label>
              <input type="date" value={formData.fecha}
                onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                className="w-full h-12 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white" required />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Importe</label>
              <div className="relative">
                <input type="number" step="0.01" inputMode="decimal" value={formData.cantidad}
                  onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                  className="w-full h-12 px-3 pr-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white"
                  placeholder="0,00" required />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">€</span>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Descripción</label>
            <input type="text" value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              className="w-full h-12 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
              placeholder="Ej. Compra semanal" />
          </div>

          {/* Categoría (solo gasto) */}
          {formData.tipo === 'gasto' && (
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">Categoría</label>
              <div className="grid grid-cols-4 gap-2">
                {['Alimentación','Hogar','Ocio','Movilidad','Deporte','Extra','Vacaciones'].map(cat => (
                  <button key={cat} type="button"
                    onClick={() => setFormData({...formData, categoria: cat})}
                    className={`py-2.5 rounded-xl text-[11px] font-semibold transition-all ${
                      formData.categoria === cat ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cuenta */}
          {formData.tipo !== 'retirada-hucha' && (
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">
                {formData.tipo === 'ahorro' ? 'Cuenta de origen' : 'Cuenta'}
              </label>
              <div className="flex gap-2">
                {(modalType === 'personal' ? ['Santander', 'Prepago'] : ['BBVA', 'Imagin']).map(c => (
                  <button key={c} type="button"
                    onClick={() => setFormData({...formData, cuenta: c})}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                      formData.cuenta === c ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cuentas origen/destino para retirada */}
          {formData.tipo === 'retirada-hucha' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Origen</label>
                <select value={formData.cuentaOrigen} onChange={(e) => setFormData({...formData, cuentaOrigen: e.target.value})}
                  className="w-full h-12 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                  <option value="Ahorro">Ahorro</option>
                  {(modalType === 'personal' ? ['Santander', 'Prepago'] : ['BBVA', 'Imagin']).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Destino</label>
                <select value={formData.cuentaDestino} onChange={(e) => setFormData({...formData, cuentaDestino: e.target.value})}
                  className="w-full h-12 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                  {(modalType === 'personal' ? ['Santander', 'Prepago'] : ['BBVA', 'Imagin']).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          <button type="submit" className="w-full h-13 bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 active:scale-[0.98] transition-transform text-sm py-3.5">
            <Plus className="w-4 h-4 inline mr-1.5" />
            Añadir Movimiento
          </button>
        </form>
      </MobileSheet>
    </div>
  );
};

export default MobileHome;
