export interface RoleType {
    id?: string;
    code: string;
    label_fr: string;
    category: 'staff' | 'student' | 'family' | 'other';
}

export interface PersonRole {
    school_slug: string;
    role_types: RoleType;
}

export interface PersonSummary {
    id: string;
    display_name: string;
    is_minor: boolean;
    origin_school_slug: string | null;
    origin_source_table: 'profiles' | 'students' | null;
    status: string;
    primary_photo_url: string | null;
    person_roles: PersonRole[];
}

export interface PersonDetail extends PersonSummary {
    origin_type: string;
    origin_source_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface School {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    status: string;
}

export interface PersonDocument {
    id: string;
    document_type: string | null;
    title: string | null;
    mime_type: string | null;
    uploaded_at: string;
    url: string | null;
}

export interface PersonImage {
    id: string;
    is_primary: boolean;
    uploaded_at: string;
    url: string | null;
}

export interface Source {
    id: string;
    name: string;
    source_type: string;
    original_filename: string | null;
    status: 'pending' | 'processing' | 'processed' | 'failed';
    row_count: number | null;
    imported_at: string;
}

export interface SourceRecord {
    id: string;
    raw_data: { raw: Record<string, any>; extracted: Record<string, string> };
    row_index: number | null;
    classification_status: string;
    extracted_at: string;
    sources: { name: string; original_filename: string | null; imported_at: string } | null;
}

export interface MatchEvidence {
    field_name: string;
    source_value: string | null;
    person_value: string | null;
    field_weight: number;
    field_score: number;
    contribution: number;
    notes: string | null;
}

export interface Match {
    id: string;
    score: number;
    confidence_band: 'strong' | 'to_verify' | 'weak';
    status: string;
    computed_at: string;
    source_record: {
        id: string;
        raw_data: { raw: Record<string, any>; extracted: Record<string, string> };
        sources: { name: string; original_filename: string | null } | null;
    } | null;
    person: { id: string; display_name: string; origin_school_slug: string | null } | null;
    match_evidence: MatchEvidence[];
}

export interface DuplicateCandidate {
    id: string;
    score: number;
    status: string;
    candidate_type: 'duplicate' | 'sibling';
    detected_at: string;
    person_a: { id: string; display_name: string; origin_school_slug: string | null };
    person_b: { id: string; display_name: string; origin_school_slug: string | null };
}

export interface DocumentItem {
    id: string;
    kind: 'document' | 'image';
    title?: string | null;
    document_type?: string | null;
    uploaded_at: string;
    url: string | null;
    person: { id: string; display_name: string } | null;
}

export interface RelationshipType {
    id: string;
    code: string;
    label_fr: string;
    inverse_code: string | null;
}

export interface Relation {
    id: string;
    status: string;
    label: string | null;
    otherPerson: { id: string; display_name: string } | null;
}

export interface PersonLocationEntry {
    id: string;
    relation_type: string;
    status: string;
    confidence: number | null;
    locations: { label: string | null; address_text: string | null; source: string } | null;
}

export interface LocationListEntry {
    id: string;
    relation_type: string;
    status: string;
    confidence: number | null;
    created_at: string;
    person: { id: string; display_name: string } | null;
    locations: { label: string | null; address_text: string | null; source: string } | null;
}

export interface GlobalRelation {
    id: string;
    status: string;
    created_at: string;
    relationship_types: { label_fr: string } | null;
    person_a: { id: string; display_name: string } | null;
    person_b: { id: string; display_name: string } | null;
}

export interface HistoryEntry {
    id: string;
    actor_name: string | null;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    details: Record<string, any> | null;
    created_at: string;
}

export interface DashboardStats {
    totalPersons: number;
    totalEleves: number;
    totalPersonnel: number;
    totalSources: number;
    matchesStrong: number;
    matchesToVerify: number;
    toClassify: number;
    duplicateCandidates: number;
    lastSyncAt: string | null;
}
