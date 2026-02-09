import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Euro, FileText, Tag, CreditCard, X, Sun, Moon, User, Users, PiggyBank, UtensilsCrossed, RefreshCw, Shield, Landmark, Cake, Plane, Heart, GraduationCap, Home as HomeIcon, Car, Star, Pin, Beef, Fish, Salad, BarChart3 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import api from '../lib/api';
import useAuthStore from '../stores/authStore';
import { usePrivacyFormatter } from '../utils/privacyFormatter';
import { useCalendarEvents } from '../contexts/CalendarEventsContext';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const formatAmount = usePrivacyFormatter();
  const { getEventosPorMes } = useCalendarEvents();
  const [userStats, setUserStats] = useState(null);
  const [parvosStats, setParvosStats] = useState(null);
  const [totalSavingsStats, setTotalSavingsStats] = useState(null);
  const [mealData, setMealData] = useState([]);
  const [mealPage, setMealPage] = useState(0);
  const [expensePage, setExpensePage] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('personal'); // 'personal' or 'parvos'
  const [formData, setFormData] = useState({
    tipo: 'gasto',
    fecha: new Date().toISOString().split('T')[0],
    cantidad: '',
    descripcion: '',
    categoria: 'Hogar',
    cuenta: 'BBVA Personal',
    cuentaOrigen: 'Ahorro',
    cuentaDestino: 'BBVA'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileResponse = await api.get('/api/auth/profile');
        setUserStats(profileResponse.data);

        // Obtener resumen del dashboard personal del usuario
        const userDashboardResponse = await api.get('/api/user/dashboard-summary');
        const userDashboard = userDashboardResponse.data;

        // Obtener ahorro total combinado
        const totalSavingsResponse = await api.get('/api/user/total-savings');
        setTotalSavingsStats(totalSavingsResponse.data);

        const operationsResponse = await api.get('/operaciones');
        const mealsResponse = await api.get('/comidas-planificadas');

        const meals = Array.isArray(mealsResponse.data) ? mealsResponse.data : [];
        const operations = Array.isArray(operationsResponse.data) ? operationsResponse.data : [];
        
        // Process meals - Filtrar por próximos 8 días (hoy + 7 días)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Resetear horas para comparación precisa
        
        const todayStr = today.toISOString().split('T')[0];
        
        // Calcular fecha límite (hoy + 7 días = 8 días total)
        const sevenDaysLater = new Date(today);
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
        const sevenDaysStr = sevenDaysLater.toISOString().split('T')[0];
        
        console.log('Rango de búsqueda de comidas:', { todayStr, sevenDaysStr });
        console.log('Comidas disponibles:', meals);
        
        const relevantMeals = meals.filter(meal => {
          const mealDate = meal.fecha;
          return mealDate >= todayStr && mealDate <= sevenDaysStr;
        }).sort((a, b) => {
          // Primero por fecha ASC
          const dateCompare = a.fecha.localeCompare(b.fecha);
          if (dateCompare !== 0) return dateCompare;
          // Luego comida antes que cena
          if (a.tipo_comida === 'comida' && b.tipo_comida === 'cena') return -1;
          if (a.tipo_comida === 'cena' && b.tipo_comida === 'comida') return 1;
          return 0;
        });

        console.log('Comidas filtradas (próximos 8 días):', relevantMeals);

        let displayMeals = relevantMeals;
        if (displayMeals.length === 0) {
          // Fallback: tomar las 2 próximas comidas disponibles
          displayMeals = meals
            .filter(m => new Date(m.fecha) >= today)
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
            .slice(0, 2);
        }
        setMealData(displayMeals);

        // Calculate stats
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthOperations = operations.filter(op => {
          const opDate = new Date(op.fecha);
          return opDate.getMonth() === currentMonth && opDate.getFullYear() === currentYear;
        });

        const ingresos = monthOperations
          .filter(op => op.tipo === 'ingreso' || 
            (op.tipo === 'retirada-hucha' && (op.cuenta === 'BBVA' || op.cuenta === 'Imagin')))
          .reduce((sum, op) => sum + parseFloat(op.cantidad || 0), 0);

        const gastos = monthOperations
          .filter(op => op.tipo === 'gasto')
          .reduce((sum, op) => sum + parseFloat(op.cantidad || 0), 0);

        const bbvaOps = operations.filter(op => op.cuenta === 'BBVA');
        const imaginOps = operations.filter(op => op.cuenta === 'Imagin');

        const bbvaTotal = bbvaOps.reduce((sum, op) => {
          if (op.tipo === 'gasto') return sum - parseFloat(op.cantidad || 0);
          return sum + parseFloat(op.cantidad || 0);
        }, 0);

        const imaginTotal = imaginOps.reduce((sum, op) => {
          if (op.tipo === 'gasto') return sum - parseFloat(op.cantidad || 0);
          return sum + parseFloat(op.cantidad || 0);
        }, 0);

        setParvosStats({
          total: bbvaTotal + imaginTotal,
          bbva: bbvaTotal,
          imagin: imaginTotal,
          ingresosMes: ingresos,
          gastosMes: gastos
        });

        // Guardar stats del usuario personal
        setUserStats({
          ...profileResponse.data,
          totalBalance: userDashboard.totalBalance,
          accounts: userDashboard.accounts,
          ingresosMes: userDashboard.currentMonth.ingresos,
          gastosMes: userDashboard.currentMonth.gastos
        });

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, []);

  // Generate calendar for current month
  const generateCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    // Ajustar para que empiece en lunes (0=domingo, queremos 0=lunes)
    let startingDayOfWeek = firstDay.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6; // Si es domingo, ponerlo al final
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const calendarDays = generateCalendar();
  const today = new Date().getDate();
  const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const currentMonth = monthNames[new Date().getMonth()];

  // Categorías con colores para el widget (subset del ExpensesCalendar)
  const WIDGET_CATS = {
    factura: { icon: FileText, dot: 'bg-orange-500' }, suscripcion: { icon: RefreshCw, dot: 'bg-violet-500' },
    seguro: { icon: Shield, dot: 'bg-emerald-500' }, impuesto: { icon: Landmark, dot: 'bg-red-500' },
    cumpleanos: { icon: Cake, dot: 'bg-rose-500' }, viaje: { icon: Plane, dot: 'bg-amber-500' },
    medico: { icon: Heart, dot: 'bg-teal-500' }, educacion: { icon: GraduationCap, dot: 'bg-indigo-500' },
    hogar: { icon: HomeIcon, dot: 'bg-cyan-500' }, vehiculo: { icon: Car, dot: 'bg-slate-500' },
    dia_especial: { icon: Star, dot: 'bg-blue-500' }, otro: { icon: Pin, dot: 'bg-gray-500' },
  };
  const LEGACY_CAT_MAP = { 'Cumpleaños': 'cumpleanos', 'Seguro': 'seguro', 'Viaje': 'viaje', 'Día Especial': 'dia_especial' };
  const getCatWidget = (cat) => WIDGET_CATS[LEGACY_CAT_MAP[cat] || cat] || WIDGET_CATS.otro;

  const currentMonthIdx = new Date().getMonth();
  const currentYearIdx = new Date().getFullYear();
  const eventosMesActual = getEventosPorMes(currentYearIdx, currentMonthIdx);

  const getEventsForDay = (day) => {
    if (!day) return [];
    return eventosMesActual.filter(e => e.dia_mes === day);
  };

  const formatRecurrenciaWidget = (rec) => {
    if (!rec) return 'Anual';
    const r = typeof rec === 'string' ? JSON.parse(rec) : rec;
    switch (r.tipo) {
      case 'unica': return 'Una vez';
      case 'mensual': return 'Mensual';
      case 'trimestral': return 'Trimestral';
      case 'semestral': return 'Semestral';
      case 'anual': return 'Anual';
      case 'cadaX': return `Cada ${r.cadaX || '?'} meses`;
      default: return r.tipo || 'Anual';
    }
  };

  const handleSubmitMovement = async (e) => {
    e.preventDefault();
    try {
      let endpoint, payload;
      
      if (modalType === 'personal') {
        // Personal usa /api/user/operations con campos en inglés
        endpoint = '/api/user/operations';
        const tipoMap = { 'gasto': 'expense', 'ingreso': 'income', 'hucha': 'savings', 'retirada-hucha': 'savings_withdrawal' };
        payload = {
          type: tipoMap[formData.tipo] || formData.tipo,
          date: formData.fecha,
          amount: parseFloat(formData.cantidad),
          description: formData.descripcion,
          category: formData.tipo === 'gasto' ? formData.categoria : '',
          account_name: formData.cuenta
        };
      } else {
        // Parvos usa /operaciones con campos en español
        endpoint = '/operaciones';
        if (formData.tipo === 'retirada-hucha') {
          const descripcionTraspaso = `Traspaso ${formData.cuentaOrigen} a ${formData.cuentaDestino}${formData.descripcion ? ' - ' + formData.descripcion : ''}`;
          payload = {
            tipo: formData.tipo,
            fecha: formData.fecha,
            cantidad: parseFloat(formData.cantidad),
            descripcion: descripcionTraspaso,
            categoria: '',
            cuenta: formData.cuentaDestino,
            usuario: user?.username || 'Sonia'
          };
        } else if (formData.tipo === 'ahorro') {
          payload = {
            tipo: formData.tipo,
            fecha: formData.fecha,
            cantidad: parseFloat(formData.cantidad),
            descripcion: formData.descripcion,
            categoria: '',
            cuenta: formData.cuenta,
            usuario: user?.username || 'Sonia'
          };
        } else {
          payload = {
            tipo: formData.tipo,
            fecha: formData.fecha,
            cantidad: parseFloat(formData.cantidad),
            descripcion: formData.descripcion,
            categoria: formData.tipo === 'gasto' ? formData.categoria : '',
            cuenta: formData.cuenta,
            usuario: user?.username || 'Sonia'
          };
        }
      }

      console.log('Enviando movimiento:', payload);
      await api.post(endpoint, payload);
      
      // Recargar datos
      setShowModal(false);
      setFormData({
        tipo: 'gasto',
        fecha: new Date().toISOString().split('T')[0],
        cantidad: '',
        descripcion: '',
        categoria: 'Hogar',
        cuenta: 'BBVA Personal',
        cuentaOrigen: 'Ahorro',
        cuentaDestino: 'BBVA'
      });
      
      // Refrescar datos
      window.location.reload();
    } catch (error) {
      console.error('Error al crear movimiento:', error);
      alert('Error al crear el movimiento');
    }
  };

  if (!parvosStats || !userStats || !totalSavingsStats) {
    return <div className="flex items-center justify-center h-64">Cargando...</div>;
  }

  return (
    <div className="space-y-5">
      {/* Primera fila - 3 widgets de situación */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
      {/* Personal Situation */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/10 flex items-center justify-center">
              <User className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Situación Global Personal</h2>
          </div>
          <Button 
            onClick={() => navigate('/user-account')}
            variant="ghost"
            className="text-purple-600 font-semibold text-xs hover:opacity-80 h-auto p-0 hover:underline"
          >
            Ver todo
          </Button>
        </div>

        <div className="flex items-start justify-between mb-5">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Saldo Total</p>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
              {formatAmount(userStats?.totalBalance || 0)}€
            </h3>
          </div>
          <button
            onClick={() => {
              setModalType('personal');
              setFormData({
                tipo: 'gasto',
                fecha: new Date().toISOString().split('T')[0],
                cantidad: '',
                descripcion: '',
                categoria: 'Hogar',
                cuenta: 'Santander',
                cuentaOrigen: 'Ahorro',
                cuentaDestino: 'Santander'
              });
              setShowModal(true);
            }}
            className="group flex items-center justify-center w-10 h-10 rounded-full bg-purple-600/10 hover:bg-purple-600 text-purple-600 hover:text-white transition-all duration-200 active:scale-95"
            title="Añadir movimiento"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {userStats?.accounts?.filter(acc => acc.account_name !== 'Ahorro').map((account, idx) => (
            <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 px-2.5 py-2 rounded-lg border border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{account.account_name}</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {formatAmount(account.balance || 0)}€
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex-1 flex items-center justify-between bg-green-50/50 dark:bg-green-900/10 px-2.5 py-1.5 rounded-lg border border-green-100/50 dark:border-green-900/20">
            <span className="text-[10px] font-bold text-green-600 dark:text-green-500 uppercase tracking-wide">Ingresos {currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)}</span>
            <span className="text-xs font-bold text-green-700 dark:text-green-400">
              +{formatAmount(userStats?.ingresosMes || 0)}€
            </span>
          </div>
          <div className="flex-1 flex items-center justify-between bg-red-50/50 dark:bg-red-900/10 px-2.5 py-1.5 rounded-lg border border-red-100/50 dark:border-red-900/20">
            <span className="text-[10px] font-bold text-red-600 dark:text-red-500 uppercase tracking-wide">Gastos {currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)}</span>
            <span className="text-xs font-bold text-red-700 dark:text-red-400">
              -{formatAmount(userStats?.gastosMes || 0)}€
            </span>
          </div>
        </div>
      </div>

      {/* Family Situation */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Situación Global Familiar</h2>
          </div>
          <Button 
            onClick={() => navigate('/gastos')}
            variant="ghost"
            className="text-purple-600 font-semibold text-xs hover:opacity-80 h-auto p-0 hover:underline"
          >
            Ver todo
          </Button>
        </div>

        <div className="flex items-start justify-between mb-5">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Saldo Total</p>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
              {formatAmount(parvosStats?.total || 0)}€
            </h3>
          </div>
          <button
            onClick={() => {
              setModalType('parvos');
              setFormData({
                tipo: 'gasto',
                fecha: new Date().toISOString().split('T')[0],
                cantidad: '',
                descripcion: '',
                categoria: 'Hogar',
                cuenta: 'BBVA',
                cuentaOrigen: 'Ahorro',
                cuentaDestino: 'BBVA'
              });
              setShowModal(true);
            }}
            className="group flex items-center justify-center w-10 h-10 rounded-full bg-purple-600/10 hover:bg-purple-600 text-purple-600 hover:text-white transition-all duration-200 active:scale-95"
            title="Añadir movimiento"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-slate-50 dark:bg-slate-800/40 px-2.5 py-2 rounded-lg border border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">BBVA</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">{formatAmount(parvosStats?.bbva || 0)}€</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/40 px-2.5 py-2 rounded-lg border border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Imagin</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">{formatAmount(parvosStats?.imagin || 0)}€</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex-1 flex items-center justify-between bg-green-50/50 dark:bg-green-900/10 px-2.5 py-1.5 rounded-lg border border-green-100/50 dark:border-green-900/20">
            <span className="text-[10px] font-bold text-green-600 dark:text-green-500 uppercase tracking-wide">Ingresos {currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)}</span>
            <span className="text-xs font-bold text-green-700 dark:text-green-400">+{formatAmount(parvosStats?.ingresosMes || 0)}€</span>
          </div>
          <div className="flex-1 flex items-center justify-between bg-red-50/50 dark:bg-red-900/10 px-2.5 py-1.5 rounded-lg border border-red-100/50 dark:border-red-900/20">
            <span className="text-[10px] font-bold text-red-600 dark:text-red-500 uppercase tracking-wide">Gastos {currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)}</span>
            <span className="text-xs font-bold text-red-700 dark:text-red-400">-{formatAmount(parvosStats?.gastosMes || 0)}€</span>
          </div>
        </div>
      </div>

      {/* Ahorro Total Parvos */}
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 p-5 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-600/20 flex items-center justify-center">
            <PiggyBank className="w-4 h-4 text-emerald-600" />
          </div>
          <h2 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Ahorro Total Parvos</h2>
        </div>

        <div className="mb-4">
          <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1.5">Saldo Total</p>
          <h3 className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-100 tracking-tight">
            {formatAmount(totalSavingsStats?.totalSavings || 0)}€
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white/60 dark:bg-slate-800/40 px-2 py-2 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 block mb-0.5">Parvos</span>
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-100">
              {formatAmount(totalSavingsStats?.parvos || 0)}€
            </span>
          </div>
          <div className="bg-white/60 dark:bg-slate-800/40 px-2 py-2 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 block mb-0.5">Xurxo</span>
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-100">
              {formatAmount(totalSavingsStats?.xurxo || 0)}€
            </span>
          </div>
          <div className="bg-white/60 dark:bg-slate-800/40 px-2 py-2 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 block mb-0.5">Sonia</span>
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-100">
              {formatAmount(totalSavingsStats?.sonia || 0)}€
            </span>
          </div>
        </div>

        <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${
          totalSavingsStats?.difference > 0 
            ? 'bg-emerald-100/60 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
            : totalSavingsStats?.difference === 0
            ? 'bg-amber-100/60 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            : 'bg-red-50/50 dark:bg-red-900/10 border-red-100/50 dark:border-red-900/20'
        }`}>
          <span className={`text-[10px] font-bold uppercase tracking-wide ${
            totalSavingsStats?.difference > 0 
              ? 'text-emerald-700 dark:text-emerald-400' 
              : totalSavingsStats?.difference === 0
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-red-600 dark:text-red-500'
          }`}>
            vs. Mes Anterior
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-bold ${
              totalSavingsStats?.difference > 0 
                ? 'text-emerald-800 dark:text-emerald-300'
                : totalSavingsStats?.difference === 0
                ? 'text-amber-800 dark:text-amber-300' 
                : 'text-red-700 dark:text-red-400'
            }`}>
              {totalSavingsStats?.difference > 0 ? '+' : ''}{formatAmount(totalSavingsStats?.difference || 0)}€
            </span>
            <span className={`text-[11px] font-bold ${
              totalSavingsStats?.difference > 0 
                ? 'text-emerald-800 dark:text-emerald-300'
                : totalSavingsStats?.difference === 0
                ? 'text-amber-800 dark:text-amber-300' 
                : 'text-red-700 dark:text-red-400'
            }`}>
              ({totalSavingsStats?.percentageChange > 0 ? '+' : ''}{totalSavingsStats?.percentageChange?.toFixed(1) || 0}%)
            </span>
          </div>
        </div>
      </div>
      </div>

      {/* Segunda fila - Resto de widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">

      {/* Menú Semanal - Lista + Stats */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-sm">
              <UtensilsCrossed className="w-4 h-4 text-amber-500" />
            </div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Menú Semanal</h2>
          </div>
          <button 
            onClick={() => navigate('/calendario-comidas')}
            className="text-purple-600 font-semibold text-xs hover:opacity-80 hover:underline"
          >
            Ver todo
          </button>
        </div>

        {/* Mini Stats Row */}
        {(() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7));
          const weekDates = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            return d.toISOString().split('T')[0];
          });
          const planificadas = mealData.filter(m => weekDates.includes(m.fecha)).length;
          const pct = Math.round((planificadas / 14) * 100);
          
          return (
            <div className="flex gap-2 mb-3">
              <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500">Semana</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-12 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-purple-600">{planificadas}/14</span>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                <Beef className="w-3 h-3 text-red-500" />
                <span className="text-[10px] font-bold text-red-600">{mealData.filter(m => m.categoria === 'carne').length}</span>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                <Fish className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] font-bold text-blue-600">{mealData.filter(m => m.categoria === 'pescado').length}</span>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                <Salad className="w-3 h-3 text-green-500" />
                <span className="text-[10px] font-bold text-green-600">{mealData.filter(m => m.categoria === 'vegetariano').length}</span>
              </div>
            </div>
          );
        })()}

        {/* Lista de comidas */}
        <div className="space-y-1.5">
          {mealData.length > 0 ? (
            <>
              {[...mealData]
                .filter(meal => {
                  // Filtrar comidas pasadas antes de mostrar
                  const mealDate = new Date(meal.fecha + 'T12:00:00');
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return mealDate >= today;
                })
                .sort((a, b) => {
                  // Ordenar: fecha ASC, luego comida antes que cena
                  const dateCompare = a.fecha.localeCompare(b.fecha);
                  if (dateCompare !== 0) return dateCompare;
                  if (a.tipo_comida === 'comida' && b.tipo_comida === 'cena') return -1;
                  if (a.tipo_comida === 'cena' && b.tipo_comida === 'comida') return 1;
                  return 0;
                })
                .slice(mealPage * 8, (mealPage + 1) * 8).map((meal, idx) => {
                const mealDate = new Date(meal.fecha + 'T12:00:00');
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const daysFromNow = Math.floor((mealDate - today) / (1000 * 60 * 60 * 24));
                
                const esHoy = daysFromNow === 0;
                const esManana = daysFromNow === 1;
                const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab'];
                const dateLabel = esHoy ? 'Hoy' : esManana ? 'Mañana' : dayNames[mealDate.getDay()];

                const getCatDot = (cat, manual) => {
                  if (manual || cat === 'comer_fuera') return 'bg-amber-400';
                  switch(cat) {
                    case 'carne': return 'bg-red-400';
                    case 'pescado': return 'bg-blue-400';
                    case 'vegetariano': return 'bg-green-400';
                    default: return 'bg-slate-300';
                  }
                };

                const esManual = !meal.comida_id;
                const esComida = meal.tipo_comida === 'comida';
                
                return (
                  <div 
                    key={meal.id || idx} 
                    onClick={() => navigate('/calendario-comidas')}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all group ${
                      esHoy 
                        ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800' 
                        : 'bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${getCatDot(meal.categoria, esManual)}`} />
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${esComida ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-indigo-100 dark:bg-indigo-900/40'}`}>
                      {esComida 
                        ? <Sun className="w-3 h-3 text-amber-500" />
                        : <Moon className="w-3 h-3 text-indigo-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate text-slate-700 dark:text-slate-200">
                        {meal.comida_nombre}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-[10px] font-bold ${esHoy ? 'text-purple-600' : 'text-slate-400'}`}>{dateLabel}</p>
                      <p className="text-[10px] text-slate-400">{mealDate.getDate()}/{mealDate.getMonth() + 1}</p>
                    </div>
                  </div>
                );
              })}
              
              {/* Paginación compacta */}
              {mealData.length > 8 && (
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMealPage(Math.max(0, mealPage - 1)); }}
                    disabled={mealPage === 0}
                    className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 disabled:opacity-30 text-sm"
                  >
                    ‹
                  </button>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {mealPage + 1}/{Math.ceil(mealData.length / 8)}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMealPage(Math.min(Math.ceil(mealData.length / 8) - 1, mealPage + 1)); }}
                    disabled={mealPage >= Math.ceil(mealData.length / 8) - 1}
                    className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 disabled:opacity-30 text-sm"
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          ) : (
            <div 
              onClick={() => navigate('/calendario-comidas')}
              className="flex items-center justify-center gap-2 p-4 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 text-slate-400" />
              <p className="text-xs text-slate-500">Planificar semana</p>
            </div>
          )}
        </div>
      </div>

      {/* Gastos Extraordinarios */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-pink-500/10 text-pink-500 rounded-xl flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Gastos extraordinarios {currentMonth}</h2>
          </div>
          <button 
            onClick={() => navigate('/calendario-gastos')}
            className="text-purple-600 font-semibold text-xs hover:opacity-80 hover:underline"
          >
            Ver todo
          </button>
        </div>

        {/* Mini Stats Row */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500">Total mes</span>
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
              {eventosMesActual.reduce((sum, e) => sum + parseFloat(e.cantidad_min || 0), 0).toFixed(0)}€
            </span>
          </div>
          <div className="flex-1 bg-pink-50 dark:bg-pink-900/20 px-2.5 py-1.5 rounded-lg flex items-center justify-between">
            <span className="text-[10px] font-semibold text-pink-600">Media gasto</span>
            <span className="text-[10px] font-bold text-pink-600">
              {eventosMesActual.length > 0 ? (eventosMesActual.reduce((sum, e) => sum + parseFloat(e.cantidad_min || 0), 0) / eventosMesActual.length).toFixed(0) : 0}€
            </span>
          </div>
        </div>

        {/* Badges de categorías activas */}
        {(() => {
          const catCounts = {};
          eventosMesActual.forEach(e => {
            const key = LEGACY_CAT_MAP[e.categoria] || e.categoria;
            catCounts[key] = (catCounts[key] || 0) + 1;
          });
          const activeCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
          if (activeCats.length === 0) return null;
          return (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {activeCats.map(([cat, count]) => {
                const info = WIDGET_CATS[cat] || WIDGET_CATS.otro;
                return (
                  <div key={cat} className="bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                    <info.icon className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{count}</span>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Lista de gastos del mes */}
        <div className="space-y-2">
          {eventosMesActual.length > 0 ? (
            <>
              {[...eventosMesActual]
                .sort((a, b) => a.dia_mes - b.dia_mes)
                .slice(expensePage * 5, (expensePage + 1) * 5)
                .map((ev, idx) => {
                  const cat = getCatWidget(ev.categoria);
                  const diaEvento = ev.dia_mes;
                  const esHoy = diaEvento === today;
                  const esPasado = diaEvento < today;
                  const esManana = diaEvento === today + 1;
                  const fechaLabel = esHoy ? 'Hoy' : esManana ? 'Mañana' : `${diaEvento} ${currentMonth.substring(0, 3)}`;
                  
                  return (
                    <div
                      key={ev.id || idx}
                      onClick={() => setSelectedDay(diaEvento)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all group ${
                        esHoy
                          ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700'
                          : esPasado
                          ? 'bg-slate-50/60 dark:bg-slate-800/20 opacity-50 border border-slate-200 dark:border-slate-700'
                          : 'bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {/* Icono de categoría */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        esHoy ? 'bg-purple-100 dark:bg-purple-900/40' : 'bg-white dark:bg-slate-700'
                      } border border-slate-200 dark:border-slate-600`}>
                        <cat.icon className="w-4 h-4" />
                      </div>
                      
                      {/* Info del gasto */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate text-slate-800 dark:text-white mb-0.5">{ev.nombre}</p>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                            {(LEGACY_CAT_MAP[ev.categoria] || ev.categoria).replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      
                      {/* Cantidad y fecha */}
                      <div className="text-right shrink-0">
                        <p className={`text-base font-bold mb-0.5 ${
                          esHoy ? 'text-purple-700 dark:text-purple-400' : 'text-slate-800 dark:text-white'
                        }`}>
                          {ev.cantidad_max ? `${ev.cantidad_min}–${ev.cantidad_max}€` : `${ev.cantidad_min}€`}
                        </p>
                        <p className={`text-xs font-semibold ${
                          esHoy ? 'text-purple-600 dark:text-purple-400' : 
                          esPasado ? 'text-slate-400 line-through' : 
                          'text-slate-500 dark:text-slate-400'
                        }`}>
                          {fechaLabel}
                        </p>
                      </div>
                    </div>
                  );
                })}

              {/* Paginación */}
              {eventosMesActual.length > 5 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setExpensePage(Math.max(0, expensePage - 1)); }}
                    disabled={expensePage === 0}
                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 disabled:opacity-30 text-base"
                  >
                    ‹
                  </button>
                  <span className="text-xs text-slate-400 font-medium">
                    {expensePage + 1}/{Math.ceil(eventosMesActual.length / 5)}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setExpensePage(Math.min(Math.ceil(eventosMesActual.length / 5) - 1, expensePage + 1)); }}
                    disabled={expensePage >= Math.ceil(eventosMesActual.length / 5) - 1}
                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 disabled:opacity-30 text-base"
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          ) : (
            <div
              onClick={() => navigate('/calendario-gastos')}
              className="flex items-center justify-center gap-2 p-6 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors border-2 border-dashed border-slate-200 dark:border-slate-700"
            >
              <Plus className="w-5 h-5 text-slate-400" />
              <p className="text-sm font-medium text-slate-500">Planificar gastos extraordinarios</p>
            </div>
          )}
        </div>


      </div>
      </div>

      {/* Modal Añadir Movimiento */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-[520px] bg-white dark:bg-slate-900 shadow-2xl rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <h1 className="text-slate-900 dark:text-white text-xl font-bold">
                {modalType === 'parvos' ? 'Añadir Movimiento - Parvos' : 'Añadir Movimiento - Personal'}
              </h1>
              <Button 
                onClick={() => setShowModal(false)}
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Form Body - Scrollable */}
            <form onSubmit={handleSubmitMovement} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Type Selection (Segmented Control) */}
              <div>
                <div className="flex h-11 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
                  <label className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-md px-2 text-sm font-medium transition-all ${formData.tipo === 'ingreso' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className="truncate">Ingreso</span>
                    <input 
                      className="invisible w-0" 
                      type="radio" 
                      name="tipo" 
                      value="ingreso"
                      checked={formData.tipo === 'ingreso'}
                      onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    />
                  </label>
                  <label className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-md px-2 text-sm font-medium transition-all ${formData.tipo === 'gasto' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className="truncate">Gasto</span>
                    <input 
                      className="invisible w-0" 
                      type="radio" 
                      name="tipo" 
                      value="gasto"
                      checked={formData.tipo === 'gasto'}
                      onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    />
                  </label>
                  <label className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-md px-2 text-sm font-medium transition-all ${formData.tipo === 'ahorro' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className="truncate">Ahorro</span>
                    <input 
                      className="invisible w-0" 
                      type="radio" 
                      name="tipo" 
                      value="ahorro"
                      checked={formData.tipo === 'ahorro'}
                      onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    />
                  </label>
                  <label className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-md px-2 text-sm font-medium transition-all ${formData.tipo === 'retirada-hucha' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className="truncate">Retirada</span>
                    <input 
                      className="invisible w-0" 
                      type="radio" 
                      name="tipo" 
                      value="retirada-hucha"
                      checked={formData.tipo === 'retirada-hucha'}
                      onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Date Picker Field */}
                <div className="flex flex-col gap-2">
                  <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Fecha
                  </Label>
                  <Input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                    className="h-12"
                    required
                  />
                </div>

                {/* Amount Input */}
                <div className="flex flex-col gap-2">
                  <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center gap-2">
                    <Euro className="w-4 h-4" />
                    Importe
                  </Label>
                  <div className="relative">
                    <Input 
                      type="number"
                      step="0.01"
                      value={formData.cantidad}
                      onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                      className="h-12 pr-10 font-semibold"
                      placeholder="0,00"
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€</span>
                  </div>
                </div>
              </div>

              {/* Description Field */}
              <div className="flex flex-col gap-2">
                <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Descripción
                </Label>
                <Input 
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="h-12"
                  placeholder="Ej. Compra semanal"
                />
              </div>

              {/* Selectors Grid */}
              {formData.tipo === 'retirada-hucha' ? (
                <div className="grid grid-cols-2 gap-4">
                  {/* Cuenta Origen */}
                  <div className="flex flex-col gap-2">
                    <p className="text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Cuenta Origen
                    </p>
                    <select 
                      value={formData.cuentaOrigen}
                      onChange={(e) => setFormData({...formData, cuentaOrigen: e.target.value})}
                      className="flex w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 h-12 px-4 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 outline-none cursor-pointer"
                    >
                      <option value="Ahorro">Ahorro</option>
                      {modalType === 'personal' ? (
                        <>
                          <option value="Santander">Santander</option>
                          <option value="Prepago">Prepago</option>
                        </>
                      ) : (
                        <>
                          <option value="BBVA">BBVA</option>
                          <option value="Imagin">Imagin</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Cuenta Destino */}
                  <div className="flex flex-col gap-2">
                    <p className="text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Cuenta Destino
                    </p>
                    <select 
                      value={formData.cuentaDestino}
                      onChange={(e) => setFormData({...formData, cuentaDestino: e.target.value})}
                      className="flex w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 h-12 px-4 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 outline-none cursor-pointer"
                    >
                      {modalType === 'personal' ? (
                        <>
                          <option value="Santander">Santander</option>
                          <option value="Prepago">Prepago</option>
                        </>
                      ) : (
                        <>
                          <option value="BBVA">BBVA</option>
                          <option value="Imagin">Imagin</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {/* Category Selector - Solo visible para gastos */}
                  {formData.tipo === 'gasto' && (
                    <div className="flex flex-col gap-2">
                      <p className="text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Categoría
                      </p>
                      <select 
                        value={formData.categoria}
                        onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                        className="flex w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 h-12 px-4 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 outline-none cursor-pointer"
                      >
                        <option value="Alimentación">Alimentación</option>
                        <option value="Deporte">Deporte</option>
                        <option value="Extra">Extra</option>
                        <option value="Hogar">Hogar</option>
                        <option value="Movilidad">Movilidad</option>
                        <option value="Ocio">Ocio</option>
                        <option value="Vacaciones">Vacaciones</option>
                      </select>
                    </div>
                  )}

                  {/* Account Selector - Para ingreso/gasto muestra "Cuenta", para ahorro muestra "Cuenta de origen" */}
                  {formData.tipo === 'ahorro' ? (
                    <div className="col-span-2 flex flex-col gap-2">
                      <p className="text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Cuenta de origen
                      </p>
                      <select 
                        value={formData.cuenta}
                        onChange={(e) => setFormData({...formData, cuenta: e.target.value})}
                        className="flex w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 h-12 px-4 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 outline-none cursor-pointer"
                      >
                        {modalType === 'personal' ? (
                          <>
                            <option value="Santander">Santander</option>
                            <option value="Prepago">Prepago</option>
                          </>
                        ) : (
                          <>
                            <option value="BBVA">BBVA</option>
                            <option value="Imagin">Imagin</option>
                          </>
                        )}
                      </select>
                    </div>
                  ) : formData.tipo !== 'retirada-hucha' && (
                    <div className={`flex flex-col gap-2 ${formData.tipo === 'gasto' ? '' : 'col-span-2'}`}>
                      <p className="text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Cuenta
                      </p>
                      <select 
                        value={formData.cuenta}
                        onChange={(e) => setFormData({...formData, cuenta: e.target.value})}
                        className="flex w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 h-12 px-4 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 outline-none cursor-pointer"
                      >
                        {modalType === 'personal' ? (
                          <>
                            <option value="Santander">Santander</option>
                            <option value="Prepago">Prepago</option>
                          </>
                        ) : (
                          <>
                            <option value="BBVA">BBVA</option>
                            <option value="Imagin">Imagin</option>
                          </>
                        )}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* Footer Actions */}
            <div className="px-6 py-6 bg-gray-50 dark:bg-gray-800/30 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
              <Button 
                type="button"
                onClick={() => setShowModal(false)}
                variant="ghost"
                className="px-5 h-11"
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                onClick={handleSubmitMovement}
                className="px-8 h-11 bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Movimiento
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Event Popup — Multi-evento con categorías */}
      {selectedDay && (() => {
        const dayEvents = getEventsForDay(selectedDay);
        const dayTotal = dayEvents.reduce((s, e) => s + (e.cantidad_max || e.cantidad_min || 0), 0);
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => setSelectedDay(null)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-sm w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Día {selectedDay} de {currentMonth}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{dayEvents.length} gasto{dayEvents.length !== 1 ? 's' : ''} programado{dayEvents.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => setSelectedDay(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 max-h-[50vh] overflow-y-auto">
                {dayEvents.length > 0 ? (
                  <div className="space-y-3">
                    {dayEvents.map((ev) => {
                      const cat = getCatWidget(ev.categoria);
                      const catLabel = LEGACY_CAT_MAP[ev.categoria] || ev.categoria;
                      return (
                        <div key={ev.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <cat.icon className="w-5 h-5" />
                              <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{ev.nombre}</p>
                                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 capitalize">{catLabel}</span>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-slate-800 dark:text-white whitespace-nowrap">
                              {ev.cantidad_max ? `${ev.cantidad_min}–${ev.cantidad_max}€` : `${ev.cantidad_min}€`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                            <span>{formatRecurrenciaWidget(ev.recurrencia)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Sin gastos planificados</p>
                  </div>
                )}
              </div>

              {dayEvents.length > 0 && (
                <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total</span>
                    <p className="text-base font-bold text-slate-800 dark:text-white">{dayTotal.toFixed(2)}€</p>
                  </div>
                  <Button
                    onClick={() => { setSelectedDay(null); navigate('/calendario-gastos', { state: { mes: currentMonthIdx, anio: currentYearIdx } }); }}
                    variant="ghost"
                    className="text-purple-600 dark:text-purple-400 text-xs font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  >
                    Ver en calendario →
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Home;
