import cron from 'node-cron';
import { processPendingDocuments } from './processDocuments';

export function startCronJobs(): void {
    cron.schedule('*/20 * * * * *', () => {
        processPendingDocuments().catch((err) => console.error('Cron processPendingDocuments failed:', err));
    });
}
