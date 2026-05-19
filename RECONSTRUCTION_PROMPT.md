# PROMPT DE RECONSTRUCTION ULTIME — SYSTEME SCOLAIRE MULTI-TENANT (YZO)

Ce prompt est conçu pour être fourni à un assistant IA dans une nouvelle session de travail afin qu'il recrée entièrement le système (Base de données Supabase, Backend Express/Node.js et Frontend React/TypeScript) de manière parfaitement fonctionnelle et sécurisée.

---

## CONTEXTE ET ARCHITECTURE
Nous développons une plateforme SaaS scolaire multi-établissement appelée **YZO**.
L'architecture utilise un modèle **Table-per-Tenant** dynamique :
1. **Tables globales** pour la gestion de la facturation/statut des écoles (`schools`), les super-administrateurs (`superadmins`) et le registre physique des badges NFC (`badges`).
2. **Tables spécifiques par école** : Créées dynamiquement sous la forme `<nom_table>_<school_slug>` lors de l'enregistrement de l'école (ex: `students_csyzomacamb`). Il y a 14 tables spécifiques par école.
3. **Backend Proxy Sécurisé** : Le frontend communique uniquement avec le backend (Node.js/Express). Le backend décode un jeton JWT contenant le `schoolSlug` et le `role` de l'utilisateur, puis interagit avec Supabase en utilisant le rôle `service_role` (pour outrepasser le RLS). Le frontend n'interagit jamais directement avec Supabase avec des clés d'anonymat directes.
4. **Sécurité RLS stricte** : Pour éviter toute fuite, toutes les tables spécifiques par établissement interdisent tout accès anonyme ou utilisateur standard, exigeant exclusivement le rôle `service_role` via le backend.

---

## PARTIE 1 : BASE DE DONNÉES SUPABASE (DÉFINITION DES TABLES & FONCTIONS)

### 1.1 Tables Globales
Exécutez ce script SQL pour initialiser la structure globale de l'application :

```sql
-- Extension pour la génération d'UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table globale des Écoles
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'trial', -- 'trial', 'active', 'expired'
    trial_ends_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table globale des Super-Administrateurs SaaS
CREATE TABLE IF NOT EXISTS public.superadmins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table globale des Badges NFC enregistrés
CREATE TABLE IF NOT EXISTS public.badges (
    id TEXT PRIMARY KEY, -- UID unique du badge NFC physique
    student_id UUID, -- Rempli par le code applicatif pour lier à un élève
    school_slug TEXT, -- Référence à l'école de l'élève
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'revoked'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Activation de RLS sur les tables globales
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Politiques RLS globales
CREATE POLICY schools_read_all ON public.schools FOR SELECT USING (true);
CREATE POLICY schools_write_service ON public.schools FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY superadmins_service_only ON public.superadmins FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY badges_service_only ON public.badges FOR ALL USING (auth.role() = 'service_role');
```

### 1.2 Fonction SQL de Création Dynamique des 14 Tables de l'École
Cette fonction PostgreSQL est appelée par le backend lorsqu'une nouvelle école est créée afin de générer dynamiquement sa structure de base de données partitionnée.

