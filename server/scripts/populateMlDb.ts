import { pool } from '../src/db/index';
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const ML_SERVER_URL = process.env.ML_URL || 'http://localhost:8000';

async function populateMlDb() {
  try {
    console.log('Fetching Base Price from ML Service...');
    
    // Payload from ml_services/test_api.py
    const monthlyPayload = {
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
    };

    const monthlyResponse = await axios.post(`${ML_SERVER_URL}/api/v1/predict/monthly`, monthlyPayload);
    const basePrice = monthlyResponse.data.predicted_monthly_average_price;
    console.log(`EarnGuard ML predicted Base Price: ₹${basePrice}`);

    console.log('\nFetching Weekly Additional Price from ML Service...');
    // Payload from ml_services/test_weekly_calc.py
    const weeklyPayload = {
      "city_id": 101,
      "city": "Hyderabad",
      "base_price": basePrice,
      "weather": {
          "rainfall_mm": 120,
          "temperature": 30,
          "extreme_alert": true,
          "condition": "heavy rain"
      },
      "news_summary": "Flood warnings and transport strike expected next week",
      "outages": {
          "count": 3,
          "avg_duration": 2
      }
    };
    
    const weeklyResponse = await axios.post(`${ML_SERVER_URL}/calculate-weekly-price`, weeklyPayload);
    const additionalPrice = weeklyResponse.data.weekly_addition;
    const reason = weeklyResponse.data.reason;
    console.log(`EarnGuard ML predicted Additional Price: ₹${additionalPrice}`);
    console.log(`EarnGuard ML Reason: ${reason}`);

    console.log('\nUpdating Postgres DB (city_pricing) for city C1...');
    
    await pool.query(`
      INSERT INTO city_pricing (city_id, base_price, weekly_additional_price, weekly_reason) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (city_id) DO UPDATE 
      SET base_price = EXCLUDED.base_price,
          weekly_additional_price = EXCLUDED.weekly_additional_price,
          weekly_reason = EXCLUDED.weekly_reason
    `, ['C1', basePrice, additionalPrice, reason]);
    
    console.log('Database populated successfully! Mobile app will now display live ML data instead of mock baseline.');

    process.exit(0);
  } catch (error: any) {
    console.error('Failed to populate ML data to DB', error?.response?.data || error);
    process.exit(1);
  }
}

populateMlDb();
