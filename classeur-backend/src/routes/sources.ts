// ============================================================
// SOURCES — import de fichiers locaux (xlsx/csv/json/pdf/image)
// ============================================================
// Sélection explicite par l'utilisateur uniquement (input file côté frontend) —
// aucun scan automatique de dossier n'existe ni ne doit exister ici.
import crypto from 'crypto';
import { Router } from 'express';
import multer from 'multer';
import { classeurClient } from '../lib/supabaseClasseur';
import { mapRow } from '../modules/extraction/mapFields';
import { detectSourceType, isDocumentSourceType, parseTabularFile, TabularSourceType } from '../modules/importers';
import { authenticateOperator } from '../middleware/auth';

const router = Router();
router.use(authenticateOperator);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } }).single('file');
const DOCUMENTS_BUCKET = 'classeur-documents';

// multer/busboy décodent l'en-tête multipart `filename` en latin1 par défaut, quel que
// soit l'encodage réel envoyé par le navigateur (toujours UTF-8) — un nom accentué comme
// "Succès.pdf" ressort donc corrompu ("SuccÃ¨s.pdf"). Re-décodage correctif standard.
function fixFilenameEncoding(name: string): string {
    return Buffer.from(name, 'latin1').toString('utf8');
}

// Les clés d'objet Supabase Storage n'acceptent pas tous les caractères (accents,
// espaces, apostrophes...) — on ne s'en sert QUE pour le chemin de stockage ; le nom
// affiché à l'utilisateur (sources.name / original_filename) garde le vrai nom corrigé.
function slugifyForStorage(name: string): string {
    const dot = name.lastIndexOf('.');
    const ext = dot > 0 ? name.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, '') : '';
    const base = (dot > 0 ? name.slice(0, dot) : name)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9._-]+/g, '_')
        .slice(0, 100);
    return `${base || 'fichier'}${ext}`;
}

router.get('/', async (_req, res) => {
    try {
        const { data, error } = await classeurClient
            .from('sources')
            .select('id, name, source_type, original_filename, status, row_count, error_log, imported_at')
            .order('imported_at', { ascending: false })
            .limit(100);
        if (error) throw error;
        return res.json({ sources: data });
    } catch (err: any) {
        console.error('List sources error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors du chargement des sources.' });
    }
});

router.post('/', (req, res) => {
    upload(req, res, async (uploadErr) => {
        if (uploadErr) {
            return res.status(400).json({ error: 'Erreur de transfert du fichier : ' + uploadErr.message });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier fourni.' });
        }

        req.file.originalname = fixFilenameEncoding(req.file.originalname);

        const sourceType = detectSourceType(req.file.originalname);
        if (!sourceType) {
            return res.status(415).json({
                error: 'Format non supporté. Formats acceptés : .xlsx, .xls, .csv, .json, .pdf, .jpg, .jpeg, .png, .webp.',
            });
        }

        const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
        const { data: existing } = await classeurClient
            .from('sources')
            .select('id, status')
            .eq('file_hash', fileHash)
            .neq('status', 'failed')
            .maybeSingle();
        if (existing) {
            return res.status(409).json({ error: 'Ce fichier a déjà été importé (contenu identique détecté).' });
        }

        const { data: source, error: sourceErr } = await classeurClient
            .from('sources')
            .insert({
                name: req.file.originalname,
                source_type: sourceType,
                original_filename: req.file.originalname,
                file_hash: fileHash,
                status: 'processing',
                imported_by: req.operator!.operatorId,
            })
            .select('id')
            .single();
        if (sourceErr || !source) {
            return res.status(500).json({ error: sourceErr?.message || "Erreur lors de l'enregistrement de la source." });
        }

        // PDF/image : l'OCR peut être lent — on stocke le fichier et on répond tout de
        // suite, un tick cron traite le contenu en tâche de fond (voir cron/processDocuments.ts).
        if (isDocumentSourceType(sourceType)) {
            try {
                const storagePath = `imports/${source.id}/${slugifyForStorage(req.file.originalname)}`;
                const { error: uploadError } = await classeurClient.storage
                    .from(DOCUMENTS_BUCKET)
                    .upload(storagePath, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
                if (uploadError) throw uploadError;

                await classeurClient.from('sources').update({ status: 'pending', storage_path: storagePath }).eq('id', source.id);

                return res.status(202).json({ sourceId: source.id, status: 'pending' });
            } catch (err: any) {
                console.error('Document upload error:', err);
                await classeurClient
                    .from('sources')
                    .update({ status: 'failed', error_log: { message: err.message } })
                    .eq('id', source.id);
                return res.status(500).json({ error: err.message || "Erreur lors du transfert du document." });
            }
        }

        try {
            const rows = parseTabularFile(req.file.buffer, sourceType as TabularSourceType);
            if (rows.length === 0) {
                throw new Error('Aucune ligne exploitable trouvée dans le fichier.');
            }

            const records = rows.map((row, index) => {
                const { raw, extracted } = mapRow(row);
                return {
                    source_id: source.id,
                    raw_data: { raw, extracted },
                    row_index: index,
                    classification_status: 'unclassified' as const,
                };
            });

            const { error: recordsErr } = await classeurClient.from('source_records').insert(records);
            if (recordsErr) throw recordsErr;

            await classeurClient
                .from('sources')
                .update({ status: 'processed', row_count: records.length })
                .eq('id', source.id);

            await classeurClient.from('audit_logs').insert({
                actor_id: req.operator!.operatorId,
                actor_name: req.operator!.nom,
                action: 'import',
                entity_type: 'source',
                entity_id: source.id,
                details: { filename: req.file.originalname, sourceType, rowCount: records.length },
            });

            return res.status(201).json({ sourceId: source.id, rowCount: records.length });
        } catch (err: any) {
            console.error('Source processing error:', err);
            await classeurClient
                .from('sources')
                .update({ status: 'failed', error_log: { message: err.message } })
                .eq('id', source.id);
            return res.status(422).json({ error: err.message || "Erreur lors de l'analyse du fichier." });
        }
    });
});

export default router;
