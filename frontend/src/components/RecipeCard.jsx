// components/RecipeCard.jsx - Карточка рецепта
import { Link } from 'react-router-dom';
import { formatCalories, formatTime, formatNutrition } from '../utils/formatters';

export default function RecipeCard({ recipe, onFavorite, showFavorite = false }) {
  return (
    <div className="card group">
      {/* Изображение */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {recipe.image_url ? (
          <img 
            src={recipe.image_url} 
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🍽️
          </div>
        )}
        
        {/* Калории */}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-medium">
          {formatCalories(recipe.calories)}
        </div>
        
        {/* Время */}
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
          ⏱️ {formatTime(recipe.prep_time + recipe.cook_time)}
        </div>
      </div>

      {/* Информация */}
      <div className="p-4">
        <Link to={`/recipes/${recipe.id}`}>
          <h3 className="font-semibold text-gray-900 mb-1 hover:text-primary-600 transition-colors">
            {recipe.title}
          </h3>
        </Link>
        
        {recipe.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{recipe.description}</p>
        )}
        
        {/* БЖУ */}
        <div className="flex gap-2 text-xs mb-3">
          <span className="badge bg-blue-100 text-blue-800">Б: {recipe.proteins}г</span>
          <span className="badge bg-yellow-100 text-yellow-800">Ж: {recipe.fats}г</span>
          <span className="badge bg-purple-100 text-purple-800">У: {recipe.carbs}г</span>
        </div>
        
        {/* Категория и действия */}
        <div className="flex items-center justify-between">
          {recipe.category_name && (
            <span className="text-xs text-gray-400">{recipe.category_name}</span>
          )}
          
          {showFavorite && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onFavorite?.(recipe.id);
              }}
              className={`text-xl transition-transform hover:scale-125 ${
                recipe.isFavorite ? 'text-red-500' : 'text-gray-300'
              }`}
            >
              {recipe.isFavorite ? '❤️' : '🤍'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}