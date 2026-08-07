const bcrypt = require('bcryptjs');
const { supabase } = require('../utils/supabase');

// Rôles gérables via cet écran (hors directeur/directeur_general, créés à l'inscription école)
const MANAGEABLE_ROLES = ['admin', 'superviseur', 'comptable', 'censeur', 'enseignant', 'proviseur', 'secretaire'];
// Qui peut lister/créer/éditer les fiches personnel (la secrétaire gère les fiches mais pas les comptes eux-mêmes)
const PERSONNEL_MANAGERS = ['directeur', 'directeur_general', 'admin', 'secretaire'];
// Qui peut créer/supprimer des comptes (action plus sensible que l'édition)
const ACCOUNT_OWNERS = ['directeur', 'directeur_general', 'admin'];

// ── GET /api/personnel ──────────────────────────────
async function getPersonnel(req, res) {
    const { role, schoolSlug } = req.user;

    if (!PERSONNEL_MANAGERS.includes(role)) {
        return res.status(403).json({ error: 'Accès refusé.' });
    }

    try {
        const { data: personnel, error } = await supabase
            .from(`profiles_${schoolSlug}`)
            .select('*')
            .in('role', MANAGEABLE_ROLES);

        if (error) throw error;
        return res.json(personnel);
    } catch (err) {
        console.error('getPersonnel Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la récupération du personnel.' });
    }
}

// ── POST /api/personnel ──────────────────────────────
async function createPersonnel(req, res) {
    const { role: userRole, schoolSlug } = req.user;
    const { nom, telephone, password, role } = req.body;

    if (!PERSONNEL_MANAGERS.includes(userRole)) {
        return res.status(403).json({ error: 'Accès refusé.' });
    }

    if (!nom || !telephone || !password || !role) {
        return res.status(400).json({ error: 'Champs requis : nom, telephone, password, role.' });
    }

    if (!MANAGEABLE_ROLES.includes(role)) {
        return res.status(400).json({ error: 'Rôle invalide.' });
    }

    try {
        // Vérifier si le téléphone est déjà utilisé
        const { data: existing } = await supabase
            .from(`profiles_${schoolSlug}`)
            .select('id')
            .eq('telephone', telephone.trim())
            .single();

        if (existing) {
            return res.status(409).json({ error: 'Ce numéro de téléphone est déjà enregistré pour un autre compte.' });
        }

        const hashed = await bcrypt.hash(password, 10);

        const { data: personnel, error } = await supabase
            .from(`profiles_${schoolSlug}`)
            .insert({
                nom: nom.trim(),
                telephone: telephone.trim(),
                password: hashed,
                role: role
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({
            message: 'Compte personnel créé avec succès.',
            personnel
        });
    } catch (err) {
        console.error('createPersonnel Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la création du compte personel.' });
    }
}

// ── PATCH /api/personnel/:id ──────────────────────────────
// Point d'entrée unique pour éditer une fiche personnel : identité de base
// (nom/telephone/email/role) ET informations de paie (matricule, CNSS,
// date d'embauche, mode de paiement, compte bancaire, département).
async function updatePersonnel(req, res) {
    const { role: userRole, schoolSlug } = req.user;
    const { id } = req.params;
    const {
        nom, telephone, email, role,
        matricule, numeroCnss, dateEmbauche, modePaiement, compteBancaire, departement
    } = req.body;

    if (!PERSONNEL_MANAGERS.includes(userRole)) {
        return res.status(403).json({ error: 'Accès refusé.' });
    }

    const updates = {};
    if (nom !== undefined) updates.nom = nom.trim();
    if (telephone !== undefined) updates.telephone = telephone.trim();
    if (email !== undefined) updates.email = email || null;
    if (role !== undefined) {
        if (!MANAGEABLE_ROLES.includes(role)) {
            return res.status(400).json({ error: 'Rôle invalide.' });
        }
        updates.role = role;
    }
    if (matricule !== undefined) updates.matricule = matricule || null;
    if (numeroCnss !== undefined) updates.numero_cnss = numeroCnss || null;
    if (dateEmbauche !== undefined) updates.date_embauche = dateEmbauche || null;
    if (modePaiement !== undefined) updates.mode_paiement = modePaiement || null;
    if (compteBancaire !== undefined) updates.compte_bancaire = compteBancaire || null;
    if (departement !== undefined) updates.departement = departement || null;

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'Aucune information à mettre à jour.' });
    }

    try {
        if (updates.telephone) {
            const { data: existing } = await supabase
                .from(`profiles_${schoolSlug}`)
                .select('id')
                .eq('telephone', updates.telephone)
                .neq('id', id)
                .single();
            if (existing) {
                return res.status(409).json({ error: 'Ce numéro de téléphone est déjà enregistré pour un autre compte.' });
            }
        }

        const { data, error } = await supabase
            .from(`profiles_${schoolSlug}`)
            .update(updates)
            .eq('id', id)
            .select('id, nom, telephone, email, role, matricule, numero_cnss, date_embauche, mode_paiement, compte_bancaire, departement')
            .single();

        if (error) throw error;
        return res.json(data);
    } catch (err) {
        console.error('updatePersonnel Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la mise à jour.' });
    }
}

