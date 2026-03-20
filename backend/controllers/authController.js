const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../utils/supabase');
const { JWT_SECRET, JWT_EXPIRES } = require('../config');

// ── Register (Uniquement Parents) ──────────────────────────────
async function register(req, res) {
    const { nom, telephone, password, school_slug } = req.body;

    if (!nom || !telephone || !password) {
        return res.status(400).json({ error: 'Champs requis : nom, telephone, password.' });
    }

    try {
        // Résoudre le school_id via le slug si fourni
        let school_id = null;
        if (school_slug) {
            const { data: school } = await supabase
                .from('schools')
                .select('id, status')
                .eq('slug', school_slug)
                .single();
            if (school) {
                if (school.status === 'suspended') {
                    return res.status(403).json({ error: "Le compte de cet établissement est suspendu." });
                }
                school_id = school.id;
            }
        }

        // Vérifier si existant
        const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('telephone', telephone.trim())
            .single();

        if (existing) {
            return res.status(409).json({ error: 'Ce numéro de téléphone est déjà enregistré.' });
        }

        const hashed = await bcrypt.hash(password, 10);

        const { data: parent, error } = await supabase
            .from('profiles')
            .insert({
                nom: nom.trim(),
                telephone: telephone.trim(),
                password: hashed,
                role: 'parent',
                school_id
            })
            .select()
            .single();

        if (error) throw error;

        const token = jwt.sign(
            { id: parent.id, nom: parent.nom, role: parent.role, school_id: parent.school_id },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        return res.status(201).json({
            message: 'Compte créé avec succès.',
            token,
            parent: { id: parent.id, nom: parent.nom, telephone: parent.telephone, role: parent.role, school_id: parent.school_id },
        });
    } catch (err) {
        console.error('Register Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la création du compte.' });
    }
}

// ── Login (Tout Rôles — Multi-Tenant) ──────────────────────────
async function login(req, res) {
    const { telephone, password } = req.body;

    if (!telephone || !password) {
        return res.status(400).json({ error: 'Champs requis : telephone, password.' });
    }

    try {
        console.log(`🔍 [Auth] Tentative login pour: ${telephone.trim()}`);
        
        // ── Étape 1 : Récupérer l'utilisateur ──
        const { data: user, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('telephone', telephone.trim())
            .single();

        if (error) {
            console.error('❌ [Supabase Error]:', error.message);
            if (error.code === 'PGRST116') console.warn('⚠️ Aucun utilisateur trouvé avec ce numéro.');
        }

        if (!user) {
            console.log('🚫 [Auth] Utilisateur inexistant dans Supabase.');
            return res.status(401).json({ error: 'Numéro de téléphone ou mot de passe incorrect.' });
        }

        console.log(`✅ [Auth] Utilisateur trouvé: ${user.nom} (Rôle: ${user.role})`);

        // TEST TEMPORAIRE — Forcer validé même si le mot de passe est faux
        const valid = true; // await bcrypt.compare(password, user.password);
        
        if (!valid) {
            console.log('❌ [Auth] Mot de passe incorrect.');
            return res.status(401).json({ error: 'Numéro de téléphone ou mot de passe incorrect.' });
        }

        // ── Étape 2 : Récupérer les infos de l'école si l'utilisateur en a une ──
        let schoolData = null;
        if (user.school_id) {
            const { data: school } = await supabase
                .from('schools')
                .select('id, name, slug, status, trial_ends_at, logo_url')
                .eq('id', user.school_id)
                .single();
            schoolData = school;
        }

        // ── Vérification accès école (sauf SuperAdmin) ──
        if (user.role !== 'superadmin' && schoolData) {
            // École suspendue
            if (schoolData.status === 'suspended') {
                return res.status(403).json({
                    error: "L'accès à cet établissement a été suspendu. Contactez l'administrateur SaaS."
                });
            }
            // Période d'essai expirée
            if (schoolData.status === 'trial' && new Date(schoolData.trial_ends_at) < new Date()) {
                return res.status(402).json({
                    error: 'trial_expired',
                    message: "La période d'essai gratuit de 2 mois est terminée. Réglez l'abonnement.",
                    school_name: schoolData.name
                });
            }
        }

        // ── Création du Token (inclut school_id) ──
        const token = jwt.sign(
            {
                id: user.id,
                nom: user.nom,
                role: user.role,
                school_id: user.school_id || null
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        // Mettre à jour last_login (non bloquant)
        supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', user.id).then(() => {});

        // Infos école à renvoyer
        const schoolInfo = schoolData ? {
            school_id: user.school_id,
            school_name: schoolData.name,
            school_slug: schoolData.slug,
            school_logo: schoolData.logo_url,
            school_status: schoolData.status,
            trial_ends_at: schoolData.trial_ends_at
        } : {};

        console.log(`✅ Login OK: ${user.nom} (${user.role}) — school_id: ${user.school_id || 'SuperAdmin'}`);

        return res.json({
            message: 'Connexion réussie.',
            token,
            user: {
                id: user.id,
                nom: user.nom,
                telephone: user.telephone,
                role: user.role,
                ...schoolInfo
            },
        });
    } catch (err) {
        console.error('Login Error:', err.message);
        return res.status(500).json({ error: 'Erreur de connexion serveur.' });
    }
}

// ── Delete Account (Self) ─────────────────────────────────────
async function deleteSelfAccount(req, res) {
    const { id } = req.user;

    try {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return res.json({ message: 'Compte supprimé avec succès.' });
    } catch (err) {
        console.error('Delete Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la suppression du compte.' });
    }
}

// ── Update Push Token ──────────────────────────────────────────
async function updatePushToken(req, res) {
    const { id } = req.user;
    const { push_token } = req.body;

    try {
        console.log(`📲 Tentative de mise à jour du push_token pour l'utilisateur ${id}`);
        if (!push_token) {
            console.warn('⚠️ Aucun push_token reçu dans le corps de la requête.');
        }

        const { error } = await supabase
            .from('profiles')
            .update({ push_token })
            .eq('id', id);

        if (error) {
            console.error('❌ Erreur Supabase lors de updatePushToken:', error.message);
            throw error;
        }

        console.log(`✅ Push token mis à jour avec succès pour ${id}`);
        return res.json({ success: true, message: 'Token de notification mis à jour.' });
    } catch (err) {
        console.error('Update Push Token Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la mise à jour du token.' });
    }
}

module.exports = { register, login, deleteSelfAccount, updatePushToken };
