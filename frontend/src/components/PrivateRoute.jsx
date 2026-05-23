// components/PrivateRoute.jsx - Защита маршрутов
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary-600"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
}