// ============================================================
// GÉNÉRATEUR DES CONTRATS & SUPPORTS COMMERCIAUX — DGhubSchool
// Exécution : node scripts/generateContracts.cjs
// Sortie    : Contrat_DGHUBSCHOOL_Etablissements.pdf
//             Contrat_DGHUBSCHOOL_Parents.pdf
//             DGHUBSCHOOL_Presentation_Directeurs.pdf
//             (racine du projet)
// ============================================================
const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;

const ACCENT = [217, 119, 6];
const DARK = [15, 23, 42];
const GRAY = [100, 116, 139];
const LIGHT_LINE = [226, 232, 240];
const TEXT = [60, 65, 75];
const GREEN_BG = [236, 253, 245];
const GREEN_BORDER = [16, 185, 129];
const GREEN_TEXT = [4, 120, 87];
const AMBER_BG = [255, 251, 235];
const AMBER_TEXT = [146, 64, 14];
const BLUE_BG = [239, 246, 255];
const BLUE_BORDER = [59, 130, 246];
const BLUE_TEXT = [30, 64, 175];

const COMPANY = {
  name: 'DGHUBSCHOOL',
  rep: 'M. Yiagnigni Mohamed',
  repRole: 'Agent commercial DGHUBSCHOOL',
  siege: 'Légbassito, Lomé — Togo',
  siegeLong: 'Légbassito, Lomé (République Togolaise)',
  phone: '+228 73 16 32 35',
  whatsapp: '+228 72 47 30 27',
  email: 'support@dghubschool.com',
  web: 'www.dghubschool.com',
};

const FONT = 'Montserrat';

function loadFonts(doc) {
  function loadFont(file, style) {
    const fontPath = path.join(__dirname, 'fonts', file);
    const base64 = fs.readFileSync(fontPath).toString('base64');
    doc.addFileToVFS(file, base64);
    doc.addFont(file, FONT, style);
  }
  loadFont('Montserrat-Regular.ttf', 'normal');
  loadFont('Montserrat-Bold.ttf', 'bold');
  loadFont('Montserrat-Italic.ttf', 'italic');
}

let LOGO_B64 = null;
async function getLogo() {
  if (LOGO_B64) return LOGO_B64;
  const logoPath = path.join(ROOT, 'public', 'logo.png');
  const resized = await sharp(logoPath)
    .resize(240, 240, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 85 })
    .toBuffer();
  LOGO_B64 = resized.toString('base64');
  return LOGO_B64;
}

function makeCtx(doc, docLabel) {
  const ctx = { doc, y: MARGIN, pageNum: 0, docLabel };

  ctx.addFooter = () => {
    const d = ctx.doc;
    d.setDrawColor(...LIGHT_LINE);
    d.setLineWidth(0.2);
    d.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14);
    d.setFontSize(7.5);
    d.setFont(FONT, 'normal');
    d.setTextColor(...GRAY);
    d.text(`DGHUBSCHOOL — ${ctx.docLabel} · ${COMPANY.email} · WhatsApp ${COMPANY.whatsapp}`, MARGIN, PAGE_H - 9);
    d.text(String(ctx.pageNum), PAGE_W - MARGIN, PAGE_H - 9, { align: 'right' });
  };

  ctx.newPage = () => {
    if (ctx.pageNum > 0) ctx.addFooter();
    ctx.doc.addPage();
    ctx.pageNum++;
    ctx.y = MARGIN;
  };

  ctx.ensureSpace = (h) => {
    if (ctx.y + h > PAGE_H - 20) ctx.newPage();
  };

  return ctx;
}

async function drawHeader(ctx, { title, subtitle }) {
  const d = ctx.doc;
  const logo = await getLogo();
  d.addImage(`data:image/png;base64,${logo}`, 'PNG', MARGIN, ctx.y, 13, 13);
  d.setFont(FONT, 'bold');
  d.setFontSize(17);
  d.setTextColor(...DARK);
  d.text('DGhubSchool', MARGIN + 17, ctx.y + 6);
  d.setFont(FONT, 'normal');
  d.setFontSize(8.5);
  d.setTextColor(...GRAY);
  d.text(subtitle.tagline, MARGIN + 17, ctx.y + 11.5);
  ctx.y += 17;
  d.setDrawColor(...ACCENT);
  d.setLineWidth(0.8);
  d.line(MARGIN, ctx.y, PAGE_W - MARGIN, ctx.y);
  ctx.y += 4;
  d.setFont(FONT, 'normal');
  d.setFontSize(7.8);
  d.setTextColor(...GRAY);
  const contactLine = `DGHUBSCHOOL — Siège social : ${COMPANY.siege} · Tél : ${COMPANY.phone} · WhatsApp : ${COMPANY.whatsapp} · ${COMPANY.email}`;
  const contactLines = d.splitTextToSize(contactLine, CONTENT_W);
  d.text(contactLines, MARGIN, ctx.y);
  ctx.y += contactLines.length * 4 + 5;

  d.setFont(FONT, 'bold');
  d.setFontSize(19);
  d.setTextColor(...DARK);
  const titleLines = d.splitTextToSize(title, CONTENT_W);
  d.text(titleLines, MARGIN, ctx.y);
  ctx.y += titleLines.length * 7.5 + 1;
  d.setFont(FONT, 'normal');
  d.setFontSize(10.5);
  d.setTextColor(...GRAY);
  d.text(subtitle.line, MARGIN, ctx.y);
  ctx.y += 9;
}

function calloutBanner(ctx, text, variant = 'green') {
  const d = ctx.doc;
  const palettes = {
    green: { bg: GREEN_BG, border: GREEN_BORDER, text: GREEN_TEXT },
    amber: { bg: AMBER_BG, border: ACCENT, text: AMBER_TEXT },
    blue: { bg: BLUE_BG, border: BLUE_BORDER, text: BLUE_TEXT },
  };
  const p = palettes[variant];
  d.setFont(FONT, 'bold');
  d.setFontSize(10);
  const lines = d.splitTextToSize(text, CONTENT_W - 10);
  const h = lines.length * 5.2 + 7;
  ctx.ensureSpace(h + 4);
  d.setFillColor(...p.bg);
  d.setDrawColor(...p.border);
  d.setLineWidth(0.3);
  d.roundedRect(MARGIN, ctx.y, CONTENT_W, h, 1.5, 1.5, 'FD');
  d.setFillColor(...p.border);
  d.rect(MARGIN, ctx.y, 1.4, h, 'F');
  d.setTextColor(...p.text);
  d.text(lines, MARGIN + 6, ctx.y + 6);
  ctx.y += h + 6;
}

