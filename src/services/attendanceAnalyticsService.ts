// ============================================================
// ATTENDANCE ANALYTICS SERVICE — Tendance des absences
// ============================================================
import { Student, Presence } from '../types';

export interface AbsenceTrendPoint {
  date: string; // YYYY-MM-DD
  label: string; // JJ/MM pour l'affichage
  presenceRate: number; // %
  absenceRate: number; // %
  presentCount: number;
  totalStudents: number;
}

/**
 * Calcule le taux d'absence quotidien sur les `days` derniers jours (calendaires,
 * week-ends inclus — un jour sans aucun scan y apparaît à 0% de présence plutôt
 * que d'être omis, ce qui reste correct puisqu'aucune école ne devrait avoir un
 * taux de présence non nul un jour sans cours : à l'usage, ces jours sont
 * simplement visibles comme des creux naturels sur la courbe).
 * Présent = au moins un scan d'ENTRÉE ce jour-là (même logique que
 * getPresencesToday() dans useStore.ts).
 */
export const computeAbsenceTrend = (
  students: Student[],
  presences: Presence[],
  days: number = 14
): AbsenceTrendPoint[] => {
  const totalStudents = students.length;
  const points: AbsenceTrendPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];

    const presentIds = new Set(
      presences
        .filter(p => p.date === dateKey && (p.type === 'ENTREE' || !p.type))
        .map(p => p.eleveId)
    );
    const presentCount = presentIds.size;
    const presenceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

    points.push({
      date: dateKey,
      label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      presenceRate,
      absenceRate: totalStudents > 0 ? 100 - presenceRate : 0,
      presentCount,
      totalStudents
    });
  }

  return points;
};

/**
 * Ne garde que les jours où au moins un scan a eu lieu (élimine les week-ends /
 * jours fériés / vacances de la courbe pour ne pas fausser visuellement la
 * tendance avec des creux à 0% qui ne reflètent pas un vrai jour de classe).
 */
export const filterSchoolDays = (points: AbsenceTrendPoint[]): AbsenceTrendPoint[] =>
  points.filter(p => p.presentCount > 0);
