-- ============================================================
-- CLASSEUR INTELLIGENT DE PERSONNES — data.dghubschool.com
-- Schéma dédié, additif uniquement : ne modifie AUCUNE table existante.
-- Créé 2026-08-11. Voir plan : C:\Users\LENOVO\.claude\plans\tu-es-un-architecte-ancient-breeze.md
--
-- Règles de cadrage imposées en base (non contournables par un bug applicatif) :
--   1. Aucune localisation pour les mineurs / non-staff (trigger enforce_staff_only_location).
--   2. Aucune personne créée sans ancrage DGhubschool ou relation validée
--      (contrainte origin_anchor_required sur classeur.persons).
-- ============================================================

CREATE SCHEMA IF NOT EXISTS classeur;

-- ── Types de rôle et de relation, extensibles par l'admin ──────
CREATE TABLE classeur.role_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text UNIQUE NOT NULL,
    label_fr text NOT NULL,
    label_en text,
    category text NOT NULL CHECK (category IN ('staff', 'student', 'family', 'other')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE classeur.relationship_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text UNIQUE NOT NULL,
    label_fr text NOT NULL,
    inverse_code text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Opérateurs de l'app (liés à un superadmin DGhubschool réel) ─
CREATE TABLE classeur.operators (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dghubschool_superadmin_id uuid NOT NULL REFERENCES public.superadmins(id),
    display_name text,
    is_active boolean NOT NULL DEFAULT true,
    granted_scopes text[] NOT NULL DEFAULT ARRAY['read', 'associate', 'merge', 'admin'],
    created_at timestamptz NOT NULL DEFAULT now(),
    last_login_at timestamptz,
    UNIQUE (dghubschool_superadmin_id)
);

CREATE TABLE classeur.sso_handoffs (
    code text PRIMARY KEY,
    superadmin_id uuid NOT NULL,
    expires_at timestamptz NOT NULL,
    used boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE classeur.settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    updated_by uuid,
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE classeur.class_aliases (
    raw_variant text NOT NULL,
    canonical_code text NOT NULL,
    school_slug text,
    PRIMARY KEY (raw_variant, school_slug)
);

-- ── Personnes ────────────────────────────────────────────────
-- origin_type = 'dghubschool_profile' | 'dghubschool_student' : ancrée sur une ligne réelle
-- origin_type = 'validated_relation' : n'existe QUE parce qu'une relation validée la rattache
-- à une personne du premier type. Aucune autre voie de création n'est permise.
CREATE TABLE classeur.persons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name text NOT NULL,
    origin_type text NOT NULL CHECK (origin_type IN ('dghubschool_profile', 'dghubschool_student', 'validated_relation')),
    origin_school_slug text,
    origin_source_table text CHECK (origin_source_table IN ('profiles', 'students')),
    origin_source_id uuid,
    origin_relationship_id uuid,
    is_minor boolean NOT NULL DEFAULT false,
    primary_photo_url text,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'rejected')),
    created_by uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT origin_anchor_required CHECK (
        (
            origin_type IN ('dghubschool_profile', 'dghubschool_student')
            AND origin_school_slug IS NOT NULL
            AND origin_source_table IS NOT NULL
            AND origin_source_id IS NOT NULL
            AND origin_relationship_id IS NULL
        )
        OR
        (
            origin_type = 'validated_relation'
            AND origin_relationship_id IS NOT NULL
        )
    )
);

CREATE UNIQUE INDEX idx_persons_origin_dghubschool
    ON classeur.persons (origin_school_slug, origin_source_table, origin_source_id)
    WHERE origin_type IN ('dghubschool_profile', 'dghubschool_student');

CREATE TABLE classeur.person_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id uuid NOT NULL REFERENCES classeur.persons(id) ON DELETE CASCADE,
    role_type_id uuid NOT NULL REFERENCES classeur.role_types(id),
    school_slug text NOT NULL,
    source_table text,
    source_id uuid,
    valid_from date DEFAULT current_date,
    valid_to date,
    is_current boolean NOT NULL DEFAULT true,
    UNIQUE (person_id, role_type_id, school_slug)
);

