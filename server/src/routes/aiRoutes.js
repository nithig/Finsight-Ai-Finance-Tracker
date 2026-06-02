import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';
import { aiService } from '../services/aiService.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Generate AI insights for user's transactions
router.get('/insights', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = { userId: req.userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query).sort({ date: -1 }).limit(100);

    const insightsResult = await aiService.generateInsights(transactions);

    res.json({
      success: insightsResult.success,
      insights: insightsResult.insights,
      transactionCount: transactions.length,
    });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({
      message: 'Failed to generate insights',
      error: error.message,
    });
  }
});

// Get category breakdown with percentages
router.get('/categories', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = { userId: req.userId, type: 'debit' };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const breakdown = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const totalExpense = breakdown.reduce((sum, cat) => sum + cat.total, 0);

    const withPercentage = breakdown.map(cat => ({
      category: cat._id,
      total: cat.total,
      count: cat.count,
      percentage: totalExpense > 0 ? Number(((cat.total / totalExpense) * 100).toFixed(1)) : 0,
    }));

    res.json({
      breakdown: withPercentage,
      totalExpense,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch category breakdown',
      error: error.message,
    });
  }
});

// Categorize a single transaction description
router.post('/categorize', async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ message: 'Description is required' });
    }

    const result = await aiService.categorizeTransaction(description);

    res.json({
      success: result.success,
      category: result.category,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to categorize transaction',
      error: error.message,
    });
  }
});

export default router;
