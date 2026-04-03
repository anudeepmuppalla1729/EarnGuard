import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/auth';
import { pool } from '../db';

const router = Router();

router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get worker basic info
    const workerResult = await pool.query('SELECT id, name, email, city_id, zone_id, platform FROM workers WHERE id = $1', [req.workerId]);
    if (workerResult.rows.length === 0) {
      res.status(404).json({ error: 'Worker not found' });
      return;
    }

    // Calculate dynamic wallet balance
    const balanceResult = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE 0 END), 0) AS balance
      FROM wallet_ledger 
      WHERE worker_id = $1
    `, [req.workerId]);

    const worker = workerResult.rows[0];
    worker.walletBalance = parseFloat(balanceResult.rows[0].balance);

    res.json({ success: true, data: worker });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