CREATE TABLE classeur.sources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text,
    source_type text NOT NULL CHECK (source_type IN
        ('dghubschool_live', 'import_xlsx', 'import_csv', 'import_json', 'import_pdf', 'import_image')),
    original_filename text,
    file_hash text,
    storage_path text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
    row_count int,
    error_log jsonb,
    school_hint text,
    imported_by uuid,
    imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE classeur.source_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id uuid NOT NULL REFERENCES classeur.sources(id) ON DELETE CASCADE,
    raw_data jsonb NOT NULL,
    row_index int,
    page_number int,
    ocr_confidence numeric(5,2),
    linked_person_id uuid REFERENCES classeur.persons(id),
    classification_status text NOT NULL DEFAULT 'unclassified'
        CHECK (classification_status IN ('unclassified', 'to_classify', 'associated', 'rejected', 'ignored')),
    extracted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE classeur.person_attributes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id uuid NOT NULL REFERENCES classeur.persons(id) ON DELETE CASCADE,
    attribute_key text NOT NULL,
    attribute_value text NOT NULL,
    normalized_value text,
    source_record_id uuid REFERENCES classeur.source_records(id),
    confidence numeric(5,2),
    is_current boolean NOT NULL DEFAULT true,
    valid_from timestamptz NOT NULL DEFAULT now(),
    valid_to timestamptz
);

CREATE TABLE classeur.relationships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    person_a_id uuid NOT NULL REFERENCES classeur.persons(id),
    person_b_id uuid NOT NULL REFERENCES classeur.persons(id),
    relationship_type_id uuid NOT NULL REFERENCES classeur.relationship_types(id),
    status text NOT NULL DEFAULT 'probable' CHECK (status IN ('probable', 'validated', 'rejected')),
    confidence_score numeric(5,2),
    source_record_id uuid REFERENCES classeur.source_records(id),
    validated_by uuid,
    validated_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT relationships_not_self CHECK (person_b_id <> person_a_id)
);

-- FK différée : persons.origin_relationship_id -> relationships(id) (dépendance circulaire à la création)
ALTER TABLE classeur.persons
    ADD CONSTRAINT persons_origin_relationship_fkey
    FOREIGN KEY (origin_relationship_id) REFERENCES classeur.relationships(id);

CREATE TABLE classeur.matches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_record_id uuid NOT NULL REFERENCES classeur.source_records(id) ON DELETE CASCADE,
    candidate_person_id uuid NOT NULL REFERENCES classeur.persons(id),
    score numeric(5,2) NOT NULL,
    confidence_band text NOT NULL CHECK (confidence_band IN ('strong', 'to_verify', 'weak')),
    algorithm_version text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'superseded')),
    computed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE classeur.match_evidence (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id uuid NOT NULL REFERENCES classeur.matches(id) ON DELETE CASCADE,
    field_name text NOT NULL,
    source_value text,
    person_value text,
    field_weight numeric(5,2),
    field_score numeric(5,2),
    contribution numeric(5,2),
    notes text
);

CREATE TABLE classeur.match_validations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id uuid REFERENCES classeur.matches(id),
    action text NOT NULL CHECK (action IN
        ('associer', 'rejeter', 'ignorer', 'confirmer_doublon', 'fusionner', 'rejeter_doublon')),
    performed_by uuid NOT NULL,
    performed_at timestamptz NOT NULL DEFAULT now(),
    comment text
);

CREATE TABLE classeur.duplicate_candidates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    person_a_id uuid NOT NULL REFERENCES classeur.persons(id),
    person_b_id uuid NOT NULL REFERENCES classeur.persons(id),
    score numeric(5,2),
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed_duplicate', 'rejected', 'merged')),
    detected_at timestamptz NOT NULL DEFAULT now(),
    resolved_by uuid,
    resolved_at timestamptz,
    CONSTRAINT duplicate_candidates_ordered_pair CHECK (person_b_id > person_a_id)
);

CREATE TABLE classeur.person_merges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    surviving_person_id uuid NOT NULL,
    merged_person_id uuid NOT NULL,
    duplicate_candidate_id uuid REFERENCES classeur.duplicate_candidates(id),
    field_resolution jsonb,
    merged_by uuid NOT NULL,
    merged_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE classeur.documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id uuid NOT NULL REFERENCES classeur.persons(id) ON DELETE CASCADE,
    source_record_id uuid REFERENCES classeur.source_records(id),
    document_type text,
    title text,
    storage_bucket text NOT NULL DEFAULT 'classeur-documents',
    storage_path text NOT NULL,
    mime_type text,
    file_size_bytes int,
    extracted_text text,
    extraction_status text,
    uploaded_by uuid,
    uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE classeur.images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id uuid NOT NULL REFERENCES classeur.persons(id) ON DELETE CASCADE,
    storage_path text NOT NULL,
    source_record_id uuid REFERENCES classeur.source_records(id),
    is_primary boolean NOT NULL DEFAULT false,
    uploaded_at timestamptz NOT NULL DEFAULT now()
);

-- ── Localisations : STAFF UNIQUEMENT (règle de cadrage #1) ──────
CREATE TABLE classeur.locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    label text,
    address_text text,
    latitude numeric,
    longitude numeric,
    source text NOT NULL CHECK (source IN ('etablissement_address', 'imported_document')),
    school_slug text,
    source_record_id uuid REFERENCES classeur.source_records(id)
);

