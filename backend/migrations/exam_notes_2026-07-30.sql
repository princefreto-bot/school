-- ============================================================
-- Notes d'examens (CEPD/BEPC/BAC) : sessions dédiées (ex. "Devoir
-- Blanc 1") indépendantes des trimestres/semestres habituels,
-- réservées aux classes d'examen national (CM2, 3ème, 1ère,
-- Terminale — voir src/utils/examEligibility.ts).
-- Appliqué le 2026-07-30 sur les 5 écoles existantes.
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
    EXECUTE format($f$
      CREATE TABLE IF NOT EXISTS public.%I (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        nom text NOT NULL, -- "Devoir Blanc 1", "Examen Final"...
        academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
        created_by uuid REFERENCES public.%I(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    $f$, 'exam_sessions_'||slug, 'profiles_'||slug);

    EXECUTE format($f$
      CREATE TABLE IF NOT EXISTS public.%I (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        eleve_id uuid NOT NULL REFERENCES public.%I(id) ON DELETE CASCADE,
        matiere_id uuid NOT NULL,
        exam_session_id uuid NOT NULL REFERENCES public.%I(id) ON DELETE CASCADE,
        note numeric(4,2), -- /20, nullable (absent à l'examen)
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (eleve_id, matiere_id, exam_session_id)
      )
    $f$, 'exam_notes_'||slug, 'students_'||slug, 'exam_sessions_'||slug);

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I (exam_session_id, eleve_id)',
      'idx_exam_notes_'||slug, 'exam_notes_'||slug
    );

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', 'exam_sessions_'||slug);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', 'exam_notes_'||slug);
  END LOOP;
END $$;
