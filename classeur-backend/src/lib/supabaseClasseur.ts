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

/** Lecture seule des tables DGhubschool school-scoped. Ne jamais ajouter de méthode d'écriture ici. */
export const dghubschoolReadOnly = {
    async getSchools() {
        const { data, error } = await rawClient.from('schools').select('*');
        if (error) throw error;
        return data;
    },
    async getProfiles(schoolSlug: string) {
        const { data, error } = await rawClient.from(`profiles_${schoolSlug}`).select('*');
        if (error) throw error;
        return data;
    },
    async getStudents(schoolSlug: string) {
        const { data, error } = await rawClient.from(`students_${schoolSlug}`).select('*');
        if (error) throw error;
        return data;
    },
};
