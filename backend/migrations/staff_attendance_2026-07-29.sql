-- ============================================================
-- Scan enseignant : pointage entrée/sortie brut (une ligne par scan).
-- Alimente le calcul des heures manquées (comparaison avec
-- timetable_slots) — jamais écrit directement dans staff_absences.
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
    EXECUTE format($f$
      CREATE TABLE IF NOT EXISTS public.%I (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        personnel_id uuid NOT NULL REFERENCES public.%I(id) ON DELETE CASCADE,
        date date NOT NULL,
        type text NOT NULL, -- 'in' | 'out'
        heure time NOT NULL,
        scanned_by uuid REFERENCES public.%I(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    $f$, 'staff_attendance_'||slug, 'profiles_'||slug, 'profiles_'||slug);

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I (personnel_id, date)',
      'idx_staff_attendance_'||slug||'_personnel', 'staff_attendance_'||slug
    );

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', 'staff_attendance_'||slug);
  END LOOP;
END $$;
