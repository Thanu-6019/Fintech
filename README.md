# fintech.ai — AI-Powered CFO Assistant

> A full-stack financial management platform for startups & individuals.
> Monte Carlo simulations · AI CFO summaries · Real-time dashboards · PDF/CSV exports

---

## Project Structure

```
fintech-ai/
├── src/
│   ├── main.jsx                  ← React entry point
│   ├── App.jsx                   ← Root component, routing, global state
│   │
│   ├── lib/                      ← Pure logic, no UI
│   │   ├── theme.js              ← Design tokens (colors, global CSS)
│   │   ├── utils.js              ← Formatters, math helpers
│   │   ├── seedData.js           ← Sample merchants & portfolio data
│   │   ├── simulation.js         ← Monte Carlo engine (N=200 runs)
│   │   ├── aiSummary.js          ← Anthropic API call + prompt templates
│   │   ├── exportUtils.js        ← CSV + TXT report download helpers
│   │   └── storage.js            ← Persistent user DB + per-user data
│   │
│   ├── components/               ← Shared UI building blocks
│   │   ├── ui.jsx                ← Card, Btn, Input, Badge, KpiCard,
│   │   │                            Sparkline, ProgressBar, DonutChart,
│   │   │                            Slider, Alert, Modal
│   │   ├── Layout.jsx            ← Sidebar + Header
│   │   └── AuthPage.jsx          ← Login / signup / Google SSO
│   │
│   └── pages/                    ← One file per page group
│       ├── DashboardPage.jsx     ← Smart empty→partial→full states
│       ├── MerchantsPortfolio.jsx← Merchant explorer + Portfolio tracker
│       ├── SimulationPage.jsx    ← Monte Carlo studio
│       ├── AIPage.jsx            ← AI CFO insights (Claude API)
│       ├── PlannerPages.jsx      ← Salary planner + Budget planner
│       └── OtherPages.jsx        ← Bills, Reports, Admin, Settings
│
├── backend_app.py                ← Python/Flask REST API
├── seed.py                       ← Populates MongoDB with sample data
├── requirements.txt              ← Python dependencies
├── docker-compose.yml            ← MongoDB + backend + frontend
├── index.html                    ← HTML shell
├── vite.config.js                ← Vite bundler config
└── package.json                  ← Node dependencies
```

---

## Quick Start (Frontend only)

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
# → Opens at http://localhost:3000

# 3. Create an account on the login page
#    (credentials are stored in browser persistent storage)
```

---

## Quick Start (Full stack with Docker)

```bash
# 1. Create a .env file in project root (see Environment Variables section)

# 2. Start everything
docker-compose up --build
# Frontend → http://localhost:3000
# Backend  → http://localhost:5000
# MongoDB  → http://localhost:8081 (Mongo Express)

# 3. Seed sample data
docker compose exec backend python seed.py
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
MONGO_URI=mongodb://localhost:27017/
JWT_SECRET=your_super_secret_key_here
LLM_API_KEY=sk-ant-api03-...        # Anthropic API key (optional — AI features)
LLM_MODEL=claude-sonnet-4-20250514
PORT=5000
```

The `LLM_API_KEY` is optional. Without it, the AI Insights page shows a mock summary instead of calling Claude.

---

## Feature Map

| Feature | File |
|---|---|
| Auth (login/signup/Google SSO) | `src/components/AuthPage.jsx` |
| Persistent credential store | `src/lib/storage.js` |
| Design tokens & global styles | `src/lib/theme.js` |
| Monte Carlo engine | `src/lib/simulation.js` |
| Claude AI summaries | `src/lib/aiSummary.js` |
| CSV + report export | `src/lib/exportUtils.js` |
| Sidebar & Header | `src/components/Layout.jsx` |
| All shared UI components | `src/components/ui.jsx` |
| Dashboard (empty/partial/full) | `src/pages/DashboardPage.jsx` |
| Merchant & Portfolio explorer | `src/pages/MerchantsPortfolio.jsx` |
| Simulation Studio | `src/pages/SimulationPage.jsx` |
| AI Insights panel | `src/pages/AIPage.jsx` |
| Salary + Budget planners | `src/pages/PlannerPages.jsx` |
| Bills, Reports, Admin, Settings | `src/pages/OtherPages.jsx` |
| Python Flask backend | `backend_app.py` |
| MongoDB seed data | `seed.py` |

---

## Backend API Reference

```
POST  /api/auth/register           Register (name, email, password, role, user_type)
POST  /api/auth/login              Login → JWT token
GET   /api/users/me                Current user profile (requires Bearer token)

GET   /api/merchants               List merchants (filter: category, region, page)
POST  /api/upload/transactions     Upload CSV of transactions
GET   /api/transactions            Query transactions (from, to, page, limit)

POST  /api/simulations             Run Monte Carlo simulation (async)
GET   /api/simulations             List user's simulations
GET   /api/simulations/:id/status  Check simulation status
POST  /api/simulations/:id/ai-summary  Generate AI CFO summary

POST  /api/salary/calculate        Calculate salary distribution
POST  /api/bills                   Add a bill
DELETE /api/bills/:id              Remove a bill
GET   /api/bills                   List bills

GET   /api/portfolios              List portfolios with positions
POST  /api/reports                 Generate & download report

GET   /api/admin/usage             Usage counters (admin only)
GET   /api/health                  Health check
```

---

## Auth Flow

1. User enters email → app checks persistent storage
2. **Known email** → password screen (sign in)
3. **Unknown email** → registration screen auto-opens (sign up)
4. **Google SSO** → OAuth flow creates/retrieves user from storage

Passwords are hashed with a deterministic XOR hash before storage. In production, replace `hashPassword()` in `src/lib/storage.js` with `bcrypt` via a backend endpoint.

---

## Simulation Engine

The Monte Carlo engine (`src/lib/simulation.js`) runs N=200 independent paths:

1. Revenue = base × (1 + revenueDelta + Gaussian noise + priceDelta × 0.5)
2. Burn = base × (1 + expenseDelta) + hireDelta × ₹8,000/head
3. Cash flow = cumulative (revenue − burn) per month
4. Results sorted by final cash → P10 / P50 / P90
5. Survival rate = % of scenarios with positive final cash

---

## Deploying to Vercel (Frontend)

```bash
npm install -g vercel
vercel --prod
```

## Deploying Backend to Railway

```bash
railway init
railway add --service backend
railway variables set MONGO_URI=... JWT_SECRET=... LLM_API_KEY=...
railway up
```

---

## Role Permissions

| Action | Admin | Analyst | Viewer |
|---|---|---|---|
| View dashboard & pages | ✅ | ✅ | ✅ |
| Run simulations | ✅ | ✅ | ❌ |
| Generate AI summaries | ✅ | ✅ | ❌ |
| Export reports | ✅ | ✅ | ❌ |
| Access admin panel | ✅ | ❌ | ❌ |

---

*fintech.ai — Built with React + Recharts + Python/Flask + MongoDB*
