-- Migrations pour le système de retraits des écoles
CREATE TABLE IF NOT EXISTS public.school_withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_slug TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    proof_image_url TEXT, -- Capture d'écran du paiement (stockée via Supabase Storage)
    admin_proof_image_url TEXT, -- Capture d'écran du dépôt par le SuperAdmin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Sécurité RLS
ALTER TABLE public.school_withdrawals ENABLE ROW LEVEL SECURITY;

-- Les écoles peuvent voir leurs propres demandes
CREATE POLICY "Schools can view their own withdrawals"
    ON public.school_withdrawals FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM public.profiles WHERE role = 'school_admin' AND school_slug = school_withdrawals.school_slug
    ));

-- Les écoles peuvent créer des demandes
CREATE POLICY "Schools can insert their own withdrawals"
    ON public.school_withdrawals FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT id FROM public.profiles WHERE role = 'school_admin' AND school_slug = school_withdrawals.school_slug
    ));

-- Les super admins peuvent tout faire
CREATE POLICY "SuperAdmins can do everything on withdrawals"
    ON public.school_withdrawals FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.profiles WHERE role = 'superadmin'
    ));
