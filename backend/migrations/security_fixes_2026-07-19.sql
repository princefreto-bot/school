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

-- ============================================================
-- Suite (2026-07-20) : audit de sécurité final couvrant les Phases 0-4
-- (sauvegardes, comptabilité, paie, emploi du temps, rappels automatiques).
-- Migrations réelles : revoke_execute_from_public_on_phase1to4_functions,
-- revoke_execute_from_anon_authenticated_phase1to4_functions.
--
-- Les fonctions create_accounting_tables / create_payroll_tables /
-- create_timetable_tables / create_reminder_tables / ensure_reminder_settings_columns
-- avaient EXECUTE accordé à PUBLIC *et* explicitement à anon/authenticated
-- (comportement par défaut de Supabase sur les nouvelles fonctions du schéma
-- public) — contrairement à create_school_tables/drop_school_tables, corrigées
-- le 2026-07-19. Risque réel faible (fonctions SECURITY INVOKER, et anon/
-- authenticated n'ont que USAGE, pas CREATE, sur le schéma public — un appel RPC
-- direct aurait échoué avec une erreur de permission), mais corrigé par cohérence
-- avec le reste du schéma. Aucun impact fonctionnel : le backend appelle toujours
-- ces fonctions via service_role, qui conserve l'accès.
REVOKE EXECUTE ON FUNCTION public.create_accounting_tables(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_payroll_tables(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_timetable_tables(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_reminder_tables(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_reminder_settings_columns(text) FROM PUBLIC, anon, authenticated;

-- ⚠️ Trouvé mais PAS corrigé (nécessite confirmation, touche des documents
-- financiers réels — retraits/ristournes et dépenses école) : les buckets Storage
-- "expense-proofs" et "withdrawal-proofs" sont publics (public=true), et le
-- backend renvoie leur URL publique brute (getPublicUrl) affichée telle quelle
-- dans Retraits.tsx / Comptabilite.tsx. N'importe qui connaissant/devinant le
-- chemin exact ({schoolSlug}/{timestamp_ms}.{ext}) peut lire ces justificatifs
-- sans authentification — school_slug n'est pas secret, et l'horodatage en
-- millisecondes est bruteforçable sur une fenêtre de temps plausible (aucune
-- limitation de débit sur l'endpoint public Storage de Supabase). Comparer au
-- bucket "school-backups" (Phase 0), correctement privé + URLs signées
-- (backupController.js). Correctif proposé, en attente de validation utilisateur
-- avant application (changement de bucket + migration des URLs déjà stockées) :
--   1. ALTER bucket expense-proofs / withdrawal-proofs → public = false
--   2. accountingController.js / withdrawalController.js : remplacer
--      getPublicUrl() par createSignedUrl() généré à la demande (comme
--      backupController.js), et stocker le storage path plutôt que l'URL
--      publique pour les nouveaux justificatifs.
--   3. Frontend (Retraits.tsx, Comptabilite.tsx) : demander une URL signée à
--      l'affichage au lieu d'utiliser l'URL stockée directement.
--   4. Justificatifs déjà uploadés : leurs URLs publiques resteront valides tant
--      que le bucket est public ; il faut soit les re-uploader dans un nouveau
--      chemin privé, soit accepter qu'elles restent accessibles à l'ancienne URL.

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
