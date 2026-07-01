// ============================================================
// CONTRÔLEUR — Upload photo passeport élève vers Supabase Storage
// ============================================================
'use strict';
const { supabase, supabaseAdmin } = require('../utils/supabase');

const BUCKET_NAME = 'student-photos';

/**
 * POST /api/students/upload-photo/:studentId
 *
 * Body JSON: { imageBase64: "data:image/jpeg;base64,/9j/4AAQ..." }
 *
 * 1. Décode le base64 reçu du frontend
 * 2. Upload dans le bucket Supabase Storage "student-photos/{schoolSlug}/{studentId}.jpg"
 * 3. Met à jour la colonne photo_url de la table students_{schoolSlug}
 * 4. Retourne l'URL publique
 */
async function uploadStudentPhoto(req, res) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentification requise.' });
    }

    const { role, schoolSlug } = req.user;
    const { studentId } = req.params;
    const { imageBase64 } = req.body;

    // Vérification des permissions
    if (!['admin', 'directeur', 'directeur_general', 'comptable', 'proviseur', 'censeur'].includes(role)) {
        return res.status(403).json({ error: 'Permission insuffisante pour uploader une photo.' });
    }

    if (!schoolSlug) {
        return res.status(403).json({ error: 'Compte non associé à un établissement.' });
    }

    if (!studentId) {
        return res.status(400).json({ error: 'ID élève manquant.' });
    }

    if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({ error: 'Image base64 manquante.' });
    }

    try {
        // ── 1. Décoder le base64 ─────────────────────────────────
        // Format attendu: "data:image/jpeg;base64,/9j/..."
        const matches = imageBase64.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
            return res.status(400).json({ error: 'Format base64 invalide. Attendu: data:image/...;base64,...' });
        }

        const imageFormat = matches[1]; // ex: "jpeg", "png", "webp"
        const base64Data  = matches[2];
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Limiter la taille : max 3 MB
        if (imageBuffer.length > 3 * 1024 * 1024) {
            return res.status(413).json({ error: 'Image trop grande. Maximum 3 MB.' });
        }

        // ── 2. Upload vers Supabase Storage ──────────────────────
        const filePath    = `${schoolSlug}/${studentId}.${imageFormat}`;
        const contentType = `image/${imageFormat}`;

        // Utiliser supabaseAdmin (service_role) pour bypasser les RLS sur le storage
        const client = supabaseAdmin || supabase;

        const { data: uploadData, error: uploadError } = await client.storage
            .from(BUCKET_NAME)
            .upload(filePath, imageBuffer, {
                contentType,
                upsert: true,  // remplace si déjà existant
            });

        if (uploadError) {
            console.error('❌ [Photo] Storage upload error:', uploadError.message);
            return res.status(500).json({ error: 'Erreur upload Storage: ' + uploadError.message });
        }

        console.log('✅ [Photo] Uploaded to storage:', filePath, uploadData);

        // ── 3. Récupérer l'URL publique ──────────────────────────
        const { data: urlData } = client.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        const publicUrl = urlData.publicUrl;

        // ── 4. Mettre à jour la table students_{schoolSlug} ──────
        const tableName = `students_${schoolSlug}`;
        const { error: updateError } = await client
            .from(tableName)
            .update({ photo_url: publicUrl })
            .eq('id', studentId);

        if (updateError) {
            console.error('❌ [Photo] DB update error:', updateError.message);
            // L'upload a réussi mais la mise à jour DB a échoué — on retourne quand même l'URL
            return res.status(207).json({
                warning: 'Photo uploadée mais mise à jour DB échouée: ' + updateError.message,
                photoUrl: publicUrl
            });
        }

        console.log(`✅ [Photo] photo_url mis à jour pour élève ${studentId}: ${publicUrl}`);

        return res.json({
            success: true,
            message: 'Photo uploadée avec succès.',
            photoUrl: publicUrl,
            studentId
        });

    } catch (err) {
        console.error('💥 [Photo] Unexpected error:', err.message);
        return res.status(500).json({ error: 'Erreur interne: ' + err.message });
    }
}

/**
 * DELETE /api/students/photo/:studentId
 * Supprime la photo d'un élève du Storage et efface l'URL en DB.
 */
