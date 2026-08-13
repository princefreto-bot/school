// ============================================================
// CONFIGURATION DES CLASSES ET ÉCOLAGES
// ============================================================
import { ClassConfig, Cycle, PeriodeType } from '../types';

export const CLASS_CONFIG: ClassConfig[] = [
  // Primaire — 50 000 FCFA
  { name: 'CP1', cycle: 'Primaire', ecolage: 50000 },
  { name: 'CP2', cycle: 'Primaire', ecolage: 50000 },
  { name: 'CE1', cycle: 'Primaire', ecolage: 50000 },
  { name: 'CE2', cycle: 'Primaire', ecolage: 50000 },
  { name: 'CM1', cycle: 'Primaire', ecolage: 50000 },
  
  // Primaire / Maternelle — 55 000 FCFA
  { name: 'CI',  cycle: 'Primaire', ecolage: 55000 },
  { name: 'CI 1', cycle: 'Primaire', ecolage: 55000 },
  { name: 'CI 2', cycle: 'Primaire', ecolage: 55000 },
  { name: 'CM2', cycle: 'Primaire', ecolage: 55000 },

  // Collège — 60 000 FCFA
  { name: '6EME', cycle: 'Collège', ecolage: 60000 },
  { name: '5EME', cycle: 'Collège', ecolage: 60000 },
  { name: '4EME', cycle: 'Collège', ecolage: 60000 },
  
  // Collège — 70 000 FCFA
  { name: '3EME', cycle: 'Collège', ecolage: 70000 },

  // Lycée — 75 000 FCFA
  { name: '2nde S',  cycle: 'Lycée', ecolage: 75000 },
  { name: '2nde A4', cycle: 'Lycée', ecolage: 75000 },

  // Lycée — 85 000 FCFA
  { name: '1er A4', cycle: 'Lycée', ecolage: 85000 },
  { name: '1er D',  cycle: 'Lycée', ecolage: 85000 },

  // Lycée — 95 000 FCFA
  { name: 'Tle A4', cycle: 'Lycée', ecolage: 95000 },
  { name: 'Tle D',  cycle: 'Lycée', ecolage: 95000 },
];

// Normalise pour la recherche flexible (essentiel pour Excel)
const normalize = (s: string): string => {
  if (!s) return '';
  let n = String(s).toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire accents
    .replace(/[^a-z0-9]/g, '');                       // retire tout sauf alphanum
  
  // Harmoniser les variations (ex: 1er vs 1ere, 6e vs 6eme)
  n = n.replace(/1ere/g, '1er');
  n = n.replace(/ere/g, 'er');
  n = n.replace(/eme/g, 'e');
  return n;
};

export const getClassConfig = (className: string): ClassConfig | undefined => {
  const key = normalize(className);
  // On priorise la correspondance exacte (normalisée)
  return CLASS_CONFIG.find((c) => normalize(c.name) === key);
};

export const getEcolage = (className: string): number => {
  const config = getClassConfig(className);
  return config ? config.ecolage : 60000;
};

// Variante consciente des frais personnalisés par école (voir Paramètres > Frais de
// scolarité). `overrides` est une map { nomDeClasseNormalisé: montant } — une classe sans
// entrée retombe sur le tarif générique de CLASS_CONFIG. Fonction pure (pas d'accès au
// store) pour rester utilisable depuis n'importe quel module sans risque d'import circulaire.
export const getEffectiveEcolage = (className: string, overrides?: Record<string, number> | null): number => {
  if (overrides) {
    const key = normalize(className);
    const override = Object.entries(overrides).find(([k]) => normalize(k) === key);
    if (override && typeof override[1] === 'number' && !Number.isNaN(override[1])) {
      return override[1];
    }
  }
  return getEcolage(className);
};

// Frais d'inscription : contrairement à l'écolage, pas de tarif générique par défaut — les
// frais d'inscription varient trop d'une école à l'autre pour en inventer un. Une classe sans
// entrée dans `overrides` (voir Paramètres > Frais d'inscription) vaut 0, jamais un montant
// deviné.
export const getEffectiveFraisInscription = (className: string, overrides?: Record<string, number> | null): number => {
  if (overrides) {
    const key = normalize(className);
    const override = Object.entries(overrides).find(([k]) => normalize(k) === key);
    if (override && typeof override[1] === 'number' && !Number.isNaN(override[1])) {
      return override[1];
    }
  }
  return 0;
};

export const getCycle = (className: string): Cycle => {
  const config = getClassConfig(className);
  return config ? config.cycle : 'Primaire';
};

// Périodes valides pour une classe donnée — dérivées directement du cycle
// (jamais via un élève trouvé, qui peut être absent ou avoir un cycle périmé).
// Un cycle Lycée ne voit jamais Trimestre, un cycle Primaire/Collège ne voit
// jamais Semestre — jamais les deux à la fois, contrairement à l'ancien
// comportement qui retombait sur les 5 périodes quand aucun élève n'était trouvé.
export const getAvailablePeriods = (className: string): PeriodeType[] => {
  const cycle = getCycle(className);
  return cycle === 'Lycée'
    ? ['SEMESTRE 1', 'SEMESTRE 2']
    : ['TRIMESTRE 1', 'TRIMESTRE 2', 'TRIMESTRE 3'];
};

export const CYCLES: Cycle[] = ['Primaire', 'Collège', 'Lycée'];

export const CLASSES_BY_CYCLE: Record<Cycle, string[]> = {
  Primaire: CLASS_CONFIG.filter((c) => c.cycle === 'Primaire').map((c) => c.name),
  Collège:  CLASS_CONFIG.filter((c) => c.cycle === 'Collège').map((c) => c.name),
  Lycée:    CLASS_CONFIG.filter((c) => c.cycle === 'Lycée').map((c) => c.name),
};
