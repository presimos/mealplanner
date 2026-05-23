import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MealPlanContext } from '../contexts/MealPlanContext';
import { AuthContext } from '../contexts/AuthContext';
import MealPlanDay from '../components/MealPlanDay';
import axios from 'axios';
import toast from 'react-hot-toast';
import { SHORT_DAYS, formatCalories, formatDate } from '../utils/formatters';

export default function MealPlans() {
  const { user } = useContext(AuthContext);
  const { plans, currentPlan, loading, fetchPlans, fetchPlan, generatePlan, clearCurrentPlan } = useContext(MealPlanContext);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    if (selectedPlanId) {
      fetchPlan(selectedPlanId);
    }
  }, [selectedPlanId, fetchPlan]);

  const handleGenerate = async () => {
    const result = await generatePlan({ days: 7, calories_per_day: user?.daily_calories || 2000 });
    if (result?.plan_id) {
      setSelectedPlanId(result.plan_id);
    }
  };

  const handleDelete = async (planId) => {
    if (!confirm('Удалить этот план питания? Это действие нельзя отменить.')) {
      return;
    }

    try {
      setDeleting(true);
      const token = localStorage.getItem('token');
      await axios.delete(`/api/meal-plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('План удалён 🗑️');
      
      // Сбросить ВСЁ
      setSelectedPlanId(null);
      clearCurrentPlan();  // ← Очистить currentPlan в контексте
      
      // Обновить список
      await fetchPlans();
      
    } catch (err) {
      toast.error('Ошибка удаления плана');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">📅 План питания</h1>
        <button onClick={handleGenerate} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50" disabled={loading}>
          {loading ? '⏳ Генерация...' : '✨ Сгенерировать план'}
        </button>
      </div>

      {/* Список планов */}
      {plans.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Ваши планы:</h2>
          <div className="flex flex-wrap gap-2">
            {plans.map(plan => (
              <div key={plan.id} className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPlanId === plan.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {plan.name}
                  <span className="ml-2 text-xs opacity-70">{formatCalories(plan.total_calories || 0)}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(plan.id);
                  }}
                  disabled={deleting}
                  className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg p-1 transition-colors"
                  title="Удалить план"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Текущий план */}
      {currentPlan ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">{currentPlan.plan.name}</h2>
              <p className="text-sm text-gray-500">
                {formatDate(currentPlan.plan.start_date)} — {formatDate(currentPlan.plan.end_date)}
              </p>
            </div>
            <div className="flex gap-2">
              <Link 
                to={`/shopping-list/${currentPlan.plan.id}`}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium text-sm"
              >
                🛒 Список покупок
              </Link>
              <button
                onClick={() => handleDelete(currentPlan.plan.id)}
                disabled={deleting}
                className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 font-medium text-sm"
              >
                🗑️ Удалить
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentPlan.days?.map((dayData, i) => (
              <MealPlanDay
                key={i}
                day={SHORT_DAYS[i]}
                dayIndex={i}
                meals={dayData.meals}
                totalCalories={dayData.totalCalories}
              />
            ))}
          </div>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-4">📅</p>
          <p className="text-lg">У вас пока нет планов питания</p>
          <p className="text-sm mb-4">Сгенерируйте первый план!</p>
          <button onClick={handleGenerate} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium">
            Создать план
          </button>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <p>Выберите план выше для просмотра</p>
        </div>
      )}
    </div>
  );
}