CREATE TABLE classeur.person_locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id uuid NOT NULL REFERENCES classeur.persons(id) ON DELETE CASCADE,
    location_id uuid NOT NULL REFERENCES classeur.locations(id),
    relation_type text NOT NULL CHECK (relation_type IN ('etablissement_travail', 'zone_probable_document')),
    confidence numeric(5,2),
    status text NOT NULL DEFAULT 'probable' CHECK (status IN ('probable', 'confirmed')),
    source_record_id uuid REFERENCES classeur.source_records(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Garde-fou en base : ni mineur, ni non-staff, ne peut jamais recevoir de ligne de localisation.
-- Doit survivre à n'importe quel bug applicatif futur.
CREATE OR REPLACE FUNCTION classeur.enforce_staff_only_location() RETURNS trigger AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM classeur.persons p
        WHERE p.id = NEW.person_id AND p.is_minor = true
    ) THEN
        RAISE EXCEPTION 'person_locations interdit pour un mineur (person_id=%)', NEW.person_id;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM classeur.person_roles pr
        JOIN classeur.role_types rt ON rt.id = pr.role_type_id
        WHERE pr.person_id = NEW.person_id AND rt.category = 'staff'
    ) THEN
        RAISE EXCEPTION 'person_locations réservé aux personnes de catégorie staff (person_id=%)', NEW.person_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_person_locations_staff_only
    BEFORE INSERT OR UPDATE ON classeur.person_locations
    FOR EACH ROW EXECUTE FUNCTION classeur.enforce_staff_only_location();

-- ── Historique (append-only) ─────────────────────────────────
CREATE TABLE classeur.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id uuid,
    actor_name text,
    action text NOT NULL CHECK (action IN
        ('import', 'extraction', 'correlation', 'association', 'validation', 'rejection',
         'merge', 'modification', 'deletion', 'login', 'export')),
    entity_type text,
    entity_id uuid,
    school_slug text,
    source_id uuid,
    details jsonb,
    ip_address text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Défense en profondeur : chaque table classeur.* a RLS activé, sans politique permissive.
-- Le service_role du backend contourne RLS par nature ; ceci ne bloque qu'un usage accidentel
-- d'une clé anon/authenticated sur ce schéma.
DO $$
DECLARE t text;
BEGIN
    FOR t IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'classeur'
    LOOP
        EXECUTE format('ALTER TABLE classeur.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- ── Données de départ : types de rôle et de relation courants ──
-- (l'admin peut en ajouter d'autres depuis /parametres, ceci n'est qu'un point de départ)
INSERT INTO classeur.role_types (code, label_fr, category) VALUES
    ('eleve', 'Élève', 'student'),
    ('directeur', 'Directeur', 'staff'),
    ('directrice', 'Directrice', 'staff'),
    ('admin', 'Administrateur', 'staff'),
    ('comptable', 'Comptable', 'staff'),
    ('secretaire', 'Secrétaire', 'staff'),
    ('enseignant', 'Enseignant', 'staff'),
    ('censeur', 'Censeur', 'staff'),
    ('proviseur', 'Proviseur', 'staff'),
    ('superviseur', 'Superviseur', 'staff'),
    ('parent', 'Parent', 'family')
ON CONFLICT (code) DO NOTHING;

INSERT INTO classeur.relationship_types (code, label_fr, inverse_code) VALUES
    ('PERE_DE', 'Père de', 'ENFANT_DE'),
    ('MERE_DE', 'Mère de', 'ENFANT_DE'),
    ('ENFANT_DE', 'Enfant de', NULL),
    ('TUTEUR_DE', 'Tuteur de', 'SOUS_TUTELLE_DE'),
    ('SOUS_TUTELLE_DE', 'Sous tutelle de', NULL),
    ('FRERE_DE', 'Frère de', 'FRERE_DE'),
    ('SOEUR_DE', 'Sœur de', 'SOEUR_DE'),
    ('CONJOINT_DE', 'Conjoint(e) de', 'CONJOINT_DE'),
    ('COLLEGUE_DE', 'Collègue de', 'COLLEGUE_DE'),
    ('RESPONSABLE_DE', 'Responsable de', 'SOUS_RESPONSABILITE_DE'),
    ('SOUS_RESPONSABILITE_DE', 'Sous la responsabilité de', NULL)
ON CONFLICT (code) DO NOTHING;

INSERT INTO classeur.settings (key, value) VALUES
    ('confidence_bands', '{"strong": 90, "to_verify": 70}'::jsonb),
    ('match_weights', '{"nom": 22, "prenom": 18, "telephone": 20, "email": 15, "matricule": 12, "classe": 15, "date_naissance": 15, "departement": 5}'::jsonb)
ON CONFLICT (key) DO NOTHING;
