-- Migration pour les alertes automatiques de retard de paiement (Phase 4, plan de parité Scolapp).
-- Appliquée en direct via le MCP Supabase le 2026-07-19 (migration create_reminder_tables_and_settings_columns).
--
-- payment_reminders_${school_slug} sert uniquement de journal anti-doublon : un
-- rappel par élève n'est renvoyé qu'après REMINDER_COOLDOWN_DAYS (7 jours, voir
-- backend/services/reminderService.js), pour éviter de spammer un parent déjà en
-- retard depuis longtemps. student_id n'a pas de FK explicite vers students_%1$s
-- (cohérent avec le reste du schéma dynamique : pas de contrainte FK inter-table
-- générée dynamiquement dans les autres fonctions create_*_tables de ce projet).
--
-- Deux nouvelles colonnes sur app_settings_${school_slug} (table déjà existante,
-- une seule ligne 'global_settings') plutôt qu'une nouvelle table de config, pour
-- rester cohérent avec les autres réglages école déjà stockés là (messageRappel,
-- etc.). Désactivé par défaut (auto_reminders_enabled = false) : aucune école
-- n'envoie de notification tant que l'admin ne l'active pas explicitement.
CREATE OR REPLACE FUNCTION public.ensure_reminder_settings_columns(school_slug text)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    EXECUTE format('ALTER TABLE public.app_settings_%1$s ADD COLUMN IF NOT EXISTS auto_reminders_enabled BOOLEAN DEFAULT false', school_slug);
    EXECUTE format('ALTER TABLE public.app_settings_%1$s ADD COLUMN IF NOT EXISTS auto_reminders_threshold_days INT DEFAULT 30', school_slug);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_reminder_tables(school_slug text)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.payment_reminders_%1$s (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID NOT NULL,
            sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone(''utc''::text, now())
        )', school_slug);

    EXECUTE format('ALTER TABLE public.payment_reminders_%1$s ENABLE ROW LEVEL SECURITY', school_slug);

    PERFORM public.ensure_reminder_settings_columns(school_slug);
END;
$$;

DO $$
DECLARE
    s RECORD;
BEGIN
    FOR s IN SELECT slug FROM public.schools LOOP
        IF to_regclass('public.app_settings_' || s.slug) IS NOT NULL THEN
            PERFORM public.create_reminder_tables(s.slug);
        ELSE
            RAISE NOTICE 'École % ignorée : app_settings_% introuvable (provisionnement incomplet)', s.slug, s.slug;
        END IF;
    END LOOP;
END $$;
