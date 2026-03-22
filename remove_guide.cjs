const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Parametres.tsx');
let content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// The `GuideSection` and `CodeBlock` components are approx from line 10 to 44
// We search for `// ── Composant accordéon` and the end of `CodeBlock`
const startIdxComp = lines.findIndex(l => l.includes('// ── Composant accordéon pour le guide développeur'));
const endIdxComp = lines.findIndex(l => l.includes('// ── PAGE PRINCIPALE'));

if (startIdxComp !== -1 && endIdxComp !== -1) {
    lines.splice(startIdxComp, endIdxComp - startIdxComp);
}

// Then we find the GUIDE section in the JSX
const startIdxGuide = lines.findIndex(l => l.includes('{/* ── GUIDE DE PERSONNALISATION DU CODE ─────────────── */}'));
const endIdxGuide = lines.findIndex((l, i) => i > startIdxGuide && l.includes('{/* ── COMPTE UTILISATEUR ────────────────────────────── */}'));

if (startIdxGuide !== -1 && endIdxGuide !== -1) {
    lines.splice(startIdxGuide, endIdxGuide - startIdxGuide);
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
console.log('Guide de personnalisation removed!');
