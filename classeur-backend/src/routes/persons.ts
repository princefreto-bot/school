// ============================================================
// PERSONNES — annuaire unifié (lecture)
// ============================================================
import { Router } from 'express';
import { classeurClient, dghubschoolReadOnly } from '../lib/supabaseClasseur';
import { authenticateOperator } from '../middleware/auth';

const router = Router();
router.use(authenticateOperator);

interface PersonDetail {
    id: string;
    display_name: string;
    is_minor: boolean;
    origin_type: string;
    origin_school_slug: string | null;
    origin_source_table: 'profiles' | 'students' | null;
    origin_source_id: string | null;
    status: string;
    primary_photo_url: string | null;
    created_at: string;
    updated_at: string;
}

const PERSON_LIST_SELECT =
    'id, display_name, is_minor, origin_school_slug, origin_source_table, status, primary_photo_url, ' +
    'person_roles(school_slug, role_types(code, label_fr, category))';

// ── GET /api/persons ──────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const { q, school, type, limit = '50', offset = '0' } = req.query as Record<string, string>;

        let query = classeurClient
            .from('persons')
            .select(PERSON_LIST_SELECT, { count: 'exact' })
            .eq('status', 'active')
            .order('display_name', { ascending: true })
            .range(Number(offset), Number(offset) + Number(limit) - 1);

        if (q) query = query.ilike('display_name', `%${q}%`);
        if (school) query = query.eq('origin_school_slug', school);
        if (type === 'eleves') query = query.eq('origin_source_table', 'students');
        if (type === 'personnel') query = query.eq('origin_source_table', 'profiles');

        const { data, error, count } = await query;
        if (error) throw error;

        return res.json({ persons: data, total: count });
    } catch (err: any) {
        console.error('List persons error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors du chargement des personnes.' });
    }
});

// ── GET /api/persons/:id ──────────────────────────────────────
// Dossier complet : identité classeur + attributs vivants relus en direct depuis DGhubschool
// via le pointeur d'origine (voir plan — classeur.persons ne duplique pas l'état DGhubschool).
router.get('/:id', async (req, res) => {
    try {
        const { data: person, error } = await classeurClient
            .from('persons')
            .select(
                'id, display_name, is_minor, origin_type, origin_school_slug, origin_source_table, origin_source_id, ' +
                    'status, primary_photo_url, created_at, updated_at, ' +
                    'person_roles(school_slug, role_types(code, label_fr, category))'
            )
            .eq('id', req.params.id)
            .maybeSingle<PersonDetail & { person_roles: any[] }>();

        if (error) throw error;
        if (!person) return res.status(404).json({ error: 'Personne introuvable.' });

        let live: Record<string, any> | null = null;
        if (person.origin_school_slug && person.origin_source_table && person.origin_source_id) {
            live =
                person.origin_source_table === 'profiles'
                    ? await dghubschoolReadOnly.getProfileById(person.origin_school_slug, person.origin_source_id)
                    : await dghubschoolReadOnly.getStudentById(person.origin_school_slug, person.origin_source_id);
        }

        const school = person.origin_school_slug ? await dghubschoolReadOnly.getSchoolBySlug(person.origin_school_slug) : null;

        return res.json({ person, live, school });
    } catch (err: any) {
        console.error('Get person error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors du chargement de la personne.' });
    }
});

export default router;
