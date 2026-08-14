-- ============================================================
-- Statut de l'élève (NOUVEAU / ANCIEN / REDOUBLANT) — champ déjà présent côté
-- TypeScript (types/index.ts) mais jamais persisté en base jusqu'ici. Devient le
-- garde-fou qui décide si un élève doit les frais d'inscription : seul un élève
-- NOUVEAU les doit, jamais un ancien ou un redoublant (déjà inscrits les années
-- précédentes). Appliqué le 2026-08-14 sur les 6 écoles existantes.
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
    'cselimkingdomacademy',
    'cslavictoire',
    'cslumenchristi',
    'csyzomacamb'
  ];
BEGIN
  FOREACH slug IN ARRAY slugs LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS statut_elv text', 'students_'||slug);
  END LOOP;
END $$;
