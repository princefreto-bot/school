// ============================================================
// RATTACHEMENT DE DOCUMENT — au moment de l'association d'une ligne à une personne
// ============================================================
// Un import tabulaire (xlsx/csv/json) n'a pas de fichier à rattacher, seulement des
// attributs. Un import PDF/image, lui, a un fichier réel stocké — on ne le rattache au
// dossier de la personne qu'AU MOMENT où l'opérateur confirme l'association, jamais avant
// (tant que ce n'est pas classé, on ne sait pas encore à qui appartient le document).
import { classeurClient } from '../../lib/supabaseClasseur';

const BUCKET = 'classeur-documents';

export async function attachDocumentIfApplicable(params: {
    personId: string;
    sourceRecordId: string;
    raw: Record<string, any>;
}): Promise<void> {
    const { personId, sourceRecordId, raw } = params;
    const storagePath: string | undefined = raw?.storagePath;
    if (!storagePath) return; // provient d'un import tabulaire, rien à rattacher

    const filename: string = raw?.filename || storagePath.split('/').pop() || 'document';

    if (raw?.sourceType === 'import_image') {
        await classeurClient.from('images').insert({
            person_id: personId,
            storage_path: storagePath,
            source_record_id: sourceRecordId,
        });
    } else {
        await classeurClient.from('documents').insert({
            person_id: personId,
            source_record_id: sourceRecordId,
            document_type: 'other',
            title: filename,
            storage_bucket: BUCKET,
            storage_path: storagePath,
            mime_type: raw?.sourceType === 'import_pdf' ? 'application/pdf' : null,
        });
    }
}
