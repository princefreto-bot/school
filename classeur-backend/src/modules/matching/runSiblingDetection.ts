// ============================================================
// DÉTECTION DE FRATRIE POSSIBLE — élèves uniquement
// ============================================================
// Distinct de la détection de doublons (M4) : même nom de famille + prénoms différents
// n'indique PAS que deux fiches désignent la même personne, mais que deux personnes
// DISTINCTES sont probablement apparentées (frère/sœur). Ne jamais fusionner ces paires
// (voir le garde-fou dans routes/duplicates.ts) — l'action attendue est de créer une
// relation FRERE_DE/SOEUR_DE, pas une fusion.
//
// Portée volontairement restreinte aux élèves (staff exclu : profiles.nom n'est pas
// décomposable en nom/prénom de façon fiable).
//
// Sur l'usage de l'adresse comme signal : ceci compare uniquement des valeurs déjà
// présentes dans classeur.person_attributes (issues d'imports associés) pour DÉCIDER
// d'une suggestion de relation — ça ne crée JAMAIS de ligne classeur.person_locations
// pour un élève (le trigger staff-only reste actif et inchangé), et cette adresse n'est
// affichée nulle part sur le dossier de l'élève. Uniquement un signal de comparaison
// interne, jamais une fonctionnalité de "zone probable" pour un mineur.
import { classeurClient } from '../../lib/supabaseClasseur';
import { normalizeText } from '../normalization/misc';
import { buildCandidateIndex } from './buildCandidateIndex';
import { ClassAliasMap } from './classAlias';
import { CandidatePerson } from './types';

const ADDRESS_ATTRIBUTE_KEYS = ['adresse', 'ville'];

// Ne filtre PAS par person_id ici : avec des centaines d'élèves, un .in(personIds) génère
// une URL de plusieurs dizaines de Ko et dépasse la limite d'en-têtes HTTP (leçon du même
// type qu'en M4 — voir memoire) ; la table des attributs "adresse" reste petite en pratique
// (seulement les personnes ayant reçu un document associé avec ce champ), donc tout charger
// puis filtrer en mémoire est à la fois plus simple et plus fiable.
async function loadStudentAddresses(): Promise<Map<string, string>> {
    const { data, error } = await classeurClient
        .from('person_attributes')
        .select('person_id, attribute_key, attribute_value')
        .in('attribute_key', ADDRESS_ATTRIBUTE_KEYS)
        .eq('is_current', true);
    if (error) throw error;

    const byPerson = new Map<string, string>();
    for (const row of data || []) {
        if (byPerson.has(row.person_id)) continue; // une seule valeur par personne suffit ici
        const normalized = normalizeText(row.attribute_value);
        if (normalized) byPerson.set(row.person_id, normalized);
    }
    return byPerson;
}

function groupBySurname(students: CandidatePerson[]): Map<string, CandidatePerson[]> {
    const groups = new Map<string, CandidatePerson[]>();
    for (const c of students) {
        const key = c.fields.surnameOnly;
        if (!key) continue;
        const arr = groups.get(key) || [];
        arr.push(c);
        groups.set(key, arr);
    }
    return groups;
}

export interface RunSiblingDetectionResult {
    pairsScored: number;
    candidatesFlagged: number;
}

export async function runSiblingDetection(aliases: ClassAliasMap): Promise<RunSiblingDetectionResult> {
    const candidates = await buildCandidateIndex(aliases);
    const students = candidates.filter((c) => c.originSourceTable === 'students' && c.fields.surnameOnly);
    const groups = groupBySurname(students);

    const addresses = await loadStudentAddresses();

    const { data: existingRows } = await classeurClient.from('duplicate_candidates').select('id, person_a_id, person_b_id, status');
    const existingByPair = new Map((existingRows || []).map((r) => [`${r.person_a_id}:${r.person_b_id}`, r]));

    const toInsert: { person_a_id: string; person_b_id: string; score: number; status: 'pending'; candidate_type: 'sibling' }[] = [];
    let pairsScored = 0;

    for (const group of groups.values()) {
        if (group.length < 2) continue;
        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                const [a, b] = group[i].personId < group[j].personId ? [group[i], group[j]] : [group[j], group[i]];
                if (a.personId === b.personId) continue;
                // Même prénom + même nom : c'est le cas d'un doublon (même personne), pas
                // d'une fratrie — déjà couvert par runDuplicateDetection, à ne pas dupliquer ici.
                if (a.fields.prenomOnly && b.fields.prenomOnly && a.fields.prenomOnly === b.fields.prenomOnly) continue;

                pairsScored++;

                // Signal obligatoire : même téléphone parent (même foyer). Sans ça, "même nom
                // de famille" seul est bien trop faible dans un contexte togolais (patronymes
                // très partagés) — leçon tirée de la détection de doublons (M4).
                if (!a.fields.telephone || !b.fields.telephone || a.fields.telephone !== b.fields.telephone) continue;

                const key = `${a.personId}:${b.personId}`;
                const existing = existingByPair.get(key);
                if (existing && existing.status !== 'pending') continue;
                if (existing) continue; // déjà en attente, rien à changer

                let score = 75;
                if (a.schoolSlug && a.schoolSlug === b.schoolSlug) score += 10;
                const addrA = addresses.get(a.personId);
                const addrB = addresses.get(b.personId);
                if (addrA && addrB && addrA === addrB) score += 10;
                score = Math.min(score, 95); // jamais "certain" — reste une suggestion

                toInsert.push({ person_a_id: a.personId, person_b_id: b.personId, score, status: 'pending', candidate_type: 'sibling' });
            }
        }
    }

    if (toInsert.length > 0) {
        await classeurClient.from('duplicate_candidates').insert(toInsert);
    }

    return { pairsScored, candidatesFlagged: toInsert.length };
}
