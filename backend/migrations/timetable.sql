-- Migration pour l'emploi du temps par école (Phase 3, plan de parité Scolapp).
-- Appliquée en direct via le MCP Supabase le 2026-07-19.
--
-- enseignant_nom en TEXT (pas de FK vers profiles) — cohérent avec
-- classe_matieres.professeur : cette app identifie déjà les enseignants par nom
-- (compte enseignant partagé, sélection du nom en localStorage via
-- SelectionEnseignant.tsx), pas par un compte individuel.
--
-- Détection de conflit (même classe OU même enseignant, même jour, horaires qui
-- se chevauchent) faite côté application (timetableController.js), pas en SQL —
-- cohérent avec le reste du backend qui calcule en mémoire plutôt qu'en requêtes
-- complexes. Piège rencontré et corrigé pendant les tests : Postgres renvoie les
-- colonnes TIME au format "HH:MM:SS" alors que le frontend envoie "HH:MM" — sans
-- normalisation, la comparaison de chaînes traite "09:00" comme < "09:00:00"
-- (préfixe), créant un faux conflit entre deux créneaux pourtant adjacents.
CREATE OR REPLACE FUNCTION public.create_timetable_tables(school_slug text)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.timetable_slots_%1$s (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            classe TEXT NOT NULL,
            matiere_id UUID REFERENCES public.matieres_%1$s(id) ON DELETE SET NULL,
            enseignant_nom TEXT,
            jour_semaine INT NOT NULL CHECK (jour_semaine BETWEEN 0 AND 6),
            heure_debut TIME NOT NULL,
            heure_fin TIME NOT NULL,
            salle TEXT,
            academic_year_id UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone(''utc''::text, now()),
            CHECK (heure_fin > heure_debut)
        )', school_slug);

    EXECUTE format('ALTER TABLE public.timetable_slots_%1$s ENABLE ROW LEVEL SECURITY', school_slug);
END;
$$;

DO $$
DECLARE
    s RECORD;
BEGIN
    FOR s IN SELECT slug FROM public.schools LOOP
        IF to_regclass('public.matieres_' || s.slug) IS NOT NULL THEN
            PERFORM public.create_timetable_tables(s.slug);
        ELSE
            RAISE NOTICE 'École % ignorée : matieres_% introuvable (provisionnement incomplet)', s.slug, s.slug;
        END IF;
    END LOOP;
END $$;
