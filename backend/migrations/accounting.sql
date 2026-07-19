-- Migration pour la comptabilité en partie double par école.
-- Pas de RLS (cohérent avec le reste du schéma) : l'autorisation est gérée
-- entièrement par le backend Express (middleware + clé service_role).

CREATE OR REPLACE FUNCTION public.create_accounting_tables(school_slug text)
RETURNS void AS $$
BEGIN
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.chart_of_accounts_%1$s (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            code TEXT NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN (''actif'',''passif'',''capitaux_propres'',''produit'',''charge'')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone(''utc''::text, now())
        )', school_slug);

    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.journal_entries_%1$s (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            date DATE NOT NULL DEFAULT CURRENT_DATE,
            reference TEXT,
            description TEXT NOT NULL,
            proof_url TEXT,
            created_by UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone(''utc''::text, now())
        )', school_slug);

    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.journal_entry_lines_%1$s (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            entry_id UUID NOT NULL REFERENCES public.journal_entries_%1$s(id) ON DELETE CASCADE,
            account_id UUID NOT NULL REFERENCES public.chart_of_accounts_%1$s(id),
            debit DECIMAL NOT NULL DEFAULT 0,
            credit DECIMAL NOT NULL DEFAULT 0
        )', school_slug);

    -- Plan comptable simplifié par défaut (inspiré OHADA), seedé une seule fois.
    EXECUTE format('
        INSERT INTO public.chart_of_accounts_%1$s (code, name, type)
        SELECT * FROM (VALUES
            (''101'', ''Capital'', ''capitaux_propres''),
            (''411'', ''Créances élèves'', ''actif''),
            (''521'', ''Banque'', ''actif''),
            (''571'', ''Caisse'', ''actif''),
            (''401'', ''Dettes fournisseurs'', ''passif''),
            (''706'', ''Produits de scolarité'', ''produit''),
            (''758'', ''Autres produits'', ''produit''),
            (''641'', ''Charges de personnel'', ''charge''),
            (''606'', ''Fournitures'', ''charge''),
            (''613'', ''Loyers et charges locatives'', ''charge''),
            (''626'', ''Télécommunications'', ''charge''),
            (''628'', ''Charges diverses'', ''charge'')
        ) AS v(code, name, type)
        WHERE NOT EXISTS (SELECT 1 FROM public.chart_of_accounts_%1$s LIMIT 1)
    ', school_slug);
END;
$$ LANGUAGE plpgsql;

-- Provisionne les tables comptables pour toutes les écoles déjà existantes.
-- (Les nouvelles écoles créées après cette migration sont provisionnées
-- automatiquement par le backend, voir authController.js/superAdminController.js.)
DO $$
DECLARE
    s RECORD;
BEGIN
    FOR s IN SELECT slug FROM public.schools LOOP
        PERFORM public.create_accounting_tables(s.slug);
    END LOOP;
END $$;
