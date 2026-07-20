// ============================================================
// SERVICE — Alertes automatiques de retard de paiement
// ============================================================
'use strict';
const cron = require('node-cron');
const { supabase, supabaseAdmin } = require('../utils/supabase');
const { sendPushNotification } = require('../utils/webPush');

const REMINDER_COOLDOWN_DAYS = 7;

/**
 * Jours de retard d'un élève : basé sur la date d'inscription, faute de mieux
 * en l'absence de configuration de tranches — même logique de repli que
 * src/services/analyticsService.ts::computePriorityList côté frontend, qui
 * utilise exactement ce même calcul quand aucune tranche n'est configurée.
 * Les écoles avec des tranches configurées n'ont pas ce calcul plus précis
 * reproduit ici (limite connue, cf. commit).
 */
function joursRetard(createdAt) {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

async function processSchool(schoolSlug) {
    const client = supabaseAdmin || supabase;

    const { data: settings, error: settingsErr } = await client
        .from(`app_settings_${schoolSlug}`)
        .select('auto_reminders_enabled, auto_reminders_threshold_days, message_rappel, school_name')
        .eq('id', 'global_settings')
        .single();

    if (settingsErr || !settings || !settings.auto_reminders_enabled) return { schoolSlug, sent: 0, skipped: 'disabled' };

    const threshold = settings.auto_reminders_threshold_days || 30;
    const message = settings.message_rappel || 'Nous vous rappelons cordialement que le règlement du solde de scolarité est attendu. Veuillez régulariser votre situation dans les meilleurs délais.';

    const { data: students, error: studentsErr } = await client
        .from(`students_${schoolSlug}`)
        .select('id, nom, prenom, restant, created_at')
        .gt('restant', 0);
    if (studentsErr) throw studentsErr;

    const overdue = (students || []).filter(s => joursRetard(s.created_at) >= threshold);
    if (overdue.length === 0) return { schoolSlug, sent: 0 };

    const cutoff = new Date(Date.now() - REMINDER_COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentReminders } = await client
        .from(`payment_reminders_${schoolSlug}`)
        .select('student_id')
        .gte('sent_at', cutoff);
    const recentlyRemindedIds = new Set((recentReminders || []).map(r => r.student_id));

    let sentCount = 0;
    for (const student of overdue) {
        if (recentlyRemindedIds.has(student.id)) continue;

        try {
            const { data: links } = await client
                .from(`parent_student_${schoolSlug}`)
                .select('parent_id')
                .eq('student_id', student.id);

            if (links && links.length > 0) {
                const studentName = `${student.prenom || ''} ${student.nom || ''}`.trim() || 'votre enfant';
                for (const link of links) {
                    await sendPushNotification(
                        link.parent_id,
                        schoolSlug,
                        '💰 Rappel de paiement',
                        `${studentName} : ${message}`,
                        'payment_reminder',
                        '/parent_dashboard'
                    ).catch(() => {});
                }
            }

            await client.from(`payment_reminders_${schoolSlug}`).insert({ student_id: student.id });
            sentCount++;
        } catch (err) {
            console.error(`❌ [Reminder] Échec pour l'élève ${student.id} (${schoolSlug}):`, err.message);
        }
    }

    return { schoolSlug, sent: sentCount };
}

async function runReminderCheck() {
    const client = supabaseAdmin || supabase;
    const { data: schools, error } = await client
        .from('schools')
        .select('slug')
        .neq('status', 'suspended');

    if (error) {
        console.error('❌ [Reminder] Impossible de lister les écoles:', error.message);
        return;
    }

    console.log(`🔔 [Reminder] Vérification des retards pour ${schools.length} école(s)...`);
    for (const school of schools) {
        try {
            const result = await processSchool(school.slug);
            if (result.sent > 0) {
                console.log(`✅ [Reminder] ${result.schoolSlug} : ${result.sent} rappel(s) envoyé(s).`);
            }
        } catch (err) {
            console.error(`❌ [Reminder] Échec pour ${school.slug}:`, err.message);
        }
    }
    console.log('🔔 [Reminder] Terminé.');
}

/**
 * Démarre le job planifié : tous les jours à 7h du matin (heure serveur).
 */
function start() {
    cron.schedule('0 7 * * *', () => {
        runReminderCheck().catch((err) => {
            console.error('💥 [Reminder] Erreur inattendue du job planifié:', err.message);
        });
    });
    console.log('⏰ [Reminder] Job de rappels de paiement programmé (7h00).');
}

module.exports = { start, runReminderCheck, processSchool };
