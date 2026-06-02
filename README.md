# 🚀 Finsight — AI-Powered Personal Finance Tracker

A production-ready fintech SaaS application with AI-powered transaction categorization, spending analytics, and smart saving suggestions powered by **Google Gemini**.

---

## ✨ Features

- **🔐 JWT Authentication** — Secure signup/login with bcrypt password hashing
- **📊 Premium Dashboard** — Gradient hero card, pie charts, area charts, recent transactions
- **💳 Transaction Management** — Manual entry, CSV upload, search & filter
- **🤖 AI Categorization** — Auto-classify transactions using Gemini Flash Lite
- **💡 AI Insights** — Monthly spending summary, top categories, actionable saving tips
- **📱 Mobile-First** — Fully responsive design that works perfectly on phone
- **🎨 Fintech-Grade UI** — Glassmorphism, gradients, micro-animations, skeletons

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript (Vite) |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Backend | Node.js + Express |
| Database | MongoDB (Mongoose) |
| AI | Google Gemini 2.5 Flash Lite |

---

## 📁 Project Structure

```
Finance-tracker/
├── src/                          # Frontend (React + Vite)
│   ├── components/
│   │   ├── dashboard/            # StatCard, CategoryPieChart, SpendingLineChart
│   │   ├── layout/               # AppLayout, Sidebar, Header
│   │   └── ui/                   # Card, Badge, Skeleton, EmptyState, NavLink
│   ├── contexts/                 # AuthContext
│   ├── hooks/                    # useTransactions
│   ├── lib/                      # apiClient, utils, types, router
│   ├── pages/                    # AuthPage, DashboardPage, TransactionsPage, InsightsPage
│   └── index.css                 # Global styles + Tailwind
├── server/                       # Backend (Express + MongoDB)
│   └── src/
│       ├── controllers/          # auth, transaction, upload
│       ├── middleware/            # JWT auth, error handler
│       ├── models/               # User, Transaction (Mongoose)
│       ├── routes/               # auth, transactions, upload, ai
│       ├── services/             # aiService (Gemini), parserService (CSV)
│       └── utils/                # db connection
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API key ([Get one here](https://ai.google.dev/))

### 1. Clone & Install

```bash
# Frontend
cd Finance-tracker
npm install

# Backend
cd server
npm install
```

### 2. Configure Environment

```bash
# Backend: Copy and fill in your values
cp server/.env.example server/.env.local

# Frontend: Already configured for localhost
```

> Important: This repository does not include any working Gemini or NVIDIA API keys.
> You must obtain your own key and add it to `server/.env.local` before deploying.

Required in `server/.env.local`:
- `MONGODB_URI` — Your MongoDB connection string
- `GEMINI_API_KEY` — Your Google Gemini API key
- `JWT_SECRET` — A strong secret string

### 3. Start Development

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd Finance-tracker
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5000

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/profile` | Get user profile |
| GET | `/api/transactions` | List transactions (with filters) |
| POST | `/api/transactions` | Create transaction |
| GET | `/api/transactions/stats` | Get spending stats |
| DELETE | `/api/transactions/:id` | Delete transaction |
| POST | `/api/upload/csv` | Upload CSV file |
| GET | `/api/ai/insights` | Generate AI insights |
| GET | `/api/ai/categories` | Get category breakdown |
| POST | `/api/ai/categorize` | Classify transaction |

---

## 🚀 Deployment

| Service | Platform |
|---------|----------|
| Frontend | Vercel |
| Backend | Railway / Render |
| Database | MongoDB Atlas |

---

## 🔒 Security

- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens with 30-day expiry
- Rate limiting on all API routes
- Stricter limits on AI endpoints
- Input validation on all endpoints
- CORS configured for frontend origin only
- No sensitive banking data stored

---

## 📄 License

MIT