-- Correctifs de sécurité appliqués directement via le MCP Supabase (execute_sql /
-- apply_migration) le 2026-07-19, suite à un audit `get_advisors`. Ce fichier est
-- une trace pour le dépôt — les migrations réelles sont déjà appliquées en base,
-- visibles dans l'historique Supabase (mcp__supabase__list_migrations) :
--   - create_school_withdrawals_table
--   - create_accounting_tables_function_and_backfill
--   - enable_rls_on_new_tables_and_fix_function_search_path
--   - enable_rls_no_policy_on_exposed_tables
--   - restrict_security_definer_functions_and_fix_search_path
--   - revoke_execute_from_public_on_school_table_functions

-- 1. Bucket Storage "student-documents" (actes de naissance, bulletins...) avait
--    des policies PUBLIQUES en SELECT/INSERT/UPDATE/DELETE — n'importe qui pouvait
--    lire, modifier ou supprimer les documents de n'importe quel élève, de
--    n'importe quelle école, sans authentification. Le backend sert déjà ces
--    fichiers via /api/documents/file/:filename avec vérification des droits
--    (service_role, qui ignore les policies Storage) — aucun accès public direct
--    n'est nécessaire.
DROP POLICY IF EXISTS "Suppression documents" ON storage.objects;
DROP POLICY IF EXISTS "Update documents" ON storage.objects;
DROP POLICY IF EXISTS "Upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Lecture documents" ON storage.objects;

-- 2. Tables exposées sans RLS à l'API REST publique de Supabase (anon/authenticated),
--    dont creators.password (haché bcrypt, mais un hash exposé reste attaquable par
--    force brute hors-ligne). Vérifié : aucun client Supabase côté frontend, tout
--    accès légitime passe par le backend (service_role, qui ignore RLS) — RLS sans
--    policy bloque l'accès public sans rien casser côté app.
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

-- 3. create_school_tables / drop_school_tables (SECURITY DEFINER) avaient EXECUTE
--    accordé à PUBLIC (donc hérité par anon ET authenticated) — n'importe qui
--    pouvait appeler /rest/v1/rpc/drop_school_tables sans authentification et
--    supprimer les tables d'une école en connaissant/devinant son slug.
--    service_role a son propre GRANT explicite, non affecté par ce REVOKE.
REVOKE EXECUTE ON FUNCTION public.create_school_tables(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.drop_school_tables(text) FROM PUBLIC;

-- 4. search_path mutable sur create_school_tables (drop_school_tables l'avait déjà).
ALTER FUNCTION public.create_school_tables(text) SET search_path = public;

-- 5. testimonials avait une policy publique d'INSERT avec with_check à `true` sans
--    aucune restriction — n'importe qui pouvait poser is_approved:true directement
--    via l'API REST de Supabase et publier un faux témoignage en contournant
--    entièrement la modération (POST /api/testimonials, server.js, force déjà
--    is_approved:false et n'est jamais utilisé par le frontend en direct).
--    admission_requests_insert_public : table non référencée nulle part dans le
--    code (backend ni frontend), 0 ligne — exposition publique inutile retirée,
--    table conservée intacte.
DROP POLICY IF EXISTS "Allow public insert on testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Allow public select on approved testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "admission_requests_insert_public" ON public.admission_requests;
