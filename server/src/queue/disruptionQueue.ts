import { Queue } from 'bullmq';
import { redisConfig } from './redis';

export const DISRUPTION_QUEUE_NAME = 'disruption-detection';

// The Queue instance where we add jobs
export const disruptionQueue = new Queue(DISRUPTION_QUEUE_NAME, { connection: redisConfig });

// Helper to start the cron
export const scheduleDisruptionDetection = async () => {
    // Attempting to remove the repeatable job first guarantees clean resets on boot
    const jobs = await disruptionQueue.getRepeatableJobs();
    for (const job of jobs) {
        await disruptionQueue.removeRepeatableByKey(job.key);
    }
    
    // Add job running every 1 hour
    await disruptionQueue.add(
        'interval-detection',
        { trigger: 'cron' },
        {
            repeat: {
                pattern: '0 * * * *', // every 1 hour on the hour
            }
        }
    );
    console.log('BullMQ: Scheduled Disruption Detection cron (every 1 hour)');
};
