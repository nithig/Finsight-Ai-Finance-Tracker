import { GoogleGenerativeAI } from '@google/generative-ai';

// NVIDIA is the default provider. Gemini is only used when AI_PROVIDER=gemini.
// If the provider is set to nvidia without a configured key, calls fail instead of silently falling back.

// Helper function to get NVIDIA API key dynamically
const getNvidiaApiKey = () => process.env.NVIDIA_API_KEY?.trim() || '';

const REQUESTED_AI_PROVIDER = (process.env.AI_PROVIDER || 'nvidia').toLowerCase();
const AI_PROVIDER = REQUESTED_AI_PROVIDER === 'gemini' ? 'gemini' : 'nvidia';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1';

// Model configurations
const MODELS = {
  gemini: {
    categorization: 'gemini-2.5-flash-lite',
    insights: 'gemini-2.5-flash-lite',
    extraction: 'gemini-2.5-flash-lite',
  },
  nvidia: {
    categorization: 'meta/llama-3.1-8b-instruct',
    insights: 'meta/llama-3.1-8b-instruct',
    extraction: 'meta/llama-3.1-70b-instruct', 
  },
};

// ──── NVIDIA API Helper ──────────────────────────────────
async function callNvidiaAPI(prompt, model, systemPrompt = '') {
  try {
    const nvidiaApiKey = getNvidiaApiKey();
    const headers = {
      'Authorization': `Bearer ${nvidiaApiKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json' // Added for explicit safety with fetch
    };

    const body = {
      model: model,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      top_p: 0.7,
      max_tokens: 1024,
    };

    const response = await fetch(`${NVIDIA_API_URL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`NVIDIA API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('NVIDIA API call failed:', error);
    throw error;
  }
}

// ──── Prompts ────────────────────────────────────────────
const createCategorizationPrompt = (description) => `Classify this financial transaction into exactly ONE category from: Food, Transport, Bills, Shopping, Salary, Entertainment, Others.\n\nTransaction description: "${description}"\n\nRespond with ONLY the category name, nothing else.`;

const createInsightsPrompt = (transactions) => {
  const transactionText = transactions
    .map(t => `- ${t.date.toLocaleDateString()}: ${t.description} (${t.category}) - $${t.amount}`)
    .join('\n');

  return `Analyze these financial transactions and provide:\n1. A 1-2 sentence spending summary\n2. The top spending category and percentage\n3. Two specific, actionable saving tips\n\nKeep it concise and practical.\n\nTransactions:\n${transactionText}\n\nFormat your response as JSON with keys: summary, topCategory, topCategoryPercent, tips (array of 2 tips)`;
};

const createFinancialExtractionPrompt = (fileContent, fileType) => `You are an expert financial analyst. Extract structured transaction data from this ${fileType} financial document.\n\nFor each transaction found, extract:\n- Date (in YYYY-MM-DD format)\n- Description/Reference\n- Amount\n- Category (choose from: Income, Food, Transport, Bills, Shopping, Salary, Entertainment, Investment, Refund, Others)\n\nReturn ONLY a JSON array with no additional text. Example format:\n[\n  {"date": "2024-01-15", "description": "Coffee Shop", "amount": 5.50, "category": "Food"}\n]\n\nDocument content:\n${fileContent}`;

// ──── AIService Implementation ────────────────────────────
export const aiService = {
  
  // ──── Get AI Provider Info ───────────────────────────────
  getProviderInfo() {
    const nvidiaApiKey = getNvidiaApiKey();
    const isConfigured = AI_PROVIDER === 'nvidia' ? !!nvidiaApiKey : !!process.env.GEMINI_API_KEY;
    
    return {
      requestedProvider: REQUESTED_AI_PROVIDER,
      provider: AI_PROVIDER,
      models: MODELS[AI_PROVIDER] || MODELS.gemini,
      available: isConfigured,
      configured: isConfigured,
    };
  },

  // ──── Categorize Transaction ─────────────────────────────
  async categorizeTransaction(description) {
    try {
      const prompt = createCategorizationPrompt(description);
      let text;

      if (AI_PROVIDER === 'nvidia') {
        const nvidiaApiKey = getNvidiaApiKey();
        if (!nvidiaApiKey) {
          throw new Error('NVIDIA API key not configured');
        }
        text = await callNvidiaAPI(prompt, MODELS.nvidia.categorization);
      } else {
        const model = genAI.getGenerativeModel({ model: MODELS.gemini.categorization });
        const result = await model.generateContent(prompt);
        text = (await result.response).text().trim();
      }

      const validCategories = ['Food', 'Transport', 'Bills', 'Shopping', 'Salary', 'Entertainment', 'Others'];
      const category = validCategories.find(cat => text.includes(cat)) || 'Others';

      return { success: true, category };
    } catch (error) {
      console.error('❌ Categorization error:', error.message);
      return { success: false, category: 'Others', error: error.message };
    }
  },

  // ──── Generate Insights ──────────────────────────────────
  async generateInsights(transactions) {
    try {
      if (transactions.length === 0) {
        return {
          success: true,
          insights: {
            summary: 'No transactions to analyze yet.',
            topCategory: 'N/A',
            topCategoryPercent: 0,
            tips: ['Upload your first transaction to get started', 'Link your bank accounts'],
          },
        };
      }

      const prompt = createInsightsPrompt(transactions);
      let text;

      if (AI_PROVIDER === 'nvidia') {
        // FIXED: Using function call instead of non-existent global variable
        if (!getNvidiaApiKey()) {
          throw new Error('NVIDIA API key not configured');
        }
        text = await callNvidiaAPI(prompt, MODELS.nvidia.insights);
      } else {
        const model = genAI.getGenerativeModel({ model: MODELS.gemini.insights });
        const result = await model.generateContent(prompt);
        text = (await result.response).text().trim();
      }

      try {
        const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
        if (jsonMatch) text = jsonMatch[1];
        return { success: true, insights: JSON.parse(text) };
      } catch {
        return {
          success: true,
          insights: {
            summary: text.substring(0, 150),
            topCategory: 'See dashboard for details',
            topCategoryPercent: 0,
            tips: ['Review your spending patterns regularly', 'Set monthly budgets'],
          },
        };
      }
    } catch (error) {
      console.error('❌ Insights generation error:', error.message);
      return {
        success: false,
        error: error.message,
        insights: { summary: 'Unable to generate insights', topCategory: 'N/A', topCategoryPercent: 0, tips: [] },
      };
    }
  },

  // ──── Extract Financial Data from Documents ──────────────
  async extractFinancialData(fileContent, fileType = 'PDF') {
    try {
      if (!fileContent) {
        return { success: false, error: 'No content to extract', data: [] };
      }

      const truncatedContent = fileContent.substring(0, 8000);
      const prompt = createFinancialExtractionPrompt(truncatedContent, fileType);
      let text;

      if (AI_PROVIDER === 'nvidia') {
        // FIXED: Using function call instead of non-existent global variable
        if (!getNvidiaApiKey()) {
          throw new Error('NVIDIA API key not configured');
        }
        text = await callNvidiaAPI(
          prompt,
          MODELS.nvidia.extraction,
          'You are an expert financial analyst specializing in document parsing. Extract ALL financial transactions accurately.'
        );
      } else {
        const model = genAI.getGenerativeModel({ model: MODELS.gemini.extraction });
        const result = await model.generateContent(prompt);
        text = (await result.response).text().trim();
      }

      try {
        const jsonMatch = text.match(/\[\s*{[\s\S]*?}\s*\]/);
        if (!jsonMatch) return { success: false, error: 'Could not extract transaction data', data: [] };
        return { success: true, data: JSON.parse(jsonMatch[0]) };
      } catch (parseError) {
        return { success: false, error: 'Failed to parse extracted data', data: [] };
      }
    } catch (error) {
      console.error('❌ Financial extraction error:', error.message);
      return { success: false, error: error.message, data: [] };
    }
  },

  // ──── Analyze Financial Patterns ─────────────────────────
  async analyzeFinancialPatterns(transactions) {
    try {
      if (transactions.length < 3) {
        return { success: false, error: 'Need at least 3 transactions for meaningful analysis' };
      }

      const transactionText = transactions
        .map(t => `${t.date}: ${t.description} - $${t.amount} (${t.category})`)
        .join('\n');

      const prompt = `Analyze these financial transactions and provide:\n1. Spending patterns and trends\n2. Anomalies\n3. Budget recommendations\n4. Risk factors\n\nTransactions:\n${transactionText}\n\nRespond with a JSON object containing: patterns, anomalies, budgetRecs, healthScore (0-100), riskFactors`;
      let text;

      if (AI_PROVIDER === 'nvidia') {
        // FIXED: Using function call instead of non-existent global variable
        if (!getNvidiaApiKey()) {
          throw new Error('NVIDIA API key not configured');
        }
        text = await callNvidiaAPI(prompt, MODELS.nvidia.extraction, 'You are a financial advisor analyzing spending patterns.');
      } else {
        const model = genAI.getGenerativeModel({ model: MODELS.gemini.insights });
        const result = await model.generateContent(prompt);
        text = (await result.response).text().trim();
      }

      try {
        const jsonMatch = text.match(/{[\s\S]*?}/);
        if (!jsonMatch) return { success: false, error: 'Could not generate analysis' };
        return { success: true, analysis: JSON.parse(jsonMatch[0]) };
      } catch {
        return { success: false, error: 'Failed to parse analysis' };
      }
    } catch (error) {
      console.error('❌ Pattern analysis error:', error.message);
      return { success: false, error: error.message };
    }
  },
};