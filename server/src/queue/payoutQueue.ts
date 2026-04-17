import { Queue } from 'bullmq';
import { redisConfig } from './redis';

export const PAYOUT_QUEUE_NAME = 'hourly-payout-execution';

// The Queue instance where we add jobs
export const payoutQueue = new Queue(PAYOUT_QUEUE_NAME, { connection: redisConfig });

// Helper to start the cron
export const scheduleHourlyPayouts = async () => {
    // Attempting to remove the repeatable job first guarantees clean resets on boot
    const jobs = await payoutQueue.getRepeatableJobs();
    for (const job of jobs) {
        await payoutQueue.removeRepeatableByKey(job.key);
    }
    
    // Add job running every 10 minutes
    await payoutQueue.add(
        'ten-minute-aggregation',
        { trigger: 'cron' },
        {
            repeat: {
                pattern: '*/10 * * * *', // every 10 minutes
            }
        }
    );
    console.log('BullMQ: Scheduled 10-Minute Payout cron (Demo Mode)');
};
