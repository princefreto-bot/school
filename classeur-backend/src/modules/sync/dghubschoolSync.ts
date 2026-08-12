// ============================================================
// SYNC — DGhubschool (source de vérité) -> classeur.persons
// ============================================================
// M1 : synchronisation en lecture seule, 1:1, aucune logique de corrélation floue ici
// (chaque ligne DGhubschool fait autorité sur sa propre existence). La corrélation entre
// sources multiples (fichiers importés, etc.) arrive en M2/M3.
import { classeurClient, dghubschoolReadOnly } from '../../lib/supabaseClasseur';

export interface SchoolSyncResult {
    school_slug: string;
    profiles_synced: number;
    students_synced: number;
    error?: string;
}

export async function syncSchool(schoolSlug: string): Promise<SchoolSyncResult> {
    const [profiles, students] = await Promise.all([
        dghubschoolReadOnly.getProfiles(schoolSlug),
        dghubschoolReadOnly.getStudents(schoolSlug),
    ]);

    const profilesPayload = (profiles || []).map((p: any) => ({ id: p.id, nom: p.nom, role: p.role }));
    const studentsPayload = (students || []).map((s: any) => ({ id: s.id, nom: s.nom, prenom: s.prenom }));

    const { data, error } = await classeurClient.rpc('sync_school_people', {
        p_school_slug: schoolSlug,
        p_profiles: profilesPayload,
        p_students: studentsPayload,
    });

    if (error) throw error;
    return data as SchoolSyncResult;
}

export async function syncAllSchools(): Promise<{ results: SchoolSyncResult[]; totalPersons: number }> {
    const schools = await dghubschoolReadOnly.getSchools();
    const results: SchoolSyncResult[] = [];

    for (const school of schools || []) {
        try {
            results.push(await syncSchool((school as any).slug));
        } catch (err: any) {
            results.push({
                school_slug: (school as any).slug,
                profiles_synced: 0,
                students_synced: 0,
                error: err.message || String(err),
            });
        }
    }

    const totalPersons = results.reduce((sum, r) => sum + r.profiles_synced + r.students_synced, 0);
    return { results, totalPersons };
}
