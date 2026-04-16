import app from './app';
import dotenv from 'dotenv';
import { pool } from './db';
import { scheduleDisruptionDetection } from './queue/disruptionQueue';
import { scheduleHourlyPayouts } from './queue/payoutQueue';
import { scheduleOutboxSweeper } from './queue/outboxQueue';
import { scheduleMLPricingJobs } from './queue/pricingQueue';
import './workers/disruptionWorker'; // Start background worker listening immediately
import './workers/payoutWorker'; // Hourly Payout Process loop
import './workers/outboxWorker'; // Start outbox sweeper listener
import './workers/mlPricingWorker'; // Start ML sync listener

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Test database connection
        await pool.query('SELECT 1');
        console.log('Database connected successfully');
        
        // Boot up and register the BullMQ asynchronous processes
        await scheduleDisruptionDetection();
        await scheduleHourlyPayouts();
        await scheduleOutboxSweeper();
        await scheduleMLPricingJobs();

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on port ${PORT} (Listening on all interfaces)`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
