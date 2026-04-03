import { Worker, Job } from 'bullmq';
import { connection } from '../queue/redis';
import { OUTBOX_QUEUE_NAME } from '../queue/outboxQueue';
import { pool } from '../db';

export const outboxWorker = new Worker(OUTBOX_QUEUE_NAME, async (job: Job) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Fetch pending outbox jobs
        const pendingEvents = await client.query(`
            SELECT id, event_type, payload
            FROM outbox_events
            WHERE status = 'PENDING'
            LIMIT 50
            FOR UPDATE SKIP LOCKED
        `);
        
        if (pendingEvents.rows.length === 0) {
            await client.query('COMMIT');
            return; // Nothing to process
        }
        
        console.log(`[OutboxWorker] Sweeping ${pendingEvents.rows.length} pending events...`);
        
        for (const event of pendingEvents.rows) {
            // Mocking Push Notification SDK integration
            const workerId = event.payload.workerId;
            const amount = event.payload.amount;
            
            console.log(`[OutboxWorker] 🔥 PUSH NOTIFICATION -> Sending alert to Worker ${workerId} for ₹${amount}`);
            
            // Mark processed
            await client.query(`
                UPDATE outbox_events
                SET status = 'PROCESSED'
                WHERE id = $1
            `, [event.id]);
        }
        
        await client.query('COMMIT');
        console.log(`[OutboxWorker] Sweep complete.`);
    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error('[OutboxWorker] FAILED:', err);
    } finally {
        client.release();
    }
}, { connection });
