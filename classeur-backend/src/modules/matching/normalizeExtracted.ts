import { normalizeDate } from '../normalization/date';
import { normalizeName } from '../normalization/name';
import { normalizeSexe, normalizeText } from '../normalization/misc';
import { normalizePhone } from '../normalization/phone';
import { ClassAliasMap, normalizeClasse } from './classAlias';
import { NormalizedFields } from './types';

/** Un enregistrement importé (source_records.raw_data.extracted) vers des champs
 *  normalisés comparables à ceux d'une personne (voir buildCandidateIndex). */
export function normalizeExtracted(extracted: Record<string, string>, aliases: ClassAliasMap): NormalizedFields {
    const nomComplet = extracted.nom_complet
        ? extracted.nom_complet
        : [extracted.prenom, extracted.nom].filter(Boolean).join(' ') || extracted.nom || null;

    return {
        nomComplet: normalizeName(nomComplet),
        telephone: normalizePhone(extracted.telephone).e164,
        email: normalizeText(extracted.email),
        matricule: normalizeText(extracted.matricule),
        classe: normalizeClasse(extracted.classe, aliases),
        dateNaissance: normalizeDate(extracted.date_naissance),
        sexe: normalizeSexe(extracted.sexe),
        departement: normalizeText(extracted.departement),
    };
}
