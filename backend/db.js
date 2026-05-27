const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'database.sqlite');

let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    console.log('📦 Подключение к SQLite установлено');
  }
  return db;
}

function initDB() {
  const database = getDB();
  
  // Создание таблиц
  database.exec(`
    -- Пользователи
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      weight REAL,
      height REAL,
      age INTEGER,
      gender TEXT CHECK(gender IN ('male', 'female', 'other')),
      activity_level TEXT DEFAULT 'moderate' CHECK(activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
      goal TEXT DEFAULT 'maintain' CHECK(goal IN ('lose', 'maintain', 'gain')),
      daily_calories INTEGER DEFAULT 2000,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Категории рецептов
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT
    );

    -- Рецепты
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      instructions TEXT NOT NULL,
      prep_time INTEGER NOT NULL,
      cook_time INTEGER NOT NULL,
      servings INTEGER DEFAULT 4,
      calories INTEGER NOT NULL,
      proteins REAL NOT NULL,
      fats REAL NOT NULL,
      carbs REAL NOT NULL,
      image_url TEXT,
      category_id INTEGER,
      author_id INTEGER,
      is_public BOOLEAN DEFAULT 1,
      is_approved BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Ингредиенты
    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      category TEXT,
      calories_per_100g REAL,
      proteins_per_100g REAL,
      fats_per_100g REAL,
      carbs_per_100g REAL
    );

    -- Ингредиенты в рецептах (M:N)
    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      ingredient_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'г',
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
      FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
    );

    -- Планы питания
    CREATE TABLE IF NOT EXISTS meal_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_calories INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Приёмы пищи в плане
    CREATE TABLE IF NOT EXISTS plan_meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      recipe_id INTEGER,
      day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
      meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
      servings INTEGER DEFAULT 1,
      FOREIGN KEY (plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE SET NULL
    );

    -- Список покупок
    CREATE TABLE IF NOT EXISTS shopping_lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_completed BOOLEAN DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES meal_plans(id) ON DELETE SET NULL
    );

    -- Элементы списка покупок
    CREATE TABLE IF NOT EXISTS shopping_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      list_id INTEGER NOT NULL,
      ingredient_name TEXT NOT NULL,
      amount REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'г',
      is_purchased BOOLEAN DEFAULT 0,
      FOREIGN KEY (list_id) REFERENCES shopping_lists(id) ON DELETE CASCADE
    );

    -- Избранные рецепты
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      recipe_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
      UNIQUE(user_id, recipe_id)
    );

    -- Индексы для оптимизации
    CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category_id);
    CREATE INDEX IF NOT EXISTS idx_recipes_author ON recipes(author_id);
    CREATE INDEX IF NOT EXISTS idx_recipes_calories ON recipes(calories);
    CREATE INDEX IF NOT EXISTS idx_meal_plans_user ON meal_plans(user_id);
    CREATE INDEX IF NOT EXISTS idx_plan_meals_plan ON plan_meals(plan_id);
    CREATE INDEX IF NOT EXISTS idx_shopping_lists_user ON shopping_lists(user_id);
    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
  `);

  // Добавление тестовых данных, если БД пустая
  const userCount = database.prepare('SELECT COUNT(*) as count FROM users').get();
  
  if (userCount.count === 0) {
    console.log('📝 Добавление тестовых данных...');
    seedDatabase(database);
  }
  
  console.log('✅ База данных готова');
}

