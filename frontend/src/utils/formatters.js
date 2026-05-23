// utils/formatters.js - Вспомогательные функции форматирования

/**
 * Форматирование калорий
 */
export function formatCalories(calories) {
  return `${calories} ккал`;
}

/**
 * Форматирование времени приготовления
 */
export function formatTime(minutes) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
  }
  return `${minutes} мин`;
}

/**
 * Форматирование БЖУ
 */
export function formatNutrition(proteins, fats, carbs) {
  return `Б: ${proteins}г · Ж: ${fats}г · У: ${carbs}г`;
}

/**
 * Дни недели
 */
export const DAYS_OF_WEEK = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

export const SHORT_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

/**
 * Типы приёмов пищи
 */
export const MEAL_TYPES = {
  breakfast: '🥞 Завтрак',
  lunch: '🍲 Обед',
  dinner: '🍽️ Ужин',
  snack: '🍎 Перекус'
};

/**
 * Форматирование даты
 */
export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Расчёт BMR
 */
export function calculateBMR(weight, height, age, gender) {
  if (gender === 'male') {
    return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  }
  return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
}