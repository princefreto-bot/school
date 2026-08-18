// ============================================================
// SASPAY — Paiement de licence parent (remplace Chariow)
// ============================================================
// Deux tables par école : license_checkout_sessions_{slug} (sessions EN ATTENTE,
// une ligne par tentative de paiement) et license_payments_{slug} (paiements
// CONFIRMÉS uniquement — jamais écrit avant confirmation réelle par SasPay).
//
// Sécurité : on ne fait JAMAIS confiance au contenu d'un webhook pour activer
// une licence. Le webhook (et la page de retour parent) ne servent que de
// déclencheurs — la confirmation réelle vient toujours d'un GET synchrone
// vers l'API SasPay (source de vérité), jamais du corps de la requête entrante.
const crypto = require('crypto');
const { supabase } = require('../utils/supabase');
const { sendSuperadminLicensePaymentAlert } = require('../utils/mailer');
const { getCurrentAcademicYear } = require('../utils/academicYear');

const LICENSE_TOTAL = 2100;
const TRANCHE_COUNT = 3;
const TRANCHE_AMOUNT = 700;
const SASPAY_API_BASE = 'https://api.saspay.me/api/v1';

async function resolveAcademicYearId(schoolSlug, req) {
    let yearName = req.headers['x-academic-year'];
    if (!yearName) {
        const { data: settings } = await supabase
            .from(`app_settings_${schoolSlug}`)
            .select('school_year')
            .single();
        yearName = settings?.school_year || getCurrentAcademicYear();
    }
    const { data: yearRow } = await supabase
        .from('academic_years')
        .select('id')
        .eq('school_slug', schoolSlug)
        .eq('name', yearName)
        .single();
    return yearRow?.id || null;
}

/**
 * POST /api/parent/license-checkout-session
 * Crée une session de paiement SasPay pour un élève : tranche (700F) ou
 * règlement du reliquat complet. Ne modifie jamais license_payments — la
 * ligne n'est écrite qu'à la confirmation réelle (webhook ou vérification
 * synchrone au retour du parent).
 */