function sectionH2(ctx, text) {
  const d = ctx.doc;
  ctx.ensureSpace(14);
  ctx.y += 2;
  d.setFont(FONT, 'bold');
  d.setFontSize(14);
  d.setTextColor(...DARK);
  d.text(text, MARGIN, ctx.y);
  ctx.y += 3;
  d.setDrawColor(...ACCENT);
  d.setLineWidth(0.6);
  d.line(MARGIN, ctx.y, MARGIN + 22, ctx.y);
  ctx.y += 7;
}

function articleH(ctx, text) {
  const d = ctx.doc;
  ctx.ensureSpace(12);
  ctx.y += 1.5;
  d.setFont(FONT, 'bold');
  d.setFontSize(11.5);
  d.setTextColor(...DARK);
  d.text(text, MARGIN, ctx.y);
  ctx.y += 6;
}

function paragraph(ctx, text) {
  const d = ctx.doc;
  d.setFont(FONT, 'normal');
  d.setFontSize(9.8);
  d.setTextColor(...TEXT);
  const lines = d.splitTextToSize(text, CONTENT_W);
  ctx.ensureSpace(lines.length * 4.8 + 3);
  d.text(lines, MARGIN, ctx.y);
  ctx.y += lines.length * 4.8 + 3.5;
}

function bulletList(ctx, items) {
  const d = ctx.doc;
  d.setFont(FONT, 'normal');
  d.setFontSize(9.6);
  for (const item of items) {
    const lines = d.splitTextToSize(item, CONTENT_W - 6);
    ctx.ensureSpace(lines.length * 4.7 + 1.5);
    d.setTextColor(...ACCENT);
    d.text('—', MARGIN, ctx.y);
    d.setTextColor(...TEXT);
    d.text(lines, MARGIN + 4.5, ctx.y);
    ctx.y += lines.length * 4.7 + 1.5;
  }
  ctx.y += 2.5;
}

// Tableau simple : en-tête foncé, lignes zébrées claires, cellules multi-lignes
function table(ctx, headers, rows, colWidths) {
  const d = ctx.doc;
  const headH = 8.5;
  const lineH = 4.3;
  const vPad = 3.6;

  ctx.ensureSpace(headH + 10);
  let x = MARGIN;
  d.setFillColor(...DARK);
  d.rect(MARGIN, ctx.y, CONTENT_W, headH, 'F');
  d.setFont(FONT, 'bold');
  d.setFontSize(8.3);
  d.setTextColor(255, 255, 255);
  headers.forEach((h, i) => {
    d.text(h, x + 3, ctx.y + 5.6);
    x += colWidths[i];
  });
  ctx.y += headH;

  rows.forEach((row, ri) => {
    d.setFont(FONT, 'normal');
    d.setFontSize(8.6);
    const cellLines = row.map((cell, ci) => {
      const val = typeof cell === 'object' ? cell.text : cell;
      return d.splitTextToSize(String(val), colWidths[ci] - 6);
    });
    const rowH = Math.max(...cellLines.map((l) => l.length)) * lineH + vPad;

    ctx.ensureSpace(rowH);
    if (ri % 2 === 1) {
      d.setFillColor(248, 250, 252);
      d.rect(MARGIN, ctx.y, CONTENT_W, rowH, 'F');
    }
    d.setDrawColor(...LIGHT_LINE);
    d.setLineWidth(0.15);
    d.line(MARGIN, ctx.y + rowH, MARGIN + CONTENT_W, ctx.y + rowH);
    x = MARGIN;
    row.forEach((cell, ci) => {
      const isBold = typeof cell === 'object';
      const color = isBold && cell.color ? cell.color : TEXT;
      d.setFont(FONT, isBold ? 'bold' : 'normal');
      d.setFontSize(8.6);
      d.setTextColor(...color);
      d.text(cellLines[ci], x + 3, ctx.y + 5.2);
      x += colWidths[ci];
    });
    ctx.y += rowH;
  });
  ctx.y += 5;
}

function partiesBox(ctx) {
  const d = ctx.doc;
  const boxH = 52;
  ctx.ensureSpace(boxH + 6);
  const colW = (CONTENT_W - 4) / 2;
  const boxes = [
    {
      x: MARGIN,
      title: 'LE PRESTATAIRE',
      lines: [
        [COMPANY.name, true],
        [`Siège social : ${COMPANY.siege}`, false],
        [`Représenté par : ${COMPANY.rep}`, false],
        [`Téléphone : ${COMPANY.phone}`, false],
        [`WhatsApp : ${COMPANY.whatsapp}`, false],
        [`Email : ${COMPANY.email}`, false],
        [`Web : ${COMPANY.web}`, false],
      ],
    },
    {
      x: MARGIN + colW + 4,
      title: "L'ÉTABLISSEMENT (à compléter)",
      lines: [
        ['Nom : ________________________', false],
        ['Adresse : ______________________', false],
        ['Représenté par : ________________', false],
        ['Qualité : ______________________', false],
        ['Téléphone : ____________________', false],
        ['Email : _______________________', false],
      ],
    },
  ];
  boxes.forEach((box) => {
    d.setDrawColor(...LIGHT_LINE);
    d.setLineWidth(0.3);
    d.setFillColor(250, 250, 252);
    d.roundedRect(box.x, ctx.y, colW, boxH, 1.5, 1.5, 'FD');
    d.setFont(FONT, 'bold');
    d.setFontSize(8.3);
    d.setTextColor(...ACCENT);
    d.text(box.title, box.x + 4, ctx.y + 6.5);
    let ly = ctx.y + 13;
    box.lines.forEach(([txt, bold]) => {
      d.setFont(FONT, bold ? 'bold' : 'normal');
      d.setFontSize(bold ? 9.5 : 8.3);
      d.setTextColor(...(bold ? DARK : TEXT));
      const wrapped = d.splitTextToSize(txt, colW - 8);
      d.text(wrapped, box.x + 4, ly);
      ly += wrapped.length * 4.6 + 1.6;
    });
  });
  ctx.y += boxH + 7;
}

