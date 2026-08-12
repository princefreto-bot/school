// ============================================================
// LOCALISATIONS — RÉSERVÉ AU PERSONNEL ADULTE, JAMAIS AUX ÉLÈVES
// ============================================================
// Règle de cadrage non négociable du projet : aucune "zone probable" pour un mineur ou une
// personne non-staff. Le trigger classeur.enforce_staff_only_location est le garde-fou
// définitif en base ; les vérifications ici sont une seconde ligne de défense côté
// application, pas un remplacement.
import { Router } from 'express';
import { classeurClient, dghubschoolReadOnly } from '../lib/supabaseClasseur';
import { authenticateOperator } from '../middleware/auth';

const router = Router();
router.use(authenticateOperator);

router.get('/', async (_req, res) => {
    try {
        const { data, error } = await classeurClient
            .from('person_locations')
            .select('id, relation_type, status, confidence, created_at, person:persons(id, display_name), locations(label, address_text, source)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return res.json({ locations: data });
    } catch (err: any) {
        console.error('List locations error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors du chargement des localisations.' });
    }
});

// ── POST /api/locations/generate-staff ───────────────────────
// Zone professionnelle = adresse de l'établissement où la personne a un rôle staff.
// Fait établi (l'établissement d'affectation est une donnée DGhubschool réelle), pas une
// estimation — status='confirmed', confidence=100, à la différence des zones "probables"
// dérivées de documents.
router.post('/generate-staff', async (req, res) => {
    try {
        const { data: staffRoles, error: rolesErr } = await classeurClient
            .from('person_roles')
            .select('person_id, school_slug, persons!inner(id, status), role_types!inner(category)')
            .eq('role_types.category', 'staff')
            .eq('persons.status', 'active');
        if (rolesErr) throw rolesErr;

        const staffBySchool = new Map<string, Set<string>>();
        for (const row of staffRoles || []) {
            const set = staffBySchool.get(row.school_slug) || new Set<string>();
            set.add(row.person_id);
            staffBySchool.set(row.school_slug, set);
        }

        const { data: existingLocations } = await classeurClient
            .from('locations')
            .select('id, school_slug')
            .eq('source', 'etablissement_address');
        const locationBySchool = new Map((existingLocations || []).map((l) => [l.school_slug, l.id]));

        const { data: existingLinks } = await classeurClient
            .from('person_locations')
            .select('person_id, location_id')
            .eq('relation_type', 'etablissement_travail');
        const linkedPairs = new Set((existingLinks || []).map((l) => `${l.person_id}:${l.location_id}`));

        let locationsCreated = 0;
        let linksCreated = 0;
        const newLinks: { person_id: string; location_id: string; relation_type: string; status: string; confidence: number }[] = [];

        for (const [schoolSlug, personIds] of staffBySchool) {
            let locationId = locationBySchool.get(schoolSlug);
            if (!locationId) {
                const school = await dghubschoolReadOnly.getSchoolBySlug(schoolSlug);
                const { data: newLoc, error: locErr } = await classeurClient
                    .from('locations')
                    .insert({
                        label: school?.name || schoolSlug,
                        address_text: school?.address || null,
                        source: 'etablissement_address',
                        school_slug: schoolSlug,
                    })
                    .select('id')
                    .single();
                if (locErr || !newLoc) continue;
                locationId = newLoc.id;
                locationBySchool.set(schoolSlug, locationId);
                locationsCreated++;
            }

            for (const personId of personIds) {
                const key = `${personId}:${locationId}`;
                if (linkedPairs.has(key)) continue;
                newLinks.push({
                    person_id: personId,
                    location_id: locationId,
                    relation_type: 'etablissement_travail',
                    status: 'confirmed',
                    confidence: 100,
                });
                linkedPairs.add(key);
            }
        }

        if (newLinks.length > 0) {
            const { error: insertErr } = await classeurClient.from('person_locations').insert(newLinks);
            if (insertErr) throw insertErr;
            linksCreated = newLinks.length;
        }

        await classeurClient.from('audit_logs').insert({
            actor_id: req.operator!.operatorId,
            actor_name: req.operator!.nom,
            action: 'correlation',
            entity_type: 'person_locations',
            details: { locationsCreated, linksCreated },
        });

        return res.json({ locationsCreated, linksCreated });
    } catch (err: any) {
        console.error('Generate staff locations error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors de la génération des localisations.' });
    }
});

export default router;