```sql
CREATE OR REPLACE FUNCTION public.create_school_tables(school_slug text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    -- 1. Profils Utilisateurs (Administrateurs, Directeurs, Comptables, Parents, Personnel)
    EXECUTE 'CREATE TABLE IF NOT EXISTS profiles_' || school_slug || ' (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nom TEXT NOT NULL,
        telephone TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        push_token TEXT,
        last_login TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now()
    )';

    -- 2. Élèves
    EXECUTE 'CREATE TABLE IF NOT EXISTS students_' || school_slug || ' (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nom TEXT NOT NULL,
        prenom TEXT,
        classe TEXT,
        cycle TEXT,
        ecolage NUMERIC DEFAULT 0,
        deja_paye NUMERIC DEFAULT 0,
        restant NUMERIC DEFAULT 0,
        status TEXT DEFAULT ''Non soldé'',
        telephone_parent TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        sexe TEXT DEFAULT ''M'',
        redoublant BOOLEAN DEFAULT false,
        ecole_provenance TEXT DEFAULT '''',
        date_naissance TEXT,
        adsn TEXT,
        photo_url TEXT
    )';

    -- 3. Historique des Paiements d'écolages
    EXECUTE 'CREATE TABLE IF NOT EXISTS payments_' || school_slug || ' (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        student_id UUID REFERENCES students_' || school_slug || '(id) ON DELETE CASCADE,
        montant NUMERIC NOT NULL,
        date TEXT,
        recu TEXT,
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
    )';

    -- 4. Pointages de Présences (Entrée, Retard, Sortie)
    EXECUTE 'CREATE TABLE IF NOT EXISTS presences_' || school_slug || ' (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        student_id UUID REFERENCES students_' || school_slug || '(id) ON DELETE CASCADE,
        eleve_nom TEXT,
        eleve_prenom TEXT,
        eleve_classe TEXT,
        date TEXT,
        heure TEXT,
        statut TEXT, -- ''Present'', ''Retard'', ''Sorti''
        created_at TIMESTAMPTZ DEFAULT now()
    )';

    -- 5. Logs d'activité administrative
    EXECUTE 'CREATE TABLE IF NOT EXISTS activity_logs_' || school_slug || ' (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        utilisateur TEXT,
        utilisateur_role TEXT,
        action TEXT,
        description TEXT,
        date_heure TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now()
    )';

    -- 6. Annonces de l'établissement
    EXECUTE 'CREATE TABLE IF NOT EXISTS announcements_' || school_slug || ' (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        titre TEXT NOT NULL,
        message TEXT NOT NULL,
        cible TEXT, -- ''all'', ''parents'', etc.
        importance TEXT, -- ''normal'', ''high''
        created_by TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
    )';

    -- 7. Configuration Générale de l'École
    EXECUTE 'CREATE TABLE IF NOT EXISTS app_settings_' || school_slug || ' (
        id TEXT PRIMARY KEY DEFAULT ''global_settings'',
        app_name TEXT,
        school_name TEXT,
        school_year TEXT,
        school_logo TEXT, -- Contenu Base64 ou URL
        school_stamp TEXT, -- Cachet officiel en Base64 ou URL
        message_remerciement TEXT,
        message_rappel TEXT,
        updated_at TIMESTAMPTZ DEFAULT now(),
        cycle_schedules JSONB DEFAULT ''[]''::jsonb,
        tranches JSONB DEFAULT ''[]''::jsonb
    )';

    -- 8. Matières Académiques
    EXECUTE 'CREATE TABLE IF NOT EXISTS matieres_' || school_slug || ' (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nom TEXT NOT NULL,
        categorie TEXT, -- ex: ''Scientifique'', ''Littéraire''
        created_at TIMESTAMPTZ DEFAULT now()
    )';

    -- 9. Liaison Classe-Matières (Professeurs & Coefficients)
    EXECUTE 'CREATE TABLE IF NOT EXISTS classe_matieres_' || school_slug || ' (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        classe TEXT NOT NULL,
        matiere_id UUID REFERENCES matieres_' || school_slug || '(id) ON DELETE CASCADE,
        professeur TEXT,
        coefficient NUMERIC DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT now()
    )';

    -- 10. Bulletin de Notes des élèves
    EXECUTE 'CREATE TABLE IF NOT EXISTS notes_' || school_slug || ' (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        eleve_id UUID REFERENCES students_' || school_slug || '(id) ON DELETE CASCADE,
        matiere_id UUID REFERENCES matieres_' || school_slug || '(id) ON DELETE CASCADE,
        periode TEXT, -- ''Trimestre 1'', ''Semestre 1'', etc.
        note_classe NUMERIC,
        note_devoir NUMERIC,
        note_compo NUMERIC,
        created_at TIMESTAMPTZ DEFAULT now()
    )';

    -- 11. Table d'association Parents-Élèves (Relation de confiance)
    EXECUTE 'CREATE TABLE IF NOT EXISTS parent_student_' || school_slug || ' (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        parent_id UUID REFERENCES profiles_' || school_slug || '(id) ON DELETE CASCADE,
        student_id UUID REFERENCES students_' || school_slug || '(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT now()
    )';

    -- 12. Conversations (Messagerie Parents-Administration)
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

    -- 14. Historique de Lecture des Annonces par les parents
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

    -- Politiques en Lecture Publique (mais modifications restreintes)
    EXECUTE 'CREATE POLICY app_settings_read_all ON app_settings_' || school_slug || ' FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY app_settings_write_service ON app_settings_' || school_slug || ' FOR ALL USING (auth.role() = ''service_role'')';
    
    EXECUTE 'CREATE POLICY matieres_read_all ON matieres_' || school_slug || ' FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY matieres_write_service ON matieres_' || school_slug || ' FOR ALL USING (auth.role() = ''service_role'')';
    
    EXECUTE 'CREATE POLICY classe_matieres_read_all ON classe_matieres_' || school_slug || ' FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY classe_matieres_write_service ON classe_matieres_' || school_slug || ' FOR ALL USING (auth.role() = ''service_role'')';

    -- Notification de mise à jour du schéma REST PostgREST
    NOTIFY pgrst, 'reload schema';
END;
$$;

-- Révocation absolue des droits d'exécution publique (Sécurité)
REVOKE EXECUTE ON FUNCTION public.create_school_tables(text) FROM anon, authenticated;
```

