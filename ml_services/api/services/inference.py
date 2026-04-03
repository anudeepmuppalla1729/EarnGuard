import pandas as pd
import numpy as np
from api.core.config import state
import warnings

# Suppress pandas performance warnings from concat and groupby if needed
warnings.simplefilter(action='ignore', category=pd.errors.PerformanceWarning)

def check_infinity(X):
    X = X.copy()
    X.replace([np.inf, -np.inf], np.nan, inplace=True)
    return X

def predict_monthly_average(weeks_data: list) -> dict:
    if state.history_df is None or state.model is None:
        raise ValueError("Model or history data not loaded.")

    # Convert incoming weeks to a DataFrame
    new_rows = pd.DataFrame([w.model_dump() for w in weeks_data])
    new_rows['date'] = pd.to_datetime(new_rows['date'])
    new_rows['_is_new'] = True
    
    history = state.history_df.copy()
    history['_is_new'] = False
    
    # Concat
    df = pd.concat([history, new_rows], ignore_index=True)
    
    # Chronological sort directly matches time-series context
    df = df.sort_values(by=['city_id', 'date']).reset_index(drop=True)
    
    # ---------------- Feature Engineering ----------------
    # (Matches `feature_engineering.py`)
    df['risk_score'] = df['disruption_freq_weekly'] * df['avg_disruption_duration_hrs']
    df['income_to_risk_ratio'] = df['median_income_weekly'] / df['risk_score']
    df['demand_risk_interaction'] = df['total_orders_weekly'] * df['disruption_freq_weekly']
    df['stability_adjusted_risk'] = df['risk_score'] * (1 - df['demand_stability_orders'])
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
    df['seasonality_index'] = df['total_orders_weekly'] / seasonal_avg
    # -----------------------------------------------------
    
    # Extract inference rows safely via the metadata flag
    inference_df = df[df['_is_new'] == True].copy()
    
    # Pre-processing drop identical to model_training.py
    columns_to_drop = ['date', 'city_name', 'weekly_insurance_premium', '_is_new', 'city_id']
    inference_df = inference_df.drop(columns=[c for c in columns_to_drop if c in inference_df.columns])
            
    inference_df = check_infinity(inference_df)
    
    # XGBoost requires matching order
    expected_features = list(state.model.feature_names_in_) if hasattr(state.model, 'feature_names_in_') else list(inference_df.columns)
    print("Model expects features:", expected_features)
    
    X = inference_df[expected_features]
    
    # Infer
    preds = state.model.predict(X)
    
    # Result Processing
    prices = preds.tolist()
    monthly_average = sum(prices) / len(prices)
    
    return {
        "predicted_monthly_average_price": round(monthly_average, 2),
        "weekly_prices": [round(p, 2) for p in prices]
    }
