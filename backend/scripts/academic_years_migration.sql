-- ==============================================================================
-- MIGRATION SCRIPT: Support Multi-Années Scolaires
-- Exécuter ce script dans l'éditeur SQL de Supabase
-- ==============================================================================

-- 1. Création de la table globale pour les années académiques
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_slug TEXT NOT NULL REFERENCES public.schools(slug) ON DELETE CASCADE,
    name TEXT NOT NULL, -- ex: "2024-2025"
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE (school_slug, name)
);

-- 2. Ajout de la colonne academic_year_id sur les tables dynamiques existantes
DO $$
DECLARE
    row RECORD;
    t_name TEXT;
    s_slug TEXT;
    default_year_id UUID;
BEGIN
    FOR row IN SELECT slug FROM public.schools LOOP
        s_slug := row.slug;
        
        -- Insérer une année académique par défaut pour l'école
        INSERT INTO public.academic_years (school_slug, name, start_date, end_date, is_current)
        VALUES (s_slug, '2024-2025', '2024-09-01', '2025-07-31', true)
        ON CONFLICT (school_slug, name) DO NOTHING;

        -- Récupérer l'ID de cette année par défaut
        SELECT id INTO default_year_id FROM public.academic_years WHERE school_slug = s_slug AND name = '2024-2025';
        
        -- Boucler sur les tables dynamiques de l'école qui nécessitent la séparation par année
        FOREACH t_name IN ARRAY ARRAY['students', 'payments', 'presences', 'notes', 'matieres', 'classe_matieres', 'activity_logs'] LOOP
            IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t_name || '_' || s_slug) THEN
                -- Ajouter la colonne si elle n'existe pas
                EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE;', t_name || '_' || s_slug);
                -- Assigner l'année par défaut aux enregistrements existants
                EXECUTE format('UPDATE public.%I SET academic_year_id = %L WHERE academic_year_id IS NULL;', t_name || '_' || s_slug, default_year_id);
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- IMPORTANT : N'oubliez pas de mettre à jour la fonction RPC `create_school_tables` 
-- dans Supabase pour inclure `academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE`
-- dans la définition des nouvelles tables (students_slug, notes_slug, etc.).
