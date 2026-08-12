// ============================================================
// DÉTECTION DE DOUBLONS — même moteur de scoring que M3, personne-vs-personne
// ============================================================
import { classeurClient } from '../../lib/supabaseClasseur';
import { buildCandidateIndex } from './buildCandidateIndex';
import { loadClassAliases } from './classAlias';
import { DEFAULT_WEIGHTS, scoreCandidate } from './scoreCandidate';
import { CandidatePerson, FieldEvidence } from './types';

// Contrairement à M3 (une ligne importée souvent riche en champs, toujours revue par un
// humain contre un document concret), deux personnes DGhubschool synchronisées n'ont
// souvent que le nom en commun. Un nom seul, même très similaire, ne suffit JAMAIS à
// suspecter un doublon dans un contexte togolais où les prénoms (Koffi, Kodjo, Esther,
// Akouvi...) sont très partagés. Exiger simplement "2 champs considérés" ne suffisait pas
// non plus : `classe` ou `departement` comptaient comme second champ alors qu'ils ne
// discriminent presque rien (des dizaines d'élèves partagent la même classe) — testé en
// conditions réelles, ça laissait passer des dizaines de faux positifs. On exige donc un
// vrai signal fort et discriminant en plus du nom : téléphone, email, matricule ou date
// de naissance qui concordent réellement (score > 0, pas juste "présents des deux côtés").
const STRONG_FIELDS = new Set(['telephone', 'email', 'matricule', 'dateNaissance']);

function hasStrongCorroboration(evidence: FieldEvidence[]): boolean {
    return evidence.some((e) => STRONG_FIELDS.has(e.field) && e.score > 0);
}

function groupPairs(candidates: CandidatePerson[]): [CandidatePerson, CandidatePerson][] {
    const byPhone = new Map<string, CandidatePerson[]>();
    const byNamePrefix = new Map<string, CandidatePerson[]>();

    for (const c of candidates) {
        if (c.fields.telephone) {
            const arr = byPhone.get(c.fields.telephone) || [];
            arr.push(c);
            byPhone.set(c.fields.telephone, arr);
        }
        if (c.fields.nomComplet && c.fields.nomComplet.length >= 3) {
            const key = c.fields.nomComplet.slice(0, 3);
            const arr = byNamePrefix.get(key) || [];
            arr.push(c);
            byNamePrefix.set(key, arr);
        }
    }

    const seen = new Set<string>();
    const pairs: [CandidatePerson, CandidatePerson][] = [];
    const addGroup = (group: CandidatePerson[]) => {
        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                const [a, b] = group[i].personId < group[j].personId ? [group[i], group[j]] : [group[j], group[i]];
                if (a.personId === b.personId) continue;
                const key = `${a.personId}:${b.personId}`;
                if (seen.has(key)) continue;
                seen.add(key);
                pairs.push([a, b]);
            }
        }
    };

    for (const group of byPhone.values()) if (group.length > 1) addGroup(group);
    for (const group of byNamePrefix.values()) if (group.length > 1) addGroup(group);
    return pairs;
}

export interface RunDuplicateDetectionResult {
    pairsScored: number;
    candidatesFlagged: number;
}

export async function runDuplicateDetection(): Promise<RunDuplicateDetectionResult> {
    const { data: settingsRow } = await classeurClient.from('settings').select('value').eq('key', 'confidence_bands').maybeSingle();
    const bands = (settingsRow?.value as { strong: number; to_verify: number }) || { strong: 90, to_verify: 70 };

    const aliases = await loadClassAliases();
    const candidates = await buildCandidateIndex(aliases);
    const pairs = groupPairs(candidates);

    // Un seul aller-retour pour tout ce qui existe déjà, au lieu d'un par paire
    // (1027 paires = 1027 requêtes séquentielles, bien trop lent pour une requête HTTP).
    const { data: existingRows } = await classeurClient.from('duplicate_candidates').select('id, person_a_id, person_b_id, status, score');
    const existingByPair = new Map((existingRows || []).map((r) => [`${r.person_a_id}:${r.person_b_id}`, r]));

    const toInsert: { person_a_id: string; person_b_id: string; score: number; status: 'pending' }[] = [];
    const toUpdate: { id: string; score: number }[] = [];
    let flagged = 0;

    for (const [a, b] of pairs) {
        const key = `${a.personId}:${b.personId}`;
        const existing = existingByPair.get(key);
        // Un couple déjà tranché par un opérateur (fusionné/rejeté) ne doit jamais être
        // re-proposé automatiquement.
        if (existing && existing.status !== 'pending') continue;

        const { score, evidence } = scoreCandidate(a.fields, b.fields, DEFAULT_WEIGHTS);
        if (!hasStrongCorroboration(evidence) || score < bands.to_verify) continue;

        if (existing) {
            if (Number(existing.score) !== score) toUpdate.push({ id: existing.id, score });
        } else {
            toInsert.push({ person_a_id: a.personId, person_b_id: b.personId, score, status: 'pending' });
        }
        flagged++;
    }

    if (toInsert.length > 0) {
        await classeurClient.from('duplicate_candidates').insert(toInsert);
    }
    for (const u of toUpdate) {
        await classeurClient.from('duplicate_candidates').update({ score: u.score }).eq('id', u.id);
    }

    return { pairsScored: pairs.length, candidatesFlagged: flagged };
}
