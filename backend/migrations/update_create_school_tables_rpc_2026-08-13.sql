-- ============================================================
-- Met à jour la fonction RPC create_school_tables() (vit uniquement dans
-- Supabase, pas de DDL versionné ailleurs) pour que toute NOUVELLE école
-- hérite directement des colonnes frais d'inscription, sans passer par
-- une migration manuelle a posteriori comme pour les 6 écoles existantes
-- (voir frais_inscription_2026-08-13.sql).
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_school_tables(school_slug text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- 1. Profils Utilisateurs
    EXECUTE 'CREATE TABLE IF NOT EXISTS profiles_' || school_slug || ' (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nom TEXT NOT NULL,
        telephone TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        push_token TEXT,
        last_login TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now(),
        accepted_terms BOOLEAN DEFAULT false,
        accepted_privacy_policy BOOLEAN DEFAULT false,
        marketing_consent BOOLEAN DEFAULT false,
        consented_at TIMESTAMPTZ,
        signup_ip_hash TEXT,
        parent_photo_authorization BOOLEAN DEFAULT false,
        compte_bancaire TEXT,
        date_embauche DATE,
        departement TEXT,
        matricule TEXT,
        mode_paiement TEXT,
        numero_cnss TEXT
    )';

    -- 2. Élèves (ecolage/deja_paye/restant = piste écolage ; frais_inscription/inscription_paye/
    -- inscription_restant = piste distincte, jamais mélangée, voir Paramètres > Frais d'inscription)
    EXECUTE 'CREATE TABLE IF NOT EXISTS students_' || school_slug || ' (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nom TEXT NOT NULL,
        prenom TEXT,
        classe TEXT,
        cycle TEXT,
        ecolage NUMERIC DEFAULT 0,
        deja_paye NUMERIC DEFAULT 0,
        restant NUMERIC DEFAULT 0,
        frais_inscription NUMERIC DEFAULT 0,
        inscription_paye NUMERIC DEFAULT 0,
        inscription_restant NUMERIC DEFAULT 0,
        status TEXT DEFAULT ''Non soldé'',
        telephone_parent TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        sexe TEXT DEFAULT ''M'',
        redoublant BOOLEAN DEFAULT false,
        ecole_provenance TEXT DEFAULT '''',
        date_naissance TEXT,
        adsn TEXT,
        photo_url TEXT,
        academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE,
        license_activated_at TIMESTAMPTZ,
        license_key TEXT,
        license_status TEXT DEFAULT ''inactive''
    )';

    -- 3. Historique des Paiements (type = ''ecolage'' | ''inscription'', absent = ''ecolage'')
    EXECUTE 'CREATE TABLE IF NOT EXISTS payments_' || school_slug || ' (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students_' || school_slug || '(id) ON DELETE CASCADE,
        montant NUMERIC NOT NULL,
        date TEXT,
        recu TEXT,
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE,
        mode TEXT,
        reduction NUMERIC DEFAULT 0,
        reference TEXT,
        type TEXT DEFAULT ''ecolage''
    )';

    -- 4. Pointages de Présences
    EXECUTE 'CREATE TABLE IF NOT EXISTS presences_' || school_slug || ' (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students_' || school_slug || '(id) ON DELETE CASCADE,
        eleve_nom TEXT,
        eleve_prenom TEXT,
        eleve_classe TEXT,
        date TEXT,
        heure TEXT,
        statut TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE
    )';

    -- 5. Logs
    EXECUTE 'CREATE TABLE IF NOT EXISTS activity_logs_' || school_slug || ' (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        utilisateur TEXT,
        utilisateur_role TEXT,
        action TEXT,
        description TEXT,
        date_heure TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now(),
        academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE
    )';

    -- 6. Annonces
    EXECUTE 'CREATE TABLE IF NOT EXISTS announcements_' || school_slug || ' (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        titre TEXT NOT NULL,
        message TEXT NOT NULL,
        cible TEXT,
        importance TEXT,
        created_by TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
    )';

    -- 7. App Settings (BP/téléphone/adresse SANS valeur par défaut : coordonnées propres à
    -- une école précise, pas des exemples valables pour tout le monde. class_fees permet à
    -- chaque école de personnaliser ses frais de scolarité par classe — voir Paramètres.
    -- class_registration_fees fait de même pour les frais d'inscription, piste distincte.)
    EXECUTE 'CREATE TABLE IF NOT EXISTS app_settings_' || school_slug || ' (
        id TEXT PRIMARY KEY DEFAULT ''global_settings'',
        app_name TEXT,
        school_name TEXT,
        school_year TEXT,
        school_logo TEXT,
        school_stamp TEXT,
        message_remerciement TEXT,
        message_rappel TEXT,
        updated_at TIMESTAMPTZ DEFAULT now(),
        cycle_schedules JSONB DEFAULT ''[]''::jsonb,
        tranches JSONB DEFAULT ''[]''::jsonb,
        class_fees JSONB DEFAULT ''{}''::jsonb,
        class_registration_fees JSONB DEFAULT ''{}''::jsonb,
        school_motto TEXT DEFAULT ''Travail-Rigueur-Succès'',
        school_bp TEXT,
        school_telephone TEXT,
        school_address TEXT,
        school_currency TEXT DEFAULT ''FCFA'',
        country_name TEXT DEFAULT ''République Togolaise'',
        country_motto TEXT DEFAULT ''Travail - Liberté - Patrie'',
        ministere_name TEXT DEFAULT ''Ministère de l''''Éducation Nationale'',
        auto_reminders_enabled BOOLEAN DEFAULT false,
        auto_reminders_threshold_days INTEGER DEFAULT 30,
        school_ifu TEXT,
        school_rccm TEXT,
        school_nif TEXT,
        school_email TEXT,
        school_website TEXT,
        school_autorisation TEXT,
        heures_mensuelles_standard NUMERIC,
        director_name TEXT,
        director_title TEXT,
        official_seal TEXT,
        director_signature TEXT,
        show_stamp_on_cards BOOLEAN DEFAULT true,
        show_signature_on_cards BOOLEAN DEFAULT true,
        show_seal_on_cards BOOLEAN DEFAULT true,
        show_stamp_on_bulletins BOOLEAN DEFAULT true,
        show_signature_on_bulletins BOOLEAN DEFAULT true
    )';

    -- Ligne de paramètres par défaut : garantit que la table n'est JAMAIS vide,
    -- pour que la synchro frontend ne saute jamais le bloc appSettings (ce qui
    -- laissait auparavant des données d'une autre école affichées en cache local).
    EXECUTE 'INSERT INTO app_settings_' || school_slug || ' (id, school_name)
             VALUES (''global_settings'', NULL)
             ON CONFLICT (id) DO NOTHING';

    -- 8. Matières
    EXECUTE 'CREATE TABLE IF NOT EXISTS matieres_' || school_slug || ' (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nom TEXT NOT NULL,
        categorie TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE
    )';

    -- 9. Classe Matières
    EXECUTE 'CREATE TABLE IF NOT EXISTS classe_matieres_' || school_slug || ' (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        classe TEXT NOT NULL,
        matiere_id UUID REFERENCES matieres_' || school_slug || '(id) ON DELETE CASCADE,
        professeur TEXT,
        coefficient NUMERIC DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT now(),
        academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE,
        professeur_id UUID
    )';

    -- 10. Notes
    EXECUTE 'CREATE TABLE IF NOT EXISTS notes_' || school_slug || ' (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        eleve_id UUID REFERENCES students_' || school_slug || '(id) ON DELETE CASCADE,
        matiere_id UUID REFERENCES matieres_' || school_slug || '(id) ON DELETE CASCADE,
        periode TEXT,
        note_classe NUMERIC,
        note_devoir NUMERIC,
        note_compo NUMERIC,
        created_at TIMESTAMPTZ DEFAULT now(),
        academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE
    )';

    -- 11. Parent Student
    EXECUTE 'CREATE TABLE IF NOT EXISTS parent_student_' || school_slug || ' (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        parent_id UUID REFERENCES profiles_' || school_slug || '(id) ON DELETE CASCADE,
        student_id UUID REFERENCES students_' || school_slug || '(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT now()
    )';

    -- 12. Conversations
    EXECUTE 'CREATE TABLE IF NOT EXISTS conversations_' || school_slug || ' (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        parent_id UUID REFERENCES profiles_' || school_slug || '(id) ON DELETE CASCADE,
        admin_role TEXT NOT NULL DEFAULT ''administration'',
        last_message TEXT,
        updated_at TIMESTAMPTZ DEFAULT now(),
        created_at TIMESTAMPTZ DEFAULT now()
    )';

    -- 13. Messages
    EXECUTE 'CREATE TABLE IF NOT EXISTS messages_' || school_slug || ' (
        id BIGSERIAL PRIMARY KEY,
        conversation_id UUID REFERENCES conversations_' || school_slug || '(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL,
        message_text TEXT,
        image_url TEXT,
        read_status BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT now()
    )';

    -- 14. Announcement Reads
    EXECUTE 'CREATE TABLE IF NOT EXISTS announcement_reads_' || school_slug || ' (
        announcement_id UUID REFERENCES announcements_' || school_slug || '(id) ON DELETE CASCADE,
        parent_id UUID,
        read_at TIMESTAMPTZ DEFAULT now(),
        remind_at TIMESTAMPTZ,
        PRIMARY KEY (announcement_id, parent_id)
    )';

    -- Activation de RLS sur toutes les tables de l'école
    EXECUTE 'ALTER TABLE profiles_' || school_slug || ' ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE students_' || school_slug || ' ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE payments_' || school_slug || ' ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE presences_' || school_slug || ' ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE activity_logs_' || school_slug || ' ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE announcements_' || school_slug || ' ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE app_settings_' || school_slug || ' ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE matieres_' || school_slug || ' ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE classe_matieres_' || school_slug || ' ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE notes_' || school_slug || ' ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE parent_student_' || school_slug || ' ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE conversations_' || school_slug || ' ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE messages_' || school_slug || ' ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE announcement_reads_' || school_slug || ' ENABLE ROW LEVEL SECURITY';

    -- Politiques RLS : Limitation stricte au service_role du serveur
    EXECUTE 'CREATE POLICY profiles_service_only ON profiles_' || school_slug || ' FOR ALL USING (auth.role() = ''service_role'')';
    EXECUTE 'CREATE POLICY students_service_only ON students_' || school_slug || ' FOR ALL USING (auth.role() = ''service_role'')';
    EXECUTE 'CREATE POLICY payments_service_only ON payments_' || school_slug || ' FOR ALL USING (auth.role() = ''service_role'')';
    EXECUTE 'CREATE POLICY presences_service_only ON presences_' || school_slug || ' FOR ALL USING (auth.role() = ''service_role'')';
    EXECUTE 'CREATE POLICY activity_logs_service_only ON activity_logs_' || school_slug || ' FOR ALL USING (auth.role() = ''service_role'')';
    EXECUTE 'CREATE POLICY announcements_service_only ON announcements_' || school_slug || ' FOR ALL USING (auth.role() = ''service_role'')';
    EXECUTE 'CREATE POLICY notes_service_only ON notes_' || school_slug || ' FOR ALL USING (auth.role() = ''service_role'')';
    EXECUTE 'CREATE POLICY parent_student_service_only ON parent_student_' || school_slug || ' FOR ALL USING (auth.role() = ''service_role'')';
    EXECUTE 'CREATE POLICY conversations_service_only ON conversations_' || school_slug || ' FOR ALL USING (auth.role() = ''service_role'')';
    EXECUTE 'CREATE POLICY messages_service_only ON messages_' || school_slug || ' FOR ALL USING (auth.role() = ''service_role'')';
    EXECUTE 'CREATE POLICY announcement_reads_service_only ON announcement_reads_' || school_slug || ' FOR ALL USING (auth.role() = ''service_role'')';

    -- Politiques en Lecture Publique
    EXECUTE 'CREATE POLICY app_settings_read_all ON app_settings_' || school_slug || ' FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY app_settings_write_service ON app_settings_' || school_slug || ' FOR ALL USING (auth.role() = ''service_role'')';

    EXECUTE 'CREATE POLICY matieres_read_all ON matieres_' || school_slug || ' FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY matieres_write_service ON matieres_' || school_slug || ' FOR ALL USING (auth.role() = ''service_role'')';

    EXECUTE 'CREATE POLICY classe_matieres_read_all ON classe_matieres_' || school_slug || ' FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY classe_matieres_write_service ON classe_matieres_' || school_slug || ' FOR ALL USING (auth.role() = ''service_role'')';

    -- Notification de mise à jour du schéma REST PostgREST
    NOTIFY pgrst, 'reload schema';
END;
$function$
