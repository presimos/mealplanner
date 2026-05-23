import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { recipesAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function AddRecipe() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions: '',
    prep_time: '',
    cook_time: '',
    servings: '4',
    calories: '',
    proteins: '',
    fats: '',
    carbs: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация
    if (!form.title || !form.instructions || !form.calories) {
      toast.error('Заполните обязательные поля: название, инструкция, калории');
      return;
    }

    try {
      setLoading(true);
      const data = {
        title: form.title,
        description: form.description,
        instructions: form.instructions,
        prep_time: Number(form.prep_time) || 10,
        cook_time: Number(form.cook_time) || 20,
        servings: Number(form.servings) || 4,
        calories: Number(form.calories),
        proteins: Number(form.proteins) || 0,
        fats: Number(form.fats) || 0,
        carbs: Number(form.carbs) || 0,
      };

      await recipesAPI.create(data);
      toast.success('Рецепт создан! 🎉');
      navigate('/recipes');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка создания рецепта');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-gray-500">Войдите, чтобы добавлять рецепты</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">📝 Добавить рецепт</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
        {/* Название */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Название рецепта *
          </label>
          <input
            type="text"
            name="title"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="Например: Паста Карбонара"
            value={form.title}
            onChange={handleChange}
            required
          />
        </div>

        {/* Описание */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Краткое описание
          </label>
          <input
            type="text"
            name="description"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="Вкусное и полезное блюдо..."
            value={form.description}
            onChange={handleChange}
          />
        </div>

        {/* Инструкция */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Инструкция приготовления *
          </label>
          <textarea
            name="instructions"
            rows="5"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="1. Подготовьте ингредиенты.&#10;2. Смешайте...&#10;3. Готовьте 30 минут..."
            value={form.instructions}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        {/* Время и порции */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Подготовка (мин)
            </label>
            <input
              type="number"
              name="prep_time"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="10"
              value={form.prep_time}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Готовка (мин)
            </label>
            <input
              type="number"
              name="cook_time"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="30"
              value={form.cook_time}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Порций
            </label>
            <input
              type="number"
              name="servings"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="4"
              value={form.servings}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Пищевая ценность */}
        <div>
          <h3 className="font-medium text-gray-700 mb-3">🍽️ Пищевая ценность (на порцию)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Калории *</label>
              <input
                type="number"
                name="calories"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="350"
                value={form.calories}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Белки (г)</label>
              <input
                type="number"
                name="proteins"
                step="0.1"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="25"
                value={form.proteins}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Жиры (г)</label>
              <input
                type="number"
                name="fats"
                step="0.1"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="12"
                value={form.fats}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Углеводы (г)</label>
              <input
                type="number"
                name="carbs"
                step="0.1"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="45"
                value={form.carbs}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
          >
            {loading ? '⏳ Создание...' : '✅ Создать рецепт'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/recipes')}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}