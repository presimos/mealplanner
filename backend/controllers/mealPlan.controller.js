const { getDB } = require('../db');

const mealPlanController = {
  // Получение всех планов пользователя
  getAll(req, res) {
    try {
      const db = getDB();
      const plans = db.prepare(`
        SELECT mp.*, 
          (SELECT COUNT(*) FROM plan_meals WHERE plan_id = mp.id) as meals_count
        FROM meal_plans mp
        WHERE mp.user_id = ?
        ORDER BY mp.created_at DESC
      `).all(req.user.id);

      res.json({ plans });
    } catch (err) {
      console.error('Get meal plans error:', err);
      res.status(500).json({ error: 'Ошибка получения планов питания' });
    }
  },

  // Получение плана по ID с приёмами пищи
  getById(req, res) {
    try {
      const db = getDB();
      const { id } = req.params;

      const plan = db.prepare(`
        SELECT * FROM meal_plans WHERE id = ? AND user_id = ?
      `).get(id, req.user.id);

      if (!plan) {
        return res.status(404).json({ error: 'План не найден' });
      }

      // Приёмы пищи с рецептами
      const meals = db.prepare(`
        SELECT pm.*, r.title, r.calories, r.proteins, r.fats, r.carbs, r.image_url, r.prep_time, r.cook_time
        FROM plan_meals pm
        LEFT JOIN recipes r ON pm.recipe_id = r.id
        WHERE pm.plan_id = ?
        ORDER BY pm.day_of_week, 
          CASE pm.meal_type 
            WHEN 'breakfast' THEN 1 
            WHEN 'lunch' THEN 2 
            WHEN 'dinner' THEN 3 
            WHEN 'snack' THEN 4 
          END
      `).all(id);

      // Группировка по дням
      const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
      const grouped = {};
      
      for (const meal of meals) {
        const dayKey = meal.day_of_week;
        if (!grouped[dayKey]) {
          grouped[dayKey] = { day: days[dayKey], meals: [], totalCalories: 0 };
        }
        grouped[dayKey].meals.push(meal);
        grouped[dayKey].totalCalories += (meal.calories || 0) * meal.servings;
      }

      res.json({ plan, days: Object.values(grouped) });
    } catch (err) {
      console.error('Get meal plan error:', err);
      res.status(500).json({ error: 'Ошибка получения плана' });
    }
  },

  // Генерация плана питания
  generate(req, res) {
    try {
      const db = getDB();
      const { days = 7, calories_per_day } = req.params;
      
      // Получение параметров пользователя
      const user = db.prepare('SELECT daily_calories, goal FROM users WHERE id = ?').get(req.user.id);
      const targetCalories = calories_per_day || user.daily_calories || 2000;

      // Создание плана
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + (days - 1) * 86400000).toISOString().split('T')[0];

      const plan = db.prepare(`
        INSERT INTO meal_plans (user_id, name, start_date, end_date, total_calories)
        VALUES (?, ?, ?, ?, ?)
      `).run(req.user.id, `План на ${days} дн.`, startDate, endDate, targetCalories * days);

      // Распределение калорий
      const mealDistribution = { breakfast: 0.25, lunch: 0.35, dinner: 0.30, snack: 0.10 };
      
      // Получение одобренных рецептов
      const recipes = db.prepare(`
        SELECT * FROM recipes WHERE is_approved = 1 AND is_public = 1 ORDER BY RANDOM()
      `).all();

      if (recipes.length === 0) {
        return res.status(400).json({ error: 'Нет доступных рецептов' });
      }

      const insertMeal = db.prepare(`
        INSERT INTO plan_meals (plan_id, recipe_id, day_of_week, meal_type, servings)
        VALUES (?, ?, ?, ?, ?)
      `);

      // Заполнение плана
      for (let day = 0; day < days; day++) {
        const shuffled = [...recipes].sort(() => Math.random() - 0.5);
        let recipeIndex = 0;

        for (const [mealType, proportion] of Object.entries(mealDistribution)) {
          const targetMealCalories = targetCalories * proportion;
          
          // Поиск подходящего рецепта
          let bestRecipe = shuffled[recipeIndex % shuffled.length];
          for (const recipe of shuffled) {
            if (Math.abs(recipe.calories - targetMealCalories) < Math.abs(bestRecipe.calories - targetMealCalories)) {
              bestRecipe = recipe;
            }
          }
          
          insertMeal.run(plan.lastInsertRowid, bestRecipe.id, day, mealType, 1);
          recipeIndex++;
        }
      }

      res.status(201).json({
        message: 'План питания сгенерирован',
        plan_id: plan.lastInsertRowid
      });
    } catch (err) {
      console.error('Generate meal plan error:', err);
      res.status(500).json({ error: 'Ошибка генерации плана' });
    }
  },

  // Обновление приёма пищи
  updateMeal(req, res) {
    try {
      const db = getDB();
      const { planId, mealId } = req.params;
      
      // Проверка принадлежности плана пользователю
      const plan = db.prepare('SELECT * FROM meal_plans WHERE id = ? AND user_id = ?')
        .get(planId, req.user.id);
      if (!plan) {
        return res.status(404).json({ error: 'План не найден' });
      }

      if (req.body.recipe_id) {
        db.prepare('UPDATE plan_meals SET recipe_id = ? WHERE id = ?').run(req.body.recipe_id, mealId);
      }
      if (req.body.servings) {
        db.prepare('UPDATE plan_meals SET servings = ? WHERE id = ?').run(req.body.servings, mealId);
      }

      res.json({ message: 'Приём пищи обновлён' });
    } catch (err) {
      console.error('Update meal error:', err);
      res.status(500).json({ error: 'Ошибка обновления приёма пищи' });
    }
  },

  // Получение списка покупок
  getShoppingList(req, res) {
    try {
      const db = getDB();
      const { id } = req.params;

      // Агрегация всех ингредиентов из плана
      const items = db.prepare(`
        SELECT 
          i.name as ingredient_name,
          SUM(ri.amount * pm.servings) as total_amount,
          ri.unit
        FROM plan_meals pm
        JOIN recipe_ingredients ri ON pm.recipe_id = ri.recipe_id
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE pm.plan_id = ?
        GROUP BY i.name, ri.unit
        ORDER BY i.name
      `).all(id);

      res.json({ shoppingList: items });
    } catch (err) {
      console.error('Get shopping list error:', err);
      res.status(500).json({ error: 'Ошибка получения списка покупок' });
    }
  },

  // Экспорт списка покупок
  exportShoppingList(req, res) {
    try {
      const db = getDB();
      const { id } = req.params;

      const items = db.prepare(`
        SELECT 
          i.name as ingredient_name,
          SUM(ri.amount * pm.servings) as total_amount,
          ri.unit
        FROM plan_meals pm
        JOIN recipe_ingredients ri ON pm.recipe_id = ri.recipe_id
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE pm.plan_id = ?
        GROUP BY i.name, ri.unit
        ORDER BY i.name
      `).all(id);

      // Формирование текстового списка
      let text = '🛒 Список покупок\n' + '='.repeat(40) + '\n\n';
      for (const item of items) {
        text += `☐ ${item.ingredient_name} — ${Math.round(item.total_amount)} ${item.unit}\n`;
      }

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="shopping-list-${id}.txt"`);
      res.send(text);
    } catch (err) {
      console.error('Export shopping list error:', err);
      res.status(500).json({ error: 'Ошибка экспорта списка покупок' });
    }
  },
  
  getStats(req, res) {
    try {
      const db = getDB();
      
      // Получить последний план пользователя
      const plan = db.prepare(`
        SELECT * FROM meal_plans 
        WHERE user_id = ? 
        ORDER BY created_at DESC LIMIT 1
      `).get(req.user.id);

      if (!plan) {
        // Если плана нет — возвращаем пустые данные
        return res.json({ 
          dailyStats: [],
          totalCalories: 0,
          avgProteins: 0,
          avgFats: 0,
          avgCarbs: 0
        });
      }

      // Статистика по дням
      const dailyStats = db.prepare(`
        SELECT 
          pm.day_of_week,
          SUM(r.calories * pm.servings) as total_calories,
          SUM(r.proteins * pm.servings) as total_proteins,
          SUM(r.fats * pm.servings) as total_fats,
          SUM(r.carbs * pm.servings) as total_carbs
        FROM plan_meals pm
        JOIN recipes r ON pm.recipe_id = r.id
        WHERE pm.plan_id = ?
        GROUP BY pm.day_of_week
        ORDER BY pm.day_of_week
      `).all(plan.id);

      // Общая статистика
      const totals = db.prepare(`
        SELECT 
          SUM(r.calories * pm.servings) as total_calories,
          ROUND(AVG(r.proteins * pm.servings), 1) as avg_proteins,
          ROUND(AVG(r.fats * pm.servings), 1) as avg_fats,
          ROUND(AVG(r.carbs * pm.servings), 1) as avg_carbs
        FROM plan_meals pm
        JOIN recipes r ON pm.recipe_id = r.id
        WHERE pm.plan_id = ?
      `).get(plan.id);

      res.json({
        planId: plan.id,
        planName: plan.name,
        dailyStats: dailyStats.map(d => ({
          day: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][d.day_of_week],
          calories: d.total_calories,
          proteins: d.total_proteins,
          fats: d.total_fats,
          carbs: d.total_carbs
        })),
        totalCalories: totals.total_calories || 0,
        avgProteins: totals.avg_proteins || 0,
        avgFats: totals.avg_fats || 0,
        avgCarbs: totals.avg_carbs || 0
      });
    } catch (err) {
      console.error('Get stats error:', err);
      res.status(500).json({ error: 'Ошибка получения статистики' });
    }
  }

};

module.exports = mealPlanController;