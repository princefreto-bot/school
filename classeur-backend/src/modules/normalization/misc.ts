export function normalizeText(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const t = raw.trim().toLowerCase();
    return t || null;
}

export function normalizeSexe(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const t = raw.trim().toUpperCase();
    if (t.startsWith('M')) return 'M';
    if (t.startsWith('F')) return 'F';
    return null;
}

/** Fallback classe normalization when no `classeur.class_aliases` entry matches:
 *  strip accents/spaces/punctuation and lowercase, so at least identical-meaning
 *  variants of an unmapped spelling ("6ème A" / "6eme a") still compare equal. */
export function normalizeClasseFallback(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const t = raw
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
    return t || null;
}
