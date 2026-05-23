// contexts/AuthContext.jsx - Контекст авторизации
import { createContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Проверка авторизации при загрузке
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getMe()
        .then(res => {
          setUser(res.data.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Вход
  const login = useCallback(async (credentials) => {
    try {
      const res = await authAPI.login(credentials);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      toast.success('Добро пожаловать! 👋');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Ошибка входа';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // Регистрация
  const register = useCallback(async (data) => {
    try {
      const res = await authAPI.register(data);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      toast.success('Регистрация успешна! 🎉');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Ошибка регистрации';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // Выход
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('До встречи! 👋');
  }, []);

  // Обновление профиля
  const updateProfile = useCallback(async (data) => {
    try {
      const res = await authAPI.updateProfile(data);
      setUser(res.data.user);
      toast.success('Профиль обновлён! ✅');
      return { success: true };
    } catch (err) {
      toast.error('Ошибка обновления профиля');
      return { success: false };
    }
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}