import { Worker, Job } from 'bullmq';
import { connection } from '../queue/redis';
import { DISRUPTION_QUEUE_NAME } from '../queue/disruptionQueue';
import { pool } from '../db';
import { v4 as uuidv4 } from 'uuid';

const MOCK_API_PORT = 4000;
const RISK_THRESHOLD = 0.65; // Threshold to trigger claim payouts

/** Hybrid News Risk Processing logic */
function computeNewsRisk(newsData: any): number {
    const headline = (newsData?.headline || "").toUpperCase();
    
    // Step 1: Heuristic Keyword Extraction
    if (headline.includes("FLOOD") || headline.includes("HEAVY RAIN") || headline.includes("EARTHQUAKE")) {
        return 0.8;
    }
    if (headline.includes("STRIKE") || headline.includes("PROTEST")) {
        return 0.7;
    }
    if (headline.includes("ACCIDENT") || headline.includes("TRAFFIC")) {
        return 0.5;
    }
    
    // Step 2 & 3: Fallback NLP (Mocked) clamped to safe bounds (0.2 -> 0.9)
    return Math.max(0.2, Math.min(0.9, (newsData?.confidence || 0.4)));
}

/** Weather logic computation */
function computeWeatherRisk(weatherData: any): number {
    let score = 0.0;
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
    console.log(`[DisruptionWorker] Starting routine interval-detection... JobID: ${job.id}`);
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Step 1: Zone Mapping (Fetch unique zone_id mapped with active target cities)
        // Group workers by zone. 
        const workersRes = await client.query(`
            SELECT w.id as worker_id, w.city_id, w.zone_id, p.id as policy_id, p.premium_amount, p.max_payout, p.coverage_multiplier
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

        // Group workers by city_id, then by zone_id
        const cities = new Set(activeWorkers.map(w => w.city_id));
        const cityNewsCache: Record<string, number> = {};
        const cityWeatherCache: Record<string, number> = {};

        // 🔹 For CITY (Shared across zones)
        for (const cityId of cities) {
            // Fetch News Data
            const newsRes = await fetch(`http://localhost:${MOCK_API_PORT}/news?cityId=${cityId}`);
            const newsData = newsRes.ok ? await newsRes.json() : {};
            cityNewsCache[cityId] = computeNewsRisk(newsData);

            // Fetch Weather Data
            const weatherRes = await fetch(`http://localhost:${MOCK_API_PORT}/weather?cityId=${cityId}`);
            const weatherData = weatherRes.ok ? await weatherRes.json() : {};
            cityWeatherCache[cityId] = computeWeatherRisk(weatherData);
        }

        const zones = new Set(activeWorkers.map(w => w.zone_id));
        const zoneRisks: Record<string, number> = {};
        const onlineWorkersMap: Record<string, boolean> = {};

        // 🔹 For EACH ZONE (Zone-Level Signals)
        for (const zoneId of zones) {
            // Associated city & workers for this zone
            const zoneWorkers = activeWorkers.filter(w => w.zone_id === zoneId);
            const cityId = zoneWorkers[0].city_id;
            
            // Fetch verified online workers traversing the dark store via platform mock
            const workerIdsInZone = zoneWorkers.map(w => w.worker_id);
            const onlineRes = await fetch(`http://localhost:${MOCK_API_PORT}/platform/active-workers?zoneId=${zoneId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workerIds: workerIdsInZone })
            });
            const onlineData = onlineRes.ok ? await onlineRes.json() : { onlineWorkerIds: [] };
            onlineData.onlineWorkerIds.forEach((id: string) => { onlineWorkersMap[id] = true; });
            
            // Fetch Traffic Data (Risk Score comes strictly from Mock API)
            const trafficRes = await fetch(`http://localhost:${MOCK_API_PORT}/traffic?zoneId=${zoneId}`);
            const trafficData = trafficRes.ok ? await trafficRes.json() : {};
            const trafficRisk = trafficData.trafficRiskScore || 0.0;

            // Fetch Platform Outages Data
            const platRes = await fetch(`http://localhost:${MOCK_API_PORT}/platform?zoneId=${zoneId}`);
            const platData = platRes.ok ? await platRes.json() : {};
            const platformRisk = computePlatformRisk(platData);

            const newsRisk = cityNewsCache[cityId] || 0.0;
            const weatherRisk = cityWeatherCache[cityId] || 0.0;

            // Compute Final Linear Combination 
            const finalRisk = 
              0.35 * weatherRisk +
              0.30 * trafficRisk +
              0.20 * platformRisk +
              0.15 * newsRisk;
              
            zoneRisks[zoneId] = finalRisk;
            console.log(`[DisruptionWorker] Zone: ${zoneId} | Final Computed Risk: ${finalRisk.toFixed(2)}`);
        }

        // Query recent claims to prevent duplicate payouts in 24 hours
        const recentClaimsRes = await client.query(`
            SELECT worker_id 
            FROM claims 
            WHERE status = 'APPROVED' 
              AND disruption_type = 'SYSTEM_TRIGGER'
              AND created_at > NOW() - INTERVAL '24 hours'
        `);
        const duplicateCooldownMap: Record<string, boolean> = {};
        recentClaimsRes.rows.forEach(r => { duplicateCooldownMap[r.worker_id] = true; });

        // Execution & Payout Computation Loop
        for (const worker of activeWorkers) {
            if (!onlineWorkersMap[worker.worker_id]) {
                console.log(`[DisruptionWorker] Skipping Worker ${worker.worker_id} - Offline/Inactive on platform.`);
                continue;
            }

            if (duplicateCooldownMap[worker.worker_id]) {
                console.log(`[DisruptionWorker] Skipping Worker ${worker.worker_id} - CD (Cooldown period active). Duplicate SYSTEM_TRIGGER claim suppressed.`);
                continue;
            }

            const riskScore = zoneRisks[worker.zone_id];
            if (riskScore >= RISK_THRESHOLD) {
                // Claim Execution Computations
                const durationHours = 0.25; // Running every 15 mins
                const incomeRate = 120; // Predefined zone mock rate per hour 
                
                const intervalLoss = incomeRate * durationHours;
                const baseCoverage = parseFloat(worker.coverage_multiplier) * parseFloat(worker.premium_amount);
                
                const remainingLoss = Math.max(0, intervalLoss - baseCoverage);
                const riskAdjusted = remainingLoss * riskScore;
                
                const rawPayout = baseCoverage + riskAdjusted;
                const maxPayout = parseFloat(worker.max_payout);
                const payout = Math.min(rawPayout, maxPayout);
                
                if (payout > 0) {
                    const claimId = uuidv4();
                    
                    // 1. Insert Claim
                    await client.query(`
                      INSERT INTO claims (id, policy_id, worker_id, payout_amount, risk_score, severity_multiplier, disruption_type, status)
                      VALUES ($1, $2, $3, $4, $5, 1.0, 'SYSTEM_TRIGGER', 'APPROVED')
                    `, [claimId, worker.policy_id, worker.worker_id, payout, riskScore]);
                    
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
                    
                    console.log(`[DisruptionWorker] => Paid out ${payout.toFixed(2)} to Worker${worker.worker_id}`);
                }
            }
        }
        
        await client.query('COMMIT');
        console.log(`[DisruptionWorker] Routine complete.`);
    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error('[DisruptionWorker] Routine FAILED:', err);
    } finally {
        client.release();
    }
}, { connection });
