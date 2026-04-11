import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { pool } from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JWT_SECRET, requireAuth, AuthRequest } from '../middlewares/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ─── Constants ───────────────────────────────────────────────────────────────
const ACCESS_TOKEN_EXPIRY  = '15m';   // short-lived
const ACCESS_TOKEN_EXPIRY_SECONDS = 900;
const REFRESH_TOKEN_EXPIRY = '7d';    // long-lived, stored in DB
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Hash a refresh token before storing it (like bcrypt but faster for tokens) */
const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

/** Issue a new JWT access token */
const signAccessToken = (workerId: string): string =>
  jwt.sign({ workerId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });

/** Create a cryptographically random opaque refresh token, persist its hash */
const createRefreshToken = async (workerId: string): Promise<string> => {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  await pool.query(
    `INSERT INTO refresh_tokens (worker_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [workerId, tokenHash, expiresAt]
  );

  return rawToken; // return the raw value to the client
};

// ─── Schemas ─────────────────────────────────────────────────────────────────

const LoginSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(6),
  }),
});

const RegisterSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(6),
    mobile: z.string().min(1), // Platform resolves worker ID from email + mobile
  }),
});

const RefreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});

// ─── POST /login ──────────────────────────────────────────────────────────────
router.post('/login', validate(LoginSchema), async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM workers WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
      return;
    }

    const worker = result.rows[0];
    const isMatch = await bcrypt.compare(password, worker.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
      return;
    }

    const accessToken  = signAccessToken(worker.id);
    const refreshToken = await createRefreshToken(worker.id);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
      },
    });
  } catch (error) {
    console.error('[Auth] login error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

/** Generate a unique fallback gig worker profile when mock server is unavailable */
function resolveGigWorker(mobile: string, email: string) {
  const uniqueId = 'WRK-FB-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);
  const name = email.split('@')[0].replace(/[^a-zA-Z]/g, ' ') || 'New Worker';
  const platforms = ['ZEPTO', 'BLINKIT', 'SWIGGY'] as const;
  const zones = ['Z1', 'Z2'];
  return {
    platformWorkerId: uniqueId,
    name,
    platform: platforms[Math.floor(Math.random() * platforms.length)],
    cityId: 'C1',
    zoneId: zones[Math.floor(Math.random() * zones.length)],
  };
}

// ─── POST /register ─────────────────────────────────────────────────────────────────────
router.post('/register', validate(RegisterSchema), async (req: Request, res: Response): Promise<void> => {
  const { email, password, mobile } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const id = uuidv4();

  try {
    // Resolve worker identity from mobile — try the mock server first, fall back to inline
    let gigWorker: { platformWorkerId: string; name: string; platform: string; cityId: string; zoneId: string };

    try {
      const MOCK_API = process.env.SIM_URL || 'http://localhost:4000';
      const lookupRes = await fetch(`${MOCK_API}/platform/workers/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mobile }),
        signal: AbortSignal.timeout(3000), // don't hang if mock server is down
      });
      if (lookupRes.ok) {
        gigWorker = await lookupRes.json();
      } else {
        gigWorker = resolveGigWorker(mobile, email);
        console.warn('[Register] Mock server lookup failed, using inline fallback');
      }
    } catch {
      gigWorker = resolveGigWorker(mobile, email);
      console.warn('[Register] Mock server unreachable, using inline fallback');
    }

    // Persist the worker
    await pool.query(
      `INSERT INTO workers (id, platform_worker_id, email, mobile, password_hash, name, city_id, zone_id, platform)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, gigWorker.platformWorkerId, email, mobile, hash, gigWorker.name, gigWorker.cityId, gigWorker.zoneId, gigWorker.platform]
    );

    res.status(201).json({
      success: true,
      data: {
        id,
        platformWorkerId: gigWorker.platformWorkerId,
        name: gigWorker.name,
        platform: gigWorker.platform,
      },
    });
  } catch (err: any) {
    if (err.code === '23505') { // unique violation
      res.status(409).json({ success: false, error: { code: 'USER_EXISTS', message: 'An account with this email or mobile already exists' } });
    } else {
      console.error('[Auth] register error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
    }
  }
});

// ─── POST /refresh ────────────────────────────────────────────────────────────
router.post('/refresh', validate(RefreshSchema), async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  const tokenHash = hashToken(refreshToken);

  try {
    const result = await pool.query(
      `SELECT * FROM refresh_tokens
       WHERE token_hash = $1 AND revoked = FALSE AND expires_at > NOW()`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ success: false, error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token is invalid or expired' } });
      return;
    }

    const storedToken = result.rows[0];

    // Rotate: revoke old token, issue new pair
    await pool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1', [storedToken.id]);

    const newAccessToken  = signAccessToken(storedToken.worker_id);
    const newRefreshToken = await createRefreshToken(storedToken.worker_id);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
      },
    });
  } catch (error) {
    console.error('[Auth] refresh error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

// ─── POST /logout ─────────────────────────────────────────────────────────────
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    try {
      await pool.query(
        'UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1',
        [tokenHash]
      );
    } catch (e) {
      // best effort
    }
  }

  res.json({ success: true, message: 'Logged out successfully' });
});

// ─── GET /me (verify token, return worker id) ─────────────────────────────────
router.get('/me', requireAuth, (req: AuthRequest, res: Response): void => {
  res.json({ success: true, data: { workerId: req.workerId } });
});

export default router;
