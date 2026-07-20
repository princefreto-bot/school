-- Migration pour le sondage de satisfaction parent / NPS (parité Scolapp).
-- Appliquée en direct via le MCP Supabase le 2026-07-20
-- (migration create_satisfaction_tables_function_and_backfill).
--
-- Une note par parent et par mois (UNIQUE(parent_id, period)) : re-soumettre
-- dans le même mois met à jour la note existante (upsert onConflict) plutôt
-- que d'en créer une deuxième — testé en direct : l'id reste identique après
-- une deuxième soumission le même mois, une seule ligne en base.
--
-- Score NPS calculé côté backend (getSatisfactionSummary) : promoteurs (9-10)
-- moins détracteurs (0-6), en pourcentage du total de réponses — formule NPS
-- standard. Les passifs (7-8) ne comptent dans aucun des deux camps.
CREATE OR REPLACE FUNCTION public.create_satisfaction_tables(school_slug text)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.parent_satisfaction_%1$s (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            parent_id UUID NOT NULL,
            score INT NOT NULL CHECK (score BETWEEN 0 AND 10),
            comment TEXT,
            period TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone(''utc''::text, now()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone(''utc''::text, now()),
            UNIQUE(parent_id, period)
        )', school_slug);

    EXECUTE format('ALTER TABLE public.parent_satisfaction_%1$s ENABLE ROW LEVEL SECURITY', school_slug);
END;
$$;

-- Verrouillage direct dès la création (contrairement à Phase 1-4 où le
-- PUBLIC/anon/authenticated EXECUTE par défaut avait dû être révoqué après
-- coup — voir backend/migrations/security_fixes_2026-07-19.sql) : cette fois
-- REVOKE appliqué immédiatement dans la même migration.
REVOKE EXECUTE ON FUNCTION public.create_satisfaction_tables(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_satisfaction_tables(text) TO postgres, service_role;

DO $$
DECLARE
    s RECORD;
BEGIN
    FOR s IN SELECT slug FROM public.schools LOOP
        IF to_regclass('public.profiles_' || s.slug) IS NOT NULL THEN
            PERFORM public.create_satisfaction_tables(s.slug);
        ELSE
            RAISE NOTICE 'École % ignorée : profiles_% introuvable (provisionnement incomplet)', s.slug, s.slug;
        END IF;
    END LOOP;
END $$;
