import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/earnguard'
});

async function main() {
    try {
        await pool.query('ALTER TABLE claims ADD COLUMN IF NOT EXISTS las_score NUMERIC(4,2);');
        console.log('Successfully added las_score to claims table');
    } catch (e) {
        console.error('Error adding column:', e);
    } finally {
        await pool.end();
    }
}

main();
