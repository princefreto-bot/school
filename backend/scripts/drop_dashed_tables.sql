-- Script SQL de nettoyage pour les tables à tirets (ex: test-school)
-- Exécutez ce script dans l'éditeur SQL de votre tableau de bord Supabase

DROP TABLE IF EXISTS "students_test-noconsent-school" CASCADE;
DROP TABLE IF EXISTS "payments_test-noconsent-school" CASCADE;
DROP TABLE IF EXISTS "presences_test-noconsent-school" CASCADE;
DROP TABLE IF EXISTS "notes_test-noconsent-school" CASCADE;
DROP TABLE IF EXISTS "matieres_test-noconsent-school" CASCADE;
DROP TABLE IF EXISTS "classe_matieres_test-noconsent-school" CASCADE;
DROP TABLE IF EXISTS "activity_logs_test-noconsent-school" CASCADE;
DROP TABLE IF EXISTS "parent_student_test-noconsent-school" CASCADE;
DROP TABLE IF EXISTS "profiles_test-noconsent-school" CASCADE;
DROP TABLE IF EXISTS "app_settings_test-noconsent-school" CASCADE;

DROP TABLE IF EXISTS "students_test-school" CASCADE;
DROP TABLE IF EXISTS "payments_test-school" CASCADE;
DROP TABLE IF EXISTS "presences_test-school" CASCADE;
DROP TABLE IF EXISTS "notes_test-school" CASCADE;
DROP TABLE IF EXISTS "matieres_test-school" CASCADE;
DROP TABLE IF EXISTS "classe_matieres_test-school" CASCADE;
DROP TABLE IF EXISTS "activity_logs_test-school" CASCADE;
DROP TABLE IF EXISTS "parent_student_test-school" CASCADE;
DROP TABLE IF EXISTS "profiles_test-school" CASCADE;
DROP TABLE IF EXISTS "app_settings_test-school" CASCADE;
