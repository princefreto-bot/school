-- ============================================================
-- Corrige une dérive de schéma : la colonne enseignant_id (ajoutée à
-- timetable_slots_{slug} pour les comptes enseignant individuels, voir
-- timetableController.js) avait été appliquée en direct sur les 5 écoles
-- existantes à l'époque SANS mettre à jour la fonction RPC
-- create_timetable_tables — toute école créée depuis (ex.
-- cselimkingdomacademy, 2026-08-03) recevait une table sans cette colonne,
-- provoquant un 500 sur GET /api/timetable/mine ("Mon Planning") pour tout
-- enseignant sur compte individuel. Corrigé le 2026-08-14 :
-- (1) colonne ajoutée à cselimkingdomacademy (seule école affectée),
-- (2) RPC create_timetable_tables mise à jour pour les futures écoles.
-- ============================================================
ALTER TABLE public.timetable_slots_cselimkingdomacademy
  ADD COLUMN IF NOT EXISTS enseignant_id UUID REFERENCES public.profiles_cselimkingdomacademy(id);

CREATE OR REPLACE FUNCTION public.create_timetable_tables(school_slug text)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.timetable_slots_%1$s (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            classe TEXT NOT NULL,
            matiere_id UUID REFERENCES public.matieres_%1$s(id) ON DELETE SET NULL,
            enseignant_nom TEXT,
            enseignant_id UUID REFERENCES public.profiles_%1$s(id),
            jour_semaine INT NOT NULL CHECK (jour_semaine BETWEEN 0 AND 6),
            heure_debut TIME NOT NULL,
            heure_fin TIME NOT NULL,
            salle TEXT,
            academic_year_id UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone(''utc''::text, now()),
            CHECK (heure_fin > heure_debut)
        )', school_slug);

    EXECUTE format('ALTER TABLE public.timetable_slots_%1$s ENABLE ROW LEVEL SECURITY', school_slug);
END;
$$;
