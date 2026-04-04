import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:050506@localhost:5432/earnguard',
});

// Helper to run simple queries
export const query = (text: string, params?: any[]) => pool.query(text, params);