### 1.3 Fonction SQL de Suppression Dynamique des Tables de l'École
Cette fonction est utilisée pour désinscrire une école et nettoyer la base de données.

```sql
CREATE OR REPLACE FUNCTION public.drop_school_tables(school_slug text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    EXECUTE 'DROP TABLE IF EXISTS announcement_reads_' || school_slug || ' CASCADE';
    EXECUTE 'DROP TABLE IF EXISTS messages_' || school_slug || ' CASCADE';
    EXECUTE 'DROP TABLE IF EXISTS conversations_' || school_slug || ' CASCADE';
    EXECUTE 'DROP TABLE IF EXISTS parent_student_' || school_slug || ' CASCADE';
    EXECUTE 'DROP TABLE IF EXISTS notes_' || school_slug || ' CASCADE';
    EXECUTE 'DROP TABLE IF EXISTS classe_matieres_' || school_slug || ' CASCADE';
    EXECUTE 'DROP TABLE IF EXISTS matieres_' || school_slug || ' CASCADE';
    EXECUTE 'DROP TABLE IF EXISTS app_settings_' || school_slug || ' CASCADE';
    EXECUTE 'DROP TABLE IF EXISTS announcements_' || school_slug || ' CASCADE';
    EXECUTE 'DROP TABLE IF EXISTS activity_logs_' || school_slug || ' CASCADE';
    EXECUTE 'DROP TABLE IF EXISTS presences_' || school_slug || ' CASCADE';
    EXECUTE 'DROP TABLE IF EXISTS payments_' || school_slug || ' CASCADE';
    EXECUTE 'DROP TABLE IF EXISTS students_' || school_slug || ' CASCADE';
    EXECUTE 'DROP TABLE IF EXISTS profiles_' || school_slug || ' CASCADE';

    NOTIFY pgrst, 'reload schema';
END;
$$;

-- Révocation absolue des droits d'exécution publique
REVOKE EXECUTE ON FUNCTION public.drop_school_tables(text) FROM anon, authenticated;
```

---

## PARTIE 2 : BACKEND EXPRESS / NODE.JS

Le serveur backend Node.js joue le rôle de passerelle et de proxy de confiance.

### 2.1 Configuration Supabase Client (`backend/utils/supabase.js`)
Le client Supabase doit utiliser la clé de service (`service_role`) pour pouvoir exécuter les opérations administratives et contourner le RLS de sécurité des tables de l'école :
```javascript
const { createClient } = require('@supabase/supabase-base');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Obligatoire pour outrepasser les règles RLS strictes
);
module.exports = { supabase };
```

### 2.2 Middleware d'authentification par Jeton JWT (`backend/middleware/auth.js`)
Chaque requête vers l'API doit passer par la vérification du jeton JWT.
```javascript
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Accès non autorisé : Jeton manquant.' });

    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
        if (err) return res.status(403).json({ error: 'Jeton invalide ou expiré.' });
        req.user = user; // Contient { id, role, schoolSlug, telephone }
        next();
    });
}
```

