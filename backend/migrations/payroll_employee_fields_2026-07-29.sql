-- ============================================================
-- Bulletins de paie : champs d'identité salarié + champs légaux établissement
-- Appliqué le 2026-07-29 sur les 5 écoles existantes (colonnes nullables).
--
-- Pour toute NOUVELLE école, exécuter ce bloc en remplaçant la liste `slugs`
-- par le slug concerné (ou l'ajouter au tableau).
-- ============================================================
DO $$
DECLARE
  slug text;
  slugs text[] := ARRAY[
    'complexescolairebaptistejesussauve',
    'cpllalumieresanitaattitogon',
    'cslavictoire',
    'cslumenchristi',
    'csyzomacamb'
  ];
BEGIN
  FOREACH slug IN ARRAY slugs LOOP
    -- Fiche personnel : infos de paie du salarié
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS matricule text',        'profiles_'||slug);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS numero_cnss text',       'profiles_'||slug);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS date_embauche date',      'profiles_'||slug);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS mode_paiement text',      'profiles_'||slug);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS compte_bancaire text',    'profiles_'||slug);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS departement text',        'profiles_'||slug);

    -- Paramètres établissement : champs légaux du bulletin
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS school_ifu text',   'app_settings_'||slug);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS school_rccm text',  'app_settings_'||slug);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS school_nif text',   'app_settings_'||slug);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS school_email text', 'app_settings_'||slug);

    -- Bulletin : snapshot des infos salarié figées à la génération
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS matricule text',      'payslips_'||slug);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS numero_cnss text',    'payslips_'||slug);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS date_embauche date',   'payslips_'||slug);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS mode_paiement text',   'payslips_'||slug);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS compte_bancaire text', 'payslips_'||slug);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS departement text',     'payslips_'||slug);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS fonction text',        'payslips_'||slug);
  END LOOP;
END $$;