// ── GET /api/personnel/me ──────────────────────────────
// Sa propre fiche — accessible à tout membre du personnel authentifié
// (base du portail « Mon Espace », voir Phase C).
async function getMyProfile(req, res) {
    const { id, schoolSlug } = req.user;

    try {
        const { data, error } = await supabase
            .from(`profiles_${schoolSlug}`)
            .select('id, nom, telephone, email, role, matricule, numero_cnss, date_embauche, mode_paiement, compte_bancaire, departement')
            .eq('id', id)
            .single();

        if (error) throw error;
        return res.json(data);
    } catch (err) {
        console.error('getMyProfile Error:', err.message);
        // PGRST116 : .single() n'a trouvé aucune ligne — le compte du token a été
        // supprimé/recréé entretemps (id obsolète). Ce n'est pas une erreur serveur :
        // le frontend doit forcer une reconnexion plutôt qu'afficher un 500 générique.
        if (err.code === 'PGRST116') {
            return res.status(401).json({ error: 'Session invalide : ce compte n\'existe plus. Merci de vous reconnecter.' });
        }
        return res.status(500).json({ error: 'Erreur lors de la récupération du profil.' });
    }
}

// ── GET /api/personnel/me/teaching-mode ──────────────────────────────
// Un enseignant est en mode « individual » (identité prouvée par son propre
// JWT) dès lors qu'au moins une liaison classe/matière lui est explicitement
// rattachée, ou qu'il existe plus d'une fiche enseignant dans l'école — signe
// que le compte n'est plus partagé. Sinon, on reste en mode « shared »
// (comportement historique : sélection du nom, aucune vérification serveur).
async function getTeachingMode(req, res) {
    const { id, role, schoolSlug } = req.user;

    if (role !== 'enseignant') {
        return res.json({ mode: 'individual', applicable: false });
    }

    try {
        const { count: assignedCount } = await supabase
            .from(`classe_matieres_${schoolSlug}`)
            .select('id', { count: 'exact', head: true })
            .eq('professeur_id', id);

        if ((assignedCount || 0) > 0) {
            return res.json({ mode: 'individual', applicable: true });
        }

        const { count: enseignantCount } = await supabase
            .from(`profiles_${schoolSlug}`)
            .select('id', { count: 'exact', head: true })
            .eq('role', 'enseignant');

        const mode = (enseignantCount || 0) > 1 ? 'individual' : 'shared';
        return res.json({ mode, applicable: true });
    } catch (err) {
        console.error('getTeachingMode Error:', err.message);
        // En cas d'erreur, repli sûr sur le comportement historique (aucune régression).
        return res.json({ mode: 'shared', applicable: true });
    }
}

// ── DELETE /api/personnel/:id ──────────────────────────────
async function deletePersonnel(req, res) {
    const { role: userRole, schoolSlug } = req.user;
    const { id } = req.params;

    if (!ACCOUNT_OWNERS.includes(userRole)) {
        return res.status(403).json({ error: 'Accès refusé.' });
    }

    try {
        const { error } = await supabase
            .from(`profiles_${schoolSlug}`)
            .delete()
            .eq('id', id);

        if (error) throw error;
        return res.json({ message: 'Compte personnel supprimé avec succès.' });
    } catch (err) {
        console.error('deletePersonnel Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la suppression.' });
    }
}

module.exports = { getPersonnel, createPersonnel, updatePersonnel, getMyProfile, getTeachingMode, deletePersonnel, PERSONNEL_MANAGERS };
