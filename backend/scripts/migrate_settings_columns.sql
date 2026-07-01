-- Migration SQL: Ajout des colonnes Directeur et Sceau aux tables app_settings existantes et futures
-- Exécuter ce script dans l'éditeur SQL de Supabase (SQL Editor)

-- 1. Mise à jour de toutes les tables existantes 'app_settings_[schoolSlug]'
DO $$
DECLARE
    t_name RECORD;
BEGIN
    FOR t_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' AND tablename LIKE 'app_settings_%'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS director_signature TEXT;', t_name.tablename);
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS official_seal TEXT;', t_name.tablename);
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS director_name TEXT;', t_name.tablename);
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS director_title TEXT;', t_name.tablename);
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS show_stamp_on_cards BOOLEAN DEFAULT true;', t_name.tablename);
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS show_signature_on_cards BOOLEAN DEFAULT true;', t_name.tablename);
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS show_seal_on_cards BOOLEAN DEFAULT true;', t_name.tablename);
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS show_stamp_on_bulletins BOOLEAN DEFAULT true;', t_name.tablename);
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS show_signature_on_bulletins BOOLEAN DEFAULT true;', t_name.tablename);
        
        RAISE NOTICE 'Table % mise à jour avec succès.', t_name.tablename;
    END LOOP;
END $$;

-- 2. Pour information : La fonction RPC create_school_tables dans votre Supabase doit intégrer ces nouvelles colonnes lors de la création de la table app_settings :
-- CREATE TABLE app_settings_SLUG (
--     id VARCHAR PRIMARY KEY,
--     app_name VARCHAR,
--     school_name VARCHAR,
--     school_year VARCHAR,
--     school_logo TEXT,
--     school_stamp TEXT,
--     message_remerciement TEXT,
--     message_rappel TEXT,
--     tranches JSONB,
--     school_motto VARCHAR,
--     school_bp VARCHAR,
--     school_telephone VARCHAR,
--     school_address VARCHAR,
--     school_currency VARCHAR,
--     country_name VARCHAR,
--     country_motto VARCHAR,
--     ministere_name VARCHAR,
--     director_signature TEXT,
--     official_seal TEXT,
--     director_name TEXT,
--     director_title TEXT,
--     show_stamp_on_cards BOOLEAN DEFAULT true,
--     show_signature_on_cards BOOLEAN DEFAULT true,
--     show_seal_on_cards BOOLEAN DEFAULT true,
--     show_stamp_on_bulletins BOOLEAN DEFAULT true,
--     show_signature_on_bulletins BOOLEAN DEFAULT true,
--     updated_at TIMESTAMP
-- );
