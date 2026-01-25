import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import api from '../lib/api';

const Home = () => {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState(null);
  const [parvosStats, setParvosStats] = useState(null);
  const [parvosOperations, setParvosOperations] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
        setParvosOperations(operationsResponse.data);

        // Calculate parvos stats
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthOperations = operationsResponse.data.filter(op => {
          const opDate = new Date(op.fecha);
          return opDate.getMonth() === currentMonth && opDate.getFullYear() === currentYear;
        });

        const ingresos = monthOperations
          .filter(op => op.tipo === 'ingreso' || op.tipo === 'retirada-hucha')
          .reduce((sum, op) => sum + parseFloat(op.cantidad || 0), 0);

        const gastos = monthOperations
          .filter(op => op.tipo === 'gasto')
          .reduce((sum, op) => sum + parseFloat(op.cantidad || 0), 0);

        // Calculate totals by account
        const bbvaOps = operationsResponse.data.filter(op => op.cuenta === 'BBVA');
        const imaginOps = operationsResponse.data.filter(op => op.cuenta === 'Imagin');

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
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">BBVA</p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">{parvosStats?.bbva.toFixed(2)}€</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Imagin</p>
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
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="text-center w-12 shrink-0">
                <p className="text-xs font-bold text-slate-400 uppercase">Hoy</p>
                <p className="text-xl font-extrabold text-purple-600">{new Date().getDate()}</p>
              </div>
              <div className="h-10 w-px bg-slate-200 dark:bg-slate-700"></div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Comida: Lentejas estofadas</p>
                <p className="text-xs text-slate-500">Cena: Tortilla de patatas</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Monthly Expenses */}
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
          <div className="space-y-3">
            {parvosOperations.slice(0, 3).map((op) => (
              <div key={op.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center text-sm font-bold">
                    {op.categoria?.charAt(0) || '📊'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{op.info || op.concepto}</p>
                    <p className="text-xs text-slate-500">{op.categoria} • {new Date(op.fecha).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-lg font-bold ${op.tipo === 'gasto' ? 'text-red-600' : 'text-green-600'}`}>
                  {op.tipo === 'gasto' ? '-' : '+'}{parseFloat(op.cantidad).toFixed(2)}€
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
