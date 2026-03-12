const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../utils/supabase');
const { JWT_SECRET, JWT_EXPIRES } = require('../config');

// ── Register (Uniquement Parents) ──────────────────────────────
async function register(req, res) {
    const { nom, telephone, password } = req.body;

    if (!nom || !telephone || !password) {
        return res.status(400).json({ error: 'Champs requis : nom, telephone, password.' });
    }

    try {
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
                role: 'parent'
            })
            .select()
            .single();

        if (error) throw error;

        const token = jwt.sign({ id: parent.id, nom: parent.nom, role: parent.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

        return res.status(201).json({
            message: 'Compte créé avec succès.',
            token,
            parent: { id: parent.id, nom: parent.nom, telephone: parent.telephone, role: parent.role },
        });
    } catch (err) {
        console.error('Register Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la création du compte.' });
    }
}

// ── Login (Tout Rôles) ──────────────────────────────────────────
async function login(req, res) {
    const { telephone, password } = req.body;

    if (!telephone || !password) {
        return res.status(400).json({ error: 'Champs requis : telephone, password.' });
    }

    try {
        const { data: user, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('telephone', telephone.trim())
            .single();

        if (!user || error) {
            return res.status(401).json({ error: 'Numéro de téléphone ou mot de passe incorrect.' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Numéro de téléphone ou mot de passe incorrect.' });
        }

        // Token inclus le rôle
        const token = jwt.sign(
            { id: user.id, nom: user.nom, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        // Mettre à jour last_login
        await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', user.id);

        return res.json({
            message: 'Connexion réussie.',
            token,
            user: { id: user.id, nom: user.nom, telephone: user.telephone, role: user.role },
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
        const { error } = await supabase
            .from('profiles')
            .update({ push_token })
            .eq('id', id);

        if (error) throw error;

        return res.json({ success: true, message: 'Token de notification mis à jour.' });
    } catch (err) {
        console.error('Update Push Token Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la mise à jour du token.' });
    }
}

module.exports = { register, login, deleteSelfAccount, updatePushToken };
