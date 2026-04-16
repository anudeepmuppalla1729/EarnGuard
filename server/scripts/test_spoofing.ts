import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/earnguard'
});

async function simulateSpoofingRing() {
    console.log("🔥 Generating artificial 'Spoofing Ring' claims...");
    try {
        await pool.query('ALTER TABLE claims ADD COLUMN IF NOT EXISTS zone_id TEXT REFERENCES zones(id);');
        console.log("✅ Added zone_id to claims table.");
        for (let i = 0; i < 4; i++) {
            // We insert into both Z1 and Z2 so it triggers regardless of which
            // dark store zone the current test user is assigned to.
            for (const zoneId of ['Z1', 'Z2']) {
                const workerId = uuidv4();
                
                // 1. Insert dummy worker to bypass FK
                await pool.query(
                    `INSERT INTO workers (id, platform_worker_id, email, password_hash)
                     VALUES ($1, $2, $3, 'dummyhash')`,
                    [workerId, `DUMMY-${workerId.slice(0, 8)}`, `dummy-${workerId}@test.com`]
                );

                // 2. Insert the dummy claim
                await pool.query(
                    `INSERT INTO claims (
                        id, worker_id, payout_amount, risk_score, severity_multiplier,
                        disruption_type, status, claim_type, zone_id
                    ) VALUES (
                        $1, $2, 0, 0.90, 1.0, 'HEAVY_RAIN', 'APPROVED', 'MANUAL', $3
                    )`,
                    [uuidv4(), workerId, zoneId]
                );
            }
        }
        console.log("✅ Successfully injected 4 concurrent spoof manual claims into Z1 and Z2.");
        console.log("📱 Now open the Expo app and file a manual claim!");
        console.log("   --> Because 4 claims were just filed in your zone, your claim will trigger the LAS penalty and be flagged/held.");
    } catch (e) {
        console.error("Error generating claims:", e);
    } finally {
        await pool.end();
    }
}

simulateSpoofingRing();
