-- ============================================================
-- Portail personnel : lien professeur/enseignant -> fiche personnel
-- (professeur_id / enseignant_id), en plus du texte libre existant
-- (professeur / enseignant_nom, conservé comme repli pour les
-- lignes historiques).
-- Appliqué le 2026-07-29 sur les 5 écoles existantes (colonnes nullables).
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
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS professeur_id uuid REFERENCES public.%I(id) ON DELETE SET NULL',
      'classe_matieres_'||slug, 'profiles_'||slug
    );
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS enseignant_id uuid REFERENCES public.%I(id) ON DELETE SET NULL',
      'timetable_slots_'||slug, 'profiles_'||slug
    );
  END LOOP;
END $$;
