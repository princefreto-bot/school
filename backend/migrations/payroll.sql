-- Migration pour la paie du personnel (Phase 2, plan de parité Scolapp).
-- Appliquée en direct via le MCP Supabase le 2026-07-19 — ce fichier documente
-- ce qui a été fait, l'historique réel est dans mcp__supabase__list_migrations :
--   - create_payroll_tax_config_and_tables (échouée, roll-back complet)
--   - create_payroll_tables_function_gen_random_uuid (échouée sur profiles_csahomegbale)
--   - create_payroll_tables_defensive_backfill (échouée, fonction pas encore commitée)
--   - create_payroll_tables_function_and_defensive_backfill (réussie)
--   - create_payroll_tax_config (réussie)
--   - fix_create_accounting_tables_uuid_function (corrige un bug latent identique
--     découvert au passage dans la Phase 1 — jamais exercé en prod car aucune
--     nouvelle école n'avait encore été créée depuis ce correctif)
--
-- ⚠️ Taux légaux togolais stockés dans payroll_tax_config (modifiables, jamais en
-- dur dans le code) — sourcés par recherche web, à confirmer avec un expert-
-- comptable avant usage réel : CNSS (Décret loi sécu sociale, cnss.tg) 17,5%
-- employeur + 4% salarié ; AMU (Décret N°2023-096/PR du 04/10/2023, CNSS/INAM)
-- 5% employeur + 5% salarié ; IRPP barème 2026 à 8 tranches (art. 74 CGI),
-- abattement 28% plafonné à 10M FCFA/an, déduction 10 000 FCFA/mois/personne à
-- charge (max 6). Moteur de calcul vérifié au FCFA près contre un exemple
-- sourcé (salaire 300 000 FCFA/mois, 3 personnes à charge → IRPP annuel
-- 32 940 FCFA).
--
-- Piège rencontré : gen_random_uuid() (pg_catalog, toujours résolu) doit être
-- utilisé à la place de uuid_generate_v4() (schéma extensions) dans toute
-- fonction avec SET search_path = public — sinon la création de table échoue
-- au premier appel pour une vraie nouvelle école.
--
-- Autre trouvaille : l'école "csahomegbale" a une ligne dans public.schools
-- mais profiles_csahomegbale n'existe pas (provisionnement jamais terminé) —
-- ignorée par la boucle de backfill (to_regclass check), à investiguer
-- séparément si cette école doit être utilisable.

CREATE TABLE IF NOT EXISTS public.payroll_tax_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    cnss_employer_rate DECIMAL NOT NULL DEFAULT 17.5,
    cnss_employee_rate DECIMAL NOT NULL DEFAULT 4,
    amu_employer_rate DECIMAL NOT NULL DEFAULT 5,
    amu_employee_rate DECIMAL NOT NULL DEFAULT 5,
    irpp_brackets JSONB NOT NULL DEFAULT '[
        {"min": 0, "max": 900000, "rate": 0},
        {"min": 900000, "max": 3000000, "rate": 3},
        {"min": 3000000, "max": 6000000, "rate": 10},
        {"min": 6000000, "max": 9000000, "rate": 15},
        {"min": 9000000, "max": 12000000, "rate": 20},
        {"min": 12000000, "max": 15000000, "rate": 25},
        {"min": 15000000, "max": 20000000, "rate": 30},
        {"min": 20000000, "max": null, "rate": 35}
    ]'::jsonb,
    allowance_rate DECIMAL NOT NULL DEFAULT 28,
    allowance_cap DECIMAL NOT NULL DEFAULT 10000000,
    dependent_deduction_monthly DECIMAL NOT NULL DEFAULT 10000,
    max_dependents INT NOT NULL DEFAULT 6,
    source_note TEXT DEFAULT 'Taux de référence (recherche web, à confirmer avec un expert-comptable). CNSS/AMU : Décret N°2023-096/PR (04/10/2023). IRPP : barème 2026, art. 74 CGI.',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
INSERT INTO public.payroll_tax_config (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.payroll_tax_config ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.create_payroll_tables(school_slug text)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.staff_salaries_%1$s (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            personnel_id UUID NOT NULL REFERENCES public.profiles_%1$s(id) ON DELETE CASCADE,
            salaire_base DECIMAL NOT NULL,
            date_effet DATE NOT NULL DEFAULT CURRENT_DATE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone(''utc''::text, now())
        )', school_slug);

    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.payslips_%1$s (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            personnel_id UUID NOT NULL REFERENCES public.profiles_%1$s(id) ON DELETE CASCADE,
            periode TEXT NOT NULL,
            salaire_base DECIMAL NOT NULL,
            primes JSONB NOT NULL DEFAULT ''[]''::jsonb,
            retenues JSONB NOT NULL DEFAULT ''[]''::jsonb,
            personnes_a_charge INT NOT NULL DEFAULT 0,
            cnss_salarial DECIMAL NOT NULL,
            cnss_patronal DECIMAL NOT NULL,
            amu_salarial DECIMAL NOT NULL,
            amu_patronal DECIMAL NOT NULL,
            irpp DECIMAL NOT NULL,
            net_a_payer DECIMAL NOT NULL,
            statut TEXT NOT NULL DEFAULT ''finalise'',
            created_by UUID,
            generated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone(''utc''::text, now()),
            UNIQUE(personnel_id, periode)
        )', school_slug);

    EXECUTE format('ALTER TABLE public.staff_salaries_%1$s ENABLE ROW LEVEL SECURITY', school_slug);
    EXECUTE format('ALTER TABLE public.payslips_%1$s ENABLE ROW LEVEL SECURITY', school_slug);
END;
$$;

-- Provisionne les écoles existantes, en ignorant celles dont profiles_<slug>
-- n'existe pas (provisionnement de base incomplet — voir csahomegbale ci-dessus).
DO $$
DECLARE
    s RECORD;
BEGIN
    FOR s IN SELECT slug FROM public.schools LOOP
        IF to_regclass('public.profiles_' || s.slug) IS NOT NULL THEN
            PERFORM public.create_payroll_tables(s.slug);
        ELSE
            RAISE NOTICE 'École % ignorée : profiles_% introuvable (provisionnement incomplet)', s.slug, s.slug;
        END IF;
    END LOOP;
END $$;
