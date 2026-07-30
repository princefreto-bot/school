// ============================================================
// GÉNÉRATEUR DU GUIDE UTILISATEUR PDF — DGhubSchool
// Exécution : node scripts/generateUserGuide.cjs
// Sortie    : public/guides/DGhubSchool_Guide_Utilisateur.pdf
// ============================================================
const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;
const ACCENT = [217, 119, 6]; // amber, cohérent avec la charte DGhubSchool
const DARK = [15, 23, 42];
const GRAY = [100, 116, 139];
const LIGHT_LINE = [226, 232, 240];

const doc = new jsPDF({ unit: 'mm', format: 'a4' });

let pageNum = 0;
let sectionForFooter = '';

function addFooter() {
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('DGhubSchool — Guide utilisateur', MARGIN, PAGE_H - 10);
  doc.text(sectionForFooter, PAGE_W / 2, PAGE_H - 10, { align: 'center' });
  doc.text(String(pageNum), PAGE_W - MARGIN, PAGE_H - 10, { align: 'right' });
  doc.setDrawColor(...LIGHT_LINE);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14);
}

function newPage() {
  if (pageNum > 0) addFooter();
  doc.addPage();
  pageNum++;
  y = MARGIN;
}

let y = MARGIN;

function ensureSpace(h) {
  if (y + h > PAGE_H - 22) newPage();
}

function sectionTitle(num, title) {
  newPage();
  sectionForFooter = `${num}. ${title}`;
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, PAGE_W, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...ACCENT);
  doc.text(`SECTION ${num}`, MARGIN, y + 6);
  y += 12;
  doc.setFontSize(22);
  doc.setTextColor(...DARK);
  doc.text(title, MARGIN, y);
  y += 4;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, y, MARGIN + 30, y);
  y += 12;
}

function subTitle(text) {
  ensureSpace(14);
  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...DARK);
  doc.text(text, MARGIN, y);
  y += 3;
  doc.setDrawColor(...LIGHT_LINE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 7;
}

function paragraph(text) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 65, 75);
  const lines = doc.splitTextToSize(text, CONTENT_W);
  ensureSpace(lines.length * 5 + 4);
  doc.text(lines, MARGIN, y);
  y += lines.length * 5 + 4;
}

function bulletList(items) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  for (const item of items) {
    const lines = doc.splitTextToSize(item, CONTENT_W - 7);
    ensureSpace(lines.length * 5 + 2);
    doc.setTextColor(...ACCENT);
    doc.text('—', MARGIN, y);
    doc.setTextColor(60, 65, 75);
    doc.text(lines, MARGIN + 5, y);
    y += lines.length * 5 + 2;
  }
  y += 3;
}

function stepList(steps) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  steps.forEach((step, i) => {
    const lines = doc.splitTextToSize(step, CONTENT_W - 9);
    ensureSpace(lines.length * 5 + 2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...ACCENT);
    doc.text(`${i + 1}.`, MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 65, 75);
    doc.text(lines, MARGIN + 7, y);
    y += lines.length * 5 + 2;
  });
  y += 3;
}

function roleNote(text) {
  ensureSpace(14);
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.3);
  const lines = doc.splitTextToSize(text, CONTENT_W - 10);
  const h = lines.length * 4.6 + 6;
  doc.roundedRect(MARGIN, y, CONTENT_W, h, 2, 2, 'FD');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(146, 64, 14);
  doc.text(lines, MARGIN + 5, y + 5.5);
  y += h + 6;
}

// ── PAGE DE COUVERTURE ──
async function drawCover() {
  doc.setFillColor(...DARK);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  try {
    const logoPath = path.join(__dirname, '..', 'public', 'logo.png');
    if (fs.existsSync(logoPath)) {
      // Redimensionner à une résolution suffisante pour un rendu 30mm (~350px à 300dpi)
      // au lieu d'embarquer l'image source en pleine résolution (1254x1254 → PDF de plusieurs Mo).
      const sharp = require('sharp');
      const resized = await sharp(logoPath).resize(360, 360, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ quality: 85 }).toBuffer();
      doc.addImage(`data:image/png;base64,${resized.toString('base64')}`, 'PNG', PAGE_W / 2 - 15, 55, 30, 30);
    }
  } catch (e) { /* logo optionnel */ }
}

