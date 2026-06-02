import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { createRequire } from 'module';
import { aiService } from './aiService.js';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

export const parserService = {

  // ─── Main entry: detect file type and parse ──────────────
  parseFile(fileBuffer, originalname) {
    const ext = (originalname || '').split('.').pop().toLowerCase();

    switch (ext) {
      case 'csv':
        return this.parseCSV(fileBuffer);
      case 'xlsx':
      case 'xls':
        return this.parseExcel(fileBuffer);
      case 'pdf':
        return this.parsePDF(fileBuffer);
      default:
        return { success: false, error: `Unsupported file type: .${ext}. Supported: .csv, .xlsx, .xls, .pdf` };
    }
  },

  // ─── CSV Parser ──────────────────────────────────────────
  parseCSV(fileBuffer, encoding = 'utf-8') {
    try {
      const content = fileBuffer.toString(encoding);

      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        relax_column_count: true,
      });

      if (records.length === 0) {
        return { success: false, error: 'No transactions found in CSV' };
      }

      return this._mapRecords(records, 'CSV');
    } catch (error) {
      return { success: false, error: `CSV parsing failed: ${error.message}` };
    }
  },

  // ─── Excel Parser (XLSX / XLS) ───────────────────────────
  parseExcel(fileBuffer) {
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });

      // Use the first sheet
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return { success: false, error: 'Excel file has no sheets' };
      }

      const sheet = workbook.Sheets[sheetName];
      const records = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (records.length === 0) {
        return { success: false, error: 'No transactions found in Excel file' };
      }

      return this._mapRecords(records, 'Excel');
    } catch (error) {
      return { success: false, error: `Excel parsing failed: ${error.message}` };
    }
  },

  // ─── PDF Parser ──────────────────────────────────────────
  async parsePDF(fileBuffer) {
    try {
      const data = await pdf(fileBuffer);
      const text = data.text;

      if (!text || text.trim().length === 0) {
        return { success: false, error: 'PDF contains no readable text. Scanned PDFs are not supported.' };
      }

      // Try to extract transactions from text lines
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const transactions = [];

      for (const line of lines) {
        const parsed = this._parsePDFLine(line);
        if (parsed) transactions.push(parsed);
      }

      if (transactions.length === 0) {
        return {
          success: false,
          error: 'Could not extract transactions from PDF. Ensure it contains rows with date, description, and amount.',
        };
      }

      return {
        success: true,
        data: transactions,
        total: lines.length,
        skipped: lines.length - transactions.length,
        format: 'PDF',
      };
    } catch (error) {
      const msg = (error.message || '').toLowerCase();

      // Detect password-protected / encrypted PDFs
      if (msg.includes('password') || msg.includes('encrypted') || msg.includes('protected') || msg.includes('security')) {
        return { success: false, error: 'This PDF is password-protected. Please remove the password and try again, or export your statement as CSV/Excel.' };
      }

      return { success: false, error: `PDF parsing failed: ${error.message}` };
    }
  },

  // ─── Shared: map records to transaction objects ──────────
  _mapRecords(records, format) {
    const transactions = records.map((record, index) => {
      try {
        // Support flexible column names (lowercase + capitalized)
        const description = this._findField(record, ['description', 'Description', 'name', 'Name', 'merchant', 'Merchant', 'memo', 'Memo', 'particular', 'Particular', 'narration', 'Narration'])
          || 'Transaction';

        const amountRaw = this._findField(record, ['amount', 'Amount', 'value', 'Value', 'total', 'Total', 'debit', 'Debit', 'credit', 'Credit']);
        const amount = parseFloat(String(amountRaw).replace(/[^0-9.\-]/g, '') || '0');

        const dateStr = this._findField(record, ['date', 'Date', 'transaction_date', 'TransactionDate', 'txn_date', 'posting_date', 'PostingDate', 'value_date', 'ValueDate']);

        const transaction = {
          date: this.parseDate(dateStr),
          description: String(description).substring(0, 200),
          amount: Math.abs(amount),
          type: this.inferType(
            this._findField(record, ['type', 'Type', 'transaction_type', 'TransactionType']),
            amountRaw
          ),
          category: this._findField(record, ['category', 'Category']) || 'Others',
          merchant: String(this._findField(record, ['merchant', 'Merchant', 'store', 'Store']) || '').substring(0, 100),
          notes: String(this._findField(record, ['notes', 'Notes', 'memo', 'Memo', 'remark', 'Remark']) || '').substring(0, 500),
        };

        // Validation
        if (isNaN(transaction.amount) || transaction.amount === 0) {
          return null;
        }

        return transaction;
      } catch (err) {
        console.warn(`Row ${index + 1} skipped:`, err.message);
        return null;
      }
    });

    const validTransactions = transactions.filter(t => t !== null);

    if (validTransactions.length === 0) {
      return { success: false, error: `No valid transactions found in ${format} file. Ensure columns include: date, description, amount` };
    }

    return {
      success: true,
      data: validTransactions,
      total: transactions.length,
      skipped: transactions.length - validTransactions.length,
      format,
    };
  },

  // ─── AI-Enhanced PDF Parser (uses Llama 3.1 70B) ─────────
  // Falls back to AI extraction when standard parsing fails
  async parseWithAI(fileBuffer, originalname) {
    try {
      const ext = (originalname || '').split('.').pop().toLowerCase();
      
      if (ext !== 'pdf') {
        return { success: false, error: 'AI extraction is for PDFs only' };
      }

      // Extract text from PDF
      const data = await pdf(fileBuffer);
      const text = data.text;

      if (!text || text.trim().length === 0) {
        return { success: false, error: 'PDF contains no readable text' };
      }

      // Use AI service to extract structured data (uses Llama 3.1 70B)
      const result = await aiService.extractFinancialData(text, 'PDF');

      if (!result.success || !result.data || result.data.length === 0) {
        return {
          success: false,
          error: 'AI could not extract transactions. PDF format may not be standard.',
        };
      }

      // Convert AI output to transaction format
      const transactions = result.data.map(item => {
        try {
          return {
            date: this.parseDate(item.date),
            description: String(item.description || 'PDF Transaction').substring(0, 200),
            amount: Math.abs(parseFloat(item.amount) || 0),
            type: String(item.amount || 0).includes('-') ? 'debit' : 'credit',
            category: this._normalizeCategory(item.category || 'Others'),
            merchant: '',
            notes: `Extracted via AI (${aiService.getProviderInfo().provider})`,
          };
        } catch (e) {
          return null;
        }
      }).filter(t => t !== null && t.amount > 0);

      if (transactions.length === 0) {
        return { success: false, error: 'No valid transactions extracted by AI' };
      }

      return {
        success: true,
        data: transactions,
        total: transactions.length,
        format: 'PDF (AI-Enhanced)',
        provider: aiService.getProviderInfo().provider,
      };
    } catch (error) {
      console.error('AI-Enhanced PDF parsing failed:', error);
      return {
        success: false,
        error: `AI parsing failed: ${error.message}`,
      };
    }
  },

  // ─── Normalize category ──────────────────────────────────
  _normalizeCategory(category) {
    const validCategories = [
      'Food',
      'Transport',
      'Bills',
      'Shopping',
      'Salary',
      'Entertainment',
      'Income',
      'Investment',
      'Refund',
      'Others',
    ];
    return validCategories.find(c => c.toLowerCase() === (category || '').toLowerCase()) || 'Others';
  },

  // ─── Fallback: Try AI when standard parsing fails ────────
  async parseFileWithFallback(fileBuffer, originalname) {
    const ext = (originalname || '').split('.').pop().toLowerCase();

    // Try standard parsing first
    const result = this.parseFile(fileBuffer, originalname);

    // If standard parsing fails and it's a PDF, try AI extraction
    if (!result.success && ext === 'pdf') {
      console.log('Standard PDF parsing failed, attempting AI extraction...');
      return await this.parseWithAI(fileBuffer, originalname);
    }

    return result;
  },

  _parsePDFLine(line) {
    // Pattern: date ... description ... amount
    // Matches lines like: "01/15/2026  Coffee at Starbucks  $4.50"
    //                     "2026-01-15  Monthly Rent  1200.00"
    const datePatterns = [
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,      // DD/MM/YYYY or MM/DD/YYYY
      /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,          // YYYY-MM-DD
    ];

    let dateMatch = null;
    let dateStr = null;

    for (const pattern of datePatterns) {
      dateMatch = line.match(pattern);
      if (dateMatch) {
        dateStr = dateMatch[1];
        break;
      }
    }

    if (!dateStr) return null;

    // Extract amount (last number in line, possibly with $ sign)
    const amountMatch = line.match(/[\$₹€£]?\s*([0-9,]+\.?\d*)\s*(?:CR|DR|Cr|Dr)?\s*$/);
    if (!amountMatch) return null;

    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    if (isNaN(amount) || amount === 0) return null;

    // Description is everything between date and amount
    const dateEnd = dateMatch.index + dateMatch[0].length;
    const amountStart = line.lastIndexOf(amountMatch[0]);
    let description = line.substring(dateEnd, amountStart).trim();

    // Clean up description
    description = description.replace(/^[\s\-\|]+/, '').replace(/[\s\-\|]+$/, '').trim();
    if (!description || description.length < 2) description = 'PDF Transaction';

    // Infer credit/debit
    const isCR = /CR|Cr|credit/i.test(line);
    const isDR = /DR|Dr|debit/i.test(line);

    return {
      date: this.parseDate(dateStr),
      description: description.substring(0, 200),
      amount: Math.abs(amount),
      type: isCR ? 'credit' : isDR ? 'debit' : 'debit',
      category: 'Others',
      merchant: '',
      notes: '',
    };
  },

  // ─── Helpers ─────────────────────────────────────────────
  _findField(record, keys) {
    for (const key of keys) {
      if (record[key] !== undefined && record[key] !== null && record[key] !== '') {
        return record[key];
      }
    }
    return null;
  },

  parseDate(dateString) {
    if (!dateString) return new Date();

    // Handle Date objects (from XLSX cellDates)
    if (dateString instanceof Date) {
      return isNaN(dateString.getTime()) ? new Date() : dateString;
    }

    const str = String(dateString).trim();

    // Try standard parse
    const date = new Date(str);
    if (!isNaN(date.getTime())) return date;

    // Try DD/MM/YYYY format
    const parts = str.split(/[\/\-\.]/);
    if (parts.length === 3) {
      const [a, b, c] = parts.map(Number);
      if (a > 12) {
        const d = new Date(c < 100 ? c + 2000 : c, b - 1, a);
        if (!isNaN(d.getTime())) return d;
      }
    }

    return new Date();
  },

  inferType(typeString, amount) {
    if (typeString) {
      const type = String(typeString).toLowerCase().trim();
      if (type.includes('credit') || type.includes('income') || type.includes('deposit') || type.includes('salary')) {
        return 'credit';
      }
      if (type.includes('debit') || type.includes('expense') || type.includes('withdrawal') || type.includes('payment')) {
        return 'debit';
      }
    }

    if (amount) {
      const num = parseFloat(String(amount).replace(/[^0-9.\-]/g, ''));
      if (!isNaN(num)) {
        return num > 0 ? 'credit' : 'debit';
      }
    }

    return 'debit';
  },
};
