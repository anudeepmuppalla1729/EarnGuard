import { Pool } from 'pg';
import 'dotenv/config';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/mock',
});

// For quick verification
pool.on('error', (err) => {
  console.error('Mock DB Unexpected error on idle client', err);
});