async function main() {
await drawCover();

doc.setFont('helvetica', 'bold');
doc.setFontSize(34);
doc.setTextColor(255, 255, 255);
doc.text('DGhubSchool', PAGE_W / 2, 110, { align: 'center' });
doc.setFontSize(15);
doc.setTextColor(...ACCENT);
doc.text('GUIDE UTILISATEUR COMPLET', PAGE_W / 2, 122, { align: 'center' });
doc.setFont('helvetica', 'normal');
doc.setFontSize(10.5);
doc.setTextColor(200, 205, 215);
const introLines = doc.splitTextToSize(
  "Toutes les fonctionnalités de la plateforme expliquées pas à pas : élèves, paiements, comptabilité, paie du personnel, portail personnel, scan de présence, cartes, documents, planning et portail parent.",
  130
);
doc.text(introLines, PAGE_W / 2, 135, { align: 'center' });

doc.setDrawColor(...ACCENT);
doc.setLineWidth(0.6);
doc.line(PAGE_W / 2 - 20, 165, PAGE_W / 2 + 20, 165);

doc.setFontSize(9);
doc.setTextColor(150, 155, 165);
doc.text('Édition Juillet 2026', PAGE_W / 2, 175, { align: 'center' });
doc.text('www.dghubschool.com', PAGE_W / 2, 182, { align: 'center' });

pageNum = 1;

// ── SOMMAIRE ──
doc.addPage();
pageNum++;
y = MARGIN;
doc.setFont('helvetica', 'bold');
doc.setFontSize(20);
doc.setTextColor(...DARK);
doc.text('Sommaire', MARGIN, y + 4);
y += 16;

const toc = [
  ['1', 'Prise en main : connexion et rôles'],
  ['2', 'Tableau de bord'],
  ['3', 'Élèves et parents'],
  ['4', 'Paiements et reçus'],
  ['5', 'Comptabilité'],
  ['6', 'Paie du personnel et bulletins'],
  ['7', 'Portail personnel — « Mon Espace »'],
  ['8', 'Gestion du personnel'],
  ['9', 'Cartes et scan de présence'],
  ['10', 'Scan et présence du personnel'],
  ['11', 'Numérisation de documents'],
  ['12', 'Emploi du temps'],
  ['13', 'Notes et bulletins scolaires'],
  ['14', 'Communication : messagerie et annonces'],
  ['15', 'Portail parent'],
  ['16', 'Paramètres de l\'établissement'],
  ['17', 'Rôles et permissions — tableau récapitulatif'],
  ['18', 'Assistance et support'],
];
doc.setFont('helvetica', 'normal');
doc.setFontSize(11);
for (const [num, title] of toc) {
  ensureSpace(9);
  doc.setTextColor(...ACCENT);
  doc.setFont('helvetica', 'bold');
  doc.text(num, MARGIN, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  doc.text(title, MARGIN + 10, y);
  y += 9;
}

// ── 1. PRISE EN MAIN ──
sectionTitle(1, 'Prise en main : connexion et rôles');
paragraph("DGhubSchool distingue deux portails de connexion : le portail établissement (personnel de l'école) et le portail parent. Chaque école dispose d'un identifiant unique (le « slug » de l'école) qui isole totalement ses données de celles des autres établissements.");
subTitle('Se connecter côté établissement');
stepList([
  "Ouvrez la page « Portail Établissement ».",
  "Sélectionnez ou saisissez le nom de votre établissement.",
  "Entrez votre numéro de téléphone (ou email) et votre mot de passe.",
  "Vous êtes redirigé vers l'écran correspondant à votre rôle.",
]);
subTitle('Les rôles disponibles');
bulletList([
  "Directeur / Administrateur : accès complet à toutes les fonctionnalités.",
  "Comptable : paiements, comptabilité, paie, recouvrement.",
  "Censeur / Proviseur : académique (notes, emploi du temps, bulletins).",
  "Superviseur (surveillant) : scan de présence élèves et personnel, cartes.",
  "Secrétaire : gestion du personnel, documents, académique — sans accès à la comptabilité ni à la paie.",
  "Enseignant : saisie des notes, planning, bulletin de paie et absences personnels.",
  "Parent : tableau de bord de son ou ses enfants, paiements, reçus, notes.",
]);
roleNote("Astuce : le rôle d'un compte détermine automatiquement ce qui s'affiche dans le menu latéral — un membre du personnel ne voit jamais une page à laquelle il n'a pas accès.");

// ── 2. TABLEAU DE BORD ──
sectionTitle(2, 'Tableau de bord');
paragraph("Le tableau de bord donne une vue d'ensemble immédiate de l'établissement : effectifs par cycle, taux de recouvrement de la scolarité, paiements récents et alertes importantes.");
bulletList([
  "Statistiques par cycle (Primaire, Collège, Lycée) et par classe.",
  "Montant total attendu vs. montant encaissé, avec taux de recouvrement.",
  "Liste des derniers paiements enregistrés.",
  "Répartition des statuts de paiement (soldé, partiel, non soldé).",
]);

// ── 3. ÉLÈVES ET PARENTS ──
sectionTitle(3, 'Élèves et parents');
subTitle('Gérer les élèves');
paragraph("La page Élèves centralise toutes les fiches élèves : identité, classe, cycle, écolage, historique de paiements et documents. Elle permet la recherche, le filtrage par classe/statut, et l'import/export en masse via Excel.");
stepList([
  "Cliquez sur « Ajouter un élève » ou importez une liste via Excel.",
  "Renseignez nom, prénom, classe, sexe, téléphone du parent.",
  "L'écolage et le cycle sont déduits automatiquement de la classe.",
  "Le statut de paiement (soldé, partiel, non soldé) se met à jour à chaque encaissement.",
]);
subTitle('Comptes parents');
paragraph("Chaque parent peut disposer d'un compte pour suivre le dossier de son enfant à distance : paiements, reçus, notes, badges d'assiduité, messagerie avec l'école.");

// ── 4. PAIEMENTS ET REÇUS ──
sectionTitle(4, 'Paiements et reçus');
subTitle('Enregistrer un paiement');
stepList([
  "Ouvrez la fiche de l'élève ou la page Paiements.",
  "Cliquez sur « Enregistrer un paiement ».",
  "Renseignez le montant, la date, le mode de paiement et, si besoin, une réduction et une référence de transaction.",
  "Le reçu est immédiatement disponible pour impression.",
]);
subTitle('Le nouveau reçu de paiement');
paragraph("Le reçu a été entièrement repensé dans un style comptable sobre et professionnel : en-tête avec logo de l'établissement, informations complètes de l'élève, tableau détaillé des montants, récapitulatif avec le montant payé mis en avant, et un QR code de vérification anti-fraude.");
bulletList([
  "Impression individuelle ou en lot (par classe, par statut).",
  "Vérification d'authenticité d'un reçu via son numéro ou son QR code (page « Vérif. Reçus »).",
]);

// ── 5. COMPTABILITÉ ──
sectionTitle(5, 'Comptabilité');
paragraph("Le module de comptabilité tient automatiquement un journal en partie double : chaque paiement de scolarité et chaque dépense enregistrée génère les écritures correspondantes. Trois documents sont disponibles à tout moment :");
bulletList([
  "Balance comptable — tous les comptes avec débit, crédit et solde.",
  "Bilan — actif, passif et capitaux propres à une date donnée.",
  "Compte de résultat — produits, charges et résultat net de la période.",
]);
paragraph("Ces trois états sont désormais exportables au même design sobre que les reçus et bulletins de paie (en-tête avec logo, filets fins, aucune couleur superflue).");
subTitle('Enregistrer une dépense');
stepList([
  "Choisissez le compte de charge concerné (fournitures, salaires, entretien...).",
  "Renseignez le montant, le mode de règlement (caisse ou banque) et une pièce justificative si disponible.",
  "L'écriture comptable est générée automatiquement.",
]);

// ── 6. PAIE DU PERSONNEL ──
sectionTitle(6, 'Paie du personnel et bulletins');
paragraph("La page Paie permet de générer le bulletin de salaire de chaque membre du personnel, avec calcul automatique des cotisations CNSS, AMU et de l'impôt sur le revenu (IRPP) selon le barème en vigueur.");
stepList([
  "Sélectionnez le membre du personnel et la période (mois/année).",
  "Renseignez le salaire de base (pré-rempli si déjà défini), les primes éventuelles.",
  "Si des heures manquées ont été détectées par le scan de présence (voir section 10), une ligne de retenue est automatiquement proposée — vous pouvez la modifier ou la supprimer avant de valider.",
  "Cliquez sur « Générer le bulletin ». Il est immédiatement disponible à l'impression.",
]);
subTitle('Le nouveau bulletin de paie');
paragraph("Le bulletin a été redessiné dans un style professionnel sobre : en-tête avec logo et informations légales de l'établissement (IFU, RCCM), informations complètes de l'employeur et du salarié sur deux colonnes, tableau détaillé des gains et retenues, et le net à payer mis en évidence dans un encadré discret.");
roleNote("Important : la retenue pour heures manquées n'est jamais appliquée automatiquement — elle est toujours proposée à la validation du directeur ou du comptable au moment de générer le bulletin.");

// ── 7. PORTAIL PERSONNEL ──
sectionTitle(7, 'Portail personnel — « Mon Espace »');
paragraph("Chaque membre du personnel (enseignant, comptable, censeur, proviseur, superviseur, secrétaire, administrateur) dispose désormais d'un espace personnel accessible depuis son propre compte, regroupé dans la section « Mon Espace » du menu.");
bulletList([
  "Mon Profil — consultation de sa propre fiche (nom, matricule, département, date d'embauche...).",
  "Mes Bulletins de Paie — historique de ses bulletins, imprimables directement, sans dépendre d'un tiers.",
  "Mon Planning — emploi du temps personnel en lecture seule (pour les enseignants notamment).",
  "Mes Absences — historique de ses absences et retards, y compris celles détectées automatiquement par le scan de présence.",
]);
roleNote("Pour les enseignants sur un compte encore partagé (non individuel), un écran de sélection du nom est requis avant d'accéder à ces informations, avec vérification par mot de passe pour les données sensibles (bulletin de paie).");

// ── 8. GESTION DU PERSONNEL ──
sectionTitle(8, 'Gestion du personnel');
paragraph("Réservée à la direction et à la secrétaire, cette page centralise la création des comptes du personnel et la mise à jour de leurs fiches complètes.");
stepList([
  "Cliquez sur « Ajouter un collaborateur », renseignez nom, téléphone, mot de passe et rôle.",
  "Éditez ensuite sa fiche pour ajouter matricule, N° CNSS, date d'embauche, département, mode de paiement et compte bancaire.",
  "Ces informations apparaissent automatiquement sur son bulletin de paie et sa carte personnel.",
]);
subTitle('Le rôle Secrétaire');
paragraph("Ce rôle permet de créer et modifier les fiches du personnel, gérer l'académique (matières, emploi du temps) et numériser des documents, sans donner accès à la comptabilité, à la paie ni aux données financières sensibles.");

// ── 9. CARTES ET SCAN DE PRÉSENCE ÉLÈVES ──
sectionTitle(9, 'Cartes et scan de présence (élèves)');
paragraph("Chaque élève dispose d'une carte scolaire avec QR Code unique, imprimable individuellement ou en lot (8 cartes par page A4, format ISO 85×54mm).");
stepList([
  "Ouvrez la page Cartes Scolaires.",
  "Recherchez un élève ou une classe, puis générez le PDF (une carte ou en lot).",
  "Le surveillant scanne la carte à l'entrée : le parent est notifié automatiquement (SMS ou push) en moins de 2 secondes.",
]);
paragraph("Deux pages de scan sont disponibles : Scan Présence (entrée) et Scan Sortie. Un retard est automatiquement détecté si le scan a lieu après l'heure limite définie pour le cycle de l'élève.");

// ── 10. SCAN PERSONNEL ──
sectionTitle(10, 'Scan et présence du personnel');
paragraph("Sur le même principe que les élèves, chaque enseignant dispose désormais d'un badge personnel à QR Code, généré depuis la page « Cartes Personnel ».");
stepList([
  "Générez les badges du personnel depuis « Cartes Personnel ».",
  "Le surveillant ou la secrétaire scanne le badge de l'enseignant au début de sa journée de cours (page « Scan Entrée Personnel »).",
  "Il scanne à nouveau en fin de journée (page « Scan Sortie Personnel »).",
  "Le système compare automatiquement le temps travaillé à l'emploi du temps prévu pour calculer les heures manquées.",
]);
roleNote("Un pointage entrée sans sortie correspondante n'est jamais compté comme une absence complète — il est signalé pour vérification manuelle par la direction, pas pénalisé automatiquement.");
paragraph("Les heures manquées calculées sont ensuite proposées comme retenue lors de la génération du bulletin de paie (voir section 6) — jamais appliquées sans validation humaine.");

// ── 11. DOCUMENTS ──
sectionTitle(11, 'Numérisation de documents');
subTitle('Documents élèves');
paragraph("La page Documents permet de numériser via la caméra (ou d'importer) les pièces administratives d'un élève : acte de naissance, ancien bulletin, attestation de scolarité, etc. L'outil de numérisation intègre un recadrage automatique, une rotation et un filtrage noir & blanc pour un rendu net.");
subTitle('Documents du personnel');
paragraph("Depuis la fiche d'un membre du personnel (page Gestion du Personnel), il est désormais possible de numériser ses documents administratifs : contrat, diplôme, pièce d'identité, carte CNSS. Ces documents sont stockés de façon sécurisée et accessibles uniquement à la direction, à la secrétaire et au salarié concerné.");

// ── 12. EMPLOI DU TEMPS ──
sectionTitle(12, 'Emploi du temps');
paragraph("Construisez l'emploi du temps de chaque classe : classe, matière, enseignant, jour, créneau horaire et salle. Le système détecte automatiquement les conflits (même enseignant, même classe ou même salle sur un créneau chevauchant) avant qu'ils ne posent problème.");
paragraph("Chaque enseignant consulte son propre planning en lecture seule depuis « Mon Planning » (section 7).");

// ── 13. NOTES ET BULLETINS SCOLAIRES ──
sectionTitle(13, 'Notes et bulletins scolaires');
paragraph("Les enseignants saisissent les notes de leurs classes assignées, par période (trimestre ou semestre selon le cycle). Un import/export Excel est disponible pour la saisie en masse.");
stepList([
  "Sélectionnez la classe, la matière et la période.",
  "Saisissez les notes élève par élève, ou importez un fichier Excel pré-rempli.",
  "Depuis la page Bulletins, calculez les moyennes et rangs de toute une classe, puis générez les bulletins scolaires officiels au format PDF (modèle conforme DRE).",
]);

// ── 14. COMMUNICATION ──
sectionTitle(14, 'Communication : messagerie et annonces');
paragraph("La messagerie intégrée permet des échanges directs entre l'école et les parents. Les annonces permettent de diffuser une information à tous les parents (ou à une classe précise) en un clic, avec notification automatique.");

// ── 15. PORTAIL PARENT ──
sectionTitle(15, 'Portail parent');
paragraph("Les parents disposent de leur propre portail de connexion, avec un tableau de bord dédié à leur(s) enfant(s).");
bulletList([
  "Suivi en temps réel des paiements et du solde restant.",
  "Téléchargement des reçus de paiement.",
  "Consultation des notes et bulletins dès leur publication.",
  "Historique des présences et badges d'assiduité.",
  "Messagerie directe avec l'établissement.",
]);

// ── 16. PARAMÈTRES ──
sectionTitle(16, 'Paramètres de l\'établissement');
paragraph("Cette page centralise toute la configuration de l'école : identité (logo, nom, adresse, contacts), informations légales (IFU, RCCM, NIF), année scolaire, tranches de paiement, horaires par cycle, et le nouveau réglage des heures mensuelles standard utilisé pour calculer les retenues sur heures manquées.");
bulletList([
  "Logo, cachet et signature du directeur pour les documents officiels.",
  "Informations légales affichées sur les reçus et bulletins de paie (IFU, RCCM, NIF, site web, N° d'autorisation).",
  "Heures mensuelles standard — sert de base au calcul du taux horaire pour les retenues sur salaire.",
  "Messages personnalisés pour les rappels et remerciements de paiement.",
]);

// ── 17. RÔLES ET PERMISSIONS ──
sectionTitle(17, 'Rôles et permissions — tableau récapitulatif');
const roleTable = [
  ['Directeur / Admin', 'Accès complet à toutes les fonctionnalités.'],
  ['Comptable', 'Paiements, comptabilité, paie, recouvrement, Mon Espace.'],
  ['Censeur / Proviseur', 'Académique complet (notes, emploi du temps, bulletins), Mon Espace.'],
  ['Secrétaire', 'Gestion du personnel, documents, académique — sans comptabilité ni paie.'],
  ['Superviseur', 'Scan présence/sortie élèves et personnel, cartes, Mon Espace.'],
  ['Enseignant', 'Saisie des notes, Mon Planning, Mes Bulletins, Mes Absences.'],
  ['Parent', 'Tableau de bord de son enfant, paiements, reçus, notes, messagerie.'],
];
doc.setFont('helvetica', 'normal');
doc.setFontSize(9.5);
for (const [role, desc] of roleTable) {
  ensureSpace(14);
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(MARGIN, y, CONTENT_W, 12, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ACCENT);
  doc.text(role, MARGIN + 4, y + 7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 65, 75);
  const descLines = doc.splitTextToSize(desc, CONTENT_W - 55);
  doc.text(descLines, MARGIN + 52, y + 7.5);
  y += 15;
}

// ── 18. SUPPORT ──
sectionTitle(18, 'Assistance et support');
paragraph("Pour toute question ou difficulté rencontrée sur la plateforme, l'équipe DGhubSchool reste disponible :");
bulletList([
  "Email : support@dghubschool.com",
  "Centre d'aide en ligne, accessible depuis le site (menu Support).",
  "Pour les établissements clients, un gestionnaire de compte dédié peut être contacté directement.",
]);
paragraph("Ce guide est mis à jour à chaque évolution majeure de la plateforme. La version la plus récente est toujours disponible depuis le Centre d'aide du site.");

addFooter();

// ── Sauvegarde ──
const outDir = path.join(__dirname, '..', 'public', 'guides');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'DGhubSchool_Guide_Utilisateur.pdf');
const buf = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync(outPath, buf);
console.log(`Guide généré : ${outPath} (${(buf.length / 1024 / 1024).toFixed(2)} Mo, ${pageNum} pages)`);
}

main().catch((err) => { console.error(err); process.exit(1); });
