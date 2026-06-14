const { supabase } = require('../utils/supabase');
const Joi = require('joi');

// Schema for Admission Request submission
const admissionRequestSchema = Joi.object({
    school_slug: Joi.string().trim().required().messages({
        'any.required': 'Le code de l\'établissement est requis.'
    }),
    nom: Joi.string().trim().required().messages({
        'any.required': 'Le nom est requis.'
    }),
    prenom: Joi.string().trim().required().messages({
        'any.required': 'Le prénom est requis.'
    }),
    sexe: Joi.string().valid('M', 'F').default('M'),
    date_naissance: Joi.string().allow('', null),
    classe: Joi.string().trim().required().messages({
        'any.required': 'La classe est requise.'
    }),
    telephone_parent: Joi.string().trim().required().messages({
        'any.required': 'Le numéro de téléphone du parent est requis.'
    }),
    ecole_provenance: Joi.string().allow('', null)
});

// 1. Submit Admission Request (Public)
async function submitAdmissionRequest(req, res) {
    const { value: validatedData, error: validationError } = admissionRequestSchema.validate(req.body, { abortEarly: false });
    
    if (validationError) {
        return res.status(400).json({ error: validationError.details.map(d => d.message).join(', ') });
    }

    const { school_slug, nom, prenom, sexe, date_naissance, classe, telephone_parent, ecole_provenance } = validatedData;

    try {
        // Verify school exists and is verified
        const { data: school, error: schoolErr } = await supabase
            .from('schools')
            .select('id, name')
            .eq('slug', school_slug)
            .eq('is_email_verified', true)
            .maybeSingle();

        if (schoolErr || !school) {
            return res.status(404).json({ error: "Établissement inconnu ou non vérifié." });
        }

        const payload = {
            school_slug,
            nom: nom.trim(),
            prenom: prenom.trim(),
            sexe,
            date_naissance: date_naissance || null,
            classe: classe.trim(),
            telephone_parent: telephone_parent.trim(),
            ecole_provenance: ecole_provenance || '',
            status: 'pending'
        };

        const { data, error } = await supabase
            .from('admission_requests')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({
            success: true,
            message: "Votre demande d'admission a été envoyée avec succès et est en attente de validation.",
            data
        });
    } catch (err) {
        console.error('SubmitAdmissionRequest Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la soumission de la demande : ' + err.message });
    }
}

// 2. List Admission Requests for a School (Admin)
async function listAdmissionRequests(req, res) {
    const schoolSlug = req.user ? req.user.schoolSlug : null;
    if (!schoolSlug) {
        return res.status(403).json({ error: 'Accès non autorisé.' });
    }

    try {
        const { data, error } = await supabase
            .from('admission_requests')
            .select('*')
            .eq('school_slug', schoolSlug)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return res.json({ success: true, requests: data });
    } catch (err) {
        console.error('ListAdmissionRequests Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la récupération des demandes.' });
    }
}

// 3. Resolve Admission Request (Approve/Reject)
async function resolveAdmissionRequest(req, res) {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    const schoolSlug = req.user ? req.user.schoolSlug : null;

    if (!schoolSlug) {
        return res.status(403).json({ error: 'Accès non autorisé.' });
    }

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Statut invalide. Choisissez 'approved' ou 'rejected'." });
    }

    try {
        // Fetch request and check ownership
        const { data: request, error: fetchErr } = await supabase
            .from('admission_requests')
            .select('*')
            .eq('id', id)
            .eq('school_slug', schoolSlug)
            .maybeSingle();

        if (fetchErr || !request) {
            return res.status(404).json({ error: "Demande d'admission introuvable pour votre établissement." });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ error: "Cette demande a déjà été traitée." });
        }

        // Transaction simulation: Update status
        const { error: updateErr } = await supabase
            .from('admission_requests')
            .update({ status })
            .eq('id', id);

        if (updateErr) throw updateErr;

        // If approved, insert into school's students table
        if (status === 'approved') {
            const studentPayload = {
                nom: request.nom,
                prenom: request.prenom,
                sexe: request.sexe || 'M',
                date_naissance: request.date_naissance || null,
                classe: request.classe,
                telephone_parent: request.telephone_parent,
                ecole_provenance: request.ecole_provenance || '',
                status: 'Non soldé',
                deja_paye: 0,
                restant: 0,
                ecolage: 0
            };

            const { data: student, error: insertError } = await supabase
                .from(`students_${schoolSlug}`)
                .insert(studentPayload)
                .select()
                .single();

            if (insertError) {
                // Rollback status to pending to keep it clean
                await supabase.from('admission_requests').update({ status: 'pending' }).eq('id', id);
                throw insertError;
            }

            return res.json({
                success: true,
                message: "Demande d'admission approuvée et élève inscrit avec succès.",
                student
            });
        }

        return res.json({
            success: true,
            message: "Demande d'admission rejetée."
        });
    } catch (err) {
        console.error('ResolveAdmissionRequest Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors du traitement de la demande : ' + err.message });
    }
}

module.exports = { submitAdmissionRequest, listAdmissionRequests, resolveAdmissionRequest };
