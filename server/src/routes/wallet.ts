import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/auth';
import { pool } from '../db';

const router = Router();

// ─── GET /api/v1/wallet ───────────────────────────────────────────────────────
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN type = 'DEBIT'  THEN amount ELSE 0 END), 0) AS balance,
        MAX(created_at) AS last_updated_at
      FROM wallet_ledger
      WHERE worker_id = $1
    `, [req.workerId]);

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        balance: parseFloat(row.balance) || 0,
        currency: 'INR',
        lastUpdatedAt: row.last_updated_at ?? new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Wallet] getBalance error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ─── GET /api/v1/wallet/transactions ──────────────────────────────────────────
router.get('/transactions', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const page  = parseInt(req.query.page  as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  try {
    const [countRes, dataRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM wallet_ledger WHERE worker_id = $1', [req.workerId]),
      pool.query(
        `SELECT id, amount, type, category, reference_id AS "referenceId", created_at AS "createdAt"
         FROM wallet_ledger
         WHERE worker_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.workerId, limit, offset]
      ),
    ]);

    const total = parseInt(countRes.rows[0].count);

    res.json({
      success: true,
      data: dataRes.rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[Wallet] getTransactions error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

export default router;
