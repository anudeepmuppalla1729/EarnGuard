# EarnGuard — Full Setup Guide

Complete instructions to set up and run all EarnGuard services locally from scratch.

---

## Architecture Overview

EarnGuard runs **4 independent services** that communicate with each other:

| # | Service | Port | Directory | Tech Stack |
|---|---------|------|-----------|------------|
| 1 | **Mock Simulator Server** | `4000` | `mock_servers/` | Node.js + Express + PostgreSQL |
| 2 | **ML Pricing Service** | `8000` | `ml_services/` | Python + FastAPI + XGBoost + Gemini |
| 3 | **Main Backend Server** | `3000` | `server/` | Node.js + Express + PostgreSQL + Redis (BullMQ) |
| 4 | **Mobile App** | `8081` | `mobile/` | React Native + Expo |

**Startup Order:** Prerequisites → Mock Server → ML Service → Main Server → Mobile App

---

## Prerequisites

Before starting, ensure you have the following installed:

| Tool | Min Version | Check Command | Install Guide |
|------|-------------|---------------|---------------|
| **Node.js** | v18+ | `node --version` | [nodejs.org](https://nodejs.org) |
| **npm** | v9+ | `npm --version` | Comes with Node.js |
| **Python** | v3.10+ | `python --version` | [python.org](https://python.org) |
| **PostgreSQL** | v15+ | `psql --version` | [postgresql.org](https://postgresql.org) |
| **Redis** | v7+ | `redis-cli ping` | [redis.io](https://redis.io) (or use Docker) |
| **Expo CLI** | Latest | `npx expo --version` | `npm install -g expo-cli` |
| **Expo Go App** | Latest | — | Download on your phone from App Store / Play Store |

---

## Step 1 — Database Setup

### 1.1 Create PostgreSQL Databases

Open a terminal and connect to PostgreSQL:

```bash
psql -U postgres
```

Create the two databases:

```sql
CREATE DATABASE earnguard;
CREATE DATABASE mock;
```

Exit psql with `\q`.

### 1.2 Initialize the Main Database Schema

```bash
psql -U postgres -d earnguard -f server/scripts/init_db.sql
```

This creates all tables (`workers`, `policies`, `claims`, `wallet_ledger`, `city_pricing`, `zones`, `cities`, etc.) and seeds Hyderabad (C1) with two zones (Z1, Z2).

### 1.3 Initialize the Mock Database Schema

```bash
cd mock_servers
npx ts-node scripts/runInitMockDb.ts
```

This creates mock tables (`platform_workers`, `mock_weather_states`, `mock_platform_states`, `mock_news_states`, `mock_traffic_states`, etc.) and seeds 6 curated gig workers.

---

## Step 2 — Mock Simulator Server (Port 4000)

The mock server simulates external third-party APIs: weather, news headlines, traffic, platform states, and bank accounts.

### 2.1 Install Dependencies

```bash
cd mock_servers
npm install
```

### 2.2 Configure Environment

Create `mock_servers/.env`:

```env
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/mock
```

> **Note:** Special characters in your password must be URL-encoded. For example, `@` becomes `%40`.

### 2.3 Run the Server

```bash
npm run dev
```

You should see:

```
[Database] Connected to Mock PostgreSQL Database successfully.
Mock Simulator Backend running on http://localhost:4000
```

### 2.4 Verify

```bash
curl http://localhost:4000/weather?cityId=C1
curl http://localhost:4000/bank/accounts
```

---

## Step 3 — ML Pricing Service (Port 8000)

The ML service hosts two models:
- **City Base Price Calculator** — XGBoost model predicting monthly base insurance premium
- **Weekly Additional Amount Calculator** — Gemini 2.5 Flash LLM risk assessment + deterministic pricing

### 3.1 Create Python Virtual Environment

```bash
cd ml_services
python -m venv .venv
```

### 3.2 Activate the Virtual Environment

**Windows (PowerShell):**
```powershell
.venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
.venv\Scripts\activate.bat
```

**macOS / Linux:**
```bash
source .venv/bin/activate
```

### 3.3 Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3.4 Configure Environment

Create `ml_services/.env`:

```env
GOOGLE_API_KEY=YOUR_GEMINI_API_KEY
```

> Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).

### 3.5 Run the ML Service

```bash
python app.py
```

Or equivalently:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

You should see:

```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete. ML Models Loaded.
```

### 3.6 Verify

```bash
curl http://localhost:8000/api/v1/health
curl http://localhost:8000/weekly-health
```

---

## Step 4 — Main Backend Server (Port 3000)

The core Node.js server handles authentication, policy management, claims processing, wallet ledger, and background disruption detection (BullMQ).

### 4.1 Start Redis

The server requires Redis for BullMQ background job queues.

**Using Docker (recommended):**
```bash
docker run -d --name earnguard-redis -p 6379:6379 redis:7-alpine
```

**Or install natively** — see [redis.io/docs/install](https://redis.io/docs/install/)

Verify Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

### 4.2 Install Dependencies

```bash
cd server
npm install
```

### 4.3 Configure Environment

Create `server/.env`:

```env
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/earnguard
JWT_SECRET=your_secure_jwt_secret_here
MOCK_API_URL=http://localhost:4000
ML_API_URL=http://localhost:8000
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Connection string to the `earnguard` PostgreSQL database |
| `JWT_SECRET` | Secret key for signing JWT access tokens |
| `MOCK_API_URL` | URL of the mock simulator server (Step 2) |
| `ML_API_URL` | URL of the ML pricing service (Step 3) |

### 4.4 Run the Server

```bash
npm run dev
```

You should see:

```
Database connected successfully
BullMQ: Scheduled Disruption Detection cron (every 15 mins)
BullMQ: Scheduled Outbox Sweeper (every 10 secs)
BullMQ: Scheduled ML Pricing jobs (Monthly/Weekly)
Server is running on port 3000
```

### 4.5 Populate ML Pricing Data (One-Time)

With all three servers running (mock + ML + main), populate the database with ML-computed pricing:

```bash
cd server
npx ts-node scripts/populateMlDb.ts
```

This calls the ML service to compute the base price and weekly additional price for city C1 (Hyderabad) and writes the results into the `city_pricing` table.

### 4.6 Verify

```bash
curl http://localhost:3000/api/v1/auth/me
# Should return 401 (unauthenticated) — this confirms the server is running
```

---

## Step 5 — Mobile App (Expo)

### 5.1 Install Dependencies

```bash
cd mobile
npm install
```

### 5.2 Configure Environment

Create `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000
```

> **Important:** Replace `YOUR_LOCAL_IP` with your computer's local network IP (e.g. `192.168.29.136`), **not** `localhost`.
>
> Find your IP:
> - **Windows:** `ipconfig` → look for IPv4 Address under Wi-Fi
> - **macOS:** `ifconfig en0` → look for `inet`
> - **Linux:** `hostname -I`
>
> Your phone and computer must be on the **same Wi-Fi network**.

### 5.3 Run the App

```bash
npx expo start
```

This opens the Expo developer tools. Scan the QR code with:
- **Android:** Expo Go app
- **iOS:** Camera app → tap the Expo banner

---

## Complete Startup Sequence (Summary)

Open **5 terminal windows** and run in this order:

```
Terminal 1 — Redis:
  > redis-server

Terminal 2 — Mock Server:
  > cd mock_servers && npm run dev

Terminal 3 — ML Service:
  > cd ml_services && .venv\Scripts\activate && python app.py

Terminal 4 — Main Server:
  > cd server && npm run dev

Terminal 5 — Mobile:
  > cd mobile && npx expo start
```

---

## Troubleshooting

### "Account already exists" on signup
The `platform_worker_id` must be unique per user. If you reset the main DB without resetting the mock DB, stale worker IDs can cause collisions. Solution: re-run `init_db.sql` and `runInitMockDb.ts`.

### Mobile app shows "Network Error"
- Ensure `EXPO_PUBLIC_API_URL` in `mobile/.env` uses your actual LAN IP, not `localhost`
- Check both phone and PC are on the same Wi-Fi network
- Check that `server` is running on port 3000

### Redis connection refused
BullMQ background workers require Redis running on `localhost:6379`. Start Redis before starting the main server.

### ML Service model loading errors
Ensure you activated the virtual environment (`source .venv/bin/activate` or `.venv\Scripts\activate`) before running `python app.py`.

### PostgreSQL password with special characters
URL-encode special characters in `DATABASE_URL`:
- `@` → `%40`
- `#` → `%23`
- `!` → `%21`

---

## Project Structure

```
EarnGuard/
├── server/              # Main backend (Express + BullMQ)
│   ├── src/
│   │   ├── routes/      # auth, policies, claims, wallet, workers
│   │   ├── workers/     # disruptionWorker, mlPricingWorker, outboxWorker
│   │   ├── queue/       # BullMQ job schedulers
│   │   ├── middlewares/  # auth, validation
│   │   └── db/          # PostgreSQL pool
│   └── scripts/         # init_db.sql, populateMlDb.ts
│
├── mock_servers/        # Mock third-party APIs
│   ├── src/app.ts       # Weather, platform, news, traffic, bank endpoints
│   └── scripts/         # init_mock_db.sql, runInitMockDb.ts
│
├── ml_services/         # Python ML pricing models
│   ├── app.py           # FastAPI entry point
│   ├── api/             # XGBoost base price prediction routes
│   ├── city_base_price_calc_model/    # Trained XGBoost model + dataset
│   └── weekly_additional_amount_calc_model/  # Gemini LLM risk pricing
│
└── mobile/              # React Native Expo app
    ├── src/
    │   ├── screens/     # Home, Policy, Claims, Profile, Auth flow
    │   ├── store/       # Zustand state (auth, policy, claims, wallet)
    │   ├── api/         # API client (Axios + token refresh)
    │   ├── navigation/  # Stack + Tab navigators
    │   ├── theme/       # Design tokens, responsive scaling
    │   └── components/  # Shared UI components
    └── App.tsx          # Root entry
```
