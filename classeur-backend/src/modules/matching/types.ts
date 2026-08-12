// Un seul champ "nom complet" plutôt que nom+prénom séparés : profiles_{slug}.nom
// contient déjà un nom complet en une seule chaîne (ex. "EDOH koffi E"), tandis que
// students_{slug} a nom/prénom séparés — comparer sur classeur.persons.display_name
// (déjà unifié à la synchronisation M1) évite cette asymétrie plutôt que de la répliquer.
export interface NormalizedFields {
    nomComplet?: string | null;
    telephone?: string | null; // E.164
    email?: string | null;
    matricule?: string | null;
    classe?: string | null;
    dateNaissance?: string | null; // ISO
    sexe?: string | null;
    departement?: string | null;
    // Nom/prénom isolés, disponibles UNIQUEMENT pour les élèves (students.nom/prenom sont
    // déjà séparés dans DGhubschool) — sert à la détection de fratrie (modules/matching/
    // runSiblingDetection.ts), qui a besoin du seul nom de famille, pas du nom complet.
    surnameOnly?: string | null;
    prenomOnly?: string | null;
}

export interface CandidatePerson {
    personId: string;
    displayName: string;
    schoolSlug: string | null;
    originSourceTable: 'profiles' | 'students';
    fields: NormalizedFields;
}

export interface FieldEvidence {
    field: string;
    sourceValue: string | null;
    personValue: string | null;
    weight: number;
    score: number;
    contribution: number;
    notes?: string;
}

export interface ScoreResult {
    score: number;
    evidence: FieldEvidence[];
    consideredFields: number;
}
