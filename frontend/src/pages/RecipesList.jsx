// pages/RecipesList.jsx - Список рецептов с фильтрацией
import { useState, useEffect, useContext } from 'react';
import { recipesAPI } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import RecipeCard from '../components/RecipeCard';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function RecipesList() {
  const { user } = useContext(AuthContext);
  const [recipes, setRecipes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Загрузка категорий (можно добавить endpoint)
    setCategories([
      { id: 1, name: 'Завтраки' },
      { id: 2, name: 'Супы' },
      { id: 3, name: 'Салаты' },
      { id: 4, name: 'Основные блюда' },
      { id: 5, name: 'Гарниры' },
      { id: 6, name: 'Десерты' },
      { id: 7, name: 'Напитки' },
    ]);
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [search, category, pagination.page]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, limit: 9 };
      if (search) params.search = search;
      if (category) params.category = category;
      
      const res = await recipesAPI.getAll(params);
      setRecipes(res.data.recipes);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Ошибка загрузки рецептов');
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (id) => {
    if (!user) {
      toast.error('Войдите, чтобы добавлять в избранное');
      return;
    }
    try {
      const res = await recipesAPI.toggleFavorite(id);
      toast.success(res.data.message);
      setRecipes(prev => prev.map(r => 
        r.id === id ? { ...r, isFavorite: res.data.isFavorite } : r
      ));
    } catch {
      toast.error('Ошибка');
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и поиск */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">📋 Рецепты</h1>
        <Link to="/recipes/add" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium">
  ➕ Добавить рецепт
</Link>
        
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Поиск рецептов..."
            className="input-field max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select 
            className="input-field max-w-[180px]"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Все категории</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Сетка рецептов */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary-600"></div>
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-lg">Рецепты не найдены</p>
          <p className="text-sm">Попробуйте изменить параметры поиска</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map(recipe => (
            <RecipeCard 
              key={recipe.id} 
              recipe={recipe}
              showFavorite={!!user}
              onFavorite={handleFavorite}
            />
          ))}
        </div>
      )}

      {/* Пагинация */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setPagination(p => ({ ...p, page }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                page === pagination.page
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}