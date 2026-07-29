-- ============================================================
-- Portail personnel : présence / absences du personnel (saisie
-- manuelle admin/secrétaire, pas de scan — infrastructure QR
-- prévue pour un chantier futur).
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
        type text NOT NULL DEFAULT 'absence', -- 'absence' | 'retard' | 'conge'
        heures_manquees numeric(5,2),
        motif text,
        saisi_par uuid REFERENCES public.%I(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    $f$, 'staff_absences_'||slug, 'profiles_'||slug, 'profiles_'||slug);

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I (personnel_id, date)',
      'idx_staff_absences_'||slug||'_personnel', 'staff_absences_'||slug
    );

    -- RLS activée sans policy = default-deny côté API publique PostgREST (anon/authenticated).
    -- Le backend (service_role) contourne RLS et reste la seule voie d'accès légitime.
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', 'staff_absences_'||slug);
  END LOOP;
END $$;
