import numpy as np
import pandas as pd

np.random.seed(42)

# -------------------------------
# CONFIG
# -------------------------------
NUM_WEEKS = 52
START_DATE = "2024-01-01"

dates = pd.date_range(start=START_DATE, periods=NUM_WEEKS, freq='W')

# -------------------------------
# TOP 100 INDIAN CITIES
# -------------------------------
city_names = [
    "Mumbai","Delhi","Bangalore","Hyderabad","Ahmedabad","Chennai","Kolkata","Pune","Jaipur","Surat",
    "Lucknow","Kanpur","Nagpur","Indore","Thane","Bhopal","Visakhapatnam","Patna","Vadodara","Ghaziabad",
    "Ludhiana","Agra","Nashik","Faridabad","Meerut","Rajkot","Kalyan","Vasai","Varanasi","Srinagar",
    "Aurangabad","Dhanbad","Amritsar","Navi Mumbai","Allahabad","Ranchi","Howrah","Coimbatore","Jabalpur","Gwalior",
    "Vijayawada","Jodhpur","Madurai","Raipur","Kota","Chandigarh","Guwahati","Solapur","Hubli","Tiruchirappalli",
    "Bareilly","Mysore","Tiruppur","Gurgaon","Aligarh","Jalandhar","Bhubaneswar","Salem","Warangal","Mira Bhayandar",
    "Thiruvananthapuram","Bhiwandi","Saharanpur","Gorakhpur","Guntur","Bikaner","Amravati","Noida","Jamshedpur","Bhilai",
    "Cuttack","Firozabad","Kochi","Bhavnagar","Dehradun","Durgapur","Asansol","Nanded","Kolhapur","Ajmer",
    "Gulbarga","Jamnagar","Ujjain","Loni","Siliguri","Jhansi","Ulhasnagar","Nellore","Jammu","Sangli",
    "Belgaum","Mangalore","Ambattur","Tirunelveli","Malegaon","Gaya","Jalgaon","Udaipur","Maheshtala","Davanagere"
]

data = []

# -------------------------------
# GENERATION LOOP
# -------------------------------
for city_id, city_name in enumerate(city_names):

    # City-level properties
    city_tier = np.random.choice([1, 2, 3])
    city_rank = city_id + 1

    # Hidden factors
    risk_factor = np.random.uniform(0.8, 1.5)
    demand_factor = np.random.uniform(0.7, 1.5)

    # -------------------------------
    # BASE INCOME (REALISTIC)
    # -------------------------------
    if city_tier == 1:
        base_income = np.random.uniform(8000, 18000)
    elif city_tier == 2:
        base_income = np.random.uniform(6000, 12000)
    else:
        base_income = np.random.uniform(4000, 8000)

    for week_idx, date in enumerate(dates):

        # -------------------------------
        # SEASONALITY
        # -------------------------------
        season = np.sin(2 * np.pi * week_idx / 52)

        # -------------------------------
        # DISRUPTIONS
        # -------------------------------
        disruption_freq = np.random.poisson(2 + 2 * abs(season))
        disruption_duration = np.random.uniform(0.5, 3.0) * (1 + 0.5 * abs(season))

        # -------------------------------
        # DEMAND
        # -------------------------------
        base_orders = 120 * demand_factor

        orders = (
            base_orders
            + 30 * season
            - 6 * disruption_freq
            + np.random.normal(0, 15)
        )

        orders = max(20, orders)

        demand_stability = np.clip(
            np.random.normal(0.75, 0.1) - 0.1 * disruption_freq,
            0.1,
            1.0
        )

        # -------------------------------
        # WEATHER
        # -------------------------------
        rainfall = np.random.gamma(2, 12) * (1 + season)
        temperature = 25 + 10 * season + np.random.normal(0, 2)

        # -------------------------------
        # EVENTS
        # -------------------------------
        holiday_flag = np.random.choice([0, 1], p=[0.8, 0.2])
        event_flag = np.random.choice([0, 1], p=[0.9, 0.1])

        # -------------------------------
        # INCOME (UPDATED + PERFORMANCE BASED)
        # -------------------------------
        income = (
            base_income
            + np.random.normal(0, 800)
            + 1000 * season
        )

        # Performance-based adjustments
        income += 25 * orders
        income -= 80 * disruption_freq

        income = max(3000, income)

        # -------------------------------
        # TARGET: PREMIUM (COMPLEX)
        # -------------------------------
        risk_component = disruption_freq * disruption_duration * risk_factor
        demand_component = np.log(orders + 1) * demand_factor
        economic_component = np.sqrt(income)
        seasonal_component = 12 * season

        noise = np.random.normal(0, 8)

        premium = (
            25 * city_tier
            + 0.4 * city_rank
            + 3.0 * risk_component
            + 1.5 * demand_component
            + 2.0 * economic_component
            + seasonal_component
            + 15 * holiday_flag
            + 20 * event_flag
            + noise
        )

        premium = max(50, premium)

        # -------------------------------
        # STORE
        # -------------------------------
        data.append([
            city_id,
            city_name,
            date,
            city_tier,
            city_rank,
            income,
            disruption_freq,
            disruption_duration,
            demand_stability,
            orders,
            rainfall,
            temperature,
            holiday_flag,
            event_flag,
            premium
        ])

# -------------------------------
# DATAFRAME
# -------------------------------
columns = [
    "city_id",
    "city_name",
    "date",
    "city_tier",
    "city_rank",
    "median_income_weekly",
    "disruption_freq_weekly",
    "avg_disruption_duration_hrs",
    "demand_stability_orders",
    "total_orders_weekly",
    "rainfall_mm",
    "temperature_avg",
    "holiday_flag",
    "event_flag",
    "weekly_insurance_premium"
]

df = pd.DataFrame(data, columns=columns)

# Save
df.to_csv("synthetic_india_insurance_data_v2.csv", index=False)

print("Dataset shape:", df.shape)
print(df.head())