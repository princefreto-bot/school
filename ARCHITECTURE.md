# 🏫 GestioSchool — Architecture du projet
> Fichier de référence. À consulter avant toute modification.
> Dernière mise à jour : 2025

---

## 📁 Arborescence complète

```
gestioschool/
├── public/
│   └── vite.svg
├── src/
│   ├── components/           # Composants réutilisables
│   │   ├── Login.tsx         # Page de connexion (JWT simulé)
│   │   ├── Layout.tsx        # Shell principal (sidebar + header)
│   │   └── StudentDetail.tsx # Modal fiche détaillée d'un élève
│   │
│   ├── pages/                # Pages principales (une par route)
│   │   ├── Dashboard.tsx     # Tableau de bord + KPIs + graphiques
│   │   ├── Eleves.tsx        # Liste, import Excel, CRUD élèves
│   │   ├── Paiements.tsx     # Historique et saisie des paiements
│   │   ├── Analyses.tsx      # Analyses financières avancées
│   │   ├── Documents.tsx     # Export PDF masse + Excel
│   │   └── Parametres.tsx    # Réglages école + messages PDF
│   │
│   ├── store/
│   │   └── useStore.ts       # Store global Zustand (état app complet)
│   │
│   ├── data/
│   │   └── classConfig.ts    # Configuration des 19 classes + écolages
│   │
│   ├── types/
│   │   └── index.ts          # Types TypeScript centralisés
│   │
│   ├── utils/
│   │   ├── excelImport.ts    # Import fichier Excel (feuille 2, col B→L)
│   │   ├── excelExport.ts    # Export Excel mis à jour
│   │   └── pdfGenerator.ts   # Génération PDF (reçu, fiche, masse)
│   │
│   ├── App.tsx               # Routeur principal (login → pages)
│   ├── main.tsx              # Point d'entrée React
│   └── index.css             # Tailwind CSS v4
│
├── ARCHITECTURE.md           # CE FICHIER — référence du projet
├── index.html                # HTML racine (titre, meta)
├── package.json              # Dépendances npm
├── tsconfig.json             # Config TypeScript
└── vite.config.ts            # Config Vite
```

---

## 🗂️ Rôle de chaque fichier clé

### `src/types/index.ts`
Types centralisés partagés dans tout le projet :
- `Student` — données complètes d'un élève
- `Payment` — enregistrement d'un paiement
- `User` — compte admin/comptable
- `Cycle` — `'Primaire' | 'Collège' | 'Lycée'`
- `StudentStatus` — `'Soldé' | 'Partiel' | 'Non soldé'`
- `ClassConfig` — nom + cycle + écolage d'une classe
- `AppSettings` — paramètres école (nom, année, messages PDF)

### `src/data/classConfig.ts`
Source de vérité des 19 classes et leurs écolages.
**Ne jamais modifier les noms de classe** sans mettre à jour l'import Excel.

| Cycle | Classes | Écolage |
|-------|---------|---------|
| Primaire | CP1, CP2, CE1, CE2, CM1 | 50 000 F |
| Primaire | CI, CI 1, CI 2, CM2 | 55 000 F |
| Collège | 6ème, 5ème, 4ème | 60 000 F |
| Collège | 3ème | 70 000 F |
| Lycée | 2nde S, 2nde A4 | 75 000 F |
| Lycée | 1ère A4, 1ère D | 85 000 F |
| Lycée | Tle A4, Tle D | 95 000 F |

### `src/store/useStore.ts`
Store Zustand — état global de l'application.

**State principal :**
- `students[]` — liste de tous les élèves
- `payments[]` — historique de tous les paiements
- `currentUser` — utilisateur connecté (null = déconnecté)
- `settings` — paramètres école
- `filters` — filtres actifs (cycle, classe, statut, recherche)
- `selectedStudent` — élève sélectionné pour la fiche détaillée
- `currentPage` — page active (navigation sans react-router)

**Actions principales :**
- `login(id, pass)` / `logout()`
- `importStudents(students[])` — import depuis Excel
- `addStudent()` / `updateStudent()` / `deleteStudent()`
- `addPayment()` — enregistrer un paiement
- `setFilters()` / `setCurrentPage()` / `setSelectedStudent()`

