// pages/Login.jsx - Страница входа
import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthContext } from '../contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    setServerError('');
    const result = await login(data);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setServerError(result.error);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="card max-w-md w-full p-8">
        <div className="text-center mb-6">
          <span className="text-4xl">🥗</span>
          <h2 className="text-2xl font-bold mt-2">Вход в MealPlanner</h2>
          <p className="text-gray-500 mt-1">С возвращением! Войдите для продолжения.</p>
        </div>

        {serverError && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              className="input-field"
              placeholder="your@email.com"
              {...register('email')}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
            <input 
              type="password" 
              className="input-field"
              placeholder="••••••"
              {...register('password')}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button 
            type="submit" 
            className="btn-primary w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-primary-600 hover:underline font-medium">
            Зарегистрируйтесь
          </Link>
        </p>

        {/* Демо-данные */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
          <p className="font-medium mb-1">Демо доступ:</p>
          <p>Email: <span className="font-mono">anna@example.com</span></p>
          <p>Пароль: <span className="font-mono">user123</span></p>
        </div>
      </div>
    </div>
  );
}