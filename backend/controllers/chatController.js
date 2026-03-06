const { supabase } = require('../utils/supabase');

/**
 * Récupère les conversations pour l'utilisateur connecté
 */
async function getConversations(req, res) {
    const { id, role } = req.user;

    try {
        let query = supabase.from('conversations').select(`
            *,
            parent:parent_id (id, nom, telephone)
        `);

        if (role === 'parent') {
            query = query.eq('parent_id', id);
        } else if (role === 'comptable') {
            query = query.eq('admin_role', 'comptabilite');
        } else {
            // Autres admins voient l'administration
            query = query.eq('admin_role', 'administration');
        }

        const { data, error } = await query.order('updated_at', { ascending: false });

        if (error) throw error;
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * Récupère les messages d'une conversation
 */
async function getMessages(req, res) {
    const { conversationId } = req.params;

    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Marquer comme lu pour le récepteur
        await supabase
            .from('messages')
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
    const { id, role } = req.user;

    try {
        let convId = conversationId;

        // Si parent initie sans conversationId
        if (!convId && role === 'parent') {
            const { data: conv, error: convErr } = await supabase
                .from('conversations')
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
            const { parentId, adminRole } = req.body;
            if (!parentId) return res.status(400).json({ error: "parentId manquant pour l'initiation." });

            const { data: conv, error: convErr } = await supabase
                .from('conversations')
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
            .from('messages')
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
        await supabase.from('conversations').update({
            last_message: text || 'Photo',
            updated_at: new Date().toISOString()
        }).eq('id', convId);

        return res.status(201).json(message);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * Upload d'image vers Supabase Storage
 */
async function uploadImage(req, res) {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier.' });

    try {
        const fileName = `${Date.now()}_${req.file.originalname}`;
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

module.exports = { getConversations, getMessages, sendMessage, uploadImage };
