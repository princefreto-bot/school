// ============================================================
// INFRASTRUCTURE & ABONNEMENTS — suivi usage base + coûts/renouvellements
// ============================================================
// Réservé à l'opérateur (superadmin). Deux sources de données :
//   - Taille de la base : lue en direct via pg_database_size (aucun secret
//     externe), et historisée par un snapshot quotidien (cron) pour tracer
//     la progression et projeter la date d'atteinte d'une limite.
//   - Abonnements (coût, quota, date de renouvellement) : saisis à la main
//     par l'opérateur. L'API Management de Supabase / l'API Render pourront
//     alimenter ces valeurs en auto plus tard, sans changer ce contrat.
import { Router } from 'express';
import { classeurClient } from '../lib/supabaseClasseur';
import { getSupabaseLiveInfo } from '../lib/supabaseManagement';
import { authenticateOperator } from '../middleware/auth';

const router = Router();
router.use(authenticateOperator);

const MB = 1024 * 1024;

interface Snapshot {
    captured_on: string;
    db_size_bytes: number;
    table_count: number;
    person_count: number;
}

interface Subscription {
    id: number;
    provider: string;
    label: string;
    monthly_cost: number | null;
    currency: string;
    billing_cycle: string;
    renewal_date: string | null;
    quota_label: string | null;
    quota_limit_mb: number | null;
    notes: string | null;
    is_active: boolean;
}

function daysBetween(a: Date, b: Date): number {
    return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// Croissance journalière moyenne (octets/jour) sur la fenêtre de snapshots
// disponible. Simple pente début→fin : robuste avec peu de points, et c'est
// exactement ce qu'un directeur lit intuitivement (« ça grossit de X par jour »).
function avgDailyGrowthBytes(snaps: Snapshot[]): number {
    if (snaps.length < 2) return 0;
    const sorted = [...snaps].sort((a, b) => a.captured_on.localeCompare(b.captured_on));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const days = daysBetween(new Date(first.captured_on), new Date(last.captured_on));
    if (days <= 0) return 0;
    return (last.db_size_bytes - first.db_size_bytes) / days;
}

router.get('/', async (_req, res) => {
    try {
        const [{ data: liveBreak, error: breakErr }, { data: snaps }, { data: subs }, supabaseLive] = await Promise.all([
            classeurClient.rpc('get_db_size_breakdown'),
            classeurClient
                .from('usage_snapshots')
                .select('captured_on, db_size_bytes, table_count, person_count')
                .order('captured_on', { ascending: false })
                .limit(120),
            classeurClient
                .from('subscriptions')
                .select('*')
                .order('provider')
                .order('label'),
            getSupabaseLiveInfo(),
        ]);
        if (breakErr) throw breakErr;

        const snapshots = (snaps || []) as Snapshot[];
        const subscriptions = (subs || []) as Subscription[];
        const currentBytes: number = liveBreak?.db_size_bytes ?? snapshots[0]?.db_size_bytes ?? 0;

        const dailyGrowth = avgDailyGrowthBytes(snapshots);

        // Croissance sur 7 / 30 jours (delta si un snapshot d'il y a ~N jours existe)
        const growthOver = (days: number): number | null => {
            if (snapshots.length < 2) return null;
            const target = new Date();
            target.setDate(target.getDate() - days);
            const targetStr = target.toISOString().slice(0, 10);
            // snapshot le plus proche AVANT la date cible
            const past = snapshots.find((s) => s.captured_on <= targetStr);
            if (!past) return null;
            return currentBytes - past.db_size_bytes;
        };

        // Projection : pour chaque abonnement actif avec une limite en Mo, dans
        // combien de jours la base atteindra cette limite au rythme actuel.
        const alerts: { level: 'info' | 'warning' | 'critical'; message: string }[] = [];
        const projections = subscriptions
            .filter((s) => s.is_active && s.quota_limit_mb && s.quota_limit_mb > 0)
            .map((s) => {
                const limitBytes = Number(s.quota_limit_mb) * MB;
                const pct = limitBytes > 0 ? (currentBytes / limitBytes) * 100 : 0;
                let daysToLimit: number | null = null;
                let limitDate: string | null = null;
                if (dailyGrowth > 0 && currentBytes < limitBytes) {
                    daysToLimit = Math.floor((limitBytes - currentBytes) / dailyGrowth);
                    const d = new Date();
                    d.setDate(d.getDate() + daysToLimit);
                    limitDate = d.toISOString().slice(0, 10);
                }
                // Alertes de seuil d'usage
                if (pct >= 90) alerts.push({ level: 'critical', message: `${s.label} : base à ${pct.toFixed(0)}% de la limite (${s.quota_label || s.quota_limit_mb + ' Mo'}).` });
                else if (pct >= 70) alerts.push({ level: 'warning', message: `${s.label} : base à ${pct.toFixed(0)}% de la limite.` });
                // Alertes de projection
                if (daysToLimit !== null) {
                    if (daysToLimit <= 30) alerts.push({ level: 'critical', message: `${s.label} : limite de base atteinte dans ~${daysToLimit} jours au rythme actuel.` });
                    else if (daysToLimit <= 60) alerts.push({ level: 'warning', message: `${s.label} : limite de base atteinte dans ~${daysToLimit} jours au rythme actuel.` });
                }
                return { subscriptionId: s.id, label: s.label, quotaLimitMb: Number(s.quota_limit_mb), usagePct: pct, daysToLimit, limitDate };
            });

        // Alertes de renouvellement
        const today = new Date();
        for (const s of subscriptions) {
            if (!s.is_active || !s.renewal_date) continue;
            const d = daysBetween(today, new Date(s.renewal_date));
            if (d < 0) alerts.push({ level: 'warning', message: `${s.label} : date de renouvellement dépassée (${s.renewal_date}) — à mettre à jour.` });
            else if (d <= 3) alerts.push({ level: 'critical', message: `${s.label} : renouvellement dans ${d} jour(s) (${s.renewal_date}).` });
            else if (d <= 14) alerts.push({ level: 'warning', message: `${s.label} : renouvellement dans ${d} jours (${s.renewal_date}).` });
        }

        // Coût mensuel total normalisé (annuel → /12)
        const monthlyCostByCurrency: Record<string, number> = {};
        for (const s of subscriptions) {
            if (!s.is_active || !s.monthly_cost) continue;
            const perMonth = s.billing_cycle === 'yearly' ? Number(s.monthly_cost) / 12 : Number(s.monthly_cost);
            monthlyCostByCurrency[s.currency] = (monthlyCostByCurrency[s.currency] || 0) + perMonth;
        }

        return res.json({
            currentBytes,
            tableCount: liveBreak?.table_count ?? snapshots[0]?.table_count ?? 0,
            personCount: snapshots[0]?.person_count ?? 0,
            schemaBreakdown: liveBreak?.schema_breakdown ?? [],
            topTables: liveBreak?.top_tables ?? [],
            dailyGrowthBytes: dailyGrowth,
            growth7dBytes: growthOver(7),
            growth30dBytes: growthOver(30),
            snapshotCount: snapshots.length,
            firstSnapshotOn: snapshots.length ? snapshots[snapshots.length - 1].captured_on : null,
            subscriptions,
            projections,
            monthlyCostByCurrency,
            alerts,
            supabaseLive,
        });
    } catch (err: any) {
        console.error('Infrastructure dashboard error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors du chargement des indicateurs.' });
    }
});

