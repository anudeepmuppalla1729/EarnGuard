# EarnGuard ML Pricing Architecture

This document describes the design and internal workings of the EarnGuard ML pricing pipeline.

---

## Machine Learning Stack

The ML services are built using **FastAPI** as the API framework, **XGBoost** for predictive regressions, and **Google Gemini 2.5 Flash** for unstructured reasoning.

### Model Roles

| Model | Technique | Target | Input |
|-------|-----------|--------|-------|
| **Base Price Model** | XGBoost Regression | Monthly base premium | City-level historical delivery/income/weather stats. |
| **Weekly Additional Amount Model** | Gemini LLM + Engine | Short-term risk add-on | Real-time weather forecasts, news headlines, platform outages. |

---

## 1. Monthly Base Price Model (XGBoost)

This model establishes the baseline insurance cost for each city, accounting for standard gig-work risks.

- **Pipeline**:
    1.  **Training**: Based on the `city_pricing_historical` dataset.
    2.  **Features**:
        - `city_tier`: Urbanization level.
        - `city_rank`: Delivery efficiency.
        - `median_income_weekly`: Reference for payout caps.
        - `disruption_frequency`: Historical baseline of disruptions.
        - `weather_patterns`: Average rainfall/temp trends.
    3.  **Endpoint**: `POST /api/v1/predict/monthly`
    4.  **Process**: Accepts 4 weeks of historical context and returns a predicted monthly average price.

---

## 2. Weekly Additional Amount Model (Gemini + Pricing Engine)

This is a dynamic "risk-adjusted" layer that adds a fee for unpredictable events (like heavy rain or strikes).

### Gemini 2.5 Flash Inference
- **Role**: Interprets unstructured news and weather strings to assign a **Risk Intensity Score**.
- **Input Content**:
    - "Flood warnings and transport strike expected next week."
    - "Heavy rain alert from IMD."
- **Logic**: Uses few-shot prompting to categorize risk severity (Low, Medium, High, Extreme).

### Deterministic Pricing Engine
- **Role**: Converts the LLM risk score into a concrete currency value (₹).
- **Calculation**:
    - `Base Multiplier` (from Gemini risk score) × `City Median Income` / `Risk Factor`.
    - Also considers **Market Stability** (order count, demand stability).

- **Endpoint**: `POST /calculate-weekly-price`

---

## Data Synchronization (The Sync Loop)

The ML services do not directly write to the main database. Instead, they are periodically polled by the backend **`mlPricingWorker.ts`**.

1.  **Backend Trigger**: BullMQ fires a periodic event (Monthly/Weekly).
2.  **Context Assembly**: Backend assembles recent delivery and weather logs into a JSON payload.
3.  **ML Inference**: ML Server returns the calculated base/additional prices.
4.  **Database Update**: Backend updates the `city_pricing` table, which the mobile app uses to generate live quotes for workers.

> [!TIP]
> This "poll" based architecture decouples the ML inference (which can be slow due to LLM latency) from the core database transactions, ensuring backend stability even if the ML service is under load.
