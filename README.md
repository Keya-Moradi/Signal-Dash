# Signal Dash

Signal Dash is a lightweight ExperimentOps Lite tool that takes experiments from intake → approval → running → readout → decision, tracks exposures/conversions, computes basic A/B stats, and generates an optional AI-assisted readout.

## Why this exists

I built Signal Dash to demonstrate:

- **SQL + analytics** (experiment results, lift, significance)
- **Ops workflow** (intake, statuses, decision logging)
- **Backend APIs** (event tracking endpoint)
- **Practical AI integration** (readout summarization with fallback)

## Features (MVP)

- Experiment intake form (hypothesis + primary metric + variants)
- Status workflow: Draft → Review → Running → Readout → Shipped/Killed
- Event tracking API: `/api/track` (exposure/conversion)
- Dashboard: experiment list + detail view + Chart.js visualization
- Stats: conversion rate, lift, p-value, 95% CI (2-proportion z-test)
- Readout page: optional AI summary with deterministic fallback

## Tech Stack

- **Node.js** + **Express**
- **EJS** server-rendered templates
- **PostgreSQL**
- **Chart.js** (CDN)
- **Docker Compose**

## Quickstart

### 1) Start Postgres

```bash
docker compose up -d
```

### 2) Configure env

```bash
cp .env.example .env
```

Edit `.env` if needed. Default values work out of the box.

### 3) Install deps

```bash
npm install
```

### 4) Run migrations + seed demo data

```bash
npm run db:migrate
npm run db:seed
```

### 5) Start the app

```bash
npm run dev
```

Open: **http://localhost:3000**

## Event Tracking API

Track exposures and conversions using the tracking endpoint:

```bash
POST /api/track
Content-Type: application/json

{
  "experimentId": 1,
  "variantId": 2,
  "userKey": "anon_123",
  "eventType": "exposure",
  "props": { "source": "web" }
}
```

**Event Types:**
- `exposure` - User is exposed to a variant
- `conversion` - User completes the desired action

**Response:**

```json
{
  "success": true,
  "message": "Event tracked successfully",
  "eventId": 42,
  "occurredAt": "2026-01-02T12:34:56.789Z"
}
```

## Assumptions

Signal Dash makes the following architectural assumptions:

- **Assignment happens upstream. Signal Dash does not randomize users.** An upstream system must handle variant assignment and pass the correct `variantId` when tracking events. Signal Dash only tracks and analyzes results.
- **Unit of analysis is distinct `user_key`** (computed via `COUNT(DISTINCT user_key)` for exposures and conversions).
- **Deduplication is enforced at `(experiment_id, user_key, event_type)`** using a unique index and `INSERT ... ON CONFLICT DO NOTHING` for atomic dedup.
- **Stats are approximate** (2-proportion z-test; warnings shown for small samples and imbalanced allocation).

## Notes on statistics

Signal Dash uses a basic **two-proportion z-test** for significance and displays warnings for small sample sizes. This is a pragmatic MVP choice.

**What it does:**
- Calculates conversion rate for each variant
- Computes lift (percentage change)
- Runs 2-proportion z-test for statistical significance (p < 0.05)
- Provides 95% confidence interval for the difference
- Warns if sample size is too small (< 100 exposures per variant)
- Warns if sample allocation is imbalanced

**What it doesn't do:**
- Bayesian analysis
- Multi-armed bandit optimization
- Sequential testing / early stopping
- Multiple hypothesis correction

## Optional AI Readout

Signal Dash can generate AI-powered readouts using OpenAI or Anthropic.

**To enable:**

1. Edit `.env`:
```bash
LLM_PROVIDER=openai  # or 'anthropic'
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...
```

2. Restart the server

**Fallback behavior:** If no API key is configured or the AI call fails, Signal Dash generates a deterministic summary template.

## Screenshots

### Dashboard

![Dashboard](docs/screenshots/dashboard.png)
*Main experiment dashboard showing experiment list with status workflow*

### Experiment Detail

![Experiment Detail](docs/screenshots/experiment-detail.png)
*Experiment detail view with variant stats, visualization, and analysis*

### Readout

![Readout](docs/screenshots/readout.png)
*AI-generated readout with decision form*

> **Note**: To add screenshots, run the app locally and capture images following instructions in [docs/screenshots/README.md](docs/screenshots/README.md)

## Docs

- [docs/PRD.md](docs/PRD.md) - Product requirements
- [docs/METRICS_SPEC.md](docs/METRICS_SPEC.md) - Metrics definitions
- [docs/EXPERIMENT_SOP.md](docs/EXPERIMENT_SOP.md) - Standard operating procedure
- [docs/RUNBOOK.md](docs/RUNBOOK.md) - Operational runbook
- [docs/ADR-001-stack.md](docs/ADR-001-stack.md) - Stack decision
- [docs/ADR-002-events-schema.md](docs/ADR-002-events-schema.md) - Events schema decision

## Running Tests

```bash
npm test
```

Tests cover the statistical calculations including:
- Normal CDF approximation
- 2-proportion z-test
- Confidence intervals
- Lift calculations
- Sample size warnings

## Project Structure

```
signal-dash/
├── docs/              # Documentation
├── migrations/        # SQL migrations
├── scripts/           # Migration & seed scripts
├── src/
│   ├── routes/        # Express routes
│   ├── services/      # Business logic (stats, readout)
│   ├── views/         # EJS templates
│   ├── app.js         # Express app
│   ├── config.js      # Configuration
│   └── db.js          # Database connection
├── public/            # Static assets (CSS)
├── test/              # Unit tests
└── docker-compose.yml # Postgres setup
```

## What I built

- **Intake + workflow states** (Draft → Review → Running → Readout → Shipped/Killed)
- **Event tracking endpoint** (`POST /api/track`)
- **SQL-based analysis + visualization** (Chart.js)
- **Optional AI-generated readouts** (with non-AI fallback)

## Key tradeoffs

- **Server-rendered UI** to reduce complexity
- **Simple z-test** for explainable significance
- **AI is optional** and has a fallback
- **No randomization engine** (assumes upstream assignment)
- **DB constraints first** (CHECK constraint + unique index) to prevent bad data before it reaches analysis

## What I'd do next

- **Auth** (basic password or OAuth)
- **More metrics/funnels** (multi-step conversions)
- **Better dedup + assignment strategy**
- **Scheduled reporting** / anomaly detection
- **Multi-variant support** (> 2 variants)
- **Bayesian analysis** option

## License

MIT
