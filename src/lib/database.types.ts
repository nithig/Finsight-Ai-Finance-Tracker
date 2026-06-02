export type Category = 'Food' | 'Transport' | 'Bills' | 'Shopping' | 'Salary' | 'Entertainment' | 'Others';
export type TransactionType = 'credit' | 'debit';

export interface User {
  id: string;
  name: string;
  email: string;
  subscriptionPlan?: string;
}

export interface Transaction {
  _id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  category: Category;
  description: string;
  merchant: string;
  date: string;
  notes?: string;
  tags?: string[];
  isRecurring?: boolean;
  aiCategorized?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionInput {
  amount: number;
  type: TransactionType;
  category?: Category;
  description: string;
  merchant?: string;
  date?: string;
  notes?: string;
}

export interface AiInsights {
  summary: string;
  topCategory: string;
  topCategoryPercent: number;
  tips: string[];
}

export interface CategoryBreakdownItem {
  category: Category;
  total: number;
  count: number;
  percentage: number;
}

export interface TransactionStats {
  summary: {
    income: number;
    expenses: number;
    balance: number;
    transactionCount: number;
  };
  byCategory: Array<{ _id: Category; total: number }>;
  byDay: Array<{ _id: string; total: number; count: number }>;
}
