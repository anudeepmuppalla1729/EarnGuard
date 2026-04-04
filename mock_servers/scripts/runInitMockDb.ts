import 'dotenv/config';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Load from .env if present, otherwise use defaults
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:Anudeep%401904@localhost:5432/mock',
});

async function initMockDb() {
  try {
    const sqlPath = path.join(__dirname, 'init_mock_db.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing init_mock_db.sql...');
    await pool.query(sql);
    console.log('Mock Database schema fully initialized successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize local Mock DB schema:', error);
    process.exit(1);
  }
}

initMockDb();
