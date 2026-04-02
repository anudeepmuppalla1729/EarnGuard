import pandas as pd
import numpy as np
import os
import joblib
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_squared_error, r2_score
from xgboost import XGBRegressor

def main():
    # Load Data
    print("Loading dataset...")
    df = pd.read_csv('data/final_dataset.csv')
    
    # Preprocessing
    if 'date' in df.columns:
        df = df.drop(columns=['date'])
    if 'city_name' in df.columns:
        df = df.drop(columns=['city_name'])
    if 'city_id' in df.columns:
        df = df.drop(columns=['city_id'])
        
    X = df.drop(columns=['weekly_insurance_premium'])
    
    # Replace infinite values with NaN since XGBoost handles NaN automatically
    X.replace([np.inf, -np.inf], np.nan, inplace=True)
    
    y = df['weekly_insurance_premium']
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Starting Grid Search...")
    # Baseline Model with fixed learning rate
    xgb = XGBRegressor(learning_rate=0.05, n_estimators=100, random_state=42)
    
    # Parameter Grid
    param_grid = {
        'max_depth': [4, 6, 8],
        'min_child_weight': [1, 3],
        'subsample': [0.8, 1.0],
        'colsample_bytree': [0.8, 1.0]
    }
    
    grid_search = GridSearchCV(
        estimator=xgb,
        param_grid=param_grid,
        scoring='neg_mean_squared_error',
        cv=3,
        n_jobs=-1,
        verbose=1
    )
    
    # Fit Grid Search
    grid_search.fit(X_train, y_train)
    
    print("Best parameters found: ", grid_search.best_params_)
    
    # Increase n_estimators and fit on the full train data with best parameters
    final_params = grid_search.best_params_
    final_params['learning_rate'] = 0.05
    final_params['n_estimators'] = 300
    final_params['random_state'] = 42
    
    print(f"Training final model with parameters: {final_params}")
    final_model = XGBRegressor(**final_params)
    final_model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = final_model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)
    
    print(f"\n--- EVALUATION METRICS ---")
    print(f"Test RMSE: {rmse:.4f}")
    print(f"Test R2 Score: {r2:.4f}")
    print(f"--------------------------\n")
    
    # Save Model
    os.makedirs('models', exist_ok=True)
    model_path = 'models/xgboost_model_tuned.joblib'
    joblib.dump(final_model, model_path)
    print(f"Tuned Model saved to {model_path}")
    
    # Save Feature Importance Plot
    plt.figure(figsize=(10, 6))
    importances = final_model.feature_importances_
    indices = np.argsort(importances)
    plt.barh(range(len(indices)), importances[indices], align='center', color='skyblue')
    plt.yticks(range(len(indices)), [X.columns[i] for i in indices])
    plt.xlabel('Feature Importance Rating')
    plt.title('XGBoost Feature Importance')
    plt.tight_layout()
    plt.savefig('models/feature_importance.png')
    print("Feature importance plot saved to models/feature_importance.png")

if __name__ == "__main__":
    main()
