import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../contexts/AuthContext';
import type { Transaction } from '../lib/database.types';

export function useTransactions(month?: string) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      let startDate: string | undefined;
      let endDate: string | undefined;

      if (month) {
        const [y, m] = month.split('-').map(Number);
        startDate = new Date(y, m - 1, 1).toISOString().split('T')[0];
        endDate = new Date(y, m, 0).toISOString().split('T')[0];
      }

      const response = await apiClient.getTransactions({
        startDate,
        endDate,
        limit: 200,
      });

      setTransactions(response.transactions || []);
    } catch (err: any) {
      setError(err.message);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [user, month]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = async (tx: Partial<Transaction>) => {
    if (!user) return null;

    try {
      const response = await apiClient.createTransaction(tx);
      const newTx = response.transaction;
      setTransactions(prev => [newTx, ...prev]);
      return newTx;
    } catch (err: any) {
      console.error('Add transaction error:', err);
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await apiClient.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t._id !== id));
      return true;
    } catch (err: any) {
      console.error('Delete transaction error:', err);
      return false;
    }
  };

  const uploadCSV = async (file: File) => {
    if (!user) return false;

    try {
      const response = await apiClient.uploadCSV(file);
      // Refresh the transaction list after upload
      await fetchTransactions();
      return { success: true, count: response.count, skipped: response.skipped };
    } catch (err: any) {
      console.error('CSV upload error:', err);
      throw err;
    }
  };

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
    addTransaction,
    deleteTransaction,
    uploadCSV,
  };
}
