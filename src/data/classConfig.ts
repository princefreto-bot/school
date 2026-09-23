// ============================================================
// CONFIGURATION DES CLASSES ET ÉCOLAGES
// ============================================================
import { ClassConfig, Cycle, LyceeFiliere, PeriodeType } from '../types';

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

  // Lycée Moderne (A4 lettres/philo, S/D maths-sciences) — 75 000 FCFA
  { name: '2nde S',  cycle: 'Lycée', ecolage: 75000, filiere: 'Moderne' },
  { name: '2nde A4', cycle: 'Lycée', ecolage: 75000, filiere: 'Moderne' },
  // Lycée Technique (séries techniques/commerciales G1/G2/G3, C.D) — mêmes tarifs
  // génériques que les autres classes du même niveau ; chaque école ajuste via
  // Paramètres > Frais de scolarité (voir getEffectiveEcolage). Sans ces entrées,
  // une classe non reconnue retombe sur le cycle "Primaire" par défaut (getCycle) —
  // ce qui casserait le choix Semestre/Trimestre et les bulletins pour ces classes.
  { name: '2nde G1', cycle: 'Lycée', ecolage: 75000, filiere: 'Technique' },
  { name: '2nde G2', cycle: 'Lycée', ecolage: 75000, filiere: 'Technique' },
  { name: '2nde G3', cycle: 'Lycée', ecolage: 75000, filiere: 'Technique' },
  { name: '2nde CD', cycle: 'Lycée', ecolage: 75000, filiere: 'Technique' },

  // Lycée — 85 000 FCFA
  { name: '1er A4', cycle: 'Lycée', ecolage: 85000, filiere: 'Moderne' },
  { name: '1er D',  cycle: 'Lycée', ecolage: 85000, filiere: 'Moderne' },
  // 1ère G1/G2/G3 : trois classes distinctes (jamais "G2 ET G3" combinée — corrigé
  // le 2026-09-16, la colonne "statut" du fichier source de DINO GOLO indiquait en
  // réalité G2/G3 par élève, pas une vraie classe unique).
  { name: '1ere G1', cycle: 'Lycée', ecolage: 95000, filiere: 'Technique' },
  { name: '1ere G2', cycle: 'Lycée', ecolage: 95000, filiere: 'Technique' },
  { name: '1ere G3', cycle: 'Lycée', ecolage: 95000, filiere: 'Technique' },

  // Lycée — 95 000 FCFA
  { name: 'Tle A4', cycle: 'Lycée', ecolage: 95000, filiere: 'Moderne' },
  { name: 'Tle D',  cycle: 'Lycée', ecolage: 95000, filiere: 'Moderne' },
  { name: 'Tle G2', cycle: 'Lycée', ecolage: 95000, filiere: 'Technique' },
  { name: 'Tle G3', cycle: 'Lycée', ecolage: 95000, filiere: 'Technique' },
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

// Sous-catégorie Lycée (Moderne / Technique) — null pour Primaire/Collège ou une
// classe non reconnue. Dérivée à la volée depuis le nom de classe, jamais stockée
// sur l'élève (comme `cycle` l'est) : un établissement qui ajoute/renomme ses séries
// techniques n'a donc rien à migrer, la répartition se recalcule automatiquement.
export const getFiliere = (className: string): LyceeFiliere | null => {
  const config = getClassConfig(className);
  return config?.filiere ?? null;
};

