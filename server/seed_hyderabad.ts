import fs from 'fs';
import path from 'path';
import { pool } from './src/db';
import { v4 as uuidv4 } from 'uuid';

import * as dotenv from 'dotenv';
dotenv.config();

const ML_SERVER_URL = process.env.ML_URL || 'http://127.0.0.1:8000';

async function seedHyderabad() {
    try {
        const csvPath = path.resolve(__dirname, '../ml_services/city_base_price_calc_model/data/dataset.csv');
        console.log(`Reading dataset from ${csvPath}...`);
        
        const data = fs.readFileSync(csvPath, 'utf-8');
        const lines = data.split('\n').filter(l => l.trim().length > 0);
        
        const hydData = lines.slice(1).map(l => l.split(',')).filter(r => r[1] === 'Hyderabad');
        console.log(`Found ${hydData.length} records for Hyderabad. Seeding context...`);

        // 1. Insert Historical Context
        for (const row of hydData) {
            await pool.query(`
                INSERT INTO ml_weekly_context (
                    id, city_id, rainfall_mm, temperature_avg, total_orders_weekly, 
                    disruption_freq_weekly, avg_disruption_duration_hrs, demand_stability_orders,
                    holiday_flag, event_flag, city_tier, city_rank, median_income_weekly, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            `, [
                uuidv4(), 'C1', 
                parseFloat(row[10]), parseFloat(row[11]), parseFloat(row[9]), 
                parseFloat(row[6]), parseFloat(row[7]), parseFloat(row[8]), 
                parseInt(row[12]), parseInt(row[13]), parseInt(row[3]), 
                parseInt(row[4]), parseFloat(row[5]), new Date(row[2])
            ]);
        }

        // 2. Fetch Base Price via ML Server (Monthly Logic)
        const logs = await pool.query(`
            SELECT * FROM ml_weekly_context 
            WHERE city_id = 'C1' 
            ORDER BY created_at DESC 
            LIMIT 4
        `);

        const weeks = Array.from({length: 4}).map((_, i) => {
            const log = logs.rows[i] || {};
            return {
                city_id: 3, // Target ML Server ID (e.g. 3 for Hyderabad normally requested in model endpoint)
                city_name: 'Hyderabad',
                date: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                city_tier: parseInt(log.city_tier || 1),
                city_rank: parseInt(log.city_rank || 4),
                median_income_weekly: parseFloat(log.median_income_weekly || 10000.0),
                disruption_freq_weekly: parseFloat(log.disruption_freq_weekly || 0.0),
                avg_disruption_duration_hrs: parseFloat(log.avg_disruption_duration_hrs || 0.0),
                demand_stability_orders: parseFloat(log.demand_stability_orders || 0.5),
                total_orders_weekly: parseFloat(log.total_orders_weekly || 1500.0),
                rainfall_mm: parseFloat(log.rainfall_mm || 5.0),
                temperature_avg: parseFloat(log.temperature_avg || 28.0),
                holiday_flag: parseInt(log.holiday_flag || 0),
                event_flag: parseInt(log.event_flag || 0)
            };
        });

        console.log('Requesting Base Price from ML Service...');
        const baseRes = await fetch(`${ML_SERVER_URL}/api/v1/predict/monthly`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ weeks })
        });

        if (!baseRes.ok) {
            throw new Error(`Failed to fetch Base Price: ${await baseRes.text()}`);
        }
        
        const baseData = await baseRes.json();
        const basePrice = baseData.predicted_monthly_average_price;
        console.log(`ML Base Price prediction: ₹${basePrice}`);

        // 3. Fetch Weekly Addition via ML Server
        // We will simulate weekly context using latest data or defaults for simplicity:
        const latestContext = logs.rows[0] || {};
        const weeklyPayload = {
            city_id: 3,
            city: 'Hyderabad',
            base_price: basePrice,
            weather: {
                rainfall_mm: parseFloat(latestContext.rainfall_mm || 0),
                temperature: parseFloat(latestContext.temperature_avg || 25),
                extreme_alert: parseFloat(latestContext.rainfall_mm || 0) > 40,
                condition: "clear"
            },
            news_summary: "Normal local conditions predicted.",
            outages: {
                count: parseInt(latestContext.disruption_freq_weekly || 0),
                avg_duration: parseFloat(latestContext.avg_disruption_duration_hrs || 0)
            }
        };

        console.log('Requesting Weekly Addition Price from ML Service...');
        const weekRes = await fetch(`${ML_SERVER_URL}/calculate-weekly-price`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(weeklyPayload)
        });

        if (!weekRes.ok) {
            throw new Error(`Failed to fetch Weekly Addition: ${await weekRes.text()}`);
        }
        
        const weekData = await weekRes.json();
        const additionalPrice = weekData.weekly_addition || 0.0;
        const weeklyReason = weekData.reason || 'Calculated via LLM/ML';

        console.log(`ML Weekly Add-on: ₹${additionalPrice} due to: ${weeklyReason}`);

        // 4. Update city_pricing
        await pool.query(`
            INSERT INTO city_pricing (city_id, base_price, weekly_additional_price, weekly_reason, last_monthly_sync, last_weekly_sync)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            ON CONFLICT (city_id) DO UPDATE SET 
                base_price = EXCLUDED.base_price,
                weekly_additional_price = EXCLUDED.weekly_additional_price,
                weekly_reason = EXCLUDED.weekly_reason,
                last_monthly_sync = EXCLUDED.last_monthly_sync,
                last_weekly_sync = EXCLUDED.last_weekly_sync
        `, ['C1', basePrice, additionalPrice, weeklyReason]);

        console.log('Successfully completed full ML pricing integration for Hyderabad!');
        process.exit(0);

    } catch (e) {
        console.error('Fatal execution error: ', e);
        process.exit(1);
    }
}

seedHyderabad();
