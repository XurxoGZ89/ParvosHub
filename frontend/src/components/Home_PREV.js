import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import api from '../lib/api';

const Home = () => {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState(null);
  const [parvosStats, setParvosStats] = useState(null);
  const [mealData, setMealData] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user profile
        const profileResponse = await api.get('/api/auth/profile');
        setUserStats(profileResponse.data);

        // Fetch parvos operations
        const operationsResponse = await api.get('/operaciones');

        // Fetch comidas planificadas
        const mealsResponse = await api.get('/comidas-planificadas');
        const meals = Array.isArray(mealsResponse.data) ? mealsResponse.data : [];
        
        // Get today and tomorrow
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        // Filter meals for today and tomorrow
        const relevantMeals = meals.filter(meal => 
          meal.fecha === todayStr || meal.fecha === tomorrowStr
        ).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        // If no meals for today/tomorrow, find the next available day (max 2 days)
        let displayMeals = relevantMeals;
        if (displayMeals.length === 0) {
          displayMeals = meals.slice(0, 2);
        } else if (displayMeals.length === 1 && displayMeals[0].fecha !== todayStr) {
          // Only have tomorrow, try to add another day
          const nextMeal = meals.find(m => m.fecha > displayMeals[0].fecha);
          if (nextMeal) {
            displayMeals = [displayMeals[0], nextMeal];
          }
        }
        
        setMealData(displayMeals.slice(0, 2)); // Max 2 days

        // Fetch calendar events
        const eventsResponse = await api.get('/calendar-events');
        const events = Array.isArray(eventsResponse.data) ? eventsResponse.data : [];
        setCalendarEvents(events);

        // Calculate parvos stats
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const operations = Array.isArray(operationsResponse.data) ? operationsResponse.data : [];
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

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, []);

  const quickCards = [
    { icon: '📄', label: 'Factura Pendiente', value: 'Luz: 82,40€', color: 'bg-blue-50 text-blue-600' },
    { icon: '💰', label: 'Objetivo Ahorro', value: 'Viaje: 1.250€', color: 'bg-green-50 text-green-600' },
    { icon: '🛍️', label: 'Última Compra', value: 'Super: 45,20€', color: 'bg-pink-50 text-pink-600' },
    { icon: '📅', label: 'Próximo Pago', value: 'Netflix: 12,99€', color: 'bg-orange-50 text-orange-600' },
  ];

  // Generate calendar for current month
  const generateCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const calendarDays = generateCalendar();
  const today = new Date().getDate();

  // Get event for a specific day
  const getEventForDay = (day) => {
    if (!day) return null;
    const dateStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarEvents.find(e => e.fecha === dateStr);
  };

  if (!parvosStats || !userStats) {
    return <div className="flex items-center justify-center h-64">Cargando...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Quick Access Cards - Only Mobile */}
      {isMobile && (
        <section className="grid grid-cols-4 gap-3">
          {quickCards.map((card, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-lg">
                {card.icon}
              </div>
              <span className="text-[10px] font-bold text-center leading-tight">{card.label.split(' ')[0]}</span>
            </div>
          ))}
        </section>
      )}

      {/* Main Grid - Personal and Family */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Personal Situation */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👤</span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Situación Global Personal</h2>
            </div>
            <button 
              onClick={() => navigate('/user-account')}
              className="text-purple-600 font-semibold text-sm hover:underline"
            >
              Ver todo
            </button>
          </div>

          <div className="text-center mb-8">
            <h3 className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">12.450,20€</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {userStats?.accounts?.map((account, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">{account.account_name}</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white">€0.00</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-green-50 dark:bg-green-900/10 p-5 rounded-2xl text-center border border-green-100 dark:border-green-900/20">
              <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">Ingresos Mes</p>
              <p className="text-2xl font-black text-green-700 dark:text-green-300">+2.300,00€</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl text-center border border-red-100 dark:border-red-900/20">
              <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">Gastos Mes</p>
              <p className="text-2xl font-black text-red-700 dark:text-red-300">-1.240,00€</p>
            </div>
          </div>

          <div>
            <div className="flex items-end gap-2 h-20">
              {[40, 60, 45, 80, 70, 50, 90].map((height, idx) => (
                <div 
                  key={idx} 
                  className={`flex-1 rounded-t-lg ${idx === 4 ? 'bg-purple-600' : 'bg-slate-100 dark:bg-slate-800 hover:bg-purple-600/20 transition-colors'}`}
                  style={{ height: `${height}%` }}
                ></div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 px-1">
              <span>LUN</span><span>MAR</span><span>MIÉ</span><span>JUE</span><span>VIE</span><span>SÁB</span><span>DOM</span>
            </div>
          </div>
        </div>

        {/* Family Situation */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="text-2xl text-blue-600">👥</span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Situación Global Familiar</h2>
            </div>
            <button 
              onClick={() => navigate('/gastos')}
              className="text-purple-600 font-semibold text-sm hover:underline"
            >
              Ver todo
            </button>
          </div>

          <div className="text-center mb-8">
            <h3 className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {parvosStats?.total.toFixed(2)}€
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🏦</span>
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">BBVA</p>
              </div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">{parvosStats?.bbva.toFixed(2)}€</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">💳</span>
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Imagin</p>
              </div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">{parvosStats?.imagin.toFixed(2)}€</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-green-50 dark:bg-green-900/10 p-5 rounded-2xl text-center border border-green-100 dark:border-green-900/20">
              <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">Ingresos Mes</p>
              <p className="text-2xl font-black text-green-700 dark:text-green-300">+{parvosStats?.ingresosMes.toFixed(2)}€</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl text-center border border-red-100 dark:border-red-900/20">
              <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">Gastos Mes</p>
              <p className="text-2xl font-black text-red-700 dark:text-red-300">-{parvosStats?.gastosMes.toFixed(2)}€</p>
            </div>
          </div>

          <div>
            <div className="flex items-end gap-2 h-20">
              {[30, 50, 95, 70, 40, 60, 85].map((height, idx) => (
                <div 
                  key={idx} 
                  className={`flex-1 rounded-t-lg ${idx === 2 ? 'bg-blue-600' : 'bg-slate-100 dark:bg-slate-800 hover:bg-blue-600/20 transition-colors'}`}
                  style={{ height: `${height}%` }}
                ></div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 px-1">
              <span>LUN</span><span>MAR</span><span>MIÉ</span><span>JUE</span><span>VIE</span><span>SÁB</span><span>DOM</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Sections */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Food Calendar */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">🍽️</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Calendario de Comidas</h2>
            </div>
            <button 
              onClick={() => navigate('/calendariocomidasv2')}
              className="text-purple-600 font-semibold text-sm hover:underline flex items-center gap-1"
            >
              Ver todo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {mealData.length > 0 ? (
              mealData.map((meal, idx) => (
                <div key={meal.id || idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-center w-12 shrink-0">
                    <p className="text-xs font-bold text-slate-400 uppercase">{idx === 0 ? 'Hoy' : 'Mañ'}</p>
                    <p className="text-xl font-extrabold text-purple-600">{new Date(meal.fecha).getDate()}</p>
                  </div>
                  <div className="h-10 w-px bg-slate-200 dark:bg-slate-700"></div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                      {meal.tipo_comida === 'comida' ? '🍽️ Comida' : '🌙 Cena'}: {meal.comida_nombre}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center p-8 text-slate-500">
                <p>No hay comidas planificadas</p>
              </div>
            )}
          </div>
        </div>

        {/* Gastos del Mes - Calendar View */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">💳</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Gastos del Mes</h2>
            </div>
            <button 
              onClick={() => navigate('/calendario')}
              className="text-purple-600 font-semibold text-sm hover:underline flex items-center gap-1"
            >
              Ver todo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
              <div key={day} className="aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-300">
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
                    aspect-square rounded-lg flex items-center justify-center text-xs font-bold
                    cursor-pointer transition-all
                    ${!day ? 'bg-transparent' : 'bg-slate-50 dark:bg-slate-800'}
                    ${isToday ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-4 ring-white dark:ring-slate-900' : ''}
                    ${event && !isToday ? 'bg-pink-200/50 text-pink-700 border border-pink-300' : ''}
                    ${day && !event && !isToday ? 'hover:bg-slate-100 dark:hover:bg-slate-700' : ''}
                  `}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Event Popup */}
          {selectedDay && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Día {selectedDay}
                  </h3>
                  <button 
                    onClick={() => setSelectedDay(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    ✕
                  </button>
                </div>
                
                {getEventForDay(selectedDay) ? (
                  <div className="space-y-3">
                    <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-xl border border-pink-100 dark:border-pink-900/50">
                      <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                        {getEventForDay(selectedDay).concepto || getEventForDay(selectedDay).evento}
                      </p>
                      <p className="text-xs text-slate-500">
                        {getEventForDay(selectedDay).categoria}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400">No hay gastos planificados este día</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
