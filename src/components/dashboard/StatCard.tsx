import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  iconBg: string;
  trend?: { value: number; label: string };
  valueColor?: string;
  delay?: number;
}

export function StatCard({ label, value, icon, iconBg, trend, valueColor = 'text-gray-900', delay = 0 }: StatCardProps) {
  return (
    <div
      className="relative bg-white rounded-2xl border border-gray-100/80 shadow-card hover:shadow-card-hover p-5 transition-all duration-300 group animate-slide-up overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/0 to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
            {icon}
          </div>
        </div>
        <p className={cn('text-2xl sm:text-3xl font-bold tabular-nums tracking-tight', valueColor)}>
          {formatCurrency(value)}
        </p>
        {trend && (
          <div className="flex items-center gap-1.5 mt-3">
            {trend.value >= 0
              ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
            <span className={cn('text-xs font-semibold', trend.value >= 0 ? 'text-emerald-600' : 'text-red-500')}>
              {trend.value >= 0 ? '+' : ''}{Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-gray-400">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
