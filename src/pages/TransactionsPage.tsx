import { useState, FormEvent, useRef } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { useTransactions } from '../hooks/useTransactions';
import { getCurrentMonth, getMonthLabel, formatCurrency, formatDateShort, CATEGORIES, CATEGORY_ICONS, cn } from '../lib/utils';
import { Upload, Plus, Trash2, X, FileText, CheckCircle, AlertCircle, Search, Filter } from 'lucide-react';
import { CategoryBadge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { TransactionSkeleton } from '../components/ui/Skeleton';
import type { Category } from '../lib/database.types';

export function TransactionsPage() {
  const month = getCurrentMonth();
  const { transactions, loading, addTransaction, deleteTransaction, uploadCSV } = useTransactions(month);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<{
    date: string;
    description: string;
    amount: string;
    type: 'debit' | 'credit';
    category: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'debit',
    category: '',
  });

  const handleAddTransaction = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.description || !form.amount) return;

    setSubmitting(true);
    try {
      await addTransaction({
        date: form.date,
        description: form.description,
        amount: Number(form.amount),
        type: form.type,
        ...(form.category ? { category: form.category as Category } : {}),
        merchant: '',
      });
      setForm({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        type: 'debit',
        category: '',
      });
      setShowForm(false);
    } catch (err: any) {
      console.error('Failed to add transaction:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const result = await uploadCSV(file) as any;
      setUploadResult({
        success: true,
        message: `Successfully imported ${result?.count || 0} transactions${result?.skipped ? ` (${result.skipped} skipped)` : ''}`,
      });
    } catch (err: any) {
      setUploadResult({
        success: false,
        message: err.message || 'Upload failed',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteTransaction(id);
    setDeletingId(null);
  };

  // Filter and search
  const filtered = transactions.filter(t => {
    const matchesSearch = searchQuery === '' ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout title="Transactions" subtitle={`${getMonthLabel(month)} • ${transactions.length} transactions`}>
      <div className="space-y-5 max-w-4xl page-enter">

        {/* Upload result notification */}
        {uploadResult && (
          <div className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium animate-slide-up',
            uploadResult.success
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              : 'bg-red-50 text-red-700 border border-red-100'
          )}>
            {uploadResult.success ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <p className="flex-1">{uploadResult.message}</p>
            <button onClick={() => setUploadResult(null)} className="text-current opacity-50 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <span className="text-xs text-red-500 uppercase tracking-wide font-medium">Note: Use your Own API key for transactions parsing, AI Insight and category extraction</span>
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            id="add-transaction-button"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/15 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
          <label className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 text-sm font-medium rounded-xl transition-all cursor-pointer">
            {uploading ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading ? 'Uploading...' : 'Upload File'}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.pdf"
              onChange={handleCSVUpload}
              disabled={uploading}
              hidden
            />
          </label>
        </div>

        {/* Add Transaction Form */}
        {showForm && (
          <Card className="p-5 animate-slide-up border-emerald-100/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">New Transaction</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    required
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white transition-colors tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, type: 'debit' })}
                      className={cn(
                        'flex-1 py-2.5 text-sm font-medium rounded-xl border transition-all',
                        form.type === 'debit'
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                      )}
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, type: 'credit' })}
                      className={cn(
                        'flex-1 py-2.5 text-sm font-medium rounded-xl border transition-all',
                        form.type === 'credit'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                      )}
                    >
                      Income
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Category
                    <span className="text-gray-400 font-normal ml-1">(optional — AI will auto-classify)</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white transition-colors"
                  >
                    <option value="">Auto-categorize with AI ✨</option>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    required
                    placeholder="e.g., Coffee at Starbucks, Monthly rent, Uber ride"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/15 disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Adding...' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Search & Filter */}
        {transactions.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search transactions..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Transaction List */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 6 }).map((_, i) => <TransactionSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            transactions.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-7 h-7 text-gray-400" />}
                title="No transactions yet"
                description="Add your first transaction manually or upload a CSV file to get started with AI-powered finance tracking."
                action={
                  <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/15 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Upload your first transaction
                  </button>
                }
              />
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-400">No matching transactions</p>
              </div>
            )
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(t => (
                <div
                  key={t._id}
                  className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                    {CATEGORY_ICONS[t.category as Category] || '📦'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <CategoryBadge category={t.category as Category} />
                      <span className="text-xs text-gray-400">{formatDateShort(t.date)}</span>
                      {t.aiCategorized && (
                        <span className="text-[10px] font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">
                          AI ✨
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-2">
                    <span className={cn(
                      'text-sm font-semibold whitespace-nowrap tabular-nums',
                      t.type === 'credit' ? 'text-emerald-600' : 'text-red-500'
                    )}>
                      {t.type === 'credit' ? '+' : '-'}{formatCurrency(Number("" + t.amount))}
                    </span>
                    <button
                      onClick={() => handleDelete(t._id)}
                      disabled={deletingId === t._id}
                      className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Delete transaction"
                    >
                      {deletingId === t._id ? (
                        <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
