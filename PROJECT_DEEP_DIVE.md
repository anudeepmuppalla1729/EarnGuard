# EarnGuard: Redefining Gig-Worker Security
## A Technical & Business Deep Dive into Autonomous Parametric Insurance

---

## 1. Executive Summary
EarnGuard is a first-of-its-kind autonomous insurance platform designed specifically for India's 15M+ delivery partners (Zepto, Blinkit). By replacing traditional, manual claims with **Parametric Triggers**, EarnGuard provides near-instant financial relief when environmental or social disruptions halt a worker's ability to earn. 

The system operates as a distributed mesh of Node.js services, Python ML models, and a high-velocity sensing engine, ensuring that income protection is as fast and dynamic as the gig economy itself.

---

## 2. The Core Problem: The "Income Gap"
India has over **2 million quick-commerce delivery partners** (Zepto, Blinkit). Operating on 10-minute windows, they are uniquely vulnerable to external shocks. A single disrupted interval can wipe out several hours of income with no recourse.

### 2.1 Coverage Constraints & Golden Rules
To maintain fiscal sustainability, EarnGuard operates under four "Golden Rules":
1.  **Income Loss Only**: No coverage for vehicle repairs, health, or accidents.
2.  **Q-Commerce Scope**: Exclusively serves Zepto and Blinkit partners due to their fixed dark-store zone model.
3.  **Weekly Alignment**: Premiums and coverage are bound to the weekly gig-earning cycle.
4.  **Verifiable Triggers**: No self-reported loss is paid without independent validation from at least two data sources.

---

## 3. The EarnGuard Solution: Parametric Insurance
EarnGuard moves the burden of proof from the worker to the **data**. 

### 3.1 End-to-End Application Workflow
The system follows a rigid 5-stage lifecycle for every policyholder:
1.  **Onboarding**: Worker links their platform account; dark store zone is auto-assigned via geofencing.
2.  **Risk Assessment**: ML pipeline computes the upcoming week's risk and premium every Sunday.
3.  **Monitoring**: The sensing heartbeat (3-min) scans for environmental or platform triggers.
4.  **Processing**: Idempotency, Parametric checks, and LAS scoring evaluate the event.
5.  **Payout**: Funds are credited to the in-app wallet for immediate UPI withdrawal.

### 3.2 The EarnGuard Advantage
- **Zero-Touch**: No forms, no phone calls, no wait times.
- **Hyper-Local**: Risk and pricing are managed at the **Dark Store Zone** level.
- **AI-Powered**: Every premium is dynamically priced based on predictive risk models.

---

## 4. Technical Architecture: The Distributed Mesh
EarnGuard is built on a resilient, multi-service architecture:

### 4.1 Operations Core (Node.js/Express)
The "Brain" of the system. It manages the user lifecycle, policy drafting, and coordinates all background workers via **BullMQ**.

### 4.2 Sensing Pipeline (3-Minute Heartbeat)
The `disruptionWorker` is the sensing heartbeat. Every 3 minutes, it polls the **Simulation Engine** for:
- **Weather**: Rainfall, temperature, and specific alerts (Cyclone, Heavy Rain).
- **Traffic**: Zone-level congestion metrics.
- **Platform Health**: Real-time order drop percentages and delivery delays.
- **Social Signals**: News headlines (Parsed via **Tau-Prolog** for logical risk extraction).

### 4.3 Execution Engine (Hourly Payouts)
The `payoutWorker` runs on the hour. It aggregates the last 20 snapshots into a mathematically smoothed **Hourly Risk Score**. If the score exceeds the 0.50 threshold, it executes atomic transactions to issue payouts to all active policyholders in that zone.

---

## 5. Intelligence & Logic Layers

### 5.1 ML Pricing Pipeline
EarnGuard utilizes a two-tier ML approach for "Fair Risk" pricing:
1.  **Base Price (XGBoost)**: A regression model that establishes a monthly floor price per city based on historical delivery density and income rates.
2.  **Risk Add-on (Gemini 2.5 Flash)**: An LLM-based service that reads next week's forecasts and local news to assign a "Risk Intensity" (Low to Extreme), which dynamically adjusts the weekly premium.

