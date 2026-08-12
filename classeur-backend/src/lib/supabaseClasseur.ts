// ============================================================
// CLIENT SUPABASE — classeur-backend
// ============================================================
// Deux usages distincts, volontairement séparés dans le code (jamais dans le frontend) :
//   - classeurClient : lecture/écriture sur le schéma `classeur` (ce service en est propriétaire)
//   - dghubschoolReadOnly : LECTURE SEULE sur les tables school-scoped de DGhubschool
//     (profiles_{slug}, students_{slug}, schools, ...). Ce module n'expose volontairement
//     aucune méthode d'écriture vers ces tables — toute correction de données DGhubschool
//     doit passer par le backend principal, jamais par ce service.
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

export const classeurClient = createClient(config.SUPABASE_URL(), config.SUPABASE_SERVICE_ROLE_KEY(), {
    db: { schema: 'classeur' },
    auth: { persistSession: false },
});

const rawClient = createClient(config.SUPABASE_URL(), config.SUPABASE_SERVICE_ROLE_KEY(), {
    auth: { persistSession: false },
});

// Colonnes explicites (jamais `*`) : on évite de faire transiter password/push_token/
// signup_ip_hash/etc. par ce service alors qu'ils ne servent jamais à rien ici.
const PROFILE_COLUMNS = 'id, nom, telephone, email, role, matricule, numero_cnss, date_embauche, departement';
const STUDENT_COLUMNS = 'id, nom, prenom, classe, cycle, sexe, date_naissance, telephone_parent, photo_url, status, ecole_provenance, license_status';

/** Lecture seule des tables DGhubschool school-scoped. Ne jamais ajouter de méthode d'écriture ici. */
export const dghubschoolReadOnly = {
    async getSchools() {
        const { data, error } = await rawClient.from('schools').select('id, name, slug, address, status');
        if (error) throw error;
        return data;
    },
    async getProfiles(schoolSlug: string) {
        const { data, error } = await rawClient.from(`profiles_${schoolSlug}`).select(PROFILE_COLUMNS);
        if (error) throw error;
        return data;
    },
    async getStudents(schoolSlug: string) {
        const { data, error } = await rawClient.from(`students_${schoolSlug}`).select(STUDENT_COLUMNS);
        if (error) throw error;
        return data;
    },
    async getProfileById(schoolSlug: string, id: string) {
        const { data, error } = await rawClient.from(`profiles_${schoolSlug}`).select(PROFILE_COLUMNS).eq('id', id).maybeSingle();
        if (error) throw error;
        return data;
    },
    async getStudentById(schoolSlug: string, id: string) {
        const { data, error } = await rawClient.from(`students_${schoolSlug}`).select(STUDENT_COLUMNS).eq('id', id).maybeSingle();
        if (error) throw error;
        return data;
    },
    async getSchoolBySlug(slug: string) {
        const { data, error } = await rawClient.from('schools').select('name, slug, address').eq('slug', slug).maybeSingle();
        if (error) throw error;
        return data;
    },
};