### `src/utils/excelImport.ts`
- Lit la **feuille 2** (index 1) du fichier Excel
- Colonnes : B=Noms, C=Prénoms, D=Classe, E=Téléphone, F=Sexe, G=Redoublant, H=École provenance, I=Écolage, J=Déjà payé, K=Restant, L=Reçu
- Données à partir de la **ligne 2** (index 1 en 0-based)
- Calcule automatiquement le `status` et le `cycle`

### `src/utils/pdfGenerator.ts`
Fonctions exportées :
- `generateRecuPDF(student, settings)` — reçu individuel
- `generateFicheCompletePDF(student, settings)` — fiche détaillée
- `generateClassePDF(students[], classe, settings)` — PDF d'une classe
- `generateNonSoldesPDF(students[], settings)` — PDF non soldés
- `generateGlobalPDF(students[], settings)` — PDF tous élèves

**Règles badges PDF :**
- `restant === 0` → Badge vert "✅ Élève Soldé" + message remerciement
- `dejaPaye/ecolage >= 70%` → Badge bleu "2ᵉ Tranche Validée"
- Sinon → Badge orange "⚠️ Non soldé" + message rappel + montant restant

### `src/components/Login.tsx`
- Comptes démo : `admin / admin123` et `comptable / compta123`
- Rôles : `admin` (accès complet) | `comptable` (lecture + paiements)
- ⚠️ En production : remplacer par JWT + bcrypt côté backend

### `src/App.tsx`
Navigation sans react-router. Utilise `currentPage` du store.
Pages disponibles : `dashboard | eleves | paiements | analyses | documents | parametres`

---

## 🔄 Flux de données

```
Fichier Excel (.xlsx)
       ↓ excelImport.ts (feuille 2)
  students[] dans le Store (Zustand)
       ↓
  Pages (Dashboard, Élèves, Analyses...)
       ↓
  pdfGenerator.ts → PDF téléchargé
  excelExport.ts  → Excel téléchargé
  WhatsApp link   → wa.me/+228...
```

---

## 📦 Dépendances principales

| Package | Usage |
|---------|-------|
| `react` + `typescript` | Framework UI |
| `tailwindcss` v4 | Style |
| `zustand` | État global |
| `recharts` | Graphiques |
| `xlsx` (SheetJS) | Import/Export Excel |
| `jspdf` + `jspdf-autotable` | Génération PDF |
| `lucide-react` | Icônes |

---

## 🚀 Lancer le projet

```bash
# Installation
npm install

# Développement
npm run dev
# → http://localhost:5173

# Build production
npm run build

# Prévisualiser le build
npm run preview
```

---

## 🔐 Comptes de test

| Rôle | Login | Mot de passe |
|------|-------|-------------|
| Admin | `admin` | `admin123` |
| Comptable | `comptable` | `compta123` |

---

## 📋 Règles de développement

1. **Ne jamais modifier** `package.json` ou `vite.config.ts` directement
2. **Types** → toujours dans `src/types/index.ts`
3. **Config classes** → uniquement dans `src/data/classConfig.ts`
4. **État global** → passer par le store Zustand, jamais de state local pour les données métier
5. **Nouveaux composants** → `src/components/NomComposant.tsx`
6. **Nouvelles pages** → `src/pages/NomPage.tsx` + ajouter dans `App.tsx` + Layout sidebar
7. **PDF** → ajouter dans `src/utils/pdfGenerator.ts` uniquement
8. **Excel** → `src/utils/excelImport.ts` (import) et `src/utils/excelExport.ts` (export)

---

## 🗺️ Roadmap extensions futures

- [ ] Backend Node.js + Express + PostgreSQL
- [ ] Authentification JWT + bcrypt réelle
- [ ] Module Notes / Bulletins
- [ ] Module Absences
- [ ] Module Emploi du temps
- [ ] WhatsApp API Business (envoi automatique)
- [ ] Notifications push
- [ ] Mode hors-ligne (PWA)
- [ ] Multi-établissement
