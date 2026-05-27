import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [usersRes, statsRes] = await Promise.all([
        axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/users/stats', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(usersRes.data.users || []);
      setStats(statsRes.data.stats || {});
    } catch (err) {
      toast.error('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">👑 Админ-панель</h1>

      {/* Статистика */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <p className="text-2xl font-bold">{stats.totalUsers || 0}</p>
            <p className="text-xs text-gray-500">Пользователей</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <p className="text-2xl font-bold">{stats.totalRecipes || 0}</p>
            <p className="text-xs text-gray-500">Рецептов</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <p className="text-2xl font-bold">{stats.totalPlans || 0}</p>
            <p className="text-xs text-gray-500">Планов</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <p className="text-2xl font-bold">{stats.totalFavorites || 0}</p>
            <p className="text-xs text-gray-500">Избранное</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <p className="text-2xl font-bold">{stats.avgCalories || 0}</p>
            <p className="text-xs text-gray-500">Ср. ккал</p>
          </div>
        </div>
      )}

      {/* Таблица пользователей */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="font-semibold text-lg">👥 Пользователи</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Имя</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Роль</th>
                <th className="p-3 text-left">Ккал/день</th>
                <th className="p-3 text-left">Цель</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{u.id}</td>
                  <td className="p-3 font-medium">{u.username}</td>
                  <td className="p-3 text-gray-500">{u.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {u.role === 'admin' ? '👑 Админ' : '👤 Польз.'}
                    </span>
                  </td>
                  <td className="p-3">{u.daily_calories || 2000}</td>
                  <td className="p-3">{u.goal === 'lose' ? '🔥 Похудение' : u.goal === 'gain' ? '💪 Набор' : '⚖️ Поддержание'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}