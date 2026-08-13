-- ============================================================
-- Frais d'inscription : piste de paiement distincte de l'écolage,
-- avec tarif variable par classe/cycle (mirroring class_fees).
-- Appliqué le 2026-08-13 sur les 6 écoles existantes (colonnes nullables
-- avec défaut 0, jamais de recalcul rétroactif automatique).
--
-- Pour toute NOUVELLE école, exécuter ce bloc en remplaçant la liste `slugs`
-- par le slug concerné (ou l'ajouter au tableau) — ou mettre à jour la
-- fonction RPC `create_school_tables` / `create_accounting_tables` côté
-- Supabase pour que les nouvelles écoles héritent directement de ces colonnes.
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
    -- Élève : montant dû / payé / restant sur la piste inscription, jamais mélangé
    -- avec ecolage/deja_paye/restant.
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS frais_inscription numeric DEFAULT 0',  'students_'||slug);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS inscription_paye numeric DEFAULT 0',   'students_'||slug);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS inscription_restant numeric DEFAULT 0','students_'||slug);

    -- Paiement : type de versement (absent = 'ecolage', tout l'historique existant est de l'écolage)
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS type text DEFAULT ''ecolage''', 'payments_'||slug);

    -- Paramètres : tarifs personnalisés par classe pour les frais d'inscription
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS class_registration_fees jsonb DEFAULT ''{}''::jsonb', 'app_settings_'||slug);

    -- Plan comptable : compte produit dédié (705), séparé de 706 (Produits de scolarité).
    -- Idempotent : n'insère que si absent (les écoles déjà seedées n'ont pas ce compte).
    EXECUTE format(
      'INSERT INTO public.%I (code, name, type) SELECT ''705'', ''Frais d''''inscription'', ''produit'' WHERE NOT EXISTS (SELECT 1 FROM public.%I WHERE code = ''705'')',
      'chart_of_accounts_'||slug, 'chart_of_accounts_'||slug
    );
  END LOOP;
END $$;
