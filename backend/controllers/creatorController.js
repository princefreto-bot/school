// ============================================================
// CREATOR CONTROLLER — Espace Créateur & Gestion Affiliations
// ============================================================
const { supabase } = require('../utils/supabase');
const bcrypt = require('bcryptjs');
const Joi = require('joi');

const PRICE_PER_STUDENT = 2100; // FCFA (Prix de la licence)

// ── GET /api/creator/dashboard ─────────────────────────────────
// Statistiques pour le créateur connecté
async function getCreatorDashboard(req, res) {
    const creatorId = req.user.id;
    
    try {
        // 1. Récupérer les infos du créateur
        const { data: creator, error: cErr } = await supabase
            .from('creators')
            .select('id, nom, telephone')
            .eq('id', creatorId)
            .single();
            
        if (cErr || !creator) {
            return res.status(404).json({ error: 'Créateur non trouvé.' });
        }
        
        // 2. Récupérer les écoles liées
        const { data: links, error: lErr } = await supabase
            .from('creator_schools')
            .select('school_id')
            .eq('creator_id', creatorId);
            
        if (lErr) throw lErr;
        
        const schoolsData = [];
        let grandTotalStudents = 0;
        let grandTotalActiveStudents = 0;
        let grandTotalRevenue = 0;
        let grandTotalCreatorRevenue = 0;
        
        if (links && links.length > 0) {
            const schoolIds = links.map(l => l.school_id);
            
            // Charger les détails des écoles correspondantes
            const { data: schools, error: sErr } = await supabase
                .from('schools')
                .select('id, name, slug, logo_url, status')
                .in('id', schoolIds);
                
            if (sErr) throw sErr;
            
            for (const school of (schools || [])) {
                let studentCount = 0;
                let activeStudentCount = 0;
                
                try {
                    // Compter les élèves dans la table dynamic de l'école
                    const { count: sCount } = await supabase
                        .from(`students_${school.slug}`)
                        .select('*', { count: 'exact', head: true });
                    studentCount = sCount || 0;
                    
                    // Compter les comptes débloqués (license_status = 'active')
                    const { count: actCount } = await supabase
                        .from(`students_${school.slug}`)
                        .select('*', { count: 'exact', head: true })
                        .eq('license_status', 'active');
                    activeStudentCount = actCount || 0;
                } catch (err) {
                    console.warn(`Table students_${school.slug} inaccessible:`, err.message);
                }
                
                const schoolRevenue = activeStudentCount * PRICE_PER_STUDENT;
                const creatorRevenue = schoolRevenue * 0.20; // 20%
                
                schoolsData.push({
                    id: school.id,
                    name: school.name,
                    slug: school.slug,
                    logo_url: school.logo_url,
                    status: school.status,
                    total_students: studentCount,
                    active_students: activeStudentCount,
                    revenue_generated: schoolRevenue,
                    creator_commission: creatorRevenue
                });
                
                grandTotalStudents += studentCount;
                grandTotalActiveStudents += activeStudentCount;
                grandTotalRevenue += schoolRevenue;
                grandTotalCreatorRevenue += creatorRevenue;
            }
        }
        
        return res.json({
            creator,
            summary: {
                total_schools: schoolsData.length,
                total_students: grandTotalStudents,
                total_active_students: grandTotalActiveStudents,
                total_revenue_generated: grandTotalRevenue,
                total_creator_commission: grandTotalCreatorRevenue,
                price_per_student: PRICE_PER_STUDENT,
                commission_percentage: 20
            },
            schools: schoolsData
        });
    } catch (err) {
        console.error('getCreatorDashboard Error:', err.message);
        return res.status(500).json({ error: 'Erreur serveur: ' + err.message });
    }
}

// ── GET /api/superadmin/creators ───────────────────────────────
// Liste tous les créateurs de contenu (SuperAdmin)
async function getAllCreators(req, res) {
    try {
        const { data: creators, error: cErr } = await supabase
            .from('creators')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (cErr) throw cErr;
        
        const creatorsWithStats = await Promise.all(
            creators.map(async (creator) => {
                // Récupérer les affiliations
                const { data: links, error: lErr } = await supabase
                    .from('creator_schools')
                    .select('school_id')
                    .eq('creator_id', creator.id);
                    
                if (lErr) throw lErr;
                
                const linkedSchools = [];
                let totalStudents = 0;
                let totalActiveStudents = 0;
                
                if (links && links.length > 0) {
                    const schoolIds = links.map(l => l.school_id);
                    const { data: schools } = await supabase
                        .from('schools')
                        .select('id, name, slug')
                        .in('id', schoolIds);
                        
                    if (schools) {
                        for (const school of schools) {
                            let studentCount = 0;
                            let activeStudentCount = 0;
                            
                            try {
                                const { count: sCount } = await supabase
                                    .from(`students_${school.slug}`)
                                    .select('*', { count: 'exact', head: true });
                                studentCount = sCount || 0;
                                
                                const { count: actCount } = await supabase
                                    .from(`students_${school.slug}`)
                                    .select('*', { count: 'exact', head: true })
                                    .eq('license_status', 'active');
                                activeStudentCount = actCount || 0;
                            } catch (err) {
                                console.warn(`Error counting student for ${school.slug}:`, err.message);
                            }
                            
                            linkedSchools.push({
                                id: school.id,
                                name: school.name,
                                slug: school.slug,
                                total_students: studentCount,
                                active_students: activeStudentCount,
                                revenue_generated: activeStudentCount * PRICE_PER_STUDENT,
                                creator_commission: activeStudentCount * PRICE_PER_STUDENT * 0.20
                            });
                            
                            totalStudents += studentCount;
                            totalActiveStudents += activeStudentCount;
                        }
                    }
                }
                
                const totalRevenue = totalActiveStudents * PRICE_PER_STUDENT;
                const totalCommission = totalRevenue * 0.20;
                
                return {
                    id: creator.id,
                    nom: creator.nom,
                    telephone: creator.telephone,
                    created_at: creator.created_at,
                    linked_schools_count: linkedSchools.length,
                    linked_schools: linkedSchools,
                    total_students: totalStudents,
                    total_active_students: totalActiveStudents,
                    total_revenue_generated: totalRevenue,
                    total_commission: totalCommission
                };
            })
        );
        
        return res.json(creatorsWithStats);
    } catch (err) {
        console.error('getAllCreators Error:', err.message);
        return res.status(500).json({ error: 'Erreur serveur: ' + err.message });
    }
}

