// ============================================================
// Envoi des notes de version aux directeurs apres un build/deploiement.
//
//   node scripts/sendReleaseEmail.js release-notes/2026-09-29.json            -> apercu HTML seulement
//   node scripts/sendReleaseEmail.js release-notes/2026-09-29.json --test moi@exemple.com
//   node scripts/sendReleaseEmail.js release-notes/2026-09-29.json --send     -> toutes les ecoles
//
// Format du fichier JSON :
//   { "category": "update", "subject": "...", "title": "...", "intro": "...",
//     "highlights": ["..."], "body": "...", "ctaLabel": "...", "ctaUrl": "https://..." }
// ============================================================
'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const fs = require('fs');
const service = require('../services/directorEmailService');

async function main() {
    const [file, ...flags] = process.argv.slice(2);
    if (!file) {
        console.error('Usage : node scripts/sendReleaseEmail.js <notes.json> [--test email | --send]');
        process.exit(1);
    }
    const notes = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
    const { category = 'update', subject, ...content } = notes;

    const testIdx = flags.indexOf('--test');
    if (testIdx !== -1) {
        const to = flags[testIdx + 1] || process.env.SUPERADMIN_EMAIL;
        await service.sendTest({ category, subject, content, to });
        console.log(`✅ E-mail de test envoyé à ${to}`);
        return;
    }

    if (flags.includes('--send')) {
        const recipients = await service.getRecipients(category);
        console.log(`📧 Envoi à ${recipients.length} école(s)...`);
        const result = await service.sendCampaign({ category, subject, content, source: 'release' });
        console.log(`✅ ${result.sent} envoyé(s), ${result.failed} échec(s).`);
        return;
    }

    const out = path.resolve(file.replace(/\.json$/, '') + '.preview.html');
    fs.writeFileSync(out, service.preview({ category, content }));
    const recipients = await service.getRecipients(category).catch(() => []);
    console.log(`👀 Aperçu écrit dans ${out}`);
    console.log(`   Destinataires si --send : ${recipients.length} école(s). Rien n'a été envoyé.`);
}

main().then(() => process.exit(0)).catch((err) => {
    console.error('❌', err.message);
    process.exit(1);
});
