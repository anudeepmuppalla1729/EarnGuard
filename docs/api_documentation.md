## 1.1 Services (Final)

| Service            | Tech              | Responsibility                                             |
| ------------------ | ----------------- | ---------------------------------------------------------- |
| API Gateway (BFF)  | Node.js + Express | Auth, orchestration, aggregation                           |
| ML Service         | Python + FastAPI  | Risk scoring, premium prediction                           |
| Async Engine       | Redis + BullMQ    | Background jobs (disruption detection, outbox)             |
| DB                 | PostgreSQL        | All persistence (ledger, policies, ML logs, notifications) |
| External Simulator | Node.js           | Weather, platform, news mocks                              |

---

## 1.2 Data Flow (Cleaned)

### Synchronous Flow (Quote)

Client → API → Redis (cache) → ML → API → Postgres → Client

### Asynchronous Flow (Claims)

BullMQ Worker →
Mock Service →
Traffic Engine →
Disruption Engine →
Claim Service →
Wallet Ledger →
Outbox →
Notification Worker

---

### Claim Processing Flow
```
1. BullMQ Worker fetches signals from Mock Service
2. Traffic Engine computes trafficRiskScore
3. Disruption Engine computes final riskScore
4. If riskScore >= threshold:
      → Create claim
      → Compute payout (formula above)
      → Insert wallet ledger (CREDIT)
      → Insert outbox event
5. Notification worker sends FCM push
```
# 2. POSTGRESQL SCHEMA (PRODUCTION)

## 2.1 Users / Workers

