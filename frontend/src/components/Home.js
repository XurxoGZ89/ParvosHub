import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, Calendar, Euro, FileText, Tag, CreditCard, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import api from '../lib/api';
import useAuthStore from '../stores/authStore';
import { usePrivacyFormatter } from '../utils/privacyFormatter';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const formatAmount = usePrivacyFormatter();
  const [userStats, setUserStats] = useState(null);
  const [parvosStats, setParvosStats] = useState(null);
  const [mealData, setMealData] = useState([]);
  const [mealPage, setMealPage] = useState(0);
  const [calendarEvents, setCalendarEvents] = useState([]);
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

        const operationsResponse = await api.get('/operaciones');
        const mealsResponse = await api.get('/comidas-planificadas');
        const eventsResponse = await api.get('/calendar-events');

        const meals = Array.isArray(mealsResponse.data) ? mealsResponse.data : [];
        const events = Array.isArray(eventsResponse.data) ? eventsResponse.data : [];
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
        }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

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
        setCalendarEvents(events);
        console.log('Eventos del calendario cargados:', events);

        // Calculate stats
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthOperations = operations.filter(op => {
          const opDate = new Date(op.fecha);
          return opDate.getMonth() === currentMonth && opDate.getFullYear() === currentYear;
        });

        const ingresos = monthOperations
          .filter(op => op.tipo === 'ingreso' || op.tipo === 'retirada-hucha')
          .reduce((sum, op) => sum + parseFloat(op.cantidad || 0), 0);

        const gastos = monthOperations
          .filter(op => op.tipo === 'gasto')
          .reduce((sum, op) => sum + parseFloat(op.cantidad || 0), 0);

        const bbvaOps = operations.filter(op => op.cuenta === 'BBVA');
        const imaginOps = operations.filter(op => op.cuenta === 'Imagin');

        const bbvaTotal = bbvaOps.reduce((sum, op) => {
          if (op.tipo === 'ingreso' || op.tipo === 'retirada-hucha') return sum + parseFloat(op.cantidad || 0);
          if (op.tipo === 'gasto') return sum - parseFloat(op.cantidad || 0);
          return sum;
        }, 0);

        const imaginTotal = imaginOps.reduce((sum, op) => {
          if (op.tipo === 'ingreso' || op.tipo === 'retirada-hucha') return sum + parseFloat(op.cantidad || 0);
          if (op.tipo === 'gasto') return sum - parseFloat(op.cantidad || 0);
          return sum;
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

  const getEventForDay = (day) => {
    if (!day) return null;
    const event = calendarEvents.find(e => e.dia_mes === day);
    console.log(`Buscando evento para día ${day}:`, event);
    return event;
  };

  const handleSubmitMovement = async (e) => {
    e.preventDefault();
    try {
      const endpoint = modalType === 'parvos' ? '/operaciones' : '/operaciones'; // Mismo endpoint, diferentes cuentas
      
      let payload;
      
      if (formData.tipo === 'retirada-hucha') {
        // Para traspasos, construir la descripción con el formato correcto
        const descripcionTraspaso = `Traspaso desde ${formData.cuentaOrigen} a ${formData.cuentaDestino}${formData.descripcion ? ' - ' + formData.descripcion : ''}`;
        
        payload = {
          tipo: formData.tipo,
          fecha: formData.fecha,
          cantidad: parseFloat(formData.cantidad),
          descripcion: descripcionTraspaso,
          categoria: '',
          cuenta: formData.cuentaDestino,
          usuario: user?.username || 'Sonia'
        };
      } else {
        payload = {
          tipo: formData.tipo,
          fecha: formData.fecha,
          cantidad: parseFloat(formData.cantidad),
          descripcion: formData.descripcion,
          categoria: formData.tipo === 'gasto' ? formData.categoria : '',
          cuenta: formData.tipo === 'ahorro' ? 'Ahorro' : formData.cuenta,
          usuario: user?.username || 'Sonia'
        };
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

  if (!parvosStats || !userStats) {
    return <div className="flex items-center justify-center h-64">Cargando...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Personal Situation */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-purple-600/10 flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Situación Global Personal</h2>
          </div>
          <Button 
            onClick={() => navigate('/user-account')}
            variant="ghost"
            className="text-purple-600 font-bold text-xs hover:opacity-80 h-auto p-0"
          >
            Ver todo
          </Button>
        </div>

        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Saldo Total</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatAmount(userStats?.totalBalance || 0)}€
            </h3>
          </div>
          <Button 
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
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md shadow-purple-600/30 px-4 py-2.5 h-auto rounded-lg"
            size="sm"
          >
            <Plus className="w-5 h-5 mr-2" />
            Añadir movimiento
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {userStats?.accounts?.filter(acc => acc.account_name !== 'Ahorro').map((account, idx) => (
            <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 px-3 py-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{account.account_name}</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {formatAmount(account.balance || 0)}€
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="flex-1 flex items-center justify-between bg-green-50/50 dark:bg-green-900/10 px-3 py-2 rounded-lg border border-green-100/50 dark:border-green-900/20">
            <span className="text-xs font-bold text-green-600 dark:text-green-500 uppercase">Ingresos</span>
            <span className="text-xs font-bold text-green-700 dark:text-green-400">
              +{formatAmount(userStats?.ingresosMes || 0)}€
            </span>
          </div>
          <div className="flex-1 flex items-center justify-between bg-red-50/50 dark:bg-red-900/10 px-3 py-2 rounded-lg border border-red-100/50 dark:border-red-900/20">
            <span className="text-xs font-bold text-red-600 dark:text-red-500 uppercase">Gastos</span>
            <span className="text-xs font-bold text-red-700 dark:text-red-400">
              -{formatAmount(userStats?.gastosMes || 0)}€
            </span>
          </div>
        </div>
      </div>

      {/* Family Situation */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600/10 flex items-center justify-center">
              <span className="text-lg">👥</span>
            </div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Situación Global Familiar</h2>
          </div>
          <Button 
            onClick={() => navigate('/gastos')}
            variant="ghost"
            className="text-purple-600 font-bold text-xs hover:opacity-80 h-auto p-0"
          >
            Ver todo
          </Button>
        </div>

        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Saldo Total</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatAmount(parvosStats?.total || 0)}€
            </h3>
          </div>
          <Button 
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
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md shadow-purple-600/30 px-4 py-2.5 h-auto rounded-lg"
            size="sm"
          >
            <Plus className="w-5 h-5 mr-2" />
            Añadir movimiento
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-slate-50 dark:bg-slate-800/40 px-3 py-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">BBVA</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">{formatAmount(parvosStats?.bbva || 0)}€</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/40 px-3 py-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Imagin</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">{formatAmount(parvosStats?.imagin || 0)}€</span>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 flex items-center justify-between bg-green-50/50 dark:bg-green-900/10 px-3 py-2 rounded-lg border border-green-100/50 dark:border-green-900/20">
            <span className="text-xs font-bold text-green-600 dark:text-green-500 uppercase">Ingresos</span>
            <span className="text-xs font-bold text-green-700 dark:text-green-400">+{formatAmount(parvosStats?.ingresosMes || 0)}€</span>
          </div>
          <div className="flex-1 flex items-center justify-between bg-red-50/50 dark:bg-red-900/10 px-3 py-2 rounded-lg border border-red-100/50 dark:border-red-900/20">
            <span className="text-xs font-bold text-red-600 dark:text-red-500 uppercase">Gastos</span>
            <span className="text-xs font-bold text-red-700 dark:text-red-400">-{formatAmount(parvosStats?.gastosMes || 0)}€</span>
          </div>
        </div>
      </div>

      {/* Menú Semanal */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-500/10 text-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-xl">🍽️</span>
            </div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Menú Semanal</h2>
          </div>
          <button 
            onClick={() => navigate('/calendario-comidas')}
            className="text-purple-600 font-bold text-xs hover:underline"
          >
            Ver todo
          </button>
        </div>

        <div className="space-y-3">
          {mealData.length > 0 ? (
            <>
              {mealData.slice(mealPage * 5, (mealPage + 1) * 5).map((meal, idx) => {
                const mealDate = new Date(meal.fecha);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const daysFromNow = Math.floor((mealDate - today) / (1000 * 60 * 60 * 24));
                
                let dateLabel = '';
                if (daysFromNow === 0) dateLabel = 'Hoy';
                else if (daysFromNow === 1) dateLabel = 'Mañ';
                else {
                  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab'];
                  dateLabel = dayNames[mealDate.getDay()];
                }
                
                return (
                  <div key={meal.id || idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="text-center w-12 shrink-0">
                      <p className="text-xs font-bold text-slate-400 uppercase leading-none mb-1">{dateLabel}</p>
                      <p className="text-sm font-extrabold text-purple-600">{mealDate.getDate()}</p>
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">
                        {meal.tipo_comida === 'comida' ? 'Comida' : 'Cena'}: {meal.comida_nombre}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                );
              })}
              
              {/* Paginación */}
              {mealData.length > 5 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    onClick={() => setMealPage(Math.max(0, mealPage - 1))}
                    disabled={mealPage === 0}
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 disabled:opacity-30"
                  >
                    ‹
                  </Button>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {mealPage + 1} / {Math.ceil(mealData.length / 5)}
                  </span>
                  <Button
                    onClick={() => setMealPage(Math.min(Math.ceil(mealData.length / 5) - 1, mealPage + 1))}
                    disabled={mealPage >= Math.ceil(mealData.length / 5) - 1}
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 disabled:opacity-30"
                  >
                    ›
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center p-8 text-slate-500 text-xs">
              No hay comidas planificadas
            </div>
          )}
        </div>
      </div>

      {/* Gastos Mes */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-pink-500/10 text-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-xl">💳</span>
            </div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Gastos {currentMonth}</h2>
          </div>
          <Button 
            onClick={() => navigate('/calendario-gastos')}
            variant="ghost"
            className="text-purple-600 font-bold text-xs hover:underline h-auto p-0"
          >
            Ver todo
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
            <div key={day} className="aspect-square flex items-center justify-center text-xs font-bold text-slate-400">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day, idx) => {
            const event = day ? getEventForDay(day) : null;
            const isToday = day === today;
            
            return (
              <div 
                key={idx}
                onClick={() => day && setSelectedDay(day)}
                className={`
                  aspect-square rounded-md flex flex-col items-center justify-center
                  cursor-pointer transition-all
                  ${!day ? 'bg-transparent' : 'bg-slate-50 dark:bg-slate-800/40'}
                  ${isToday ? 'bg-purple-700 shadow-lg shadow-purple-600/30' : ''}
                  ${event && !isToday ? 'bg-pink-200/50 border border-pink-300 dark:bg-pink-900/20 dark:border-pink-900/50' : ''}
                  ${day && !event && !isToday ? 'hover:bg-slate-100 dark:hover:bg-slate-700' : ''}
                `}
              >
                {day && (
                  <span className={`text-base font-bold block drop-shadow-md ${isToday ? 'text-white' : event ? 'text-pink-700 dark:text-pink-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {day}
                  </span>
                )}
                {event && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isToday ? 'bg-white' : 'bg-pink-600'}`} />
                )}
              </div>
            );
          })}
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

                  {/* Account Selector - No visible para ahorro */}
                  {formData.tipo !== 'ahorro' && (
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

      {/* Event Popup */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setSelectedDay(null)}>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Día {selectedDay}
              </h3>
              <button 
                onClick={() => setSelectedDay(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {getEventForDay(selectedDay) ? (
              <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-xl border border-pink-100 dark:border-pink-900/50 space-y-2">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {getEventForDay(selectedDay).nombre}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Categoría: {getEventForDay(selectedDay).categoria}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Rango: ${getEventForDay(selectedDay).cantidad_min?.toFixed(2) || '0.00'} - ${getEventForDay(selectedDay).cantidad_max?.toFixed(2) || getEventForDay(selectedDay).cantidad_min?.toFixed(2) || '0.00'}
                </p>
                {getEventForDay(selectedDay).recurrencia && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Recurrencia: {typeof getEventForDay(selectedDay).recurrencia === 'string' ? getEventForDay(selectedDay).recurrencia : 'Mensual'}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-sm">No hay gastos planificados este día</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
