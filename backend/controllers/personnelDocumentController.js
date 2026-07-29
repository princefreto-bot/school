// ============================================================
// PERSONNEL DOCUMENT CONTROLLER — Numérisation & gestion des pièces
// du personnel (contrat, diplôme, pièce d'identité, carte CNSS...).
// Calqué sur documentController.js (élèves), sans la notification
// push aux parents (aucun équivalent pertinent ici).
// ============================================================
const { supabase, supabaseAdmin } = require('../utils/supabase');
const multer = require('multer');
const path = require('path');
const { PERSONNEL_MANAGERS } = require('./personnelController');

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 Mo
}).single('document');

const BUCKET = 'staff-documents';

// ── POST /api/personnel-documents/scan ──────────────────────────────
async function scanAndUploadDocument(req, res) {
    const { role, schoolSlug, id: userId } = req.user;
    if (!PERSONNEL_MANAGERS.includes(role)) {
        return res.status(403).json({ error: 'Accès refusé.' });
    }

    upload(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ error: 'Erreur lors du transfert du fichier : ' + err.message });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier fourni.' });
        }

        const { personnel_id, document_type, title } = req.body;
        if (!personnel_id || !document_type || !title) {
            return res.status(400).json({ error: 'Champs requis manquants : personnel_id, document_type, title.' });
        }

        try {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = path.extname(req.file.originalname) || '.png';
            const filename = `scan-${uniqueSuffix}${ext}`;
            const fileUrl = `/personnel-documents/${filename}`;

            const client = supabaseAdmin || supabase;
            const storagePath = `${schoolSlug}/${personnel_id}/${filename}`;

            const { error: uploadError } = await client.storage
                .from(BUCKET)
                .upload(storagePath, req.file.buffer, {
                    contentType: req.file.mimetype || 'image/png',
                    upsert: true
                });
            if (uploadError) {
                return res.status(500).json({ error: "Erreur lors de l'enregistrement sur le stockage cloud: " + uploadError.message });
            }

            const { data: doc, error: docErr } = await supabase
                .from(`personnel_documents_${schoolSlug}`)
                .insert({
                    personnel_id,
                    document_type,
                    title: title.trim(),
                    file_url: fileUrl,
                    uploaded_by: userId
                })
                .select()
                .single();

            if (docErr) {
                await client.storage.from(BUCKET).remove([storagePath]);
                throw docErr;
            }

            return res.status(201).json({ message: 'Document numérisé et enregistré.', document: doc });
        } catch (dbErr) {
            return res.status(500).json({ error: 'Erreur lors de la sauvegarde: ' + dbErr.message });
        }
    });
}

// ── GET /api/personnel-documents/personnel/:personnelId ──────────────────────────────
async function getPersonnelDocuments(req, res) {
    const { role, schoolSlug, id: userId } = req.user;
    const { personnelId } = req.params;

    // Le personnel géré peut consulter ; un salarié peut aussi voir ses propres documents.
    if (!PERSONNEL_MANAGERS.includes(role) && userId !== personnelId) {
        return res.status(403).json({ error: 'Accès refusé.' });
    }

    try {
        const { data: docs, error } = await supabase
            .from(`personnel_documents_${schoolSlug}`)
            .select('*')
            .eq('personnel_id', personnelId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return res.json(docs || []);
    } catch (err) {
        return res.status(500).json({ error: 'Erreur serveur: ' + err.message });
    }
}

// ── GET /api/personnel-documents/file/:filename ──────────────────────────────
async function downloadDocumentFile(req, res) {
    const { filename } = req.params;
    const { role, schoolSlug, id: userId } = req.user;

    try {
        const fileUrlPattern = `/personnel-documents/${filename}`;
        const { data: doc, error: dbErr } = await supabase
            .from(`personnel_documents_${schoolSlug}`)
            .select('*')
            .eq('file_url', fileUrlPattern)
            .single();
        if (dbErr || !doc) {
            return res.status(404).json({ error: "Document introuvable ou n'appartient pas à cet établissement." });
        }

        if (!PERSONNEL_MANAGERS.includes(role) && userId !== doc.personnel_id) {
            return res.status(403).json({ error: 'Accès refusé.' });
        }

        const client = supabaseAdmin || supabase;
        const storagePath = `${schoolSlug}/${doc.personnel_id}/${filename}`;
        const { data: fileData, error: downloadError } = await client.storage.from(BUCKET).download(storagePath);
        if (downloadError || !fileData) {
            return res.status(404).json({ error: 'Le fichier est introuvable sur le stockage cloud.' });
        }

        const buffer = Buffer.from(await fileData.arrayBuffer());
        res.setHeader('Content-Type', fileData.type || 'image/png');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        return res.send(buffer);
    } catch (err) {
        return res.status(500).json({ error: 'Erreur serveur: ' + err.message });
    }
}

// ── DELETE /api/personnel-documents/:id ──────────────────────────────
async function deleteDocument(req, res) {
    const { role, schoolSlug } = req.user;
    const { id } = req.params;

    if (!PERSONNEL_MANAGERS.includes(role)) {
        return res.status(403).json({ error: 'Accès refusé.' });
    }

    try {
        const { data: doc, error: fErr } = await supabase
            .from(`personnel_documents_${schoolSlug}`)
            .select('*')
            .eq('id', id)
            .single();
        if (fErr || !doc) {
            return res.status(404).json({ error: 'Document introuvable.' });
        }

        const { error: delErr } = await supabase
            .from(`personnel_documents_${schoolSlug}`)
            .delete()
            .eq('id', id);
        if (delErr) throw delErr;

        const filename = doc.file_url.split('/').pop();
        const storagePath = `${schoolSlug}/${doc.personnel_id}/${filename}`;
        const client = supabaseAdmin || supabase;
        client.storage.from(BUCKET).remove([storagePath]).then(({ error }) => {
            if (error) console.warn(`[Personnel Document Cleanup] Impossible de supprimer ${storagePath}:`, error.message);
        });

        return res.json({ message: 'Document supprimé avec succès.' });
    } catch (err) {
        return res.status(500).json({ error: 'Erreur serveur: ' + err.message });
    }
}

module.exports = { scanAndUploadDocument, getPersonnelDocuments, downloadDocumentFile, deleteDocument };
