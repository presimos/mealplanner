// components/MealPlanDay.jsx - День плана питания
import { MEAL_TYPES, formatCalories } from '../utils/formatters';

export default function MealPlanDay({ day, dayIndex, meals, totalCalories }) {
  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">{day}</h3>
        <span className="badge badge-green">{formatCalories(totalCalories)}</span>
      </div>
      
      <div className="space-y-3">
        {meals?.map((meal) => (
          <div key={meal.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            {/* Иконка приёма пищи */}
            <span className="text-2xl">
              {meal.meal_type === 'breakfast' && '🌅'}
              {meal.meal_type === 'lunch' && '🍲'}
              {meal.meal_type === 'dinner' && '🍽️'}
              {meal.meal_type === 'snack' && '🍎'}
            </span>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{meal.title || 'Без рецепта'}</p>
              <div className="flex gap-2 text-xs text-gray-500">
                <span>{MEAL_TYPES[meal.meal_type]}</span>
                {meal.prep_time && <span>· ⏱️ {meal.prep_time + meal.cook_time} мин</span>}
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-semibold text-sm">{formatCalories(meal.calories * (meal.servings || 1))}</p>
              <p className="text-xs text-gray-400">×{meal.servings || 1} порц.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}