// pages/Dashboard.jsx - Главная страница пользователя
import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { MealPlanContext } from '../contexts/MealPlanContext';
import { recipesAPI, usersAPI } from '../services/api';
import { WeeklyCaloriesChart, MacronutrientsPie } from '../components/NutritionChart';
import RecipeCard from '../components/RecipeCard';
import { formatCalories } from '../utils/formatters';

export default function Dashboard() {
  const { user, isAdmin } = useContext(AuthContext);
  const { plans, fetchPlans } = useContext(MealPlanContext);
  const [favorites, setFavorites] = useState([]);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Загрузка избранных рецептов
    recipesAPI.getFavorites().then(res => setFavorites(res.data.recipes)).catch(() => {});

    // Загрузка планов
    fetchPlans();

    // Статистика для админа
    if (isAdmin) {
      usersAPI.getStats().then(res => setStats(res.data.stats)).catch(() => {});
    }

    // Тестовые данные для графиков
    setChartData([
      { day: 'Пн', calories: 1850 },
      { day: 'Вт', calories: 1920 },
      { day: 'Ср', calories: 1780 },
      { day: 'Чт', calories: 2010 },
      { day: 'Пт', calories: 1890 },
      { day: 'Сб', calories: 2100 },
      { day: 'Вс', calories: 1950 },
    ]);
  }, [fetchPlans, isAdmin]);

  return (
    <div className="space-y-8">
      {/* Приветствие */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Привет, {user?.username}! 👋</h1>
        <p className="text-primary-100">
          {user?.daily_calories 
            ? `Ваша дневная норма: ${formatCalories(user.daily_calories)}`
            : 'Заполните профиль для расчёта нормы калорий'}
        </p>
      </div>

      {/* Админская статистика */}
      {isAdmin && stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Пользователей', value: stats.totalUsers, icon: '👥' },
            { label: 'Рецептов', value: stats.totalRecipes, icon: '📋' },
            { label: 'Планов', value: stats.totalPlans, icon: '📅' },
            { label: 'Избранное', value: stats.totalFavorites, icon: '❤️' },
            { label: 'Ср. калорий', value: stats.avgCalories, icon: '🔥' },
          ].map((stat) => (
            <div key={stat.label} className="card p-4 text-center">
              <span className="text-2xl">{stat.icon}</span>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Левая колонка */}
        <div className="lg:col-span-2 space-y-8">
          {/* График калорий */}
          <WeeklyCaloriesChart data={chartData} />

          {/* Быстрые действия */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/meal-plans" className="card p-4 text-center hover:bg-primary-50 transition-colors">
              <span className="text-3xl">📅</span>
              <p className="font-medium mt-2">План питания</p>
            </Link>
            <Link to="/shopping-list" className="card p-4 text-center hover:bg-primary-50 transition-colors">
              <span className="text-3xl">🛒</span>
              <p className="font-medium mt-2">Список покупок</p>
            </Link>
            <Link to="/recipes" className="card p-4 text-center hover:bg-primary-50 transition-colors">
              <span className="text-3xl">🔍</span>
              <p className="font-medium mt-2">Найти рецепт</p>
            </Link>
            <Link to="/profile" className="card p-4 text-center hover:bg-primary-50 transition-colors">
              <span className="text-3xl">⚙️</span>
              <p className="font-medium mt-2">Профиль</p>
            </Link>
          </div>

          {/* Последние планы */}
          {plans.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Ваши планы питания</h3>
              <div className="space-y-3">
                {plans.slice(0, 3).map(plan => (
                  <Link 
                    key={plan.id} 
                    to={`/shopping-list/${plan.id}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{plan.name}</p>
                      <p className="text-xs text-gray-500">{plan.start_date} — {plan.end_date}</p>
                    </div>
                    <span className="badge badge-green">{formatCalories(plan.total_calories || 0)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Правая колонка */}
        <div className="space-y-8">
          {/* БЖУ */}
          <MacronutrientsPie proteins={120} fats={60} carbs={200} />

          {/* Избранные рецепты */}
          {favorites.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">❤️ Избранные рецепты</h3>
              <div className="space-y-3">
                {favorites.slice(0, 3).map(recipe => (
                  <Link 
                    key={recipe.id}
                    to={`/recipes/${recipe.id}`}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {recipe.image_url && <img src={recipe.image_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{recipe.title}</p>
                      <p className="text-xs text-gray-500">{formatCalories(recipe.calories)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}