function signatureBlock(ctx) {
  const d = ctx.doc;
  ctx.ensureSpace(60);
  ctx.y += 2;
  d.setFont(FONT, 'bold');
  d.setFontSize(12);
  d.setTextColor(...DARK);
  d.text('Signature', MARGIN, ctx.y);
  ctx.y += 3;
  d.setDrawColor(...ACCENT);
  d.setLineWidth(0.6);
  d.line(MARGIN, ctx.y, MARGIN + 22, ctx.y);
  ctx.y += 8;

  d.setFont(FONT, 'normal');
  d.setFontSize(9.5);
  d.setTextColor(...TEXT);
  d.text('Fait à _______________________, le ____ / ____ / ________, en deux exemplaires originaux.', MARGIN, ctx.y);
  ctx.y += 8;

  paragraph(
    ctx,
    `Document présenté et remis à l'École par ${COMPANY.rep} (${COMPANY.repRole}), pour le compte de l'entité ${COMPANY.name}. L'engagement de l'École est matérialisé par la signature ci-dessous.`
  );
  ctx.y += 2;

  const colW = (CONTENT_W - 4) / 2;
  d.setDrawColor(...LIGHT_LINE);
  d.setLineWidth(0.3);
  d.setFillColor(250, 250, 252);
  const boxH = 40;
  ctx.ensureSpace(boxH + 4);
  d.roundedRect(MARGIN, ctx.y, colW, boxH, 1.5, 1.5, 'FD');
  let ly = ctx.y + 7;
  d.setFont(FONT, 'bold');
  d.setFontSize(9.5);
  d.setTextColor(...DARK);
  d.text("Pour l'Établissement", MARGIN + 4, ly);
  ly += 8;
  d.setFont(FONT, 'normal');
  d.setFontSize(8.8);
  d.setTextColor(...TEXT);
  d.text('Nom : ________________________', MARGIN + 4, ly);
  ly += 6.5;
  d.text('Qualité : ________________________', MARGIN + 4, ly);
  ly += 6.5;
  d.text('Signature et cachet de l\'établissement :', MARGIN + 4, ly);
  ctx.y += boxH + 6;
}

async function saveDoc(ctx, filename) {
  ctx.addFooter();
  ctx.doc.save(path.join(ROOT, filename));
  console.log(`✓ ${filename}`);
}