async function deleteStudentPhoto(req, res) {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié.' });

    const { role, schoolSlug } = req.user;
    const { studentId } = req.params;

    if (!['admin', 'directeur', 'directeur_general', 'comptable', 'proviseur'].includes(role)) {
        return res.status(403).json({ error: 'Permission refusée.' });
    }

    try {
        const client = supabaseAdmin || supabase;

        // Essayer les deux extensions courantes
        for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
            await client.storage.from(BUCKET_NAME).remove([`${schoolSlug}/${studentId}.${ext}`]);
        }

        await client
            .from(`students_${schoolSlug}`)
            .update({ photo_url: null })
            .eq('id', studentId);

        return res.json({ success: true, message: 'Photo supprimée.' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * POST /api/settings/upload-asset
 * Body JSON: { assetType: "logo" | "stamp" | "seal" | "signature", imageBase64: "data:image/png;base64,..." }
 */
async function uploadSchoolAsset(req, res) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentification requise.' });
    }

    const { role, schoolSlug } = req.user;
    const { assetType, imageBase64 } = req.body;

    if (!['admin', 'directeur', 'directeur_general', 'comptable'].includes(role)) {
        return res.status(403).json({ error: 'Permission insuffisante.' });
    }

    if (!schoolSlug) {
        return res.status(403).json({ error: 'Compte non associé à un établissement.' });
    }

    if (!assetType || !['logo', 'stamp', 'seal', 'signature'].includes(assetType)) {
        return res.status(400).json({ error: 'Type d\'asset invalide (logo, stamp, seal, signature attendus).' });
    }

    if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({ error: 'Image base64 manquante.' });
    }

    try {
        const matches = imageBase64.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
            return res.status(400).json({ error: 'Format base64 invalide.' });
        }

        const imageFormat = matches[1];
        const base64Data  = matches[2];
        const imageBuffer = Buffer.from(base64Data, 'base64');

        if (imageBuffer.length > 3 * 1024 * 1024) {
            return res.status(413).json({ error: 'Image trop grande (max 3 MB).' });
        }

        const filePath    = `${schoolSlug}/assets/${assetType}.${imageFormat}`;
        const contentType = `image/${imageFormat}`;
        const client = supabaseAdmin || supabase;

        // Clean previous assets of different extensions to avoid pollution
        for (const ext of ['jpg', 'jpeg', 'png', 'webp', 'svg']) {
            if (ext !== imageFormat) {
                await client.storage.from(BUCKET_NAME).remove([`${schoolSlug}/assets/${assetType}.${ext}`]);
            }
        }

        const { data: uploadData, error: uploadError } = await client.storage
            .from(BUCKET_NAME)
            .upload(filePath, imageBuffer, {
                contentType,
                upsert: true
            });

        if (uploadError) {
            console.error('❌ [Asset] Storage upload error:', uploadError.message);
            return res.status(500).json({ error: 'Erreur upload Storage: ' + uploadError.message });
        }

        const { data: urlData } = client.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        const publicUrl = urlData.publicUrl;
        console.log(`%c[Asset] Uploaded school asset ${assetType} to storage: ${publicUrl}`, 'color: green');

        return res.json({
            success: true,
            publicUrl,
            assetType
        });

    } catch (err) {
        console.error('💥 [Asset] Unexpected error:', err.message);
        return res.status(500).json({ error: 'Erreur interne: ' + err.message });
    }
}

/**
 * DELETE /api/settings/remove-asset
 * Body JSON: { assetType: "logo" | "stamp" | "seal" | "signature" }
 * Supprime l'image du Storage Supabase ET met la colonne DB à null.
 */
async function removeSchoolAsset(req, res) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentification requise.' });
    }

    const { role, schoolSlug } = req.user;
    const { assetType } = req.body;

    if (!['admin', 'directeur', 'directeur_general', 'comptable'].includes(role)) {
        return res.status(403).json({ error: 'Permission insuffisante.' });
    }

    if (!schoolSlug) {
        return res.status(403).json({ error: 'Compte non associé à un établissement.' });
    }

    if (!assetType || !['logo', 'stamp', 'seal', 'signature'].includes(assetType)) {
        return res.status(400).json({ error: 'Type d\'asset invalide (logo, stamp, seal, signature).' });
    }

    // Mapping assetType → colonne DB
    const columnMap = {
        logo: 'school_logo',
        stamp: 'school_stamp',
        seal: 'official_seal',
        signature: 'director_signature'
    };
    const dbColumn = columnMap[assetType];
    const tbl = `app_settings_${schoolSlug}`;
    const client = supabaseAdmin || supabase;

    try {
        // 1. Supprimer tous les fichiers du Storage pour cet asset
        for (const ext of ['jpg', 'jpeg', 'png', 'webp', 'svg']) {
            await client.storage.from(BUCKET_NAME).remove([`${schoolSlug}/assets/${assetType}.${ext}`]);
        }

        // 2. Mettre à null la colonne DB
        const { error: dbErr } = await client
            .from(tbl)
            .update({ [dbColumn]: null, updated_at: new Date().toISOString() })
            .eq('id', 'global_settings');

        if (dbErr) {
            console.error(`❌ [Asset Remove] DB update error for ${assetType}:`, dbErr.message);
            return res.status(500).json({ error: 'Erreur mise à jour DB: ' + dbErr.message });
        }

        console.log(`✅ [Asset Remove] ${assetType} supprimé du Storage et mis à null en DB (école: ${schoolSlug})`);
        return res.json({ success: true, assetType });

    } catch (err) {
        console.error('💥 [Asset Remove] Unexpected error:', err.message);
        return res.status(500).json({ error: 'Erreur interne: ' + err.message });
    }
}

module.exports = { uploadStudentPhoto, deleteStudentPhoto, uploadSchoolAsset, removeSchoolAsset };