### 5.2 The Prolog Rule Engine
For unstructured data like news, we use **Tau-Prolog**. This allows us to define rigid logical rules for risk:
```prolog
% Example Rule
disruption_risk(heavy_rain, 0.8).
disruption_risk(strike, 0.95).
evaluate_risk(Event, Score) :- disruption_risk(Event, Score).
```
This ensures that "Severe Flooding" always triggers a higher risk than "Rain Expected," moving away from fragile regex-based parsing.

### 5.3 Payout & Premium Mathematics
Transparency is the foundation of trust in parametric insurance. EarnGuard uses the following open formulas:

**Total Weekly Premium Formula:**
`Premium = City_Base_Price (XGBoost) + Weekly_Risk_Addon (Gemini)`

**Interval Payout Formula:**
`Payout = (k * Interval_Loss) + (Remaining_Loss * Risk_Score)`
*   *Interval Loss*: Worker's personalized hourly rate × Duration.
*   *k*: Fixed coverage multiplier (0.2 - 0.6).
*   *Risk Score*: The 0-1 intensity of the disruption.

---

## 6. Fraud Defense: The LAS Heuristic & "Tough" Validation
To protect the capital pool, EarnGuard implements a rigorous validation sequence.

### 6.1 The Manual Claim Pipeline
Every manual submission undergoes a "Tough Validation" process:
1.  **Idempotency Lock**: Prevents duplicate submissions via `client_request_id`.
2.  **Velocity Protection**: Strict cooldown of max **5 claims per 24 hours**.
3.  **Parametric Cross-Correlation**: The claim is rejected instantly if no `zone_risk_snapshots` match the submitted timeframe.
4.  **LAS Scoring**: A heuristic score (0-1) correlating online status, platform drops, and ring detection.

### 6.2 Ring Detection & Coordinated Fraud
Coordinated rings are detected via **Population-Level Burst Monitoring**. If >3 manual claims arrive from a single zone within 30 minutes, a `ringFlag` is raised, penalizing all claims in that cluster by -0.40 on their LAS score, effectively halting the payout for manual review.

---

## 6. Fraud Defense: The LAS Heuristic
To prevent GPS-spoofing and coordinated fraud rings, EarnGuard implements the **Location Authenticity Score (LAS)**.

### The 3-Layer Defense:
1.  **Idempotency**: Every claim uses a unique `client_request_id` to prevent double-spending.
2.  **Parametric Cross-Reference**: Manual claims are only valid if they match the historical `zone_risk_snapshots` logged by our sensors.
3.  **Heuristic Scoring (LAS)**:
    - **Check-in (+0.25)**: Was the worker marked `is_online` by the dark store?
    - **Zone Drop (+0.25)**: Did order volume in that zone actually drop by >30%?
    - **Ring Penalty (-0.40)**: Is there a sudden burst of claims from the same zone? (Burst Detection).

---

## 7. Infrastructure & DevOps

### 7.1 Deployment Stack
- **Hosting**: Distributed on **Railway** for high availability.
- **Persistence**: **PostgreSQL (Supabase)** for structured data; **Redis (Railway)** for high-velocity BullMQ task queuing.
- **Containerization**: 100% Dockerized architecture.

### 7.2 CI/CD Pipeline
We use **GitHub Actions** for automated quality control:
- **Independent Monitoring**: Separate pipelines for Server, ML, and Simulation services.
- **Automated Deployment**: Pushing to `main` triggers a Docker build, push to **Docker Hub**, and an immediate Railway deployment via webhooks.

---

## 8. Scaling & Future Roadmap
While the current O(n) architecture is stable for initial launch, our roadmap includes:
1.  **Job Sharding**: Distributing the `payoutWorker` tasks across multiple BullMQ child processes to handle 1M+ workers.
2.  **Signal Caching**: Implementing a Redis-based cache for environmental signals to reduce N+1 HTTP calls during peaks.
3.  **Database Partitioning**: Using Postgres Range Partitioning for snapshots to ensure O(1) performance as data volume grows.

---
**EarnGuard — Building the financial foundation for the future of work.**
