// ============================================================
// SUPERADMIN ALERTS — Écoles à contacter (élargi : essai expiré,
// non approuvées, email non vérifié, hors quota) — suivi manuel.
// Accessible UNIQUEMENT au propriétaire de la plateforme
// ============================================================
const { supabase } = require('../utils/supabase');

/**
 * GET /api/superadmin/alerts/overdue
 * Liste élargie des écoles nécessitant une relance, annotée du dernier contact enregistré.
 */
async function getOverdueAlerts(req, res) {
    try {
        const { data: schools, error } = await supabase.from('schools').select('*');
        if (error) throw error;

        const { data: contacts, error: contactsErr } = await supabase
            .from('superadmin_alert_contacts')
            .select('school_id, note, contacted_at')
            .order('contacted_at', { ascending: false });
        if (contactsErr) throw contactsErr;

        const lastContactBySchool = new Map();
        for (const c of contacts || []) {
            if (!lastContactBySchool.has(c.school_id)) lastContactBySchool.set(c.school_id, c);
        }

        const now = new Date();
        const alerts = [];

        for (const school of schools || []) {
            const reasons = [];

            if (school.status === 'trial' && school.trial_ends_at && new Date(school.trial_ends_at) < now) {
                const daysOver = Math.floor((now - new Date(school.trial_ends_at)) / 86400000);
                reasons.push({ type: 'overdue_trial', label: `Essai expiré depuis ${daysOver}j` });
            }
            if (school.is_approved === false) {
                reasons.push({ type: 'pending_approval', label: 'Jamais approuvée' });
            }
            if (school.is_email_verified === false) {
                reasons.push({ type: 'unverified_email', label: 'Email non vérifié' });
            }
            if (school.student_limit != null) {
                try {
                    const { count } = await supabase
                        .from(`students_${school.slug}`)
                        .select('id', { count: 'exact', head: true });
                    if ((count || 0) > school.student_limit) {
                        reasons.push({ type: 'over_quota', label: `${count} élèves > quota ${school.student_limit}` });
                    }
                } catch {
                    // Table pas encore provisionnée.
                }
            }

            if (reasons.length > 0) {
                const lastContact = lastContactBySchool.get(school.id) || null;
                alerts.push({
                    schoolId: school.id,
                    schoolName: school.name,
                    schoolSlug: school.slug,
                    reasons,
                    lastContact: lastContact ? { note: lastContact.note, contactedAt: lastContact.contacted_at } : null,
                });
            }
        }

        return res.json({ alerts, count: alerts.length });
    } catch (err) {
        console.error('getOverdueAlerts error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

/**
 * POST /api/superadmin/alerts/:schoolId/mark-contacted
 * Enregistre une relance manuelle (pas d'envoi automatique — infra inexistante).
 */
async function markAlertContacted(req, res) {
    try {
        const { schoolId } = req.params;
        const { note } = req.body;

        const { error } = await supabase.from('superadmin_alert_contacts').insert({
            school_id: schoolId,
            contacted_by: req.user.id,
            note: note || null,
        });
        if (error) throw error;

        return res.json({ success: true });
    } catch (err) {
        console.error('markAlertContacted error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { getOverdueAlerts, markAlertContacted };
