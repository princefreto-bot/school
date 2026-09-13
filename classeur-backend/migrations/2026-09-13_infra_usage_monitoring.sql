-- ============================================================
-- CLASSEUR — Suivi infrastructure & abonnements (M6)
-- Appliqué le 2026-09-13 sur le schéma `classeur` (même projet Supabase).
--
-- Snapshots quotidiens de la taille de la base + suivi manuel des
-- abonnements (Supabase, Render...) avec projections/alertes.
-- Aucun secret externe requis : la taille de la base est lue via
-- pg_database_size (service_role). Les coûts/quotas/dates de
-- renouvellement sont saisis manuellement par l'opérateur — l'API
-- Management de Supabase (jeton personnel, secret niveau compte) et
-- l'API Render pourront être branchées plus tard pour automatiser ces
-- valeurs, sans changer le schéma ci-dessous.
-- ============================================================

CREATE TABLE IF NOT EXISTS classeur.usage_snapshots (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    captured_on   date NOT NULL DEFAULT current_date UNIQUE,
    captured_at   timestamptz NOT NULL DEFAULT now(),
    db_size_bytes bigint NOT NULL,
    table_count   integer NOT NULL DEFAULT 0,
    person_count  integer NOT NULL DEFAULT 0,
    schema_breakdown jsonb NOT NULL DEFAULT '[]'::jsonb,
    top_tables    jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS classeur.subscriptions (
    id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    provider       text NOT NULL,
    label          text NOT NULL,
    monthly_cost   numeric(12,2),
    currency       text NOT NULL DEFAULT 'USD',
    billing_cycle  text NOT NULL DEFAULT 'monthly',
    renewal_date   date,
    quota_label    text,
    quota_limit_mb numeric(14,2),
    notes          text,
    is_active      boolean NOT NULL DEFAULT true,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION classeur.get_db_size_breakdown()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = classeur, public
AS $$
DECLARE
    v_db_size    bigint;
    v_table_count integer;
    v_schema     jsonb;
    v_top        jsonb;
BEGIN
    SELECT pg_database_size(current_database()) INTO v_db_size;

    SELECT count(*) INTO v_table_count
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r','p') AND n.nspname NOT IN ('pg_catalog','information_schema');

    SELECT coalesce(jsonb_agg(row_to_json(s)), '[]'::jsonb) INTO v_schema
    FROM (
        SELECT n.nspname AS schema,
               sum(pg_total_relation_size(c.oid))::bigint AS bytes
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind IN ('r','p')
          AND n.nspname NOT IN ('pg_catalog','information_schema','pg_toast')
        GROUP BY n.nspname
        ORDER BY bytes DESC
    ) s;

    SELECT coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_top
    FROM (
        SELECT n.nspname AS schema, c.relname AS table,
               pg_total_relation_size(c.oid)::bigint AS bytes
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind IN ('r','p')
          AND n.nspname NOT IN ('pg_catalog','information_schema','pg_toast')
        ORDER BY bytes DESC
        LIMIT 15
    ) t;

    RETURN jsonb_build_object(
        'db_size_bytes', v_db_size,
        'table_count', v_table_count,
        'schema_breakdown', v_schema,
        'top_tables', v_top,
        'captured_at', now()
    );
END;
$$;

CREATE OR REPLACE FUNCTION classeur.capture_usage_snapshot()
RETURNS classeur.usage_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = classeur, public
AS $$
DECLARE
    v_break  jsonb;
    v_persons integer;
    v_row    classeur.usage_snapshots;
BEGIN
    v_break := classeur.get_db_size_breakdown();
    SELECT count(*) INTO v_persons FROM classeur.persons WHERE status = 'active';

    INSERT INTO classeur.usage_snapshots
        (captured_on, captured_at, db_size_bytes, table_count, person_count, schema_breakdown, top_tables)
    VALUES (
        current_date, now(),
        (v_break->>'db_size_bytes')::bigint,
        (v_break->>'table_count')::integer,
        v_persons,
        v_break->'schema_breakdown',
        v_break->'top_tables'
    )
    ON CONFLICT (captured_on) DO UPDATE SET
        captured_at = excluded.captured_at,
        db_size_bytes = excluded.db_size_bytes,
        table_count = excluded.table_count,
        person_count = excluded.person_count,
        schema_breakdown = excluded.schema_breakdown,
        top_tables = excluded.top_tables
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

ALTER TABLE classeur.usage_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE classeur.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS usage_snapshots_service ON classeur.usage_snapshots;
DROP POLICY IF EXISTS subscriptions_service ON classeur.subscriptions;
CREATE POLICY usage_snapshots_service ON classeur.usage_snapshots FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY subscriptions_service ON classeur.subscriptions FOR ALL USING (auth.role() = 'service_role');

SELECT classeur.capture_usage_snapshot();
NOTIFY pgrst, 'reload schema';
