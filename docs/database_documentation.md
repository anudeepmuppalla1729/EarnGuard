# EarnGuard Relational Database Architecture

This document exhaustively details the rigid, modular PostgreSQL schema engineered to power the EarnGuard micro-insurance ecosystem natively.

## 1. Geographical & ML Pricing Foundations

The core of our dynamic risk modeling revolves around splitting metropolitan areas into discrete "Zones" (Dark Stores / Geo-fences), and mapping asynchronous XGBoost predictions to them automatically.

### **`cities`**
*   **Purpose**: The highest level mapping of the service areas.
*   **Fields**: `id` UUID, `name` TEXT, `state` TEXT, `country` TEXT
*   **Relations**: Exists as the primary architectural umbrella for multiple delivery `zones`.

### **`zones`**
*   **Purpose**: A specific boundary where workers operate (e.g., essentially representing a Zepto/Blinkit Dark Store perimeter).
*   **Fields**: `id` TEXT, `city_id` TEXT, `name` TEXT, `boundaries_geojson` JSONB
*   **Relations**: Child of `cities`. Binds strictly to `workers`.

### **`city_pricing`** (The ML Ledger)
*   **Purpose**: Stores the real-time aggregated Risk Premiums synchronized constantly by the BullMQ Python pipeline natively mapping full metropolitan bounds.
*   **Fields**:
    *   `base_price NUMERIC`: The XGBoost Monthly historical calculated average.
    *   `weekly_additional_price NUMERIC`: The Gemini LLM real-time risk hike dynamically added.
    *   `weekly_reason TEXT`: The explicit LLM reasoning behind the hike to justify costs in the Frontend UI!
*   **Relations**: 1-to-1 strict mapping with `cities(id)`.

### **`ml_weekly_context`** (The Historical Engine)
*   **Purpose**: An infinitely expanding ledger tracking real-time API intercepts from mock simulators (Weather variations, Outage frequencies, and dynamic Economic Market markers). Every week, active metrics are aggressively locked here. The Monthly Predictor then securely executes `ORDER BY created_at LIMIT 4` extracting the precise array data natively mapping Python's sequential XGBoost constraints instantly!
*   **Fields**: 
    *   **Identity Roots**: `id`, `city_id`
    *   **Weather Vectors**: `rainfall_mm`, `temperature_avg`
    *   **Market Logistics**: `total_orders_weekly`, `demand_stability_orders` 
    *   **Disruption Signals**: `disruption_freq_weekly` (total outages), `avg_disruption_duration_hrs`
    *   **Economic Context**: `city_tier`, `city_rank`, `median_income_weekly`, `holiday_flag`, `event_flag`
    *   **Chronological Pin**: `created_at`

---

## 2. Platform Core & Policies

### **`workers`**
*   **Purpose**: App users (Delivery agents). Contains Authentication parameters.
*   **Fields**: `id`, `email`, `password_hash`, `name`, `platform` (ZEPTO, BLINKIT).
*   **Relations**: Belongs to exactly 1 `zone`.

### **`policies`**
*   **Purpose**: The insurance document binding the worker to security criteria atomically.
*   **Fields**: 
    *   `status`: Transitions from `DRAFT` ➔ `ACTIVE` ➔ `EXPIRED`.
    *   `premium_amount`: The sum of the `base_price` and `weekly_additional_price` at the exact moment of DRAFTing.
    *   `max_payout`: A mathematically constrained ceiling limit organically locking payout amounts.
*   **Relations**: Tied permanently to a `worker_id` and the `city_id`.

---

## 3. Asynchronous Claim Lifecycles & Finance

### **`wallet_ledger`**
*   **Purpose**: A completely immutable append-only ledger managing finances organically. EarnGuard ONLY uses Wallet for depositing CLAIM Payouts (the premium is paid via simulated Bank Card API!).
*   **Fields**: `amount` NUMERIC, `type` (CREDIT), `category` (CLAIM_PAYOUT).
*   **Relations**: Maps to `workers(id)`.

### **`claims`**
*   **Purpose**: Records physical disruption interventions approved by the engine organically.
*   **Fields**: `payout_amount`, `risk_score`, `disruption_type`, `status` (PENDING, APPROVED).
*   **Relations**: Tied to `policies` and `workers`.

### **`outbox_events`**
*   **Purpose**: Acts as an atomic transaction buffer! When a claim is awarded, a row is simultaneously created here securely preventing dropped Firebase Cloud Messaging (FCM) notifications if the NodeJS API dies!
*   **Fields**: `event_type` TEXT, `payload` JSONB, `status` (PENDING).

### **`notifications` & `devices`**
*   **Purpose**: Stores the worker's native `fcm_token` and historical read/unread Alerts directly synchronized by the notification sweeper natively.
