import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { aiService } from '../services/aiService.js';

export const transactionController = {
  async getTransactions(req, res) {
    try {
      const { startDate, endDate, category, type, limit = 50, page = 1 } = req.query;

      const query = { userId: req.userId };

      // Filter by date range
      // if (startDate || endDate) {
      //   query.date = {};
      //   if (startDate) query.date.$gte = new Date(startDate);
      //   if (endDate) query.date.$lte = new Date(endDate);
      // }

      if (category) query.category = category;
      if (type) query.type = type;

      const skip = (page - 1) * limit;

      const transactions = await Transaction.find(query)
        .sort({ date: -1 })
        .limit(parseInt(limit))
        .skip(skip);

      const total = await Transaction.countDocuments(query);

      res.json({
        transactions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
    }
  },

  async getTransaction(req, res) {
    try {
      const transaction = await Transaction.findOne({
        _id: req.params.id,
        userId: req.userId,
      });

      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      res.json({ transaction });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch transaction', error: error.message });
    }
  },

  async createTransaction(req, res) {
    try {
      const { amount, type, category, description, merchant, date, notes } = req.body;

      // Validation
      if (!amount || !type || !description) {
        return res.status(400).json({
          message: 'Amount, type, and description are required',
        });
      }

      let finalCategory = category || 'Others';
      let geminiKey = '';
      let nvidiaKey = '';

      // Load the user's stored API keys for AI categorization
      if (!category) {
        const user = await User.findById(req.userId).lean();
        geminiKey = user?.geminiApiKey?.trim() || user?.apiKeys?.gemini?.trim() || '';
        nvidiaKey = user?.nvidiaApiKey?.trim() || user?.apiKeys?.nvidia?.trim() || '';

        const aiResult = await aiService.categorizeTransaction(description, { geminiApiKey: geminiKey, nvidiaApiKey: nvidiaKey });
        if (aiResult.success) {
          finalCategory = aiResult.category;
        }
      }

      const transaction = new Transaction({
        userId: req.userId,
        amount,
        type,
        category: finalCategory,
        description,
        merchant,
        date: date ? new Date(date) : new Date(),
        notes,
        aiCategorized: !category,
      });

      await transaction.save();

      res.status(201).json({
        message: 'Transaction created successfully',
        transaction,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to create transaction', error: error.message });
    }
  },

  async updateTransaction(req, res) {
    try {
      const { amount, type, category, description, merchant, date, notes } = req.body;

      const transaction = await Transaction.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        {
          amount,
          type,
          category,
          description,
          merchant,
          date,
          notes,
        },
        { new: true, runValidators: true }
      );

      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      res.json({
        message: 'Transaction updated successfully',
        transaction,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update transaction', error: error.message });
    }
  },

  async deleteTransaction(req, res) {
    try {
      const transaction = await Transaction.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId,
      });

      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete transaction', error: error.message });
    }
  },

  async getStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const query = { userId: req.userId };

      // if (startDate || endDate) {
      //   query.date = {};
      //   if (startDate) query.date.$gte = new Date(startDate);
      //   if (endDate) query.date.$lte = new Date(endDate);
      // }

      // Get totals by type
      const typeTotals = await Transaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]);

      // Get totals by category
      const categoryTotals = await Transaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
          },
        },
      ]);

      // Get daily totals
      const dailyTotals = await Transaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const income = typeTotals.find(t => t._id === 'credit')?.total || 0;
      const expenses = typeTotals.find(t => t._id === 'debit')?.total || 0;

      res.json({
        summary: {
          income,
          expenses,
          balance: income - expenses,
          transactionCount: income + expenses,
        },
        byCategory: categoryTotals,
        byDay: dailyTotals,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
    }
  },
};
