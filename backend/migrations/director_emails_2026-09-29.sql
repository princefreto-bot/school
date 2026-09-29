-- ============================================================
-- E-mails directeurs — campagnes envoyees par le proprietaire SaaS
-- (nouveautes, incidents/maintenance, guides, relances) via Resend.
-- Destinataires : schools.email des etablissements actifs et verifies,
-- sauf ceux qui se sont desabonnes (schools.email_updates_opt_out).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.platform_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('update', 'incident', 'guide', 'reminder')),
  subject text NOT NULL,
  content jsonb NOT NULL,          -- { title, intro, highlights[], body, ctaLabel, ctaUrl }
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'auto', 'release')),
  auto_key text,                   -- cle du guide automatique envoye (rotation)
  recipients_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_emails_sent_at_idx ON public.platform_emails (sent_at DESC);

ALTER TABLE public.platform_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_emails_service_only ON public.platform_emails;
CREATE POLICY platform_emails_service_only ON public.platform_emails
  FOR ALL USING (auth.role() = 'service_role');

-- Desabonnement (lien en pied de chaque e-mail). Les e-mails d'incident
-- critique restent envoyes : ils concernent le service souscrit.
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS email_updates_opt_out boolean NOT NULL DEFAULT false;
-- E-mail de bienvenue deja envoye (evite les doublons au renvoi de code, etc.)
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS welcome_email_sent_at timestamptz;
