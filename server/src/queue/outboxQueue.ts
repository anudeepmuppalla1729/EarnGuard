import { Queue } from 'bullmq';
import { redisConfig } from './redis';

export const OUTBOX_QUEUE_NAME = 'outbox-sweeper';

export const outboxQueue = new Queue(OUTBOX_QUEUE_NAME, { connection: redisConfig });

export const scheduleOutboxSweeper = async () => {
    // Clear dead recurring jobs
    const jobs = await outboxQueue.getRepeatableJobs();
    for (const job of jobs) {
        await outboxQueue.removeRepeatableByKey(job.key);
    }
    
    // Add job running frequently (every 10 seconds approx)
    await outboxQueue.add(
        'sweep-outbox',
        { trigger: 'cron' },
        {
            repeat: {
                pattern: '*/10 * * * * *', // every 10 secs
            }
        }
    );
    console.log('BullMQ: Scheduled Outbox Sweeper (every 10 secs)');
};
