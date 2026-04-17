import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres.qrycmzouihclgkpdspvt:Anudeep%401904@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres",
  ssl: {
    rejectUnauthorized: false,
  },
});

// Helper to run simple queries
export const query = (text: string, params?: any[]) => pool.query(text, params);
