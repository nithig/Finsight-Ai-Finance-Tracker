import type { Category } from '../../lib/database.types';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../lib/utils';

interface BadgeProps {
  category: Category;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ category, size = 'sm' }: BadgeProps) {
  const color = CATEGORY_COLORS[category];
  const icon = CATEGORY_ICONS[category];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
      style={{ backgroundColor: `${color}12`, color }}
    >
      <span className="text-xs">{icon}</span>
      {category}
    </span>
  );
}

interface StatusBadgeProps {
  type: 'credit' | 'debit';
}

export function StatusBadge({ type }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        type === 'credit'
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-red-50 text-red-600'
      }`}
    >
      {type === 'credit' ? 'Income' : 'Expense'}
    </span>
  );
}
