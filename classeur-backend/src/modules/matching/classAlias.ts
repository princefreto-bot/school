import { classeurClient } from '../../lib/supabaseClasseur';
import { normalizeClasseFallback } from '../normalization/misc';

export type ClassAliasMap = Map<string, string>; // key: normalized raw variant -> canonical_code

export async function loadClassAliases(): Promise<ClassAliasMap> {
    const { data, error } = await classeurClient.from('class_aliases').select('raw_variant, canonical_code');
    if (error) throw error;
    const map: ClassAliasMap = new Map();
    for (const row of data || []) {
        const key = normalizeClasseFallback(row.raw_variant);
        if (key) map.set(key, row.canonical_code);
    }
    return map;
}

export function normalizeClasse(raw: string | null | undefined, aliases: ClassAliasMap): string | null {
    const fallback = normalizeClasseFallback(raw);
    if (!fallback) return null;
    return aliases.get(fallback) || fallback;
}
