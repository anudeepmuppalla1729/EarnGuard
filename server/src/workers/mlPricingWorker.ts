import { Worker, Job } from 'bullmq';
import { redisConfig } from '../queue/redis';
import { PRICING_QUEUE_NAME } from '../queue/pricingQueue';
import { pool } from '../db';

const ML_SERVER_URL = 'http://127.0.0.1:8000';

export const mlPricingWorker = new Worker(PRICING_QUEUE_NAME, async (job: Job) => {
    const { type } = job.data;
    console.log(`[MLPricingWorker] Running ${type} pricing job...`);

    const client = await pool.connect();
    
    try {
        const result = await client.query('SELECT id as city_id, name as city_name FROM cities');
        const cities = result.rows;

        for (const city of cities) {
            if (type === 'MONTHLY') {
                const logs = await client.query(`
                    SELECT * FROM ml_weekly_context 
                    WHERE city_id = $1 
                    ORDER BY created_at DESC 
                    LIMIT 4
                `, [city.city_id]);

                // Dummy Padding Contingency fallback dynamically resolving sparse arrays natively
                const weeks = Array.from({length: 4}).map((_, i) => {
                    const log = logs.rows[i] || {};
                    return {
                        city_id: 1, // internal int fallback for model
                        city_name: city.city_name,
                        date: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        city_tier: parseInt(log.city_tier || 1),
                        city_rank: parseInt(log.city_rank || 1),
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

                // Fetch Base Price
                const baseRes = await fetch(`${ML_SERVER_URL}/api/v1/predict/monthly`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ weeks })
                });
                
                if (baseRes.ok) {
                    const data = await baseRes.json();
                    
                    await client.query(`
                        UPDATE city_pricing 
                        SET base_price = $1, last_monthly_sync = NOW()
                        WHERE city_id = $2
                    `, [data.predicted_monthly_average_price, city.city_id]);
                    console.log(`[MLPricingWorker] Updated Monthly Base Price for ${city.city_id} to ₹${data.predicted_monthly_average_price}`);
                } else {
                    console.error(`[MLPricingWorker] Failed fetching Monthly Base from ML Service for ${city.city_id}`);
                }
            } 
            else if (type === 'WEEKLY') {
                const MOCK_URL = process.env.MOCK_SERVER_URL || 'http://127.0.0.1:4000';
                
                // Fetch Live Context from Simulator
                const weatherRes = await fetch(`${MOCK_URL}/weather?city=${city.city_id}`);
                const weather = await weatherRes.json();
                
                const newsRes = await fetch(`${MOCK_URL}/news?city=${city.city_id}`);
                const news = await newsRes.json();
                const news_summary = news.events && news.events.length > 0 ? news.events.map((e:any) => e.title).join(". ") : "Normal local conditions.";
                
                const outagesRes = await fetch(`${MOCK_URL}/platform/outages?city=${city.city_id}`);
                const outages = await outagesRes.json();
                const outage_count = outages.metadata?.total_count || 0;
                const outage_duration = outages.metadata?.avg_duration_hours || 0;

                const marketRes = await fetch(`${MOCK_URL}/market?city=${city.city_id}`);
                const market = await marketRes.json();

                const priceCheck = await client.query('SELECT base_price FROM city_pricing WHERE city_id = $1', [city.city_id]);
                const basePrice = priceCheck.rows.length > 0 ? parseFloat(priceCheck.rows[0].base_price) : 150.0;

                // Fetch Weekly Risk from ML Server
                const weekRes = await fetch(`${ML_SERVER_URL}/calculate-weekly-price`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        city_id: 1, // map specific ID natively
                        city: city.city_name,
                        base_price: basePrice,
                        weather: {
                            rainfall_mm: weather.rainfall_mm || 0,
                            temperature: weather.temperature || 25,
                            extreme_alert: weather.extreme_alert || false,
                            condition: weather.condition || "clear"
                        },
                        news_summary: news_summary,
                        outages: {
                            count: outage_count,
                            avg_duration: outage_duration
                        }
                    })
                });
                
                if (weekRes.ok) {
                    const data = await weekRes.json();
                    const additionalPrice = data.weekly_addition || 0.0;
                    const reason = data.reason || "Standard risk evaluation applied.";
                    
                    await client.query(`
                        UPDATE city_pricing 
                        SET weekly_additional_price = $1, weekly_reason = $2, last_weekly_sync = NOW()
                        WHERE city_id = $3
                    `, [additionalPrice, reason, city.city_id]);

                    await client.query(`
                        INSERT INTO ml_weekly_context (id, city_id, rainfall_mm, temperature_avg, disruption_freq_weekly, avg_disruption_duration_hrs, demand_stability_orders, total_orders_weekly, holiday_flag, event_flag, city_tier, city_rank, median_income_weekly)
                        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    `, [
                        city.city_id, 
                        weather.rainfall_mm||0, weather.temperature||25, 
                        outage_count, outage_duration,
                        market.demand_stability_orders || 0.5, market.total_orders_weekly || 1500.0,
                        market.holiday_flag || 0, market.event_flag || 0,
                        market.city_tier || 1, market.city_rank || 1, market.median_income_weekly || 10000.0
                    ]);

                    console.log(`[MLPricingWorker] Updated Weekly Add-On for ${city.city_id} to ₹${additionalPrice} & Logs Appended.`);
                } else {
                    console.error(`[MLPricingWorker] Failed fetching Weekly Add-On for ${city.city_id}`);
                }
            }
        }
    } catch (err) {
        console.error('[MLPricingWorker] Fatal execution error:', err);
    } finally {
        client.release();
    }
}, { connection: redisConfig });
