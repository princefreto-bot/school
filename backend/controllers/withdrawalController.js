const { supabase, supabaseAdmin } = require('../utils/supabase');

const BUCKET_NAME = 'withdrawal-proofs';
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1h — bucket privé, même pattern que backupController.js

/**
 * Remplace les chemins de stockage (proof_image_url / admin_proof_image_url)
 * d'une liste de retraits par des URLs signées temporaires, sans exposer le bucket
 * publiquement. Best-effort : une preuve dont l'URL ne peut être signée reste null
 * plutôt que de faire échouer toute la réponse.
 */
async function withSignedProofUrls(withdrawals) {
    const client = supabaseAdmin || supabase;
    const sign = async (path) => {
        if (!path) return null;
        const { data } = await client.storage.from(BUCKET_NAME).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
        return data?.signedUrl || null;
    };

    return Promise.all((withdrawals || []).map(async (w) => ({
        ...w,
        proof_image_url: await sign(w.proof_image_url),
        admin_proof_image_url: await sign(w.admin_proof_image_url)
    })));
}

/**
 * Calcule le solde de ristourne disponible pour une école.
 * Solde = (élèves ayant soldé leur licence * 700F) - montants déjà retirés ou en attente.
 */
async function calculateBalance(schoolSlug) {
    const { data: students, error: sErr } = await supabase
        .from(`students_${schoolSlug}`)
        .select('id')
        .eq('license_status', 'active');

    if (sErr) throw sErr;

    const totalEarned = (students ? students.length : 0) * 700;

    const { data: withdrawals, error: wErr } = await supabase
        .from('school_withdrawals')
        .select('amount, status')
        .eq('school_slug', schoolSlug);

    if (wErr) throw wErr;

    let totalWithdrawn = 0;
    let totalPending = 0;

    if (withdrawals) {
        withdrawals.forEach(w => {
            if (w.status === 'approved') totalWithdrawn += Number(w.amount);
            if (w.status === 'pending') totalPending += Number(w.amount);
        });
    }

    const availableBalance = totalEarned - totalWithdrawn - totalPending;

    return { totalEarned, totalWithdrawn, totalPending, availableBalance };
}

/**
 * GET /api/withdrawals/balance
 * Récupère le solde disponible pour l'école.
 */
async function getBalance(req, res) {
    const { schoolSlug } = req.user;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        const balance = await calculateBalance(schoolSlug);
        return res.json(balance);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * POST /api/withdrawals/request
 * L'école demande un retrait.
 */
async function requestWithdrawal(req, res) {
    const { schoolSlug } = req.user;
    const { amount, recipientName, recipientPhone, proofImageUrl } = req.body;

    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });
    if (!amount || amount <= 0 || !recipientName || !recipientPhone || !proofImageUrl) {
        return res.status(400).json({ error: 'Données manquantes ou invalides.' });
    }

    try {
        const { availableBalance } = await calculateBalance(schoolSlug);
        if (amount > availableBalance) {
            return res.status(400).json({ error: `Montant demandé (${amount} F) supérieur au solde disponible (${availableBalance} F).` });
        }

        const { data, error } = await supabase
            .from('school_withdrawals')
            .insert({
                school_slug: schoolSlug,
                amount,
                recipient_name: recipientName,
                recipient_phone: recipientPhone,
                proof_image_url: proofImageUrl,
                status: 'pending'
            })
            .select('*')
            .single();

        if (error) throw error;
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * GET /api/withdrawals/history
 * Historique des retraits pour l'école
 */
async function getHistory(req, res) {
    const { schoolSlug } = req.user;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        const { data, error } = await supabase
            .from('school_withdrawals')
            .select('*')
            .eq('school_slug', schoolSlug)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return res.json(await withSignedProofUrls(data));
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * POST /api/withdrawals/upload-proof
 * Body JSON: { imageBase64: "data:image/jpeg;base64,..." }
 * Upload la capture de preuve de paiement de l'école vers Supabase Storage.
 */
async function uploadProof(req, res) {
    const { schoolSlug } = req.user;
    const { imageBase64 } = req.body;

    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });
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
            .from(BUCKET_NAME)
            .upload(filePath, imageBuffer, { contentType, upsert: true });

        if (uploadError) {
            console.error('❌ [Withdrawal Proof] Storage upload error:', uploadError.message);
            return res.status(500).json({ error: 'Erreur upload Storage: ' + uploadError.message });
        }

        // Bucket privé : on renvoie le chemin de stockage (pas d'URL publique). Le
        // frontend le traite comme une valeur opaque à soumettre telle quelle ;
        // getHistory() le convertit en URL signée temporaire à l'affichage.
        return res.json({ success: true, proofUrl: filePath });
    } catch (err) {
        console.error('💥 [Withdrawal Proof] Unexpected error:', err.message);
        return res.status(500).json({ error: 'Erreur interne: ' + err.message });
    }
}

module.exports = {
    getBalance,
    requestWithdrawal,
    getHistory,
    uploadProof
};
