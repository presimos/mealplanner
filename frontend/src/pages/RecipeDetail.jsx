// pages/RecipeDetail.jsx - Детальная страница рецепта
import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { recipesAPI } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { formatCalories, formatTime, formatNutrition } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function RecipeDetail() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipe();
  }, [id]);

  const loadRecipe = async () => {
    try {
      setLoading(true);
      const res = await recipesAPI.getById(id);
      setRecipe(res.data.recipe);
    } catch {
      toast.error('Рецепт не найден');
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!confirm('Удалить этот рецепт?')) return;
    
    try {
      await recipesAPI.delete(id);
      toast.success('Рецепт удалён');
      navigate('/recipes');
    } catch (err) {
      toast.error('Ошибка удаления');
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      toast.error('Войдите, чтобы добавить в избранное');
      return;
    }
    try {
      const res = await recipesAPI.toggleFavorite(id);
      setRecipe(prev => ({ ...prev, isFavorite: res.data.isFavorite }));
      toast.success(res.data.message);
    } catch {
      toast.error('Ошибка');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary-600"></div>
    </div>;
  }

  if (!recipe) {
    return <div className="text-center py-20">
      <p className="text-2xl">Рецепт не найден</p>
      <Link to="/recipes" className="text-primary-600 hover:underline mt-4 inline-block">← К списку рецептов</Link>
    </div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Хлебные крошки */}
      <nav className="text-sm text-gray-500">
        <Link to="/recipes" className="hover:text-primary-600">Рецепты</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800">{recipe.title}</span>
      </nav>

      {/* Основная информация */}
      <div className="card overflow-hidden">
        {/* Изображение */}
        <div className="h-64 md:h-96 bg-gray-200 relative">
          {recipe.image_url ? (
            <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🍽️</div>
          )}
          <button
            onClick={handleFavorite}
            className="absolute top-4 right-4 text-3xl bg-white/80 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform"
          >
            {recipe.isFavorite ? '❤️' : '🤍'}
          </button>
        </div>

        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{recipe.title}</h1>
              {recipe.description && <p className="text-gray-600">{recipe.description}</p>}
              {recipe.author_name && (
                <p className="text-sm text-gray-400 mt-2">Автор: {recipe.author_name}</p>
              )}
            </div>
            <div className="flex gap-2">
              {recipe.category_name && (
                <span className="badge bg-primary-100 text-primary-700">{recipe.category_name}</span>
              )}
            </div>
          </div>

          {/* Быстрая информация */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-primary-600">{formatCalories(recipe.calories)}</p>
              <p className="text-xs text-gray-500">на порцию</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">⏱️ {formatTime(recipe.prep_time + recipe.cook_time)}</p>
              <p className="text-xs text-gray-500">общее время</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">🍽️ {recipe.servings}</p>
              <p className="text-xs text-gray-500">порций</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-lg font-bold text-green-600">{formatNutrition(recipe.proteins, recipe.fats, recipe.carbs)}</p>
              <p className="text-xs text-gray-500">БЖУ</p>
            </div>
          </div>

          {/* Ингредиенты */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">📝 Ингредиенты</h2>
            {recipe.ingredients?.length > 0 ? (
              <ul className="space-y-2">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700">
                    <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                    <span>{ing.name}</span>
                    <span className="text-gray-400">— {ing.amount} {ing.unit}</span>
                    {ing.calories_per_100g && (
                      <span className="text-xs text-gray-400">({Math.round(ing.calories_per_100g * ing.amount / 100)} ккал)</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Ингредиенты не указаны</p>
            )}
          </div>

          {/* Инструкция */}
          <div>
            <h2 className="text-xl font-semibold mb-4">👨‍🍳 Приготовление</h2>
            <div className="prose max-w-none text-gray-700 whitespace-pre-line bg-gray-50 rounded-lg p-6">
              {recipe.instructions}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}