async function createLicenseCheckoutSession(req, res) {
    const { id: parentId, schoolSlug, nom: parentNom } = req.user;
    const { studentId, tranche } = req.body;

    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });
    if (!studentId || !['partial', 'full'].includes(tranche)) {
        return res.status(400).json({ error: 'Élève et type de versement (partial/full) requis.' });
    }

    const SASPAY_KEY = process.env.SASPAY_SECRET_KEY;
    if (!SASPAY_KEY) return res.status(500).json({ error: 'Paiement non configuré (clé manquante).' });

    try {
        const { data: link, error: linkErr } = await supabase
            .from(`parent_student_${schoolSlug}`)
            .select('student_id')
            .eq('parent_id', parentId)
            .eq('student_id', studentId)
            .single();
        if (linkErr || !link) {
            return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à gérer cet élève.' });
        }

        const { data: student, error: studentErr } = await supabase
            .from(`students_${schoolSlug}`)
            .select('id, nom, prenom, license_status')
            .eq('id', studentId)
            .single();
        if (studentErr || !student) return res.status(404).json({ error: 'Élève introuvable.' });
        if (student.license_status === 'active') {
            return res.status(400).json({ error: 'La licence de cet élève est déjà active.' });
        }

        const { data: previousRows, error: prevErr } = await supabase
            .from(`license_payments_${schoolSlug}`)
            .select('amount')
            .eq('student_id', studentId);
        if (prevErr) throw prevErr;
        const previousTotal = (previousRows || []).reduce((s, r) => s + (r.amount || 0), 0);
        if (previousTotal >= LICENSE_TOTAL) {
            return res.status(400).json({ error: 'La licence de cet élève est déjà entièrement soldée.' });
        }

        const remaining = LICENSE_TOTAL - previousTotal;
        const amount = tranche === 'full' ? remaining : Math.min(TRANCHE_AMOUNT, remaining);
        const trancheNumber = tranche === 'full' && amount === remaining && remaining === LICENSE_TOTAL
            ? 0 // règlement complet dès le premier versement
            : Math.min(Math.floor(previousTotal / TRANCHE_AMOUNT) + 1, TRANCHE_COUNT);

        // Une seule session en attente à la fois par élève, pour éviter d'empiler
        // des sessions orphelines si le parent recommence plusieurs fois.
        await supabase
            .from(`license_checkout_sessions_${schoolSlug}`)
            .update({ status: 'expired', updated_at: new Date().toISOString() })
            .eq('student_id', studentId)
            .eq('status', 'pending');

        const { data: parentProfile } = await supabase
            .from(`profiles_${schoolSlug}`)
            .select('email, telephone')
            .eq('id', parentId)
            .maybeSingle();

        const idempotencyKey = crypto.randomUUID();
        const checkoutRes = await fetch(`${SASPAY_API_BASE}/checkout-sessions/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SASPAY_KEY}`,
                'Content-Type': 'application/json',
                'Idempotency-Key': idempotencyKey,
            },
            body: JSON.stringify({
                amount: amount.toFixed(2),
                currency: 'XOF',
                description: `Licence DGhubSchool — ${student.prenom} ${student.nom} — ${trancheNumber === 0 ? 'Règlement complet' : `Tranche ${trancheNumber}/${TRANCHE_COUNT}`}`,
                customer_email: parentProfile?.email || undefined,
                customer_name: parentNom || undefined,
            }),
        });
        const checkoutBody = await checkoutRes.json();
        if (!checkoutRes.ok || !checkoutBody?.data?.id) {
            console.error('SasPay checkout-session error:', checkoutBody);
            return res.status(502).json({ error: checkoutBody?.error?.message || 'Erreur lors de la création de la session de paiement.' });
        }

        const session = checkoutBody.data;
        const academicYearId = await resolveAcademicYearId(schoolSlug, req);

        const { error: insErr } = await supabase
            .from(`license_checkout_sessions_${schoolSlug}`)
            .insert({
                id: session.id,
                student_id: studentId,
                parent_id: parentId,
                academic_year_id: academicYearId,
                amount,
                tranche_number: trancheNumber,
                status: 'pending',
            });
        if (insErr) throw insErr;

        return res.status(201).json({ checkoutUrl: session.checkout_url, sessionId: session.id, amount });
    } catch (err) {
        console.error('createLicenseCheckoutSession error:', err.message);
        return res.status(500).json({ error: 'Erreur serveur: ' + err.message });
    }
}

/**
 * Vérifie une session SasPay via un GET authentifié (source de vérité) et,
 * si elle est PAID, finalise le paiement (idempotent : ne fait rien si la
 * session locale n'est plus 'pending'). Utilisée par la route de statut
 * (retour du parent) ET par le webhook.
 */
async function verifyAndFinalizeSession(schoolSlug, localSession) {
    if (localSession.status !== 'pending') return { alreadyProcessed: true, status: localSession.status };

    const SASPAY_KEY = process.env.SASPAY_SECRET_KEY;
    const apiRes = await fetch(`${SASPAY_API_BASE}/checkout-sessions/${localSession.id}/`, {
        headers: { 'Authorization': `Bearer ${SASPAY_KEY}` },
    });
    if (!apiRes.ok) return { alreadyProcessed: false, status: 'unknown' };
    const body = await apiRes.json();
    const remoteSession = body?.data;
    if (!remoteSession) return { alreadyProcessed: false, status: 'unknown' };

    if (remoteSession.status === 'PAID') {
        await finalizeLicensePayment(schoolSlug, localSession, remoteSession);
        return { alreadyProcessed: false, status: 'PAID' };
    }

    if (remoteSession.status !== 'PENDING' || new Date(remoteSession.expires_at) < new Date()) {
        await supabase
            .from(`license_checkout_sessions_${schoolSlug}`)
            .update({ status: 'expired', updated_at: new Date().toISOString() })
            .eq('id', localSession.id)
            .eq('status', 'pending');
    }
    return { alreadyProcessed: false, status: remoteSession.status };
}

