// ============================================================
// SUPERADMIN AUDITOR — Anomalies d'abonnement (règles dérivées des colonnes existantes)
// Accessible UNIQUEMENT au propriétaire de la plateforme
// ============================================================
const { supabase } = require('../utils/supabase');

/**
 * GET /api/superadmin/auditor/findings
 * Calcule à la volée une liste d'anomalies par école. Pas de persistance —
 * si ça devient lent avec beaucoup d'écoles, revoir en table matérialisée.
 */
async function getAuditFindings(req, res) {
    try {
        const { data: schools, error } = await supabase.from('schools').select('*');
        if (error) throw error;

        const now = new Date();
        const findings = [];

        for (const school of schools || []) {
            let studentCount = 0;
            try {
                const { count } = await supabase
                    .from(`students_${school.slug}`)
                    .select('id', { count: 'exact', head: true });
                studentCount = count || 0;
            } catch {
                // Table pas encore provisionnée.
            }

            // Règle A — contradiction statut/approbation
            if (school.status === 'active' && school.is_approved === false) {
                findings.push({
                    rule: 'status_approval_mismatch',
                    severity: 'warning',
                    schoolId: school.id,
                    schoolName: school.name,
                    detail: `École active mais jamais approuvée par le SuperAdmin.`,
                });
            }

            // Règle B — essai réellement expiré
            if (school.status === 'trial' && school.trial_ends_at && new Date(school.trial_ends_at) < now) {
                const daysOver = Math.floor((now - new Date(school.trial_ends_at)) / 86400000);
                findings.push({
                    rule: 'trial_expired',
                    severity: 'danger',
                    schoolId: school.id,
                    schoolName: school.name,
                    detail: `Essai expiré depuis ${daysOver} jour${daysOver > 1 ? 's' : ''}, toujours en statut "trial".`,
                });
            }

            // Règle C — dépassement de quota
            if (school.student_limit != null && studentCount > school.student_limit) {
                findings.push({
                    rule: 'over_quota',
                    severity: 'warning',
                    schoolId: school.id,
                    schoolName: school.name,
                    detail: `${studentCount} élèves enregistrés pour un quota de ${school.student_limit}.`,
                });
            }

            // Règle D — activité sans preuve de paiement (informationnel, pas une erreur en soi)
            if (school.status === 'active') {
                let hasPayments = false;
                try {
                    const { count } = await supabase
                        .from(`license_payments_${school.slug}`)
                        .select('id', { count: 'exact', head: true });
                    hasPayments = (count || 0) > 0;
                } catch {
                    // Table pas encore provisionnée = pas de paiement non plus.
                }
                if (!hasPayments) {
                    findings.push({
                        rule: 'no_billing_evidence',
                        severity: 'info',
                        schoolId: school.id,
                        schoolName: school.name,
                        detail: `École active sans aucun paiement de licence enregistré (normal si aucun parent n'a encore payé).`,
                    });
                }
            }
        }

        const severityOrder = { danger: 0, warning: 1, info: 2 };
        findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        return res.json({
            findings,
            summary: {
                total: findings.length,
                danger: findings.filter((f) => f.severity === 'danger').length,
                warning: findings.filter((f) => f.severity === 'warning').length,
                info: findings.filter((f) => f.severity === 'info').length,
            },
        });
    } catch (err) {
        console.error('getAuditFindings error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { getAuditFindings };