// Validation de création
const creatorCreateSchema = Joi.object({
    nom: Joi.string().trim().required().messages({
        'any.required': 'Le nom est requis.'
    }),
    telephone: Joi.string().trim().required().messages({
        'any.required': 'Le numéro de téléphone est requis.'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Le mot de passe doit contenir au moins 6 caractères.',
        'any.required': 'Le mot de passe est requis.'
    })
});

// ── POST /api/superadmin/creators ──────────────────────────────
// Crée un nouveau compte créateur (SuperAdmin)
async function createCreator(req, res) {
    const { value: validatedData, error: validationError } = creatorCreateSchema.validate(req.body);
    if (validationError) {
        return res.status(400).json({ error: validationError.details[0].message });
    }
    
    const { nom, telephone, password } = validatedData;
    
    try {
        // Vérifier si le téléphone existe déjà
        const { data: existing } = await supabase
            .from('creators')
            .select('id')
            .eq('telephone', telephone.trim())
            .single();
            
        if (existing) {
            return res.status(409).json({ error: 'Ce numéro de téléphone est déjà utilisé par un créateur.' });
        }
        
        const hashed = await bcrypt.hash(password, 10);
        
        const { data: creator, error } = await supabase
            .from('creators')
            .insert({
                nom: nom.trim(),
                telephone: telephone.trim(),
                password: hashed
            })
            .select()
            .single();
            
        if (error) throw error;
        
        return res.status(201).json({
            message: 'Créateur de contenu créé avec succès.',
            creator: { id: creator.id, nom: creator.nom, telephone: creator.telephone }
        });
    } catch (err) {
        console.error('createCreator Error:', err.message);
        return res.status(500).json({ error: 'Erreur serveur: ' + err.message });
    }
}

// ── DELETE /api/superadmin/creators/:id ─────────────────────────
// Supprime un créateur (SuperAdmin)
async function deleteCreator(req, res) {
    const { id } = req.params;
    try {
        const { error } = await supabase
            .from('creators')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        return res.json({ message: 'Compte créateur supprimé avec succès.' });
    } catch (err) {
        console.error('deleteCreator Error:', err.message);
        return res.status(500).json({ error: 'Erreur serveur: ' + err.message });
    }
}

// ── POST /api/superadmin/creators/:id/link ─────────────────────
// Lie un créateur à une école (SuperAdmin)
async function linkCreatorToSchool(req, res) {
    const { id } = req.params; // creator_id
    const { school_id } = req.body;
    
    if (!school_id) {
        return res.status(400).json({ error: "L'identifiant de l'établissement (school_id) est requis." });
    }
    
    try {
        const { error } = await supabase
            .from('creator_schools')
            .insert({
                creator_id: id,
                school_id: school_id
            });
            
        if (error) {
            if (error.code === '23505') { // unique violation
                return res.status(409).json({ error: 'Cet établissement est déjà lié à ce créateur.' });
            }
            throw error;
        }
        
        return res.json({ success: true, message: 'Établissement lié au créateur avec succès.' });
    } catch (err) {
        console.error('linkCreatorToSchool Error:', err.message);
        return res.status(500).json({ error: 'Erreur serveur: ' + err.message });
    }
}

// ── DELETE /api/superadmin/creators/:id/link/:schoolId ──────────
// Retire l'affiliation d'une école pour un créateur (SuperAdmin)
async function unlinkCreatorFromSchool(req, res) {
    const { id, schoolId } = req.params;
    
    try {
        const { error } = await supabase
            .from('creator_schools')
            .delete()
            .eq('creator_id', id)
            .eq('school_id', schoolId);
            
        if (error) throw error;
        return res.json({ success: true, message: 'Affiliation supprimée.' });
    } catch (err) {
        console.error('unlinkCreatorFromSchool Error:', err.message);
        return res.status(500).json({ error: 'Erreur serveur: ' + err.message });
    }
}

module.exports = {
    getCreatorDashboard,
    getAllCreators,
    createCreator,
    deleteCreator,
    linkCreatorToSchool,
    unlinkCreatorFromSchool
};
