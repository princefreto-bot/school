-- ============================================================
-- Verso personnalisable des cartes scolaires — texte libre défini par
-- l'établissement dans Paramètres, affiché au dos de la carte élève
-- (recto = identité + QR, verso = texte personnalisé de l'école).
-- Appliqué le 2026-08-20 sur les 6 écoles existantes + RPC
-- create_school_tables() mise à jour pour toute nouvelle école.
--
-- Pour toute NOUVELLE école existante non listée ci-dessous, exécuter ce
-- bloc en remplaçant la liste `slugs` par le slug concerné (ou l'ajouter
-- au tableau) — les écoles créées après cette date reçoivent déjà la
-- colonne via la RPC create_school_tables.
-- ============================================================
DO $$
DECLARE
  slug text;
  slugs text[] := ARRAY[
    'complexescolairebaptistejesussauve',
    'cpllalumieresanitaattitogon',
    'cselimkingdomacademy',
    'cslavictoire',
    'cslumenchristi',
    'csyzomacamb'
  ];
BEGIN
  FOREACH slug IN ARRAY slugs LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS carte_verso_texte TEXT', 'app_settings_'||slug);
  END LOOP;
END $$;

-- La RPC create_school_tables() a été mise à jour séparément (patch textuel
-- ciblé sur le corps de la fonction, pour éviter de retaper les ~250 lignes
-- à la main) afin que le CREATE TABLE app_settings_<slug> inclue déjà
-- `carte_verso_texte TEXT` pour toute école créée après cette migration.
