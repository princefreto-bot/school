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

// ============================================================
// RATTACHEMENT DE LOCALISATION — RÉSERVÉ AU PERSONNEL, JAMAIS AUX ÉLÈVES
// ============================================================
// Le trigger classeur.enforce_staff_only_location est le garde-fou définitif en base ;
// cette vérification applicative évite en plus une écriture inutile (et une exception SQL
// bruyante) quand la personne n'est de toute façon pas éligible.
export async function attachLocationIfApplicable(params: {
    personId: string;
    sourceRecordId: string;
    extracted: Record<string, string>;
}): Promise<void> {
    const { personId, sourceRecordId, extracted } = params;
    const addressText = extracted?.adresse || extracted?.ville;
    if (!addressText) return;

    const { data: person } = await classeurClient.from('persons').select('is_minor').eq('id', personId).maybeSingle();
    if (!person || person.is_minor) return;

    const { data: staffRole } = await classeurClient
        .from('person_roles')
        .select('id, role_types!inner(category)')
        .eq('person_id', personId)
        .eq('role_types.category', 'staff')
        .limit(1)
        .maybeSingle();
    if (!staffRole) return; // pas de rôle staff -> aucune tentative de localisation

    const { data: location, error: locErr } = await classeurClient
        .from('locations')
        .insert({ label: addressText, address_text: addressText, source: 'imported_document', source_record_id: sourceRecordId })
        .select('id')
        .single();
    if (locErr || !location) return;

    await classeurClient.from('person_locations').insert({
        person_id: personId,
        location_id: location.id,
        relation_type: 'zone_probable_document',
        status: 'probable',
        confidence: 70,
        source_record_id: sourceRecordId,
    });
}
