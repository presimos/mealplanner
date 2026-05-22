const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { auth } = require('../middleware/auth');
const authController = require('../controllers/auth.controller');

const router = express.Router();

// Регистрация
router.post('/register', [
  body('username')
    .isString().trim()
    .isLength({ min: 3, max: 30 }).withMessage('Имя пользователя должно быть от 3 до 30 символов'),
  body('email')
    .isEmail().normalizeEmail().withMessage('Некорректный email'),
  body('password')
    .isLength({ min: 6 }).withMessage('Пароль должен быть не менее 6 символов'),
  validate
], authController.register);

// Вход
router.post('/login', [
  body('email')
    .isEmail().normalizeEmail().withMessage('Некорректный email'),
  body('password')
    .notEmpty().withMessage('Пароль обязателен'),
  validate
], authController.login);

// Текущий пользователь
router.get('/me', auth, authController.me);

// Обновление профиля
router.put('/profile', auth, [
  body('weight').optional().isFloat({ min: 30, max: 250 }),
  body('height').optional().isFloat({ min: 100, max: 250 }),
  body('age').optional().isInt({ min: 1, max: 120 }),
  body('goal').optional().isIn(['lose', 'maintain', 'gain']),
  validate
], authController.updateProfile);

module.exports = router;