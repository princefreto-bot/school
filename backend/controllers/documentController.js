// ============================================================
// DOCUMENT CONTROLLER — Numérisation & Gestion des pièces élèves
// ============================================================
const { supabase, supabaseAdmin } = require('../utils/supabase');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendPushNotification } = require('../utils/webPush');

// Utiliser memoryStorage pour ne pas dépendre du système de fichiers éphémère de Render
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Limite à 10 Mo
}).single('document');

// ── POST /api/documents/scan ──────────────────────────────────
// Numérise et sauvegarde un document pour un élève (Admin / Personnel)
async function scanAndUploadDocument(req, res) {
    upload(req, res, async function (err) {
        if (err) {
            console.error('Multer Upload Error:', err.message);
            return res.status(400).json({ error: "Erreur lors du transfert du fichier : " + err.message });
        }

        if (!req.file) {
            return res.status(400).json({ error: "Aucun fichier fourni." });
        }

        const { student_id, document_type, title, school_slug } = req.body;

        if (!student_id || !document_type || !title || !school_slug) {
            return res.status(400).json({ error: "Champs requis manquants : student_id, document_type, title, school_slug." });
        }

        try {
            // Générer un nom de fichier unique
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = path.extname(req.file.originalname) || '.pdf';
            const filename = `scan-${uniqueSuffix}${ext}`;
            const fileUrl = `/uploads/documents/${filename}`;

            // Enregistrer dans Supabase Storage
            const client = supabaseAdmin || supabase;
            const storagePath = `${school_slug}/${student_id}/${filename}`;

            const { data: uploadData, error: uploadError } = await client.storage
                .from('student-documents')
                .upload(storagePath, req.file.buffer, {
                    contentType: req.file.mimetype || 'application/pdf',
                    upsert: true
                });

            if (uploadError) {
                console.error('❌ [Scan Document] Supabase Storage upload error:', uploadError.message);
                return res.status(500).json({ error: "Erreur lors de l'enregistrement sur le stockage cloud: " + uploadError.message });
            }

            console.log('✅ [Scan Document] Uploaded to Storage:', storagePath);

            // 1. Enregistrer dans la table student_documents
            const { data: doc, error: docErr } = await supabase
                .from('student_documents')
                .insert({
                    school_slug: school_slug,
                    student_id: student_id,
                    document_type: document_type,
                    title: title.trim(),
                    file_url: fileUrl
                })
                .select()
                .single();

            if (docErr) {
                // Tenter de nettoyer le fichier du Storage en cas d'échec SQL
                await client.storage.from('student-documents').remove([storagePath]);
                throw docErr;
            }

            // 2. Alerter les parents de façon asynchrone (non-bloquante)
            (async () => {
                try {
                    // Charger le nom de l'élève
                    const { data: student } = await supabase
                        .from(`students_${school_slug}`)
                        .select('nom, prenom')
                        .eq('id', student_id)
                        .single();

                    // Charger les parents associés
                    const { data: parentLinks } = await supabase
                        .from(`parent_student_${school_slug}`)
                        .select('parent_id')
                        .eq('student_id', student_id);

                    if (parentLinks && parentLinks.length > 0) {
                        const studentName = student ? `${student.prenom} ${student.nom}` : "votre enfant";
                        const docLabel = 
                            document_type === 'birth_certificate' ? "Acte de naissance" :
                            document_type === 'report_card' ? "Ancien relevé de notes" :
                            document_type === 'certificate' ? "Attestation de scolarité" : "Document officiel";

                        const pushTitle = "Nouveau document disponible 📄";
                        const pushBody = `Le document "${title.trim()}" (${docLabel}) a été numérisé pour ${studentName}.`;

                        for (const link of parentLinks) {
                            await sendPushNotification(
                                link.parent_id,
                                school_slug,
                                pushTitle,
                                pushBody,
                                'document',
                                '/parent_dashboard'
                            );
                        }
                    }
                } catch (notiErr) {
                    console.error('⚠️ [Notification Scan] Échec envoi push:', notiErr.message);
                }
            })();

            return res.status(201).json({
                message: 'Document numérisé et enregistré.',
                document: doc
            });
        } catch (dbErr) {
            console.error('ScanUpload Database Error:', dbErr.message);
            return res.status(500).json({ error: 'Erreur lors de la sauvegarde: ' + dbErr.message });
        }
    });
}

// ── GET /api/documents/student/:studentId ──────────────────────
// Récupère la liste des documents d'un élève (Admin, Enseignant, ou Parent lié)
async function getStudentDocuments(req, res) {
    const { studentId } = req.params;
    const { schoolSlug, role, id: userId } = req.user;

    if (!schoolSlug) {
        return res.status(403).json({ error: 'Accès non autorisé.' });
    }

    try {
        // Sécurité Parent : Vérifier s'il est bien lié à l'élève
        if (role === 'parent') {
            const { data: link, error: lErr } = await supabase
                .from(`parent_student_${schoolSlug}`)
                .select('student_id')
                .eq('parent_id', userId)
                .eq('student_id', studentId)
                .single();

            if (lErr || !link) {
                return res.status(403).json({ error: "Permission refusée. Cet élève n'est pas associé à votre compte." });
            }
        }

        const { data: docs, error: fetchErr } = await supabase
            .from('student_documents')
            .select('*')
            .eq('student_id', studentId)
            .eq('school_slug', schoolSlug)
            .order('created_at', { ascending: false });

        if (fetchErr) throw fetchErr;

        return res.json(docs || []);
    } catch (err) {
        console.error('getStudentDocuments Error:', err.message);
        return res.status(500).json({ error: 'Erreur serveur: ' + err.message });
    }
}