```sql
CREATE TABLE workers (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    city_id TEXT NOT NULL,
    zone_id TEXT NOT NULL,
    platform TEXT CHECK (platform IN ('ZEPTO','BLINKIT')),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 2.2 Wallet (DOUBLE ENTRY LEDGER)

```sql
CREATE TABLE wallet_ledger (
    id UUID PRIMARY KEY,
    worker_id UUID REFERENCES workers(id),
    amount NUMERIC(12,2) NOT NULL,
    type TEXT CHECK (type IN ('CREDIT','DEBIT')),
    category TEXT CHECK (
        category IN ('PREMIUM_PAYMENT','CLAIM_PAYOUT','TOPUP')
    ),
    reference_id UUID,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 2.3 Policies

```sql
CREATE TABLE policies (
    id UUID PRIMARY KEY,
    worker_id UUID REFERENCES workers(id),
    city_id TEXT NOT NULL,
    status TEXT CHECK (status IN ('DRAFT','ACTIVE','EXPIRED')),
    premium_amount NUMERIC(10,2),
    max_payout NUMERIC(10,2),
    coverage_multiplier NUMERIC(4,2),
    activated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 2.4 Claims

```sql
CREATE TABLE claims (
    id UUID PRIMARY KEY,
    policy_id UUID REFERENCES policies(id),
    worker_id UUID REFERENCES workers(id),
    payout_amount NUMERIC(10,2),
    risk_score NUMERIC(4,2),
    severity_multiplier NUMERIC(4,2),
    disruption_type TEXT,
    status TEXT CHECK (status IN ('APPROVED','REJECTED','PENDING')),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 2.5 ML Historical Engine Context (`ml_weekly_context`)

```sql
CREATE TABLE ml_weekly_context (
    id UUID PRIMARY KEY,
    city_id TEXT REFERENCES cities(id),
    rainfall_mm NUMERIC(10,2),
    temperature_avg NUMERIC(10,2),
    total_orders_weekly NUMERIC(10,2),
    disruption_freq_weekly NUMERIC(10,2),
    avg_disruption_duration_hrs NUMERIC(10,2),
    demand_stability_orders NUMERIC(10,2),
    holiday_flag INTEGER DEFAULT 0,
    event_flag INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 2.6 Notifications

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    worker_id UUID,
    title TEXT,
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 2.7 Devices (FCM)

```sql
CREATE TABLE devices (
    id UUID PRIMARY KEY,
    worker_id UUID,
    fcm_token TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 2.8 Outbox Pattern

```sql
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY,
    event_type TEXT,
    payload JSONB,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

# 3. API DOCUMENTATION (STANDARDIZED)

Reference base conventions: 

---

# 3.1 AUTH SERVICE

---

## Login

**Endpoint:** Login Worker
**Purpose:** Issue JWT for authenticated access

**POST** `/api/v1/auth/login`
**Auth:** No

### Request

```json
{
  "email": "string",
  "password": "string (min 6)"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "accessToken": "jwt",
    "refreshToken": "string",
    "expiresIn": 900
  }
}
```

### Errors

* 401 INVALID_CREDENTIALS
* 400 VALIDATION_ERROR

---

## Refresh Token

**POST** `/api/v1/auth/refresh`

---

## Logout

**POST** `/api/v1/auth/logout`

---

# 3.2 WORKER SERVICE

---

## Get Profile

**GET** `/api/v1/workers/me`
**Auth:** Yes

### Purpose

Fetch unified worker profile (identity + computed wallet balance)

### Response

```json
{
  "id": "uuid",
  "email": "string",
  "cityId": "string",
  "zoneId": "string",
  "walletBalance": 120.5
}
```

---

# 3.3 POLICY SERVICE

---

## Generate Quote

**POST** `/api/v1/policies/quote`
**Auth:** Yes

### Purpose

Compute dynamic premium automatically mapping the native ML XGBoost Engine array plus explicitly extracting Live Gemini Rate variations accurately!

### Response

```json
{
  "success": true,
  "quote": {
    "policyId": "uuid",
    "base_price": 150.00,
    "additional_price": 145.00,
    "premium_amount": 295.00,
    "reason": "Heavy rain, extreme alert, and flood warnings combine with existing outages for high overall risk.",
    "max_payout": 2950.00
  }
}
```

---

# 3.3 POLICY SERVICE (CONTINUED)

---

## Activate Policy

**Endpoint Name:** Activate Policy
**Purpose:** Generate and definitively create an ACTIVE policy dynamically against real-time ML prices. (No DRAFT policies are stored beforehand to prevent DB bloat.)

**POST** `/api/v1/policies/activate`
**Auth:** Yes (WORKER)

---

### Request

```json
{
  "tier": "BASIC | STANDARD | PREMIUM",
  "idempotencyKey": "uuid"
}
```

### Validation Rules

* The worker must not already have an `ACTIVE` policy
* `tier` must be a valid policy tier
* Idempotency key required (prevent double charge)

---

### Response (Success)

```json
{
  "success": true,
  "data": {
    "policyId": "uuid",
    "status": "ACTIVE",
    "activatedAt": "timestamp",
    "bankTransactionId": "mock-tx-id"
  }
}
```

---

### Errors

| Code                     | Reason                               |
| ------------------------ | ------------------------------------ |
| 409 INVALID_POLICY_STATE | Worker already has an active policy  |
| 400 PAYMENT_FAILED       | Mock bank rejected                   |

---

### Notes

* Because we no longer store DRAFT quotes, this endpoint is fully stateless and dynamically builds and verifies the math using the background ML `city_pricing` table before insertion.

---

## List Policies

**Endpoint Name:** List Policies
**Purpose:** Fetch worker policies with pagination

**GET** `/api/v1/policies`

**Auth:** Yes

---

### Query Params

| Param  | Type   | Required | Notes                    |
| ------ | ------ | -------- | ------------------------ |
| status | ENUM   | No       | ACTIVE / DRAFT / EXPIRED |
| page   | number | Yes      | >=1                      |
| limit  | number | Yes      | <=50                     |

---

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "ACTIVE",
      "premiumAmount": 50,
      "coverageMultiplier": 1.4,
      "createdAt": "timestamp"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

# 3.4 WALLET SERVICE

---

## Get Balance

**Endpoint Name:** Get Wallet Balance
**Purpose:** Compute real-time balance from ledger

**GET** `/api/v1/wallet`
**Auth:** Yes

---

### Response

```json
{
  "success": true,
  "data": {
    "balance": 120.5,
    "currency": "INR",
    "lastUpdatedAt": "timestamp"
  }
}
```

---

### Notes (Critical)

* NEVER store balance column
* Always compute from ledger OR use materialized view

---

## Get Transactions

**Endpoint Name:** Wallet Transactions
**Purpose:** Paginated immutable ledger history

**GET** `/api/v1/wallet/transactions`
**Auth:** Yes

---

### Query Params

| Param | Type   | Required            |
| ----- | ------ | ------------------- |
| page  | number | Yes                 |
| limit | number | Yes                 |
| type  | ENUM   | No (CREDIT / DEBIT) |

---

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "amount": -50,
      "type": "DEBIT",
      "category": "PREMIUM_PAYMENT",
      "referenceId": "policy-id",
      "createdAt": "timestamp"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 40
  }
}
```

---

# 3.5 CLAIMS SERVICE

---

## Get Claims

**Endpoint Name:** List Claims
**Purpose:** View payout history

**GET** `/api/v1/claims`
**Auth:** Yes

---

### Query Params

| Param     | Type     |
| --------- | -------- |
| startDate | ISO date |
| endDate   | ISO date |
| page      | number   |
| limit     | number   |

---

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "policyId": "uuid",
      "payoutAmount": 75,
      "riskScore": 0.82,
      "severityMultiplier": 1.5,
      "disruptionType": "HEAVY_RAIN",
      "status": "APPROVED",
      "createdAt": "timestamp"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 12
  }
}
```

---

### Edge Cases

* Empty results → return `[]`, not error
* Large range → enforce max 90 days

---

# 3.6 NOTIFICATIONS

---

## Register Device

**Endpoint Name:** Register FCM Device
**Purpose:** Store device token for push notifications

**POST** `/api/v1/notifications/devices`
**Auth:** Yes

---

### Request

```json
{
  "deviceId": "uuid",
  "fcmToken": "string"
}
```

---

### Validation

* One device per worker per deviceId
* Upsert logic (avoid duplicates)

---

### Response

```json
{
  "success": true,
  "data": {
    "deviceId": "uuid",
    "registered": true
  }
}
```

---

---

## Get Notifications

**Endpoint Name:** List Notifications
**Purpose:** Fetch user alerts

**GET** `/api/v1/notifications`
**Auth:** Yes

---

### Query Params

| Param      | Type    |
| ---------- | ------- |
| page       | number  |
| limit      | number  |
| unreadOnly | boolean |

---

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Claim Credited",
      "message": "₹50 added",
      "read": false,
      "createdAt": "timestamp"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10
  }
}
```

