# EarnGuard
### AI-Powered Parametric Income Protection for India's Delivery Partners
**Guidewire DEVTrails 2026 — Phase 1 Submission**

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)  
2. [Persona-Based Scenarios & Workflow](#2-persona-based-scenarios--workflow)  
   - [2.1 Supported Persona](#21-supported-persona)  
   - [2.2 Scenario Walkthroughs](#22-scenario-walkthroughs)  
   - [2.3 End-to-End Application Workflow](#23-end-to-end-application-workflow)  

3. [Weekly Premium Model & Parametric Triggers](#3-weekly-premium-model--parametric-triggers)  
   - [3.1 Why Weekly Pricing?](#31-why-weekly-pricing)  
   - [3.2 Premium Formula](#32-premium-formula)  
   - [3.3 Payout Formula](#33-payout-formula)  
   - [3.4 Parametric Triggers](#34-parametric-triggers)  

4. [Platform Choice](#4-platform-choice)  

5. [AI / ML Integration Plan](#5-ai--ml-integration-plan)  
   - [5.1 ML Components Overview](#51-ml-components-overview)  
   - [5.2 Premium Calculation — ML Workflow](#52-premium-calculation--ml-workflow)  
   - [5.3 Fraud Detection — Three-Layer Approach](#53-fraud-detection--three-layer-approach)  
   - [5.4 AI in the Admin Portal](#54-ai-in-the-admin-portal)  

6. [Tech Stack](#6-tech-stack)  

7. [Coverage Constraints & Golden Rules](#7-coverage-constraints--golden-rules)  

8. [Key Differentiators](#8-key-differentiators)  

---

## 1. Problem Statement

India has over **2 million quick-commerce delivery partners** working for platforms like Zepto and Blinkit. These workers operate on ultra-fast delivery windows — 10 to 30 minutes per order — making them uniquely vulnerable when external disruptions halt their ability to work. A single disrupted interval can wipe out several hours of income with no recourse.

External disruptions such as extreme weather (floods, heavy rain, heat), social events (curfews, strikes, zone closures), and platform outages force workers off the road for hours at a time — directly wiping out the income they would have earned during those hours. There is currently no safety net for these losses.

> **EarnGuard solves this with a parametric, AI-driven weekly insurance product that:**
> - Pays out **automatically** when a disruption is detected — no claim filing required
> - Prices risk **dynamically each week** using real data — weather, platform signals, news
> - Detects fraud **intelligently** using ML-based anomaly detection
> - Operates within a strict **income-loss-only** coverage scope

---

## 2. Persona-Based Scenarios & Workflow

### 2.1 Supported Persona

EarnGuard exclusively serves **quick-commerce (Q-commerce) delivery partners** — workers who deliver groceries and essentials within 10–30 minute windows. This focused scope is what makes zone-wise disruption mapping accurate and operationally meaningful.

| Persona | Platforms | Key Disruption Types | Typical Weekly Income |
|---|---|---|---|
| Q-commerce delivery partner | Zepto, Blinkit | Heavy rain, floods, extreme heat, area closures, platform outages, curfews | Rs. 4,500 – Rs. 8,000 |

> **Why only Q-commerce?** Q-commerce workers operate out of fixed dark stores mapped to specific micro-zones. This makes zone-wise risk mapping precise — we know exactly which dark store a worker is assigned to, which zone they cover, and what disruption events affect that zone. Extending to food delivery or e-commerce would require fundamentally different zone models and is out of scope for this iteration.

---

### 2.2 Scenario Walkthroughs

#### Scenario A — Ravi, Zepto delivery partner, Hyderabad *(parametric auto-trigger — weather)*

Ravi is a Zepto dark store partner in Kondapur, Hyderabad (weekly premium: Rs. 350, multiplier k = 0.6). On Sunday afternoon, Hyderabad receives an IMD red alert for heavy rainfall. The disruption detection pipeline identifies his dark store zone (Kondapur) as high-risk (risk score: 0.78) and fires a parametric trigger — **no action needed from Ravi**. The disrupted interval is Sunday 2 pm – 8 pm (6 hours). At his zone's median income rate of Rs. 110/hr:
- Interval loss = Rs. 660
- Base coverage = 0.6 × Rs. 350 = **Rs. 210**
- Remaining loss = Rs. 450
- Risk-adjusted amount = Rs. 450 × 0.78 = **Rs. 351**
- **Total payout = Rs. 561 for that interval**

Credited to his EarnGuard wallet by Monday morning. He withdraws it via UPI.

#### Scenario B — Priya, Blinkit delivery partner, Delhi *(news NLP trigger — social disruption)*

Priya is assigned to a Blinkit dark store in South Delhi (weekly premium: Rs. 300, multiplier k = 0.6). A local strike affecting her zone is picked up by the news NLP model on Wednesday morning and classified as a social disruption event. Her zone score crosses the threshold — claim auto-initiated. The fraud module confirms she was active in her dark store zone before the disruption and finds no duplicate claim. The disrupted interval is Wednesday 8 am – 2 pm (6 hours). At her zone's median income rate of Rs. 95/hr:
- Interval loss = Rs. 570
- Base coverage = 0.6 × Rs. 300 = **Rs. 180**
- Remaining loss = Rs. 390
- Risk-adjusted amount = Rs. 390 × 0.84 = **Rs. 328**
- **Total payout = Rs. 508 for that interval**

Scheduled for payment that evening.

#### Scenario C — Karthik, Zepto delivery partner, Bangalore *(fraud attempt blocked)*

Karthik is assigned to a Zepto dark store in Koramangala. He files a manual claim citing a platform outage during Friday evening. The system checks Zepto's platform API logs — no outage is recorded for his zone during that interval. His GPS activity log also shows he was active and completing orders during the claimed period. The multiagent validator flags the claim as invalid across all three checks (platform, weather, location). The claim is **rejected**, Karthik is notified, and the anomaly is logged for future model training.

---

### 2.3 End-to-End Application Workflow

```
Worker opens EarnGuard app
        │
        ▼
1. ONBOARDING
   ├── Select platform (Zepto / Blinkit)
   ├── KYC verification — Aadhaar / PAN (mock for demo)
   ├── Link platform account → dark store zone auto-assigned
   └── Confirm coverage start date
        │
        ▼
2. RISK ASSESSMENT  (runs every Sunday for the coming week)
   ├── Ingest — Weather API, Platform API, News API, Driver activity
   ├── ML pipeline computes zone risk score
   ├── Premium ML model outputs weekly premium in Rs.
   └── Worker sees premium → confirms coverage
        │
        ▼
3. REAL-TIME MONITORING  (continuous, per interval)
   ├── Zone-wise disruption detection pipeline scans all signals
   ├── Disruption risk % computed for each zone
   ├── If risk % > threshold → parametric trigger fires
   └── Auto-claim initiated (zero worker action)
        │
        ▼
4. CLAIM PROCESSING & FRAUD DETECTION
   ├── Duplicate claim check
   ├── Multiagent validation (Platform API + Weather API + logs)
   ├── ML anomaly detector scores the claim
   ├── Valid → payout scheduled
   └── Invalid → rejected, worker notified
        │
        ▼
5. PAYOUT
   ├── Interval loss calculated: zone median income rate × disruption hours × risk %
   ├── Each qualifying interval generates its own payout amount
   ├── Payouts accumulated in EarnGuard in-app wallet
   ├── Worker withdraws on-demand
   └── Processed via Stripe sandbox / UPI mock
```

---

## 3. Weekly Premium Model & Parametric Triggers

### 3.1 Why Weekly Pricing?

Gig workers are paid **weekly** by their platforms. Monthly or annual insurance premiums are structurally misaligned with this earning cadence. Weekly pricing means:

- The premium reflects **current week's risk**, not a stale annual average
- Workers can **opt in or out each week** based on their schedule
- Premium and income operate on the **same cycle** — a disrupted week is covered by that week's premium

---

### 3.2 Premium Formula

```
Total Weekly Premium  =  City-Tier Base Price  +  Weekly Risk Additional Amount

Where:
  City-Tier Base Price   =  f(city rank, median driver income, historical disruption frequency)
  Weekly Risk Amount     =  weather risk contribution + news/social risk + platform outage risk
```

The city-tier base reflects **structural risk** — a metro city like Mumbai with high flood frequency is priced differently from a Tier-2 city. The weekly risk addition layer responds to the specific signals observed that week.

---

### 3.3 Payout Formula

EarnGuard covers the income lost during a specific disruption interval using a **two-component payout model**. Each disruption event produces its own independent payout calculation.

> **Key intuition:**
> - The **base coverage** ensures workers are never left with zero payout when a disruption is confirmed
> - The **risk-adjusted component** ensures higher disruption severity → higher compensation

```
Payout For a Disruption Interval  =  Base Coverage Amount  +  Risk-Adjusted Amount

Where:
  Interval Loss          =  Zone median income rate (Rs./hr)  ×  Duration of disruption (hrs)

  Base Coverage Amount   =  k  ×  Weekly Premium
                            (k is a fixed coverage multiplier, e.g. 0.5 – 0.8)

  Remaining Loss         =  max(0,  Interval Loss  −  Base Coverage Amount)

  Risk-Adjusted Amount   =  Remaining Loss  ×  Disruption Risk %
```

**Worked example:**

```
Zone median income rate  =  Rs. 110 / hr
Disruption duration      =  6 hours
Weekly premium           =  Rs. 350
Coverage multiplier (k)  =  0.6
Disruption risk score    =  0.78

Interval Loss            =  110  ×  6             =  Rs. 660
Base Coverage Amount     =  0.6  ×  350            =  Rs. 210
Remaining Loss           =  max(0, 660 − 210)      =  Rs. 450
Risk-Adjusted Amount     =  450  ×  0.78           =  Rs. 351

→ Total Payout           =  210  +  351            =  Rs. 561 for that interval
```

A worker may receive **multiple interval payouts in a single week** if multiple qualifying disruption events occur. The weekly premium and multiplier `k` are fixed at the start of the coverage week; each qualifying disruption interval within that window triggers its own independent payout calculation.

---

### 3.4 Parametric Triggers

A parametric trigger is an **objective, externally verifiable event** that automatically initiates a claim — no paperwork, no proof required from the worker.

| Trigger Type | Signal Source | Example Condition | Auto-Payout? |
|---|---|---|---|
| Environmental | Weather API (IMD / OpenWeatherMap) | Heavy rain > 50mm/hr for 3+ hrs in zone | ✅ Yes |
| Social disruption | News NLP model (headlines, social signals) | Strike or curfew detected in delivery zone | ✅ Yes |
| Platform outage | Platform API (order drop rate, app status) | Order volume drops >60% in zone for 2 hrs | ✅ Yes |
| Manual claim | Worker submission via app | Worker reports income loss manually | After validation |

> All parametric triggers are subject to a **risk threshold check**. A disruption risk score below the configured threshold is stored for monitoring but does not trigger a payout — ensuring the system only pays out on material disruption events that genuinely halted worker activity. When triggered, the payout covers the income lost during that specific interval only.

---

## 4. Platform Choice

### Mobile App (Android/iOS) for Workers + Web Portal for Admins

We chose a **native mobile app for workers** and a **web portal for the admin/insurer dashboard** for the following reasons:

#### Worker App — Why Mobile?

| Consideration | Justification |
|---|---|
| How delivery partners work | Q-commerce workers are on the road on their phone all day, operating out of fixed dark stores. A mobile app fits naturally into this workflow. |
| Push notifications | Native push notifications for disruption alerts and payout confirmations work reliably on mobile — critical for a real-time product. |
| UPI / payment integration | Mobile-native UPI integration (via Stripe / Razorpay SDK) is smoother than web-based payment on a phone browser. |
| Offline capability | Workers in low-connectivity zones can still view their policy status and wallet balance via cached data. |
| Trust & familiarity | Delivery partners already use dedicated apps for their work. A standalone EarnGuard app builds brand trust and habit. |

#### Admin / Insurer Portal — Why Web?

| Consideration | Justification |
|---|---|
| Dashboard complexity | Heatmaps, trend graphs, claim tables, fraud monitoring — this is desktop-heavy work, not suited to a small screen. |
| Multi-user access | Insurance ops teams work on laptops/desktops. A web portal allows multiple team members to access it simultaneously. |
| Data density | Admins need to view zone-level data, ML metrics, and approval queues side by side. Web gives the screen real estate for this. |
| No install friction | Internal teams can access the portal via URL — no app deployment needed for the ops team. |

---

## 5. AI / ML Integration Plan

AI and ML are not bolt-ons in EarnGuard — they are the **core engine** of the product. Every pricing decision, every trigger, and every fraud check is data-driven.

### 5.1 ML Components Overview

| Component | Model Type | Inputs | Output |
|---|---|---|---|
| Premium ML model | Gradient-boosted regression (XGBoost) | City rank, zone risk score, persona, historical loss rate | Weekly premium amount (Rs.) |
| Disruption scorer | Fine-tuned multi-input Transformer | Weather severity, traffic congestion, platform signals | Zone risk score 0–1 + estimated disruption duration (hrs) |
| News NLP model | BERT-based text classifier | News headlines, social media alerts, govt bulletins | Disruption type + severity label |
| Fraud / anomaly detector | Isolation Forest + rule-based layer | Claim history, location data, platform order logs, weather match | Fraud score 0–1 + accept/reject |
| Model health monitor | Statistical drift detection | Live prediction distributions vs. training baseline | Drift alert + retrain trigger |

---

### 5.2 Premium Calculation — ML Workflow

1. Raw data is collected from Weather API, Platform API, News API, and driver activity data once a week (Sunday evening for the coming week).
2. The **Transformer layer** normalises and structures the signals into feature vectors per zone.
3. The **NLP model** processes news headlines and classifies them as Environmental, Social, or Platform disruptions with a probability score.
4. All features are fed into the **premium ML model** (XGBoost). Output is a recommended weekly premium in Rs.
5. The city-tier base price (rule-based, keyed on static city rank data) is added to give the total weekly premium shown to the worker.

---

### 5.3 Fraud Detection — Three-Layer Approach

All claims (auto-triggered and manual) pass through three layers:

**Layer 1 — Duplicate check**
Has this exact claim (same worker, same zone, same event window) been processed before? If yes → reject immediately.

**Layer 2 — Multiagent validation**
Three independent validation agents check the claim against:
- **Platform API** — was the worker active in the zone during the claimed interval?
- **Weather API** — was the weather condition actually severe at that location/time?
- **System logs** — was the disruption event independently recorded by the pipeline?

A rule-based validation score is computed from these three checks.

**Layer 3 — ML anomaly detection**
An Isolation Forest model trained on historical valid and fraudulent claims scores the new claim. If the anomaly score exceeds the threshold, the claim is flagged for rejection or manual review.

Claims passing all three layers are approved. The full validation trace is stored for audit and future model retraining.

---

### 5.4 AI in the Admin Portal

The admin web portal exposes ML outputs to the insurer team:

- **Zone risk heatmap** — real-time map of risk scores per zone (powered by the disruption scorer)
- **Model health dashboard** — monitors risk score accuracy, fraud model F1 score, and data drift
- **Fraud analytics** — anomaly score distributions, flagged claim patterns, duplicate rates
- **Premium vs payout trends** — weekly loss ratio, city-level performance

---

## 6. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Mobile app (worker) | React Native (Android + iOS) | EarnGuard worker app |
| Admin web portal | React + Vite, TailwindCSS | Insurer / ops dashboard |
| Backend API | Node.js / Express | Business logic, orchestration, REST API |
| ML services | Python: scikit-learn, XGBoost, HuggingFace Transformers | Premium model, NLP classifier, anomaly detection |
| Database | PostgreSQL (structured data), Redis (caching / queues) | Worker profiles, claims, premiums, zone events |
| External APIs | OpenWeatherMap / IMD (mock), NewsAPI (mock), Platform API (mock) | Weather, news, platform signal ingestion |
| Payment | Stripe sandbox / Razorpay mock | Payout processing, UPI integration |
| Notifications | Firebase Cloud Messaging (FCM) | Push notifications on mobile for disruption alerts and payout confirmations |
| Deployment | Expo (mobile build), Vercel (admin portal), Railway (backend + ML) | Fully hosted demo environment |
| Version control | GitHub (monorepo) | Source code + documentation |

---


## 7. Coverage Constraints & Golden Rules

> ⚠️ These constraints are hard-coded into EarnGuard's product logic and cannot be overridden.

1. **Coverage scope — INCOME LOSS ONLY.** No payouts for vehicle repairs, health incidents, accidents, or life events.
2. **Weekly premium, interval payouts.** The premium is structured on a weekly basis. Payouts are calculated per disruption interval within the covered week — not as a weekly lump sum.
3. **Q-commerce only.** EarnGuard exclusively serves Zepto and Blinkit delivery partners. Food delivery, e-commerce, and ride-share workers are out of scope — zone-wise disruption mapping is built around Q-commerce dark store zones.
4. **Disruption triggers — external and verifiable only.** No subjective self-reported losses without independent validation from at least two data sources.

---

## 8. Key Differentiators

- **Zero-touch claims** — parametric triggers mean workers never need to file a claim for covered events
- **Hyper-local risk pricing** — premium recalculated weekly per zone, not per city or annually
- **Three-layer fraud detection** — duplicate check + multiagent validation + ML anomaly scoring
- **Mobile-first for workers** — React Native app with UPI integration and offline support, designed for on-the-road use
- **Income-cycle aligned** — weekly premium matches gig worker earning and spending patterns exactly
- **Interval-accurate payouts** — workers are compensated for the exact hours lost during a disruption, not a rough weekly percentage

---



*EarnGuard — Guidewire DEVTrails 2026 — Phase 1 Submission*
*Coverage: Income loss only | Pricing: Weekly | Persona: Q-commerce delivery partners (Zepto, Blinkit)*
