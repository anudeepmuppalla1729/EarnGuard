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
      quotes.push({
        policyId: uuidv4(), // Kept simply so UI lists don't break key extraction
        tier: opt.tier,
        base_price: parseFloat((base_price * (opt.tier === 'BASIC' ? 1.0 : opt.tier === 'STANDARD' ? 1.2 : 1.5)).toFixed(2)),
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
    tier: z.enum(['BASIC', 'STANDARD', 'PREMIUM']),
    idempotencyKey: z.string(),
  }),
});

router.post('/activate', requireAuth, validate(ActivateSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  const { tier, idempotencyKey } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    // Check if user already has an active policy
    const existingCheck = await client.query('SELECT id FROM policies WHERE worker_id = $1 AND status = $2', [req.workerId, 'ACTIVE']);
    if (existingCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      res.status(409).json({ error: 'Worker already has an active policy' });
      return;
    }

    // Dynamically fetch City Market attributes
    const pricingRes = await client.query(`
        SELECT cp.base_price, cp.weekly_additional_price, w.city_id
        FROM workers w
        JOIN city_pricing cp ON w.city_id = cp.city_id
        WHERE w.id = $1
    `, [req.workerId]);

    let base_price = 150.00;
    let additional_price = 0.0;
    let cityId = 'C1';

    if (pricingRes.rows.length > 0) {
        base_price = parseFloat(pricingRes.rows[0].base_price);
        additional_price = parseFloat(pricingRes.rows[0].weekly_additional_price);
        cityId = pricingRes.rows[0].city_id;
    }

    const multiplierMap: Record<string, { priceMult: number, coverage: number }> = {
      BASIC: { priceMult: 1.0, coverage: 0.2 },
      STANDARD: { priceMult: 1.2, coverage: 0.4 },
      PREMIUM: { priceMult: 1.5, coverage: 0.6 }
    };
    
    const config = multiplierMap[tier];
    const premium = parseFloat(((base_price * config.priceMult) + additional_price).toFixed(2));
    
    // MOCK BANK INTEGRATION
    console.log(`[MockBank] Processing external card payment. Premium: ₹${premium} | Ref: ${idempotencyKey}`);

    const policyId = uuidv4();
    // ACTUALLY INSERT the policy as active now that it's paid
    await client.query(`
      INSERT INTO policies (id, worker_id, city_id, status, premium_amount, coverage_multiplier, activated_at, created_at)
      VALUES ($1, $2, $3, 'ACTIVE', $4, $5, NOW(), NOW())
    `, [policyId, req.workerId, cityId, premium, config.coverage]);

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
