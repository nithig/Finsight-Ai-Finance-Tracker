import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { parserService } from '../services/parserService.js';
import { aiService } from '../services/aiService.js';

const SUPPORTED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.pdf'];

// 💡 1. ADD THE DELAY HELPER FUNCTION HERE
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const uploadController = {
  async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const ext = '.' + req.file.originalname.split('.').pop().toLowerCase();

      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        return res.status(400).json({
          message: `Unsupported file type: ${ext}. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`,
        });
      }

      const parseResult = await parserService.parseFileWithFallback(req.file.buffer, req.file.originalname, { geminiApiKey: geminiKey, nvidiaApiKey: nvidiaKey });

      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error });
      }

      const { data: transactions } = parseResult;

      // Load user's API keys for AI processing
      const user = await User.findById(req.userId).lean();
      const geminiKey = user?.geminiApiKey?.trim() || user?.apiKeys?.gemini?.trim() || '';
      const nvidiaKey = user?.nvidiaApiKey?.trim() || user?.apiKeys?.nvidia?.trim() || '';

      console.log(`📊 Parsed ${transactions.length} transactions from ${parseResult.format}`);

      const BATCH_SIZE = 5;
      const categorizedTransactions = [];

      console.log(`⏳ Starting sequential processing for ${transactions.length} transactions...`);

      for (let i = 0; i < transactions.length; i++) {
        const txn = transactions[i];

        // Print progress every 10 transactions to keep your terminal clean
        if (i % 10 === 0 || i === transactions.length - 1) {
          console.log(`⏳ Categorizing item ${i + 1}/${transactions.length}...`);
        }

        // Only categorize if category is default 'Others'
        if (txn.category && txn.category !== 'Others') {
          categorizedTransactions.push({ ...txn, userId: req.userId, aiCategorized: false });
          continue; 
        }

        // Send a single request with user's API keys and await its completion before moving to the next item
        const aiResult = await aiService.categorizeTransaction(txn.description, { geminiApiKey: geminiKey, nvidiaApiKey: nvidiaKey });
        
        if (!aiResult.success) {
          console.warn(`⚠️  Failed to categorize: ${txn.description}`, aiResult.error);
        }

        categorizedTransactions.push({
          ...txn,
          userId: req.userId,
          category: aiResult.success ? aiResult.category : txn.category,
          aiCategorized: aiResult.success,
        });

        // 💡 THE STEADY PACE PAUSE: Wait 80ms before processing the next individual item
        // Spreads out 500+ items perfectly across a safe timeline.
        await delay(2100);
      }

      console.log(`✅ Categorized ${categorizedTransactions.length} transactions`);

      const inserted = await Transaction.insertMany(categorizedTransactions, { ordered: false });

      console.log(`✅ Inserted ${inserted.length} transactions into database`);

      res.status(201).json({
        message: `Successfully imported ${inserted.length} transactions from ${parseResult.format || ext} file`,
        count: inserted.length,
        skipped: parseResult.skipped,
        format: parseResult.format || ext.replace('.', '').toUpperCase(),
        aiEnhanced: parseResult.provider ? true : false,
        provider: parseResult.provider,
        transactions: inserted,
      });
    } catch (error) {
      console.error('❌ Upload error:', error.message);
      console.error('Stack:', error.stack);

      if (error.insertedDocs) {
        console.log(`⚠️  Partial import: ${error.insertedDocs.length} transactions saved`);
        return res.status(207).json({
          message: `Partially imported ${error.insertedDocs.length} transactions`,
          count: error.insertedDocs.length,
          transactions: error.insertedDocs,
          errors: error.writeErrors?.length || 0,
        });
      }

      res.status(500).json({ 
        message: 'Upload failed', 
        error: error.message,
        provider: aiService.getProviderInfo(geminiKey, nvidiaKey).provider,
      });
    }
  },
};