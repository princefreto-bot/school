# 🏫 GestioSchool — Architecture de Production Cloud
> Fichier de référence technique. État actuel : **Développement Avancé - UI Redesign en cours**.
> Dernière mise à jour : Mars 2026

---

## 📍 POSITION ACTUELLE DU PROJET

### ✅ État d'Avancement
- **Phase** : Post-MVP → Amélioration UI/UX et optimisation de la compilation
- **Couverture Fonctionnelle** : 95% (Core + Features + Admin Portal + Parent Portal)
- **Statut Build** : Utilisation du CSS Tailwind v4 en cours d'optimisation
- **Déploiement** : Prêt pour Render (après optimisation mémoire du build)

### 🎯 Priorités Actuelles
1. **Compilation Tailwind** : Correction erreurs `@apply` avec `placeholder-*` qui n'est pas supporté
2. **Redesign UI** : Migration vers design professionnel avec card-based layouts et responsive design
3. **Optimisation Build** : Réduction de la consommation mémoire lors du build Vite
4. **Tests Responsivité** : Mobile-first approach avec breakpoints Tailwind (sm, md, lg)

---

## 🏗️ Architecture Globale (FullStack Cloud)
L'application est une architecture **SaaS (Software as a Service)** complète et décentralisée :

1.  **Frontend (UI)** : React 18 + Vite + Tailwind CSS v4. Hébergé sur **Render**.
2.  **Backend (API)** : Node.js + Express.js. Hébergé sur **Render**.
3.  **Base de Données** : PostgreSQL via **Supabase** (Authentification + Realtime).
4.  **Authentification** : JWT (JSON Web Tokens) sécurisés avec hachage **Bcrypt**.
5.  **Messagerie** : Système de chat en temps réel via Supabase Realtime + API Node.js.
6. **Gestion d'État** : Zustand pour l'état global du frontend.

---

## 📁 Structure du Projet

```
gestioschool/
├── backend/                  # SERVEUR API (Node.js)
│   ├── config/               # Configuration Supabase & JWT
│   ├── controllers/          # Logique métier (Auth, Sync, Parents, Chat)
│   ├── middleware/           # Sécurité (authenticateToken)
│   ├── routes/               # Endpoints API (/api/auth, /api/parent, etc.)
│   ├── scripts/              # Migration et maintenance
│   └── server.js             # Point d'entrée serveur
│
├── src/                      # FRONTEND (React)
│   ├── components/           # Composants UI (LinkStudent, ChatWindow, etc.)
│   ├── pages/                # Pages Admin & Parents
│   ├── services/             # Client API (parentApi.ts, chatApi.ts, etc.)
│   ├── store/                # État global Zustand (useStore.ts)
│   ├── types/                # Types TypeScript (index.ts)
│   ├── utils/                # Générateurs PDF et Utilitaires
│   ├── App.tsx               # Routeur de l'application
│   └── main.tsx              # Rendu React
│
├── .env                      # Variables de production (URL, Keys)
├── ARCHITECTURE.md           # Ce fichier
└── package.json              # Dépendances FullStack
```

---

## 🗂️ Composants Clés de Production

### 1. Moteur de Synchronisation (`syncController.js`)
- Reçoit les données brutes du frontend (355 élèves).
- Utilise une logique de dédoublonnage par **ID unique**.
- Effectue des **Upserts** (Update or Insert) dans Supabase pour garantir l'intégrité des données.

### 2. Portail Parent (`parentController.js`)
- Gestion des liens sécurisés via la table de jonction `parent_student`.
- Accès restreint : un parent ne voit que ses propres enfants liés.
- Dossier scolaire complet : Historique financier, reste à payer, badges.

### 3. Système de Messagerie (`ChatWindow.tsx`)
- Communication bi-directionnelle : Administration ↔ Parents.
- Support des images et notifications de lecture.
- Initiation des discussions par l'administration via la liste des parents.

---

## 🌐 Stratégie de Notifications
Le projet utilise exclusivement l'API **Web Push** standard (Service Workers + Push API) pour les notifications système sur navigateur (PC et mobile), garantissant une compatibilité SaaS universelle.

---

## 🔄 Flux de Données (Production)

```
[ FRONTEND React ] <--- JWT ---> [ BACKEND Node.js ] <--- SQL ---> [ SUPABASE DB ]
       |                                |                             |
       |-- Sync des élèves (Batch) ---->|-- Dédoublonnage Automatique -|
       |-- Consultation Dashboard ---->|-- Requête SQL par ParentID --|
       |-- Envoi Message Chat -------->|-- Insertion & Realtime ------|
```

---

## 🔐 Sécurité et Rôles

Le système utilise un RBAC (Role-Based Access Control) strict :

| Rôle | Capacités |
|------|-----------|
| **Directeur** | Accès total, KPIS, Gestion de la base, Messagerie. |
| **Comptable** | Enregistrement paiements, Analyses, Messagerie "Comptabilité". |
| **Proviseur/Censeur** | Consultation, Documents, Messagerie "Administration". |
| **Parent** | Consultation propre, Recherche & Liaison d'enfants, Chat. |

---

## 🚀 Déploiement (CI/CD)
Le projet est configuré pour un déploiement automatique via **GitHub + Render** :
- Tout commit sur la branche `main` déclenche un build Frontend et un redémarrage Backend.
- La base de données Supabase est persistante et accessible 24/7.

---

## 🔐 Identifiants Officiels (Accès Production)

| Compte | Identifiant | Mot de passe |
|--------|-------------|--------------|
| **Directeur Général** | `0001` | `admin123` |
| **Comptable Principal** | `0002` | `compta123` |
| **Proviseur** | `0003` | `proviseur123` |
| **Censeur** | `0004` (à créer) | `censeur123` |

---

## 📋 Règles Critiques de Développement
1.  **NE JAMAIS** coder d'identifiants en dur (utiliser `.env`).
2.  **UNICITÉ** : Toujours utiliser l'ID élève comme clé primaire.
3.  **PRODUCTION** : Ne plus utiliser de stockage local (`localStorage`) pour les données sensibles, uniquement pour le Token JWT.
4.  **SYNC** : Toute modification majeure dans le frontend doit être synchronisée via `syncToBackend`.