// Historique pour le graphique de progression
router.get('/history', async (req, res) => {
    const days = Math.min(Math.max(parseInt(String(req.query.days || '90'), 10) || 90, 7), 365);
    try {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const { data, error } = await classeurClient
            .from('usage_snapshots')
            .select('captured_on, db_size_bytes, table_count, person_count')
            .gte('captured_on', since.toISOString().slice(0, 10))
            .order('captured_on', { ascending: true });
        if (error) throw error;
        return res.json({ snapshots: data || [] });
    } catch (err: any) {
        return res.status(500).json({ error: err.message || "Erreur lors du chargement de l'historique." });
    }
});

// Capture manuelle d'un snapshot (bouton « Rafraîchir »)
router.post('/snapshot', async (_req, res) => {
    try {
        const { data, error } = await classeurClient.rpc('capture_usage_snapshot');
        if (error) throw error;
        return res.json({ ok: true, snapshot: data });
    } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Erreur lors de la capture.' });
    }
});

// ── CRUD abonnements ────────────────────────────────────────
const VALID_PROVIDERS = ['supabase', 'render', 'autre'];
const VALID_CYCLES = ['monthly', 'yearly'];

function cleanSubscriptionPayload(body: any) {
    const provider = VALID_PROVIDERS.includes(body?.provider) ? body.provider : 'autre';
    const billing_cycle = VALID_CYCLES.includes(body?.billing_cycle) ? body.billing_cycle : 'monthly';
    return {
        provider,
        label: String(body?.label || '').trim(),
        monthly_cost: body?.monthly_cost === '' || body?.monthly_cost == null ? null : Number(body.monthly_cost),
        currency: String(body?.currency || 'USD').trim().toUpperCase().slice(0, 8) || 'USD',
        billing_cycle,
        renewal_date: body?.renewal_date || null,
        quota_label: body?.quota_label ? String(body.quota_label).trim() : null,
        quota_limit_mb: body?.quota_limit_mb === '' || body?.quota_limit_mb == null ? null : Number(body.quota_limit_mb),
        notes: body?.notes ? String(body.notes).trim() : null,
        is_active: body?.is_active === undefined ? true : !!body.is_active,
    };
}

router.post('/subscriptions', async (req, res) => {
    const payload = cleanSubscriptionPayload(req.body);
    if (!payload.label) return res.status(400).json({ error: 'Le libellé est requis.' });
    try {
        const { data, error } = await classeurClient.from('subscriptions').insert(payload).select('*').single();
        if (error) throw error;
        return res.status(201).json(data);
    } catch (err: any) {
        return res.status(500).json({ error: err.message || "Erreur lors de la création de l'abonnement." });
    }
});

router.put('/subscriptions/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Identifiant invalide.' });
    const payload = cleanSubscriptionPayload(req.body);
    if (!payload.label) return res.status(400).json({ error: 'Le libellé est requis.' });
    try {
        const { data, error } = await classeurClient
            .from('subscriptions')
            .update({ ...payload, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('*')
            .single();
        if (error) throw error;
        return res.json(data);
    } catch (err: any) {
        return res.status(500).json({ error: err.message || "Erreur lors de la mise à jour." });
    }
});

router.delete('/subscriptions/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Identifiant invalide.' });
    try {
        const { error } = await classeurClient.from('subscriptions').delete().eq('id', id);
        if (error) throw error;
        return res.json({ ok: true });
    } catch (err: any) {
        return res.status(500).json({ error: err.message || "Erreur lors de la suppression." });
    }
});

export default router;
