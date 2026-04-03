import { Queue } from 'bullmq';
import { connection } from './redis';

export const PRICING_QUEUE_NAME = 'ml-pricing-sync';

export const pricingQueue = new Queue(PRICING_QUEUE_NAME, { connection });

export const scheduleMLPricingJobs = async () => {
    const jobs = await pricingQueue.getRepeatableJobs();
    for (const job of jobs) {
        await pricingQueue.removeRepeatableByKey(job.key);
    }
    
    // Monthly Schedule (Base Price)
    await pricingQueue.add(
        'monthly-base-price',
        { type: 'MONTHLY' },
        { repeat: { pattern: '0 0 1 * *' } } // 1st of every month
    );
    
    // Weekly Schedule (Risk Adjustments)
    await pricingQueue.add(
        'weekly-risk-price',
        { type: 'WEEKLY' },
        { repeat: { pattern: '0 0 * * 1' } } // Every Monday
    );
    
    console.log('BullMQ: Scheduled ML Pricing jobs (Monthly/Weekly)');
};
