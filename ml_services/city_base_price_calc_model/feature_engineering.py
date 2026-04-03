import pandas as pd

def main():
    df = pd.read_csv('data/dataset.csv')

    # Convert date column to datetime to allow .dt accessor
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'])

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

    df.to_csv("data/final_dataset.csv", index=False)
    print("Feature engineering completed. Final dataset saved to 'data/final_dataset.csv'.")

if __name__ == "__main__":
    main()