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
    activity_level TEXT DEFAULT 'moderate',
    goal TEXT DEFAULT 'maintain',
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

-- Связь рецептов и ингредиентов (M:N)
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

-- Приёмы пищи
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

-- Списки покупок
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

-- Избранное
CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    recipe_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    UNIQUE(user_id, recipe_id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category_id);
CREATE INDEX IF NOT EXISTS idx_recipes_calories ON recipes(calories);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_meals_plan ON plan_meals(plan_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- Примеры SQL-запросов

-- 1. Получение плана питания на неделю с рецептами
SELECT 
    pm.day_of_week,
    pm.meal_type,
    r.title,
    r.calories,
    r.proteins,
    r.fats,
    r.carbs
FROM plan_meals pm
JOIN recipes r ON pm.recipe_id = r.id
WHERE pm.plan_id = 1
ORDER BY pm.day_of_week, 
    CASE pm.meal_type 
        WHEN 'breakfast' THEN 1 
        WHEN 'lunch' THEN 2 
        WHEN 'dinner' THEN 3 
        WHEN 'snack' THEN 4 
    END;

-- 2. Поиск рецептов по ингредиенту
SELECT DISTINCT r.*
FROM recipes r
JOIN recipe_ingredients ri ON r.id = ri.recipe_id
JOIN ingredients i ON ri.ingredient_id = i.id
WHERE i.name LIKE '%куриц%';

-- 3. Статистика калорий пользователя по дням
SELECT 
    mp.start_date,
    pm.day_of_week,
    SUM(r.calories * pm.servings) as day_calories,
    SUM(r.proteins * pm.servings) as day_proteins,
    SUM(r.fats * pm.servings) as day_fats,
    SUM(r.carbs * pm.servings) as day_carbs
FROM meal_plans mp
JOIN plan_meals pm ON mp.id = pm.plan_id
JOIN recipes r ON pm.recipe_id = r.id
WHERE mp.user_id = 2
GROUP BY mp.id, pm.day_of_week;

-- 4. Список покупок с агрегацией
SELECT 
    si.ingredient_name,
    SUM(si.amount) as total_amount,
    si.unit
FROM shopping_lists sl
JOIN shopping_items si ON sl.id = si.list_id
WHERE sl.user_id = 2 AND sl.is_completed = 0
GROUP BY si.ingredient_name, si.unit
ORDER BY si.ingredient_name;

-- 5. Топ рецептов по добавлению в избранное
SELECT 
    r.title,
    COUNT(f.id) as favorite_count,
    r.calories,
    r.proteins
FROM recipes r
LEFT JOIN favorites f ON r.id = f.recipe_id
GROUP BY r.id
ORDER BY favorite_count DESC
LIMIT 10;