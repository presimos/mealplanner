// components/Navbar.jsx - Навигационная панель
import { useContext, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useContext(AuthContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive 
        ? 'bg-primary-100 text-primary-700' 
        : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex justify-between items-center h-16">
          {/* Логотип */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🥗</span>
            <span className="text-xl font-bold text-primary-700">MealPlanner</span>
          </Link>

          {/* Десктопное меню */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/recipes" className={linkClass}>
              Рецепты
            </NavLink>
            
            {user ? (
              <>
                <NavLink to="/dashboard" className={linkClass}>
                  Дашборд
                </NavLink>
                <NavLink to="/meal-plans" className={linkClass}>
                  План питания
                </NavLink>
                <NavLink to="/shopping-list" className={linkClass}>
                  🛒 Список покупок
                </NavLink>
                <NavLink to="/profile" className={linkClass}>
                  👤 {user.username}
                </NavLink>
                {isAdmin && (
                  <span className="badge badge-orange ml-2">Админ</span>
                )}
                <button 
                  onClick={handleLogout}
                  className="ml-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkClass}>
                  Войти
                </NavLink>
                <NavLink to="/register" className="btn-primary text-sm ml-2">
                  Регистрация
                </NavLink>
              </>
            )}
          </div>

          {/* Мобильное меню */}
          <button 
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Мобильная панель */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t space-y-2">
            <NavLink to="/recipes" className="block px-3 py-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileOpen(false)}>Рецепты</NavLink>
            {user ? (
              <>
                <NavLink to="/dashboard" className="block px-3 py-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileOpen(false)}>Дашборд</NavLink>
                <NavLink to="/meal-plans" className="block px-3 py-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileOpen(false)}>План питания</NavLink>
                <NavLink to="/profile" className="block px-3 py-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileOpen(false)}>Профиль</NavLink>
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="w-full text-left px-3 py-2 text-red-600">Выйти</button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="block px-3 py-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileOpen(false)}>Войти</NavLink>
                <NavLink to="/register" className="block px-3 py-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileOpen(false)}>Регистрация</NavLink>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}