// ── DELETE /api/documents/:id ──────────────────────────────────
// Supprime un document et son fichier physique associé (Admin uniquement)
async function deleteDocument(req, res) {
    const { id } = req.params;
    const { schoolSlug, role } = req.user;

    const allowedRoles = ['admin', 'directeur', 'directeur_general'];
    if (!allowedRoles.includes(role)) {
        return res.status(403).json({ error: 'Action réservée à la direction.' });
    }

    try {
        // 1. Récupérer les infos pour l'URL du fichier
        const { data: doc, error: fErr } = await supabase
            .from('student_documents')
            .select('*')
            .eq('id', id)
            .eq('school_slug', schoolSlug)
            .single();

        if (fErr || !doc) {
            return res.status(404).json({ error: 'Document introuvable.' });
        }

        // 2. Supprimer de la base de données
        const { error: delErr } = await supabase
            .from('student_documents')
            .delete()
            .eq('id', id);

        if (delErr) throw delErr;

        // 3. Supprimer le fichier du stockage cloud et du disque local si présent (rétrocompatibilité)
        const filename = doc.file_url.split('/').pop();
        const storagePath = `${doc.school_slug}/${doc.student_id}/${filename}`;
        
        const client = supabaseAdmin || supabase;
        client.storage.from('student-documents').remove([storagePath]).then(({ error }) => {
            if (error) {
                console.warn(`[Document Cleanup] Impossible de supprimer le fichier du stockage cloud ${storagePath}:`, error.message);
            } else {
                console.log(`[Document Cleanup] Fichier supprimé du stockage cloud : ${storagePath}`);
            }
        });

        const filePath = path.join(__dirname, '..', 'uploads', 'documents', filename);
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.warn(`[Document Cleanup] Impossible de supprimer le fichier local ${filePath}:`, err.message);
                } else {
                    console.log(`[Document Cleanup] Fichier local supprimé : ${filePath}`);
                }
            });
        }

        return res.json({ message: 'Document supprimé avec succès.' });
    } catch (err) {
        console.error('deleteDocument Error:', err.message);
        return res.status(500).json({ error: 'Erreur serveur: ' + err.message });
    }
}

// Télécharge ou visionne de façon sécurisée un fichier document
async function downloadDocumentFile(req, res) {
    const { filename } = req.params;
    const { schoolSlug, role, id: userId } = req.user;

    if (!schoolSlug) {
        return res.status(403).json({ error: 'Accès non autorisé.' });
    }

    try {
        // 1. Rechercher le document dans student_documents pour vérifier s'il existe et appartient à l'école
        const fileUrlPattern = `/uploads/documents/${filename}`;
        const { data: doc, error: dbErr } = await supabase
            .from('student_documents')
            .select('*')
            .eq('file_url', fileUrlPattern)
            .eq('school_slug', schoolSlug)
            .single();

        if (dbErr || !doc) {
            return res.status(404).json({ error: 'Document introuvable ou n\'appartient pas à cet établissement.' });
        }

        // 2. Si le rôle est parent, vérifier la liaison parent-élève pour cet élève
        if (role === 'parent') {
            const { data: link, error: lErr } = await supabase
                .from(`parent_student_${schoolSlug}`)
                .select('student_id')
                .eq('parent_id', userId)
                .eq('student_id', doc.student_id)
                .single();

            if (lErr || !link) {
                return res.status(403).json({ error: 'Accès refusé. Vous n\'êtes pas lié à l\'élève de ce document.' });
            }
        }

        // 3. Envoyer le fichier physique de façon sécurisée
        const filePath = path.join(__dirname, '..', 'uploads', 'documents', filename);
        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        }

        // 4. Sinon, récupérer le fichier du stockage cloud (Supabase Storage)
        const client = supabaseAdmin || supabase;
        const storagePath = `${doc.school_slug}/${doc.student_id}/${filename}`;
        
        const { data: fileData, error: downloadError } = await client.storage
            .from('student-documents')
            .download(storagePath);

        if (downloadError || !fileData) {
            console.error('❌ [Download Document] Storage download error:', downloadError ? downloadError.message : 'Pas de données');
            return res.status(404).json({ error: 'Le fichier physique est introuvable sur le serveur et sur le stockage cloud.' });
        }

        // Renvoyer le fichier sous forme de flux/tampon
        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Déterminer le type MIME (ou utiliser une valeur par défaut)
        res.setHeader('Content-Type', fileData.type || 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        return res.send(buffer);
    } catch (err) {
        console.error('downloadDocumentFile Error:', err.message);
        return res.status(500).json({ error: 'Erreur serveur: ' + err.message });
    }
}

module.exports = {
    scanAndUploadDocument,
    getStudentDocuments,
    deleteDocument,
    downloadDocumentFile
};
