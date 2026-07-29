const { supabase } = require('../utils/supabase');
const { resolveAcademicYearId, normalizeTime } = require('./timetableController');

// Qui peut scanner/consulter le pointage du personnel — vérification locale,
// surtout pas ajoutée au middleware partagé requireSchoolAdmin (qui gate
// aussi la paie/comptabilité, hors périmètre secrétaire/surveillant scan).
const ATTENDANCE_SCANNERS = ['directeur', 'directeur_general', 'admin', 'secretaire', 'superviseur'];

// ── POST /api/staff-attendance/scan ──────────────────────────────
// { personnelId, type: 'in' | 'out' } — scanné par un surveillant/secrétaire,
// jamais par l'enseignant lui-même (identité prouvée par le badge physique,
// pas par la session de qui scanne).
async function scanAttendance(req, res) {
    const { id: userId, role, schoolSlug } = req.user;
    const { personnelId, type } = req.body;

    if (!ATTENDANCE_SCANNERS.includes(role)) {
        return res.status(403).json({ error: 'Accès refusé.' });
    }
    if (!personnelId || !['in', 'out'].includes(type)) {
        return res.status(400).json({ error: 'Membre du personnel et type (in/out) requis.' });
    }

    try {
        const { data: profile, error: pErr } = await supabase
            .from(`profiles_${schoolSlug}`)
            .select('id, nom, role')
            .eq('id', personnelId)
            .single();
        if (pErr || !profile) return res.status(404).json({ error: 'Membre du personnel introuvable.' });

        const now = new Date();
        const { data, error } = await supabase
            .from(`staff_attendance_${schoolSlug}`)
            .insert({
                personnel_id: personnelId,
                date: now.toISOString().slice(0, 10),
                type,
                heure: now.toTimeString().slice(0, 8),
                scanned_by: userId
            })
            .select('*')
            .single();
        if (error) throw error;

        return res.status(201).json({ ...data, personnel: { nom: profile.nom, role: profile.role } });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// ── GET /api/staff-attendance/today-status?personnelId= ──────────────────────────────
async function getTodayStatus(req, res) {
    const { role, schoolSlug } = req.user;
    const { personnelId } = req.query;

    if (!ATTENDANCE_SCANNERS.includes(role)) {
        return res.status(403).json({ error: 'Accès refusé.' });
    }
    if (!personnelId) return res.status(400).json({ error: 'Membre du personnel requis.' });

    try {
        const today = new Date().toISOString().slice(0, 10);
        const { data, error } = await supabase
            .from(`staff_attendance_${schoolSlug}`)
            .select('type')
            .eq('personnel_id', personnelId)
            .eq('date', today);
        if (error) throw error;

        const types = (data || []).map(r => r.type);
        return res.json({ hasIn: types.includes('in'), hasOut: types.includes('out') });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// ── GET /api/staff-attendance?personnelId=&date= ──────────────────────────────
async function getAttendance(req, res) {
    const { role, schoolSlug } = req.user;
    const { personnelId, date } = req.query;

    if (!ATTENDANCE_SCANNERS.includes(role)) {
        return res.status(403).json({ error: 'Accès refusé.' });
    }

    try {
        let query = supabase
            .from(`staff_attendance_${schoolSlug}`)
            .select(`*, personnel:personnel_id ( nom, role )`)
            .order('date', { ascending: false })
            .order('heure', { ascending: true });
        if (personnelId) query = query.eq('personnel_id', personnelId);
        if (date) query = query.eq('date', date);

        const { data, error } = await query;
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// ── Calcul des heures manquées (Phase 3) ──────────────────────────────
const pad2 = (n) => String(n).padStart(2, '0');

const timeToMinutes = (t) => {
    const norm = normalizeTime(t); // "HH:MM"
    const [h, m] = norm.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
};

/**
 * Compare le planning (timetable_slots) de l'enseignant au pointage réel
 * (staff_attendance) pour un mois donné, et renvoie les heures manquées.
 * Ne persiste RIEN — pure lecture, à consommer par la revue admin (Phase 4).
 */
async function computeMissedHours(schoolSlug, personnelId, periode, req) {
    if (!/^\d{4}-\d{2}$/.test(periode)) {
        throw new Error('Format de période invalide (attendu AAAA-MM).');
    }
    const [yearStr, monthStr] = periode.split('-');
    const year = Number(yearStr);
    const monthNum = Number(monthStr); // 1-12

    const academicYearId = await resolveAcademicYearId(schoolSlug, req);

    const { data: slots, error: slotsErr } = await supabase
        .from(`timetable_slots_${schoolSlug}`)
        .select('jour_semaine, heure_debut, heure_fin')
        .eq('enseignant_id', personnelId)
        .eq('academic_year_id', academicYearId);
    if (slotsErr) throw slotsErr;

    // Heures prévues par jour de la semaine (0=Dimanche ... 6=Samedi, même
    // convention que jour_semaine et Date.getDay()).
    const scheduledMinutesByWeekday = {};
    for (const slot of (slots || [])) {
        const duration = Math.max(0, timeToMinutes(slot.heure_fin) - timeToMinutes(slot.heure_debut));
        scheduledMinutesByWeekday[slot.jour_semaine] = (scheduledMinutesByWeekday[slot.jour_semaine] || 0) + duration;
    }

    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const monthStart = `${yearStr}-${pad2(monthNum)}-01`;
    const monthEnd = `${yearStr}-${pad2(monthNum)}-${pad2(daysInMonth)}`;

    const { data: attendance, error: attErr } = await supabase
        .from(`staff_attendance_${schoolSlug}`)
        .select('date, type, heure')
        .eq('personnel_id', personnelId)
        .gte('date', monthStart)
        .lte('date', monthEnd);
    if (attErr) throw attErr;

    const byDate = {};
    for (const row of (attendance || [])) {
        if (!byDate[row.date]) byDate[row.date] = { in: null, out: null };
        if (row.type === 'in') {
            if (!byDate[row.date].in || row.heure < byDate[row.date].in) byDate[row.date].in = row.heure;
        } else if (row.type === 'out') {
            if (!byDate[row.date].out || row.heure > byDate[row.date].out) byDate[row.date].out = row.heure;
        }
    }

    let totalMissedHours = 0;
    const byDay = [];
    const incompleteDays = [];

    for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, monthNum - 1, d);
        const weekday = dateObj.getDay();
        const scheduledMinutes = scheduledMinutesByWeekday[weekday];
        if (!scheduledMinutes) continue; // pas de cours prévu ce jour-là

        const dateStr = `${yearStr}-${pad2(monthNum)}-${pad2(d)}`;
        const scheduledHours = scheduledMinutes / 60;
        const events = byDate[dateStr];

        if (!events || !events.in) {
            totalMissedHours += scheduledHours;
            byDay.push({ date: dateStr, status: 'absent', scheduledHours, workedHours: 0, missedHours: scheduledHours });
            continue;
        }
        if (!events.out) {
            incompleteDays.push(dateStr);
            byDay.push({ date: dateStr, status: 'incomplete', scheduledHours, workedHours: null, missedHours: null });
            continue;
        }

        const workedMinutes = Math.max(0, timeToMinutes(events.out) - timeToMinutes(events.in));
        const workedHours = workedMinutes / 60;
        const missedHours = Math.max(0, scheduledHours - workedHours);
        totalMissedHours += missedHours;
        byDay.push({ date: dateStr, status: 'present', scheduledHours, workedHours, missedHours });
    }

    return {
        totalMissedHours: Math.round(totalMissedHours * 100) / 100,
        byDay,
        incompleteDays
    };
}

// ── GET /api/staff-attendance/missed-hours?personnelId=&periode= ──────────────────────────────
async function getMissedHours(req, res) {
    const { role, schoolSlug } = req.user;
    const { personnelId, periode } = req.query;

    if (!ATTENDANCE_SCANNERS.includes(role) && !['comptable'].includes(role)) {
        return res.status(403).json({ error: 'Accès refusé.' });
    }
    if (!personnelId || !periode) {
        return res.status(400).json({ error: 'Membre du personnel et période (AAAA-MM) requis.' });
    }

    try {
        const result = await computeMissedHours(schoolSlug, personnelId, periode, req);
        return res.json(result);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { scanAttendance, getTodayStatus, getAttendance, getMissedHours, computeMissedHours, ATTENDANCE_SCANNERS };
