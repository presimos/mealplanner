// pages/Register.jsx - Страница регистрации
import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthContext } from '../contexts/AuthContext';

const registerSchema = z.object({
  username: z.string()
    .min(3, 'Минимум 3 символа')
    .max(30, 'Максимум 30 символов')
    .regex(/^[a-zA-Zа-яА-Я0-9_]+$/, 'Только буквы, цифры и _'),
  email: z.string().email('Введите корректный email'),
  password: z.string()
    .min(6, 'Минимум 6 символов')
    .max(50, 'Максимум 50 символов'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

export default function Register() {
  const { register: registerUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data) => {
    setServerError('');
    const result = await registerUser({
      username: data.username,
      email: data.email,
      password: data.password,
    });
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
          <span className="text-4xl">🎉</span>
          <h2 className="text-2xl font-bold mt-2">Регистрация</h2>
          <p className="text-gray-500 mt-1">Начните планировать питание уже сегодня!</p>
        </div>

        {serverError && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Имя пользователя</label>
            <input 
              type="text" 
              className="input-field"
              placeholder="your_username"
              {...register('username')}
            />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
          </div>

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
              placeholder="Минимум 6 символов"
              {...register('password')}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Подтверждение пароля</label>
            <input 
              type="password" 
              className="input-field"
              placeholder="Повторите пароль"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button 
            type="submit" 
            className="btn-primary w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-primary-600 hover:underline font-medium">
            Войдите
          </Link>
        </p>
      </div>
    </div>
  );
}