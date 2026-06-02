import { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { useTransactions } from '../hooks/useTransactions';
import { getCurrentMonth, getMonthLabel, formatCurrency, getMonthDateRange, CATEGORY_ICONS } from '../lib/utils';
import { Lightbulb, Brain, RefreshCw, Sparkles, PiggyBank, Target } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { InsightSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { apiClient } from '../lib/apiClient';
import type { AiInsights, Category } from '../lib/database.types';

export function InsightsPage() {
  const month = getCurrentMonth();
  const { transactions, loading: txLoading } = useTransactions(month);
  const [insights, setInsights] = useState<AiInsights | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useAI] = useState(true);

  // Compute local insights as fallback
  const computeLocalInsights = useCallback((): AiInsights | null => {
    if (transactions.length === 0) return null;

    const debits = transactions.filter(t => t.type === 'debit');
    const byCategory = debits.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {});

    const totalSpent = Object.values(byCategory).reduce((a, b) => a + b, 0);
    const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    const topCategory = sorted[0];
    const topPercent = topCategory ? Math.round((topCategory[1] / totalSpent) * 100) : 0;

    return {
      summary: `You spent ${formatCurrency(totalSpent)} this month across ${sorted.length} categories. ${
        debits.length > 20 ? 'You had a high volume of transactions.' : `You made ${debits.length} expense transactions.`
      }`,
      topCategory: topCategory?.[0] || 'N/A',
      topCategoryPercent: topPercent,
      tips: [
        topPercent > 30
          ? `Your ${topCategory?.[0]?.toLowerCase()} spending accounts for ${topPercent}% of expenses. Consider reducing by 15% to save ${formatCurrency((topCategory?.[1] || 0) * 0.15)}/month.`
          : 'Your spending is well-distributed across categories. Great job!',
        debits.length > 15
          ? `You made ${debits.length} expense transactions. Try consolidating frequent small purchases to reduce spending.`
          : 'Track your expenses consistently to build better financial habits.',
      ],
    };
  }, [transactions]);

  // Try AI insights first, fall back to local
  const generateInsights = useCallback(async () => {
    if (transactions.length === 0) return;

    setGenerating(true);
    setError(null);

    if (useAI) {
      try {
        const { startDate, endDate } = getMonthDateRange(month);
        const response = await apiClient.getInsights(startDate, endDate);
        if (response.success && response.insights) {
          setInsights(response.insights);
          setGenerating(false);
          return;
        }
      } catch (err: any) {
        console.warn('AI insights unavailable, using local analysis:', err.message);
        setError('AI insights unavailable — showing local analysis');
      }
    }

    // Fallback to local insights
    const local = computeLocalInsights();
    if (local) setInsights(local);
    setGenerating(false);
  }, [transactions, month, useAI, computeLocalInsights]);

  useEffect(() => {
    if (!txLoading && transactions.length > 0 && !insights) {
      generateInsights();
    }
  }, [txLoading, transactions.length]);

  const loading = txLoading || generating;
  const hasTransactions = transactions.length > 0;

  return (
    <AppLayout title="AI Insights" subtitle={`Smart analysis for ${getMonthLabel(month)}`}>
      <div className="space-y-5 max-w-3xl page-enter">

        {/* Refresh Bar */}
        {hasTransactions && !loading && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {error ? (
                <span className="text-amber-600">{error}</span>
              ) : (
                `Analysis based on ${transactions.length} transactions`
              )}
            </p>
            <button
              onClick={() => { setInsights(null); generateInsights(); }}
              disabled={generating}
              className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            <InsightSkeleton />
            <InsightSkeleton />
            <InsightSkeleton />
          </div>
        )}

        {/* Empty State */}
        {!loading && !hasTransactions && (
          <EmptyState
            icon={<Brain className="w-7 h-7 text-purple-500" />}
            title="No data to analyze"
            description="Add some transactions to unlock AI-powered spending insights, smart categorization, and personalized saving suggestions."
          />
        )}

        {/* Insights Content */}
        {!loading && insights && (
          <div className="space-y-4 animate-fade-in">

            {/* Monthly Summary */}
            <Card className="p-6 border-emerald-100/50 bg-gradient-to-br from-emerald-50/30 to-white">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1.5">Monthly Summary</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{insights.summary}</p>
                </div>
              </div>
            </Card>

            {/* Top Spending Category */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 mb-1.5">Top Spending Category</h3>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{CATEGORY_ICONS[insights.topCategory as Category] || '📊'}</span>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{insights.topCategory}</p>
                      {insights.topCategoryPercent > 0 && (
                        <p className="text-sm text-gray-500">{insights.topCategoryPercent}% of total spending</p>
                      )}
                    </div>
                  </div>
                  {/* Progress bar */}
                  {insights.topCategoryPercent > 0 && (
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-3">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(insights.topCategoryPercent, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Saving Tips */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-gray-900">Smart Saving Tips</h3>
              </div>
              {insights.tips.map((tip, idx) => (
                <Card key={idx} className="p-5 hover:shadow-card-hover transition-all duration-300 group">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Lightbulb className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* AI Powered Badge */}
            <div className="flex items-center justify-center pt-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Powered by Google Gemini AI</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
