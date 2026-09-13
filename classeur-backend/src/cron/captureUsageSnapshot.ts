// ============================================================
// CRON — snapshot quotidien de l'usage (taille de la base)
// ============================================================
// Idempotent : la fonction SQL fait un upsert sur captured_on (une ligne/jour),
// donc plusieurs exécutions le même jour ne créent pas de doublon — elles
// rafraîchissent simplement la mesure du jour.
import { classeurClient } from '../lib/supabaseClasseur';

export async function captureUsageSnapshot(): Promise<void> {
    const { error } = await classeurClient.rpc('capture_usage_snapshot');
    if (error) throw error;
}
