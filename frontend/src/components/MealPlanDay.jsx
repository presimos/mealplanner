import { MEAL_TYPES, formatCalories } from '../utils/formatters';

export default function MealPlanDay({ day, dayIndex, meals, totalCalories }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">{day}</h3>
        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
          {formatCalories(totalCalories)}
        </span>
      </div>
      
      <div className="space-y-2">
        {meals?.map((meal) => (
          <div key={meal.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
            <span className="text-lg">
              {meal.meal_type === 'breakfast' && '🌅'}
              {meal.meal_type === 'lunch' && '🍲'}
              {meal.meal_type === 'dinner' && '🍽️'}
              {meal.meal_type === 'snack' && '🍎'}
            </span>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{meal.title || 'Без рецепта'}</p>
              <div className="flex gap-1 text-xs text-gray-500">
                {meal.servings > 1 && (
                  <span className="bg-orange-100 text-orange-700 px-1 rounded">×{meal.servings} порц.</span>
                )}
                <span>{formatCalories(meal.calories * (meal.servings || 1))}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}