-- ============================================================
-- Dépenses ponctuelles liées à un élève précis (ex: Maillots, Excursion) —
-- distinctes des dépenses de l'établissement (Comptabilité) : ce sont des
-- montants dus PAR le parent, liés à UN élève, jamais mélangés à l'écolage
-- ou aux frais d'inscription, et jamais comptés dans le score de priorité
-- du module Recouvrement. Appliqué le 2026-08-16 sur les 6 écoles
-- existantes + create_school_tables mise à jour pour les futures écoles.
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
    -- Catalogue de libellés réutilisables (Maillots, Excursion, Fournitures...)
    EXECUTE format($f$
      CREATE TABLE IF NOT EXISTS public.%I (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (name)
      )
    $f$, 'expense_labels_'||slug);

    EXECUTE format($f$
      CREATE TABLE IF NOT EXISTS public.%I (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id uuid NOT NULL REFERENCES public.%I(id) ON DELETE CASCADE,
        label_id uuid REFERENCES public.%I(id) ON DELETE SET NULL,
        label text NOT NULL, -- copie figée au moment de l'ajout
        amount numeric NOT NULL CHECK (amount > 0),
        amount_paid numeric NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
        academic_year_id uuid,
        created_by text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    $f$, 'student_expenses_'||slug, 'students_'||slug, 'expense_labels_'||slug);

    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (student_id)', 'idx_student_expenses_'||slug, 'student_expenses_'||slug);

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', 'expense_labels_'||slug);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', 'student_expenses_'||slug);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'expense_labels_'||slug||'_service_only', 'expense_labels_'||slug);
    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR ALL USING (auth.role() = 'service_role')$f$, 'expense_labels_'||slug||'_service_only', 'expense_labels_'||slug);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'student_expenses_'||slug||'_service_only', 'student_expenses_'||slug);
    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR ALL USING (auth.role() = 'service_role')$f$, 'student_expenses_'||slug||'_service_only', 'student_expenses_'||slug);
  END LOOP;
END $$;
