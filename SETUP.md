# EarnGuard — Local Development Setup Guide

This guide provides step-by-step instructions to set up and run the entire EarnGuard ecosystem on your local machine.

---

## 🏗️ Architecture & Ports

EarnGuard consists of 5 main components that must be running simultaneously:

| Service | Port | Directory | Description |
|---------|------|-----------|-------------|
| **Simulation Server** | `4000` | `simulation_servers/` | Mocks external signals (Weather, News, Platform) |
| **ML Pricing Service** | `8000` | `ml_services/` | Python FastAPI service for risk & price prediction |
| **Main Backend** | `3000` | `server/` | Core logic, BullMQ workers, and Payout engine |
| **Admin Dashboard** | `5173` | `admin/` | Vite/React portal for monitoring health and claims |
| **Mobile App** | `8081` | `mobile/` | React Native (Expo) app for delivery partners |

---

## 🛠️ Prerequisites

Ensure you have the following installed:
- **Node.js** (v18+) & **npm**
- **Python** (3.10+)
- **PostgreSQL** (Local or Supabase)
- **Redis** (Local via Docker or Redis Cloud)
- **Expo Go** (On your mobile device)

---

## 🚀 Step-by-Step Setup

### 1. Database Setup
Create two separate databases in your PostgreSQL instance:
1. `earnguard` (Main system data)
2. `simulation` (Mock external data)

### 2. Simulation Server (Port 4000)
1. `cd simulation_servers`
2. `npm install`
3. Create `.env`:
   ```env
   DATABASE_URL=postgresql://user:pass@localhost:5432/simulation
   PORT=4000
   ```
4. Initialize DB: `npx ts-node scripts/runInitMockDb.ts`
5. Start: `npm run dev`

### 3. ML Pricing Service (Port 8000)
1. `cd ml_services`
2. Create Virtual Env: `python -m venv .venv`
3. Activate:
   - Windows: `.venv\Scripts\activate`
   - Mac/Linux: `source .venv/bin/activate`
4. `pip install -r requirements.txt`
5. Create `.env`:
   ```env
   GOOGLE_API_KEY=your_gemini_api_key
   ```
6. Start: `python app.py`

### 4. Main Backend Server (Port 3000)
1. `cd server`
2. `npm install`
3. Create `.env`:
   ```env
   DATABASE_URL=postgresql://user:pass@localhost:5432/earnguard
   JWT_SECRET=your_jwt_secret
   REDIS_HOST=localhost
   REDIS_PORT=6379
   SIM_URL=http://localhost:4000
   ML_URL=http://localhost:8000
   ```
4. Initialize DB: `npx ts-node scripts/runInitDb.ts`
5. Start: `npm run dev`

### 5. Admin Dashboard (Vite)
1. `cd admin`
2. `npm install`
3. Create `.env`:
   ```env
   VITE_SERVER_URL=http://localhost:3000
   ```
4. Start: `npm run dev`

### 6. Mobile App (Expo)
1. `cd mobile`
2. `npm install`
3. Create `.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000
   ```
   *(Find your IP using `ipconfig` or `ifconfig`. Do NOT use localhost here)*
4. Start: `npx expo start`

---

## 🚦 Recommended Startup Order

Open 5 terminals and run:
1. **Redis** (Docker: `docker run -p 6379:6379 redis`)
2. **Simulation Server** (`npm run dev` in `simulation_servers`)
3. **ML Service** (`python app.py` in `ml_services`)
4. **Main Server** (`npm run dev` in `server`)
5. **Admin/Mobile** (Your choice)

---

## 🧪 Seeding ML Data
Once everything is running, run this one-time script to populate initial pricing:
`cd server && npx ts-node scripts/populateMlDb.ts`
