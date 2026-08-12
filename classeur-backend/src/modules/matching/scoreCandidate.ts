// ============================================================
// SCORING — formule pondérée + veto sexe
// ============================================================
import { jaroWinkler } from './jaroWinkler';
import { FieldEvidence, NormalizedFields, ScoreResult } from './types';

// nomComplet regroupe nom+prénom (voir types.ts) — poids équivalent à nom(22)+prenom(18)
// du barème du plan. Les autres poids reprennent celui-ci.
export const DEFAULT_WEIGHTS: Record<string, number> = {
    nomComplet: 40,
    telephone: 20,
    email: 15,
    matricule: 12,
    classe: 15,
    dateNaissance: 15,
    departement: 5,
};

function fieldSimilarity(field: string, a: string, b: string): number {
    if (field === 'nomComplet') return jaroWinkler(a, b);
    if (field === 'dateNaissance') {
        if (a === b) return 1;
        if (a.slice(0, 4) === b.slice(0, 4)) return 0.5;
        return 0;
    }
    return a === b ? 1 : 0;
}

export function scoreCandidate(
    source: NormalizedFields,
    person: NormalizedFields,
    weights: Record<string, number> = DEFAULT_WEIGHTS
): ScoreResult {
    const evidence: FieldEvidence[] = [];
    let weightedSum = 0;
    let weightTotal = 0;

    for (const field of Object.keys(weights)) {
        const a = (source as any)[field] as string | null | undefined;
        const b = (person as any)[field] as string | null | undefined;
        if (!a || !b) continue; // champ absent des deux côtés : exclu, jamais pénalisé

        const similarity = fieldSimilarity(field, a, b);
        const weight = weights[field];
        weightedSum += weight * similarity;
        weightTotal += weight;
        evidence.push({ field, sourceValue: a, personValue: b, weight, score: similarity, contribution: weight * similarity });
    }

    let score = weightTotal > 0 ? Math.round(((100 * weightedSum) / weightTotal) * 100) / 100 : 0;

    // Veto sexe : désaccord plafonne le score, quels que soient les autres champs.
    if (source.sexe && person.sexe && source.sexe !== person.sexe) {
        evidence.push({
            field: 'sexe',
            sourceValue: source.sexe,
            personValue: person.sexe,
            weight: 0,
            score: 0,
            contribution: 0,
            notes: 'Veto sexe : incompatible',
        });
        score = Math.min(score, 40);
    }

    return { score, evidence, consideredFields: evidence.filter((e) => e.field !== 'sexe').length };
}

export function confidenceBand(score: number, bands: { strong: number; to_verify: number }): 'strong' | 'to_verify' | 'weak' {
    if (score >= bands.strong) return 'strong';
    if (score >= bands.to_verify) return 'to_verify';
    return 'weak';
}
