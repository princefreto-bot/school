/** Multi-format best-effort parse to ISO `YYYY-MM-DD`. Returns null rather than guessing
 *  when the format is ambiguous or unrecognized — an absent/unparsed field simply drops
 *  out of scoring rather than causing a false mismatch. */
export function normalizeDate(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const s = raw.trim();

    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;

    m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (m) {
        const [, d, mo, y] = m;
        return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    return null;
}