---

# 3.7 ADMIN SERVICE

---

## Simulate Disruption

**Endpoint Name:** Simulate Disruption
**Purpose:** Force ML + claims pipeline (testing)

**POST** `/api/v1/admin/simulate-disruption`
**Auth:** ADMIN

---

### Request

```json
{
  "zoneId": "string",
  "cityId": "string",
  "forceRiskScore": 0.9
}
```

---

### Response

```json
{
  "success": true,
  "data": {
    "jobId": "bullmq-job-id",
    "status": "QUEUED"
  }
}
```

---

---

## Wallet Topup

**Endpoint Name:** Admin Wallet Credit
**Purpose:** Inject funds into worker wallet

**POST** `/api/v1/admin/workers/{id}/wallet/topup`
**Auth:** ADMIN

---

### Request

```json
{
  "amount": 100,
  "idempotencyKey": "uuid"
}
```

---

### Response

```json
{
  "success": true,
  "data": {
    "workerId": "uuid",
    "creditedAmount": 100,
    "newBalance": 220.5
  }
}
```

---

---

## System Health

**Endpoint Name:** System Health
**Purpose:** Monitor dependencies

**GET** `/api/v1/admin/system-health`
**Auth:** ADMIN

---

### Response

```json
{
  "success": true,
  "data": {
    "api": "UP",
    "database": "UP",
    "redis": "UP",
    "mlService": "UP",
    "queueDepth": 5,
    "outboxLag": 2
  }
}
```

### Internal Claim Trigger

POST `/internal/v1/claims/auto`

```json
{
  "workerId": "uuid",
  "policyId": "uuid",
  "riskScore": 0.82,
  "durationHours": 4,
  "disruptionType": "HEAVY_RAIN"
}
```


# 4. EXTERNAL DATA SIMULATOR SERVICE (NEW)

---

## 4.1 Purpose

Simulate real-world signals required for:

* ML pricing
* Disruption detection
* Claims automation

> This service ensures deterministic testing and demo reliability.

---

## 4.2 Base URL

```text
http://mock-service:4000
```

---

## 4.3 ENDPOINTS (MANDATORY)

---

### 1. Weather API

**GET** `/weather`

### Query Params

| Param  | Type   | Required |
| ------ | ------ | -------- |
| cityId | string | Yes      |

---

### Response

```json
{
  "cityId": "C1",
  "rainfall_mm": 120,
  "temperature": 30,
  "condition": "HEAVY_RAIN",
  "extreme_alert": true,
  "timestamp": "iso"
}
```

