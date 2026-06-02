import type { Category } from './database.types';

export const CATEGORIES: Category[] = ['Food', 'Transport', 'Bills', 'Shopping', 'Salary', 'Entertainment', 'Others'];

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#ef4444',
  Transport: '#f97316',
  Bills: '#eab308',
  Shopping: '#3b82f6',
  Salary: '#22c55e',
  Entertainment: '#ec4899',
  Others: '#8b5cf6',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  Food: '🍽️',
  Transport: '🚗',
  Bills: '📄',
  Shopping: '🛍️',
  Salary: '💰',
  Entertainment: '🎬',
  Others: '📦',
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactCurrency(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return formatCurrency(amount);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateShort(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthLabel(month: string): string {
  const [y, m] = month.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function getMonthDateRange(month: string): { startDate: string; endDate: string } {
  const [y, m] = month.split('-').map(Number);
  const startDate = new Date(y, m - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(y, m, 0).toISOString().split('T')[0];
  return { startDate, endDate };
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
