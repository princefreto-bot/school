// ============================================================
// ORCHESTRATEUR DE CORRÉLATION — M3
// ============================================================
import { classeurClient } from '../../lib/supabaseClasseur';
import { buildCandidateIndex } from './buildCandidateIndex';
import { loadClassAliases } from './classAlias';
import { normalizeExtracted } from './normalizeExtracted';
import { confidenceBand, DEFAULT_WEIGHTS, scoreCandidate } from './scoreCandidate';
import { CandidatePerson, NormalizedFields } from './types';

export const ALGORITHM_VERSION = '1.0.0';
const MAX_CANDIDATES_PER_RECORD = 5;

async function loadSettings() {
    const { data, error } = await classeurClient.from('settings').select('key, value').in('key', ['match_weights', 'confidence_bands']);
    if (error) throw error;
    const byKey = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
    return {
        weights: (byKey.match_weights as Record<string, number>) || undefined,
        bands: (byKey.confidence_bands as { strong: number; to_verify: number }) || { strong: 90, to_verify: 70 },
    };
}

function shortlist(source: NormalizedFields, candidates: CandidatePerson[]): CandidatePerson[] {
    return candidates.filter((c) => {
        if (source.telephone && c.fields.telephone && source.telephone === c.fields.telephone) return true;
        if (source.nomComplet && c.fields.nomComplet && source.nomComplet.slice(0, 3) === c.fields.nomComplet.slice(0, 3)) return true;
        return false;
    });
}

export interface RunMatchingResult {
    recordsScored: number;
    matchesCreated: number;
}

export async function runMatching(): Promise<RunMatchingResult> {
    const [{ bands }, aliases] = await Promise.all([loadSettings(), loadClassAliases()]);
    const candidateIndex = await buildCandidateIndex(aliases);

    const { data: records, error } = await classeurClient
        .from('source_records')
        .select('id, raw_data, classification_status')
        .in('classification_status', ['unclassified', 'to_classify']);
    if (error) throw error;

    let matchesCreated = 0;

    for (const record of records || []) {
        const extracted: Record<string, string> = (record.raw_data as any)?.extracted || {};
        const normalizedSource = normalizeExtracted(extracted, aliases);

        const shortlisted = shortlist(normalizedSource, candidateIndex);
        const scored = shortlisted
            .map((c) => ({ candidate: c, ...scoreCandidate(normalizedSource, c.fields, DEFAULT_WEIGHTS) }))
            .filter((s) => s.consideredFields > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, MAX_CANDIDATES_PER_RECORD);

        // Les correspondances "pending" précédentes pour cette ligne sont recalculées à
        // chaque exécution (algorithm_version tracé) ; celles déjà confirmées/rejetées
        // par un opérateur ne sont jamais touchées.
        await classeurClient.from('matches').delete().eq('source_record_id', record.id).eq('status', 'pending');

        for (const s of scored) {
            const { data: match, error: matchErr } = await classeurClient
                .from('matches')
                .insert({
                    source_record_id: record.id,
                    candidate_person_id: s.candidate.personId,
                    score: s.score,
                    confidence_band: confidenceBand(s.score, bands),
                    algorithm_version: ALGORITHM_VERSION,
                    status: 'pending',
                })
                .select('id')
                .single();
            if (matchErr || !match) continue;

            await classeurClient.from('match_evidence').insert(
                s.evidence.map((e) => ({
                    match_id: match.id,
                    field_name: e.field,
                    source_value: e.sourceValue,
                    person_value: e.personValue,
                    field_weight: e.weight,
                    field_score: e.score,
                    contribution: e.contribution,
                    notes: e.notes,
                }))
            );
            matchesCreated++;
        }

        if (scored.length > 0 && record.classification_status !== 'to_classify') {
            await classeurClient.from('source_records').update({ classification_status: 'to_classify' }).eq('id', record.id);
        }
    }

    return { recordsScored: (records || []).length, matchesCreated };
}
