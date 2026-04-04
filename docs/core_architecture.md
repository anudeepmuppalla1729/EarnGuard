# EarnGuard Core Backend Architecture

This document details the internal architecture, background processes, and service communication of the EarnGuard backend.

---

## System Overview

The core backend is built on **Node.js** using **Express.js**, with **PostgreSQL** for persistence and **Redis** for asynchronous job management via **BullMQ**.

### Key Components

| Component | Responsibility |
|-----------|----------------|
| **API Server** | Handles mobile client requests (Auth, Policy, Claims, Wallet). |
| **BullMQ Jobs** | Periodic and event-driven background tasks. |
| **Redis** | Message broker for queues and state store for distributed locks. |
| **PostgreSQL** | Source of truth for workers, policies, claims, and pricing data. |
| **Mock Simulator** | Simulates external world signals (Weather, News, Platform states). |

---

## Async Background Workers (BullMQ)

EarnGuard uses an "Autonomous Insurance" model where state transitions (like claim payouts) are triggered by background environmental monitoring rather than manual user input.

### 1. Disruption Detection Worker (`disruptionWorker.ts`)
The heartbeat of the system.
- **Interval**: Runs every 15 minutes (configurable via cron).
- **Process**:
    1.  **Sensing**: Polls the **Mock Simulator** for live weather, news, and platform activity in target zones.
    2.  **Risk Analysis**: Computes a hybrid risk score (0.0 - 1.0) based on headline sentiment (heuristic/LLM) and environmental triggers (heavy rain, delivery delays).
    3.  **Trigger**: If risk exceeds `0.65`, a disruption is confirmed for that zone.
    4.  **Action**: Automatically calculates payouts for all active policies in the zone and prepares claim records.

### 2. ML Pricing Sync Worker (`mlPricingWorker.ts`)
Ensures the backend pricing data is always competitive and accurate.
- **Schedules**:
    - **Monthly**: Triggers the `/api/v1/predict/monthly` ML endpoint to compute the base insurance premium for each city based on historical delivery trends.
    - **Weekly**: Triggers the `/calculate-weekly-price` ML endpoint to compute "risk-adjusted" add-ons based on short-term weather/news forecasts.
- **Data Flow**: Fetches predictions from the **ML FastAPI** service and updates the `city_pricing` table.

---

## Database Architecture (PostgreSQL)

The database is designed for high-frequency updates and strict consistency using transactions.

- **Primary Tables**:
    - `workers`: Registered gig workers and their platform mapping.
    - `policies`: Active and historical insurance plans with pricing and coverage details.
    - `claims`: Records of automated payouts triggered by disruptions.
    - `wallet_ledger`: Immutable ledger for premium debits and claim credits.
    - `city_pricing`: Central store for ML-calculated quotes.
    - `ml_weekly_context`: Historical log of environmental factors used for ML training.

---

## Mock Simulator Communication

The background workers rely on the **Mock Simulator (Port 4000)** to function. This mimics third-party integration that would normally come from weather providers (like OpenWeather) or platform APIs (like Uber/Zomato).

- **Communication Method**: Internal RESTful API calls.
- **Signals Simulated**:
    - `GET /weather`: Temperature, rainfall, rainfall intensity.
    - `GET /news`: Local event headlines (strikes, floods, protests).
    - `POST /platform/active-workers`: Real-time worker counts to verify local platform health.
    - `POST /bank/pay`: Mocked bank debit flows for premium payments.

> [!NOTE]
> The segregation of the Mock Server ensures that the core backend logic can be tested against deterministic scenarios (like forcing a flood) without needing live external API keys.