### 2.3 Exemple Contrôleur de Synchronisation Globale (`backend/controllers/syncController.js`)
Ce contrôleur permet d'implémenter la synchronisation bidirectionnelle de toutes les données métier d'une école de manière isolée en se basant sur le `schoolSlug` de l'utilisateur authentifié :

```javascript
const { supabase } = require('../utils/supabase');

// Route d'envoi des données (POST /api/sync)
async function syncFromFrontend(req, res) {
    if (!req.user || !req.user.schoolSlug) {
        return res.status(403).json({ error: 'Données non autorisées ou école non fournie.' });
    }

    const { schoolSlug } = req.user;
    const { students = [], presences = [], replace = false } = req.body;
    
    // Fonction helper générant dynamiquement le nom de la table propre au tenant
    const tbl = (name) => `${name}_${schoolSlug}`;

    try {
        if (replace) {
            // Nettoyage complet avant réécriture
            await supabase.from(tbl('presences')).delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from(tbl('payments')).delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from(tbl('students')).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        }

        // Insertion groupée des élèves et des paiements
        if (students.length > 0) {
            const studentData = students.map(s => ({
                id: s.id,
                nom: s.nom,
                prenom: s.prenom || '',
                classe: s.classe || 'Inconnue',
                ecolage: s.ecolage || 0,
                deja_paye: s.dejaPaye || 0,
                restant: s.restant || 0,
                status: s.status || 'Non soldé',
                telephone_parent: s.telephone || null
            }));
            await supabase.from(tbl('students')).upsert(studentData, { onConflict: 'id' });
            
            // ... Mêmes opérations pour les paiements liés ...
        }

        return res.json({ message: 'Synchronisation cloud terminée avec succès.' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
```

---

## PARTIE 3 : FRONTEND REACT, TYPESCRIPT & ZUSTAND STORE

Le frontend est construit en React avec Vite et TypeScript. Le store global Zustand gère l'état et prévient les fuites de cache inter-écoles.

### 3.1 Store Zustand (`src/store/useStore.ts`)
Points essentiels à implémenter pour le store Zustand :
1. **Nettoyage strict du cache local au logout ou au login :**
   ```typescript
   logout: () => {
       // Purger toutes les données d'école en mémoire
       set({
           currentUser: null,
           students: [],
           payments: [],
           presences: [],
           announcements: [],
           announcementReads: [],
           appSettings: null,
           isAuthenticated: false
       });
       localStorage.removeItem('yzo_jwt_token');
   }
   ```
2. **Interface TypeScript AppState obligatoire pour les annonces :**
   ```typescript
   export interface Announcement {
       id: string;
       titre: string;
       message: string;
       cible?: string;
       importance?: string;
       createdBy?: string;
       createdAt?: string;
       date: string;
   }

   export interface AnnouncementRead {
       announcementId: string;
       parentId: string;
       readAt: string;
       remindAt?: string | null;
   }

   export interface AppState {
       announcements: Announcement[];
       announcementReads: AnnouncementRead[];
       markAnnouncementRead: (announcementId: string, parentId: string) => void;
       reportAnnouncementReadToBackend: (announcementId: string) => Promise<void>;
       // ... autres états
   }
   ```

### 3.2 Modal de Charte de Confidentialité (`src/components/PrivacyPolicyModal.tsx`)
Un modal moderne (utilisant Glassmorphism et Lucide Icons) décrivant les engagements de confidentialité et de conformité (RGPD/isolation multi-tenant). Il doit être disponible en français et en anglais :
* **Propriétés du Modal :**
  ```typescript
  interface PrivacyPolicyModalProps {
      isOpen: boolean;
      onClose: () => void;
  }
  ```
* **Affichage discret :** Placé dans les bas de pages et barres de menu d'administration pour rassurer les clients institutionnels.

### 3.3 Protection Mobile / Scanner
L'application intègre des fonctionnalités NFC et de lecture de QR Code. Les composants de scanning de cartes (`ScanInformation.tsx`, `ScanPresence.tsx`, etc.) doivent forcer la caméra arrière principale du téléphone sans zoom grand-angle abusif en appliquant de manière stricte :
```typescript
facingMode: { exact: "environment" }
```

---
Exécutez ce plan étape par étape dans la nouvelle session de travail pour initialiser et synchroniser le système !
