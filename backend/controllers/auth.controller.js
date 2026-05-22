const jwt = require('jsonwebtoken');
const { getDB } = require('../db');
const { hashPassword, comparePassword } = require('../utils/hash');

const authController = {
  // Регистрация нового пользователя
  async register(req, res) {
    try {
      const { username, email, password } = req.body;
      const db = getDB();

      // Проверка существования пользователя
      const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
      if (existing) {
        return res.status(409).json({ 
          error: 'Пользователь с таким email или именем уже существует' 
        });
      }

      const passwordHash = await hashPassword(password);

      const result = db.prepare(`
        INSERT INTO users (username, email, password_hash)
        VALUES (?, ?, ?)
      `).run(username, email, passwordHash);

      // Генерация токена
      const token = generateToken({ 
        id: result.lastInsertRowid, 
        username, 
        email, 
        role: 'user' 
      });

      res.status(201).json({
        message: 'Регистрация успешна',
        token,
        user: {
          id: result.lastInsertRowid,
          username,
          email,
          role: 'user'
        }
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Ошибка сервера при регистрации' });
    }
  },

  // Вход в систему
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const db = getDB();

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user) {
        return res.status(401).json({ error: 'Неверный email или пароль' });
      }

      const isValid = await comparePassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Неверный email или пароль' });
      }

      const token = generateToken({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      });

      res.json({
        message: 'Вход выполнен успешно',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          weight: user.weight,
          height: user.height,
          age: user.age,
          gender: user.gender,
          activity_level: user.activity_level,
          goal: user.goal,
          daily_calories: user.daily_calories
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
  },

  // Получение данных текущего пользователя
  me(req, res) {
    try {
      const db = getDB();
      const user = db.prepare(`
        SELECT id, username, email, role, weight, height, age, gender, 
               activity_level, goal, daily_calories, created_at
        FROM users WHERE id = ?
      `).get(req.user.id);

      if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      res.json({ user });
    } catch (err) {
      console.error('Me error:', err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  },

  // Обновление профиля
  updateProfile(req, res) {
    try {
      const db = getDB();
      const allowedFields = ['weight', 'height', 'age', 'gender', 'activity_level', 'goal'];
      const updates = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'Нет данных для обновления' });
      }

      // Расчёт дневных калорий
      if (updates.weight && updates.height && updates.age && updates.gender && updates.goal) {
        updates.daily_calories = calculateDailyCalories(
          updates.weight, updates.height, updates.age, 
          updates.gender, updates.activity_level || 'moderate', updates.goal
        );
      }

      const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = Object.values(updates);

      db.prepare(`UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(...values, req.user.id);

      const updated = db.prepare(`
        SELECT id, username, email, role, weight, height, age, 
               gender, activity_level, goal, daily_calories
        FROM users WHERE id = ?
      `).get(req.user.id);

      res.json({ message: 'Профиль обновлён', user: updated });
    } catch (err) {
      console.error('Update profile error:', err);
      res.status(500).json({ error: 'Ошибка обновления профиля' });
    }
  }
  
};

// Вспомогательные функции
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function calculateDailyCalories(weight, height, age, gender, activityLevel, goal) {
  // Формула Миффлина-Сан Жеора
  let bmr;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };

  let tdee = bmr * (activityMultipliers[activityLevel] || 1.55);

  const goalAdjustments = { lose: -500, maintain: 0, gain: 500 };
  tdee += goalAdjustments[goal] || 0;

  return Math.round(Math.max(1200, tdee));
}

module.exports = authController;