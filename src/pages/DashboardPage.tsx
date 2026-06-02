import { useEffect, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { StatCard } from '../components/dashboard/StatCard';
import { CategoryPieChart } from '../components/dashboard/CategoryPieChart';
import { SpendingLineChart } from '../components/dashboard/SpendingLineChart';
import { useTransactions } from '../hooks/useTransactions';
import { getCurrentMonth, getMonthLabel, formatCurrency, formatDateShort, CATEGORY_ICONS, getGreeting } from '../lib/utils';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Upload, Plus, Sparkles } from 'lucide-react';
import { StatCardSkeleton, ChartSkeleton, TransactionSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Card, GradientCard } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '../lib/router';
import type { Category } from '../lib/database.types';

export function DashboardPage() {
  const month = getCurrentMonth();
  const { transactions, loading } = useTransactions(month);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0 });

  useEffect(() => {
    const income = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    setStats({ income, expense, balance: income - expense });
  }, [transactions]);

  const recent = transactions.slice(0, 6);
  const hasData = transactions.length > 0;

  return (
    <AppLayout title={`${getGreeting()}, ${user?.name?.split(' ')[0] || 'there'}`} subtitle={getMonthLabel(month)}>
      <div className="space-y-6 max-w-7xl page-enter">

        {/* Monthly Summary Hero Card */}
        {!loading && hasData && (
          <GradientCard variant="brand" className="p-6 sm:p-8 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-1">Total Balance</p>
                <p className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight">
                  {formatCurrency(stats.balance)}
                </p>
                <p className="text-emerald-200/60 text-sm mt-2">{getMonthLabel(month)}</p>
              </div>
              <div className="flex gap-4 sm:gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4 text-emerald-200" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-200/60">Income</p>
                    <p className="text-sm font-bold text-white tabular-nums">{formatCurrency(stats.income)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <ArrowDownRight className="w-4 h-4 text-red-300" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-200/60">Expenses</p>
                    <p className="text-sm font-bold text-white tabular-nums">{formatCurrency(stats.expense)}</p>
                  </div>
                </div>
              </div>
            </div>
          </GradientCard>
        )}

        {/* Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        ) : !hasData ? null : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Total Balance"
              value={stats.balance}
              icon={<Wallet className="w-5 h-5 text-emerald-600" />}
              iconBg="bg-emerald-50"
              valueColor={stats.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}
              delay={0}
            />
            <StatCard
              label="Monthly Income"
              value={stats.income}
              icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
              iconBg="bg-blue-50"
              delay={50}
            />
            <StatCard
              label="Monthly Expense"
              value={stats.expense}
              icon={<TrendingDown className="w-5 h-5 text-orange-600" />}
              iconBg="bg-orange-50"
              delay={100}
            />
          </div>
        )}

        {/* Empty State / Onboarding */}
        {!loading && !hasData && (
          <EmptyState
            icon={<Sparkles className="w-7 h-7 text-emerald-500" />}
            title="Welcome to Finsight!"
            description="Upload your first transactions or add them manually to unlock AI-powered spending insights and beautiful analytics."
            action={
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate('/transactions')}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Transaction
                </button>
                <button
                  onClick={() => navigate('/transactions')}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-all"
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </button>
              </div>
            }
          />
        )}

        {/* Charts */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        ) : hasData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SpendingLineChart transactions={transactions} />
            <CategoryPieChart transactions={transactions} />
          </div>
        ) : null}

        {/* Recent Transactions */}
        {loading ? (
          <Card>
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="shimmer h-5 w-40 rounded-lg" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <TransactionSkeleton key={i} />
            ))}
          </Card>
        ) : hasData ? (
          <Card className="overflow-hidden animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="px-5 py-4 border-b border-gray-100/80 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Recent Transactions</h3>
              <button
                onClick={() => navigate('/transactions')}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                View all →
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {recent.map(t => (
                <div
                  key={t._id}
                  className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-sm flex-shrink-0">
                    {CATEGORY_ICONS[t.category as Category] || '📦'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{formatDateShort(t.date)}</span>
                      <span className="text-gray-200">·</span>
                      <span className="text-xs text-gray-400">{t.category}</span>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold whitespace-nowrap tabular-nums ${
                    t.type === 'credit' ? 'text-emerald-600' : 'text-gray-900'
                  }`}>
                    {t.type === 'credit' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    </AppLayout>
  );
}