// ============================================================
// 1. CONTRAT ÉTABLISSEMENTS
// ============================================================
async function buildEtablissements() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  loadFonts(doc);
  const ctx = makeCtx(doc, "Contrat d'utilisation et de partenariat");
  ctx.pageNum = 1;

  await drawHeader(ctx, {
    title: "CONTRAT D'UTILISATION ET DE PARTENARIAT",
    subtitle: { tagline: 'Plateforme numérique de gestion scolaire', line: 'Conditions Générales — Établissements scolaires partenaires' },
  });

  calloutBanner(
    ctx,
    "1ère ANNÉE 100 % GRATUITE — Accès complet et illimité à toute la plateforme, sans aucun frais pendant les 12 premiers mois suivant la création du compte établissement.",
    'green'
  );

  paragraph(
    ctx,
    `Entre l'entité ${COMPANY.name}, prestataire de services numériques dont le siège social est situé à ${COMPANY.siegeLong}, représentée par ${COMPANY.rep} (ci-après « le Prestataire »), et l'établissement scolaire créant un compte sur la plateforme ${COMPANY.name} (ci-après « l'École » ou « le Partenaire »), il a été convenu ce qui suit :`
  );
  paragraph(
    ctx,
    `${COMPANY.name} est une plateforme numérique complète de gestion scolaire : inscriptions et scolarité, notes et bulletins conformes DRE, présence par carte à QR Code, comptabilité en partie double, paie du personnel, emploi du temps, pilotage statistique, et un espace de suivi quotidien pour les parents d'élèves (paiements, notes, présences, messagerie).`
  );

  partiesBox(ctx);

  sectionH2(ctx, 'Tarification de la licence Établissement');
  paragraph(
    ctx,
    "La création du compte et l'usage de toutes les fonctionnalités sont gratuits durant la première année. À compter de la 2e année, l'accès de l'École est maintenu au moyen d'une licence annuelle unique par établissement, selon l'effectif d'élèves inscrits :"
  );
  table(
    ctx,
    ["EFFECTIF D'ÉLÈVES", 'LICENCE ANNUELLE (dès l\'an 2)', '1ère ANNÉE'],
    [
      ['De 0 à 500 élèves', '65 000 FCFA / an', { text: 'Gratuit', color: GREEN_TEXT }],
      ['De 500 à 1 000 élèves', '130 000 FCFA / an', { text: 'Gratuit', color: GREEN_TEXT }],
      ['De 1 000 à 1 500 élèves', '200 000 FCFA / an', { text: 'Gratuit', color: GREEN_TEXT }],
    ],
    [62, 76, 40]
  );
  paragraph(
    ctx,
    "Cette licence annuelle est l'unique contribution demandée à l'École. Les modalités de paiement (échéances et moyens acceptés) sont communiquées à l'établissement avant la fin de sa première année d'utilisation. En cas de non-règlement à l'échéance, l'accès peut être suspendu jusqu'au paiement, sans pénalité au-delà du montant dû et sans rupture du présent contrat."
  );

  calloutBanner(
    ctx,
    "Un revenu pour votre École — tracé au centime près : le suivi côté parents repose sur une licence de 2 100 FCFA / élève / an, payable en 3 tranches de 700 FCFA ou en une seule fois. Chaque tranche est enregistrée individuellement et donne lieu à un reçu PDF téléchargeable par le parent. Vous consultez en temps réel, dans votre espace d'administration, la liste détaillée des paiements et le nombre de tranches déjà réglées par élève. Dès qu'une licence est entièrement soldée, DGHUBSCHOOL crédite automatiquement 700 FCFA à votre solde retrait — vous demandez le versement quand vous le souhaitez.",
    'amber'
  );

  sectionH2(ctx, 'Tout ce que la plateforme met à votre disposition');
  paragraph(ctx, "Sans aucune limite du nombre d'élèves, de classes, d'enseignants ou d'utilisateurs. Tout est inclus dès le premier jour :");

  articleH(ctx, '1. Gestion administrative complète');
  bulletList(ctx, [
    "Console d'administration avec statistiques et données comptables en temps réel sur le tableau de bord",
    "Gestion des inscriptions : ajout un par un ou en masse, importation Excel, gestion des redoublants et nouveaux",
    'Organisation des classes par cycle (Maternelle, Primaire, Collège, Lycée) et niveau',
    "Fiche complète par élève : identité, photo, matricule ADSN, acte de naissance, informations médicales et contacts d'urgence",
    "Vérification instantanée de la fiche élève par scan QR Code ou recherche rapide",
    "Gestion du personnel : profils enseignants, comptables, surveillants, direction, chacun avec ses droits d'accès",
  ]);

  articleH(ctx, '2. Gestion pédagogique et évaluation');
  bulletList(ctx, [
    'Saisie des notes en ligne par les enseignants (interrogation, devoir, composition)',
    'Calcul automatique des moyennes pondérées, coefficients configurables',
    "Import Excel des notes en masse à partir d'un modèle pré-rempli",
    'Bulletins scolaires officiels conformes DRE générés en PDF',
    "Notes d'examens nationaux (CEPD, BEPC, BAC) avec classement automatique par section",
    'Rapports académiques, alertes automatiques de déclin de performance, taux de réussite par matière',
  ]);

  articleH(ctx, '3. Présence et scan QR Code');
  bulletList(ctx, [
    'Cartes scolaires avec QR Code haute résolution, 8 par page A4',
    "Pointage des présences et sorties par scan de carte, calcul automatique retard vs. présent",
    "Badge QR enseignant : pointage entrée/sortie du personnel avec calcul automatique des heures manquées",
    'Notification instantanée au parent (Push & SMS) à chaque scan',
  ]);

  articleH(ctx, '4. Gestion financière et recouvrement');
  bulletList(ctx, [
    'Enregistrement des paiements de scolarité (espèces, Mobile Money, virement) avec reçus PDF instantanés',
    "Dépenses élève (maillots, excursions, fournitures...) suivies séparément jusqu'au reçu, à partir d'un catalogue de libellés réutilisable",
    'Suivi du recouvrement par élève, par classe, par période ; export Excel/CSV des rapports financiers',
    'Rappels de paiement automatiques aux parents en retard',
  ]);

  articleH(ctx, '5. Comptabilité en partie double');
  bulletList(ctx, [
    'Plan comptable, journal des écritures, balance, grand-livre',
    'Dépenses avec justificatifs, bilan et compte de résultat calculés automatiquement en temps réel',
    "Export PDF pour l'expert-comptable ou l'administration fiscale",
  ]);

  articleH(ctx, '6. Paie du personnel');
  bulletList(ctx, [
    'Calcul automatique des cotisations CNSS, AMU et IRPP',
    'Bulletins de paie en PDF, individuels ou en lot',
    'Historique des versements et suivi des congés/absences',
  ]);

  articleH(ctx, '7. Emploi du temps intelligent');
  bulletList(ctx, [
    'Construction visuelle par classe et par enseignant',
    "Détection automatique des conflits d'enseignant et des doubles réservations de salle",
  ]);

  articleH(ctx, '8. Portails Personnel & communication interne');
  bulletList(ctx, [
    'Portail Personnel séparé : connexion dédiée pour enseignants, secrétariat et comptabilité',
    "Portail « Mon Espace » : profil, bulletin de paie, planning et absences pour tout le personnel",
    "Numérisation des documents du personnel (contrat, diplôme, pièce d'identité...)",
    'Messagerie interne bidirectionnelle et annonces diffusées par classe ou par groupe',
  ]);

  articleH(ctx, '9. Centre de documents et traçabilité');
  bulletList(ctx, [
    'Stockage sécurisé et partage des documents (autorisations de sortie, certificats de scolarité, ressources pédagogiques)',
    "Journal d'audit complet et horodaté : qui a fait quoi, quand",
    'Export des historiques pour vérification externe',
  ]);

  articleH(ctx, '10. Espace parents (bras marketing gratuit)');
  bulletList(ctx, [
    'Notifications instantanées (Push & SMS) à chaque note et présence',
    'Suivi transparent des paiements, bulletins DRE en temps réel, messagerie avec la vie scolaire',
    "Reçus PDF téléchargeables, enquête de satisfaction et score NPS de l'établissement",
  ]);

  articleH(ctx, '11. App mobile Android & sécurité');
  bulletList(ctx, [
    "App mobile Android native (APK signé et alternative PWA)",
    "Hébergement Cloud dédié, sauvegardes quotidiennes automatiques et isolation totale des données par établissement",
  ]);

  sectionH2(ctx, 'Les articles du contrat');

  articleH(ctx, 'Article 1 — Objet');
  paragraph(ctx, `Le présent contrat définit les conditions dans lesquelles ${COMPANY.name} met à la disposition de l'École un accès à sa plateforme de gestion scolaire.`);

  articleH(ctx, 'Article 2 — Durée');
  paragraph(ctx, "Contrat conclu pour une durée indéterminée à compter de la création du compte. L'École peut cesser d'utiliser la plateforme à tout moment, sans préavis ni pénalité. Le Prestataire peut suspendre l'accès en cas de manquement grave ou de non-respect de la réglementation, après notification préalable, sauf urgence liée à la sécurité des données.");

  articleH(ctx, 'Article 3 — Engagements du Prestataire');
  paragraph(ctx, 'Le Prestataire s\'engage à :');
  bulletList(ctx, [
    "Mettre à disposition, sans limite du nombre d'élèves, l'ensemble des fonctionnalités décrites ci-dessus ;",
    'Assurer un support par WhatsApp et par email pour la prise en main ;',
    "Ne jamais permettre qu'un parent consulte les informations d'un enfant qui n'est pas le sien ;",
    'Traiter toutes les données de manière strictement confidentielle et sécurisée, conformément à la réglementation togolaise sur la protection des données personnelles ;',
    'Réaliser une sauvegarde automatique quotidienne des données, conservée 30 jours ;',
    "Ne rien faire qui puisse nuire à l'image de l'École ;",
    "Permettre le retrait de la part due directement depuis l'espace d'administration, à tout moment ;",
    'Respecter la tarification et la clé de reversement décrites ci-dessus.',
  ]);

  articleH(ctx, "Article 4 — Engagements de l'École");
  paragraph(ctx, "L'École s'engage à :");
  bulletList(ctx, [
    "Fournir des informations exactes et à jour sur l'établissement et son personnel ;",
    'Ne pas partager ses identifiants administrateur avec des personnes non autorisées ;',
    'Utiliser la plateforme dans le respect de la législation togolaise sur la protection des données des élèves ;',
    "Être responsable de la validité et de la légalité des documents qu'elle téléverse (actes de naissance, reçus, photos d'élèves).",
  ]);

  articleH(ctx, 'Article 5 — Retraits');
  paragraph(ctx, "L'École peut demander à tout moment le retrait de la part qui lui est due depuis son espace d'administration, en indiquant le nom et le numéro du bénéficiaire ainsi qu'une pièce justificative si demandée. Les demandes sont traitées dans les meilleurs délais.");

  articleH(ctx, 'Article 6 — Confiance et bonne foi');
  paragraph(ctx, "Les parties déclarent avoir librement consenti au présent contrat. Toute relation afférente doit être marquée du sceau de la confiance et présumée de bonne foi, sans exclure les vérifications nécessaires pour éviter toute erreur préjudiciable au partenariat.");

  articleH(ctx, 'Article 7 — Règlement des litiges');
  paragraph(ctx, "Tout litige relatif à l'exécution ou à l'interprétation du présent contrat fera l'objet d'un règlement amiable. En cas d'échec, le litige sera soumis au Centre d'Arbitrage, de Médiation et de Conciliation du Togo (CAMECO-Togo) : (1) commission de médiation, puis (2) procédure d'arbitrage.");

  articleH(ctx, 'Article 8 — Modification & Entrée en vigueur');
  paragraph(ctx, "Le Prestataire peut faire évoluer les présentes conditions pour accompagner l'évolution de la plateforme ; toute modification substantielle est notifiée avant son entrée en vigueur. Le contrat entre en vigueur dès son acceptation par l'École, matérialisée soit par la création de son compte établissement, soit par la signature du présent document lors de sa remise en main propre.");

  signatureBlock(ctx);

  await saveDoc(ctx, 'Contrat_DGHUBSCHOOL_Etablissements.pdf');
}

