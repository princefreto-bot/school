// ============================================================
// TYPES PRINCIPAUX — EduFinance
// ============================================================

import { CLASSES } from '../data/classes';

export type Cycle = 'Primaire' | 'Collège' | 'Lycée';

export type PaymentStatus = 'Soldé' | 'Partiel' | 'Non soldé';

export interface Student {
  id: string;
  nom: string;
  prenom: string;
  classe: string;
  telephone: string;
  parentId?: string;
  sexe: 'M' | 'F';
  redoublant: boolean;
  ecoleProvenance: string;
  ecolage: number;
  dejaPaye: number;
  restant: number;
  recu: string;
  cycle: Cycle;
  status: PaymentStatus;
  historiquesPaiements: Payment[];
  paiements?: Payment[];
  dateInscription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  studentId: string;
  montant: number;
  date: string;
  recu: string;
  mode?: string;
  reference?: string;
  commentaire?: string;
  note?: string;
  methode?: string;
}

export interface ClassConfig {
  name: string;
  cycle: Cycle;
  ecolage: number;
}

export type StatusPaiement = 'solde' | 'tranche_validee' | 'tranche_partielle' | 'non_solde';

export interface ClassStats {
  classe: string;
  cycle: Cycle;
  totalEleves: number;
  effectif: number;
  totalEcolage: number;
  ecolageTotal: number;
  totalPaye: number;
  paye: number;
  totalRestant: number;
  restant: number;
  tauxRecouvrement: number;
}

export interface AdminSettings {
  seuilDeuxiemeTranche: number;
  schoolName: string;
  schoolYear: string;
  messageRemerciement: string;
  messageRappel: string;
}

export interface AppSettings {
  seuilDeuxiemeTranche: number;
  schoolName: string;
  schoolYear: string;
  messageRemerciement: string;
  messageRappel: string;
  currency: string;
  nomEcole: string;
  anneScolaire: string;
  adresse: string;
  telephone: string;
  email: string;
  badgeParentResponsable: string;
  badge2emeTranche: string;
}

export interface DashboardStats {
  totalEleves: number;
  totalPrimaire: number;
  totalCollege: number;
  totalLycee: number;
  totalEcolageAttendu: number;
  totalDejaPaye: number;
  totalRestant: number;
  tauxRecouvrement: number;
  elevesSoldes: number;
  elevesNonSoldes: number;
}

export interface User {
  id: string;
  username: string; // phone number for parents
  role: 'admin' | 'directeur' | 'directeur_general' | 'proviseur' | 'censeur' | 'superviseur' | 'comptable' | 'parent';
  nom: string;
  telephone?: string;
}

export interface Parent {
  id: string;
  nom: string;
  telephone: string; // serves as username
  password?: string;
  createdAt: string;
}

// ── Présences (pointage QR) ──────────────────────────────
export interface Presence {
  id: string;
  eleveId: string;
  eleveNom: string;
  elevePrenom: string;
  eleveClasse: string;
  date: string;      // YYYY-MM-DD
  heure: string;     // HH:mm:ss
  statut: 'present' | 'absent' | 'retard';
}

// ── Logs d'activité ──────────────────────────────────────
export interface ActivityLog {
  id: string;
  utilisateur: string;
  utilisateurRole: string;
  action: 'connexion' | 'paiement' | 'modification_eleve' | 'generation_recu' | 'presence' | 'import' | 'export' | 'suppression' | 'autre';
  description: string;
  dateHeure: string;  // ISO string
  metadata?: Record<string, any>;
}

// ── Vérification de reçu ─────────────────────────────────
export interface ReceiptVerification {
  code: string;       // REC-ANNEE-NUMERO
  studentId: string;
  eleveNom: string;
  elevePrenom: string;
  eleveClasse: string;
  montant: number;
  date: string;
  tranche: string;
  statut: 'authentique' | 'invalide';
}

export type AppPage =
  | 'dashboard'
  | 'eleves'
  | 'paiements'
  | 'analyses'
  | 'documents'
  | 'parametres'
  | 'recouvrement'
  | 'scan_presence'
  | 'carte_scolaire'
  | 'verification_recu'
  | 'historique_activites'
  | 'parent_dashboard'
  | 'parent_historique'
  | 'parent_recus'
  | 'parent_badges'
  | 'parent_messages'
  | 'parents_list'
  | 'import_export'
  | 'chat';

// Les types de cycles existants
export const CYCLES: Cycle[] = ['Primaire', 'Collège', 'Lycée'];
