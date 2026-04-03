import { pool } from '../src/db/index';
import * as fs from 'fs';
import * as path from 'path';

async function initDb() {
  try {
    const sqlPath = path.join(__dirname, 'init_db.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing init_db.sql...');
    await pool.query(sql);
    console.log('Database schema fully initialized successfully!');
    
    // Insert initial City Model baselines securely
    await pool.query(`INSERT INTO city_pricing (city_id, base_price, weekly_additional_price, weekly_reason) 
                      VALUES ('C1', 150.00, 20.00, 'Mock Baseline Logic')
                      ON CONFLICT DO NOTHING`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize local DB schema:', error);
    process.exit(1);
  }
}

initDb();
