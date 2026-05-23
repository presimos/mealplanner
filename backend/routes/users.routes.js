const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const userController = require('../controllers/user.controller');

const router = express.Router();

// Получение всех пользователей (админ)
router.get('/', auth, adminOnly, userController.getAll);

// Получение статистики
router.get('/stats', auth, adminOnly, userController.getStats);

module.exports = router;