// Année scolaire "par défaut" calculée dynamiquement — évite une chaîne codée en dur
// qui devient fausse à chaque rentrée. Bascule sur l'année suivante à partir d'août,
// cohérent avec le calendrier scolaire togolais (rentrée ~septembre).
// Miroir de src/utils/helpers.ts::getCurrentAcademicYear côté frontend.
function getCurrentAcademicYear() {
    const now = new Date();
    const year = now.getFullYear();
    const isNewSchoolYearStarted = now.getMonth() >= 7; // 7 = août (0-indexé)
    return isNewSchoolYearStarted ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

module.exports = { getCurrentAcademicYear };
