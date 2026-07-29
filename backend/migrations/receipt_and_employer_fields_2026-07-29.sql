-- ============================================================
-- Reçu de paiement premium : réduction par paiement + champs
-- légaux établissement (site web, N° d'autorisation).
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
    -- Paiement : réduction accordée + mode + référence (mode/référence n'étaient pas persistés)
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS reduction numeric DEFAULT 0', 'payments_'||slug);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS mode text',       'payments_'||slug);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS reference text',  'payments_'||slug);

    -- Établissement : site web + N° d'autorisation (affichés sur le reçu)
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS school_website text',      'app_settings_'||slug);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS school_autorisation text', 'app_settings_'||slug);
  END LOOP;
END $$;
