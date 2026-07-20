-- Correctifs de performance appliqués directement via le MCP Supabase
-- (execute_sql / apply_migration) le 2026-07-20, suite à un audit
-- `get_advisors(type: "performance")` — jamais vérifié jusque-là cette session
-- (seule la sécurité l'avait été). Ce fichier est une trace pour le dépôt — les
-- migrations réelles sont déjà appliquées en base :
--   - add_indexes_for_unindexed_foreign_keys
--   - fix_auth_rls_initplan_wrap_service_role_check

-- 1. 103 clés étrangères sans index de couverture, sur toutes les tables
--    dynamiques par école (notes_*, payments_*, presences_*, journal_entry_lines_*,
--    classe_matieres_*, etc.) et quelques tables globales (admission_requests,
--    creator_schools). Impact réel : la quasi-totalité de ces FK ont
--    `ON DELETE CASCADE` — sans index, chaque suppression d'une ligne parente
--    (ex. suppression d'une année académique, d'un élève) force un scan complet
--    de la table enfant pour trouver les lignes à supprimer en cascade. Impact
--    aussi sur les jointures/filtres déjà utilisés cette session (ex.
--    `notes_*` filtrées par `matiere_id` dans computeSubjectAcademicStats,
--    `journal_entry_lines_*` filtrées par `account_id`/`entry_id` dans
--    accountingController). Généré et vérifié en direct via une requête sur
--    pg_constraint/pg_index (bien plus fiable que de retranscrire les 103
--    entrées de l'advisor à la main) — 0 clé étrangère restante sans index
--    après application.
DO $$
DECLARE
    r RECORD;
    idx_name TEXT;
BEGIN
    FOR r IN
        SELECT
            c.conrelid::regclass::text AS table_name,
            c.conname AS constraint_name,
            (
                SELECT string_agg(quote_ident(a.attname), ', ' ORDER BY x.n)
                FROM unnest(c.conkey) WITH ORDINALITY AS x(attnum, n)
                JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = x.attnum
            ) AS columns
        FROM pg_constraint c
        WHERE c.contype = 'f'
          AND c.connamespace = 'public'::regnamespace
          AND NOT EXISTS (
            SELECT 1 FROM pg_index i
            WHERE i.indrelid = c.conrelid
              AND (c.conkey <@ i.indkey::smallint[])
              AND i.indkey::smallint[] IS NOT NULL
          )
    LOOP
        idx_name := 'idx_' || r.constraint_name;
        IF length(idx_name) > 63 THEN
            idx_name := 'idx_' || md5(r.constraint_name);
        END IF;
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (%s)', idx_name, r.table_name, r.columns);
    END LOOP;
END $$;

-- 2. 76 policies RLS (toutes identiques : `auth.role() = 'service_role'`, sur les
--    tables les plus anciennes du projet — presences_*, activity_logs_*,
--    announcements_*, app_settings_*, matieres_*, notes_*, parent_student_*,
--    conversations/messages legacy...) qui ré-évaluaient `auth.role()` à
--    CHAQUE LIGNE au lieu d'une seule fois par requête. Contrairement à
--    l'hypothèse initiale ("RLS jamais évaluée puisque le backend utilise
--    toujours service_role donc ça ne coûte rien en pratique"), ces policies
--    CIBLENT justement service_role — donc chaque requête du backend contre
--    ces tables évaluait bien la policy, ligne par ligne. Corrigé en
--    enveloppant l'appel dans un sous-select (`(select auth.role())`), pattern
--    documenté par Supabase — Postgres met alors le résultat en cache via un
--    InitPlan au lieu de le recalculer par ligne. Aucun changement de
--    comportement/sécurité : même résultat booléen, juste évalué une fois.
--    Vérifié : 0 policy avec l'ancienne forme non enveloppée après coup, et
--    lecture testée en direct sur presences_csyzomacamb (22 lignes, comptage OK).
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND qual = '(auth.role() = ''service_role''::text)'
    LOOP
        EXECUTE format(
            'ALTER POLICY %I ON %I.%I USING ((select auth.role()) = ''service_role''::text)',
            r.policyname, r.schemaname, r.tablename
        );
    END LOOP;
END $$;

-- Non corrigé (impact réel négligeable, pas un bug) : 96 findings "Multiple
-- Permissive Policies" sur les tables app_settings_* (deux policies légitimes
-- coexistent : lecture publique + écriture service_role uniquement) — tables
-- à une seule ligne, coût quasi nul, et fusionner les deux policies changerait
-- potentiellement leur intention (lecture publique) sans certitude sur le
-- besoin réel. Laissé tel quel plutôt que deviné.
