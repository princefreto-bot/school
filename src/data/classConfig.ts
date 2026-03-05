// ============================================================
// CONFIGURATION DES CLASSES ET ÉCOLAGES
// ============================================================
import { ClassConfig, Cycle } from '../types';

export const CLASS_CONFIG: ClassConfig[] = [
  // Primaire — 50 000 FCFA
  { name: 'CP1', cycle: 'Primaire', ecolage: 50000 },
  { name: 'CP2', cycle: 'Primaire', ecolage: 50000 },
  { name: 'CE1', cycle: 'Primaire', ecolage: 50000 },
  { name: 'CE2', cycle: 'Primaire', ecolage: 50000 },
  { name: 'CM1', cycle: 'Primaire', ecolage: 50000 },
  // Primaire — 55 000 FCFA
  { name: 'CI',  cycle: 'Primaire', ecolage: 55000 },
  { name: 'CI 1', cycle: 'Primaire', ecolage: 55000 },
  { name: 'CI 2', cycle: 'Primaire', ecolage: 55000 },
  { name: 'CM2', cycle: 'Primaire', ecolage: 55000 },
  // Collège — 60 000 FCFA
  { name: '6ème', cycle: 'Collège', ecolage: 60000 },
  { name: '5ème', cycle: 'Collège', ecolage: 60000 },
  { name: '4ème', cycle: 'Collège', ecolage: 60000 },
  // Collège — 70 000 FCFA
  { name: '3ème', cycle: 'Collège', ecolage: 70000 },
  // Lycée — 75 000 FCFA
  { name: '2nde S',  cycle: 'Lycée', ecolage: 75000 },
  { name: '2nde A4', cycle: 'Lycée', ecolage: 75000 },
  // Lycée — 85 000 FCFA
  { name: '1ère A4', cycle: 'Lycée', ecolage: 85000 },
  { name: '1ère D',  cycle: 'Lycée', ecolage: 85000 },
  // Lycée — 95 000 FCFA
  { name: 'Tle A4', cycle: 'Lycée', ecolage: 95000 },
  { name: 'Tle D',  cycle: 'Lycée', ecolage: 95000 },
];

// Normalise : retire accents, tirets, espaces, met en minuscule
// Gère les variantes Excel : "1ER A4" = "1ère A4", "TLE" = "Tle", "2NDE" = "2nde"
const normalize = (s: string): string => {
  let n = s.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire accents (è→e, é→e)
    .replace(/[^a-z0-9]/g, '');                       // retire tout sauf alphanum
  // Harmoniser les variantes courantes
  n = n.replace(/1ere/g, '1er');   // 1ère → 1er (config après accents = 1ere)
  n = n.replace(/1ere/g, '1er');
  n = n.replace(/eme$/g, 'em');    // 6ème → 6em, 6EME → 6em  
  n = n.replace(/eme(\d)/g, 'em$1');
  return n;
};

export const getClassConfig = (className: string): ClassConfig | undefined => {
  const key = normalize(className);
  return CLASS_CONFIG.find((c) => normalize(c.name) === key);
};

export const getEcolage = (className: string): number => {
  const config = getClassConfig(className);
  return config ? config.ecolage : 60000;
};

export const getCycle = (className: string): Cycle => {
  const config = getClassConfig(className);
  return config ? config.cycle : 'Primaire';
};

export const CYCLES: Cycle[] = ['Primaire', 'Collège', 'Lycée'];

export const CLASSES_BY_CYCLE: Record<Cycle, string[]> = {
  Primaire: CLASS_CONFIG.filter((c) => c.cycle === 'Primaire').map((c) => c.name),
  Collège:  CLASS_CONFIG.filter((c) => c.cycle === 'Collège').map((c) => c.name),
  Lycée:    CLASS_CONFIG.filter((c) => c.cycle === 'Lycée').map((c) => c.name),
};
