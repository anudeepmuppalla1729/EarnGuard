import { beforeAll, afterAll } from '@jest/globals';
import { pool } from '../src/db';

beforeAll(async () => {
    // Clear dynamic tables to ensure clean slate for tests natively.
    // Using TRUNCATE CASCADE safely wipes test rows without touching schema!
    await pool.query('TRUNCATE TABLE workers CASCADE');
});

afterAll(async () => {
    // Graceful teardown of postgres connections after tests execute natively.
    await pool.query('TRUNCATE TABLE workers CASCADE');
    await pool.end();
});
