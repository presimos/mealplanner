// App.jsx - Главный компонент с маршрутизацией
import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

// Страницы
import AddRecipe from './pages/AddRecipe';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RecipesList from './pages/RecipesList';
import RecipeDetail from './pages/RecipeDetail';
import MealPlans from './pages/MealPlans';
import ShoppingList from './pages/ShoppingList';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import AdminPanel from './pages/AdminPanel';

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
          
          {/* Защищённые маршруты */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/recipes" element={<RecipesList />} />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          <Route path="/meal-plans" element={<PrivateRoute><MealPlans /></PrivateRoute>} />
          <Route path="/shopping-list/:planId?" element={<PrivateRoute><ShoppingList /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/recipes/add" element={<PrivateRoute><AddRecipe /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute adminOnly><AdminPanel /></PrivateRoute>} />
          
          {/* Редирект с корня */}
          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/recipes"} />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      
      {/* Футер */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          © 2026 MealPlanner — Планируйте питание с умом 🥗
        </div>
      </footer>
    </div>
  );
}

export default App;