-- ============================================================
-- Tranches de paiement et frais d'inscription scindes PAR ANNEE SCOLAIRE.
-- Avant cette migration, ces deux reglages vivaient dans app_settings_{slug}
-- (une seule ligne par ecole, partagee par TOUTES les annees) -- une ecole
-- qui changeait d'annee scolaire retrouvait donc les memes tranches/frais
-- d'inscription que l'annee precedente, alors qu'ils doivent logiquement
-- redemarrer vierges chaque annee (avec une option de copie explicite cote
-- frontend, jamais automatique -- voir Parametres > Tranches / Frais d'inscription).
--
-- Applique le 2026-09-22 sur les 7 ecoles existantes + create_school_tables
-- RPC mise a jour pour que toute future ecole recoive directement cette table
-- (voir migration create_school_tables_add_year_settings, appliquee dans la
-- meme session -- non versionnee ici car c'est une fonction RPC qui vit
-- uniquement dans Supabase, pas de DDL versionne ailleurs, meme convention
-- que update_create_school_tables_rpc_2026-08-13.sql).
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
    'csyzomacamb',
    'itcsdinogolo'
  ];
BEGIN
  FOREACH slug IN ARRAY slugs LOOP
    EXECUTE format($f$
      CREATE TABLE IF NOT EXISTS public.%I (
        academic_year_id uuid PRIMARY KEY REFERENCES public.academic_years(id) ON DELETE CASCADE,
        tranches jsonb NOT NULL DEFAULT '[]'::jsonb,
        class_registration_fees jsonb NOT NULL DEFAULT '{}'::jsonb,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    $f$, 'year_settings_'||slug);

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', 'year_settings_'||slug);

    -- Service_role uniquement (audit securite 2026-08-19) : le frontend ne parle jamais
    -- directement a Supabase, seul le backend (cle service_role, bypass RLS) y accede.
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'year_settings_'||slug||'_write_service', 'year_settings_'||slug);
    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR ALL USING (auth.role() = 'service_role')$f$, 'year_settings_'||slug||'_write_service', 'year_settings_'||slug);
  END LOOP;
END $$;

-- Report ponctuel : les 2 ecoles ayant deja configure tranches/frais
-- d'inscription (valeurs non vides dans app_settings) les retrouvent sur
-- leur annee scolaire ACTUELLE uniquement -- les colonnes app_settings
-- d'origine ne sont plus lues par le backend a partir de ce deploiement
-- mais restent en place (aucune donnee effacee).
INSERT INTO public.year_settings_csyzomacamb (academic_year_id, tranches, class_registration_fees)
SELECT ay.id, s.tranches, s.class_registration_fees
FROM public.app_settings_csyzomacamb s
JOIN public.academic_years ay ON ay.school_slug = 'csyzomacamb' AND ay.is_current = true
ON CONFLICT (academic_year_id) DO NOTHING;

INSERT INTO public.year_settings_itcsdinogolo (academic_year_id, tranches, class_registration_fees)
SELECT ay.id, s.tranches, s.class_registration_fees
FROM public.app_settings_itcsdinogolo s
JOIN public.academic_years ay ON ay.school_slug = 'itcsdinogolo' AND ay.is_current = true
ON CONFLICT (academic_year_id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
