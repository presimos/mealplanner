import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { recipesAPI } from '../services/api';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#22c55e', '#3b82f6', '#f97316'];

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [recipes, setRecipes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Загружаем рецепты
      const recipesRes = await recipesAPI.getAll();
      setRecipes(recipesRes.data.recipes.slice(0, 6));

      // Загружаем статистику плана питания
      if (user) {
        const statsRes = await axios.get('/api/meal-plans/stats/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(statsRes.data);
      }
    } catch (err) {
      // Если плана нет — не страшно
      if (err.response?.status !== 404) {
        toast.error('Ошибка загрузки данных');
      }
    } finally {
      setLoading(false);
    }
  };

  // Данные для круговой диаграммы
  const pieData = stats ? [
    { name: 'Белки', value: stats.avgProteins },
    { name: 'Жиры', value: stats.avgFats },
    { name: 'Углеводы', value: stats.avgCarbs },
  ] : [];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Приветствие */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Привет, {user?.username}! 👋</h1>
        <p className="text-green-100 text-lg">
          Ваша дневная норма: <strong>{user?.daily_calories || 2000} ккал</strong>
        </p>
      </div>

      {/* Быстрые действия */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link to="/recipes" className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow text-center">
          <span className="text-3xl">📋</span>
          <p className="font-medium mt-2 text-sm">Рецепты</p>
        </Link>
        <Link to="/meal-plans" className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow text-center">
          <span className="text-3xl">📅</span>
          <p className="font-medium mt-2 text-sm">План питания</p>
        </Link>
        <Link to="/shopping-list" className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow text-center">
          <span className="text-3xl">🛒</span>
          <p className="font-medium mt-2 text-sm">Список покупок</p>
        </Link>
        <Link to="/profile" className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow text-center">
          <span className="text-3xl">⚙️</span>
          <p className="font-medium mt-2 text-sm">Профиль</p>
        </Link>
      </div>

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* График калорий по дням */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold text-lg mb-4">📊 Калории по дням</h3>
          {stats && stats.dailyStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} ккал`, 'Калории']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="calories" name="Калории" fill="#22c55e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-4xl mb-3">📅</p>
                <p>Нет данных о плане питания</p>
                <Link to="/meal-plans" className="text-green-600 hover:underline text-sm mt-2 inline-block">
                  Создать план питания
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Круговая диаграмма БЖУ */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold text-lg mb-4">🍽️ Распределение БЖУ</h3>
          {pieData.length > 0 && pieData[0].value > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}г`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}г`, '']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-4xl mb-3">🥗</p>
                <p>Нет данных о питании</p>
                <Link to="/meal-plans" className="text-green-600 hover:underline text-sm mt-2 inline-block">
                  Сгенерировать план
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Карточки статистики */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.totalCalories}</p>
            <p className="text-xs text-gray-500">Всего ккал в плане</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.avgProteins}г</p>
            <p className="text-xs text-gray-500">Ср. белки/день</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.avgFats}г</p>
            <p className="text-xs text-gray-500">Ср. жиры/день</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.avgCarbs}г</p>
            <p className="text-xs text-gray-500">Ср. углеводы/день</p>
          </div>
        </div>
      )}

      {/* Последние рецепты */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">📝 Рецепты</h2>
          <Link to="/recipes" className="text-green-600 hover:underline text-sm">Все рецепты →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map(recipe => (
            <Link key={recipe.id} to={`/recipes/${recipe.id}`} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all">
              <div className="p-6">
                <h3 className="font-semibold text-gray-800 mb-2">{recipe.title}</h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{recipe.description}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    {recipe.calories} ккал
                  </span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    Б: {recipe.proteins}г
                  </span>
                  <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                    Ж: {recipe.fats}г
                  </span>
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    У: {recipe.carbs}г
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}