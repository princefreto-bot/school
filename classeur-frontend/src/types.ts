export interface RoleType {
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