// Variante consciente des frais personnalisés par école (voir Paramètres > Frais de
// scolarité). `overrides` est une map { nomDeClasseNormalisé: montant } — une classe sans
// entrée retombe sur le tarif générique de CLASS_CONFIG. Fonction pure (pas d'accès au
// store) pour rester utilisable depuis n'importe quel module sans risque d'import circulaire.
// `statutElv` : certaines écoles (ex. DINO GOLO) facturent un tarif différent aux élèves
// NOUVEAU — stocké sous la clé suffixée `"<classe> NOUVEAU"` dans `overrides` pour rester
// 100% additif (aucune migration de schéma, aucune école existante affectée : sans cette
// clé, le comportement est identique à avant). Repli sur la clé de classe normale si absente.
export const getEffectiveEcolage = (
  className: string,
  overrides?: Record<string, number> | null,
  statutElv?: string | null
): number => {
  if (overrides) {
    if (statutElv === 'NOUVEAU') {
      const nouveauKey = normalize(`${className} NOUVEAU`);
      const nouveauOverride = Object.entries(overrides).find(([k]) => normalize(k) === nouveauKey);
      if (nouveauOverride && typeof nouveauOverride[1] === 'number' && !Number.isNaN(nouveauOverride[1])) {
        return nouveauOverride[1];
      }
    }
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

// Les frais d'inscription ne concernent QUE les élèves nouveaux à l'ÉTABLISSEMENT
// (statutElv, un statut FINANCIER : nouveau/ancien) — jamais un ancien, même s'il
// redouble sa classe cette année. Le redoublement (`Student.redoublant`) est un statut
// ACADÉMIQUE indépendant, propre à la classe, sans lien avec les frais d'inscription :
// un élève peut être nouveau à l'établissement en redoublant sa classe (ex. transfert
// après un échec ailleurs), ou ancien tout en progressant normalement. `statutElv`
// absent (élèves importés/historiques, avant l'existence de ce champ) est traité comme
// "ancien" par sécurité — jamais facturé par défaut, y compris lors d'un changement de
// classe (promotion) ou d'un recalcul en masse des tarifs.
export const isSubjectToRegistrationFee = (statutElv?: string | null): boolean => statutElv === 'NOUVEAU';

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

// Classe suivante par défaut (rentrée / promotion des élèves d'une année sur l'autre —
// voir Paramètres > Années scolaires > Promouvoir les élèves). `null` = pas de suite
// automatique fiable : le passage en 3ème choisit une filière (Moderne/Technique), et les
// classes Tle sont terminales (l'élève quitte l'établissement après le bac). Le directeur
// reste toujours libre d'ajuster la classe cible manuellement avant de valider.
const NEXT_CLASS: Record<string, string | null> = {
  'CI': 'CI 1',
  'CI 1': 'CI 2',
  'CI 2': 'CP1',
  'CP1': 'CP2',
  'CP2': 'CE1',
  'CE1': 'CE2',
  'CE2': 'CM1',
  'CM1': 'CM2',
  'CM2': '6EME',
  '6EME': '5EME',
  '5EME': '4EME',
  '4EME': '3EME',
  '3EME': null, // choix de filière (2nde S/A4/G1/G2/G3/CD) — à sélectionner manuellement
  '2nde S': '1er D',
  '2nde A4': '1er A4',
  '2nde G1': '1ere G1',
  '2nde G2': '1ere G2',
  '2nde G3': '1ere G3',
  '2nde CD': null, // pas de classe de suite standard définie — à choisir manuellement
  '1er A4': 'Tle A4',
  '1er D': 'Tle D',
  '1ere G1': null, // pas de "Tle G1" dans la configuration — à choisir manuellement
  '1ere G2': 'Tle G2',
  '1ere G3': 'Tle G3',
  'Tle A4': null,
  'Tle D': null,
  'Tle G2': null,
  'Tle G3': null,
};

export const getNextClass = (className: string): string | null => {
  const config = getClassConfig(className);
  if (!config) return null;
  return NEXT_CLASS[config.name] ?? null;
};

export const CYCLES: Cycle[] = ['Primaire', 'Collège', 'Lycée'];

export const CLASSES_BY_CYCLE: Record<Cycle, string[]> = {
  Primaire: CLASS_CONFIG.filter((c) => c.cycle === 'Primaire').map((c) => c.name),
  Collège:  CLASS_CONFIG.filter((c) => c.cycle === 'Collège').map((c) => c.name),
  Lycée:    CLASS_CONFIG.filter((c) => c.cycle === 'Lycée').map((c) => c.name),
};
