import { Link } from 'react-router-dom';

export default function ShoppingList() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <span className="text-6xl mb-6 block">🛒</span>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Список покупок</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 max-w-md mx-auto">
          <p className="text-yellow-800 text-lg font-medium mb-2">🚧 В разработке</p>
          <p className="text-yellow-600 text-sm">
            Этот раздел находится в разработке и скоро будет доступен.
            Здесь вы сможете создавать и управлять своими списками покупок.
          </p>
        </div>
        <Link 
          to="/meal-plans" 
          className="inline-block mt-6 text-green-600 hover:underline font-medium"
        >
          ← Вернуться к планам питания
        </Link>
      </div>
    </div>
  );
}