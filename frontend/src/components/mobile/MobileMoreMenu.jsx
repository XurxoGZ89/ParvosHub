import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  CalendarDays,
  Moon,
  Sun,
  Languages,
  LogOut,
  ChevronRight,
  User,
  Heart
} from 'lucide-react';
import MobileHeader from './MobileHeader';
import useAuthStore from '../../stores/authStore';
import { useLanguage } from '../../contexts/LanguageContext';

const MobileMoreMenu = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { language, setLanguage, t } = useLanguage();

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleDark = useCallback(() => {
    document.documentElement.classList.toggle('dark');
    const nowDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', nowDark ? 'dark' : 'light');
    setIsDark(nowDark);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sections = [
    {
      title: 'Herramientas',
      items: [
        {
          icon: CalendarDays,
          label: 'Calendario Gastos',
          sublabel: 'Gastos extraordinarios mensuales',
          color: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30',
          action: () => navigate('/calendario-gastos'),
        },
        {
          icon: CalendarDays,
          label: t('calendarioComidas') || 'Calendario Comidas',
          sublabel: 'Planifica tu menú semanal',
          color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
          action: () => navigate('/calendario-comidas'),
        },
        {
          icon: BarChart3,
          label: t('resumenAnual') || 'Resumen Anual',
          sublabel: 'Gastos familiares por categoría',
          color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
          action: () => navigate('/resumen'),
        },
      ],
    },
    {
      title: 'Preferencias',
      items: [
        {
          icon: isDark ? Sun : Moon,
          label: isDark ? 'Modo Claro' : 'Modo Oscuro',
          sublabel: `Actualmente: ${isDark ? 'Oscuro' : 'Claro'}`,
          color: isDark
            ? 'text-amber-500 bg-amber-100 dark:bg-amber-900/30'
            : 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30',
          action: toggleDark,
          toggle: true,
          toggleState: isDark,
        },
        {
          icon: Languages,
          label: 'Idioma',
          sublabel: language === 'es' ? 'Español' : 'Galego',
          color: 'text-teal-600 bg-teal-100 dark:bg-teal-900/30',
          action: () => setLanguage(language === 'es' ? 'gl' : 'es'),
          toggle: true,
          toggleLabel: language === 'es' ? 'ES' : 'GL',
        },
      ],
    },
    {
      title: 'Cuenta',
      items: [
        {
          icon: LogOut,
          label: 'Cerrar Sesión',
          sublabel: user?.nombre || 'Usuario',
          color: 'text-red-600 bg-red-100 dark:bg-red-900/30',
          action: handleLogout,
          danger: true,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <MobileHeader title="Más" />

      <div className="px-4 py-4 space-y-6">
        {/* User card */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-base">{user?.fullName || user?.username || user?.nombre || 'Usuario'}</p>
              <p className="text-xs text-white/70">@{user?.username || 'usuario'}</p>
            </div>
          </div>
        </div>

        {/* Sections */}
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
              {section.title}
            </h3>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color}`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold ${
                          item.danger
                            ? 'text-red-600'
                            : 'text-slate-800 dark:text-white'
                        }`}
                      >
                        {item.label}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {item.sublabel}
                      </p>
                    </div>
                    {item.toggle ? (
                      item.toggleLabel ? (
                        <span className="text-xs font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2.5 py-1 rounded-lg">
                          {item.toggleLabel}
                        </span>
                      ) : (
                        <div
                          className={`w-11 h-6 rounded-full relative transition-colors ${
                            item.toggleState ? 'bg-purple-600' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              item.toggleState
                                ? 'translate-x-[22px]'
                                : 'translate-x-0.5'
                            }`}
                          />
                        </div>
                      )
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* App info */}
        <div className="text-center pb-8">
          <div className="flex items-center justify-center gap-1 text-slate-300 dark:text-slate-600 mb-1">
            <Heart className="w-3 h-3" />
          </div>
          <p className="text-[10px] text-slate-300 dark:text-slate-600">
            ParvosHub v1.0 · Hecho con cariño
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileMoreMenu;
