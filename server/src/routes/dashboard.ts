import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/auth';
import { pool } from '../db';

const router = Router();

// ─── GET /api/v1/dashboard ────────────────────────────────────────────────────
// Single aggregated endpoint for the HomeScreen
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const workerId = req.workerId;

  try {
    // 1. Get worker's zone and city
    const workerRes = await pool.query(
      'SELECT city_id, zone_id FROM workers WHERE id = $1',
      [workerId]
    );
    if (workerRes.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Worker not found' } });
      return;
    }
    const { city_id, zone_id } = workerRes.rows[0];

    // Run all queries in parallel for performance
    const [
      todayCreditsRes,
      latestRiskRes,
      activePolicyRes,
      zoneInsightsRes,
      recentActivityRes,
    ] = await Promise.all([
      // 2. Today's total credits
      pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS today_credits
         FROM wallet_ledger
         WHERE worker_id = $1
           AND type = 'CREDIT'
           AND created_at >= CURRENT_DATE`,
        [workerId]
      ),

      // 3. Latest risk snapshot for worker's zone
      pool.query(
        `SELECT zrs.risk_score, zrs.order_drop_percentage, zrs.created_at,
                z.name AS zone_name, z.id AS zone_id
         FROM zone_risk_snapshots zrs
         JOIN zones z ON z.id = zrs.zone_id
         WHERE zrs.zone_id = $1
         ORDER BY zrs.created_at DESC
         LIMIT 1`,
        [zone_id]
      ),

      // 4. Active policy
      pool.query(
        `SELECT id, premium_amount, coverage_multiplier, activated_at, created_at
         FROM policies
         WHERE worker_id = $1 AND status = 'ACTIVE'
         ORDER BY activated_at DESC
         LIMIT 1`,
        [workerId]
      ),

      // 5. Zone insights — top zones in same city by latest risk
      pool.query(
        `SELECT DISTINCT ON (zrs.zone_id)
                zrs.zone_id, z.name AS zone_name,
                zrs.risk_score, zrs.order_drop_percentage,
                zrs.created_at
         FROM zone_risk_snapshots zrs
         JOIN zones z ON z.id = zrs.zone_id
         WHERE z.city_id = $1
         ORDER BY zrs.zone_id, zrs.created_at DESC`,
        [city_id]
      ),

      // 6. Recent activity — latest 5 wallet transactions
      pool.query(
        `SELECT id, amount, type, category, reference_id AS "referenceId",
                created_at AS "createdAt"
         FROM wallet_ledger
         WHERE worker_id = $1
         ORDER BY created_at DESC
         LIMIT 5`,
        [workerId]
      ),
    ]);

    // Process today's credits
    const todayCredits = parseFloat(todayCreditsRes.rows[0]?.today_credits) || 0;

    // Process latest risk
    let latestRisk = null;
    if (latestRiskRes.rows.length > 0) {
      const r = latestRiskRes.rows[0];
      const riskScore = parseFloat(r.risk_score);
      latestRisk = {
        zoneId: r.zone_id,
        zoneName: r.zone_name,
        riskScore,
        orderDrop: parseFloat(r.order_drop_percentage) || 0,
        riskLabel: getRiskLabel(riskScore),
        updatedAt: r.created_at,
      };
    }

    // Process active policy
    let policy = null;
    if (activePolicyRes.rows.length > 0) {
      const p = activePolicyRes.rows[0];
      const multiplier = parseFloat(p.coverage_multiplier);
      const activatedAt = new Date(p.activated_at);
      const renewalDate = new Date(activatedAt);
      renewalDate.setDate(renewalDate.getDate() + 30);

      policy = {
        id: p.id,
        tierName: getTierName(multiplier),
        coverageMultiplier: multiplier,
        premiumAmount: parseFloat(p.premium_amount),
        activatedAt: p.activated_at,
        renewalDate: renewalDate.toISOString(),
      };
    }

    // Process zone insights (limit to top 4 most interesting)
    const zoneInsights = zoneInsightsRes.rows
      .map(r => ({
        zoneId: r.zone_id,
        zoneName: r.zone_name.replace(' Dark Store', ''),
        riskScore: parseFloat(r.risk_score),
        orderDrop: parseFloat(r.order_drop_percentage) || 0,
        updatedAt: r.created_at,
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 4);

    // Recent activity
    const recentActivity = recentActivityRes.rows.map(r => ({
      id: r.id,
      amount: parseFloat(r.amount),
      type: r.type,
      category: r.category,
      referenceId: r.referenceId,
      createdAt: r.createdAt,
    }));

    res.json({
      success: true,
      data: {
        todayCredits,
        latestRisk,
        policy,
        zoneInsights,
        recentActivity,
      },
    });
  } catch (error: any) {
    console.error('[Dashboard] Error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTierName(multiplier: number): string {
  if (multiplier <= 0.2) return 'Basic';
  if (multiplier <= 0.4) return 'Standard';
  return 'Premium';
}

function getRiskLabel(score: number): string {
  if (score >= 0.7) return 'High disruption risk';
  if (score >= 0.4) return 'Moderate disruption risk';
  if (score >= 0.2) return 'Low disruption risk';
  return 'All clear';
}

export default router;
