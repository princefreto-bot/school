const { supabase } = require('../utils/supabase');

const currentPeriod = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * POST /api/satisfaction
 * Le parent note son expérience (0-10, NPS) pour le mois en cours. Une seule
 * note par parent et par mois — soumettre à nouveau ce mois-ci met à jour la
 * précédente plutôt que d'en créer une deuxième (UNIQUE(parent_id, period)).
 */
async function submitSatisfaction(req, res) {
    const { id: parentId, schoolSlug, role } = req.user;
    const { score, comment } = req.body;

    if (role !== 'parent') return res.status(403).json({ error: 'Réservé aux comptes parents.' });
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });
    if (score === undefined || score === null || !Number.isInteger(score) || score < 0 || score > 10) {
        return res.status(400).json({ error: 'La note doit être un entier entre 0 et 10.' });
    }
    if (comment && String(comment).length > 1000) {
        return res.status(400).json({ error: 'Commentaire trop long (1000 caractères maximum).' });
    }

    try {
        const { data, error } = await supabase
            .from(`parent_satisfaction_${schoolSlug}`)
            .upsert({
                parent_id: parentId,
                score,
                comment: comment || null,
                period: currentPeriod(),
                updated_at: new Date().toISOString()
            }, { onConflict: 'parent_id,period' })
            .select('*')
            .single();

        if (error) throw error;
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * GET /api/satisfaction/mine
 * Le parent vérifie s'il a déjà noté ce mois-ci (pour afficher soit le
 * formulaire, soit une confirmation).
 */
async function getMySatisfaction(req, res) {
    const { id: parentId, schoolSlug, role } = req.user;
    if (role !== 'parent') return res.status(403).json({ error: 'Réservé aux comptes parents.' });
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        const { data, error } = await supabase
            .from(`parent_satisfaction_${schoolSlug}`)
            .select('*')
            .eq('parent_id', parentId)
            .eq('period', currentPeriod())
            .maybeSingle();

        if (error) throw error;
        return res.json(data || null);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * GET /api/satisfaction/summary
 * Vue admin : score NPS (%promoteurs 9-10 − %détracteurs 0-6), tendance
 * mensuelle, et derniers commentaires. Réservé à la direction.
 */
async function getSatisfactionSummary(req, res) {
    const { schoolSlug } = req.user;

    try {
        const { data, error } = await supabase
            .from(`parent_satisfaction_${schoolSlug}`)
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;

        const responses = data || [];
        const total = responses.length;
        const promoters = responses.filter(r => r.score >= 9).length;
        const detractors = responses.filter(r => r.score <= 6).length;
        const npsScore = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : null;

        const byMonth = {};
        responses.forEach(r => {
            if (!byMonth[r.period]) byMonth[r.period] = { period: r.period, scores: [] };
            byMonth[r.period].scores.push(r.score);
        });
        const monthlyTrend = Object.values(byMonth)
            .map((m) => ({
                period: m.period,
                average: parseFloat((m.scores.reduce((a, b) => a + b, 0) / m.scores.length).toFixed(2)),
                count: m.scores.length
            }))
            .sort((a, b) => a.period.localeCompare(b.period))
            .slice(-6);

        const recentComments = responses
            .filter(r => r.comment)
            .slice(0, 20)
            .map(r => ({ score: r.score, comment: r.comment, createdAt: r.created_at }));

        return res.json({
            totalResponses: total,
            npsScore,
            promoters,
            passives: total - promoters - detractors,
            detractors,
            monthlyTrend,
            recentComments
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { submitSatisfaction, getMySatisfaction, getSatisfactionSummary };
