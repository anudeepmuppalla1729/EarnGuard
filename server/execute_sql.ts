import { pool } from './src/db';
import fs from 'fs';

async function initDB() {
    try {
        console.log('Connecting to database and running init_db.sql...');
        const sql = fs.readFileSync('scripts/init_db.sql', 'utf8');
        await pool.query(sql);
        console.log('Successfully added zones and reset the exact schema mapping!');
        process.exit(0);
    } catch (e) {
        console.error('Failed to initialize database: ', e);
        process.exit(1);
    }
}

initDB();
