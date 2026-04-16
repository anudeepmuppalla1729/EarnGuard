import { pool } from '../db';
import { disruptionQueue } from '../queue/disruptionQueue';
import { payoutQueue } from '../queue/payoutQueue';
import { outboxQueue } from '../queue/outboxQueue';
import { pricingQueue } from '../queue/pricingQueue';
import * as dotenv from 'dotenv';
dotenv.config();

const SIM_URL = process.env.SIM_URL || 'http://localhost:4000';

// ── SYSTEM HEALTH ────────────────────────────────────────────────────────────

export const getHealth = async () => {
    const os = await import('os');
    const uptime = os.uptime();
    const mem = { free: os.freemem(), total: os.totalmem(), usedPercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100 };
    const cpuLoad = os.loadavg();

    // Event loop lag measurement
    const lagStart = Date.now();
    await new Promise(r => setImmediate(r));
    const eventLoopLag = Date.now() - lagStart;

    // DB connectivity check
    let dbStatus = 'UP';
    try { await pool.query('SELECT 1'); } catch { dbStatus = 'DOWN'; }

    const status = dbStatus === 'DOWN' ? 'DOWN' : mem.usedPercent > 90 ? 'DEGRADED' : 'UP';

    return { uptime, memory: mem, cpuLoad, eventLoopLag, dbStatus, status, nodeVersion: process.version, pid: process.pid };
};

// ── OVERVIEW METRICS ─────────────────────────────────────────────────────────

export const getMetrics = async () => {
    const [workers, policies, claimsTotal, approved, rejected, fraudFlagged, payoutSum] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM workers'),
        pool.query("SELECT COUNT(*) FROM policies WHERE status = 'ACTIVE'"),
        pool.query('SELECT COUNT(*) FROM claims'),
        pool.query("SELECT COUNT(*) FROM claims WHERE status = 'APPROVED'"),
        pool.query("SELECT COUNT(*) FROM claims WHERE status = 'REJECTED'"),
        pool.query("SELECT COUNT(*) FROM claims WHERE las_score IS NOT NULL AND las_score < 0.35"),
        pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM wallet_ledger WHERE category = 'CLAIM_PAYOUT' AND type = 'CREDIT'"),
    ]);

    const total = parseInt(claimsTotal.rows[0].count, 10);
    const approvedCount = parseInt(approved.rows[0].count, 10);
    const flaggedCount = parseInt(fraudFlagged.rows[0].count, 10);

    return {
        totalWorkers: parseInt(workers.rows[0].count, 10),
        activePolicies: parseInt(policies.rows[0].count, 10),
        totalClaims: total,
        approvalRate: total > 0 ? parseFloat(((approvedCount / total) * 100).toFixed(1)) : 0,
        fraudRate: total > 0 ? parseFloat(((flaggedCount / total) * 100).toFixed(1)) : 0,
        totalPayout: parseFloat(payoutSum.rows[0].total) || 0,
    };
};

// ── RISK MONITORING ──────────────────────────────────────────────────────────

export const getRiskOverview = async () => {
    const res = await pool.query(`
        SELECT DISTINCT ON (zs.zone_id)
            z.name as zone_name, zs.zone_id, zs.risk_score, zs.order_drop_percentage, zs.created_at
        FROM zone_risk_snapshots zs
        JOIN zones z ON z.id = zs.zone_id
        ORDER BY zs.zone_id, zs.created_at DESC
    `);

    // Fetch raw signals per zone for breakdown
    const zones = await Promise.all(res.rows.map(async (row) => {
        let breakdown = { weather: 0, traffic: 0, platform: 0, news: 0 };
        try {
            const [weatherRes, trafficRes, platRes] = await Promise.all([
                fetch(`${SIM_URL}/weather?cityId=C1`),
                fetch(`${SIM_URL}/traffic?zoneId=${row.zone_id}`),
                fetch(`${SIM_URL}/platform?zoneId=${row.zone_id}`),
            ]);
            const weather = weatherRes.ok ? await weatherRes.json() : {};
            const traffic = trafficRes.ok ? await trafficRes.json() : {};
            const plat = platRes.ok ? await platRes.json() : {};

            // Reconstruct approximate breakdown using same logic as disruptionWorker
            let wScore = 0;
            if (weather?.condition === "CYCLONE" || weather?.condition === "HEAVY_RAIN") wScore = 0.8;
            else if (weather?.condition === "MODERATE") wScore = 0.4;
            else if (weather?.condition === "DRIZZLE") wScore = 0.1;
            if (weather?.rainfall_mm > 100) wScore = Math.min(1, wScore + 0.8);

            let pScore = 0;
            if (plat?.orderDropPercentage > 60) pScore += 0.7;
            if (plat?.avgDeliveryTime > 40) pScore += 0.2;

            breakdown = {
                weather: Math.min(1, wScore),
                traffic: traffic?.trafficRiskScore || 0,
                platform: Math.min(1, pScore),
                news: 0, // news is city-level, fetched separately
            };
        } catch { /* swallow */ }

        return {
            zoneId: row.zone_id,
            zoneName: row.zone_name,
            currentRisk: parseFloat(row.risk_score),
            orderDrop: parseFloat(row.order_drop_percentage),
            lastUpdated: row.created_at,
            breakdown,
        };
    }));

    return { zones };
};

