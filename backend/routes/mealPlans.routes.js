const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { auth } = require('../middleware/auth');
const mealPlanController = require('../controllers/mealPlan.controller');

const router = express.Router();

// Все планы пользователя
router.get('/', auth, mealPlanController.getAll);

// Получение одного плана
router.get('/:id', auth, mealPlanController.getById);

// Генерация плана питания
router.post('/generate', auth, [
  body('days').optional().isInt({ min: 1, max: 14 }),
  body('calories_per_day').optional().isInt({ min: 1000, max: 5000 }),
  validate
], mealPlanController.generate);

// Обновление приёма пищи в плане
router.put('/:planId/meals/:mealId', auth, [
  body('recipe_id').optional().isInt(),
  body('servings').optional().isInt({ min: 1, max: 10 }),
  validate
], mealPlanController.updateMeal);

// Получение списка покупок для плана
router.get('/:id/shopping-list', auth, mealPlanController.getShoppingList);

// Экспорт списка покупок
router.get('/:id/shopping-list/export', auth, mealPlanController.exportShoppingList);

module.exports = router;