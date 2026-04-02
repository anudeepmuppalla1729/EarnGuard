# 📊 Insurance Premium Prediction – Final Plan of Action

## 🎯 Goal
Build a machine learning model to **predict weekly insurance premiums** using:
- City-level data
- Demand behavior
- Disruption patterns
- Temporal (time-based) trends

---

# 🔥 Key Insight

❌ Old approach:
- One row per city (static)

✅ Final approach:
- Multiple rows per city over time (weekly data)

👉 Enables:
- Seasonality
- Trends
- Rolling statistics
- Better generalization

---

# 🧾 1. Raw Dataset Design (Before Feature Engineering)

Each row represents:

> 📌 One city in one week

## Required Schema

| Column Name | Description |
|------------|-------------|
| city_id | Unique identifier |
| city_name | Name of city |
| date | Week start date |
| city_tier | Tier classification |
| city_rank | Rank of city |
| median_income_weekly | Weekly driver income |
| disruption_freq_weekly | Number of disruptions |
| avg_disruption_duration_hrs | Avg duration |
| demand_stability_orders | Demand consistency |
| total_orders_weekly | Total weekly orders |
| rainfall_mm | Weather factor |
| temperature_avg | Climate factor |
| holiday_flag | Holiday indicator |
| event_flag | Event indicator |
| weekly_insurance_premium | 🎯 Target |

---

# 📊 2. Dataset Example

| city | date | freq | duration | orders | income | premium |
|------|------|------|----------|--------|--------|---------|
| A | 2024-01-01 | 2 | 1.5 | 100 | 9000 | 120 |
| A | 2024-01-08 | 3 | 2.0 | 110 | 9500 | 130 |
| A | 2024-01-15 | 1 | 1.0 | 90 | 8800 | 115 |

---

# 🧠 3. Optimized Feature Engineering Plan

## 🔹 3.1 Time-Based Features
- `demand_growth_rate`
- `rolling_avg_orders`
- `seasonality_index`

---

## 🔹 3.2 Risk Feature
- `risk_score = disruption_freq × duration` ⭐

---

## 🔹 3.3 Demand Feature
- `order_variance` *(optional)*

---

## 🔹 3.4 Financial Feature
- `income_to_risk_ratio` ⭐

---

## 🔹 3.5 Derived Features (MOST IMPORTANT ⭐)
- `income_to_risk_ratio`
- `demand_risk_interaction = demand × disruption_freq`
- `stability_adjusted_risk = risk × (1 - stability)`

---

## 🔹 3.6 Temporal Indicator
- `week_of_year` ⭐

---

# ✅ 4. Final Feature Set (Model Input)

## Raw Features
- city_tier
- city_rank
- median_income_weekly
- disruption_freq_weekly
- avg_disruption_duration_hrs
- demand_stability_orders
- total_orders_weekly
- rainfall_mm
- temperature_avg
- holiday_flag
- event_flag

---

## Engineered Features
- risk_score ⭐
- income_to_risk_ratio ⭐
- demand_risk_interaction ⭐
- stability_adjusted_risk ⭐
- demand_growth_rate ⭐
- rolling_avg_orders ⭐
- seasonality_index ⭐
- week_of_year ⭐

---

# ⚙️ 5. Feature Engineering Code

```python
df['risk_score'] = df['disruption_freq_weekly'] * df['avg_disruption_duration_hrs']

df['income_to_risk_ratio'] = df['median_income_weekly'] / df['risk_score']

df['demand_risk_interaction'] = (
    df['total_orders_weekly'] * df['disruption_freq_weekly']
)

df['stability_adjusted_risk'] = (
    df['risk_score'] * (1 - df['demand_stability_orders'])
)

df['week_of_year'] = df['date'].dt.isocalendar().week

df['rolling_avg_orders'] = (
    df.groupby('city_id')['total_orders_weekly']
    .rolling(4).mean().reset_index(0, drop=True)
)

df['demand_growth_rate'] = (
    df.groupby('city_id')['total_orders_weekly']
    .pct_change()
)

seasonal_avg = df.groupby('week_of_year')['total_orders_weekly'].transform('mean')

df['seasonality_index'] = (
    df['total_orders_weekly'] / seasonal_avg
)