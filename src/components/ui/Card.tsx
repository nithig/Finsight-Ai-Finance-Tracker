import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Card({ children, className = '', hover = false, onClick, style }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={cn(
        'bg-white rounded-2xl border border-gray-100/80 shadow-card',
        hover && 'hover:shadow-card-hover hover:border-gray-200/80 transition-all duration-300 cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

export function GlassCard({ children, className = '' }: CardProps) {
  return (
    <div className={cn('glass-card', className)}>
      {children}
    </div>
  );
}

interface GradientCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'brand' | 'dark' | 'blue' | 'purple';
}

export function GradientCard({ children, className = '', variant = 'brand' }: GradientCardProps) {
  const gradients = {
    brand: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700',
    dark: 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950',
    blue: 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700',
    purple: 'bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700',
  };

  return (
    <div className={cn('rounded-2xl text-white shadow-glass', gradients[variant], className)}>
      {children}
    </div>
  );
}
