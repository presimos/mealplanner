const express = require('express');
const { body, query } = require('express-validator');
const { validate } = require('../middleware/validation');
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');
const recipeController = require('../controllers/recipe.controller');

const router = express.Router();

// Получение списка рецептов (публичный, с фильтрацией)
router.get('/', optionalAuth, [
  query('search').optional().isString(),
  query('category').optional().isInt(),
  query('minCalories').optional().isInt(),
  query('maxCalories').optional().isInt(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate
], recipeController.getAll);

// Получение рецепта по ID
router.get('/:id', optionalAuth, recipeController.getById);

// Создание рецепта
router.post('/', auth, [
  body('title').isString().trim().isLength({ min: 2, max: 200 }).withMessage('Название от 2 до 200 символов'),
  body('description').optional().isString(),
  body('instructions').isString().trim().isLength({ min: 5 }).withMessage('Инструкция минимум 5 символов'),
  body('prep_time').optional().isInt({ min: 0 }),
  body('cook_time').optional().isInt({ min: 0 }),
  body('servings').optional().isInt({ min: 1 }),
  body('calories').isInt({ min: 1 }).withMessage('Укажите калории'),
  body('proteins').optional().isFloat({ min: 0 }),
  body('fats').optional().isFloat({ min: 0 }),
  body('carbs').optional().isFloat({ min: 0 }),
  body('category_id').optional().isInt(),
  body('ingredients').optional().isArray(),
  validate
], recipeController.create);

// Обновление рецепта
router.put('/:id', auth, [
  body('title').optional().isString().trim().isLength({ min: 3, max: 200 }),
  body('instructions').optional().isString().trim(),
  body('calories').optional().isInt({ min: 1 }),
  validate
], recipeController.update);

// Удаление рецепта
router.delete('/:id', auth, recipeController.remove);

// Переключение избранного
router.post('/:id/favorite', auth, recipeController.toggleFavorite);

// Получение избранных рецептов
router.get('/favorites/list', auth, recipeController.getFavorites);

module.exports = router;