// ============================================================
// PROSPECTS — Pipeline commercial SuperAdmin (CRM écoles pas encore clientes)
// Accessible UNIQUEMENT au propriétaire de la plateforme
// ============================================================
const { supabase } = require('../utils/supabase');

const VALID_STAGES = ['new', 'contacted', 'demo', 'negotiation', 'won', 'lost'];

async function listProspects(req, res) {
    try {
        const { stage } = req.query;
        let q = supabase.from('prospects').select('*').order('created_at', { ascending: false });
        if (stage) q = q.eq('stage', stage);
        const { data, error } = await q;
        if (error) throw error;
        return res.json({ prospects: data || [] });
    } catch (err) {
        console.error('listProspects error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

async function createProspect(req, res) {
    try {
        const { name, contact_name, phone, email, source, stage, notes } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Le nom du prospect est requis.' });
        }
        const payload = {
            name: name.trim(),
            contact_name: contact_name || null,
            phone: phone || null,
            email: email || null,
            source: source || null,
            stage: VALID_STAGES.includes(stage) ? stage : 'new',
            notes: notes || null,
            created_by: req.user.id,
        };
        const { data, error } = await supabase.from('prospects').insert(payload).select().single();
        if (error) throw error;
        return res.status(201).json({ prospect: data });
    } catch (err) {
        console.error('createProspect error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

async function updateProspect(req, res) {
    try {
        const { id } = req.params;
        const { name, contact_name, phone, email, source, notes } = req.body;
        const updates = { updated_at: new Date().toISOString() };
        if (name !== undefined) updates.name = name;
        if (contact_name !== undefined) updates.contact_name = contact_name;
        if (phone !== undefined) updates.phone = phone;
        if (email !== undefined) updates.email = email;
        if (source !== undefined) updates.source = source;
        if (notes !== undefined) updates.notes = notes;

        const { data, error } = await supabase.from('prospects').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return res.json({ prospect: data });
    } catch (err) {
        console.error('updateProspect error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

async function updateProspectStage(req, res) {
    try {
        const { id } = req.params;
        const { stage } = req.body;
        if (!VALID_STAGES.includes(stage)) {
            return res.status(400).json({ error: `Étape invalide. Valeurs possibles : ${VALID_STAGES.join(', ')}.` });
        }
        const { data, error } = await supabase
            .from('prospects')
            .update({ stage, stage_changed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return res.json({ prospect: data });
    } catch (err) {
        console.error('updateProspectStage error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

async function deleteProspect(req, res) {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('prospects').delete().eq('id', id);
        if (error) throw error;
        return res.json({ success: true });
    } catch (err) {
        console.error('deleteProspect error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { listProspects, createProspect, updateProspect, updateProspectStage, deleteProspect, VALID_STAGES };
