-- ============================================================
-- Remplacement de Chariow par SasPay pour le paiement de licence parent.
-- Nouvelle table de sessions de paiement EN ATTENTE de confirmation webhook —
-- license_payments_{slug} garde son rôle de journal des paiements CONFIRMÉS
-- uniquement (une ligne y est insérée seulement après confirmation SasPay,
-- jamais à la création de la session). Appliqué le 2026-08-16 sur les 6
-- écoles existantes + create_license_payments_table mise à jour pour que
-- toute future école la reçoive automatiquement.
--
-- Note : license_payments_{slug}.license_key (NOT NULL UNIQUE, hérité de
-- Chariow) est réutilisé comme référence externe générique — on y stocke
-- désormais l'id de transaction SasPay au lieu d'une clé Chariow. Pas de
-- changement de schéma nécessaire sur cette table.
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
    EXECUTE format($f$
      CREATE TABLE IF NOT EXISTS public.%I (
        id text PRIMARY KEY, -- id de la session SasPay (checkout-sessions), pas un uuid genere ici
        student_id uuid NOT NULL REFERENCES public.%I(id) ON DELETE CASCADE,
        parent_id uuid NOT NULL,
        academic_year_id uuid,
        amount integer NOT NULL CHECK (amount > 0),
        tranche_number integer NOT NULL CHECK (tranche_number BETWEEN 0 AND 3),
        status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'failed')),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    $f$, 'license_checkout_sessions_'||slug, 'students_'||slug);

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I (student_id, status)',
      'idx_license_checkout_sessions_'||slug, 'license_checkout_sessions_'||slug
    );

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', 'license_checkout_sessions_'||slug);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'license_checkout_sessions_'||slug||'_service_only', 'license_checkout_sessions_'||slug);
    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR ALL USING (auth.role() = 'service_role')$f$, 'license_checkout_sessions_'||slug||'_service_only', 'license_checkout_sessions_'||slug);
  END LOOP;
END $$;
