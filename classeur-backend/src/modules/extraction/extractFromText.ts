// ============================================================
// EXTRACTION — texte libre (PDF/OCR) vers champs par regex
// ============================================================
// Best-effort uniquement sur des motifs fiables (téléphone, email, date) — on ne tente
// JAMAIS d'extraire un nom depuis du texte libre par regex (trop peu fiable, risque de
// fabriquer une donnée). Le texte brut complet est toujours conservé intégralement.
const PHONE_PATTERN = /(?:\+?228[\s.-]?)?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}\b/;
const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[a-z]{2,}/i;
const DATE_PATTERN = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{4}|\d{4}-\d{1,2}-\d{1,2})\b/;

export interface TextExtraction {
    raw: { text: string };
    extracted: Record<string, string>;
}

export function extractFromText(text: string): TextExtraction {
    const extracted: Record<string, string> = {};

    const phone = text.match(PHONE_PATTERN);
    if (phone) extracted.telephone = phone[0];

    const email = text.match(EMAIL_PATTERN);
    if (email) extracted.email = email[0];

    const date = text.match(DATE_PATTERN);
    if (date) extracted.date_naissance = date[0];

    return { raw: { text }, extracted };
}
