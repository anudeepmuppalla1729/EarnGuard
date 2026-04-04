import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/auth';
import { pool } from '../db';

const router = Router();

// ─── GET /api/v1/claims ───────────────────────────────────────────────────────
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const page  = parseInt(req.query.page  as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  try {
    const [countRes, dataRes] = await Promise.all([
      pool.query(
        'SELECT COUNT(*) FROM claims WHERE worker_id = $1',
        [req.workerId]
      ),
      pool.query(
        `SELECT
           id,
           policy_id        AS "policyId",
           worker_id        AS "workerId",
           payout_amount    AS "payoutAmount",
           risk_score       AS "riskScore",
           severity_multiplier AS "severityMultiplier",
           disruption_type  AS "disruptionType",
           status,
           created_at       AS "createdAt"
         FROM claims
         WHERE worker_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.workerId, limit, offset]
      ),
    ]);

    const total = parseInt(countRes.rows[0].count);

    // Convert numeric strings from pg to floats
    const items = dataRes.rows.map(r => ({
      ...r,
      payoutAmount:        parseFloat(r.payoutAmount),
      riskScore:           parseFloat(r.riskScore),
      severityMultiplier:  parseFloat(r.severityMultiplier),
    }));

    res.json({
      success: true,
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[Claims] list error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

export default router;
