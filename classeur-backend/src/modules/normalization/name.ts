/** NFD decompose + strip accents, uppercase, collapse whitespace. Empty/whitespace-only -> null. */
export function normalizeName(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const normalized = raw
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toUpperCase()
        .replace(/\s+/g, ' ')
        .trim();
    return normalized || null;
}
