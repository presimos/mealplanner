// pages/MealPlans.jsx - Страница планов питания
import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MealPlanContext } from '../contexts/MealPlanContext';
import { AuthContext } from '../contexts/AuthContext';
import MealPlanDay from '../components/MealPlanDay';
import { SHORT_DAYS, formatCalories, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function MealPlans() {
  const { user } = useContext(AuthContext);
  const { plans, currentPlan, loading, fetchPlans, fetchPlan, generatePlan } = useContext(MealPlanContext);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">📅 План питания</h1>
        <button onClick={handleGenerate} className="btn-primary" disabled={loading}>
          {loading ? 'Генерация...' : '✨ Сгенерировать план'}
        </button>
      </div>

      {/* Выбор плана */}
      {plans.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {plans.map(plan => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedPlanId === plan.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {plan.name}
              <span className="ml-2 text-xs opacity-70">{formatCalories(plan.total_calories || 0)}</span>
            </button>
          ))}
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
            <Link 
              to={`/shopping-list/${currentPlan.plan.id}`}
              className="btn-secondary text-sm"
            >
              🛒 Список покупок
            </Link>
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
      ) : (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-4">📅</p>
          <p className="text-lg">У вас пока нет планов питания</p>
          <p className="text-sm mb-4">Сгенерируйте первый план или выберите из списка выше</p>
          <button onClick={handleGenerate} className="btn-primary">
            Создать план
          </button>
        </div>
      )}
    </div>
  );
}