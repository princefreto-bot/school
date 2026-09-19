import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.resolve(__dirname, '..', 'public', 'guides', 'DGhubSchool_Guide_Utilisateur.pdf');

const BRAND = [244, 180, 0];
const DARK = [15, 23, 42];
const GRAY = [100, 116, 139];
const LIGHT_BG = [248, 250, 252];
const WHITE = [255, 255, 255];

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_L = 22;
const MARGIN_R = 22;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;
const MARGIN_TOP = 25;
const MARGIN_BOTTOM = 30;

let currentPage = 0;

function newPage(doc) {
  if (currentPage > 0) doc.addPage();
  currentPage++;
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  doc.text('DGhubSchool — Guide utilisateur', MARGIN_L, PAGE_H - 12);
  doc.text(String(currentPage), PAGE_W - MARGIN_R, PAGE_H - 12, { align: 'right' });
  return MARGIN_TOP;
}

function sectionHeader(doc, y, num, title) {
  if (y > PAGE_H - 80) y = newPage(doc);
  doc.setFontSize(10);
  doc.setTextColor(...BRAND);
  doc.setFont('helvetica', 'bold');
  doc.text(`SECTION ${num}`, MARGIN_L, y);
  y += 8;
  doc.setFontSize(18);
  doc.setTextColor(...DARK);
  doc.text(title, MARGIN_L, y);
  y += 4;
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.8);
  doc.line(MARGIN_L, y, MARGIN_L + 50, y);
  y += 10;
  return y;
}

function paragraph(doc, y, text, fontSize = 10) {
  doc.setFontSize(fontSize);
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(text, CONTENT_W);
  for (const line of lines) {
    if (y > PAGE_H - MARGIN_BOTTOM) y = newPage(doc);
    doc.text(line, MARGIN_L, y);
    y += fontSize * 0.45 + 1.5;
  }
  y += 3;
  return y;
}

function subTitle(doc, y, text) {
  if (y > PAGE_H - 40) y = newPage(doc);
  doc.setFontSize(12);
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.text(text, MARGIN_L, y);
  y += 8;
  return y;
}

function bulletList(doc, y, items) {
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  for (const item of items) {
    if (y > PAGE_H - MARGIN_BOTTOM) y = newPage(doc);
    doc.setTextColor(...BRAND);
    doc.text('—', MARGIN_L + 2, y);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(item, CONTENT_W - 10);
    for (let i = 0; i < lines.length; i++) {
      if (i > 0 && y > PAGE_H - MARGIN_BOTTOM) y = newPage(doc);
      doc.text(lines[i], MARGIN_L + 8, y);
      y += 5;
    }
    y += 1;
  }
  y += 3;
  return y;
}

function numberedList(doc, y, items) {
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  for (let i = 0; i < items.length; i++) {
    if (y > PAGE_H - MARGIN_BOTTOM) y = newPage(doc);
    doc.setTextColor(...BRAND);
    doc.text(`${i + 1}.`, MARGIN_L + 2, y);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(items[i], CONTENT_W - 12);
    for (let j = 0; j < lines.length; j++) {
      if (j > 0 && y > PAGE_H - MARGIN_BOTTOM) y = newPage(doc);
      doc.text(lines[j], MARGIN_L + 10, y);
      y += 5;
    }
    y += 1;
  }
  y += 3;
  return y;
}

function infoBox(doc, y, text) {
  if (y > PAGE_H - 50) y = newPage(doc);
  const lines = doc.splitTextToSize(text, CONTENT_W - 16);
  const boxH = lines.length * 5.5 + 10;
  doc.setFillColor(...LIGHT_BG);
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.5);
  doc.roundedRect(MARGIN_L, y - 3, CONTENT_W, boxH, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...GRAY);
  let ly = y + 4;
  for (const line of lines) {
    doc.text(line, MARGIN_L + 8, ly);
    ly += 5.5;
  }
  y += boxH + 6;
  return y;
}

