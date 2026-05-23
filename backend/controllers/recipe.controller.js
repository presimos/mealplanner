const { getDB } = require('../db');

const recipeController = {
  // Получение всех рецептов с фильтрацией и пагинацией
  getAll(req, res) {
    try {
      const db = getDB();
      const { search, category, minCalories, maxCalories, page = 1, limit = 10 } = req.query;
      console.log('🔍 Запрос getAll:', { search, category, minCalories, maxCalories, page, limit });
      const userId = req.user?.id || 0;
      
      let query = `
        SELECT r.*, c.name as category_name, u.username as author_name
        FROM recipes r
        LEFT JOIN categories c ON r.category_id = c.id
        LEFT JOIN users u ON r.author_id = u.id
        WHERE 1=1
      `;
      const params = [];

      // Если неавторизован — только публичные
      if (!req.user) {
        query += ` AND r.is_public = 1 AND r.is_approved = 1`;
      } else {
        query += ` AND ((r.is_public = 1 AND r.is_approved = 1) OR r.author_id = ?)`;
        params.push(req.user.id);
      }

      if (search) {
        query += ` AND (r.title LIKE ? OR r.description LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }
      if (category) {
        query += ` AND r.category_id = ?`;
        params.push(category);
      }
      if (minCalories) {
        query += ` AND r.calories >= ?`;
        params.push(minCalories);
      }
      if (maxCalories) {
        query += ` AND r.calories <= ?`;
        params.push(maxCalories);
      }

      const offset = (page - 1) * limit;
      const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
      const countResult = db.prepare(countQuery).get(...params);
      const total = countResult?.total || 0;
      
      query += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
      params.push(Number(limit), offset);

      const recipes = db.prepare(query).all(...params);

      res.json({
        recipes,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      console.error('Get recipes error:', err);
      res.status(500).json({ error: 'Ошибка получения рецептов' });
    }
  },

  // Получение рецепта по ID с ингредиентами
  getById(req, res) {
    try {
      const db = getDB();
      const { id } = req.params;

      const recipe = db.prepare(`
        SELECT r.*, c.name as category_name, u.username as author_name
        FROM recipes r
        LEFT JOIN categories c ON r.category_id = c.id
        LEFT JOIN users u ON r.author_id = u.id
        WHERE r.id = ?
      `).get(id);

      if (!recipe) {
        return res.status(404).json({ error: 'Рецепт не найден' });
      }

      // Получение ингредиентов рецепта
      const ingredients = db.prepare(`
        SELECT ri.*, i.name, i.calories_per_100g, i.proteins_per_100g, i.fats_per_100g, i.carbs_per_100g
        FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = ?
      `).all(id);

      // Проверка в избранном
      let isFavorite = false;
      if (req.user) {
        const fav = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND recipe_id = ?')
          .get(req.user.id, id);
        isFavorite = !!fav;
      }

      res.json({ recipe: { ...recipe, ingredients, isFavorite } });
    } catch (err) {
      console.error('Get recipe error:', err);
      res.status(500).json({ error: 'Ошибка получения рецепта' });
    }
  },

  // Создание рецепта
  create(req, res) {
    try {
      const db = getDB();
      const { title, description, instructions, prep_time, cook_time, servings, 
              calories, proteins, fats, carbs, category_id, ingredients } = req.body;

      const result = db.prepare(`
        INSERT INTO recipes (title, description, instructions, prep_time, cook_time, 
                           servings, calories, proteins, fats, carbs, category_id, author_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(title, description || '', instructions, prep_time, cook_time, 
             servings || 4, calories, proteins, fats, carbs, category_id, req.user.id);

      // Добавление ингредиентов если переданы
      if (ingredients && ingredients.length > 0) {
        const insertIng = db.prepare(`
          INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit)
          VALUES (?, ?, ?, ?)
        `);
        for (const ing of ingredients) {
          insertIng.run(result.lastInsertRowid, ing.ingredient_id, ing.amount, ing.unit || 'г');
        }
      }

      res.status(201).json({
        message: 'Рецепт создан',
        recipe_id: result.lastInsertRowid
      });
    } catch (err) {
      console.error('Create recipe error:', err);
      res.status(500).json({ error: 'Ошибка создания рецепта' });
    }
  },

  // Обновление рецепта
  update(req, res) {
    try {
      const db = getDB();
      const { id } = req.params;

      // Проверка авторства
      const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id);
      if (!recipe) {
        return res.status(404).json({ error: 'Рецепт не найден' });
      }
      if (recipe.author_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Нет прав на редактирование' });
      }

      const allowedFields = ['title', 'description', 'instructions', 'prep_time', 'cook_time', 
                            'servings', 'calories', 'proteins', 'fats', 'carbs', 'category_id'];
      const updates = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      if (Object.keys(updates).length > 0) {
        const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);
        db.prepare(`UPDATE recipes SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
          .run(...values, id);
      }

      res.json({ message: 'Рецепт обновлён' });
    } catch (err) {
      console.error('Update recipe error:', err);
      res.status(500).json({ error: 'Ошибка обновления рецепта' });
    }
  },

  // Удаление рецепта
  remove(req, res) {
    try {
      const db = getDB();
      const { id } = req.params;

      const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id);
      if (!recipe) {
        return res.status(404).json({ error: 'Рецепт не найден' });
      }
      if (recipe.author_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Нет прав на удаление' });
      }

      db.prepare('DELETE FROM recipes WHERE id = ?').run(id);
      res.json({ message: 'Рецепт удалён' });
    } catch (err) {
      console.error('Delete recipe error:', err);
      res.status(500).json({ error: 'Ошибка удаления рецепта' });
    }
  },

  // Переключение избранного
  toggleFavorite(req, res) {
    try {
      const db = getDB();
      const { id } = req.params;
      const userId = req.user.id;

      const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND recipe_id = ?')
        .get(userId, id);

      if (existing) {
        db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id);
        res.json({ isFavorite: false, message: 'Удалено из избранного' });
      } else {
        db.prepare('INSERT INTO favorites (user_id, recipe_id) VALUES (?, ?)').run(userId, id);
        res.json({ isFavorite: true, message: 'Добавлено в избранное' });
      }
    } catch (err) {
      console.error('Toggle favorite error:', err);
      res.status(500).json({ error: 'Ошибка изменения избранного' });
    }
  },

  // Получение избранных рецептов
  getFavorites(req, res) {
    try {
      const db = getDB();
      const recipes = db.prepare(`
        SELECT r.* FROM recipes r
        JOIN favorites f ON r.id = f.recipe_id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC
      `).all(req.user.id);

      res.json({ recipes });
    } catch (err) {
      console.error('Get favorites error:', err);
      res.status(500).json({ error: 'Ошибка получения избранного' });
    }
  }
};

module.exports = recipeController;