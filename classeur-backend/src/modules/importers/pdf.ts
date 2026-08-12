import pdfParse from 'pdf-parse';

const MIN_TEXT_LENGTH = 20;

/** Ne gère que les PDF avec une vraie couche texte (contrats/attestations exportés
 *  d'un traitement de texte). Un PDF scanné (image sans texte) n'a pas de rasterisation
 *  disponible dans cet environnement — échec explicite plutôt qu'un résultat vide. */
export async function extractPdfText(buffer: Buffer): Promise<string> {
    const { text } = await pdfParse(buffer);
    const trimmed = (text || '').trim();
    if (trimmed.length < MIN_TEXT_LENGTH) {
        throw new Error(
            'Ce PDF semble scanné (aucun texte détecté) — pas encore pris en charge. ' +
                'Convertis-le en image (JPG/PNG) pour bénéficier de la reconnaissance optique.'
        );
    }
    return trimmed;
}