---

### 2. Platform API

**GET** `/platform`

---

### Query Params

| Param  | Type   |
| ------ | ------ |
| zoneId | string |

---

### Response

```json
{
  "zoneId": "Z1",
  "totalOrders": 1200,
  "orderDropPercentage": 65,
  "avgDeliveryTime": 40,
  "status": "DEGRADED",
  "timestamp": "iso"
}
```

---

### 3. News API

**GET** `/news`

---

### Query Params

| Param  | Type   |
| ------ | ------ |
| cityId | string |

---

### Response

```json
{
  "cityId": "C1",
  "headline": "Transport strike expected due to flooding",
  "riskTag": "SOCIAL_DISRUPTION",
  "confidence": 0.85,
  "timestamp": "iso"
}
```

---

### 4. Traffic API (zone-level)

**GET** `/traffic`

---

### Query Params

| Param  | Type   |
| ------ | ------ |
| zoneId | string |

---

### Response

```json
{
  "trafficRiskScore": 0.78,
  "avgSpeed": 15,
  "incidentCount": 1,
  "severityLevel": "HIGH"
}
```

---

---

## 4.4 ADMIN CONTROL (CRITICAL FOR DEMO)

---

### Force Weather Condition

**POST** `/admin/weather`

```json
{
  "cityId": "C1",
  "rainfall_mm": 150,
  "condition": "HEAVY_RAIN"
}
```

---

### Force Platform Outage

**POST** `/admin/platform`

```json
{
  "zoneId": "Z1",
  "orderDropPercentage": 80
}
```

---

### Force News Event

**POST** `/admin/news`

```json
{
  "cityId": "C1",
  "headline": "City-wide strike announced"
}
```

### Force Traffic Event

**POST** `/admin/traffic`

```json
{
  "zoneId": "Z1",
  "congestionLevel": "SEVERE"
}
```

---

## WHY THIS IS IMPORTANT

Without this:

* Your ML becomes non-deterministic
* Your triggers become unreliable
* Your demo can fail live

---


# 4. ML SERVICE CONTRACT (CORRECTED & FINAL)

---

## 4.0 Architecture Decision (IMPORTANT)

* ML service is a **separate FastAPI microservice**
* Accessible only internally (private network)
* Backend acts as **adapter layer** (DO NOT expose ML APIs directly to client)

---

## 4.1 Base Configuration

| Field           | Value                    |
| --------------- | ------------------------ |
| Base URL        | `http://ml-service:8000` |
| Timeout         | 2s                       |
| Retry           | 2 (exponential backoff)  |
| Circuit Breaker | Enabled                  |

---

# 4.2 MONTHLY PREMIUM BASE MODEL

---

## Endpoint

**POST** `/api/v1/predict/monthly` 

---

## Purpose (WHY)

* Predict **city-level base premium**
* Uses **XGBoost regression**
* Input = 4 weeks → Output = monthly + weekly breakdown

---

## Backend Usage

You DO NOT call this per request.
Used in:

* Weekly batch jobs
* Admin analytics
* Pre-computing base pricing

---

## Request

```json
{
  "weeks": [
    {
      "city_id": 101,
      "date": "2024-12-01",
      "city_tier": 3,
      "city_rank": 1,
      "median_income_weekly": 10000,
      "disruption_freq_weekly": 2,
      "avg_disruption_duration_hrs": 1.5,
      "demand_stability_orders": 0.5,
      "total_orders_weekly": 100,
      "rainfall_mm": 10,
      "temperature_avg": 25,
      "holiday_flag": 0,
      "event_flag": 0
    }
  ]
}
```

---

## Response

```json
{
  "predicted_monthly_average_price": 299.07,
  "weekly_prices": [296.04, 294.65, 297.90, 307.70]
}
```

---

## Validation Rules

* Exactly **4 weeks required**
* Dates must be chronological
* Missing features → reject request

---

---

# 4.3 WEEKLY RISK ADJUSTMENT MODEL (LLM)

---

## Endpoint

**POST** `/calculate-weekly-price` 

---

## Purpose (CRITICAL)

This is your **real-time pricing layer**:

> Base price (XGBoost) + dynamic risk (LLM) → final weekly premium

---

## Backend Flow Integration

