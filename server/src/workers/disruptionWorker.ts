import { Worker, Job } from 'bullmq';
import { connection } from '../queue/redis';
import { DISRUPTION_QUEUE_NAME } from '../queue/disruptionQueue';
import { pool } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { computeNewsRiskProlog } from './rules';

const MOCK_API_PORT = 4000;
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
    console.log(`[DisruptionWorker] Starting 1-hour interval detection... JobID: ${job.id}`);
    
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
            const newsRes = await fetch(`http://localhost:${MOCK_API_PORT}/news?cityId=${cityId}`);
            const newsData = newsRes.ok ? await newsRes.json() : {};
            const headline = newsData?.headline || "";
            // Use Prolog integration constraint (fallback to old logic bound if Prolog yields nothing)
            const prologRisk = await computeNewsRiskProlog(headline);
            cityNewsCache[cityId] = Math.max(prologRisk, (newsData?.confidence || 0.0) * 0.5);

            const weatherRes = await fetch(`http://localhost:${MOCK_API_PORT}/weather?cityId=${cityId}`);
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
            const onlineRes = await fetch(`http://localhost:${MOCK_API_PORT}/platform/active-workers?zoneId=${zoneId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workerIds: workerIdsInZone })
            });
            const onlineData = onlineRes.ok ? await onlineRes.json() : { onlineWorkerIds: [] };
            onlineData.onlineWorkerIds.forEach((id: string) => { onlineWorkersMap[id] = true; });
            
            const trafficRes = await fetch(`http://localhost:${MOCK_API_PORT}/traffic?zoneId=${zoneId}`);
            const trafficData = trafficRes.ok ? await trafficRes.json() : {};
            const trafficRisk = trafficData.trafficRiskScore || 0.0;

            const platRes = await fetch(`http://localhost:${MOCK_API_PORT}/platform?zoneId=${zoneId}`);
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

        const recentClaimsRes = await client.query(`
            SELECT worker_id 
            FROM claims 
            WHERE status = 'APPROVED' 
              AND disruption_type = 'SYSTEM_TRIGGER'
              AND created_at > NOW() - INTERVAL '24 hours'
        `);
        const duplicateCooldownMap: Record<string, boolean> = {};
        recentClaimsRes.rows.forEach(r => { duplicateCooldownMap[r.worker_id] = true; });

        const currentHour = new Date().getHours();

        // Execution Loop
        for (const worker of activeWorkers) {
            if (!onlineWorkersMap[worker.platform_worker_id]) {
                console.log(`[DisruptionWorker] Skipping Worker ${worker.worker_id} - Offline/Inactive.`);
                continue;
            }

            if (duplicateCooldownMap[worker.worker_id]) {
                console.log(`[DisruptionWorker] Skipping Worker ${worker.worker_id} - CD Active.`);
                continue;
            }

            const riskScore = zoneRisks[worker.zone_id];
            
            if (riskScore >= RISK_THRESHOLD) {
                // Determine duration logic (1 hr runs = 1 hr interval computation)
                const durationHours = 1.0; 
                
                // Dynamically fetch worker's unique historical income for this hour
                const statRes = await fetch(`http://localhost:${MOCK_API_PORT}/platform/workers/${worker.platform_worker_id}/income-stats?hour=${currentHour}`);
                let incomeRate = 120; // Default fallback
                if (statRes.ok) {
                    const stats = await statRes.json();
                    incomeRate = stats.hourlyAverageIncome || 120;
                }
                
                const intervalLoss = incomeRate * durationHours;
                const baseCoverage = parseFloat(worker.coverage_multiplier) * parseFloat(worker.premium_amount);
                const remainingLoss = Math.max(0, intervalLoss - baseCoverage);
                const riskAdjusted = remainingLoss * riskScore;
                const payout = baseCoverage + riskAdjusted;
                
                const hasOrderDrops = zoneOrderDrops[worker.zone_id] > 0;
                const claimStatus = hasOrderDrops ? 'APPROVED' : 'PENDING';
                
                if (payout > 0) {
                    const claimId = uuidv4();
                    
                    // 1. Insert Claim (If orderdrops <= 0 it is PENDING for review)
                    await client.query(`
                      INSERT INTO claims (id, policy_id, worker_id, payout_amount, risk_score, severity_multiplier, disruption_type, status)
                      VALUES ($1, $2, $3, $4, $5, 1.0, 'SYSTEM_TRIGGER', $6)
                    `, [claimId, worker.policy_id, worker.worker_id, payout, riskScore, claimStatus]);
                    
                    if (claimStatus === 'APPROVED') {
                        // 2. Ledger Credit Topup
                        await client.query(`
                          INSERT INTO wallet_ledger (id, worker_id, amount, type, category, reference_id, idempotency_key)
                          VALUES ($1, $2, $3, 'CREDIT', 'CLAIM_PAYOUT', $4, $5)
                        `, [uuidv4(), worker.worker_id, payout, claimId, `payout-${claimId}`]);
                        
                        // 3. Outbox Event
                        await client.query(`
                          INSERT INTO outbox_events (id, event_type, payload, status)
                          VALUES ($1, 'CLAIM_PAYOUT_INITIATED', $2, 'PENDING')
                        `, [uuidv4(), JSON.stringify({ workerId: worker.worker_id, amount: payout, reason: 'Risk Threshold Exceeded' })]);
                        
                        console.log(`[DisruptionWorker] => Paid out ₹${payout.toFixed(2)} to Worker ${worker.worker_id}`);
                    } else {
                        console.log(`[DisruptionWorker] => Queued PENDING manual claim (No Order Drops) for Worker ${worker.worker_id}`);
                    }
                }
            }
        }
        
        await client.query('COMMIT');
        console.log(`[DisruptionWorker] 1-Hour Routine complete.`);
    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error('[DisruptionWorker] Routine FAILED:', err);
    } finally {
        client.release();
    }
}, { connection });
