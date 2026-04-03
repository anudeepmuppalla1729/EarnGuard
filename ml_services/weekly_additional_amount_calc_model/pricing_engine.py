from typing import Dict, Any, Tuple

def calculate_weekly_pricing(base_price: float, risk_scores: Dict[str, Any]) -> Tuple[float, float, float]:
    """
    Computes the pricing addition based on LLM risk scores.
    Returns: (weekly_addition, final_price, increase_pct)
    """
    
    # 1. Extract risk values with defaults and ensure they are between 0 and 1
    weather_risk = min(max(float(risk_scores.get("weather_risk", 0.5)), 0.0), 1.0)
    news_risk = min(max(float(risk_scores.get("news_risk", 0.5)), 0.0), 1.0)
    outage_risk = min(max(float(risk_scores.get("outage_risk", 0.5)), 0.0), 1.0)
    
    # Update dictionary to use validated values
    risk_scores["weather_risk"] = weather_risk
    risk_scores["news_risk"] = news_risk
    risk_scores["outage_risk"] = outage_risk
    
    # Step 1: Compute weighted risk
    weighted_risk = 0.4 * weather_risk + 0.4 * news_risk + 0.2 * outage_risk
    
    # Step 2: Map risk -> percentage (5% to 35%)
    increase_pct = 0.05 + (0.30 * weighted_risk)
    
    # Step 3: Clamp values
    increase_pct = min(max(increase_pct, 0.05), 0.35)
    
    # Step 4: Final calculation
    weekly_addition = base_price * increase_pct
    final_price = base_price + weekly_addition
    
    return round(weekly_addition, 2), round(final_price, 2), round(increase_pct, 4)