```text
1. Fetch base price (cached or monthly model)
2. Call weekly-price API
3. Compute final premium
4. Store in policy
```

---

## Request

```json
{
  "city_id": 101,
  "city": "Hyderabad",
  "base_price": 500,
  "weather": {
    "rainfall_mm": 120,
    "temperature": 30,
    "extreme_alert": true,
    "condition": "heavy rain"
  },
  "news_summary": "Flood warnings and transport strike expected",
  "outages": {
    "count": 3,
    "avg_duration": 2
  }
}
```

---

## Response

```json
{
  "city_id": 101,
  "city": "Hyderabad",
  "base_price": 500,
  "weekly_addition": 130,
  "final_price": 630,
  "increase_pct": 0.26,
  "risk_scores": {
    "weather_risk": 0.8,
    "news_risk": 0.85,
    "outage_risk": 0.6
  },
  "reason": "Heavy rain and transport strike elevate risk"
}
```

---

## Backend Mapping (IMPORTANT)

| ML Field        | Backend Usage         |
| --------------- | --------------------- |
| final_price     | policy.premium_amount |
| weekly_addition | audit/logging         |
| risk_scores     | ml_inference_logs     |
| reason          | debugging / admin UI  |

---


## Standardize meta everywhere

All list APIs must return:

```json
"meta": {
  "page": 1,
  "limit": 10,
  "total": 25,
  "totalPages": 3
}
```

---

## Notification improvement

Add:

```json
"type": "CLAIM | POLICY | SYSTEM"
```

---

# 4.5 HEALTH CHECK

---

## Endpoint

**GET** `/health` 

---

## Purpose

* Validate ML service availability
* Check external LLM connectivity

---

## Response

```json
{
  "status": "healthy",
  "gemini_api_connection": "connected"
}
```

---

---

# 4.6 FAILURE HANDLING (STRICT)

---

## Rules

| Scenario               | Action                   |
| ---------------------- | ------------------------ |
| ML timeout             | fallback to cached price |
| ML down                | circuit breaker          |
| Invalid response       | reject + log             |
| LLM hallucination risk | clamp output bounds      |

---

## Fallback Strategy

```ts
premium = 
  cached_price ??
  last_week_price ??
  static_base_price;
```


# 5. ERROR HANDLING STRATEGY

---

## Standard Error

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Readable message",
    "requestId": "uuid"
  }
}
```

---

## Categories

| Type       | Example            |
| ---------- | ------------------ |
| Validation | INVALID_INPUT      |
| Auth       | UNAUTHORIZED       |
| Business   | INSUFFICIENT_FUNDS |
| System     | INTERNAL_ERROR     |

---

## Global Pattern

* Express global error middleware
* Zod validation layer
* Structured logging (requestId propagation)

---

# 6. FINAL PIPELINE (Mapping → Detection → Payout)

---

## STEP 0: Base Setup (Static Mapping)

* Every driver belongs to a zone
* Mapping: `worker → city_id → zone_id`

---

## STEP 1: Zone Mapping

**Purpose:** Group workers into processing units based on their zones.

* **Input:** City data + workers  
* **Action:** Map everything to zones
* **Result (Example):**
  * **City C1:**
    * Zone Z1 → 120 drivers
    * Zone Z2 → 80 drivers
> This makes the **ZONE** the primary unit of processing for disruptions.

---

## STEP 2: Collect Signals (Every Interval)

Run this every hour.

### 🔹 For EACH ZONE (Zone-Level Signals):

**1. Weather**
```json
{
  "zoneId": "Z1",
  "rainfall_mm": 120,
  "extreme_alert": true
}
```

**2. Traffic**
```json
{
  "trafficRiskScore": 0.78,
  "avgSpeed": 15,
  "incidentCount": 1,
  "severityLevel": "HIGH"
}
```

**3. Platform Outages**
```json
{
  "zoneId": "Z1",
  "orderDropPercentage": 70,
  "avgDeliveryTime": 45
}
```

### 🔹 For CITY (Shared across zones):

**4. News Data**
```json
{
  "headline": "Transport strike",
  "riskTag": "SOCIAL_DISRUPTION"
}
```

---

## STEP 3: Convert Signals → Risk Scores

Convert the raw signals into quantified risk scores per category:

| Risk Category | Condition | Given Score |
| --- | --- | --- |
| **🌧️ Weather Risk** | `rainfall > 100` <br/> `extreme_alert == true` | 0.8 <br/> +0.2 |
| **🚦 Traffic Risk** | `Taken directly from Traffic API` | `trafficRiskScore` |
| **📦 Platform Risk** | `orderDrop > 60%` <br/> `deliveryTime == high` | 0.7 <br/> +0.2 |
| **📰 News Risk** (City) | See **News Risk Processing** below | `newsRisk` |

### News Risk Processing (Hybrid Approach)

We process unstructured news data using a **hybrid heuristic + lightweight NLP approach** to generate a normalized `newsRisk` score (0–1). This ensures low latency, reliability, and explainability while avoiding heavy NLP dependencies.

#### Pipeline:

1. **Step 1: Heuristic Keyword Extraction (Primary Layer)**
   * Perform rule-based keyword matching on news text.
   * Example: Flood/Heavy Rain → High risk, Strike/Protest → Medium-high risk.
   * If strong keyword match is found, assign predefined risk score.

2. **Step 2: Lightweight NLP Sentiment / Context (Fallback Layer)**
   * If heuristic confidence is low or ambiguous:
     * Use a lightweight NLP model to extract disruption severity.

3. **Step 3: Risk Normalization**
   * Clamp final score within safe bounds: `0.2 ≤ newsRisk ≤ 0.9`.

4. **Step 4: Output**
   ```json
   {
     "newsRisk": 0.65,
     "riskType": "FLOOD | STRIKE | ACCIDENT | MIXED"
   }
   ```

#### Integration:

`newsRisk` is combined with zone-level signals:

```text
finalRisk = 
  0.35 * weatherRisk +
  0.30 * trafficRisk +
  0.20 * platformRisk +
  0.15 * newsRisk
