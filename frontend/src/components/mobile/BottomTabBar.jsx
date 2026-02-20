import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, User, Users, MoreHorizontal } from 'lucide-react';

const tabs = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: User, label: 'Personal', path: '/user-account' },
  { icon: Users, label: 'Familiar', path: '/gastos' },
  { icon: MoreHorizontal, label: 'Más', path: '/mas' },
];

const BottomTabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/mas') return ['/mas', '/calendario-gastos', '/calendario-comidas', '/resumen'].includes(location.pathname);
    return location.pathname.startsWith(path);
  };

  // Hide on login
  if (location.pathname === '/login') return null;

  return (
    <nav role="navigation" aria-label="Navegación principal" className="shrink-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors active:scale-95 ${
                active
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
              <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabBar;
