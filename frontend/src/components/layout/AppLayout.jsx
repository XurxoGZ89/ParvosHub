import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import usePrivacyStore from '../../stores/privacyStore';
import { useLanguage } from '../../contexts/LanguageContext';

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { hiddenNumbers, toggleHiddenNumbers } = usePrivacyStore();
  const { language, setLanguage } = useLanguage();
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const menuItems = [
    { icon: '🏠', label: 'Inicio', path: '/' },
    { icon: '👤', label: 'Cuenta Personal', path: '/user-account' },
    { icon: '👥', label: 'Cuenta Familiar', path: '/gastos' },
    { icon: '📊', label: 'Resumen Anual', path: '/resumen' },
    { icon: '📅', label: 'Calendario Gastos', path: '/calendario-gastos' },
    { icon: '🍽️', label: 'Calendario Comidas', path: '/calendario-comidas' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="flex min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        {/* Sidebar */}
        <aside className="w-20 lg:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 z-50">
          {/* Logo */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shrink-0">
              <span className="text-2xl">💰</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight hidden lg:block bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              ParvosHub
            </span>
          </div>

          {/* Navegación */}
          <nav className="flex-1 px-4 space-y-2 py-4 overflow-y-auto scrollbar-hide">
            {menuItems.map((item, index) => {
              const active = isActive(item.path);
              return (
                <button
                  key={index}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                    active
                      ? 'bg-purple-600/10 text-purple-600 font-semibold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="text-2xl shrink-0">{item.icon}</span>
                  <span className="hidden lg:block text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer del Sidebar */}
          <div className="p-4 mt-auto border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all mb-2"
            >
              <span className="text-2xl shrink-0">{darkMode ? '☀️' : '🌙'}</span>
              <span className="hidden lg:block text-sm">Modo Oscuro</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <span className="text-2xl shrink-0">🚪</span>
              <span className="hidden lg:block text-sm">Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* Contenido Principal */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 lg:p-10">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                ¡Hola, {user?.fullName || user?.username}! 👋
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  day: 'numeric',
                  month: 'long'
                }).split(' ').map((word, i) => i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word).join(' ')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Botón de privacidad */}
              <button
                onClick={toggleHiddenNumbers}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all shadow-sm ${
                  hiddenNumbers
                    ? 'bg-purple-600 border-purple-600 text-white hover:bg-purple-700'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                title={hiddenNumbers ? 'Mostrar números' : 'Ocultar números'}
              >
                {hiddenNumbers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="text-sm font-medium hidden sm:inline">
                  {hiddenNumbers ? 'Oculto' : 'Visible'}
                </span>
              </button>
              
              {/* Selector de idioma */}
              <div className="flex bg-white dark:bg-slate-900 rounded-2xl p-1 border border-slate-200 dark:border-slate-800 shadow-sm">
                <button
                  onClick={() => setLanguage('es')}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                    language === 'es'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  ES
                </button>
                <button
                  onClick={() => setLanguage('gl')}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                    language === 'gl'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  GL
                </button>
              </div>
              {/* Avatar del usuario */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 p-0.5 shadow-lg shadow-purple-600/20">
                <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-2xl font-bold text-purple-600">
                  {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </header>

          {/* Contenido de las páginas */}
          <div className="flex-1">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