// ============================================================
// 2. CONTRAT PARENTS
// ============================================================
async function buildParents() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  loadFonts(doc);
  const ctx = makeCtx(doc, "Contrat d'abonnement Parents");
  ctx.pageNum = 1;

  await drawHeader(ctx, {
    title: "CONTRAT D'ABONNEMENT — PARENTS D'ÉLÈVES",
    subtitle: { tagline: 'Plateforme numérique de suivi scolaire', line: 'Conditions générales du service de suivi scolaire' },
  });

  calloutBanner(
    ctx,
    '14 JOURS D\'ESSAI 100 % GRATUIT — Testez toutes les fonctionnalités du suivi en temps réel avant tout engagement financier.',
    'green'
  );

  paragraph(
    ctx,
    `Le présent contrat lie ${COMPANY.name}, prestataire de services numériques éducatifs dont le siège social est situé à ${COMPANY.siegeLong}, au parent d'élève utilisateur de la plateforme (ci-après « le Parent »). Il définit les conditions d'accès à l'espace de suivi des enfants inscrits dans un établissement partenaire.`
  );

  sectionH2(ctx, 'Combien ça coûte, comment ça se paie');
  table(
    ctx,
    ['FORMULE', 'MONTANT', 'MODALITÉ'],
    [
      ['Essai découverte', { text: 'Gratuit', color: GREEN_TEXT }, '14 jours à compter de la création du compte parent'],
      ['Règlement en 1 fois', '2 100 FCFA / élève / an', 'Un seul paiement, licence immédiatement active'],
      ['Règlement en tranches', '3 × 700 FCFA / élève', "3 paiements successifs (tranche 1/3, 2/3, 3/3). Licence complète à la 3e tranche."],
    ],
    [48, 46, 84]
  );

  sectionH2(ctx, 'Comment fonctionne le paiement en tranches');
  bulletList(ctx, [
    'Vous choisissez « Payer une tranche (700 FCFA) » depuis votre espace parent. Vous êtes redirigé vers la plateforme de paiement sécurisée.',
    'Après paiement, vous revenez automatiquement sur DGHUBSCHOOL. Le système enregistre votre tranche et vous affiche : « Tranche 1/3 validée · Il vous reste 1 400 FCFA à régler ».',
    'Vous répétez l\'opération pour la tranche 2, puis la tranche 3. À chaque validation, un reçu PDF est généré et téléchargeable depuis votre espace personnel.',
    'Dès que les 2 100 FCFA sont cumulés, votre licence bascule automatiquement en « Soldée » et l\'accès complet aux données de votre enfant est débloqué pour toute l\'année scolaire.',
  ]);

  calloutBanner(
    ctx,
    "Vos reçus, en un clic : chaque tranche que vous réglez génère un reçu PDF à votre nom (élève concerné, numéro de tranche, date, clé de licence, montant). Ces reçus sont accessibles à tout moment depuis la section « Mes reçus de licence » de votre tableau de bord parent.",
    'blue'
  );

  sectionH2(ctx, 'Ce à quoi votre licence vous donne accès');
  bulletList(ctx, [
    'Notifications instantanées (Push & SMS) à chaque note saisie par un enseignant',
    'Alertes de présence en temps réel : entrée / sortie de l\'établissement (scan QR Code)',
    'Consultation des bulletins officiels DRE au format PDF, dès leur édition',
    'Suivi transparent des versements de scolarité et du solde restant à régler',
    'Messagerie interne bidirectionnelle avec la vie scolaire',
    'Alertes en cas de déclin de performance ou d\'augmentation des absences de votre enfant',
    'Suivi des dépenses ponctuelles de votre enfant (maillots, excursions, fournitures...) directement sur le reçu, avec leur statut de paiement',
    'Historique complet des paiements et reçus téléchargeables',
    'Réponse au sondage de satisfaction (score NPS de l\'établissement)',
  ]);

  sectionH2(ctx, 'Les articles du contrat');

  articleH(ctx, 'Article 1 — Objet');
  paragraph(ctx, `${COMPANY.name} met à la disposition du Parent un espace numérique permettant de suivre en temps réel la scolarité des enfants qui lui sont rattachés (notes, présences, paiements, messagerie, bulletins).`);

  articleH(ctx, 'Article 2 — Durée & Essai gratuit');
  paragraph(ctx, "Le compte parent est gratuit pendant 14 jours à compter de sa création. Passé ce délai, l'accès complet aux données est conditionné à l'activation d'une licence annuelle (voir Article 3). En dehors de cette licence, le Parent peut cesser d'utiliser la plateforme à tout moment, sans préavis ni pénalité.");

  articleH(ctx, 'Article 3 — Licence & Paiements');
  paragraph(ctx, "La licence annuelle est de 2 100 FCFA par élève, payable en une seule fois ou en 3 tranches de 700 FCFA.");
  bulletList(ctx, [
    'Chaque tranche est enregistrée individuellement (date, clé, montant) ;',
    'Chaque tranche génère un reçu PDF téléchargeable depuis l\'espace parent ;',
    'La licence bascule en Soldée dès que 2 100 FCFA cumulés sont atteints ;',
    'Aucune obligation de délai entre les tranches — vous payez à votre rythme.',
  ]);

  articleH(ctx, "Article 4 — Reversement à l'établissement");
  paragraph(ctx, "Sur chaque licence entièrement soldée, DGHUBSCHOOL reverse automatiquement 700 FCFA à l'école de votre enfant. Ce reversement est utilisé par l'établissement selon sa propre politique interne (réinvestissement, primes, matériel pédagogique...).");

  articleH(ctx, 'Article 5 — Confidentialité & Protection des données');
  paragraph(ctx, "DGHUBSCHOOL traite les données personnelles du Parent et de ses enfants dans le strict respect de la réglementation togolaise sur la protection des données personnelles. Il n'est en aucun cas possible qu'un parent consulte les informations d'un enfant qui n'est pas le sien. Les données sont chiffrées en transit et sauvegardées quotidiennement (conservation 30 jours).");

  articleH(ctx, 'Article 6 — Suspension & Résiliation');
  paragraph(ctx, "Le Parent peut à tout moment cesser d'utiliser son compte, sans préavis. En cas de licence non renouvelée à l'échéance annuelle, l'accès complet est suspendu jusqu'au règlement, sans pénalité. Le Prestataire peut suspendre un compte en cas de manquement grave (fraude, tentative de contournement, usage abusif), après notification préalable sauf urgence sécuritaire.");

  articleH(ctx, 'Article 7 — Support & Contact');
  paragraph(ctx, `Le support est assuré par WhatsApp et par email tous les jours ouvrés. En cas de problème avec un paiement, un reçu ou une notification, contactez-nous : ${COMPANY.email} — WhatsApp ${COMPANY.whatsapp}.`);

  articleH(ctx, 'Article 8 — Modification du contrat');
  paragraph(ctx, "DGHUBSCHOOL peut faire évoluer les présentes conditions pour accompagner l'évolution de la plateforme. Toute modification substantielle est notifiée au Parent par email ou depuis son espace personnel avant son entrée en vigueur.");

  articleH(ctx, 'Article 9 — Règlement des litiges');
  paragraph(ctx, "Tout litige relatif à l'exécution ou à l'interprétation du présent contrat fera l'objet d'un règlement amiable. En cas d'échec, le litige sera soumis au Centre d'Arbitrage, de Médiation et de Conciliation du Togo (CAMECO-Togo) : (1) commission de médiation, puis (2) procédure d'arbitrage.");

  articleH(ctx, 'Article 10 — Entrée en vigueur');
  paragraph(ctx, "Le présent contrat entre en vigueur dès la création du compte parent et l'acceptation des présentes conditions.");

  await saveDoc(ctx, 'Contrat_DGHUBSCHOOL_Parents.pdf');
}

