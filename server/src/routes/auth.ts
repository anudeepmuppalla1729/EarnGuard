import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { pool } from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middlewares/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const LoginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

router.post('/login', validate(LoginSchema), async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM workers WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const worker = result.rows[0];
    const isMatch = await bcrypt.compare(password, worker.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ workerId: worker.id }, JWT_SECRET, { expiresIn: '14d' });
    res.json({ token, workerId: worker.id });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// A quick helper endpoint to register a worker for demo purposes
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, name, city_id, zone_id, platform } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const id = uuidv4();
  try {
    await pool.query(
      `INSERT INTO workers (id, email, password_hash, name, city_id, zone_id, platform) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, email, hash, name, city_id, zone_id, platform]
    );
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
