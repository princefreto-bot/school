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

// Re-export CLASSES from data/classes.ts
export { CLASSES } from '../data/classes';

// CLASSES as object structure for helpers
export const CLASSES_BY_CYCLE = {
  Primaire: ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2', 'CI', 'CI 1', 'CI 2'],
  Collège: ['6ème', '5ème', '4ème', '3ème'],
  Lycée: ['2nde A', '2nde C', '2nde D', '2nde S', '2nde A4', '1ère A', '1ère A4', '1ère C', '1ère D', 'Tle A', 'Tle A4', 'Tle C', 'Tle D', 'Tle G2']
};

// ECOLAGE_PAR_CLASSE mapping
export const ECOLAGE_PAR_CLASSE: Record<string, number> = CLASSES.reduce((acc, c) => {
  acc[c.nom] = c.ecolage;
  return acc;
}, {} as Record<string, number>);
