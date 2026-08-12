// ============================================================
// INDEX DE CANDIDATS — personnes actives + leurs champs comparables
// ============================================================
// Les champs vivants (téléphone, email, matricule...) ne sont volontairement PAS
// dupliqués dans classeur.person_attributes pour les personnes synchronisées (voir M1) —
// on les relit ici depuis DGhubschool, une fois par exécution de corrélation, pour
// construire un index en mémoire (~quelques centaines de personnes, coût raisonnable).
import { classeurClient, dghubschoolReadOnly } from '../../lib/supabaseClasseur';
import { normalizeDate } from '../normalization/date';
import { normalizeName } from '../normalization/name';
import { normalizeSexe, normalizeText } from '../normalization/misc';
import { normalizePhone } from '../normalization/phone';
import { ClassAliasMap, normalizeClasse } from './classAlias';
import { CandidatePerson } from './types';

export async function buildCandidateIndex(aliases: ClassAliasMap): Promise<CandidatePerson[]> {
    const { data: persons, error } = await classeurClient
        .from('persons')
        .select('id, display_name, origin_school_slug, origin_source_table, origin_source_id')
        .eq('status', 'active')
        .not('origin_school_slug', 'is', null);
    if (error) throw error;

    const personByOrigin = new Map<string, { id: string; displayName: string; schoolSlug: string }>();
    for (const p of persons || []) {
        if (!p.origin_school_slug || !p.origin_source_table || !p.origin_source_id) continue;
        personByOrigin.set(`${p.origin_school_slug}:${p.origin_source_table}:${p.origin_source_id}`, {
            id: p.id,
            displayName: p.display_name,
            schoolSlug: p.origin_school_slug,
        });
    }

    const schoolSlugs = Array.from(new Set((persons || []).map((p) => p.origin_school_slug).filter(Boolean))) as string[];
    const candidates: CandidatePerson[] = [];

    for (const slug of schoolSlugs) {
        const [profiles, students] = await Promise.all([
            dghubschoolReadOnly.getProfiles(slug),
            dghubschoolReadOnly.getStudents(slug),
        ]);

        for (const p of profiles || []) {
            const match = personByOrigin.get(`${slug}:profiles:${p.id}`);
            if (!match) continue;
            candidates.push({
                personId: match.id,
                displayName: match.displayName,
                schoolSlug: slug,
                originSourceTable: 'profiles',
                fields: {
                    nomComplet: normalizeName(match.displayName),
                    telephone: normalizePhone(p.telephone).e164,
                    email: normalizeText(p.email),
                    matricule: normalizeText(p.matricule),
                    classe: null,
                    dateNaissance: null,
                    sexe: null,
                    departement: normalizeText(p.departement),
                    // profiles.nom est un nom complet en une seule chaîne, pas décomposable
                    // de façon fiable en nom/prénom -> jamais de détection de fratrie pour le staff.
                    surnameOnly: null,
                    prenomOnly: null,
                },
            });
        }

        for (const s of students || []) {
            const match = personByOrigin.get(`${slug}:students:${s.id}`);
            if (!match) continue;
            candidates.push({
                personId: match.id,
                displayName: match.displayName,
                schoolSlug: slug,
                originSourceTable: 'students',
                fields: {
                    nomComplet: normalizeName(match.displayName),
                    telephone: normalizePhone(s.telephone_parent).e164,
                    email: null,
                    matricule: null,
                    classe: normalizeClasse(s.classe, aliases),
                    dateNaissance: normalizeDate(s.date_naissance),
                    sexe: normalizeSexe(s.sexe),
                    departement: null,
                    surnameOnly: normalizeName(s.nom),
                    prenomOnly: normalizeName(s.prenom),
                },
            });
        }
    }

    return candidates;
}
