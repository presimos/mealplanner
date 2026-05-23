import { Link } from 'react-router-dom';
import { formatCalories, formatTime } from '../utils/formatters';

export default function RecipeCard({ recipe, onFavorite, onDelete, showFavorite, showDelete }) {
  return (
    <div className="relative group">
      {/* Кнопка удаления */}
      {showDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(recipe.id);
          }}
          className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          title="Удалить рецепт"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      <Link to={`/recipes/${recipe.id}`} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all block">
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
            <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
          )}
          
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-medium">
            {formatCalories(recipe.calories)}
          </div>
          
          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
            ⏱️ {formatTime(recipe.prep_time + recipe.cook_time)}
          </div>
        </div>

        {/* Информация */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 hover:text-green-600 transition-colors">
            {recipe.title}
          </h3>
          
          {recipe.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{recipe.description}</p>
          )}
          
          <div className="flex gap-2 text-xs mb-3">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Б: {recipe.proteins}г</span>
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full">Ж: {recipe.fats}г</span>
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">У: {recipe.carbs}г</span>
          </div>
          
          <div className="flex items-center justify-between">
            {recipe.category_name && (
              <span className="text-xs text-gray-400">{recipe.category_name}</span>
            )}
            
            {showFavorite && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
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
      </Link>
    </div>
  );
}