// ── ACTIVE DISRUPTIONS / EVENTS ──────────────────────────────────────────────

export const getActiveEvents = async () => {
    const res = await pool.query(`
        SELECT z.name as zone_name, h.zone_id, h.avg_risk_score, h.max_order_drop_percentage, h.hour_timestamp
        FROM hourly_risk_analytics h
        JOIN zones z ON z.id = h.zone_id
        WHERE h.avg_risk_score >= 0.50
        ORDER BY h.hour_timestamp DESC
        LIMIT 30
    `);

    return {
        activeEvents: res.rows.map(r => ({
            zoneId: r.zone_id,
            zoneName: r.zone_name,
            avgRisk: parseFloat(r.avg_risk_score),
            maxDrop: parseFloat(r.max_order_drop_percentage),
            hourWindow: r.hour_timestamp,
            triggered: true,
        })),
    };
};

// ── CLAIMS SUMMARY ───────────────────────────────────────────────────────────

export const getClaimsSummary = async () => {
    const [byStatus, byType] = await Promise.all([
        pool.query("SELECT status, COUNT(*)::int as count FROM claims GROUP BY status"),
        pool.query("SELECT claim_type, COUNT(*)::int as count FROM claims GROUP BY claim_type"),
    ]);

    const statusMap: Record<string, number> = {};
    byStatus.rows.forEach(r => { statusMap[r.status] = r.count; });

    const typeMap: Record<string, number> = {};
    byType.rows.forEach(r => { typeMap[r.claim_type] = r.count; });

    return {
        total: Object.values(statusMap).reduce((a, b) => a + b, 0),
        approved: statusMap['APPROVED'] || 0,
        rejected: statusMap['REJECTED'] || 0,
        pending: statusMap['PENDING'] || 0,
        systemClaims: typeMap['SYSTEM'] || 0,
        manualClaims: typeMap['MANUAL'] || 0,
    };
};

// ── CLAIMS DETAIL (PAGINATED + FILTERABLE) ───────────────────────────────────

