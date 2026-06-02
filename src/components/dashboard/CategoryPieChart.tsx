import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';
import type { Transaction, Category } from '../../lib/database.types';
import { CATEGORY_COLORS, CATEGORY_ICONS, formatCurrency } from '../../lib/utils';

interface CategoryPieChartProps {
  transactions: Transaction[];
}

export function CategoryPieChart({ transactions }: CategoryPieChartProps) {
  const debits = transactions.filter(t => t.type === 'debit');
  const byCategory = debits.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
    return acc;
  }, {});

  const total = Object.values(byCategory).reduce((a, b) => a + b, 0);

  const data = Object.entries(byCategory)
    .map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
    }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <Card className="p-5 animate-fade-in">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Spending by Category</h3>
        <p className="text-xs text-gray-400 mb-8">This month's breakdown</p>
        <div className="h-52 flex items-center justify-center">
          <p className="text-gray-400 text-sm">No expense data</p>
        </div>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const item = payload[0];
      return (
        <div className="bg-white border border-gray-100 shadow-glass rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{CATEGORY_ICONS[item.name as Category] || '📦'}</span>
            <span className="text-sm font-semibold text-gray-900">{item.name}</span>
          </div>
          <p className="text-sm font-bold text-gray-900">{formatCurrency(item.value)}</p>
          <p className="text-xs text-gray-500">{((item.value / total) * 100).toFixed(1)}% of spending</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-5 animate-slide-up" style={{ animationDelay: '100ms' }}>
      <h3 className="text-sm font-semibold text-gray-700 mb-0.5">Spending by Category</h3>
      <p className="text-xs text-gray-400 mb-4">This month's breakdown</p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-full sm:w-1/2">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={CATEGORY_COLORS[entry.name as Category] || '#8b5cf6'}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="w-full sm:w-1/2 space-y-2">
          {data.slice(0, 5).map((item) => (
            <div key={item.name} className="flex items-center justify-between group">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[item.name as Category] || '#8b5cf6' }}
                />
                <span className="text-xs text-gray-600 truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-900">{item.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
