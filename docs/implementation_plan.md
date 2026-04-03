# EarnGuard Implementation Plan

This document outlines the step-by-step roadmap to implement the full gig-worker insurance system as defined in `docs/documentation.md`. It separates the architecture into distinct, actionable phases to ensure smooth integration of the API Gateway, ML Services, Disruption Engine, and Database.

---

## Phase 1: Foundation & PostgreSQL Database
**Goal:** Establish the persistent memory of the system.

1. **Environment Setup:** Set up local `.env` files and Postgres database strings.
2. **Execute Database Scripts:** Implement the exact schema outlined in `documentation.md`:
   - `workers`, `wallet_ledger` (double entry), `policies`, `claims`, `ml_inference_logs`, `notifications`, `devices`, `outbox_events`.
3. **API Gateway Boilerplate:** Initialize a Node.js + Express application acting as the primary BFF (Backend For Frontend). Add basic global error handling and generic Zod validation middleware.

---

## Phase 2: External Data Simulator (Mock Service)
**Goal:** Build the mock API that fakes real-world disruption signals for testing and deterministic demos.

1. **Service Init:** Create a simple internal Node.js service running on port 4000.
2. **Signal Endpoints (GET):**
   - `/weather` (returns rainfall mm, alerts)
   - `/traffic` (returns precalculated trafficRiskScore, avgSpeed, incidentCount)
   - `/platform` (returns order drops, delays)
   - `/news` (returns risk tags like STRIKE)
3. **Admin Controllers (POST):** Create the `/admin/*` routes to securely force extreme conditions (e.g., forcing a 100mm rainfall) to ensure your disruption workers trigger correctly on command.

---

## Phase 3: Machine Learning Service
**Goal:** Finalize the predictive logic and make it callable from the internal backend.

1. **Monthly Premium Base Model (`/predict/monthly`):** Ensure the XGBoost regression engine successfully takes 4 weeks of data and returns base pricing.
2. **Weekly Risk Adjustment (LLM) (`/calculate-weekly-price`):** Finalize the Gemini LLM integration to take base prices + real-time anomalies to return the `final_price` and percentage hikes.
3. **Resiliency:** Ensure fallback mechanisms (returning cached prices if the ML container is down) work correctly.

---

## Phase 4: Core API Gateway Services (Synchronous Apps)
**Goal:** Power the frontend user interfaces for workers.

1. **Auth Service:** Complete `/api/v1/auth/login` issuing JWTs.
2. **Worker Profile:** Complete `/api/v1/workers/me` focusing on dynamically computing `walletBalance` by querying the ledger. 
3. **Policy Service:**
   - **Generate Quote:** Hits Redis first, then the ML Service, saves as `DRAFT`.
   - **Activate Policy:** Applies exact idempotency keys to securely execute an atomic SQL transaction charging the wallet and changing the policy to `ACTIVE`.
4. **Wallet Service:** Retrieve paginated read-only transaction history logs.

---

## Phase 5: BullMQ Asynchronous Disruption Pipeline
**Goal:** The heart of the system—automatically issuing payout claims based on world events.

1. **Redis Queue Setup:** Implement BullMQ connection and configure a worker node. 
2. **The 15-Min Cron Job:** Setup the recurring `Detection` job.
3. **Pipeline Step 1 (Zone Mapping):** Fetch all workers, mapped securely by their `zone_id`.
4. **Pipeline Step 2 (Collect Signals):** For every zone, asynchronously ping the Mock Service APIs created in Phase 2.
5. **Pipeline Step 3 (Convert to Scores):** Implement the rules engine and News NLP:
   - Filter heuristics for weather and platform issues.
   - Take `trafficRiskScore` directly from Traffic API.
   - **News Risk (Hybrid Approach):** Extract risk via heuristic keyword matching first. If ambiguous, fall back to lightweight NLP sentiment analysis. Output bounded `newsRisk`.
   - Combine scores: `finalRisk = 0.35*weather + 0.30*traffic + 0.20*platform + 0.15*news`.
6. **Pipeline Step 4 (Claim Execution Computations):** If `finalRisk > threshold`, execute the math formula to calculate `payout`.
7. **Pipeline Resolution:** Perform a SQL transaction inserting into `claims`, inserting the CREDIT operation to `wallet_ledger`, and inserting an alert to `outbox_events`.

---

## Phase 6: Outbox & Notifications
**Goal:** Inform workers natively about system payouts securely.

1. **Push Notifications:** Set up FCM API connections and table maps for devices.
2. **Outbox Sweeper Job:** Create a standalone BullMQ worker that looks at `outbox_events` every 5 seconds. If a claim payout event exists, it securely executes the FCM push to the worker device, and marks the event as `PROCESSED`.
3. **Admin Dashboard Integrations (Optional):** Ensure endpoints exist for aggregating active policies, risk maps, and mock Stripe withdrawals to complete the demo loop.
