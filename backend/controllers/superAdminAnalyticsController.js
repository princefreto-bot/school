// ============================================================
// SUPERADMIN ANALYTICS — Cashflow réel (encaissements vs dépenses)
// Accessible UNIQUEMENT au propriétaire de la plateforme
// ============================================================
const { supabase } = require('../utils/supabase');

function monthKey(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
    const [y, m] = key.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
}

/**
 * GET /api/superadmin/cashflow/trend?months=12
 * Agrège, par mois, l'argent réellement encaissé (license_payments_<slug>.amount, toutes écoles)
 * et les dépenses SaaS (saas_expenses, avec lissage mensuel des lignes "annuel").
 */
async function getCashflowTrend(req, res) {
    try {
        const months = Math.min(24, Math.max(1, parseInt(req.query.months, 10) || 12));

        // ── Fenêtre de mois à afficher (du plus ancien au plus récent) ──
        const now = new Date();
        const bucketKeys = [];
        for (let i = months - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            bucketKeys.push(monthKey(d));
        }
        const buckets = new Map(bucketKeys.map((k) => [k, { month: k, label: monthLabel(k), moneyIn: 0, moneyOut: 0 }]));
        const oldestDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1).toISOString();

        // ── Argent entrant : license_payments_<slug> (paiements réels, toutes écoles) ──
        const { data: schools, error: schoolsErr } = await supabase.from('schools').select('slug');
        if (schoolsErr) throw schoolsErr;

        for (const s of schools || []) {
            try {
                const { data: payments } = await supabase
                    .from(`license_payments_${s.slug}`)
                    .select('amount, paid_at')
                    .gte('paid_at', oldestDate);
                for (const p of payments || []) {
                    const key = monthKey(p.paid_at);
                    if (buckets.has(key)) buckets.get(key).moneyIn += (p.amount || 0);
                }
            } catch {
                // Table pas encore provisionnée pour cette école — on ignore.
            }
        }

        // ── Argent sortant : saas_expenses (lignes "annuel" lissées en taux mensuel) ──
        const { data: expenses, error: expErr } = await supabase.from('saas_expenses').select('amount, period, created_at');
        if (expErr) throw expErr;

        for (const exp of expenses || []) {
            const amount = Number(exp.amount) || 0;
            if (exp.period === 'annuel') {
                // Coût récurrent lissé : appliqué à chaque mois affiché (taux de charge actuel).
                const monthly = amount / 12;
                for (const key of bucketKeys) buckets.get(key).moneyOut += monthly;
            } else if (exp.period === 'mensuel') {
                const monthly = amount;
                for (const key of bucketKeys) buckets.get(key).moneyOut += monthly;
            } else {
                // Dépense ponctuelle : attribuée au mois où elle a été enregistrée.
                const key = monthKey(exp.created_at);
                if (buckets.has(key)) buckets.get(key).moneyOut += amount;
            }
        }

        const trend = bucketKeys.map((k) => {
            const b = buckets.get(k);
            return { ...b, moneyIn: Math.round(b.moneyIn), moneyOut: Math.round(b.moneyOut), net: Math.round(b.moneyIn - b.moneyOut) };
        });

        const summary = trend.reduce((acc, t) => ({
            totalMoneyIn: acc.totalMoneyIn + t.moneyIn,
            totalMoneyOut: acc.totalMoneyOut + t.moneyOut,
            totalNet: acc.totalNet + t.net,
        }), { totalMoneyIn: 0, totalMoneyOut: 0, totalNet: 0 });

        return res.json({ trend, summary });
    } catch (err) {
        console.error('getCashflowTrend error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { getCashflowTrend };
