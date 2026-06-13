-- ============================================================
-- SQL MIGRATION — Creators, Affiliations & Document Digitization
-- ============================================================

-- 1. Table des Créateurs de contenu (Influenceurs)
CREATE TABLE IF NOT EXISTS creators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom TEXT NOT NULL,
    telephone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour accélérer la recherche par téléphone lors de la connexion
CREATE INDEX IF NOT EXISTS idx_creators_telephone ON creators(telephone);

-- 2. Table de jointure Créateur - Écoles (Affiliations)
CREATE TABLE IF NOT EXISTS creator_schools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(creator_id, school_id)
);

-- 3. Table des Documents élèves numérisés (CamScanner style)
CREATE TABLE IF NOT EXISTS student_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_slug TEXT NOT NULL REFERENCES schools(slug) ON DELETE CASCADE,
    student_id UUID NOT NULL, -- Référence à la table students_${school_slug} (géré par application)
    document_type TEXT NOT NULL, -- 'birth_certificate', 'report_card', 'certificate', 'other'
    title TEXT NOT NULL,
    file_url TEXT NOT NULL, -- URL de stockage Supabase ou Base64
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index de recherche rapide des documents d'un élève
CREATE INDEX IF NOT EXISTS idx_student_documents_student_id ON student_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_student_documents_school_slug ON student_documents(school_slug);
