// pages/Profile.jsx - Профиль пользователя
import { useContext } from 'react';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../contexts/AuthContext';
import { calculateBMR, formatCalories } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateProfile } = useContext(AuthContext);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      weight: user?.weight || '',
      height: user?.height || '',
      age: user?.age || '',
      gender: user?.gender || '',
      activity_level: user?.activity_level || 'moderate',
      goal: user?.goal || 'maintain',
    }
  });

  const onSubmit = async (data) => {
    // Преобразование пустых строк в undefined
    const cleaned = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === '' ? undefined : v])
    );
    
    // Преобразование строковых чисел
    if (cleaned.weight) cleaned.weight = Number(cleaned.weight);
    if (cleaned.height) cleaned.height = Number(cleaned.height);
    if (cleaned.age) cleaned.age = Number(cleaned.age);

    await updateProfile(cleaned);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">⚙️ Профиль</h1>

      {/* Текущие параметры */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Текущие параметры</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold">{user?.weight || '—'} кг</p>
            <p className="text-xs text-gray-500">Вес</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold">{user?.height || '—'} см</p>
            <p className="text-xs text-gray-500">Рост</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold">{user?.age || '—'}</p>
            <p className="text-xs text-gray-500">Возраст</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold">{formatCalories(user?.daily_calories || 2000)}</p>
            <p className="text-xs text-gray-500">Норма калорий</p>
          </div>
        </div>
      </div>

      {/* Форма редактирования */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Редактировать профиль</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Вес (кг)</label>
              <input type="number" step="0.1" className="input-field" {...register('weight')} placeholder="70" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Рост (см)</label>
              <input type="number" className="input-field" {...register('height')} placeholder="175" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Возраст</label>
              <input type="number" className="input-field" {...register('age')} placeholder="30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Пол</label>
              <select className="input-field" {...register('gender')}>
                <option value="">Не указан</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Уровень активности</label>
              <select className="input-field" {...register('activity_level')}>
                <option value="sedentary">Сидячий образ жизни</option>
                <option value="light">Лёгкая активность</option>
                <option value="moderate">Умеренная активность</option>
                <option value="active">Активный</option>
                <option value="very_active">Очень активный</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Цель</label>
              <select className="input-field" {...register('goal')}>
                <option value="lose">Похудение</option>
                <option value="maintain">Поддержание веса</option>
                <option value="gain">Набор массы</option>
              </select>
            </div>
          </div>

          {/* Предпросмотр BMR */}
          {(user?.weight || user?.height || user?.age) && (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Базовый метаболизм (BMR): ~{calculateBMR(user?.weight || 70, user?.height || 170, user?.age || 30, user?.gender || 'male')} ккал/день
              </p>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Сохранение...' : '💾 Сохранить изменения'}
          </button>
        </form>
      </div>

      {/* Информация об аккаунте */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Аккаунт</h2>
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="text-gray-500">Имя пользователя</dt>
            <dd className="font-medium">{user?.username}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Роль</dt>
            <dd className="font-medium capitalize">{user?.role}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}