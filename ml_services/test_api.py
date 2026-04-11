import requests
import json

payload = {
  "weeks": [
    {
      "city_id": 0,
      "date": "2024-12-01",
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
    {
      "city_id": 0,
      "date": "2024-12-08",
      "city_tier": 3,
      "city_rank": 1,
      "median_income_weekly": 10000.0,
      "disruption_freq_weekly": 2.0,
      "avg_disruption_duration_hrs": 1.5,
      "demand_stability_orders": 0.5,
      "total_orders_weekly": 120.0,
      "rainfall_mm": 12.0,
      "temperature_avg": 26.0,
      "holiday_flag": 0,
      "event_flag": 0
    },
    {
      "city_id": 0,
      "date": "2024-12-15",
      "city_tier": 3,
      "city_rank": 1,
      "median_income_weekly": 10000.0,
      "disruption_freq_weekly": 2.0,
      "avg_disruption_duration_hrs": 1.5,
      "demand_stability_orders": 0.5,
      "total_orders_weekly": 130.0,
      "rainfall_mm": 5.0,
      "temperature_avg": 25.5,
      "holiday_flag": 0,
      "event_flag": 0
    },
    {
      "city_id": 0,
      "date": "2024-12-22",
      "city_tier": 3,
      "city_rank": 1,
      "median_income_weekly": 10000.0,
      "disruption_freq_weekly": 2.0,
      "avg_disruption_duration_hrs": 1.5,
      "demand_stability_orders": 0.5,
      "total_orders_weekly": 105.0,
      "rainfall_mm": 20.0,
      "temperature_avg": 24.0,
      "holiday_flag": 1,
      "event_flag": 0
    }
  ]
}

import os

url = os.environ.get("ML_URL", "http://localhost:8000")
print("Sending POST request to FastAPI server...")
response = requests.post(f"{url}/api/v1/predict/monthly", json=payload)
print(f"Status Code: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")
