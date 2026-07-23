// ============================================================
// LICENSE PAYMENTS CONTROLLER
// Endpoints partagés pour lister les paiements de licences parents
// enregistrés dans license_payments_<school>.
// ============================================================
const { supabase } = require('../utils/supabase');

const REVERSAL_PER_LICENSE = 700;

/**
 * GET /api/license-payments/mine
 * Parent connecté : liste tous ses paiements (toutes clés, tous enfants),
 * enrichis avec les infos élève.
 */
async function getMyPayments(req, res) {
    const { id: parentId, schoolSlug } = req.user;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        const { data: payments, error } = await supabase
            .from(`license_payments_${schoolSlug}`)
            .select('id, student_id, license_key, amount, tranche_number, is_final, paid_at')
            .eq('parent_id', parentId)
            .order('paid_at', { ascending: false });
        if (error) throw error;

        const rows = payments || [];
        const studentIds = [...new Set(rows.map(p => p.student_id))];

        let studentMap = new Map();
        if (studentIds.length > 0) {
            const { data: students } = await supabase
                .from(`students_${schoolSlug}`)
                .select('id, nom, prenom, classe')
                .in('id', studentIds);
            (students || []).forEach(s => studentMap.set(s.id, s));
        }

        return res.json(rows.map(p => ({
            ...p,
            student: studentMap.get(p.student_id) || null
        })));
    } catch (err) {
        console.error('getMyPayments error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

/**
 * GET /api/license-payments/school
 * Admin d'école connecté : voit tous les paiements de licences des parents
 * de son école (avec enrichissement élève + parent).
 */
async function getSchoolPayments(req, res) {
    const { schoolSlug, role } = req.user;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });
    if (role === 'parent') return res.status(403).json({ error: 'Réservé à l\'administration.' });

    try {
        const { data: payments, error } = await supabase
            .from(`license_payments_${schoolSlug}`)
            .select('id, student_id, parent_id, license_key, amount, tranche_number, is_final, paid_at')
            .order('paid_at', { ascending: false });
        if (error) throw error;

        const rows = payments || [];
        const studentIds = [...new Set(rows.map(p => p.student_id))];
        const parentIds = [...new Set(rows.map(p => p.parent_id).filter(Boolean))];

        const studentMap = new Map();
        if (studentIds.length > 0) {
            const { data: students } = await supabase
                .from(`students_${schoolSlug}`)
                .select('id, nom, prenom, classe')
                .in('id', studentIds);
            (students || []).forEach(s => studentMap.set(s.id, s));
        }

        const parentMap = new Map();
        if (parentIds.length > 0) {
            const { data: parents } = await supabase
                .from(`profiles_${schoolSlug}`)
                .select('id, nom, telephone')
                .in('id', parentIds);
            (parents || []).forEach(p => parentMap.set(p.id, p));
        }

        const totalCollected = rows.reduce((s, r) => s + (r.amount || 0), 0);
        const reversedToSchool = rows.filter(r => r.is_final).length * REVERSAL_PER_LICENSE;
        const licensesCompleted = rows.filter(r => r.is_final).length;

        return res.json({
            payments: rows.map(p => ({
                ...p,
                student: studentMap.get(p.student_id) || null,
                parent: parentMap.get(p.parent_id) || null
            })),
            summary: {
                totalCollected,
                reversedToSchool,
                licensesCompleted,
                paymentsCount: rows.length
            }
        });
    } catch (err) {
        console.error('getSchoolPayments error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

/**
 * GET /api/license-payments/superadmin
 * Superadmin : agrégat de tous les paiements de licences, toutes écoles.
 * Optionnel query: ?school=<slug>&from=YYYY-MM-DD&to=YYYY-MM-DD
 */
async function getSuperadminPayments(req, res) {
    try {
        const { school, from, to } = req.query;
        const { data: schools, error: sErr } = await supabase
            .from('schools')
            .select('slug, name');
        if (sErr) throw sErr;

        const filteredSchools = school
            ? (schools || []).filter(s => s.slug === school)
            : (schools || []);

        const allPayments = [];
        const perSchool = [];
        for (const s of filteredSchools) {
            try {
                let q = supabase
                    .from(`license_payments_${s.slug}`)
                    .select('id, student_id, parent_id, license_key, amount, tranche_number, is_final, paid_at')
                    .order('paid_at', { ascending: false });
                if (from) q = q.gte('paid_at', from);
                if (to) q = q.lte('paid_at', to);
                const { data: payments } = await q;
                const rows = payments || [];
                const totalCollected = rows.reduce((sum, r) => sum + (r.amount || 0), 0);
                const licensesCompleted = rows.filter(r => r.is_final).length;
                const reversedToSchool = licensesCompleted * REVERSAL_PER_LICENSE;
                const platformNet = totalCollected - reversedToSchool;

                perSchool.push({
                    slug: s.slug,
                    name: s.name,
                    paymentsCount: rows.length,
                    totalCollected,
                    licensesCompleted,
                    reversedToSchool,
                    platformNet
                });
                rows.forEach(r => allPayments.push({ ...r, school_slug: s.slug, school_name: s.name }));
            } catch {
                // table peut ne pas exister pour cette école (pas encore provisionnée)
            }
        }

        allPayments.sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at));
        const summary = perSchool.reduce((acc, p) => ({
            paymentsCount: acc.paymentsCount + p.paymentsCount,
            totalCollected: acc.totalCollected + p.totalCollected,
            licensesCompleted: acc.licensesCompleted + p.licensesCompleted,
            reversedToSchool: acc.reversedToSchool + p.reversedToSchool,
            platformNet: acc.platformNet + p.platformNet
        }), { paymentsCount: 0, totalCollected: 0, licensesCompleted: 0, reversedToSchool: 0, platformNet: 0 });

        return res.json({
            payments: allPayments.slice(0, 200),
            perSchool,
            summary
        });
    } catch (err) {
        console.error('getSuperadminPayments error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

module.exports = {
    getMyPayments,
    getSchoolPayments,
    getSuperadminPayments,
    REVERSAL_PER_LICENSE
};
