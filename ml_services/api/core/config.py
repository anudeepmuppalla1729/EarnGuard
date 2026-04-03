import os
import joblib
import pandas as pd

class AppState:
    model = None
    history_df = None

state = AppState()

def load_resources():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    model_path = os.path.join(base_dir, 'city_base_price_calc_model', 'models', 'xgboost_model_tuned.joblib')
    data_path = os.path.join(base_dir, 'city_base_price_calc_model', 'data', 'dataset.csv')
    
    print(f"Loading XGBoost Model from {model_path}...")
    if os.path.exists(model_path):
        state.model = joblib.load(model_path)
    else:
        print("Warning: Model file not found. Ensure the model is trained.")
        
    print(f"Loading Historical Context from {data_path}...")
    if os.path.exists(data_path):
        df = pd.read_csv(data_path)
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
        state.history_df = df
    else:
        print("Warning: dataset.csv not found.")
