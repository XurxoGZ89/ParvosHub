import React from 'react';
import { Eye, EyeOff, Coins } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import usePrivacyStore from '../../stores/privacyStore';

const MobileHeader = ({ title, showBack, onBack }) => {
  const { user } = useAuthStore();
  const { hiddenNumbers, toggleHiddenNumbers } = usePrivacyStore();

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left */}
        <div className="flex items-center gap-2.5 min-w-0">
          {showBack ? (
            <button onClick={onBack} className="text-slate-600 dark:text-slate-300 -ml-1 p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4 text-white" />
            </div>
          )}
          <h1 className="text-base font-bold text-slate-900 dark:text-white truncate">
            {title || 'ParvosHub'}
          </h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleHiddenNumbers}
            aria-label={hiddenNumbers ? 'Mostrar importes' : 'Ocultar importes'}
            className={`p-2 rounded-xl transition-all ${
              hiddenNumbers
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {hiddenNumbers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
            {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
