const crypto = require('crypto');
const { supabase } = require('../utils/supabase');

// Rôles du personnel ayant la messagerie (miroir de rolePermissions côté app).
const CHAT_STAFF_ROLES = ['admin', 'directeur', 'directeur_general', 'comptable', 'proviseur', 'censeur', 'secretaire'];
const CHAT_DELETE_ROLES = ['admin', 'directeur', 'directeur_general', 'comptable'];
const ADMIN_BOXES = ['administration', 'comptabilite'];
const staffBox = (role) => (role === 'comptable' ? 'comptabilite' : 'administration');
const canUseChat = (role) => role === 'parent' || CHAT_STAFF_ROLES.includes(role);

// Une conversation n'est accessible qu'à son parent ou au personnel de la boîte concernée
// (même règle que la liste des conversations). Retourne null sinon.
async function loadAccessibleConversation(user, conversationId) {
    if (!conversationId) return null;
    const { data: conv, error } = await supabase
        .from(`conversations_${user.schoolSlug}`)
        .select('id, parent_id, admin_role')
        .eq('id', conversationId)
        .maybeSingle();
    if (error || !conv) return null;
    if (user.role === 'parent') return conv.parent_id === user.id ? conv : null;
    if (!CHAT_STAFF_ROLES.includes(user.role)) return null;
    return conv.admin_role === staffBox(user.role) ? conv : null;
}

/**
 * Récupère les conversations pour l'utilisateur connecté
 */
async function getConversations(req, res) {
    const { id, role, schoolSlug } = req.user;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });
    if (!canUseChat(role)) return res.status(403).json({ error: 'Messagerie non disponible pour ce rôle.' });

    try {
        let query = supabase.from(`conversations_${schoolSlug}`).select(`
            *,
            parent:parent_id (id, nom, telephone)
        `);

        if (role === 'parent') {
            query = query.eq('parent_id', id);
        } else {
            query = query.eq('admin_role', staffBox(role));
        }

        const { data, error } = await query.order('updated_at', { ascending: false });

        if (error) throw error;
        return res.json(data);
    } catch (err) {
        if (err.code === '42P01') {
            return res.status(500).json({ 
                error: 'Le service de messagerie n\'est pas encore configuré pour cet établissement.',
                detail: 'Table conversations manquante. Contactez l\'administrateur.'
            });
        }
        return res.status(500).json({ error: err.message });
    }
}

/**
 * Récupère les messages d'une conversation
 */
