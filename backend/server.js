const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Загрузка переменных окружения
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const authRoutes = require('./routes/auth.routes');
const recipeRoutes = require('./routes/recipes.routes');
const mealPlanRoutes = require('./routes/mealPlans.routes');
const userRoutes = require('./routes/users.routes');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Инициализация БД при запуске
initDB();

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/meal-plans', mealPlanRoutes);
app.use('/api/users', userRoutes);

// Корневой маршрут для проверки
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Внутренняя ошибка сервера',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📊 Режим: ${process.env.NODE_ENV || 'development'}`);
});