```

> **Design Note:** News risk is a city-level signal uniformly applied across zones. This hybrid model avoids high-latency transformers during real-time loops.

---

## STEP 4: Claim Execution Computations (Final Rule)

From input (validated risk score): 

```text
incomeRate = zone_median_income_per_hour (predefined per zone)

intervalLoss = incomeRate * durationHours

baseCoverage = policy.coverage_multiplier * policy.premium_amount

remainingLoss = max(0, intervalLoss - baseCoverage)

riskAdjusted = remainingLoss * riskScore

payout = min(baseCoverage + riskAdjusted, policy.max_payout)
```

---

# 7. MOCK SIMULATOR APIs (PORT 4000)

The Mock Simulator (`simulation_servers`) provides deterministic environmental data mimicking third-party services.

## Data Access Endpoints

| Method | Endpoint | Purpose |
| ------ | -------- | ------- |
| **GET** | `/weather?cityId=C1` | Returns latest weather state |
| **GET** | `/platform?zoneId=Z1` | Returns platform delays and drops |
| **GET** | `/platform/workers/:id` | Worker status lookup |
| **GET** | `/platform/workers/:id/income-stats?hour=15` | Deterministic hourly income based on worker and time |
| **POST** | `/platform/workers/lookup` | Simulated platform API assigning IDs based on mobile |
| **POST** | `/platform/active-workers?zoneId=Z1` | Validates & returns online workers in a zone |
| **GET** | `/news?cityId=C1` | Returns local headlines |
| **GET** | `/platform/outages?city=C1` | Returns platform outage counts and duration |
| **GET** | `/traffic?zoneId=Z1` | Returns traffic severity |
| **GET** | `/market` | Returns simulated economic markers for ML |
| **GET** | `/bank/accounts` | Returns mock bank accounts |
| **POST** | `/bank/pay` | Simulates bank debit processing |

## Admin Control Endpoints

| Method | Endpoint | Purpose |
| ------ | -------- | ------- |
| **POST** | `/admin/weather` | Force inject weather conditions (for testing triggers) |
| **POST** | `/admin/platform` | Force inject platform order drops |
| **POST** | `/admin/news` | Force inject news headlines |
| **POST** | `/admin/traffic` | Force inject traffic severity |

---

# 8. ML SERVICES APIs (PORT 8000)

| Method | Endpoint | Purpose |
| ------ | -------- | ------- |
| **POST** | `/api/v1/predict/monthly` | Predicts base monthly/weekly price using XGBoost historic data |
| **POST** | `/calculate-weekly-price` | Computes Risk Additional Adjustments via Gemini LLM Risk Engine |
| **GET**  | `/health` | Verify LLM Gemini API connection health |
