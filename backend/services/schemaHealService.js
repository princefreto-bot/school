// ============================================================
// Rattrapage automatique des tables de chaque école au démarrage.
// Les écoles créées avant l'ajout d'un module (comptabilité, paie, examens...) n'avaient
// jamais reçu ses tables (incident DINO GOLO 2026-10-08 : 15 tables manquantes). Les
// fonctions appelées ici sont idempotentes (CREATE TABLE IF NOT EXISTS) : elles ne
// touchent jamais aux données existantes.
// ============================================================
'use strict';
const { supabase } = require('../utils/supabase');

const MODULE_RPCS = [
    'create_accounting_tables',
    'create_payroll_tables',
    'create_timetable_tables',
    'create_reminder_tables',
    'create_satisfaction_tables',
    'create_exam_tables',
    'create_personnel_documents_table',
    'create_license_payments_table',
    'create_staff_tracking_tables',
    'add_mass_delete_guards',
    'add_payment_integrity_triggers',
];

async function healAllSchoolSchemas() {
    const { data: schools, error } = await supabase.from('schools').select('slug').eq('is_email_verified', true);
    if (error) {
        console.error('⚠️ [SchemaHeal] Liste des écoles impossible:', error.message);
        return;
    }
    for (const { slug } of schools || []) {
        if (!/^[a-z0-9]{2,80}$/.test(slug || '')) continue;
        for (const rpc of MODULE_RPCS) {
            const { error: rpcErr } = await supabase.rpc(rpc, { school_slug: slug });
            if (rpcErr) console.error(`⚠️ [SchemaHeal] ${rpc}(${slug}) :`, rpcErr.message);
        }
    }
    console.error(`🩺 [SchemaHeal] Tables vérifiées pour ${(schools || []).length} école(s).`);
}

module.exports = { healAllSchoolSchemas };
