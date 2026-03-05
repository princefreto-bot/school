import { ClassInfo } from '../types';

export const CLASSES: ClassInfo[] = [
  // Primaire
  { nom: 'CP1', cycle: 'Primaire', ecolage: 50000 },
  { nom: 'CP2', cycle: 'Primaire', ecolage: 50000 },
  { nom: 'CE1', cycle: 'Primaire', ecolage: 55000 },
  { nom: 'CE2', cycle: 'Primaire', ecolage: 55000 },
  { nom: 'CM1', cycle: 'Primaire', ecolage: 60000 },
  { nom: 'CM2', cycle: 'Primaire', ecolage: 60000 },
  // Collège
  { nom: '6ème', cycle: 'Collège', ecolage: 75000 },
  { nom: '5ème', cycle: 'Collège', ecolage: 75000 },
  { nom: '4ème', cycle: 'Collège', ecolage: 80000 },
  { nom: '3ème', cycle: 'Collège', ecolage: 85000 },
  // Lycée
  { nom: '2nde A', cycle: 'Lycée', ecolage: 95000 },
  { nom: '2nde C', cycle: 'Lycée', ecolage: 100000 },
  { nom: '1ère A', cycle: 'Lycée', ecolage: 100000 },
  { nom: '1ère C', cycle: 'Lycée', ecolage: 105000 },
  { nom: '1ère D', cycle: 'Lycée', ecolage: 105000 },
  { nom: 'Tle A', cycle: 'Lycée', ecolage: 110000 },
  { nom: 'Tle C', cycle: 'Lycée', ecolage: 115000 },
  { nom: 'Tle D', cycle: 'Lycée', ecolage: 115000 },
  { nom: 'Tle G2', cycle: 'Lycée', ecolage: 120000 },
];

export const getEcolageByClass = (className: string): number => {
  const classInfo = CLASSES.find(c => c.nom.toLowerCase() === className.toLowerCase());
  return classInfo?.ecolage || 75000;
};

export const getCycleByClass = (className: string): 'Primaire' | 'Collège' | 'Lycée' => {
  const classInfo = CLASSES.find(c => c.nom.toLowerCase() === className.toLowerCase());
  return classInfo?.cycle || 'Collège';
};

export const getClassesByCycle = (cycle: 'Primaire' | 'Collège' | 'Lycée'): ClassInfo[] => {
  return CLASSES.filter(c => c.cycle === cycle);
};
