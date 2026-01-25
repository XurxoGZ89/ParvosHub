import { create } from 'zustand';
import Cookies from 'js-cookie';
import api from '../lib/api';

const useAuthStore = create((set, get) => ({
  // Estado
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Inicializar desde cookies
  initialize: async () => {
    const token = Cookies.get('auth_token');
    if (!token) {
      set({ isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await api.get('/api/auth/verify');
      set({
        user: response.data.user,
        token,
        isAuthenticated: true,
        error: null,
      });
    } catch (error) {
      // Token inválido, limpiar
      Cookies.remove('auth_token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // Login
  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/auth/login', {
        username,
        password,
      });

      const { token, user } = response.data;

      // Guardar token en cookies (sin expiración = sesión)
      Cookies.set('auth_token', token);

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || 'Error al iniciar sesión';
      set({
        error: errorMessage,
        isLoading: false,
      });
      return { success: false, error: errorMessage };
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      // Limpiar estado y cookies
      Cookies.remove('auth_token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  // Limpiar errores
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