function roleRow(doc, y, role, portal, desc) {
  if (y > PAGE_H - 30) y = newPage(doc);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text(role, MARGIN_L + 2, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  const lines = doc.splitTextToSize(`${portal}. ${desc}`, CONTENT_W - 50);
  for (let i = 0; i < lines.length; i++) {
    doc.text(lines[i], MARGIN_L + 48, y + i * 5);
  }
  y += Math.max(lines.length * 5, 6) + 4;
  return y;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
const doc = new jsPDF({ unit: 'mm', format: 'a4' });

// ── COVER PAGE ─────────────────────────────────────────────────
currentPage++;
doc.setFillColor(...DARK);
doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

doc.setFontSize(36);
doc.setTextColor(...WHITE);
doc.setFont('helvetica', 'bold');
doc.text('DGhubSchool', PAGE_W / 2, 100, { align: 'center' });

doc.setFontSize(16);
doc.setTextColor(...BRAND);
doc.text('GUIDE UTILISATEUR COMPLET', PAGE_W / 2, 115, { align: 'center' });

doc.setFontSize(10);
doc.setTextColor(200, 200, 200);
doc.setFont('helvetica', 'normal');
const coverLines = doc.splitTextToSize(
  'Toutes les fonctionnalités de la plateforme expliquées pas à pas : élèves, paiements, comptabilité, paie du personnel, portail personnel, scan de présence, cartes, documents, planning, recouvrement, sauvegardes et portail parent.',
  130
);
let cy = 130;
for (const l of coverLines) {
  doc.text(l, PAGE_W / 2, cy, { align: 'center' });
  cy += 6;
}

doc.setFontSize(12);
doc.setTextColor(...BRAND);
doc.text('Édition Septembre 2026', PAGE_W / 2, 200, { align: 'center' });

doc.setFontSize(9);
doc.setTextColor(150, 150, 150);
doc.text('www.dghubschool.com', PAGE_W / 2, 215, { align: 'center' });

// ── TABLE OF CONTENTS ──────────────────────────────────────────
let y = newPage(doc);
doc.setFontSize(20);
doc.setTextColor(...DARK);
doc.setFont('helvetica', 'bold');
doc.text('Sommaire', MARGIN_L, y);
y += 12;

const sections = [
  'Prise en main : connexion et rôles',
  'Tableau de bord',
  'Élèves et parents',
  'Paiements et reçus',
  'Comptabilité',
  'Recouvrement',
  'Retraits et décaissements',
  'Paie du personnel et bulletins',
  'Portail personnel — « Mon Espace »',
  'Gestion du personnel',
  'Cartes scolaires, enseignant et examen',
  'Scan et présence (élèves et personnel)',
  'Numérisation de documents',
  'Emploi du temps',
  'Notes et bulletins scolaires',
  'Notes d’examens (CEPD, BEPC, BAC) et classement',
  'Rapports académiques et statistiques',
  'Communication : messagerie et annonces',
  'Portail parent',
  'Sauvegardes',
  'Historique des activités',
  'Paramètres de l’établissement',
  'Rôles et permissions — tableau récapitulatif',
  'Assistance et support',
];

doc.setFontSize(10);
for (let i = 0; i < sections.length; i++) {
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND);
  doc.text(`${i + 1}`, MARGIN_L, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  doc.text(sections[i], MARGIN_L + 12, y);
  y += 7.5;
  if (y > PAGE_H - MARGIN_BOTTOM) y = newPage(doc);
}

// ═══════════════════════════════════════════════════════════════
// SECTION 1 — Prise en main
// ═══════════════════════════════════════════════════════════════
y = newPage(doc);
y = sectionHeader(doc, y, 1, 'Prise en main : connexion et rôles');

y = paragraph(doc, y, 'DGhubSchool distingue trois portails de connexion, chacun avec sa propre adresse : le Portail Établissement (direction), le Portail Personnel (le reste du personnel) et le Portail Parent. Chaque école dispose d’un identifiant unique (le « slug » de l’école) qui isole totalement ses données de celles des autres établissements.');

y = subTitle(doc, y, 'Portail Établissement — réservé à la direction');
y = paragraph(doc, y, 'Accessible uniquement aux comptes Administrateur, Directeur et Directeur Général. C’est le seul portail donnant accès au tableau de bord financier complet (écolage, encaissements, comptabilité, paie) et à la configuration de l’établissement.');
y = numberedList(doc, y, [
  'Ouvrez la page « Portail Établissement ».',
  'Sélectionnez ou saisissez le nom de votre établissement.',
  'Entrez votre numéro de téléphone (ou email) et votre mot de passe.',
  'Vous êtes redirigé vers le tableau de bord.',
]);

y = subTitle(doc, y, 'Portail Personnel — pour le reste du personnel');
y = paragraph(doc, y, 'Enseignants, secrétariat, comptabilité, censeur, proviseur et superviseurs/surveillants se connectent désormais via une adresse dédiée et distincte du Portail Établissement — un compte de ces rôles ne peut plus se connecter sur le Portail Établissement, et inversement.');
y = bulletList(doc, y, [
  'Comptable : paiements, comptabilité, paie, recouvrement (accès au tableau de bord financier conservé).',
  'Censeur / Proviseur : académique (notes, emploi du temps, bulletins), tableau de bord financier conservé.',
  'Superviseur (surveillant) : scan de présence élèves et personnel, cartes.',
  'Secrétaire : gestion du personnel, documents, académique — atterrit sur un accueil « Espace Personnel » dédié, sans aucune donnée financière.',
  'Enseignant : saisie des notes, notes d’examens, planning, bulletin de paie et absences personnels.',
]);

y = infoBox(doc, y, 'Important : seule la secrétaire est privée du tableau de bord financier — les autres rôles migrés vers le Portail Personnel (comptable, censeur, proviseur, superviseur) gardent exactement les mêmes accès qu’avant.');

y = subTitle(doc, y, 'Portail Parent');
y = paragraph(doc, y, 'Tableau de bord dédié au suivi d’un ou plusieurs enfants : paiements, reçus, notes, badges d’assiduité. Accessible via sa propre page de connexion, distincte des deux portails ci-dessus.');

y = subTitle(doc, y, 'Sécurité : verrouillage de compte');
y = paragraph(doc, y, 'Après plusieurs tentatives de connexion échouées consécutives, le compte est temporairement verrouillé pour protéger contre les accès non autorisés. Un compte à rebours indique le temps restant avant de pouvoir réessayer.');

y = infoBox(doc, y, 'Astuce : le rôle d’un compte détermine automatiquement ce qui s’affiche dans le menu latéral — un membre du personnel ne voit jamais une page à laquelle il n’a pas accès. Chaque page de connexion propose un lien vers les deux autres portails pour ne jamais se tromper d’adresse.');

// ═══════════════════════════════════════════════════════════════
// SECTION 2 — Tableau de bord
// ═══════════════════════════════════════════════════════════════
y = newPage(doc);
y = sectionHeader(doc, y, 2, 'Tableau de bord');
y = paragraph(doc, y, 'Le tableau de bord donne une vue d’ensemble immédiate de l’établissement : effectifs par cycle, taux de recouvrement de la scolarité, paiements récents et alertes importantes.');
y = bulletList(doc, y, [
  'Statistiques par cycle (Primaire, Collège, Lycée Moderne, Lycée Technique) et par classe.',
  'Séparation Lycée Moderne et Lycée Technique avec sections dédiées (G1, G2, G3, C, D pour le Technique).',
  'Montant total attendu vs. montant encaissé, avec taux de recouvrement.',
  'Liste des derniers paiements enregistrés.',
  'Répartition des statuts de paiement (soldé, partiel, non soldé).',
  'Répartition des élèves par âge et par sexe (graphique + page dédiée imprimable).',
  'Bloc « Nouvelles inscriptions & frais d’inscription » : nombre de nouveaux inscrits et montant des frais d’inscription attendu / encaissé / restant.',
]);

// ═══════════════════════════════════════════════════════════════
// SECTION 3 — Élèves et parents
// ═══════════════════════════════════════════════════════════════
y = newPage(doc);
y = sectionHeader(doc, y, 3, 'Élèves et parents');

y = subTitle(doc, y, 'Gérer les élèves');
y = paragraph(doc, y, 'La page Élèves centralise toutes les fiches élèves : identité, classe, cycle, écolage, historique de paiements et documents. Elle permet la recherche, le filtrage par classe/statut, et l’import/export en masse via Excel.');
y = numberedList(doc, y, [
  'Cliquez sur « Ajouter un élève » ou importez une liste via Excel.',
  'Renseignez nom, prénom, date de naissance, classe, sexe, téléphone du parent.',
  'L’écolage et le cycle sont déduits automatiquement de la classe.',
  'Le statut de paiement (soldé, partiel, non soldé) se met à jour à chaque encaissement.',
]);

y = subTitle(doc, y, 'Liste nominative par classe');
y = paragraph(doc, y, 'Un document PDF prêt à imprimer pour les démarches administratives (DRENA, examens) : identité des élèves uniquement, aucune donnée financière.');
y = numberedList(doc, y, [
  'Ouvrez la page Élèves, puis « Filtres Avancés ».',
  'Sélectionnez une classe précise (le bouton n’apparaît que pour une classe donnée).',
  'Cliquez sur « Liste nominative ».',
]);
y = paragraph(doc, y, 'Le PDF généré contient le numéro, le nom et prénoms, le sexe, la date de naissance et le statut (régulier/redoublant) de chaque élève, ainsi que l’effectif total (garçons/filles) et une zone de signature pour le directeur.');

y = subTitle(doc, y, 'Attestation de scolarité');
y = paragraph(doc, y, 'Un document officiel généré en un clic depuis la fiche d’un élève, sans avoir à le rédiger à la main : identité de l’élève, classe, année scolaire, en-tête de l’établissement, cachet et signature du directeur.');

y = subTitle(doc, y, 'Comptes parents');
y = paragraph(doc, y, 'Chaque parent peut disposer d’un compte pour suivre le dossier de son enfant à distance : paiements, reçus, notes, badges d’assiduité, messagerie avec l’école.');

// ═══════════════════════════════════════════════════════════════
// SECTION 4 — Paiements et reçus
// ═══════════════════════════════════════════════════════════════
y = newPage(doc);
y = sectionHeader(doc, y, 4, 'Paiements et reçus');

y = subTitle(doc, y, 'Enregistrer un paiement');
y = numberedList(doc, y, [
  'Ouvrez la fiche de l’élève ou la page Paiements.',
  'Cliquez sur « Enregistrer un paiement ».',
  'Renseignez le montant, la date, le mode de paiement et, si besoin, une réduction et une référence de transaction.',
  'Le reçu est immédiatement disponible pour impression.',
]);

y = subTitle(doc, y, 'Le nouveau reçu de paiement');
y = paragraph(doc, y, 'Le reçu a été entièrement repensé dans un style comptable sobre et professionnel : en-tête avec logo de l’établissement, informations complètes de l’élève, tableau détaillé des montants, récapitulatif avec le montant payé mis en avant, et un QR code de vérification anti-fraude.');
y = bulletList(doc, y, [
  'Impression individuelle ou en lot (par classe, par statut).',
  'Vérification d’authenticité d’un reçu via son numéro ou son QR code (page « Vérif. Reçus »).',
]);

y = subTitle(doc, y, 'Frais d’inscription');
y = paragraph(doc, y, 'Distincts de l’écolage : un montant à percevoir uniquement à l’inscription d’un NOUVEL élève à l’établissement, jamais mélangé au suivi de l’écolage — solde, statut et reçu séparés.');
y = numberedList(doc, y, [
  'Définissez le tarif par classe dans Paramètres > Frais d’inscription (une classe laissée à 0 n’a pas de frais d’inscription).',
  'Sur la fiche de l’élève, indiquez son statut « Nouveau à l’établissement » ou « Déjà inscrit avant ».',
  'À l’enregistrement d’un paiement, choisissez le type de versement : Écolage ou Frais d’inscription.',
  'Le reçu généré documente uniquement le type de versement concerné.',
]);
y = infoBox(doc, y, 'Ce statut « Nouveau / Ancien » (financier, propre à l’établissement) est indépendant du statut « Redoublant » (académique, propre à la classe). Les tarifs Ancien et Nouveau peuvent être différents d’une classe à l’autre.');

y = subTitle(doc, y, 'Dépenses élève (Maillots, Excursion...)');
y = paragraph(doc, y, 'Une troisième piste, distincte de l’écolage et des frais d’inscription : des dépenses ponctuelles liées à UN élève précis (maillots, excursion, fournitures...) — jamais une dépense de l’établissement.');
y = numberedList(doc, y, [
  'Créez d’abord les libellés réutilisables dans Paramètres > Frais divers.',
  'Sur la fiche de l’élève, ouvrez l’onglet « Dépenses » puis « Ajouter ».',
  'Enregistrez un paiement partiel ou total avec le bouton « Payer ».',
]);

// ═══════════════════════════════════════════════════════════════
// SECTION 5 — Comptabilité
// ═══════════════════════════════════════════════════════════════
y = newPage(doc);
y = sectionHeader(doc, y, 5, 'Comptabilité');
y = paragraph(doc, y, 'Le module de comptabilité tient automatiquement un journal en partie double : chaque paiement de scolarité et chaque dépense enregistrée génère les écritures correspondantes. Trois documents sont disponibles à tout moment :');
y = bulletList(doc, y, [
  'Balance comptable — tous les comptes avec débit, crédit et solde.',
  'Bilan — actif, passif et capitaux propres à une date donnée.',
  'Compte de résultat — produits, charges et résultat net de la période.',
]);
y = paragraph(doc, y, 'Ces trois états sont exportables au même design sobre que les reçus et bulletins de paie (en-tête avec logo, filets fins, aucune couleur superflue).');

y = subTitle(doc, y, 'Enregistrer une dépense');
y = numberedList(doc, y, [
  'Choisissez le compte de charge concerné (fournitures, salaires, entretien...).',
  'Renseignez le montant, le mode de règlement (caisse ou banque) et une pièce justificative si disponible.',
  'L’écriture comptable est générée automatiquement.',
]);

// ═══════════════════════════════════════════════════════════════
// SECTION 6 — Recouvrement (NEW)
// ═══════════════════════════════════════════════════════════════
y = newPage(doc);
y = sectionHeader(doc, y, 6, 'Recouvrement');
y = paragraph(doc, y, 'Le module Recouvrement permet de suivre et prioriser les impayés de scolarité. Il affiche la liste des élèves ayant un solde restant, classés par un score de priorité (montant dû, ancienneté de la dette, nombre de relances).');
y = bulletList(doc, y, [
  'Liste des élèves en impayé avec montant dû, nombre de tranches en retard et score de priorité.',
  'Filtrage par classe, par cycle ou par statut de paiement.',
  'Envoi de rappels de paiement automatiques aux parents en retard (SMS/notification push).',
  'Historique des relances envoyées pour chaque élève.',
  'Paramétrage des messages de rappel et de remerciement dans Paramètres.',
]);
y = infoBox(doc, y, 'Le score de priorité du recouvrement ne prend en compte que l’écolage — les frais d’inscription et les dépenses élève ne sont jamais inclus dans ce calcul.');

// ═══════════════════════════════════════════════════════════════
// SECTION 7 — Retraits et décaissements (NEW)
// ═══════════════════════════════════════════════════════════════
y = newPage(doc);
y = sectionHeader(doc, y, 7, 'Retraits et décaissements');
y = paragraph(doc, y, 'La page Retraits permet aux établissements de demander le décaissement des fonds collectés via la plateforme vers leur compte bancaire ou Mobile Money.');
y = bulletList(doc, y, [
  'Demande de retrait avec montant et mode de règlement (virement bancaire, Mobile Money).',
  'Suivi du statut de chaque demande (en attente, en cours, validé, payé).',
  'Historique complet de tous les décaissements.',
  'Informations bancaires configurables dans les Paramètres de l’établissement.',
]);

// ═══════════════════════════════════════════════════════════════
// SECTION 8 — Paie du personnel
// ═══════════════════════════════════════════════════════════════
y = newPage(doc);
y = sectionHeader(doc, y, 8, 'Paie du personnel et bulletins');
y = paragraph(doc, y, 'Le module Paie calcule automatiquement le net à payer de chaque membre du personnel à partir du salaire brut, des cotisations légales (CNSS, AMU) et de l’impôt sur le revenu (IRPP), avec retenue possible pour heures manquées.');
y = bulletList(doc, y, [
  'Calcul automatique CNSS (part salariale et patronale), AMU et IRPP.',
  'Retenues sur salaire pour heures manquées, calculées à partir du taux horaire (salaire brut / heures mensuelles standard).',
  'Bulletin de paie PDF sobre et professionnel, avec en-tête de l’établissement, informations légales (IFU, RCCM, NIF) et détail des cotisations.',
  'Génération en lot de tous les bulletins du mois.',
  'Historique des bulletins par employé.',
]);

// ═══════════════════════════════════════════════════════════════
// SECTION 9 — Portail personnel
// ═══════════════════════════════════════════════════════════════
y = newPage(doc);
y = sectionHeader(doc, y, 9, 'Portail personnel — « Mon Espace »');
y = paragraph(doc, y, 'Chaque membre du personnel connecté via le Portail Personnel dispose d’un espace « Mon Espace » regroupant ses informations personnelles et professionnelles :');
y = bulletList(doc, y, [
  'Mon Profil — photo, informations personnelles, coordonnées.',
  'Mon Bulletin de paie — consultation et téléchargement de tous ses bulletins.',
  'Mon Planning — emploi du temps de la semaine.',
  'Mes Absences — historique des présences, retards et absences.',
]);
y = infoBox(doc, y, 'L’enseignant accède également à la saisie des notes, aux notes d’examens et à son planning depuis le même portail.');

// ═══════════════════════════════════════════════════════════════
// SECTION 10 — Gestion du personnel
// ═══════════════════════════════════════════════════════════════
y = newPage(doc);
y = sectionHeader(doc, y, 10, 'Gestion du personnel');
y = paragraph(doc, y, 'La page Gestion du personnel centralise toutes les fiches du personnel de l’établissement : identité, poste, salaire, documents et historique.');
y = bulletList(doc, y, [
  'Ajout et modification des fiches du personnel (nom, poste, salaire brut, contact).',
  'Attribution des rôles et des permissions d’accès.',
  'Suivi des contrats et documents numérisés (contrat, diplôme, pièce d’identité).',
  'Historique des modifications.',
]);

// ═══════════════════════════════════════════════════════════════
// SECTION 11 — Cartes (updated with teacher + exam cards)
// ═══════════════════════════════════════════════════════════════
y = newPage(doc);
y = sectionHeader(doc, y, 11, 'Cartes scolaires, enseignant et examen');

y = subTitle(doc, y, 'Carte scolaire numérique');
y = paragraph(doc, y, 'Générez automatiquement des cartes d’identité scolaires numériques avec photo passeport, QR Code unique crypté et toutes les informations de l’élève.');
y = bulletList(doc, y, [
  'Génération automatique avec photo.',
  'QR Code unique crypté par élève.',
  'Compatible scan entrée/sortie.',
  'Format numérique et imprimable.',
  'Verso personnalisable (texte libre) pour le règlement ou les mentions légales.',
]);

y = subTitle(doc, y, 'Carte enseignant');
y = paragraph(doc, y, 'Badge QR professionnel pour chaque membre du personnel, utilisé pour le pointage entrée/sortie. La carte affiche la photo, le nom, le poste et un QR Code unique lié au système de présence.');
y = bulletList(doc, y, [
  'Génération depuis la fiche du personnel.',
  'QR Code pour le pointage automatique.',
  'Calcul automatique des heures de présence et des heures manquées.',
]);

y = subTitle(doc, y, 'Carte d’examen');
y = paragraph(doc, y, 'Carte spécifique pour les sessions d’examens nationaux (CEPD, BEPC, BAC). Elle contient les informations de l’élève, sa classe, sa section et un numéro de candidat.');

// ═══════════════════════════════════════════════════════════════
// SECTION 12 — Scan et présence
// ═══════════════════════════════════════════════════════════════
y = newPage(doc);
y = sectionHeader(doc, y, 12, 'Scan et présence (élèves et personnel)');

y = subTitle(doc, y, 'Présence des élèves');
y = paragraph(doc, y, 'Le système de scan QR permet de contrôler les entrées et sorties des élèves en temps réel.');
y = bulletList(doc, y, [
  'Scan d’entrée — enregistre l’arrivée de l’élève avec horodatage.',
  'Scan de sortie — enregistre le départ avec notification au parent.',
  'Scan d’information — affiche la fiche complète de l’élève sans enregistrer de mouvement.',
  'Historique consultable par jour, semaine ou mois.',
]);

y = subTitle(doc, y, 'Présence du personnel');
y = paragraph(doc, y, 'Le même système de scan s’applique au personnel, avec un calcul automatique des heures de travail.');
y = bulletList(doc, y, [
  'Pointage entrée et sortie par scan QR du badge enseignant.',
  'Calcul automatique des heures de présence et des retards.',
  'Cumul des heures manquées pour le calcul des retenues sur salaire.',
  'Tableau récapitulatif par période.',
]);

// ═══════════════════════════════════════════════════════════════
// SECTION 13 — Numérisation de documents
// ═══════════════════════════════════════════════════════════════
y = newPage(doc);
y = sectionHeader(doc, y, 13, 'Numérisation de documents');
y = paragraph(doc, y, 'Numérisez et archivez les documents du personnel directement depuis l’application : contrats, diplômes, pièces d’identité, certificats. Chaque document est rattaché à la fiche du membre du personnel concerné.');
y = bulletList(doc, y, [
  'Capture depuis la caméra ou import depuis l’appareil.',
  'Classement par type de document.',
  'Consultation et téléchargement à tout moment.',
  'Accessible depuis la fiche du personnel et le Centre de Documents.',
]);

// ═══════════════════════════════════════════════════════════════
// SECTION 14 — Emploi du temps
// ═══════════════════════════════════════════════════════════════
y = newPage(doc);
y = sectionHeader(doc, y, 14, 'Emploi du temps');
y = paragraph(doc, y, 'Créez et gérez les emplois du temps de chaque classe, avec détection automatique des conflits (un enseignant ne peut pas être dans deux classes au même créneau).');
y = bulletList(doc, y, [
  'Création des créneaux par classe, jour et heure.',
  'Attribution des matières et des enseignants.',
  'Détection automatique des conflits de planning.',
  'Vue hebdomadaire par classe ou par enseignant.',
  'Accessible aux enseignants via « Mon Planning » dans le Portail Personnel.',
]);

// ═══════════════════════════════════════════════════════════════
// SECTION 15 — Notes et bulletins scolaires
// ═══════════════════════════════════════════════════════════════
y = newPage(doc);
y = sectionHeader(doc, y, 15, 'Notes et bulletins scolaires');

y = subTitle(doc, y, 'Saisie des notes');
y = paragraph(doc, y, 'Les enseignants saisissent les notes de leurs matières pour chaque période (trimestre ou semestre selon le cycle). L’import Excel via un modèle pré-rempli évite la saisie manuelle.');
y = bulletList(doc, y, [
  'Saisie par matière, par classe et par période.',
  'Import Excel avec modèle pré-rempli (noms des élèves déjà inclus).',
  'Calcul automatique des moyennes et des rangs.',
]);

y = subTitle(doc, y, 'Bulletins scolaires');
y = paragraph(doc, y, 'Génération de bulletins PDF par élève ou en lot pour toute une classe. Le bulletin affiche les notes par matière, les moyennes, le rang, et les appréciations.');
y = bulletList(doc, y, [
  'Génération individuelle ou en lot.',
  'Moyenne cumulée annuelle (Primaire : S1+S2 / Collège–Lycée : T1+T2+T3).',
  'En-tête de l’établissement avec logo.',
]);

y = subTitle(doc, y, 'Saisie manuelle d’une moyenne de période manquante');
y = paragraph(doc, y, 'Si un élève n’a pas de notes pour une période antérieure (transfert en cours d’année), la page Bulletins propose un champ de saisie manuelle de la moyenne de cette période.');
y = infoBox(doc, y, 'Cette moyenne saisie manuellement reste uniquement dans le navigateur — elle n’est pas enregistrée en base de données. Dès que de vraies notes sont saisies, le champ disparaît.');

// ═══════════════════════════════════════════════════════════════
// SECTION 16 — Notes d'examens
// ═══════════════════════════════════════════════════════════════
y = newPage(doc);
y = sectionHeader(doc, y, 16, 'Notes d’examens (CEPD, BEPC, BAC) et classement');
y = paragraph(doc, y, 'Les classes concernées par un examen national — CM2 (CEPD), 3ème (BEPC), 1ère (BAC 1) et Terminale (BAC 2), toutes sections confondues — disposent d’un espace de saisie dédié, entièrement séparé des notes trimestrielles.');

y = subTitle(doc, y, 'Créer une session et saisir les notes');
y = numberedList(doc, y, [
  'Ouvrez la page « Notes d’Examens » et créez une session (ex. « Devoir Blanc 1 »).',
  'Sélectionnez une classe d’examen, puis une matière.',
  'Saisissez la note de chaque élève sur 20, puis cliquez sur « Enregistrer ».',
]);

y = subTitle(doc, y, 'Consulter le classement');
y = paragraph(doc, y, 'Le bouton « Voir le classement » calcule automatiquement la moyenne pondérée et le rang de chaque élève.');
y = infoBox(doc, y, 'Le classement est toujours calculé par section — une classe de Terminale A4 est classée séparément d’une Terminale D, même si les deux préparent le même examen (BAC 2). Les classes 1ère G2 et 1ère G3 sont traitées comme des classes distinctes.');

// ═══════════════════════════════════════════════════════════════
// SECTION 17 — Rapports académiques
// ═══════════════════════════════════════════════════════════════
y = newPage(doc);
y = sectionHeader(doc, y, 17, 'Rapports académiques et statistiques');
y = paragraph(doc, y, 'La page Rapports Académiques centralise les indicateurs de réussite de l’établissement.');
y = bulletList(doc, y, [
  'Onglets Primaire / Collège / Lycée — taux de réussite par classe et par matière, période par période.',
  'Alertes de baisse de performance — élèves dont la moyenne chute entre deux périodes.',
  'Onglet Examens — moyenne générale et taux de réussite par type d’examen.',
  'Génération d’un rapport PDF officiel en noir et blanc.',
]);

y = subTitle(doc, y, 'Statistiques élèves par âge et par sexe');
y = paragraph(doc, y, 'Le Tableau de bord affiche la répartition des élèves par âge et par sexe (garçons/filles), calculée à partir de la date de naissance.');
y = bulletList(doc, y, [
  'Filtrage par cycle ou par classe, avec totaux recalculés en direct.',
  'Graphique de répartition par âge, ventilé par sexe.',
  'Liste nominative exportable en PDF imprimable.',
]);

// ═══════════════════════════════════════════════════════════════
// SECTION 18 — Communication
// ═══════════════════════════════════════════════════════════════
y = newPage(doc);
y = sectionHeader(doc, y, 18, 'Communication : messagerie et annonces');
y = paragraph(doc, y, 'La messagerie intégrée permet des échanges directs entre l’école et les parents. Les annonces permettent de diffuser une information à tous les parents (ou à une classe précise) en un clic, avec notification automatique.');
y = bulletList(doc, y, [
  'Messagerie sécurisée bidirectionnelle entre l’école et les parents.',
  'Conversations consultables depuis le portail parent et le portail établissement.',
  'Annonces diffusées par notification push à tous les parents ou ciblées par classe.',
  'Historique des annonces publiées.',
]);

// ═══════════════════════════════════════════════════════════════
// SECTION 19 — Portail parent (updated)
// ═══════════════════════════════════════════════════════════════
y = newPage(doc);
y = sectionHeader(doc, y, 19, 'Portail parent');
y = paragraph(doc, y, 'Les parents disposent de leur propre portail de connexion, avec un tableau de bord dédié à leur(s) enfant(s).');
y = bulletList(doc, y, [
  'Suivi en temps réel des paiements et du solde restant.',
  'Téléchargement des reçus de paiement.',
  'Consultation des notes et bulletins dès leur publication.',
  'Historique des présences et badges d’assiduité.',
  'Messagerie directe avec l’établissement.',
  'Espace enfants (« KidsPlace ») avec des contenus éducatifs et ludiques.',
  'Consultation des cours et ressources partagées par l’école.',
  'Paramètres de notification personnalisables.',
]);

y = subTitle(doc, y, 'Enquête de satisfaction');
y = paragraph(doc, y, 'L’établissement peut envoyer des enquêtes de satisfaction aux parents. Les résultats sont consolidés dans un tableau de bord dédié pour identifier les axes d’amélioration.');

// ═══════════════════════════════════════════════════════════════
// SECTION 20 — Sauvegardes (NEW)
// ═══════════════════════════════════════════════════════════════
y = newPage(doc);
y = sectionHeader(doc, y, 20, 'Sauvegardes');
y = paragraph(doc, y, 'Le module Sauvegardes permet de sécuriser l’ensemble des données de l’établissement par des exports réguliers.');
y = bulletList(doc, y, [
  'Sauvegardes automatiques quotidiennes des données.',
  'Export manuel à la demande.',
  'Restauration à partir d’une sauvegarde antérieure.',
  'Historique des sauvegardes avec date et taille.',
]);

// ═══════════════════════════════════════════════════════════════
// SECTION 21 — Historique des activités (NEW)
// ═══════════════════════════════════════════════════════════════
y = sectionHeader(doc, y, 21, 'Historique des activités');
y = paragraph(doc, y, 'Un journal d’audit complet et horodaté de toutes les actions effectuées sur la plateforme : connexions, modifications de fiches, paiements enregistrés, documents téléchargés, messages envoyés.');
y = bulletList(doc, y, [
  'Traçabilité complète de chaque action avec utilisateur, date et heure.',
  'Filtrage par type d’action, par utilisateur ou par date.',
  'Export des logs pour vérification externe.',
]);

// ═══════════════════════════════════════════════════════════════
// SECTION 22 — Paramètres (updated)
// ═══════════════════════════════════════════════════════════════
y = newPage(doc);
y = sectionHeader(doc, y, 22, 'Paramètres de l’établissement');
y = paragraph(doc, y, 'Cette page centralise toute la configuration de l’école : identité, informations légales, année scolaire, tranches de paiement, horaires par cycle et tarification différenciée.');
y = bulletList(doc, y, [
  'Logo, cachet et signature du directeur pour les documents officiels.',
  'Informations légales (IFU, RCCM, NIF, site web, N° d’autorisation) affichées sur les reçus et bulletins.',
  'Configuration des années académiques et des périodes (trimestres/semestres).',
  'Tranches de paiement configurables par classe.',
  'Tarifs différenciés Ancien/Nouveau élève, configurables indépendamment pour chaque classe.',
  'Support Lycée Technique : sections G1, G2, G3, C, D avec classes 1ère et Terminale distinctes.',
  'Heures mensuelles standard pour le calcul des retenues sur salaire.',
  'Frais d’inscription paramétrables par classe.',
  'Libellés de dépenses élève réutilisables (Frais divers).',
  'Messages personnalisés pour les rappels et remerciements de paiement.',
]);

// ═══════════════════════════════════════════════════════════════
// SECTION 23 — Rôles et permissions
// ═══════════════════════════════════════════════════════════════
y = newPage(doc);
y = sectionHeader(doc, y, 23, 'Rôles et permissions — tableau récapitulatif');
y += 2;
y = roleRow(doc, y, 'Directeur / Admin', 'Portail Établissement', 'Accès complet à toutes les fonctionnalités.');
y = roleRow(doc, y, 'Comptable', 'Portail Personnel', 'Paiements, comptabilité, paie, recouvrement, Mon Espace.');
y = roleRow(doc, y, 'Censeur / Proviseur', 'Portail Personnel', 'Académique (notes, notes d’examens, emploi du temps, bulletins), Mon Espace.');
y = roleRow(doc, y, 'Secrétaire', 'Portail Personnel', 'Espace Personnel sans données financières, gestion du personnel, documents.');
y = roleRow(doc, y, 'Superviseur', 'Portail Personnel', 'Scan présence/sortie élèves et personnel, cartes, Mon Espace.');
y = roleRow(doc, y, 'Enseignant', 'Portail Personnel', 'Saisie des notes et notes d’examens, Mon Planning, Mes Bulletins, Mes Absences.');
y = roleRow(doc, y, 'Parent', 'Portail Parent', 'Tableau de bord de son enfant, paiements, reçus, notes, messagerie, KidsPlace.');

// ═══════════════════════════════════════════════════════════════
// SECTION 24 — Assistance
// ═══════════════════════════════════════════════════════════════
y = newPage(doc);
y = sectionHeader(doc, y, 24, 'Assistance et support');
y = paragraph(doc, y, 'Pour toute question ou difficulté rencontrée sur la plateforme, l’équipe DGhubSchool reste disponible :');
y = bulletList(doc, y, [
  'Email : support@dghubschool.com',
  'Centre d’aide en ligne, accessible depuis le site (menu Support).',
  'Pour les établissements clients, un gestionnaire de compte dédié peut être contacté directement.',
  'Téléchargement de l’application mobile depuis la page « Télécharger » du site.',
]);
y += 5;
y = paragraph(doc, y, 'Ce guide est mis à jour à chaque évolution majeure de la plateforme. La version la plus récente est toujours disponible depuis le Centre d’aide du site.');

// ── Save ───────────────────────────────────────────────────────
const buffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync(OUTPUT, buffer);
console.log(`Guide generated: ${OUTPUT} (${(buffer.length / 1024).toFixed(0)} KB, ${currentPage} pages)`);
