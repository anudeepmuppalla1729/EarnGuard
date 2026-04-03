import { Router, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { requireAuth, AuthRequest } from '../middlewares/auth';
import { pool } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

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

    const total_premium = base_price + additional_price;
    const max_payout = total_premium * 10.0; 

    const policyId = uuidv4();
    
    // Save draft policy correctly mapped to City/Pricing dynamically
    await pool.query(`
        INSERT INTO policies (id, worker_id, city_id, status, premium_amount, max_payout, coverage_multiplier)
        VALUES ($1, $2, $3, 'DRAFT', $4, $5, 1.0)
    `, [policyId, req.workerId, cityId, total_premium, max_payout]);

    res.json({ 
        success: true, 
        quote: { 
            policyId, 
            base_price, 
            additional_price, 
            reason, 
            premium_amount: total_premium, 
            max_payout 
        } 
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
    res.json({ success: true, message: 'Policy activated successfully via mock bank' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

export default router;
