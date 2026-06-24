-- ============================================================
-- SQL MIGRATION: Row Level Security (RLS) Enforcements
-- Execute this script in the Supabase SQL Editor
-- ============================================================

-- 1. Enable RLS and define secure policies on global/system tables

-- Global profiles table
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS secure_access_profiles ON public.profiles;
CREATE POLICY secure_access_profiles ON public.profiles
    FOR ALL
    TO authenticated
    USING (
        auth.uid() = id
        OR (auth.jwt() ->> 'role') = 'superadmin'
    );

-- Schools table
ALTER TABLE IF EXISTS public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.schools FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS secure_access_schools ON public.schools;
CREATE POLICY secure_access_schools ON public.schools
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'school_slug') = slug
        OR (auth.jwt() ->> 'role') = 'superadmin'
    );

-- Academic Years table
ALTER TABLE IF EXISTS public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.academic_years FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS secure_access_academic_years ON public.academic_years;
CREATE POLICY secure_access_academic_years ON public.academic_years
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'school_slug') = school_slug
        OR (auth.jwt() ->> 'role') = 'superadmin'
    );

-- SaaS Expenses table
ALTER TABLE IF EXISTS public.saas_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.saas_expenses FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS secure_access_saas_expenses ON public.saas_expenses;
CREATE POLICY secure_access_saas_expenses ON public.saas_expenses
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() ->> 'role') = 'superadmin'
    );

-- Creators table
ALTER TABLE IF EXISTS public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.creators FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS secure_access_creators ON public.creators;
CREATE POLICY secure_access_creators ON public.creators
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() ->> 'role') = 'creator'
        OR (auth.jwt() ->> 'role') = 'superadmin'
    );

-- Creator Schools table
ALTER TABLE IF EXISTS public.creator_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.creator_schools FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS secure_access_creator_schools ON public.creator_schools;
CREATE POLICY secure_access_creator_schools ON public.creator_schools
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() ->> 'role') = 'creator'
        OR (auth.jwt() ->> 'role') = 'superadmin'
    );

-- Student Documents table
ALTER TABLE IF EXISTS public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student_documents FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS secure_access_student_documents ON public.student_documents;
CREATE POLICY secure_access_student_documents ON public.student_documents
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'school_slug') = school_slug
        OR (auth.jwt() ->> 'role') = 'superadmin'
    );


-- 2. Define the helper function to enable RLS on any school dynamically
CREATE OR REPLACE FUNCTION public.enable_rls_for_school(school_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    table_name_var text;
    t_name text;
    tables_array text[] := ARRAY[
        'students', 'payments', 'presences', 'notes', 'matieres', 'classe_matieres',
        'profiles', 'app_settings', 'parent_student', 'activity_logs',
        'announcements', 'announcement_reads', 'conversations', 'messages',
        'testimonials'
    ];
BEGIN
    FOREACH t_name IN ARRAY tables_array LOOP
        table_name_var := t_name || '_' || school_slug;
        
        -- Check if table exists
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = table_name_var) THEN
            -- Enable RLS
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', table_name_var);
            EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', table_name_var);
            
            -- Drop any existing policies on the table
            DECLARE
                policy_record RECORD;
            BEGIN
                for policy_record in 
                    select policyname from pg_policies 
                    where schemaname = 'public' and tablename = table_name_var
                loop
                    execute format('DROP POLICY %I ON public.%I;', policy_record.policyname, table_name_var);
                end loop;
            END;

            -- Create secure policy for this table
            EXECUTE format('
                CREATE POLICY secure_access ON public.%I
                FOR ALL
                TO authenticated
                USING (
                    (auth.jwt() -> ''user_metadata'' ->> ''school_slug'') = %L
                    OR (auth.jwt() ->> ''role'') = ''superadmin''
                );
            ', table_name_var, school_slug);
        END IF;
    END LOOP;
END;
$$;


-- 3. Execute the function dynamically for all existing schools
DO $$
DECLARE
    school_row RECORD;
BEGIN
    FOR school_row IN SELECT slug FROM public.schools LOOP
        PERFORM public.enable_rls_for_school(school_row.slug);
    END LOOP;
END $$;
