import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { useLanguage } from '../../contexts/LanguageContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const { language, setLanguage } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberSession, setRememberSession] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(username, password);
    if (result.success) {
      navigate('/');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex flex-col transition-colors duration-300">
        {/* Header */}
        <header className="w-full p-8 flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-default">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <span className="text-2xl">💰</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              ParvosHub <span className="text-blue-600">V2</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow flex items-center justify-center p-6">
          <div className="w-full max-w-[440px]">
            <div className="bg-white dark:bg-slate-900 rounded-[20px] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-8 md:p-10">
              <div className="mb-10">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Bienvenido</h2>
                <p className="text-slate-500 dark:text-slate-400">Gestión financiera personal para Sonia y Xurxo.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Campo Usuario */}
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
                    Usuario
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl transition-colors group-focus-within:text-blue-600">
                      👤
                    </span>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="tu_usuario"
                      disabled={isLoading}
                      required
                      autoComplete="username"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* Campo Contraseña */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Contraseña
                    </label>
                  </div>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl transition-colors group-focus-within:text-blue-600">
                      🔒
                    </span>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      required
                      autoComplete="current-password"
                      className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-xl"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {/* Recordar sesión */}
                <div className="flex items-center">
                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    checked={rememberSession}
                    onChange={(e) => setRememberSession(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-600 dark:bg-slate-800"
                  />
                  <label htmlFor="remember" className="ml-3 text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                    Recordar sesión
                  </label>
                </div>

                {/* Error message */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                {/* Botón Iniciar sesión */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  ¿Necesitas ayuda para entrar? <a href="#" className="text-blue-600 font-medium hover:underline">Contactar soporte</a>
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-8 flex justify-center items-center gap-6">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-4 py-2 rounded-full shadow-sm">
            <span className="text-lg">🌐</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent border-none text-sm font-medium text-slate-600 dark:text-slate-300 focus:ring-0 cursor-pointer py-0 outline-none"
            >
              <option value="es">Español (ES)</option>
              <option value="gl">Galego (GL)</option>
              <option value="ca">Català (CA)</option>
            </select>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-600">© 2026 ParvosHub. Todos los derechos reservados.</p>
        </footer>

        {/* Background gradients */}
        <div className="fixed top-[-10%] right-[-5%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-3xl -z-10"></div>
        <div className="fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-400/5 rounded-full blur-3xl -z-10"></div>
      </div>
    </div>
  );
};

export default Login;