// ============================================================
// 3. PRÉSENTATION COMMERCIALE — DIRECTEURS
// ============================================================
async function buildPresentation() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  loadFonts(doc);
  const ctx = makeCtx(doc, 'Présentation commerciale');
  ctx.pageNum = 1;

  await drawHeader(ctx, {
    title: 'PRÉSENTATION COMMERCIALE',
    subtitle: { tagline: 'Plateforme numérique complète de gestion scolaire', line: "À l'attention des Directeurs et Directrices d'Établissement" },
  });

  calloutBanner(
    ctx,
    'DIGITALISEZ VOTRE ÉCOLE EN 24H — GRATUITEMENT PENDANT 1 AN — ET RECEVEZ MÊME UN REVENU MENSUEL.',
    'blue'
  );

  sectionH2(ctx, 'Ce que DGhubSchool va changer pour votre établissement');
  paragraph(ctx, "DGhubSchool est une plateforme numérique tout-en-un conçue spécifiquement pour les établissements scolaires d'Afrique de l'Ouest. Contrairement aux logiciels qui ne couvrent qu'une partie du métier (juste les notes, juste la caisse…), DGhubSchool intègre l'ensemble de vos processus administratifs, financiers, pédagogiques et de communication dans une seule solution accessible depuis un ordinateur, un téléphone ou une tablette.");
  paragraph(ctx, "Le tout accompagné d'une app mobile Android pour le personnel de surveillance et les parents, d'un portail parent qui remplace le carnet de correspondance, et d'un modèle économique unique qui reverse une part directe des abonnements parents à votre école.");

  sectionH2(ctx, "L'avantage financier : votre école gagne de l'argent");
  calloutBanner(ctx, 'Chaque licence parent soldée = 700 FCFA reversés automatiquement à votre école.', 'green');
  paragraph(ctx, "Sur les 2 100 FCFA annuels payés par chaque parent d'élève pour accéder à l'espace de suivi de son enfant, DGhubSchool vous en reverse un tiers, soit 700 FCFA (33,33 %). Ce montant est automatiquement crédité à votre solde retrait dès qu'un parent finit de payer sa licence — vous demandez le versement quand vous le souhaitez depuis votre espace d'administration.");

  sectionH2(ctx, 'Combien votre école peut-elle gagner ?');
  table(
    ctx,
    ['EFFECTIF', 'PARENTS ABONNÉS (est. 70 %)', 'REVENU ÉCOLE / AN'],
    [
      ['100 élèves', '70 parents', { text: '49 000 FCFA', color: GREEN_TEXT }],
      ['300 élèves', '210 parents', { text: '147 000 FCFA', color: GREEN_TEXT }],
      ['500 élèves', '350 parents', { text: '245 000 FCFA', color: GREEN_TEXT }],
      ['1 000 élèves', '700 parents', { text: '490 000 FCFA', color: GREEN_TEXT }],
      ['1 500 élèves', '1 050 parents', { text: '735 000 FCFA', color: GREEN_TEXT }],
    ],
    [56, 74, 48]
  );
  paragraph(ctx, "Exemple concret : une école de 500 élèves peut générer jusqu'à 245 000 FCFA de revenus annuels supplémentaires — l'équivalent d'un salaire d'enseignant, sans effort commercial de votre part. Chaque paiement parent, chaque tranche réglée, est enregistré et visible en temps réel dans votre espace d'administration.");

  // Page 2 — fonctionnalités
  ctx.newPage();
  sectionH2(ctx, 'Toutes les fonctionnalités incluses');
  paragraph(ctx, "Sans aucune limite du nombre d'élèves, de classes ou d'enseignants. Tout est inclus dès le premier jour.");

  articleH(ctx, '1. Gestion administrative complète');
  bulletList(ctx, [
    'Tableau de bord avec statistiques temps réel : élèves, classes, enseignants, taux de recouvrement, chiffres comptables synthétisés',
    'Gestion des inscriptions : ajout un par un ou en masse, importation Excel, gestion des redoublants et nouveaux',
    'Organisation des classes par cycle (Maternelle, Primaire, Collège, Lycée) et niveau',
    'Fiche complète par élève : identité, photo, matricule ADSN, acte de naissance, coordonnées parent, situation scolaire, informations médicales et contacts d\'urgence',
    'Vérification instantanée de la fiche élève par scan QR Code ou recherche rapide (moins de 5 secondes)',
    'Gestion du personnel : profils enseignants, comptables, surveillants, direction — chacun avec ses droits d\'accès',
  ]);

  articleH(ctx, '2. Gestion pédagogique et évaluation');
  bulletList(ctx, [
    'Saisie des notes en ligne par les enseignants (interro, devoir, composition)',
    'Calcul automatique des moyennes pondérées, coefficients configurables',
    'Import Excel des notes en masse à partir d\'un modèle pré-rempli',
    'Bulletins scolaires officiels conformes DRE générés en PDF',
    'Notes d\'examens nationaux (CEPD, BEPC, BAC) avec classement automatique par section',
    'Rapports académiques, alertes automatiques de déclin de performance',
    'Détection des matières faibles : taux de réussite par matière et par classe',
  ]);

  articleH(ctx, '3. Système de scan QR Code (surveillance & enseignants)');
  bulletList(ctx, [
    'Génération automatique de cartes scolaires ISO 85×54 mm avec QR Code, 8 par page A4',
    'Scan de présence à l\'arrivée et à la sortie, calcul automatique retard vs. présent',
    'Badge QR enseignant : pointage entrée/sortie du personnel avec calcul automatique des heures manquées',
    'Scan d\'information : accès instantané à la fiche complète de l\'élève',
    'Notification instantanée au parent (Push + SMS) à chaque scan',
  ]);

  articleH(ctx, '4. Gestion financière et recouvrement');
  bulletList(ctx, [
    'Enregistrement des paiements de scolarité (espèces, Mobile Money, virement bancaire) avec reçus PDF instantanés',
    'Dépenses élève (maillots, excursions, fournitures...) suivies séparément jusqu\'au reçu, à partir d\'un catalogue de libellés réutilisable',
    'Suivi du recouvrement par élève, par classe, par période ; export Excel/CSV des rapports financiers',
    'Configuration des frais personnalisée par classe (écolage, cantine, transport, fournitures)',
    'Rappels automatiques aux parents en retard (SMS + Push)',
    'Rapports financiers détaillés en PDF pour les conseils d\'administration',
  ]);

  // Page 3 — fonctionnalités suite
  ctx.newPage();
  articleH(ctx, '5. Comptabilité en partie double (conforme OHADA)');
  bulletList(ctx, [
    'Plan comptable pré-configuré aux normes OHADA',
    'Saisie des dépenses avec justificatifs (photos de reçus, factures)',
    'Journal des écritures, balance, grand-livre',
    'Bilan comptable et compte de résultat calculés automatiquement en temps réel',
    'Export PDF pour votre expert-comptable ou l\'administration fiscale',
  ]);

  articleH(ctx, '6. Paie du personnel');
  bulletList(ctx, [
    'Gestion des salaires (enseignant, administratif, technique)',
    'Calcul automatique CNSS, AMU et IRPP selon les taux togolais en vigueur',
    'Bulletins de paie en PDF, individuels ou en lot',
    'Historique des versements et suivi des congés/absences',
  ]);

  articleH(ctx, '7. Emploi du temps intelligent');
  bulletList(ctx, [
    'Construction visuelle par classe et par enseignant',
    'Détection automatique des conflits d\'enseignant et des doubles réservations de salle',
    'Consultable en ligne par les enseignants et les parents',
  ]);

  articleH(ctx, '8. Portail parents (bras marketing gratuit)');
  bulletList(ctx, [
    'Notifications instantanées Push + SMS à chaque note et chaque scan de présence',
    'Bulletins officiels DRE en temps réel dès leur édition',
    'Suivi transparent des paiements, messagerie interne avec la vie scolaire',
    'Reçus PDF téléchargeables (scolarité + licence), sondage NPS',
  ]);

  articleH(ctx, '9. Portails Personnel & communication interne');
  bulletList(ctx, [
    'Portail Personnel séparé : connexion dédiée pour enseignants, secrétariat et comptabilité, indépendante du portail direction',
    'Portail « Mon Espace » : profil, bulletin de paie, planning et absences pour tout le personnel',
    'Numérisation des documents du personnel (contrat, diplôme, pièce d\'identité...)',
    'Centre de documents : stockage sécurisé et partage direct avec parents et enseignants (autorisations de sortie, certificats de scolarité, ressources pédagogiques)',
    'Messagerie interne bidirectionnelle et annonces diffusées par classe ou par groupe, avec notifications push',
    'Journal d\'audit complet et horodaté : historique de toutes les activités',
  ]);

  articleH(ctx, '10. App mobile Android native');
  bulletList(ctx, [
    'APK signé téléchargeable directement depuis le site, installation en 30 secondes par QR Code',
    'Alternative PWA installable depuis Chrome / Edge en 1 clic',
    'Notifications push natives pour la direction, les enseignants et les parents',
  ]);

  articleH(ctx, '11. Sécurité et fiabilité');
  bulletList(ctx, [
    'Hébergement Cloud dédié avec chiffrement de bout en bout',
    'Sauvegardes automatiques quotidiennes conservées 30 jours',
    'Isolation totale des données par établissement',
    'Conformité à la réglementation togolaise sur la protection des données personnelles',
    'Contrôle d\'accès par rôle, historique d\'activité (audit complet)',
  ]);

  // Page 4 — tarifs et démarrage
  ctx.newPage();
  sectionH2(ctx, 'Tarifs — La 1ère année est 100 % GRATUITE');
  calloutBanner(
    ctx,
    "ANNÉE 1 — GRATUIT INTÉGRAL. Aucun paiement d'aucune sorte pendant les 12 premiers mois à compter de la création de votre compte établissement. Accès à 100 % des fonctionnalités, sans limite d'élèves, sans carte bancaire requise.",
    'green'
  );

  paragraph(ctx, 'À partir de la 2ème année — Licence annuelle par établissement');
  table(
    ctx,
    ["EFFECTIF DE L'ÉCOLE", 'LICENCE ANNUELLE'],
    [
      ['0 à 500 élèves', '65 000 FCFA / an'],
      ['500 à 1 000 élèves', '130 000 FCFA / an'],
      ['1 000 à 1 500 élèves', '200 000 FCFA / an'],
    ],
    [90, 88]
  );
  paragraph(ctx, "Aucune limite du nombre d'utilisateurs (directeur, comptables, enseignants, surveillants). Les modalités de paiement sont communiquées avant la fin de votre 1ère année. Rappel : les 700 FCFA reversés par licence parent soldée peuvent couvrir tout ou partie de cette licence — pour une école de 300 élèves, les revenus parents (~147 000 FCFA/an) dépassent déjà le coût de la licence 500 élèves.");

  sectionH2(ctx, 'Comment démarrer avec DGhubSchool');
  bulletList(ctx, [
    `Étape 1 — Créez votre compte sur ${COMPANY.web} (2 minutes) et acceptez le contrat de partenariat.`,
    "Étape 2 — Importez vos données : liste d'élèves, classes, enseignants (Excel accepté). Notre équipe support vous accompagne gratuitement.",
    'Étape 3 — Générez et distribuez les cartes scolaires QR à vos élèves (8 par page A4).',
    'Étape 4 — Formez vos équipes : tutoriels vidéo et support WhatsApp réactif.',
    'Étape 5 — Invitez les parents à créer leur compte (SMS d\'invitation automatique). Chaque licence soldée = 700 FCFA pour votre école.',
  ]);

  calloutBanner(
    ctx,
    `Une démo personnalisée offerte à tout établissement intéressé. Je vous accompagne personnellement dans la mise en place — écrivez-moi ou appelez-moi, je réponds sous 24h. Email : ${COMPANY.email} · Tél : ${COMPANY.phone} · WhatsApp : ${COMPANY.whatsapp}`,
    'amber'
  );

  ctx.ensureSpace(30);
  const d = ctx.doc;
  d.setFillColor(...DARK);
  d.roundedRect(MARGIN, ctx.y, CONTENT_W, 26, 2, 2, 'F');
  d.setFont(FONT, 'bold');
  d.setFontSize(11);
  d.setTextColor(255, 255, 255);
  d.text('Créez votre compte gratuitement dès aujourd\'hui', PAGE_W / 2, ctx.y + 10, { align: 'center' });
  d.setFont(FONT, 'normal');
  d.setFontSize(9.5);
  d.setTextColor(...ACCENT);
  d.text(COMPANY.web, PAGE_W / 2, ctx.y + 17, { align: 'center' });
  d.setFontSize(8);
  d.setTextColor(200, 205, 215);
  d.text('Aucune carte bancaire · 100 % gratuit la 1ère année · Support inclus', PAGE_W / 2, ctx.y + 22.5, { align: 'center' });
  ctx.y += 32;

  await saveDoc(ctx, 'DGHUBSCHOOL_Presentation_Directeurs.pdf');
}

async function main() {
  await buildEtablissements();
  await buildParents();
  await buildPresentation();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