async function finalizeLicensePayment(schoolSlug, localSession, remoteSession) {
    // Verrou d'idempotence : bascule pending -> paid en une opération conditionnelle.
    // Si une autre requête concurrente (webhook + retour parent en même temps) a déjà
    // traité cette session, cette mise à jour ne touche 0 ligne et on s'arrête là.
    const { data: updatedRows, error: lockErr } = await supabase
        .from(`license_checkout_sessions_${schoolSlug}`)
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', localSession.id)
        .eq('status', 'pending')
        .select('id');
    if (lockErr) throw lockErr;
    if (!updatedRows || updatedRows.length === 0) return; // déjà traité ailleurs

    const { student_id: studentId, parent_id: parentId, academic_year_id: academicYearId, amount, tranche_number: trancheNumber } = localSession;
    const externalRef = remoteSession.transaction || localSession.id;

    const { data: previousRows, error: prevErr } = await supabase
        .from(`license_payments_${schoolSlug}`)
        .select('amount')
        .eq('student_id', studentId);
    if (prevErr) throw prevErr;
    const previousTotal = (previousRows || []).reduce((s, r) => s + (r.amount || 0), 0);
    const newTotal = previousTotal + amount;
    const isFinal = newTotal >= LICENSE_TOTAL;

    const { error: insErr } = await supabase
        .from(`license_payments_${schoolSlug}`)
        .insert({
            student_id: studentId,
            parent_id: parentId,
            academic_year_id: academicYearId,
            license_key: externalRef, // référence SasPay — champ hérité de Chariow, réutilisé tel quel
            sale_id: null,
            product_id: 'saspay',
            amount,
            tranche_number: trancheNumber,
            is_final: isFinal,
        });
    if (insErr) throw insErr;

    const studentUpdate = { license_key: externalRef };
    if (isFinal) {
        studentUpdate.license_status = 'active';
        studentUpdate.license_activated_at = new Date().toISOString();
    }
    const { error: updErr } = await supabase
        .from(`students_${schoolSlug}`)
        .update(studentUpdate)
        .eq('id', studentId);
    if (updErr) throw updErr;

    (async () => {
        try {
            const [{ data: school }, { data: student }, { data: parentProfile }] = await Promise.all([
                supabase.from('schools').select('name').eq('slug', schoolSlug).maybeSingle(),
                supabase.from(`students_${schoolSlug}`).select('nom, prenom, classe').eq('id', studentId).maybeSingle(),
                supabase.from(`profiles_${schoolSlug}`).select('nom, telephone').eq('id', parentId).maybeSingle(),
            ]);
            await sendSuperadminLicensePaymentAlert({
                schoolName: school?.name || schoolSlug,
                schoolSlug,
                studentName: student ? `${student.prenom} ${student.nom}${student.classe ? ' (' + student.classe + ')' : ''}` : '—',
                parentName: parentProfile ? `${parentProfile.nom}${parentProfile.telephone ? ' · ' + parentProfile.telephone : ''}` : '—',
                amount,
                trancheLabel: trancheNumber === 0 ? 'Règlement complet' : `Tranche ${trancheNumber}/${TRANCHE_COUNT}`,
                isFinal,
                totalPaid: newTotal,
                licenseKey: externalRef,
            });
        } catch (e) {
            console.error('Notification superadmin licence: erreur non bloquante', e.message);
        }
    })();
}

/**
 * GET /api/parent/license-checkout-session/:id/status
 * Vérification synchrone au retour du parent depuis la page de paiement SasPay
 * — active la licence immédiatement si payée, sans attendre le webhook.
 */
