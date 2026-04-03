from pydantic import BaseModel
from typing import Dict, Any

class WeatherInfo(BaseModel):
    rainfall_mm: float
    temperature: float
    extreme_alert: bool
    condition: str

class OutagesInfo(BaseModel):
    count: int
    avg_duration: float

class WeeklyPriceRequest(BaseModel):
    city_id: int
    city: str
    base_price: float
    weather: WeatherInfo
    news_summary: str
    outages: OutagesInfo

class RiskScores(BaseModel):
    weather_risk: float
    news_risk: float
    outage_risk: float

class WeeklyPriceResponse(BaseModel):
    city_id: int
    city: str
    base_price: float
    weekly_addition: float
    final_price: float
    increase_pct: float
    risk_scores: RiskScores
    reason: str
