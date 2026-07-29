-- ============================================================
-- Scan enseignant : heures mensuelles standard (pour convertir les
-- heures manquées en montant de retenue sur salaire).
-- Réglage par école, PAS un taux légal national (contrairement à
-- payroll_tax_config) — appartient donc à app_settings_<école>.
-- Appliqué le 2026-07-29 sur les 5 écoles existantes.
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
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS heures_mensuelles_standard numeric(6,2)', 'app_settings_'||slug);
  END LOOP;
END $$;
