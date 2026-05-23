// pages/NotFound.jsx - Страница 404
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
        <p className="text-xl text-gray-600 mb-6">Страница не найдена</p>
        <p className="text-gray-500 mb-8">
          Возможно, вы перешли по неверной ссылке или страница была удалена.
        </p>
        <Link to="/" className="btn-primary">
          🏠 На главную
        </Link>
      </div>
    </div>
  );
}