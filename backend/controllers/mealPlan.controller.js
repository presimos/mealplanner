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
      const { days = 7, calories_per_day } = req.body;
      
      const user = db.prepare('SELECT daily_calories, goal FROM users WHERE id = ?').get(req.user.id);
      
      let targetCalories = calories_per_day || user?.daily_calories || 2000;
      
      if (user?.goal === 'gain' && !calories_per_day) {
        targetCalories += 500;
      }
      
      if (user?.goal === 'lose' && !calories_per_day) {
        targetCalories -= 500;
      }
      
      targetCalories = Math.max(1200, Math.min(5000, targetCalories));

      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + (days - 1) * 86400000).toISOString().split('T')[0];

      const plan = db.prepare(`
        INSERT INTO meal_plans (user_id, name, start_date, end_date, total_calories)
        VALUES (?, ?, ?, ?, ?)
      `).run(req.user.id, `План на ${days} дн.`, startDate, endDate, 0);

      const allRecipes = db.prepare(`
        SELECT * FROM recipes 
        WHERE (is_approved = 1 AND is_public = 1) OR author_id = ?
      `).all(req.user.id);

      if (allRecipes.length < 4) {
        return res.status(400).json({ error: 'Недостаточно рецептов (минимум 4)' });
      }

      const mealRules = [
        { type: 'breakfast', targetPercent: 0.25, categoryIds: [1], fallbackIds: [] },
        { type: 'lunch', targetPercent: 0.35, categoryIds: [2, 3], fallbackIds: [4] },
        { type: 'dinner', targetPercent: 0.30, categoryIds: [4, 5], fallbackIds: [] },
        { type: 'snack', targetPercent: 0.10, categoryIds: [6, 7], fallbackIds: [1] }
      ];

      const insertMeal = db.prepare(`
        INSERT INTO plan_meals (plan_id, recipe_id, day_of_week, meal_type, servings)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (let day = 0; day < days; day++) {
        let usedToday = [];
        let dayCalories = 0;
        
        for (const rule of mealRules) {
          const targetMealCalories = targetCalories * rule.targetPercent;
          
          let pool = allRecipes.filter(r => rule.categoryIds.includes(r.category_id));
          if (pool.length === 0 && rule.fallbackIds.length > 0) {
            pool = allRecipes.filter(r => rule.fallbackIds.includes(r.category_id));
          }
          if (pool.length === 0) pool = allRecipes;

          const shuffled = [...pool].sort(() => Math.random() - 0.5);
          const candidates = [];
          
          for (const recipe of shuffled) {
            if (usedToday.includes(recipe.id)) continue;
            const diff = Math.abs(recipe.calories - targetMealCalories);
            if (diff < targetMealCalories * 0.4) {
              candidates.push({ recipe, diff });
            }
          }
          
          candidates.sort((a, b) => a.diff - b.diff);
          const topN = candidates.slice(0, Math.min(3, candidates.length));
          let bestRecipe = null;
          
          if (topN.length > 0) {
            const randomIndex = Math.floor(Math.random() * topN.length);
            bestRecipe = topN[randomIndex].recipe;
          }
          
          if (!bestRecipe) {
            bestRecipe = shuffled.find(r => !usedToday.includes(r.id)) || shuffled[0];
          }
          
          if (bestRecipe) {
            usedToday.push(bestRecipe.id);
            
            let servings = 1;
            if (bestRecipe.calories < targetMealCalories * 0.5) {
              servings = Math.min(3, Math.max(1, Math.round(targetMealCalories / bestRecipe.calories)));
            }
            
            insertMeal.run(plan.lastInsertRowid, bestRecipe.id, day, rule.type, servings);
            dayCalories += bestRecipe.calories * servings;
          }
        }
        
        // Добивка 1: если меньше 80% нормы
        if (dayCalories < targetCalories * 0.8) {
          const needed = targetCalories - dayCalories;
          const extraPool = [...allRecipes].sort(() => Math.random() - 0.5);
          const extraRecipe = extraPool.find(r => !usedToday.includes(r.id));
          
          if (extraRecipe) {
            const extraServings = Math.min(4, Math.max(1, Math.round(needed / extraRecipe.calories)));
            insertMeal.run(plan.lastInsertRowid, extraRecipe.id, day, 'snack', extraServings);
            dayCalories += extraRecipe.calories * extraServings;
            usedToday.push(extraRecipe.id);
          }
        }
        
        // Добивка 2: если всё ещё меньше 90% нормы
        if (dayCalories < targetCalories * 0.9) {
          const needed = targetCalories - dayCalories;
          const extraPool = [...allRecipes].sort(() => Math.random() - 0.5);
          const extraRecipe = extraPool.find(r => !usedToday.includes(r.id));
          
          if (extraRecipe) {
            const extraServings = Math.min(4, Math.max(1, Math.round(needed / extraRecipe.calories)));
            insertMeal.run(plan.lastInsertRowid, extraRecipe.id, day, 'snack', extraServings);
          }
        }
      }

      const totalCalories = db.prepare(`
        SELECT COALESCE(SUM(r.calories * pm.servings), 0) as total
        FROM plan_meals pm
        JOIN recipes r ON pm.recipe_id = r.id
        WHERE pm.plan_id = ?
      `).get(plan.lastInsertRowid);
      
      const avgPerDay = Math.round(totalCalories.total / days);

      db.prepare('UPDATE meal_plans SET total_calories = ?, name = ? WHERE id = ?')
        .run(totalCalories.total, `План на ${days} дн. (~${avgPerDay} ккал/день)`, plan.lastInsertRowid);

      res.status(201).json({
        message: `План сгенерирован! ~${avgPerDay} ккал/день`,
        plan_id: plan.lastInsertRowid,
        daily_target: avgPerDay
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
  },

   // Удаление плана питания
  deletePlan(req, res) {
    try {
      const db = getDB();
      const { id } = req.params;

      // Проверяем, что план принадлежит пользователю
      const plan = db.prepare('SELECT * FROM meal_plans WHERE id = ? AND user_id = ?').get(id, req.user.id);
      
      if (!plan) {
        return res.status(404).json({ error: 'План не найден' });
      }

      // Удаляем план (каскадно удалятся plan_meals)
      db.prepare('DELETE FROM meal_plans WHERE id = ?').run(id);

      res.json({ message: 'План питания удалён' });
    } catch (err) {
      console.error('Delete plan error:', err);
      res.status(500).json({ error: 'Ошибка удаления плана' });
    }
  }
};

module.exports = mealPlanController;