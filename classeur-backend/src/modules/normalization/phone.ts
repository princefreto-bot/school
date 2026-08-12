export interface NormalizedPhone {
    e164: string | null;
    local8: string | null;
}

/**
 * Togo local numbers are 8 digits. Handles bare 8-digit, `228XXXXXXXX` (11 digits),
 * and `00228XXXXXXXX` (13 digits) forms, with or without spaces/dashes/parentheses/+.
 * The existing DGhubschool phone matching (syncController.js) does NOT strip the
 * 228/00228 prefix, which silently misses matches — this normalizer fixes that.
 */
export function normalizePhone(raw: string | null | undefined): NormalizedPhone {
    if (!raw) return { e164: null, local8: null };
    const digits = raw.replace(/\D/g, '');

    let local8: string | null = null;
    if (digits.length === 8) {
        local8 = digits;
    } else if (digits.length === 11 && digits.startsWith('228')) {
        local8 = digits.slice(3);
    } else if (digits.length === 13 && digits.startsWith('00228')) {
        local8 = digits.slice(5);
    }

    if (!local8) return { e164: null, local8: null };
    return { e164: `+228${local8}`, local8 };
}
