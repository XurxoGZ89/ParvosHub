import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ChevronRight } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { t, language } = useLanguage();
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await axios.get('/api/auth/profile');
        setUserStats(response.data);
      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserStats();
  }, []);

  const today = new Date();
  const quickCards = [
    { icon: '📄', label: 'Factura Pendiente', value: 'Luz: 82,40€', color: 'bg-blue-50 text-blue-600' },
    { icon: '💰', label: 'Objetivo Ahorro', value: 'Viaje: 1.250€', color: 'bg-green-50 text-green-600' },
    { icon: '🛍️', label: 'Última Compra', value: 'Super: 45,20€', color: 'bg-pink-50 text-pink-600' },
    { icon: '📅', label: 'Próximo Pago', value: 'Netflix: 12,99€', color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickCards.map((card, idx) => (
          <div key={idx} className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center mb-4 text-lg`}>
              {card.icon}
            </div>
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <h3 className="text-lg font-bold text-gray-900">{card.value}</h3>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-gray-900">Situación Global Personal</h2>
          <div className="flex items-end gap-4 mb-8">
            <h3 className="text-4xl font-extrabold text-gray-900">12.450,20€</h3>
            <span className="mb-2 text-green-600 font-bold flex items-center text-sm bg-green-50 px-2 py-0.5 rounded-lg">
              <TrendingUp className="w-3 h-3 mr-1" /> 4.2%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-2xl">
              <p className="text-xs font-semibold text-gray-500 uppercase">Gastos Mes</p>
              <p className="text-xl font-bold text-gray-900">1.240,00€</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl">
              <p className="text-xs font-semibold text-gray-500 uppercase">Ingresos Mes</p>
              <p className="text-xl font-bold text-gray-900">2.300,00€</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-gray-900">Situación Global Familiar</h2>
          <div className="flex items-end gap-4 mb-8">
            <h3 className="text-4xl font-extrabold text-gray-900">28.910,45€</h3>
            <span className="mb-2 text-green-600 font-bold flex items-center text-sm bg-green-50 px-2 py-0.5 rounded-lg">
              <TrendingUp className="w-3 h-3 mr-1" /> 2.8%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-2xl">
              <p className="text-xs font-semibold text-gray-500 uppercase">Gastos Casa</p>
              <p className="text-xl font-bold text-gray-900">3.400,00€</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl">
              <p className="text-xs font-semibold text-gray-500 uppercase">Emergencia</p>
              <p className="text-xl font-bold text-gray-900">15.000,00€</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center text-lg">🍽️</div>
              <h2 className="text-xl font-bold text-gray-900">Calendario de Comidas</h2>
            </div>
            <button onClick={() => navigate('/calendariocomidasv2')} className="text-purple-600 font-semibold text-sm hover:underline flex items-center gap-1">
              Ver todo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50">
            <p className="text-sm font-bold text-gray-900">Comida: Lentejas estofadas</p>
            <p className="text-xs text-gray-500">Cena: Tortilla de patatas</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-lg">💳</div>
              <h2 className="text-xl font-bold text-gray-900">Mis Cuentas</h2>
            </div>
            <button onClick={() => navigate('/user-account')} className="text-purple-600 font-semibold text-sm hover:underline flex items-center gap-1">
              Ver todo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {userStats?.accounts?.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-sm font-bold">💰</div>
                  <div>
                    <p className="font-semibold text-gray-900">{account.account_name}</p>
                    <p className="text-xs text-gray-500">{account.account_type}</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-gray-900">€0.00</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
