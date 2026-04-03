# EarnGuard Project Architecture & Status

This document serves as a comprehensive outline of the entire foundation built for the EarnGuard micro-insurance ecosystem across its three primary architectural pillars: the Main API Gateway, the Background ML Pipeline, and the External Mock Simulator.

---

## 1. Relational Database Geometry (PostgreSQL)

The database schema has completely shifted into a robust hierarchical topology utilizing rigid foreign-key validations.

*   **`cities` & `zones`**: We structurally mapped 120+ dark store environments. Every worker MUST exist within a tracked zone nested inside a target city.
*   **`workers`**: Standard identity table mapping a driver to a `zone_id` using purely standard UUIDs.
*   **`zone_pricing`**: A state ledger dynamically overwritten by asynchronous ML batch pipelines storing exactly the numeric `base_price` and `weekly_additional_price` active per dark store.
*   **`wallet_ledger`**: A strict double-entry ledger specifically utilized FOR CLAIMS ONLY. This avoids arbitrary user deposits.
*   **`policies` & `claims`**: Active tracking records where `policies` enforce global idempotency locking logically inside Postgres. 

---

## 2. API Gateway & Core Workflow (`/server`)

The raw synchronous interfaces that external clients and drivers connect to:

1.  **Auth Module (`/api/v1/auth`)**: Standard `bcryptjs` and `jsonwebtoken` middleware issuing secure generic JWTs for standard HTTP access.
2.  **Worker Profiles (`/api/v1/workers/me`)**: Dynamically resolves the driver's exact `walletBalance` by iterating natively over all their positive `CREDIT` minus negative `DEBIT` values within the database securely.
3.  **Policy Activation (`/api/v1/policies/activate`)**: Mocks an external banking transaction completely without interacting with wallet ledgers natively, issuing secure lock state (`SKIP LOCKED FOR UPDATE`) strictly moving rules from `DRAFT` to `ACTIVE`.

---

## 3. Mock Data Platform (`/mock_servers`)

A completely standalone local Express engine hosted natively on `:4000` executing static testing arrays logically isolated from backend state.

*   `GET /weather?cityId=X` / `GET /traffic?zoneId=X` / `GET /news` : Highly deterministic data endpoints simulating external API signals.
*   **`POST /platform/active-workers`**: Simulates the Zepto/Blinkit API matching logic. Accepts an array of our database UUIDs, processing them statically, and returning ~80% of them as "currently clocked in online" drivers to ensure payout math only affects actively online gig workers.
*   `POST /admin/*` : Override endpoints natively forcing severe 'disruptions' into the queue testing pipelines automatically.

---

## 4. The Heartbeat: Asynchronous Execution (BullMQ)

To stitch everything seamlessly automatically, we constructed the `bullmq` worker pools powered via native Redis caches.

### `disruptionWorker.ts`
Runs continuously natively inside `cron` loop (Every 15-minutes). 
1. Queries the PostgreSQL table resolving exactly all **currently active zones**.
2. Synchronizes deeply with `mock_servers` `POST /active-workers` explicitly fetching which drivers are actively moving freight.
3. Downloads native Signal Data (`Traffic`, `Weather`, `News`, `Platform`).
4. Cross-computes the **Hybrid News Heuristic** against strict Math coefficients measuring exact Risk indexes.
5. Issues automated Claims tracking logic if the scale passes boundary limits resulting securely via standard database transactions.

### `mlPricingWorker.ts`
Designed specifically to loop outwards reaching the Python FastAPI layers (`:8000`).
1. **Monthly Jobs**: Targets `/api/v1/predict/monthly`, scraping historical datasets rendering exactly the native Core Pricing model stored recursively against Postgres `zone_pricing`.
2. **Weekly Jobs**: Targets `/calculate-weekly-price`, predicting acute transit spikes and appending exact decimal variations natively resolving weekly risks.

### `outboxWorker.ts`
Looping dynamically roughly every 10 seconds checking Postgres for unprocessed Notification events sweeping rows and emitting simulated FCM push alerts.
