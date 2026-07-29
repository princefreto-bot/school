-- ============================================================
-- Numérisation de documents personnel (contrat, diplôme, pièce
-- d'identité, carte CNSS...). Table par école, cohérente avec le
-- reste du portail personnel construit cette session (contrairement
-- à student_documents, table partagée plus ancienne).
-- Appliqué le 2026-07-29 sur les 5 écoles existantes.
--
-- Bucket Supabase Storage `staff-documents` créé séparément (privé,
-- 10 Mo max) :
--   INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
--   VALUES ('staff-documents', 'staff-documents', false, 10485760, NULL)
--   ON CONFLICT (id) DO NOTHING;
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
        document_type text NOT NULL, -- 'contract' | 'diploma' | 'id_card' | 'cnss_card' | 'other'
        title text NOT NULL,
        file_url text NOT NULL,
        uploaded_by uuid REFERENCES public.%I(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    $f$, 'personnel_documents_'||slug, 'profiles_'||slug, 'profiles_'||slug);

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I (personnel_id)',
      'idx_personnel_documents_'||slug||'_personnel', 'personnel_documents_'||slug
    );

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', 'personnel_documents_'||slug);
  END LOOP;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('staff-documents', 'staff-documents', false, 10485760, NULL)
ON CONFLICT (id) DO NOTHING;
