// ============================================================
// ÉLIGIBILITÉ EXAMEN — classes concernées par un examen national
// (CM2→CEPD, 3ème→BEPC, 1ère→BAC 1, Terminale→BAC 2), toutes
// sections confondues (ex: Tle A4 et Tle D sont toutes deux BAC 2).
// Détection par préfixe du nom de classe, indépendante de la
// config des cycles (classConfig.ts) pour couvrir toute série non
// répertoriée (ex: Tle C, 1ère A).
// ============================================================

export type ExamType = 'CEPD' | 'BEPC' | 'BAC 1' | 'BAC 2';

export const getExamenForClasse = (classe: string): ExamType | null => {
  if (!classe) return null;
  const lower = classe.trim().toLowerCase();

  if (lower.startsWith('cm2')) {
    return 'CEPD';
  }
  if (lower.startsWith('3ème') || lower.startsWith('3e') || lower.startsWith('3eme')) {
    return 'BEPC';
  }
  if (lower.startsWith('1ère') || lower.startsWith('1ere') || lower.startsWith('1e') || lower.startsWith('première') || lower.startsWith('premiere')) {
    return 'BAC 1';
  }
  if (lower.startsWith('terminale') || lower.startsWith('tle')) {
    return 'BAC 2';
  }
  return null;
};

export const isExamClass = (classe: string): boolean => getExamenForClasse(classe) !== null;
