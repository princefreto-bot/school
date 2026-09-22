-- ============================================================
-- Notice plateforme — message/image du proprietaire SaaS (superadmin)
-- affiche a la connexion des comptes etablissement (admin/directeur/
-- directeur_general/comptable), jamais aux enseignants ni aux parents.
-- Une seule ligne active a la fois (id fixe 'current'), remplacee a
-- chaque publication -- pas d'historique necessaire pour ce cas d'usage.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.platform_notices (
  id text PRIMARY KEY DEFAULT 'current',
  title text,
  message text,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_notices_service_only ON public.platform_notices;
CREATE POLICY platform_notices_service_only ON public.platform_notices
  FOR ALL USING (auth.role() = 'service_role');
