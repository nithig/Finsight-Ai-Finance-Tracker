import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';
import type { Transaction } from '../../lib/database.types';
import { formatCurrency } from '../../lib/utils';

interface SpendingLineChartProps {
  transactions: Transaction[];
}

export function SpendingLineChart({ transactions }: SpendingLineChartProps) {
  const debits = transactions.filter(t => t.type === 'debit');
  const byDay = debits.reduce<Record<string, number>>((acc, t) => {
    const day = new Date(t.date).getDate();
    const label = `${day}`;
    acc[label] = (acc[label] || 0) + Number(t.amount);
    return acc;
  }, {});

  const data = Object.entries(byDay)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([day, amount]) => ({ day: `Day ${day}`, amount }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white border border-gray-100 shadow-glass rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500 mb-0.5">{label}</p>
          <p className="text-sm font-bold text-gray-900">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <Card className="p-5 animate-fade-in">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Daily Spending Trend</h3>
        <p className="text-xs text-gray-400 mb-8">Day-by-day expenses this month</p>
        <div className="h-52 flex items-center justify-center">
          <p className="text-gray-400 text-sm">No expense data</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 animate-slide-up" style={{ animationDelay: '150ms' }}>
      <h3 className="text-sm font-semibold text-gray-700 mb-0.5">Daily Spending Trend</h3>
      <p className="text-xs text-gray-400 mb-4">Day-by-day expenses this month</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#spendingGradient)"
            dot={{ fill: '#10b981', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