function seedDatabase(database) {
  // Создание пользователей
  const adminHash = bcrypt.hashSync('admin123', 10);
  const userHash = bcrypt.hashSync('user123', 10);
  
  const insertUser = database.prepare(`
    INSERT INTO users (username, email, password_hash, role, weight, height, age, gender, activity_level, goal, daily_calories)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('admin', 'admin@mealplanner.com', adminHash, 'admin', 75, 180, 30, 'male', 'active', 'maintain', 2500);
  insertUser.run('anna_fitness', 'anna@example.com', userHash, 'user', 62, 165, 28, 'female', 'active', 'lose', 1800);
  insertUser.run('max_cook', 'max@example.com', userHash, 'user', 80, 175, 35, 'male', 'moderate', 'maintain', 2200);
  insertUser.run('olga_vegan', 'olga@example.com', userHash, 'user', 55, 160, 24, 'female', 'light', 'maintain', 1700);
  insertUser.run('dima_sport', 'dima@example.com', userHash, 'user', 90, 185, 27, 'male', 'very_active', 'gain', 3200);

  // Категории
  const insertCategory = database.prepare('INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)');
  insertCategory.run('Завтраки', 'Блюда для начала дня', '🌅');
  insertCategory.run('Супы', 'Первые блюда', '🍲');
  insertCategory.run('Салаты', 'Лёгкие и полезные', '🥗');
  insertCategory.run('Основные блюда', 'Горячие блюда', '🍖');
  insertCategory.run('Гарниры', 'Дополнение к основному', '🍚');
  insertCategory.run('Десерты', 'Сладкое', '🍰');
  insertCategory.run('Напитки', 'Смузи и коктейли', '🥤');

  // Ингредиенты (10+ записей)
  const ingredients = [
    ['Куриная грудка', 'мясо', 165, 31, 3.6, 0],
    ['Рис', 'крупы', 130, 2.7, 0.3, 28],
    ['Помидоры', 'овощи', 18, 0.9, 0.2, 3.9],
    ['Огурцы', 'овощи', 15, 0.7, 0.1, 2.8],
    ['Оливковое масло', 'масла', 884, 0, 100, 0],
    ['Яйца', 'молочное', 155, 13, 11, 1.1],
    ['Молоко', 'молочное', 42, 3.4, 1, 5],
    ['Овсянка', 'крупы', 68, 2.5, 1.5, 12],
    ['Лосось', 'рыба', 208, 20, 13, 0],
    ['Брокколи', 'овощи', 34, 2.8, 0.4, 7],
    ['Гречка', 'крупы', 343, 13.3, 3.4, 72],
    ['Творог', 'молочное', 110, 18, 4.5, 3],
    ['Бананы', 'фрукты', 89, 1.1, 0.3, 23],
    ['Авокадо', 'фрукты', 160, 2, 15, 9],
    ['Куриное филе бедра', 'мясо', 185, 21, 11, 0]
  ];

  const insertIngredient = database.prepare(`
    INSERT INTO ingredients (name, category, calories_per_100g, proteins_per_100g, fats_per_100g, carbs_per_100g)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  for (const ing of ingredients) {
    insertIngredient.run(...ing);
  }

  // Рецепты (10+ записей)
  const recipes = [
    ['Овсяная каша с бананом', 'Классический завтрак', '1. Залейте овсянку молоком. 2. Варите 5 минут. 3. Добавьте нарезанный банан.', 5, 10, 1, 350, 10, 8, 60, 'https://img.iamcook.ru/2021/upl/recipes/zen/u-58170b86eea1f226fdbf4a538de546bf.JPG', 1, 5, 1, 1],
    ['Куриный суп с овощами', 'Лёгкий и полезный суп', '1. Отварите курицу. 2. Добавьте овощи. 3. Варите 20 минут.', 10, 30, 4, 280, 25, 6, 30, 'https://img.inmyroom.ru/inmyroom/thumb/620x398/jpg:85/uploads/food_recipe/teaser/9c/9cc2/jpg_1000_9cc29f46-312d-48d5-b041-c81a860cdb26.jpg?sign=5451a18582ced4f2a6179ff9ad9b38fe050498dcf68def8603041dde340c42d4', 2, 5, 1, 1],
    ['Салат Цезарь', 'Классический рецепт', '1. Обжарьте курицу. 2. Нарвите салат. 3. Смешайте с соусом.', 15, 10, 2, 420, 32, 24, 18, 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400', 3, 5, 1, 1],
    ['Запечённый лосось', 'Полезный ужин', '1. Замаринуйте лосося. 2. Запекайте 20 минут при 180°C.', 10, 20, 2, 450, 35, 25, 5, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400', 4, 5, 1, 1],
    ['Гречка с грибами', 'Сытный гарнир', '1. Отварите гречку. 2. Обжарьте грибы. 3. Смешайте.', 5, 25, 4, 320, 12, 5, 60, 'https://gipfel.ru/upload/iblock/6a3/0h4yv2q51p0y6md8a1w4c5zjfsuc3dod.jpg', 5, 5, 1, 1],
    ['Творожная запеканка', 'ПП десерт', '1. Смешайте творог с яйцом. 2. Запекайте 30 минут.', 10, 30, 6, 250, 20, 8, 30, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400', 6, 5, 1, 1],
    ['Смузи боул', 'Яркий завтрак', '1. Взбейте банан с ягодами. 2. Украсьте гранолой.', 10, 0, 2, 380, 8, 12, 65, 'https://menunedeli.ru/wp-content/uploads/2021/07/Smuzi-boul-s-persikami-i-yagodami-500x350-1000x667.jpg', 1, 5, 1, 1],
    ['Курица с брокколи', 'Фитнес-ужин', '1. Обжарьте курицу. 2. Приготовьте брокколи на пару.', 10, 20, 2, 380, 40, 14, 20, 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400', 4, 5, 1, 1],
    ['Рис с овощами', 'Веганский ужин', '1. Отварите рис. 2. Обжарьте овощи. 3. Смешайте с соевым соусом.', 10, 20, 3, 350, 8, 4, 70, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', 5, 5, 1, 1],
    ['Омлет с помидорами', 'Быстрый завтрак', '1. Взбейте яйца. 2. Добавьте помидоры. 3. Жарьте 5 минут.', 3, 10, 1, 280, 18, 18, 5, 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400', 1, 5, 1, 1],
    ['Авокадо тост', 'Трендовый завтрак', '1. Поджарьте хлеб. 2. Разомните авокадо. 3. Добавьте специи.', 5, 5, 1, 320, 7, 18, 35, 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400', 1, 5, 1, 1],
    ['Тыквенный крем-суп', 'Осенний согревающий суп', '1. Запеките тыкву. 2. Взбейте блендером со сливками.', 15, 40, 4, 210, 5, 8, 30, 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=400', 2, 5, 1, 1]
  ];

  const insertRecipe = database.prepare(`
    INSERT INTO recipes (title, description, instructions, prep_time, cook_time, servings, calories, proteins, fats, carbs, image_url, category_id, author_id, is_public, is_approved)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const recipe of recipes) {
    insertRecipe.run(...recipe);
  }

  // Связи рецептов с ингредиентами
  const recipeIngredients = [
    [1, 8, 50, 'г'], [1, 6, 200, 'мл'], [1, 13, 1, 'шт'],
    [2, 1, 200, 'г'], [2, 3, 1, 'шт'], [2, 10, 100, 'г'],
    [3, 1, 150, 'г'], [3, 3, 1, 'шт'], [3, 5, 15, 'мл'],
    [4, 9, 200, 'г'], [4, 5, 10, 'мл'],
    [5, 11, 100, 'г'], [5, 5, 10, 'мл'],
    [6, 12, 300, 'г'], [6, 6, 2, 'шт'],
    [7, 13, 2, 'шт'], [7, 6, 100, 'мл'],
    [8, 1, 200, 'г'], [8, 10, 150, 'г'],
    [9, 2, 100, 'г'], [9, 3, 1, 'шт'], [9, 4, 1, 'шт'],
    [10, 6, 3, 'шт'], [10, 3, 1, 'шт'],
    [11, 14, 1, 'шт'],
    [12, 3, 2, 'шт'], [12, 5, 15, 'мл']
  ];

  const insertRI = database.prepare(`
    INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit)
    VALUES (?, ?, ?, ?)
  `);
  
  for (const ri of recipeIngredients) {
    insertRI.run(...ri);
  }

  // Пример плана питания
  const plan = database.prepare(`
    INSERT INTO meal_plans (user_id, name, start_date, end_date, total_calories)
    VALUES (2, 'План на неделю - Фитнес', '2024-12-02', '2024-12-08', 12600)
  `).run();

  // Приёмы пищи в плане
  const meals = [
    [plan.lastInsertRowid, 1, 0, 'breakfast', 1],
    [plan.lastInsertRowid, 3, 0, 'lunch', 1],
    [plan.lastInsertRowid, 4, 0, 'dinner', 1],
    [plan.lastInsertRowid, 10, 1, 'breakfast', 1],
    [plan.lastInsertRowid, 2, 1, 'lunch', 1],
    [plan.lastInsertRowid, 8, 1, 'dinner', 1],
    [plan.lastInsertRowid, 7, 2, 'breakfast', 1],
    [plan.lastInsertRowid, 12, 2, 'lunch', 1],
    [plan.lastInsertRowid, 6, 2, 'dinner', 1]
  ];

  const insertMeal = database.prepare(`
    INSERT INTO plan_meals (plan_id, recipe_id, day_of_week, meal_type, servings)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  for (const meal of meals) {
    insertMeal.run(...meal);
  }

  console.log('✅ Тестовые данные добавлены');
}

function closeDB() {
  if (db) {
    db.close();
    console.log('📦 Соединение с БД закрыто');
  }
}

module.exports = { getDB, initDB, closeDB };