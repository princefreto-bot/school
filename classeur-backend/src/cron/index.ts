import cron from 'node-cron';
import { processPendingDocuments } from './processDocuments';
import { captureUsageSnapshot } from './captureUsageSnapshot';

export function startCronJobs(): void {
    cron.schedule('*/20 * * * * *', () => {
        processPendingDocuments().catch((err) => console.error('Cron processPendingDocuments failed:', err));
    });

    // Snapshot d'usage quotidien à 02:00 (upsert : une mesure par jour) — alimente
    // le graphique de progression et la projection « quand la base atteindra la limite ».
    cron.schedule('0 2 * * *', () => {
        captureUsageSnapshot().catch((err) => console.error('Cron captureUsageSnapshot failed:', err));
    });
}