async function getMessages(req, res) {
    const { conversationId } = req.params;
    const { schoolSlug } = req.user;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    try {
        const conv = await loadAccessibleConversation(req.user, conversationId);
        if (!conv) return res.status(404).json({ error: 'Conversation introuvable.' });

        const { data, error } = await supabase
            .from(`messages_${schoolSlug}`)
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Marquer comme lu pour le récepteur
        await supabase
            .from(`messages_${schoolSlug}`)
            .update({ read_status: true })
            .eq('conversation_id', conversationId)
            .neq('sender_id', req.user.id);

        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * Envoie un message
 */
async function sendMessage(req, res) {
    const { conversationId, text, imageUrl, targetRole } = req.body;
    const { id, role, schoolSlug } = req.user;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });
    if (!canUseChat(role)) return res.status(403).json({ error: 'Messagerie non disponible pour ce rôle.' });
    if (targetRole && !ADMIN_BOXES.includes(targetRole)) return res.status(400).json({ error: 'Destinataire invalide.' });

    try {
        let convId = conversationId;

        if (convId) {
            const conv = await loadAccessibleConversation(req.user, convId);
            if (!conv) return res.status(404).json({ error: 'Conversation introuvable.' });
        }

        // Si parent initie sans conversationId
        if (!convId && role === 'parent') {
            const { data: conv, error: convErr } = await supabase
                .from(`conversations_${schoolSlug}`)
                .upsert({
                    parent_id: id,
                    admin_role: targetRole || 'administration',
                    last_message: text || 'Photo'
                }, { onConflict: 'parent_id, admin_role' })
                .select()
                .single();

            if (convErr) throw convErr;
            convId = conv.id;
        }

        // Si admin initie sans conversationId (via bouton Contacter)
        if (!convId && role !== 'parent') {
            // Autoriser Admin, Directeur, DG et Comptable à initier
            const allowedRoles = ['admin', 'directeur', 'directeur_general', 'comptable'];
            if (!allowedRoles.includes(role)) {
                return res.status(403).json({ error: "Action restreinte. Seul le Directeur ou le Comptable peut initier un contact." });
            }

            const { parentId, adminRole } = req.body;
            if (!parentId) return res.status(400).json({ error: "parentId manquant pour l'initiation." });
            if (adminRole && !ADMIN_BOXES.includes(adminRole)) return res.status(400).json({ error: 'Boîte de destination invalide.' });

            const { data: conv, error: convErr } = await supabase
                .from(`conversations_${schoolSlug}`)
                .upsert({
                    parent_id: parentId,
                    admin_role: adminRole || (role === 'comptable' ? 'comptabilite' : 'administration'),
                    last_message: text || 'Photo'
                }, { onConflict: 'parent_id, admin_role' })
                .select()
                .single();

            if (convErr) throw convErr;
            convId = conv.id;
        }

        const { data: message, error } = await supabase
            .from(`messages_${schoolSlug}`)
            .insert({
                conversation_id: convId,
                sender_id: id,
                message_text: text,
                image_url: imageUrl
            })
            .select()
            .single();

        if (error) throw error;

        // Update conversation
        await supabase.from(`conversations_${schoolSlug}`).update({
            last_message: text || 'Photo',
            updated_at: new Date().toISOString()
        }).eq('id', convId);

        return res.status(201).json(message);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * Récupère le nombre de messages non lus pour l'utilisateur
 */
async function getUnreadCount(req, res) {
    const { id, role, schoolSlug } = req.user;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });
    if (!canUseChat(role)) return res.json(0);

    try {
        let query = supabase
            .from(`messages_${schoolSlug}`)
            .select('*, conversations!inner(parent_id)', { count: 'exact', head: true })
            .neq('sender_id', id)
            .eq('read_status', false);

        if (role === 'parent') {
            query = query.eq('conversations.parent_id', id);
        } else {
            query = query.eq('conversations.admin_role', staffBox(role));
        }

        const { count, error } = await query;

        if (error) throw error;
        return res.json(count || 0);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
async function uploadImage(req, res) {
    if (!canUseChat(req.user?.role)) return res.status(403).json({ error: 'Messagerie non disponible pour ce rôle.' });
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier.' });

    try {
        // Nom aléatoire (le nom d'origine fourni par le client n'est jamais réutilisé).
        const ext = (req.file.mimetype.split('/')[1] || 'jpg').replace(/[^a-z0-9]/gi, '').slice(0, 5);
        const fileName = `${req.user.schoolSlug}/${Date.now()}_${crypto.randomBytes(8).toString('hex')}.${ext}`;
        const { data, error } = await supabase.storage
            .from('messages')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('messages')
            .getPublicUrl(fileName);

        return res.json({ imageUrl: publicUrl });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function initiateConversation(req, res) {
    const { id, role, schoolSlug } = req.user;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });

    let { parentId, adminRole } = req.body;

    try {
        if (role === 'parent') {
            parentId = id;
            if (!adminRole) adminRole = 'administration';
        } else {
            if (!parentId) return res.status(400).json({ error: "parentId est requis." });
            if (!adminRole) adminRole = (role === 'comptable' ? 'comptabilite' : 'administration');
            
            const allowedRoles = ['admin', 'directeur', 'directeur_general', 'comptable'];
            if (!allowedRoles.includes(role)) {
                return res.status(403).json({ error: "Action restreinte." });
            }
        }

        // Check if existing
        const { data: existing, error: existErr } = await supabase
            .from(`conversations_${schoolSlug}`)
            .select(`*, parent:parent_id (id, nom, telephone)`)
            .eq('parent_id', parentId)
            .eq('admin_role', adminRole)
            .maybeSingle();

        if (existErr) {
            throw existErr;
        }

        if (existing) {
            return res.json(existing);
        }

        // Create new
        const { data: inserted, error: insErr } = await supabase
            .from(`conversations_${schoolSlug}`)
            .insert({
                parent_id: parentId,
                admin_role: adminRole,
                last_message: 'Nouvelle discussion'
            })
            .select(`*, parent:parent_id (id, nom, telephone)`)
            .single();

        if (insErr) throw insErr;
        return res.json(inserted);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * Supprime une conversation et ses messages associés
 */
async function deleteConversation(req, res) {
    const { id: conversationId } = req.params;
    const { schoolSlug, role } = req.user;
    if (!schoolSlug) return res.status(403).json({ error: 'Accès non autorisé.' });
    if (!CHAT_DELETE_ROLES.includes(role)) return res.status(403).json({ error: 'Suppression réservée à la direction.' });

    try {
        const conv = await loadAccessibleConversation(req.user, conversationId);
        if (!conv) return res.status(404).json({ error: 'Conversation introuvable.' });

        // Suppression des messages liés d'abord pour éviter les erreurs de clé étrangère
        await supabase
            .from(`messages_${schoolSlug}`)
            .delete()
            .eq('conversation_id', conversationId);

        // Suppression de la conversation
        const { error } = await supabase
            .from(`conversations_${schoolSlug}`)
            .delete()
            .eq('id', conversationId);

        if (error) throw error;
        
        return res.json({ success: true, message: 'Conversation supprimée avec succès.' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { getConversations, getMessages, sendMessage, uploadImage, getUnreadCount, initiateConversation, deleteConversation };
