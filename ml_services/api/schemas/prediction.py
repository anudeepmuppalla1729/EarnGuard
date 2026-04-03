from pydantic import BaseModel, Field
from typing import List

class WeeklyInput(BaseModel):
    city_id: int
    city_name: str | None = None
    date: str
    city_tier: int
    city_rank: int
    median_income_weekly: float
    disruption_freq_weekly: float
    avg_disruption_duration_hrs: float
    demand_stability_orders: float
    total_orders_weekly: float
    rainfall_mm: float
    temperature_avg: float
    holiday_flag: int
    event_flag: int

class MonthlyPredictionRequest(BaseModel):
    weeks: List[WeeklyInput] = Field(..., min_items=4, max_items=4, description="Exact 4 weeks of data for the predicted month")

class MonthlyPredictionResponse(BaseModel):
    predicted_monthly_average_price: float
    weekly_prices: List[float]
