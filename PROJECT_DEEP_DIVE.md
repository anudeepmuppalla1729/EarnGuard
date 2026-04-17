# EarnGuard: Redefining Gig-Worker Security
## A Technical & Business Deep Dive into Autonomous Parametric Insurance

---

## 1. Executive Summary
EarnGuard is a first-of-its-kind autonomous insurance platform designed specifically for India's 15M+ delivery partners (Zepto, Blinkit). By replacing traditional, manual claims with **Parametric Triggers**, EarnGuard provides near-instant financial relief when environmental or social disruptions halt a worker's ability to earn. 

The system operates as a distributed mesh of Node.js services, Python ML models, and a high-velocity sensing engine, ensuring that income protection is as fast and dynamic as the gig economy itself.

---

## 2. The Core Problem: The "Income Gap"
Gig workers are the backbone of India's urban logistics, yet they are the most vulnerable to external shocks.
- **Uninsured Downtime**: Heavy rain, traffic gridlock, or platform outages can lose a worker 20-40% of their daily target.
- **The Speed Gap**: Traditional insurance takes weeks to verify a claim. A delivery partner needs that money within hours to cover fuel and food costs.
- **The Verification Gap**: Proving "I couldn't work because of the storm" is subjective and often rejected by traditional insurers.

---

## 3. The EarnGuard Solution: Parametric Insurance
EarnGuard moves the burden of proof from the worker to the **data**. 

### What is Parametric Insurance?
Instead of indemnifying against a specific loss after a long investigation, parametric insurance pays out a pre-defined amount when a **measurable parameter** (e.g., Rainfall > 50mm, or Platform Order Drops > 40%) is exceeded.

### The EarnGuard Advantage:
- **Zero-Touch**: No forms, no phone calls, no wait times.
- **Hyper-Local**: Pricing and triggers are calculated at the **Dark Store Zone** level, ensuring Ravi in Gachibowli isn't penalized for a storm happening in Banjara Hills.
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
