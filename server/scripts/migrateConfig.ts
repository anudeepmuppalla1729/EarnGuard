import { pool } from '../src/db';

async function migrate() {
    try {
        console.log('Running operational database updates...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS system_config (
                key TEXT PRIMARY KEY,
                value NUMERIC NOT NULL,
                min_range NUMERIC,
                max_range NUMERIC,
                description TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            INSERT INTO system_config (key, value, min_range, max_range, description) VALUES
            ('FRAUD_LAS_THRESHOLD', 0.60, 0.40, 0.90, 'Minimum LAS score for a claim to be considered clean. Increasing this reduces fraud detection sensitivity.'),
            ('ANOMALY_RISK_THRESHOLD', 0.80, 0.50, 0.95, 'Threshold for hourly risk scores to trigger anomaly alerts.'),
            ('BASE_EVENT_THRESHOLD', 0.50, 0.30, 0.80, 'Score required for an event to be listed as an active disruption.')
            ON CONFLICT (key) DO NOTHING;
        `);
        
        console.log('Successfully applied system_config migration.');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

migrate();
