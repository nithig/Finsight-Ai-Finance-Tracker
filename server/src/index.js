// Load environment variables FIRST - before any other imports
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { connectDB } from './utils/db.js';
import { errorHandler } from './middleware/auth.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Startup logging
console.log('🚀 Finance Tracker Server Starting...');
const requestedAiProvider = (process.env.AI_PROVIDER || 'nvidia').toLowerCase();
const nvidiaConfigured = !!process.env.NVIDIA_API_KEY?.trim();
const activeAiProvider = requestedAiProvider === 'gemini' ? 'gemini' : 'nvidia';

console.log(`🤖 AI Provider: ${activeAiProvider.toUpperCase()}`);
console.log(`🔑 NVIDIA_API_KEY: ${process.env.NVIDIA_API_KEY ? 'Loaded' : 'Not Loaded'}`);
if (activeAiProvider === 'nvidia') {
  if (nvidiaConfigured) {
    console.log('✅ NVIDIA Llama 3.1 configured');
  } else {
    console.warn('⚠️ NVIDIA provider requested but NVIDIA_API_KEY is not configured');
  }
} else {
  console.log('⚠️  Using Google Gemini');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply stricter limits to AI routes
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: { message: 'AI rate limit exceeded. Please wait a moment.' },
});

app.use('/api/', limiter);

// Health check with AI provider info
app.get('/health', (req, res) => {
  const provider = activeAiProvider;
  const providerStatus = provider === 'nvidia' && !nvidiaConfigured ? 'nvidia-missing-key' : provider;
  res.json({ 
    status: 'OK', 
    message: 'Finance Tracker API is running', 
    timestamp: new Date().toISOString(),
    requestedProvider: requestedAiProvider,
    aiProvider: providerStatus,
    nvidiaConfigured,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
// Admin routes (protected)
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Connect to DB and start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════╗
║  🚀 Finance Tracker API Server            ║
║  Port: ${PORT}                              ║
║  Environment: ${process.env.NODE_ENV || 'development'}               ║
║  Status: Running                          ║
╚═══════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
