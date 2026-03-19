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
        // Jointure avec la table schools pour récupérer le statut de l'école
        const { data: user, error } = await supabase
            .from('profiles')
            .select('*, schools(id, name, slug, status, trial_ends_at, logo_url)')
            .eq('telephone', telephone.trim())
            .single();

        if (!user || error) {
            return res.status(401).json({ error: 'Numéro de téléphone ou mot de passe incorrect.' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Numéro de téléphone ou mot de passe incorrect.' });
        }

        // ── Vérification accès école (sauf SuperAdmin) ──
        if (user.role !== 'superadmin' && user.school_id && user.schools) {
            const school = user.schools;

            // École suspendue
            if (school.status === 'suspended') {
                return res.status(403).json({
                    error: "L'accès à cet établissement a été suspendu. Contactez l'administrateur SaaS."
                });
            }

            // Période d'essai expirée — bloquer les non-superadmin
            if (school.status === 'trial' && new Date(school.trial_ends_at) < new Date()) {
                return res.status(402).json({
                    error: 'trial_expired',
                    message: "La période d'essai gratuit de 2 mois est terminée. Contactez l'administrateur de la plateforme pour régulariser l'abonnement.",
                    school_name: school.name
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

        // Mettre à jour last_login
        await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', user.id);

        // Infos école à renvoyer si l'utilisateur est lié à une école
        const schoolInfo = user.schools ? {
            school_id: user.school_id,
            school_name: user.schools.name,
            school_slug: user.schools.slug,
            school_logo: user.schools.logo_url,
            school_status: user.schools.status,
            trial_ends_at: user.schools.trial_ends_at
        } : {};

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