export const getClaimsDetail = async (filters: { zoneId?: string; status?: string; source?: string; page: number; limit: number }) => {
    const { zoneId, status, source, page, limit } = filters;
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (zoneId) { conditions.push(`c.zone_id = $${idx++}`); params.push(zoneId); }
    if (status) { conditions.push(`c.status = $${idx++}`); params.push(status); }
    if (source) { conditions.push(`c.claim_type = $${idx++}`); params.push(source); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const [countRes, dataRes] = await Promise.all([
        pool.query(`SELECT COUNT(*) FROM claims c ${where}`, params),
        pool.query(`
            SELECT c.id, c.worker_id, c.zone_id, c.claim_type as source, c.status,
                   c.payout_amount, c.risk_score, c.las_score, c.disruption_type,
                   c.claim_note, c.rejection_reason, c.created_at
            FROM claims c ${where}
            ORDER BY c.created_at DESC
            LIMIT $${idx++} OFFSET $${idx++}
        `, [...params, limit, offset]),
    ]);

    return {
        claims: dataRes.rows.map(r => ({
            ...r,
            payout_amount: parseFloat(r.payout_amount) || 0,
            risk_score: parseFloat(r.risk_score) || 0,
            las_score: r.las_score ? parseFloat(r.las_score) : null,
        })),
        meta: { page, limit, total: parseInt(countRes.rows[0].count, 10) },
    };
};

// ── FRAUD ─────────────────────────────────────────────────────────────────────

export const getFraudInsights = async () => {
    const [totalRes, flaggedRes, lasDistRes, recentFlaggedRes] = await Promise.all([
        pool.query('SELECT COUNT(*)::int as count FROM claims'),
        pool.query("SELECT COUNT(*)::int as count FROM claims WHERE las_score IS NOT NULL AND las_score < 0.60"),
        pool.query(`
            SELECT
                SUM(CASE WHEN las_score >= 0.85 THEN 1 ELSE 0 END)::int as clean,
                SUM(CASE WHEN las_score >= 0.60 AND las_score < 0.85 THEN 1 ELSE 0 END)::int as soft_flag,
                SUM(CASE WHEN las_score >= 0.35 AND las_score < 0.60 THEN 1 ELSE 0 END)::int as hold,
                SUM(CASE WHEN las_score < 0.35 THEN 1 ELSE 0 END)::int as rejected
            FROM claims WHERE las_score IS NOT NULL
        `),
        pool.query(`
            SELECT id, worker_id, las_score, status, rejection_reason, created_at
            FROM claims WHERE las_score IS NOT NULL AND las_score < 0.60
            ORDER BY created_at DESC LIMIT 10
        `),
    ]);

    const total = totalRes.rows[0].count;
    const flagged = flaggedRes.rows[0].count;

    return {
        fraudRate: total > 0 ? parseFloat(((flagged / total) * 100).toFixed(1)) : 0,
        flaggedClaims: flagged,
        lasDistribution: lasDistRes.rows[0] || { clean: 0, soft_flag: 0, hold: 0, rejected: 0 },
        recentFlagged: recentFlaggedRes.rows.map(r => ({ ...r, las_score: parseFloat(r.las_score) })),
    };
};

// ── PAYOUTS ──────────────────────────────────────────────────────────────────

export const getPayoutStats = async () => {
    const [totalRes, todayRes, avgRes, perZoneRes] = await Promise.all([
        pool.query("SELECT COALESCE(SUM(amount), 0)::numeric as total FROM wallet_ledger WHERE category = 'CLAIM_PAYOUT' AND type = 'CREDIT'"),
        pool.query("SELECT COALESCE(SUM(amount), 0)::numeric as total FROM wallet_ledger WHERE category = 'CLAIM_PAYOUT' AND type = 'CREDIT' AND created_at >= CURRENT_DATE"),
        pool.query("SELECT COALESCE(AVG(amount), 0)::numeric as avg FROM wallet_ledger WHERE category = 'CLAIM_PAYOUT' AND type = 'CREDIT'"),
        pool.query(`
            SELECT c.zone_id, z.name as zone_name, COALESCE(SUM(wl.amount), 0)::numeric as total
            FROM wallet_ledger wl
            JOIN claims c ON wl.reference_id = c.id
            JOIN zones z ON c.zone_id = z.id
            WHERE wl.category = 'CLAIM_PAYOUT' AND wl.type = 'CREDIT'
            GROUP BY c.zone_id, z.name
        `),
    ]);

    return {
        totalPayout: parseFloat(totalRes.rows[0].total),
        payoutsToday: parseFloat(todayRes.rows[0].total),
        avgPayout: parseFloat(parseFloat(avgRes.rows[0].avg).toFixed(2)),
        payoutPerZone: perZoneRes.rows.map(r => ({ zoneId: r.zone_id, zoneName: r.zone_name, total: parseFloat(r.total) })),
    };
};

// ── QUEUES ────────────────────────────────────────────────────────────────────

export const getQueueStats = async () => {
    const queues = [
        { name: 'Disruption Detection', instance: disruptionQueue },
        { name: 'Hourly Payouts', instance: payoutQueue },
        { name: 'Outbox Sweeper', instance: outboxQueue },
        { name: 'ML Pricing', instance: pricingQueue },
    ];

    return Promise.all(queues.map(async (q) => {
        const counts = await q.instance.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
        return { queueName: q.name, ...counts };
    }));
};

// ── ML METRICS ───────────────────────────────────────────────────────────────

export const getMlMetrics = async () => {
    const [inferenceRes, avgRiskRes, anomalyRes] = await Promise.all([
        pool.query('SELECT COUNT(*)::int as count FROM ml_inference_logs'),
        pool.query('SELECT COALESCE(AVG(avg_risk_score), 0)::numeric as avg FROM hourly_risk_analytics'),
        pool.query("SELECT COUNT(*)::int as count FROM hourly_risk_analytics WHERE avg_risk_score >= 0.80"),
    ]);

    const totalAnalytics = await pool.query('SELECT COUNT(*)::int as count FROM hourly_risk_analytics');
    const totalH = totalAnalytics.rows[0].count || 1;

    return {
        avgRiskScore: parseFloat(parseFloat(avgRiskRes.rows[0].avg).toFixed(3)),
        inferenceCount: inferenceRes.rows[0].count,
        anomalyRate: parseFloat(((anomalyRes.rows[0].count / totalH) * 100).toFixed(1)),
    };
};

// ── PRICING ──────────────────────────────────────────────────────────────────

export const getPricing = async () => {
    const res = await pool.query(`
        SELECT cp.city_id, c.name as city_name, cp.base_price, cp.weekly_additional_price,
               cp.weekly_reason, cp.last_monthly_sync, cp.last_weekly_sync
        FROM city_pricing cp
        JOIN cities c ON cp.city_id = c.id
    `);

    return res.rows.map(r => ({
        cityId: r.city_id,
        cityName: r.city_name,
        basePrice: parseFloat(r.base_price),
        weeklyAdditional: parseFloat(r.weekly_additional_price),
        weeklyReason: r.weekly_reason,
        lastMonthlySync: r.last_monthly_sync,
        lastWeeklySync: r.last_weekly_sync,
    }));
};

// ── SIGNAL DEBUG ─────────────────────────────────────────────────────────────

export const getSignals = async (zoneId: string) => {
    // Determine city from zone
    const zoneRes = await pool.query('SELECT city_id FROM zones WHERE id = $1', [zoneId]);
    const cityId = zoneRes.rows[0]?.city_id || 'C1';

    const [weatherRes, trafficRes, platRes, newsRes] = await Promise.all([
        fetch(`${SIM_URL}/weather?cityId=${cityId}`).then(r => r.json()).catch(() => ({})),
        fetch(`${SIM_URL}/traffic?zoneId=${zoneId}`).then(r => r.json()).catch(() => ({})),
        fetch(`${SIM_URL}/platform?zoneId=${zoneId}`).then(r => r.json()).catch(() => ({})),
        fetch(`${SIM_URL}/news?cityId=${cityId}`).then(r => r.json()).catch(() => ({})),
    ]);

    return { zoneId, cityId, weather: weatherRes, traffic: trafficRes, platform: platRes, news: newsRes };
};

// ── SIMULATION PROXY ─────────────────────────────────────────────────────────

export const simulateSignal = async (type: string, body: any) => {
    const endpoint = `${SIM_URL}/admin/${type}`;
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return res.json();
};

// ── USERS ────────────────────────────────────────────────────────────────────

export const getUsers = async (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    const [countRes, dataRes] = await Promise.all([
        pool.query('SELECT COUNT(*)::int as count FROM workers'),
        pool.query(`
            SELECT w.id, w.name, w.email, w.mobile, w.platform, w.city_id, w.zone_id,
                   z.name as zone_name, p.status as policy_status, p.premium_amount, p.coverage_multiplier,
                   (SELECT COALESCE(SUM(CASE WHEN type='CREDIT' THEN amount ELSE -amount END), 0) FROM wallet_ledger WHERE worker_id = w.id) as wallet_balance
            FROM workers w
            LEFT JOIN zones z ON w.zone_id = z.id
            LEFT JOIN policies p ON w.id = p.worker_id AND p.status = 'ACTIVE'
            ORDER BY w.created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]),
    ]);

    return {
        users: dataRes.rows.map(r => ({
            ...r,
            premium_amount: r.premium_amount ? parseFloat(r.premium_amount) : null,
            coverage_multiplier: r.coverage_multiplier ? parseFloat(r.coverage_multiplier) : null,
            wallet_balance: parseFloat(r.wallet_balance),
        })),
        meta: { page, limit, total: countRes.rows[0].count },
    };
};
