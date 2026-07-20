const { supabase, supabaseAdmin } = require('../utils/supabase');

const EXPENSE_PROOFS_BUCKET = 'expense-proofs';
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1h — bucket privé, même pattern que backupController.js
// Codes du plan comptable par défaut (voir backend/migrations/accounting.sql)
const CODE_CAISSE = '571';
const CODE_BANQUE = '521';
const CODE_PRODUITS_SCOLARITE = '706';

async function getAccountByCode(schoolSlug, code) {
    const { data, error } = await supabase
        .from(`chart_of_accounts_${schoolSlug}`)
        .select('id, code, name, type')
        .eq('code', code)
        .single();
    if (error) throw error;
    return data;
}

/**
 * GET /api/accounting/accounts
 */
async function getAccounts(req, res) {
    const { schoolSlug } = req.user;
    try {
        const { data, error } = await supabase
            .from(`chart_of_accounts_${schoolSlug}`)
            .select('*')
            .order('code', { ascending: true });
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * Charge toutes les lignes d'écritures avec leur écriture et leur compte associés.
 * Les écoles ont un volume de données raisonnable, l'agrégation se fait en mémoire
 * (cohérent avec le reste du backend, ex. calculs de moyennes de classe côté parent).
 */
async function fetchAllLines(schoolSlug) {
    const { data, error } = await supabase
        .from(`journal_entry_lines_${schoolSlug}`)
        .select(`
            id, debit, credit, account_id,
            entry:entry_id ( id, date, reference, description, proof_url ),
            account:account_id ( id, code, name, type )
        `);
    if (error) throw error;
    return data || [];
}

/**
 * GET /api/accounting/entries
 * Historique du journal (écritures + leurs lignes), plus récentes d'abord.
 */
async function getJournalEntries(req, res) {
    const { schoolSlug } = req.user;
    try {
        const lines = await fetchAllLines(schoolSlug);
        const entriesById = {};
        for (const line of lines) {
            if (!line.entry) continue;
            const entryId = line.entry.id;
            if (!entriesById[entryId]) {
                entriesById[entryId] = { ...line.entry, lines: [] };
            }
            entriesById[entryId].lines.push({
                id: line.id,
                debit: Number(line.debit),
                credit: Number(line.credit),
                account: line.account
            });
        }
        const entries = Object.values(entriesById).sort((a, b) => new Date(b.date) - new Date(a.date));

        // Bucket "expense-proofs" privé : proof_url stocke un chemin, converti en
        // URL signée temporaire ici (même pattern que backupController.js).
        const client = supabaseAdmin || supabase;
        const entriesWithSignedProofs = await Promise.all(entries.map(async (entry) => {
            if (!entry.proof_url) return entry;
            const { data } = await client.storage.from(EXPENSE_PROOFS_BUCKET).createSignedUrl(entry.proof_url, SIGNED_URL_TTL_SECONDS);
            return { ...entry, proof_url: data?.signedUrl || null };
        }));

        return res.json(entriesWithSignedProofs);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * POST /api/accounting/expenses
 * Enregistre une dépense de l'école : débite le compte de charge choisi,
 * crédite la Caisse ou la Banque selon le mode de paiement.
 */
async function addExpense(req, res) {
    const { schoolSlug, id: userId } = req.user;
    const { amount, accountId, description, paymentMethod, proofUrl, date } = req.body;

    if (!amount || amount <= 0 || !accountId || !description || !['caisse', 'banque'].includes(paymentMethod)) {
        return res.status(400).json({ error: 'Données manquantes ou invalides.' });
    }

    try {
        const treasuryAccount = await getAccountByCode(schoolSlug, paymentMethod === 'caisse' ? CODE_CAISSE : CODE_BANQUE);

        const { data: entry, error: entryErr } = await supabase
            .from(`journal_entries_${schoolSlug}`)
            .insert({
                date: date || new Date().toISOString().slice(0, 10),
                reference: 'DEPENSE',
                description,
                proof_url: proofUrl || null,
                created_by: userId
            })
            .select('*')
            .single();
        if (entryErr) throw entryErr;

        const { error: linesErr } = await supabase
            .from(`journal_entry_lines_${schoolSlug}`)
            .insert([
                { entry_id: entry.id, account_id: accountId, debit: amount, credit: 0 },
                { entry_id: entry.id, account_id: treasuryAccount.id, debit: 0, credit: amount }
            ]);
        if (linesErr) throw linesErr;

        return res.json({ success: true, entry });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * POST /api/accounting/expenses/upload-proof
 * Body JSON: { imageBase64: "data:image/jpeg;base64,..." }
 */
async function uploadExpenseProof(req, res) {
    const { schoolSlug } = req.user;
    const { imageBase64 } = req.body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({ error: 'Image base64 manquante.' });
    }

    try {
        const matches = imageBase64.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
            return res.status(400).json({ error: 'Format base64 invalide. Attendu: data:image/...;base64,...' });
        }

        const imageFormat = matches[1];
        const base64Data = matches[2];
        const imageBuffer = Buffer.from(base64Data, 'base64');

        if (imageBuffer.length > 3 * 1024 * 1024) {
            return res.status(413).json({ error: 'Image trop grande. Maximum 3 MB.' });
        }

        const filePath = `${schoolSlug}/${Date.now()}.${imageFormat}`;
        const contentType = `image/${imageFormat}`;
        const client = supabaseAdmin || supabase;

        const { error: uploadError } = await client.storage
            .from(EXPENSE_PROOFS_BUCKET)
            .upload(filePath, imageBuffer, { contentType, upsert: true });

        if (uploadError) {
            return res.status(500).json({ error: 'Erreur upload Storage: ' + uploadError.message });
        }

        // Bucket privé : on renvoie le chemin de stockage, converti en URL signée à
        // l'affichage par getJournalEntries().
        return res.json({ success: true, proofUrl: filePath });
    } catch (err) {
        return res.status(500).json({ error: 'Erreur interne: ' + err.message });
    }
}

/**
 * GET /api/accounting/balance
 * Balance : somme débit/crédit par compte, sur une période optionnelle
 * (?from=YYYY-MM-DD&to=YYYY-MM-DD).
 */
async function getBalance(req, res) {
    const { schoolSlug } = req.user;
    const { from, to } = req.query;

    try {
        const lines = await fetchAllLines(schoolSlug);
        const filtered = lines.filter(l => {
            if (!l.entry) return false;
            if (from && l.entry.date < from) return false;
            if (to && l.entry.date > to) return false;
            return true;
        });

        const byAccount = {};
        for (const line of filtered) {
            const acc = line.account;
            if (!acc) continue;
            if (!byAccount[acc.id]) {
                byAccount[acc.id] = { accountId: acc.id, code: acc.code, name: acc.name, type: acc.type, debit: 0, credit: 0 };
            }
            byAccount[acc.id].debit += Number(line.debit);
            byAccount[acc.id].credit += Number(line.credit);
        }

        const rows = Object.values(byAccount)
            .map(r => ({ ...r, balance: r.debit - r.credit }))
            .sort((a, b) => a.code.localeCompare(b.code));

        return res.json({ rows });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * GET /api/accounting/bilan
 * Bilan (actif / passif / capitaux propres) à une date donnée (?at=YYYY-MM-DD, défaut aujourd'hui).
 * Le résultat net (produits - charges) cumulé jusqu'à cette date est intégré aux
 * capitaux propres pour que le bilan reste équilibré (approche simplifiée).
 */
async function getBilan(req, res) {
    const { schoolSlug } = req.user;
    const at = req.query.at || new Date().toISOString().slice(0, 10);

    try {
        const lines = await fetchAllLines(schoolSlug);
        const upToDate = lines.filter(l => l.entry && l.entry.date <= at);

        const totalsByType = { actif: 0, passif: 0, capitaux_propres: 0, produit: 0, charge: 0 };
        const rowsByType = { actif: [], passif: [], capitaux_propres: [] };
        const byAccount = {};

        for (const line of upToDate) {
            const acc = line.account;
            if (!acc) continue;
            if (!byAccount[acc.id]) byAccount[acc.id] = { ...acc, debit: 0, credit: 0 };
            byAccount[acc.id].debit += Number(line.debit);
            byAccount[acc.id].credit += Number(line.credit);
        }

        for (const acc of Object.values(byAccount)) {
            const solde = acc.type === 'actif' || acc.type === 'charge'
                ? acc.debit - acc.credit
                : acc.credit - acc.debit;

            totalsByType[acc.type] += solde;
            if (rowsByType[acc.type]) {
                rowsByType[acc.type].push({ code: acc.code, name: acc.name, amount: solde });
            }
        }

        const resultatNet = totalsByType.produit - totalsByType.charge;
        rowsByType.capitaux_propres.push({ code: '—', name: 'Résultat net (cumulé)', amount: resultatNet });

        return res.json({
            at,
            actif: rowsByType.actif,
            passif: rowsByType.passif,
            capitauxPropres: rowsByType.capitaux_propres,
            totalActif: totalsByType.actif,
            totalPassifEtCapitaux: totalsByType.passif + totalsByType.capitaux_propres + resultatNet
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * GET /api/accounting/compte-resultat
 * Compte de résultat (produits / charges) sur une période (?from=&to=).
 */
async function getCompteResultat(req, res) {
    const { schoolSlug } = req.user;
    const { from, to } = req.query;

    try {
        const lines = await fetchAllLines(schoolSlug);
        const filtered = lines.filter(l => {
            if (!l.entry) return false;
            if (from && l.entry.date < from) return false;
            if (to && l.entry.date > to) return false;
            return true;
        });

        const byAccount = {};
        for (const line of filtered) {
            const acc = line.account;
            if (!acc || (acc.type !== 'produit' && acc.type !== 'charge')) continue;
            if (!byAccount[acc.id]) byAccount[acc.id] = { ...acc, debit: 0, credit: 0 };
            byAccount[acc.id].debit += Number(line.debit);
            byAccount[acc.id].credit += Number(line.credit);
        }

        const produits = [];
        const charges = [];
        let totalProduits = 0;
        let totalCharges = 0;

        for (const acc of Object.values(byAccount)) {
            if (acc.type === 'produit') {
                const amount = acc.credit - acc.debit;
                produits.push({ code: acc.code, name: acc.name, amount });
                totalProduits += amount;
            } else {
                const amount = acc.debit - acc.credit;
                charges.push({ code: acc.code, name: acc.name, amount });
                totalCharges += amount;
            }
        }

        return res.json({
            from: from || null,
            to: to || null,
            produits,
            charges,
            totalProduits,
            totalCharges,
            resultatNet: totalProduits - totalCharges
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * GET /api/accounting/revenue-trend?months=6
 * Évolution des revenus (comptes de type "produit") mois par mois, pour le
 * widget "évolution mensuelle" du Dashboard principal. Regroupe par
 * année-mois de la date d'écriture ; les mois sans écriture apparaissent à 0
 * plutôt que d'être omis, pour que le graphique reste continu.
 */
async function getRevenueTrend(req, res) {
    const { schoolSlug } = req.user;
    const months = Math.min(Math.max(parseInt(req.query.months) || 6, 1), 24);

    try {
        const lines = await fetchAllLines(schoolSlug);

        const today = new Date();
        const monthKeys = [];
        for (let i = months - 1; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }

        const totalsByMonth = Object.fromEntries(monthKeys.map(k => [k, 0]));

        for (const line of lines) {
            const acc = line.account;
            if (!acc || acc.type !== 'produit' || !line.entry?.date) continue;
            const monthKey = line.entry.date.slice(0, 7);
            if (monthKey in totalsByMonth) {
                totalsByMonth[monthKey] += Number(line.credit) - Number(line.debit);
            }
        }

        return res.json(monthKeys.map(k => ({ month: k, total: totalsByMonth[k] })));
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * Poste automatiquement une écriture (débit Caisse, crédit Produits de scolarité)
 * pour chaque nouveau paiement synchronisé. Best-effort : une erreur ne doit
 * jamais faire échouer la synchronisation appelante.
 */
async function postPaymentsToLedger(schoolSlug, newPayments, studentsById) {
    if (!newPayments || newPayments.length === 0) return;

    try {
        const [caisse, produitsScolarite] = await Promise.all([
            getAccountByCode(schoolSlug, CODE_CAISSE),
            getAccountByCode(schoolSlug, CODE_PRODUITS_SCOLARITE)
        ]);

        for (const payment of newPayments) {
            const student = studentsById[payment.student_id];
            const studentName = student ? `${student.prenom || ''} ${student.nom || ''}`.trim() : payment.student_id;

            const { data: entry, error: entryErr } = await supabase
                .from(`journal_entries_${schoolSlug}`)
                .insert({
                    date: payment.date,
                    reference: 'PAIEMENT',
                    description: `Paiement scolarité - ${studentName}`
                })
                .select('id')
                .single();
            if (entryErr) throw entryErr;

            const amount = Number(payment.montant);
            const { error: linesErr } = await supabase
                .from(`journal_entry_lines_${schoolSlug}`)
                .insert([
                    { entry_id: entry.id, account_id: caisse.id, debit: amount, credit: 0 },
                    { entry_id: entry.id, account_id: produitsScolarite.id, debit: 0, credit: amount }
                ]);
            if (linesErr) throw linesErr;
        }
    } catch (err) {
        console.error(`❌ [Accounting] Échec de la comptabilisation des paiements pour ${schoolSlug}:`, err.message);
    }
}

module.exports = {
    getAccounts,
    getJournalEntries,
    addExpense,
    uploadExpenseProof,
    getBalance,
    getBilan,
    getCompteResultat,
    getRevenueTrend,
    postPaymentsToLedger
};
