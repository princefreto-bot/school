// ============================================================
// SERVICE — Sauvegardes automatiques quotidiennes par école
// ============================================================
'use strict';
const cron = require('node-cron');
const { ZipArchive } = require('archiver');
const { supabase, supabaseAdmin } = require('../utils/supabase');

const BUCKET_NAME = 'school-backups';
const RETENTION_DAYS = 30;
const TABLES_TO_BACKUP = ['students', 'payments', 'notes', 'presences', 'badges'];

/**
 * Récupère toutes les lignes d'une table dynamique par pages de 1000
 * (limite par défaut de Supabase) pour ne rien perdre sur les grosses écoles.
 */
async function fetchAllRows(tableName) {
    const client = supabaseAdmin || supabase;
    const rows = [];
    const pageSize = 1000;
    let from = 0;

    while (true) {
        const { data, error } = await client
            .from(tableName)
            .select('*')
            .range(from, from + pageSize - 1);

        if (error) {
            // Table absente pour cette école (fonctionnalité non utilisée) : on l'ignore.
            const msg = (error.message || '').toLowerCase();
            if (error.code === '42P01' || error.code === 'PGRST205' || msg.includes('schema cache') || msg.includes('does not exist') || msg.includes('could not find')) {
                return [];
            }
            throw error;
        }

        rows.push(...(data || []));
        if (!data || data.length < pageSize) break;
        from += pageSize;
    }

    return rows;
}

/**
 * Construit un zip en mémoire contenant un fichier JSON par table sauvegardée.
 */
function buildZipBuffer(filesByName) {
    return new Promise((resolve, reject) => {
        const archive = new ZipArchive({ zlib: { level: 9 } });
        const chunks = [];

        archive.on('data', (chunk) => chunks.push(chunk));
        archive.on('end', () => resolve(Buffer.concat(chunks)));
        archive.on('error', reject);

        for (const [name, rows] of Object.entries(filesByName)) {
            archive.append(JSON.stringify(rows, null, 2), { name: `${name}.json` });
        }
        archive.finalize();
    });
}

/**
 * Sauvegarde une école : exporte ses tables clés, zippe, upload, purge les
 * anciennes sauvegardes au-delà de RETENTION_DAYS.
 */
async function backupSchool(schoolSlug) {
    const filesByName = {};
    for (const table of TABLES_TO_BACKUP) {
        filesByName[table] = await fetchAllRows(`${table}_${schoolSlug}`);
    }

    const zipBuffer = await buildZipBuffer(filesByName);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const filePath = `${schoolSlug}/${dateStamp}.zip`;

    const client = supabaseAdmin || supabase;
    const { error: uploadError } = await client.storage
        .from(BUCKET_NAME)
        .upload(filePath, zipBuffer, { contentType: 'application/zip', upsert: true });

    if (uploadError) {
        throw new Error(`Upload sauvegarde échoué pour ${schoolSlug}: ${uploadError.message}`);
    }

    await pruneOldBackups(schoolSlug);

    return { schoolSlug, filePath, sizeBytes: zipBuffer.length };
}

async function pruneOldBackups(schoolSlug) {
    const client = supabaseAdmin || supabase;
    const { data: files, error } = await client.storage.from(BUCKET_NAME).list(schoolSlug);
    if (error || !files) return;

    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const toDelete = files
        .filter((f) => f.created_at && new Date(f.created_at).getTime() < cutoff)
        .map((f) => `${schoolSlug}/${f.name}`);

    if (toDelete.length > 0) {
        await client.storage.from(BUCKET_NAME).remove(toDelete);
    }
}

/**
 * Sauvegarde toutes les écoles actives (pas les écoles suspendues). Une erreur
 * sur une école n'interrompt pas les suivantes.
 */
async function runBackupForAllSchools() {
    const client = supabaseAdmin || supabase;
    const { data: schools, error } = await client
        .from('schools')
        .select('slug')
        .neq('status', 'suspended');

    if (error) {
        console.error('❌ [Backup] Impossible de lister les écoles:', error.message);
        return;
    }

    console.log(`💾 [Backup] Démarrage de la sauvegarde pour ${schools.length} école(s)...`);
    for (const school of schools) {
        try {
            const result = await backupSchool(school.slug);
            console.log(`✅ [Backup] ${result.schoolSlug} → ${result.filePath} (${result.sizeBytes} octets)`);
        } catch (err) {
            console.error(`❌ [Backup] Échec pour ${school.slug}:`, err.message);
        }
    }
    console.log('💾 [Backup] Terminé.');
}

/**
 * Démarre le job planifié : tous les jours à 2h du matin (heure serveur).
 */
function start() {
    cron.schedule('0 2 * * *', () => {
        runBackupForAllSchools().catch((err) => {
            console.error('💥 [Backup] Erreur inattendue du job planifié:', err.message);
        });
    });
    console.log('⏰ [Backup] Job de sauvegarde quotidienne programmé (2h00).');
}

module.exports = { start, runBackupForAllSchools, backupSchool };
