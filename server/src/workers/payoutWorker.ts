import { Worker, Job } from 'bullmq';
import { redisConfig } from '../queue/redis';
import { PAYOUT_QUEUE_NAME } from '../queue/payoutQueue';
import { pool } from '../db';
import { v4 as uuidv4 } from 'uuid';

const MOCK_API_PORT = 4000;
const RISK_THRESHOLD = 0.65;

export const payoutWorker = new Worker(PAYOUT_QUEUE_NAME, async (job: Job) => {
    console.log(`[PayoutWorker] Starting hourly aggregation and payout execution... JobID: ${job.id}`);
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Step 1: Active Workers
        const workersRes = await client.query(`
            SELECT w.id as worker_id, w.platform_worker_id, w.city_id, w.zone_id, p.id as policy_id, p.premium_amount, p.coverage_multiplier
            FROM workers w
            JOIN policies p ON w.id = p.worker_id
            WHERE p.status = 'ACTIVE'
        `);
        const activeWorkers = workersRes.rows;
        
        if (activeWorkers.length === 0) {
            console.log('[PayoutWorker] No active policies found. Escaping.');
            await client.query('COMMIT');
            return;
        }

        // Step 2: Aggregate 3-min snapshots over the last 1 hour
        const aggregatedRes = await client.query(`
            SELECT zone_id, 
                   AVG(risk_score) as avg_risk, 
                   MAX(order_drop_percentage) as max_drops
            FROM zone_risk_snapshots
            WHERE created_at >= NOW() - INTERVAL '1 hour'
            GROUP BY zone_id
        `);

        if (aggregatedRes.rows.length === 0) {
            console.log('[PayoutWorker] No risk snapshots found in the last hour. Nothing to calculate.');
            await client.query('COMMIT');
            return;
        }

        const zoneRisks: Record<string, number> = {};
        const zoneOrderDrops: Record<string, number> = {};

        for (const row of aggregatedRes.rows) {
            const zoneId = row.zone_id;
            const avgRisk = parseFloat(row.avg_risk);
            const maxDrops = parseFloat(row.max_drops);
            
            zoneRisks[zoneId] = avgRisk;
            zoneOrderDrops[zoneId] = maxDrops;

            // Log securely to Hourly Analytic Table
            await client.query(`
                INSERT INTO hourly_risk_analytics (id, zone_id, avg_risk_score, max_order_drop_percentage, hour_timestamp)
                VALUES ($1, $2, $3, $4, NOW())
            `, [uuidv4(), zoneId, avgRisk, maxDrops]);
            
            console.log(`[PayoutWorker] Zone: ${zoneId} | Hourly Avg Risk: ${avgRisk.toFixed(2)} | Max Order Drops: ${maxDrops}%`);
        }

        // Step 3: Online Status Fetching (for active workers across aggregated zones)
        const onlineWorkersMap: Record<string, boolean> = {};
        const zonesToProcess = Object.keys(zoneRisks);
        
        for (const zoneId of zonesToProcess) {
            const zoneWorkers = activeWorkers.filter(w => w.zone_id === zoneId);
            if (zoneWorkers.length === 0) continue;
            
            const workerIdsInZone = zoneWorkers.map(w => w.platform_worker_id);
            const onlineRes = await fetch(`http://localhost:${MOCK_API_PORT}/platform/active-workers?zoneId=${zoneId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workerIds: workerIdsInZone })
            });
            const onlineData = onlineRes.ok ? await onlineRes.json() : { onlineWorkerIds: [] };
            onlineData.onlineWorkerIds.forEach((id: string) => { onlineWorkersMap[id] = true; });
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

        // Step 4: Execution Loop
        for (const worker of activeWorkers) {
            const riskScore = zoneRisks[worker.zone_id];
            
            // Skip if no snapshot data for zone, or not passing threshold
            if (riskScore === undefined || riskScore < RISK_THRESHOLD) {
                continue;
            }
        
            if (!onlineWorkersMap[worker.platform_worker_id]) {
                console.log(`[PayoutWorker] Skipping Worker ${worker.worker_id} - Offline/Inactive.`);
                continue;
            }

            if (duplicateCooldownMap[worker.worker_id]) {
                console.log(`[PayoutWorker] Skipping Worker ${worker.worker_id} - CD Active.`);
                continue;
            }

            // Duration is always 1 hour for the aggregated hourly loop
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
                
                await client.query(`
                  INSERT INTO claims (id, policy_id, worker_id, payout_amount, risk_score, severity_multiplier, disruption_type, status)
                  VALUES ($1, $2, $3, $4, $5, 1.0, 'SYSTEM_TRIGGER', $6)
                `, [claimId, worker.policy_id, worker.worker_id, payout, riskScore, claimStatus]);
                
                if (claimStatus === 'APPROVED') {
                    await client.query(`
                      INSERT INTO wallet_ledger (id, worker_id, amount, type, category, reference_id, idempotency_key)
                      VALUES ($1, $2, $3, 'CREDIT', 'CLAIM_PAYOUT', $4, $5)
                    `, [uuidv4(), worker.worker_id, payout, claimId, `payout-${claimId}`]);
                    
                    await client.query(`
                      INSERT INTO outbox_events (id, event_type, payload, status)
                      VALUES ($1, 'CLAIM_PAYOUT_INITIATED', $2, 'PENDING')
                    `, [uuidv4(), JSON.stringify({ workerId: worker.worker_id, amount: payout, reason: 'Aggregated Hourly Risk Exceeded' })]);
                    
                    console.log(`[PayoutWorker] => Paid out ₹${payout.toFixed(2)} to Worker ${worker.worker_id}`);
                } else {
                    console.log(`[PayoutWorker] => Queued PENDING manual claim for Worker ${worker.worker_id}`);
                }
            }
        }
        
        // Step 5: Clean up old low-latency snapshots
        await client.query(`DELETE FROM zone_risk_snapshots WHERE created_at < NOW() - INTERVAL '1 hour'`);

        await client.query('COMMIT');
        console.log(`[PayoutWorker] 1-Hour Aggregation & Payout Routine complete.`);
    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error('[PayoutWorker] Routine FAILED:', err);
    } finally {
        client.release();
    }
}, { connection: redisConfig });
