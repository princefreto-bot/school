-- Migration pour le système de retraits des écoles
-- Toute l'autorisation est déjà gérée par le backend (middleware Express +
-- clé service_role) ; pas de RLS ici, cohérent avec le reste des tables du projet.
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
