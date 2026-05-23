// pages/ShoppingList.jsx - Список покупок
import { useContext, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MealPlanContext } from '../contexts/MealPlanContext';
import toast from 'react-hot-toast';

export default function ShoppingList() {
  const { planId } = useParams();
  const { plans, fetchPlans, fetchShoppingList, shoppingList, loading } = useContext(MealPlanContext);
  const [checkedItems, setCheckedItems] = useState({});
  const [selectedPlanId, setSelectedPlanId] = useState(planId || null);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    if (selectedPlanId) {
      fetchShoppingList(selectedPlanId);
      setCheckedItems({});
    }
  }, [selectedPlanId, fetchShoppingList]);

  const toggleItem = (index) => {
    setCheckedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = shoppingList?.length || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">🛒 Список покупок</h1>

      {/* Выбор плана */}
      {!planId && plans.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {plans.map(plan => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedPlanId == plan.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {plan.name}
            </button>
          ))}
        </div>
      )}

      {/* Прогресс */}
      {shoppingList && shoppingList.length > 0 && (
        <div className="card p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Прогресс</span>
            <span className="text-sm text-gray-500">{checkedCount}/{totalCount}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(checkedCount / totalCount) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Список */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary-600"></div>
        </div>
      ) : !shoppingList ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-4">🛒</p>
          <p className="text-lg">Выберите план питания для просмотра списка покупок</p>
        </div>
      ) : shoppingList.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-lg">Список покупок пуст</p>
        </div>
      ) : (
        <div className="card divide-y">
          {shoppingList.map((item, index) => (
            <div 
              key={index}
              className={`flex items-center gap-4 p-4 transition-colors ${
                checkedItems[index] ? 'bg-gray-50 opacity-60' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={!!checkedItems[index]}
                onChange={() => toggleItem(index)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className={`flex-1 ${checkedItems[index] ? 'line-through text-gray-400' : ''}`}>
                {item.ingredient_name}
              </span>
              <span className="font-medium text-sm">
                {Math.round(item.total_amount)} {item.unit}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Действия */}
      {shoppingList && shoppingList.length > 0 && (
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setCheckedItems(
                Object.fromEntries(shoppingList.map((_, i) => [i, true]))
              );
              toast.success('Всё куплено! 🎉');
            }}
            className="btn-secondary text-sm"
          >
            ✅ Отметить всё
          </button>
        </div>
      )}
    </div>
  );
}