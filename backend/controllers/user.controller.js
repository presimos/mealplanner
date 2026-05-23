const { getDB } = require('../db');

const userController = {
  // Получение всех пользователей (админ)
  getAll(req, res) {
    try {
      const db = getDB();
      const users = db.prepare(`
        SELECT id, username, email, role, weight, height, age, gender, 
               activity_level, goal, daily_calories, created_at
        FROM users
        ORDER BY created_at DESC
      `).all();

      res.json({ users, total: users.length });
    } catch (err) {
      console.error('Get users error:', err);
      res.status(500).json({ error: 'Ошибка получения пользователей' });
    }
  },

  // Получение статистики платформы
  getStats(req, res) {
    try {
      const db = getDB();
      
      const stats = {
        totalUsers: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
        totalRecipes: db.prepare('SELECT COUNT(*) as count FROM recipes').get().count,
        totalPlans: db.prepare('SELECT COUNT(*) as count FROM meal_plans').get().count,
        totalFavorites: db.prepare('SELECT COUNT(*) as count FROM favorites').get().count,
        popularCategories: db.prepare(`
          SELECT c.name, COUNT(r.id) as recipe_count
          FROM categories c
          LEFT JOIN recipes r ON c.id = r.category_id
          GROUP BY c.id
          ORDER BY recipe_count DESC
        `).all(),
        avgCalories: db.prepare('SELECT ROUND(AVG(calories)) as avg FROM recipes').get().avg
      };

      res.json({ stats });
    } catch (err) {
      console.error('Get stats error:', err);
      res.status(500).json({ error: 'Ошибка получения статистики' });
    }
  }
};

module.exports = userController;