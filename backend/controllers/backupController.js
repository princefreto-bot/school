const { supabaseAdmin, supabase } = require('../utils/supabase');
const { backupSchool } = require('../services/backupService');

const BUCKET_NAME = 'school-backups';
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1h

/**
 * GET /api/backups
 * Liste les sauvegardes disponibles pour l'école, avec un lien de téléchargement temporaire.
 */
async function listBackups(req, res) {
    const { schoolSlug } = req.user;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        const client = supabaseAdmin || supabase;
        const { data: files, error } = await client.storage.from(BUCKET_NAME).list(schoolSlug, {
            sortBy: { column: 'created_at', order: 'desc' }
        });

        if (error) throw error;

        const backups = await Promise.all((files || []).map(async (file) => {
            const { data: signedData } = await client.storage
                .from(BUCKET_NAME)
                .createSignedUrl(`${schoolSlug}/${file.name}`, SIGNED_URL_TTL_SECONDS);

            return {
                name: file.name,
                sizeBytes: file.metadata?.size || 0,
                createdAt: file.created_at,
                downloadUrl: signedData?.signedUrl || null
            };
        }));

        return res.json({ backups });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * POST /api/backups/run
 * Déclenche une sauvegarde immédiate pour l'école (en plus du job quotidien automatique).
 */
async function runBackupNow(req, res) {
    const { schoolSlug } = req.user;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        const result = await backupSchool(schoolSlug);
        return res.json({ success: true, filePath: result.filePath });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { listBackups, runBackupNow };
