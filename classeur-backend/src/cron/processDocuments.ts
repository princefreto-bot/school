// ============================================================
// TICK CRON — traitement différé des imports PDF/image (OCR)
// ============================================================
// L'OCR peut prendre plusieurs secondes à plusieurs dizaines de secondes ; jamais dans
// la requête HTTP d'upload. Lots volontairement petits et bornés dans le temps.
import { classeurClient } from '../lib/supabaseClasseur';
import { extractFromText } from '../modules/extraction/extractFromText';
import { DocumentSourceType, extractDocumentText } from '../modules/importers';

const BATCH_SIZE = 3;
const BUCKET = 'classeur-documents';

export async function processPendingDocuments(): Promise<void> {
    const { data: pending, error } = await classeurClient
        .from('sources')
        .select('id, source_type, storage_path, original_filename')
        .eq('status', 'pending')
        .in('source_type', ['import_pdf', 'import_image'])
        .limit(BATCH_SIZE);
    if (error) {
        console.error('processPendingDocuments list error:', error);
        return;
    }
    if (!pending || pending.length === 0) return;

    for (const source of pending) {
        await classeurClient.from('sources').update({ status: 'processing' }).eq('id', source.id);
        try {
            if (!source.storage_path) throw new Error('Chemin de stockage manquant.');

            const { data: fileBlob, error: dlErr } = await classeurClient.storage.from(BUCKET).download(source.storage_path);
            if (dlErr || !fileBlob) throw dlErr || new Error('Téléchargement du fichier impossible.');
            const buffer = Buffer.from(await fileBlob.arrayBuffer());

            const { text, confidence } = await extractDocumentText(buffer, source.source_type as DocumentSourceType);
            const { raw, extracted } = extractFromText(text);

            const { error: recordErr } = await classeurClient.from('source_records').insert({
                source_id: source.id,
                raw_data: {
                    raw: {
                    ...raw,
                    storagePath: source.storage_path,
                    filename: source.original_filename,
                    sourceType: source.source_type,
                },
                    extracted,
                },
                row_index: 0,
                ocr_confidence: confidence,
                classification_status: 'unclassified',
            });
            if (recordErr) throw recordErr;

            await classeurClient.from('sources').update({ status: 'processed', row_count: 1 }).eq('id', source.id);
        } catch (err: any) {
            console.error(`Document processing error (source ${source.id}):`, err);
            await classeurClient
                .from('sources')
                .update({ status: 'failed', error_log: { message: err.message } })
                .eq('id', source.id);
        }
    }
}
