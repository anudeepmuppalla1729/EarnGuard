import { Router, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { requireAuth, AuthRequest } from '../middlewares/auth';
import { pool } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ─── GET /api/v1/policies ──────────────────────────────────────────────────────
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const page  = parseInt(req.query.page  as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  try {
    const [countRes, dataRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM policies WHERE worker_id = $1', [req.workerId]),
      pool.query(
        `SELECT
           id,
           worker_id          AS "workerId",
           city_id            AS "cityId",
           status,
           premium_amount     AS "premiumAmount",
           coverage_multiplier AS "coverageMultiplier",
           activated_at       AS "activatedAt",
           created_at         AS "createdAt"
         FROM policies
         WHERE worker_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.workerId, limit, offset]
      ),
    ]);

    const total = parseInt(countRes.rows[0].count);
    const items = dataRes.rows.map(r => ({
      ...r,
      premiumAmount:       parseFloat(r.premiumAmount),
      coverageMultiplier:  parseFloat(r.coverageMultiplier),
    }));

    res.json({
      success: true,
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('[Policies] list error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// This would typically ping the ML service, but for now we create a mock response mapping
router.post('/quote', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Dynamically fetch exact City Market attributes for this explicitly authenticated Worker
    const pricingRes = await pool.query(`
        SELECT cp.base_price, cp.weekly_additional_price, cp.weekly_reason, w.city_id
        FROM workers w
        JOIN city_pricing cp ON w.city_id = cp.city_id
        WHERE w.id = $1
    `, [req.workerId]);

    let base_price = 150.00;
    let additional_price = 0.0;
    let reason = "Standard city metrics apply.";
    let cityId = 'C1';

    if (pricingRes.rows.length > 0) {
        base_price = parseFloat(pricingRes.rows[0].base_price);
        additional_price = parseFloat(pricingRes.rows[0].weekly_additional_price);
        cityId = pricingRes.rows[0].city_id;
        if (pricingRes.rows[0].weekly_reason) {
            reason = pricingRes.rows[0].weekly_reason;
        }
    }

    // Generate 3 Options
    const options = [
      {
        tier: 'BASIC',
        premium_amount: parseFloat(((base_price * 1.0) + additional_price).toFixed(2)),
        coverage_multiplier: 0.2
      },
      {
        tier: 'STANDARD',
        premium_amount: parseFloat(((base_price * 1.2) + additional_price).toFixed(2)),
        coverage_multiplier: 0.4
      },
      {
        tier: 'PREMIUM',
        premium_amount: parseFloat(((base_price * 1.5) + additional_price).toFixed(2)),
        coverage_multiplier: 0.6
      }
    ];

    const quotes = [];
    
    for (const opt of options) {
      const policyId = uuidv4();
      
      // Save draft policy
      await pool.query(`
          INSERT INTO policies (id, worker_id, city_id, status, premium_amount, coverage_multiplier)
          VALUES ($1, $2, $3, 'DRAFT', $4, $5)
      `, [policyId, req.workerId, cityId, opt.premium_amount, opt.coverage_multiplier]);

      quotes.push({
        policyId,
        tier: opt.tier,
        base_price,
        additional_price: additional_price,
        reason,
        premium_amount: opt.premium_amount
      });
    }

    res.json({ 
        success: true, 
        quotes
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const ActivateSchema = z.object({
  body: z.object({
    policyId: z.string().uuid(),
    idempotencyKey: z.string(),
  }),
});

router.post('/activate', requireAuth, validate(ActivateSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  const { policyId, idempotencyKey } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    // Get policy & check state mapping
    const policyResult = await client.query('SELECT * FROM policies WHERE id = $1 AND worker_id = $2 FOR UPDATE', [policyId, req.workerId]);
    if (policyResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Policy not found' });
      return;
    }

    if (policyResult.rows[0].status === 'ACTIVE') {
      await client.query('ROLLBACK');
      res.status(409).json({ error: 'Policy already activated' });
      return;
    }

    if (policyResult.rows[0].status !== 'DRAFT') {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'Invalid policy state' });
      return;
    }

    const premium = policyResult.rows[0].premium_amount;

    // MOCK BANK INTEGRATION
    // Wallet ledger is ONLY for claims payouts. Premium is paid explicitly via Bank.
    console.log(`[MockBank] Processing external card payment. Premium: ₹${premium} | Ref: ${idempotencyKey}`);

    // Activate Policy
    await client.query(`
      UPDATE policies SET status = 'ACTIVE', activated_at = NOW() WHERE id = $1
    `, [policyId]);

    await client.query('COMMIT');
    res.json({
      success: true,
      data: {
        policyId,
        status: 'ACTIVE',
        activatedAt: new Date().toISOString(),
        bankTransactionId: `TXN-MOCK-${Date.now()}`,
      },
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

export default router;
