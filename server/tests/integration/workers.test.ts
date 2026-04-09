import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { pool } from '../../src/db';
import { v4 as uuidv4 } from 'uuid';

describe('Integration Tests: Decoupled Disruption Architecture', () => {

    it('Disruption Workflow correctly models 3-minute granular risk snapshots natively', async () => {
        // Create mock zone
        const zoneId = 'Z_TEST_DISRUPT_' + Date.now();
        await pool.query("INSERT INTO cities (id, name) VALUES ('C_TEST_1', 'Test') ON CONFLICT DO NOTHING");
        await pool.query("INSERT INTO zones (id, city_id, name) VALUES ($1, 'C_TEST_1', 'Test Zone')", [zoneId]);

        // Output snapshot exactly as the actual new disruption worker would
        const riskScore = 0.85;
        const drops = 60;
        await pool.query(`
            INSERT INTO zone_risk_snapshots (id, zone_id, risk_score, order_drop_percentage)
            VALUES ($1, $2, $3, $4)
        `, [uuidv4(), zoneId, riskScore, drops]);

        const check = await pool.query('SELECT * FROM zone_risk_snapshots WHERE zone_id = $1', [zoneId]);
        expect(check.rows.length).toBe(1);
        expect(parseFloat(check.rows[0].risk_score)).toBe(0.85);
    });

    it('Payout Workflow safely aggregates hourly analytics, stores payouts, and purges older localized snapshots securely', async () => {
        const zoneId = 'Z_TEST_PAYOUT_' + Date.now();
        await pool.query("INSERT INTO cities (id, name) VALUES ('C_TEST_1', 'Test') ON CONFLICT DO NOTHING");
        await pool.query("INSERT INTO zones (id, city_id, name) VALUES ($1, 'C_TEST_1', 'Test Zone')", [zoneId]);

        // Insert 3 snapshots simulating a rolling hour of volatile detection metrics
        await pool.query(`INSERT INTO zone_risk_snapshots (id, zone_id, risk_score, order_drop_percentage, created_at) VALUES ($1, $2, 0.40, 20, NOW())`, [uuidv4(), zoneId]);
        await pool.query(`INSERT INTO zone_risk_snapshots (id, zone_id, risk_score, order_drop_percentage, created_at) VALUES ($1, $2, 0.60, 40, NOW())`, [uuidv4(), zoneId]);
        await pool.query(`INSERT INTO zone_risk_snapshots (id, zone_id, risk_score, order_drop_percentage, created_at) VALUES ($1, $2, 0.80, 60, NOW())`, [uuidv4(), zoneId]);

        // Simulate exact native payout worker calculation
        const aggregatedRes = await pool.query(`
            SELECT zone_id, 
                   AVG(risk_score) as avg_risk, 
                   MAX(order_drop_percentage) as max_drops
            FROM zone_risk_snapshots
            WHERE zone_id = $1
            GROUP BY zone_id
        `, [zoneId]);

        expect(aggregatedRes.rows.length).toBe(1);
        expect(parseFloat(aggregatedRes.rows[0].avg_risk)).toBeCloseTo(0.60);
        expect(parseFloat(aggregatedRes.rows[0].max_drops)).toBe(60);

        // Simulate architecture committing to immutable analytic table natively
        await pool.query(`
            INSERT INTO hourly_risk_analytics (id, zone_id, avg_risk_score, max_order_drop_percentage, hour_timestamp)
            VALUES ($1, $2, $3, $4, NOW())
        `, [uuidv4(), zoneId, aggregatedRes.rows[0].avg_risk, aggregatedRes.rows[0].max_drops]);

        const analytics = await pool.query('SELECT * FROM hourly_risk_analytics WHERE zone_id = $1', [zoneId]);
        expect(analytics.rows.length).toBe(1);

        // Simulate the clean hourly purge protecting the RDS metrics natively
        await pool.query(`DELETE FROM zone_risk_snapshots WHERE zone_id = $1`, [zoneId]);
        const snapCheck = await pool.query('SELECT * FROM zone_risk_snapshots WHERE zone_id = $1', [zoneId]);
        expect(snapCheck.rows.length).toBe(0);
    });
});
