import { Worker, Job } from 'bullmq';
import { redisConfig } from '../queue/redis';
import { DISRUPTION_QUEUE_NAME } from '../queue/disruptionQueue';
import { pool } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { computeNewsRiskProlog } from './rules';

import * as dotenv from 'dotenv';
dotenv.config();

const SIM_URL = process.env.SIM_URL || 'http://localhost:4000';
const RISK_THRESHOLD = 0.65; // Threshold to trigger claim payouts

/** Weather logic computation */
function computeWeatherRisk(weatherData: any): number {
    let score = 0.0;
    if (weatherData?.condition === "CYCLONE" || weatherData?.condition === "HEAVY_RAIN") {
        score += 0.8;
    } else if (weatherData?.condition === "MODERATE") {
        score += 0.4;
    } else if (weatherData?.condition === "DRIZZLE") {
        score += 0.1;
    }
    
    if (weatherData?.rainfall_mm > 100) score += 0.8;
    if (weatherData?.extreme_alert === true) score += 0.2;
    return Math.min(1.0, score);
}

/** Platform logic computation */
function computePlatformRisk(platformData: any): number {
    let score = 0.0;
    if (platformData?.orderDropPercentage > 60) score += 0.7;
    if (platformData?.avgDeliveryTime > 40) score += 0.2; // Delays
    return Math.min(1.0, score);
}

export const disruptionWorker = new Worker(DISRUPTION_QUEUE_NAME, async (job: Job) => {
    console.log(`[DisruptionWorker] Starting 3-minute interval detection... JobID: ${job.id}`);
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Step 1: Zone Mapping (Fetch unique zone_id mapped with active target cities)
        const workersRes = await client.query(`
            SELECT w.id as worker_id, w.platform_worker_id, w.city_id, w.zone_id, p.id as policy_id, p.premium_amount, p.coverage_multiplier
            FROM workers w
            JOIN policies p ON w.id = p.worker_id
            WHERE p.status = 'ACTIVE'
        `);
        const activeWorkers = workersRes.rows;
        
        if (activeWorkers.length === 0) {
            console.log('[DisruptionWorker] No active policies found. Escaping.');
            await client.query('COMMIT');
            return;
        }

        const cities = new Set(activeWorkers.map(w => w.city_id));
        const cityNewsCache: Record<string, number> = {};
        const cityWeatherCache: Record<string, number> = {};

        // 🔹 For CITY (Shared across zones)
        for (const cityId of cities) {
            const newsRes = await fetch(`${SIM_URL}/news?cityId=${cityId}`);
            const newsData = newsRes.ok ? await newsRes.json() : {};
            const headline = newsData?.headline || "";
            // Use Prolog integration constraint (fallback to old logic bound if Prolog yields nothing)
            const prologRisk = await computeNewsRiskProlog(headline);
            cityNewsCache[cityId] = Math.max(prologRisk, (newsData?.confidence || 0.0) * 0.5);

            const weatherRes = await fetch(`${SIM_URL}/weather?cityId=${cityId}`);
            const weatherData = weatherRes.ok ? await weatherRes.json() : {};
            cityWeatherCache[cityId] = computeWeatherRisk(weatherData);
        }

        const zones = new Set(activeWorkers.map(w => w.zone_id));
        const zoneRisks: Record<string, number> = {};
        const zoneOrderDrops: Record<string, number> = {};
        const onlineWorkersMap: Record<string, boolean> = {};

        // 🔹 For EACH ZONE (Zone-Level Signals)
        for (const zoneId of zones) {
            const zoneWorkers = activeWorkers.filter(w => w.zone_id === zoneId);
            if (zoneWorkers.length === 0) continue;
            const cityId = zoneWorkers[0].city_id;
            
            const workerIdsInZone = zoneWorkers.map(w => w.platform_worker_id);
            const onlineRes = await fetch(`${SIM_URL}/platform/active-workers?zoneId=${zoneId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workerIds: workerIdsInZone })
            });
            const onlineData = onlineRes.ok ? await onlineRes.json() : { onlineWorkerIds: [] };
            onlineData.onlineWorkerIds.forEach((id: string) => { onlineWorkersMap[id] = true; });
            
            const trafficRes = await fetch(`${SIM_URL}/traffic?zoneId=${zoneId}`);
            const trafficData = trafficRes.ok ? await trafficRes.json() : {};
            const trafficRisk = trafficData.trafficRiskScore || 0.0;

            const platRes = await fetch(`${SIM_URL}/platform?zoneId=${zoneId}`);
            const platData = platRes.ok ? await platRes.json() : {};
            const platformRisk = computePlatformRisk(platData);
            zoneOrderDrops[zoneId] = platData?.orderDropPercentage || 0;

            const newsRisk = cityNewsCache[cityId] || 0.0;
            const weatherRisk = cityWeatherCache[cityId] || 0.0;

            const finalRisk = 
              0.35 * weatherRisk +
              0.30 * trafficRisk +
              0.20 * platformRisk +
              0.15 * newsRisk;
              
            zoneRisks[zoneId] = finalRisk;
            console.log(`[DisruptionWorker] Zone: ${zoneId} | Final Computed Risk: ${finalRisk.toFixed(2)} | Order Drops: ${zoneOrderDrops[zoneId]}%`);
        }

        // Execution Loop: Removed payout logic. Now we just INSERT 3-min granular Risk Snapshots
        for (const zoneId of zones) {
            const riskScore = zoneRisks[zoneId];
            const orderDrops = zoneOrderDrops[zoneId] || 0;

            await client.query(`
                INSERT INTO zone_risk_snapshots (id, zone_id, risk_score, order_drop_percentage)
                VALUES ($1, $2, $3, $4)
            `, [uuidv4(), zoneId, riskScore, orderDrops]);
        }
        
        await client.query('COMMIT');
        console.log(`[DisruptionWorker] 3-Minute Routine complete.`);
    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error('[DisruptionWorker] Routine FAILED:', err);
    } finally {
        client.release();
    }
}, { connection: redisConfig });
