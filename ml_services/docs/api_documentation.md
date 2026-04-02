# City Base Price Calc Model API Documentation

This API serves the tuned XGBoost model to predict the average monthly insurance premium (price) of a city. The endpoint is designed to accept 4 weekly data points (representing the 4 weeks of the month to be predicted), processes them with dynamic historical context, evaluates utilizing engineered features, and returns the average forecasted price.

## Base URL

By default, the application runs locally:

```text
http://localhost:8000
```

## Endpoints

### `POST /api/v1/predict/monthly`

Calculate the average predicted monthly price from 4 incoming weekly datasets spanning the predicted month.

#### **Request Headers**

- `Content-Type: application/json`

#### **Request Body**

The endpoint expects a JSON payload containing an exact 4-item list matching the weekly schema metrics from `dataset.csv`.

**Schema (`MonthlyPredictionRequest`):**

```json
{
  "weeks": [
    {
      "city_id": 0,
      "city_name": "string (optional)",
      "date": "YYYY-MM-DD",
      "city_tier": 3,
      "city_rank": 1,
      "median_income_weekly": 10000.0,
      "disruption_freq_weekly": 2.0,
      "avg_disruption_duration_hrs": 1.5,
      "demand_stability_orders": 0.5,
      "total_orders_weekly": 100.0,
      "rainfall_mm": 10.0,
      "temperature_avg": 25.0,
      "holiday_flag": 0,
      "event_flag": 0
    },
    ... (3 more weeks)
  ]
}
```

> **Note:** The `date` parameter strictly requires chronologically ordered week dates (e.g. `2024-12-01`, `2024-12-08`) to ensure that time-series-dependent feature operations such as `rolling_avg_orders` and `seasonality_index` correctly align with appended historical datasets.

---

#### **Response**

The endpoint responds with a successful status representation and the computed predictions.

**Schema (`MonthlyPredictionResponse`):**

```json
{
  "predicted_monthly_average_price": 299.07,
  "weekly_prices": [
    296.04,
    294.65,
    297.90,
    307.70
  ]
}
```

**Variables:**
- `predicted_monthly_average_price`: The arithmetic mean of the 4 predicted `weekly_prices`. This represents the final metric returned to the user for the whole month.
- `weekly_prices`: The array of precise inferences calculated by the serialized XGBoost model relative to their chronological weekly inputs.

---

## Running the Server

To start the API service, navigate to the `ml_services` root directory and activate the virtual environment.

```bash
# Activate environment
source .venv/Scripts/activate

# Install requirements
pip install -r requirements.txt

# Run FastAPI MVC Application
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

## Automatic OpenAPI Interactive Docs (SwaggerUI)

Because this service is built on FastAPI, interactive documentation is generated automatically. You can view, test, and dynamically explore schemas by opening your browser to:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
