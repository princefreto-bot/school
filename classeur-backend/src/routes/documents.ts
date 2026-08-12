// ============================================================
// DOCUMENTS — vue globale (tous les documents/images rattachés)
// ============================================================
import { Router } from 'express';
import { classeurClient, getSignedDocumentUrl } from '../lib/supabaseClasseur';
import { authenticateOperator } from '../middleware/auth';

const router = Router();
router.use(authenticateOperator);

router.get('/', async (_req, res) => {
    try {
        const [{ data: documents, error: docErr }, { data: images, error: imgErr }] = await Promise.all([
            classeurClient
                .from('documents')
                .select('id, document_type, title, storage_path, mime_type, uploaded_at, person:persons(id, display_name)')
                .order('uploaded_at', { ascending: false })
                .limit(100),
            classeurClient
                .from('images')
                .select('id, storage_path, uploaded_at, person:persons(id, display_name)')
                .order('uploaded_at', { ascending: false })
                .limit(100),
        ]);
        if (docErr) throw docErr;
        if (imgErr) throw imgErr;

        const documentsWithUrls = await Promise.all(
            (documents || []).map(async (d) => ({ ...d, kind: 'document' as const, url: await getSignedDocumentUrl(d.storage_path) }))
        );
        const imagesWithUrls = await Promise.all(
            (images || []).map(async (i) => ({ ...i, kind: 'image' as const, url: await getSignedDocumentUrl(i.storage_path) }))
        );

        const items = [...documentsWithUrls, ...imagesWithUrls].sort(
            (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
        );

        return res.json({ items });
    } catch (err: any) {
        console.error('List documents error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors du chargement des documents.' });
    }
});

export default router;