async function checkLicenseCheckoutSessionStatus(req, res) {
    const { id: parentId, schoolSlug } = req.user;
    const { id: sessionId } = req.params;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        const { data: localSession, error } = await supabase
            .from(`license_checkout_sessions_${schoolSlug}`)
            .select('*')
            .eq('id', sessionId)
            .eq('parent_id', parentId)
            .single();
        if (error || !localSession) return res.status(404).json({ error: 'Session introuvable.' });

        const result = await verifyAndFinalizeSession(schoolSlug, localSession);

        const { data: student } = await supabase
            .from(`students_${schoolSlug}`)
            .select('license_status')
            .eq('id', localSession.student_id)
            .maybeSingle();

        const { data: paidRows } = await supabase
            .from(`license_payments_${schoolSlug}`)
            .select('amount')
            .eq('student_id', localSession.student_id);
        const totalPaid = (paidRows || []).reduce((s, r) => s + (r.amount || 0), 0);

        return res.json({
            sessionStatus: result.alreadyProcessed ? localSession.status : result.status,
            licenseActive: student?.license_status === 'active',
            payment: {
                amount: localSession.amount,
                trancheNumber: localSession.tranche_number,
                tranchesPaid: Math.min(Math.ceil(totalPaid / TRANCHE_AMOUNT), TRANCHE_COUNT),
                totalPaid,
                totalRequired: LICENSE_TOTAL,
                amountRemaining: Math.max(0, LICENSE_TOTAL - totalPaid),
                isFullyPaid: totalPaid >= LICENSE_TOTAL,
            },
        });
    } catch (err) {
        console.error('checkLicenseCheckoutSessionStatus error:', err.message);
        return res.status(500).json({ error: 'Erreur serveur: ' + err.message });
    }
}

/**
 * POST /api/webhooks/saspay — PAS derrière authenticateToken (appelé par SasPay).
 * Vérifie la signature HMAC, puis déclenche une reconciliation des sessions
 * en attente sur toutes les écoles (ne fait jamais confiance au corps du
 * webhook pour l'activation elle-même — voir verifyAndFinalizeSession).
 */
async function handleSaspayWebhook(req, res) {
    const secret = process.env.SASPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-webhook-signature'];

    if (!secret) {
        console.error('[SasPay Webhook] SASPAY_WEBHOOK_SECRET non configuré — webhook ignoré.');
        return res.status(500).json({ error: 'Webhook non configuré.' });
    }
    if (!signature || !req.rawBody) {
        return res.status(400).json({ error: 'Signature manquante.' });
    }

    const expectedSignature = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
    const sigBuf = Buffer.from(signature, 'hex');
    const expectedBuf = Buffer.from(expectedSignature, 'hex');
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        console.error('[SasPay Webhook] Signature invalide.');
        return res.status(401).json({ error: 'Signature invalide.' });
    }

    // Répondre immédiatement — SasPay attend un accusé rapide, la reconciliation
    // se fait en arrière-plan et ne bloque jamais la réponse HTTP.
    res.json({ received: true });

    reconcilePendingLicenseSessions().catch((err) => {
        console.error('[SasPay Webhook] Erreur de réconciliation:', err.message);
    });
}

async function reconcilePendingLicenseSessions() {
    const { data: schools, error } = await supabase.from('schools').select('slug').eq('status', 'active');
    if (error) throw error;

    for (const { slug } of schools || []) {
        try {
            const { data: pendingSessions } = await supabase
                .from(`license_checkout_sessions_${slug}`)
                .select('*')
                .eq('status', 'pending');

            for (const session of pendingSessions || []) {
                await verifyAndFinalizeSession(slug, session);
            }
        } catch (err) {
            console.error(`[SasPay Webhook] Réconciliation échouée pour ${slug}:`, err.message);
        }
    }
}

module.exports = {
    createLicenseCheckoutSession,
    checkLicenseCheckoutSessionStatus,
    handleSaspayWebhook,
};
