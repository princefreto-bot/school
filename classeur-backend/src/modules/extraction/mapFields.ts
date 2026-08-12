// ============================================================
// EXTRACTION — dictionnaire d'en-têtes pour fichiers tabulaires
// ============================================================
// Normalise des variantes de colonnes ("Nom", "NOM", "Nom de famille"...) vers des
// clés canoniques, SANS jamais perdre la ligne brute d'origine (voir spec §9/§13 :
// toujours conserver les valeurs originales, chaque info garde sa provenance).
const HEADER_DICTIONARY: Record<string, string> = {
    nom: 'nom',
    nomdefamille: 'nom',
    lastname: 'nom',
    surname: 'nom',
    prenom: 'prenom',
    prenoms: 'prenom',
    firstname: 'prenom',
    nomcomplet: 'nom_complet',
    fullname: 'nom_complet',
    telephone: 'telephone',
    tel: 'telephone',
    telephoneparent: 'telephone',
    numerodetelephone: 'telephone',
    phone: 'telephone',
    contact: 'telephone',
    whatsapp: 'telephone',
    email: 'email',
    mail: 'email',
    courriel: 'email',
    classe: 'classe',
    class: 'classe',
    niveau: 'classe',
    fonction: 'fonction',
    poste: 'fonction',
    role: 'fonction',
    matricule: 'matricule',
    adresse: 'adresse',
    address: 'adresse',
    quartier: 'adresse',
    ville: 'ville',
    datedenaissance: 'date_naissance',
    naissance: 'date_naissance',
    ddn: 'date_naissance',
    sexe: 'sexe',
    genre: 'sexe',
    gender: 'sexe',
    etablissement: 'etablissement',
    ecole: 'etablissement',
    school: 'etablissement',
    departement: 'departement',
    service: 'departement',
    pere: 'pere',
    nomdupere: 'pere',
    mere: 'mere',
    nomdelamere: 'mere',
};

function normalizeHeader(header: string): string {
    return header
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // marques diacritiques combinantes (accents)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

export interface MappedRow {
    raw: Record<string, any>;
    extracted: Record<string, string>;
}

/** Ne devine jamais une valeur : ne mappe que les en-têtes reconnus, laisse le reste dans `raw`. */
export function mapRow(row: Record<string, any>): MappedRow {
    const extracted: Record<string, string> = {};
    for (const [header, value] of Object.entries(row)) {
        if (value === undefined || value === null || String(value).trim() === '') continue;
        const canonicalKey = HEADER_DICTIONARY[normalizeHeader(header)];
        if (canonicalKey && !extracted[canonicalKey]) {
            extracted[canonicalKey] = String(value).trim();
        }
    }
    return { raw: row, extracted };
}
