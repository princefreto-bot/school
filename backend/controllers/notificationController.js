const { supabase } = require('../utils/supabase');
const { sendPushNotification } = require('../utils/webPush');

/**
 * POST /api/notifications/send
 * Envoie une notification push et enregistre un message dans la messagerie du parent.
 */
async function sendNotification(req, res) {
    const { studentId, message } = req.body;

    try {
        // 1. Trouver tous les parents liés à cet élève
        const { data: links, error: lErr } = await supabase
            .from('parent_student')
            .select('parent_id')
            .eq('student_id', studentId);

        if (lErr) throw lErr;

        if (!links || links.length === 0) {
            return res.json({ success: true, message: 'Aucun parent lié, aucune notification envoyée.' });
        }

        const parentIds = links.map(l => l.parent_id);

        for (const parentId of parentIds) {
            // 2. Enregistrer le message dans la messagerie (si conversation existe)
            // On cherche ou crée une conversation 'administration'
            const { data: conv, error: cErr } = await supabase
                .from('conversations')
                .upsert({
                    parent_id: parentId,
                    admin_role: 'administration',
                    last_message: message
                }, { onConflict: 'parent_id, admin_role' })
                .select()
                .single();

            if (!cErr && conv) {
                await supabase.from('messages').insert({
                    conversation_id: conv.id,
                    sender_id: req.user.id, // L'admin qui scanne
                    message_text: message,
                    read_status: false
                });
            }

            // 3. Envoi via Web Push (vraie notification OS)
            console.log(`📲 Préparation Notification Push Web pour le Parent ${parentId} : ${message}`);
            await sendPushNotification(parentId, "Pointage de l'élève", message);
        }

        return res.json({ success: true, count: parentIds.length });
    } catch (err) {
        console.error('❌ Error sending notification:', err);
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { sendNotification };
