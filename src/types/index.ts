// ============================================================
// TYPES PRINCIPAUX — EduFinance
// ============================================================

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
}

export interface ClassConfig {
  name: string;
  cycle: Cycle;
  ecolage: number;
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
  role: 'admin' | 'directeur' | 'proviseur' | 'censeur' | 'superviseur' | 'comptable' | 'parent';
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

export type AppPage =
  | 'dashboard'
  | 'eleves'
  | 'paiements'
  | 'analyses'
  | 'documents'
  | 'parametres'
  | 'recouvrement'
  | 'parent_dashboard'
  | 'parent_historique'
  | 'parent_recus'
  | 'parent_badges'
  | 'parent_messages'
  | 'parents_list'
  | 'chat';
