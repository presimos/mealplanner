// components/NutritionChart.jsx - Графики питания
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { SHORT_DAYS } from '../utils/formatters';

const COLORS = ['#22c55e', '#3b82f6', '#f97316'];

export function WeeklyCaloriesChart({ data }) {
  return (
    <div className="card p-6">
      <h3 className="font-semibold mb-4">Калории по дням</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="calories" name="Калории" fill="#22c55e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MacronutrientsPie({ proteins, fats, carbs }) {
  const data = [
    { name: 'Белки', value: proteins, color: '#22c55e' },
    { name: 'Жиры', value: fats, color: '#f97316' },
    { name: 'Углеводы', value: carbs, color: '#3b82f6' },
  ];

  return (
    <div className="card p-6">
      <h3 className="font-semibold mb-4">Распределение БЖУ</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}г`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CalorieTrendChart({ data }) {
  return (
    <div className="card p-6">
      <h3 className="font-semibold mb-4">Тренд калорий</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="calories" name="Калории" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}