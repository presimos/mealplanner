// contexts/MealPlanContext.jsx - Контекст планов питания
import { createContext, useState, useCallback } from 'react';
import { mealPlansAPI } from '../services/api';
import toast from 'react-hot-toast';

export const MealPlanContext = createContext(null);

export function MealPlanProvider({ children }) {
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [shoppingList, setShoppingList] = useState(null);
  const [loading, setLoading] = useState(false);

  const clearCurrentPlan = useCallback(() => {
    setCurrentPlan(null);
  }, []);

  // Загрузка всех планов
  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await mealPlansAPI.getAll();
      setPlans(res.data.plans);
    } catch (err) {
      toast.error('Ошибка загрузки планов');
    } finally {
      setLoading(false);
    }
  }, []);

  // Загрузка конкретного плана
  const fetchPlan = useCallback(async (id) => {
    try {
      setLoading(true);
      const res = await mealPlansAPI.getById(id);
      setCurrentPlan(res.data);
      return res.data;
    } catch (err) {
      toast.error('Ошибка загрузки плана');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Генерация нового плана
  const generatePlan = useCallback(async (data) => {
    try {
      setLoading(true);
      const res = await mealPlansAPI.generate(data);
      toast.success(`План сгенерирован! 🎯 Норма: ${res.data.daily_target || '~'} ккал/день`);
      await fetchPlans();
      return res.data;
    } catch (err) {
      toast.error('Ошибка генерации плана');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchPlans]);

  // Получение списка покупок
  const fetchShoppingList = useCallback(async (planId) => {
    try {
      const res = await mealPlansAPI.getShoppingList(planId);
      setShoppingList(res.data.shoppingList);
      return res.data.shoppingList;
    } catch (err) {
      toast.error('Ошибка загрузки списка покупок');
      return null;
    }
  }, []);

  const value = {
    plans,
    currentPlan,
    shoppingList,
    loading,
    fetchPlans,
    fetchPlan,
    generatePlan,
    fetchShoppingList,
    clearCurrentPlan,
  };

  return (
    <MealPlanContext.Provider value={value}>
      {children}
    </MealPlanContext.Provider>
  );
}