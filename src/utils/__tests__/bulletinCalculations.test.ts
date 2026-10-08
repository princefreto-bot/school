import { describe, it, expect } from 'vitest';
import { calculerBulletinsClasse, getPeriodesAntérieures } from '../bulletinCalculations';
import type { Student, Matiere, ClasseMatiere, Note } from '../../types';

const eleve = (id: string, nom: string, prenom: string): Student =>
  ({ id, nom, prenom, classe: '3EME', sexe: 'M', historiquesPaiements: [] } as unknown as Student);

const matieres: Matiere[] = [
  { id: 'm1', nom: 'ANGLAIS', categorie: '1-MATIERES LITTERAIRES' },
  { id: 'm2', nom: 'MATHS', categorie: '2-MATIERES SCIENTIFIQUES' },
];
const coefs: ClasseMatiere[] = [
  { id: 'c1', classe: '3EME', matiereId: 'm1', professeur: 'M. A', coefficient: 2 },
  { id: 'c2', classe: '3EME', matiereId: 'm2', professeur: 'M. B', coefficient: 3 },
];
const note = (id: string, eleveId: string, matiereId: string, nc: number, nd: number, ncp: number): Note =>
  ({ id, eleveId, matiereId, periode: 'TRIMESTRE 1', noteClasse: nc, noteDevoir: nd, noteCompo: ncp });

describe('getPeriodesAntérieures', () => {
  it('ne cumule que sur la dernière période de l’année', () => {
    expect(getPeriodesAntérieures('TRIMESTRE 1')).toEqual([]);
    expect(getPeriodesAntérieures('TRIMESTRE 2')).toEqual([]);
    expect(getPeriodesAntérieures('TRIMESTRE 3')).toEqual(['TRIMESTRE 1', 'TRIMESTRE 2']);
    expect(getPeriodesAntérieures('SEMESTRE 1')).toEqual([]);
    expect(getPeriodesAntérieures('SEMESTRE 2')).toEqual(['SEMESTRE 1']);
  });
});

describe('calculerBulletinsClasse', () => {
  const students = [eleve('e1', 'SOUNA', 'Afdel'), eleve('e2', 'TOUDJANI', 'Chamsia'), { ...eleve('e3', 'AUTRE', 'Classe'), classe: '4EME' } as Student];
  const notes = [
    note('n1', 'e1', 'm1', 12, 14, 13), note('n2', 'e1', 'm2', 15, 16, 14),
    note('n3', 'e2', 'm1', 9, 10, 8), note('n4', 'e2', 'm2', 11, 12, 10),
  ];
  const res = calculerBulletinsClasse('3EME', 'TRIMESTRE 1', students, matieres, coefs, notes);
  const byName = Object.fromEntries(res.map((b) => [b.eleve.nom, b]));

  it('ne prend que les élèves de la classe', () => {
    expect(res).toHaveLength(2);
    expect(res.every((b) => b.effectifClasse === 2)).toBe(true);
  });

  it('calcule les moyennes générales pondérées (valeurs de référence)', () => {
    expect(byName.SOUNA.moyenneGenerale).toBeCloseTo(14.05, 2);
    expect(byName.TOUDJANI.moyenneGenerale).toBeCloseTo(9.95, 2);
    expect(byName.SOUNA.totalCoefsGeneral).toBe(5);
  });

  it('classe les élèves et calcule les statistiques de classe', () => {
    expect(byName.SOUNA.rangGeneral).toBe('1er');
    expect(byName.TOUDJANI.rangGeneral).toBe('2ème');
    expect(byName.SOUNA.moyenneMax).toBeCloseTo(14.05, 2);
    expect(byName.SOUNA.moyenneMin).toBeCloseTo(9.95, 2);
    expect(byName.SOUNA.moyenneClasse).toBeCloseTo(12, 2);
  });

  it('reporte le nom du professeur saisi dans les coefficients', () => {
    const lignes = byName.SOUNA.categories.flatMap((c) => c.lignes);
    expect(lignes.find((l) => l.matiere.id === 'm1')?.professeur).toBe('M. A');
  });
});
