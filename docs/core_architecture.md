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
The sensing heartbeat of the system.
- **Interval**: Runs every **3 minutes** (standard) or **1 minute** (rapid test).
- **Process**:
    1.  **Sensing**: Polls the **Mock Simulator** for live weather, news, traffic, and platform order drops.
    2.  **Prolog Evaluation**: Headlines are parsed through an embedded **Tau-Prolog** engine to extract structural risk values.
    3.  **Snapshotting**: Logs a raw `risk_score` and `order_drop_percentage` into the `zone_risk_snapshots` table for the specific zone.
    4.  **No Payout**: This worker *only* senses and logs; it does not issue money.

### 2. Payout Execution Worker (`payoutWorker.ts`)
The financial logic engine.
- **Interval**: Runs every **1 hour** (Production) or **10 minutes** (Demo Mode).
- **Process**:
    1.  **Aggregation**: Computes the `AVG(risk_score)` and `MAX(order_drop_percentage)` from the last hour (or 10 mins) of snapshots.
    2.  **Validation**: Verifies if the smoothed risk exceeds the `0.50` threshold.
    3.  **Individualized Calculation**: Fetches specific worker income rates from the Simulator for that hour.
    4.  **Action**: Issues payouts using the formula: `Payout = (k * Loss) + (Remaining Loss * RiskScore)`.
    5.  **Pending State**: If the risk is high but platform drops are 0, claims are marked as **PENDING** for manual audit. always competitive and accurate.
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

> The segregation of the Mock Server ensures that the core backend logic can be tested against deterministic scenarios (like forcing a flood) without needing live external API keys.

---

## Recent Architecture Upgrades (Engine Refactor)

We've completely overhauled the disruption engine, making it vastly more intelligent, flexible, and tied directly into real-world hourly metrics rather than static heuristic assumptions.

### 🚀 What We Accomplished

#### 1. Decoupled 3-Minute Detection vs Hourly Payouts
The system operates on an asynchronously coupled cycle:
*   **Sensing (Every 3 minutes)**: The `disruptionWorker` natively polls simulation metrics (weather, platform drops, traffic) and logs granular transient anomalies into the immutable `zone_risk_snapshots` cache. This captures rapid weather spikes and brief local emergencies.
*   **Execution (Hourly Cadence)**: The `payoutWorker` executes on the top of the hour explicitly. It calculates the mathematically smoothed risk averages over the last 60 minutes (`AVG(risk_score)` and `MAX(order_drop_percentage)`) from the snapshots. If the sustained average surpasses `0.65`, structural payouts are triggered sequentially alongside a clean database scale-down (wiping older 3-minute inputs).

#### 2. Prolog Engine Validation for "News" Disruptions (`tau-prolog`)
We replaced rudimentary regex heuristics for social and environmental triggers with a declarative logic engine: **Prolog**.
*   The worker now feeds parsed news headlines into an embedded Prolog rule engine (`rules.ts`). 
*   Prolog uses structural facts (e.g., `disruption_score(flood, 0.9)`) and logic queries to evaluate multi-event sentences and definitively pull out the mathematically highest risk metric dynamically.
*   **Fixes Applied**: We securely bypassed tau-prolog limitation constraints by structuring strict quoted atoms, tuning memory depth to `500,000`, and properly managing execution cuts `!` to avoid recursive infinite loops.

#### 3. Individualized Worker Target Payouts
Instead of utilizing a static zone median income to decide how much gig workers lose, we connected the Simulation Server endpoints to return:
*   Deterministic time-of-day driven hourly rates for individual workers. 
*   If a disruption triggers, we strictly utilize the worker's personalized expected rate for that specific hour of the day when issuing the compensatory payout via the insurance wallet.

#### 4. Payout Logic Evolution: The "Pending Assessment" state
We implemented safety buffers against false-positives:
*   A high risk score alone (e.g., 0.9 due to a Cyclone) will **NOT automatically pay out**. 
*   If the local platform's `orderDropPercentage` does not confirm structural drops (>0), the claim is instead inserted as **PENDING** rather than APPROVED. These queued claims represent occurrences where the external world says "High Risk", but the platform data says "Business as usual", preserving capital pool integrity for future manual auditing.

#### 5. Architectural Coverage Scale & Cleanup
*   Added 4 new structural zones to the database: (`Gachibowli`, `Jubilee Hills`, `Banjara Hills`, and `Hitec City`).
*   Removed deprecated static DRAFT logic checks across API endpoints and modernized the TESTING Suite. Every Integration and Machine Learning Jest test now structurally adheres to the newly designed Zod Validation pipelines and dynamic policy initialization protocols. All tests natively pass flawlessly!
