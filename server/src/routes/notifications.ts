import { Router, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { requireAuth, AuthRequest } from '../middlewares/auth';
import { pool } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ─── GET /api/v1/notifications ────────────────────────────────────────────────
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const page      = parseInt(req.query.page      as string) || 1;
  const limit     = parseInt(req.query.limit     as string) || 20;
  const unreadOnly = req.query.unreadOnly === 'true';
  const offset    = (page - 1) * limit;

  try {
    const unreadFilter = unreadOnly ? 'AND read = FALSE' : '';

    const [countRes, dataRes] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FROM notifications WHERE worker_id = $1 ${unreadFilter}`,
        [req.workerId]
      ),
      pool.query(
        `SELECT
           id,
           title,
           message,
           'SYSTEM' AS type,
           read,
           created_at AS "createdAt"
         FROM notifications
         WHERE worker_id = $1 ${unreadFilter}
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
    console.error('[Notifications] list error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ─── PUT /api/v1/notifications/:id/read ──────────────────────────────────────
router.put('/:id/read', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await pool.query(
      'UPDATE notifications SET read = TRUE WHERE id = $1 AND worker_id = $2',
      [req.params.id, req.workerId]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ─── POST /api/v1/notifications/devices ──────────────────────────────────────
const DeviceSchema = z.object({
  body: z.object({
    deviceId: z.string().min(1),
    fcmToken: z.string().min(1),
  }),
});

router.post('/devices', requireAuth, validate(DeviceSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  const { deviceId, fcmToken } = req.body;
  try {
    await pool.query(
      `INSERT INTO devices (id, worker_id, fcm_token)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET fcm_token = EXCLUDED.fcm_token`,
      [deviceId, req.workerId, fcmToken]
    );
    res.json({ success: true, data: { deviceId, registered: true } });
  } catch (error: any) {
    console.error('[Notifications] registerDevice error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

export default router;
