const { supabase } = require('../utils/supabase');

/**
 * POST /api/sync
 * Receives data from frontend and syncs to Supabase (Single Source of Truth).
 */
async function syncFromFrontend(req, res) {
    console.log('🔄 [Sync] Request received');

    if (!req.user) {
        return res.status(401).json({ error: 'Authentification requise.' });
    }

    const { students = [], presences = [], activityLogs = [], appSettings = null, replace = false, matieres = [], classeMatieres = [], notes = [] } = req.body;
    const { role } = req.user;

    if (!['admin', 'directeur', 'directeur_general', 'comptable'].includes(role)) {
        return res.status(403).json({ error: 'Permission refusée.' });
    }

    try {
        if (replace) {
            console.log('🧹 [Sync] Mode Remplacer activé : Nettoyage universel de la base...');
            
            // On tente de supprimer avec des filtres qui couvrent tout le texte
            const { error: err1 } = await supabase.from('presences').delete().filter('id', 'neq', '_none_');
            if (err1) console.error('Erreur nettoyage présences:', err1.message);
            
            const { error: err2 } = await supabase.from('parent_student').delete().filter('student_id', 'neq', '_none_');
            if (err2) console.warn('Note: Cleanup parent_student:', err2.message);
            
            const { error: err3 } = await supabase.from('payments').delete().filter('id', 'neq', '_none_');
            if (err3) console.error('Erreur nettoyage paiements:', err3.message);
            
            const { error: err4 } = await supabase.from('students').delete().filter('id', 'neq', '_none_');
            if (err4) {
                console.error('Erreur FATALE nettoyage élèves:', err4.message);
                throw new Error('Le serveur Supabase refuse la suppression : ' + err4.message);
            }
            
            console.log('✨ [Sync] Base de données cloud remise à zéro.');
        }
        // --- 1. Sync Students ---
        if (students.length > 0) {
            const studentData = students.map(s => ({
                id: s.id,
                nom: s.nom,
                prenom: s.prenom || '',
                classe: s.classe || 'Inconnue',
                cycle: s.cycle || 'Primaire',
                ecolage: s.ecolage || 0,
                deja_paye: s.dejaPaye || 0,
                restant: s.restant || 0,
                status: s.status || 'Non soldé',
                telephone_parent: s.telephone || null
            }));

            await supabase.from('students').upsert(studentData, { onConflict: 'id' });

            // --- 2. Sync Payments ---
            const allPayments = [];
            students.forEach(s => {
                if (Array.isArray(s.historiquesPaiements)) {
                    s.historiquesPaiements.forEach(p => {
                        allPayments.push({
                            id: p.id,
                            student_id: s.id,
                            montant: p.montant,
                            date: p.date,
                            recu: p.recu || null,
                            note: p.note || null
                        });
                    });
                }
            });

            if (allPayments.length > 0) {
                await supabase.from('payments').upsert(allPayments, { onConflict: 'id' });
            }
        }

        // --- 3. Sync Presences ---
        if (presences.length > 0) {
            const presenceData = presences.map(p => ({
                id: p.id,
                student_id: p.eleveId,
                eleve_nom: p.eleveNom,
                eleve_prenom: p.elevePrenom,
                eleve_classe: p.eleveClasse,
                date: p.date,
                heure: p.heure,
                statut: p.statut
            }));
            await supabase.from('presences').upsert(presenceData, { onConflict: 'id' });
        }

        // --- 4. Sync Activity Logs ---
        if (activityLogs.length > 0) {
            const logData = activityLogs.map(l => ({
                id: l.id,
                utilisateur: l.utilisateur,
                utilisateur_role: l.utilisateurRole,
                action: l.action,
                description: l.description,
                date_heure: l.dateHeure
            }));
            await supabase.from('activity_logs').upsert(logData, { onConflict: 'id' });
        }

        // --- 5. Sync App Settings ---
        if (appSettings) {
            try {
                console.log('💾 [Sync] Saving app settings to database...', { appName: appSettings.appName });
                const { error: setErr } = await supabase.from('app_settings').upsert({
                    id: 'global_settings',
                    app_name: appSettings.appName,
                    school_name: appSettings.schoolName,
                    school_year: appSettings.schoolYear,
                    school_logo: appSettings.schoolLogo,
                    school_stamp: appSettings.schoolStamp,
                    message_remerciement: appSettings.messageRemerciement,
                    message_rappel: appSettings.messageRappel,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });
                
                if (setErr) throw setErr;
                console.log('✅ [Sync] App settings saved.');
            } catch (settingsErr) {
                console.warn('⚠️ [Sync] Non-fatal error saving settings:', settingsErr.message);
                // On ne bloque pas la sync des élèves pour un problème de logo
            }
        }

        // --- 6. Sync Academic Data ---
        try {
            if (matieres.length > 0) {
                const matieresData = matieres.map(m => ({
                    id: m.id,
                    nom: m.nom,
                    categorie: m.categorie
                }));
                await supabase.from('matieres').upsert(matieresData, { onConflict: 'id' });
            }

            if (classeMatieres.length > 0) {
                const cmData = classeMatieres.map(cm => ({
                    id: cm.id,
                    classe: cm.classe,
                    matiere_id: cm.matiereId,
                    professeur: cm.professeur || '',
                    coefficient: cm.coefficient || 1
                }));
                await supabase.from('classe_matieres').upsert(cmData, { onConflict: 'id' });
            }

            if (notes.length > 0) {
                // Pour éviter d'envoyer un trop gros payload d'un coup, on va le partitionner si besoin
                const chunkSize = 500;
                for (let i = 0; i < notes.length; i += chunkSize) {
                    const chunk = notes.slice(i, i + chunkSize).map(n => ({
                        id: n.id,
                        eleve_id: n.eleveId,
                        matiere_id: n.matiereId,
                        periode: n.periode,
                        note_classe: n.noteClasse,
                        note_devoir: n.noteDevoir,
                        note_compo: n.noteCompo
                    }));
                    await supabase.from('notes').upsert(chunk, { onConflict: 'id' });
                }
            }
        } catch (acadErr) {
            console.warn('⚠️ [Sync] Non-fatal error saving academic data:', acadErr.message);
            // La table des notes ou matières n'existe peut-être pas encore, on l'ignore pour ne pas casser la sync principale
        }

        console.log(`🎉 [Sync] Completed: ${students.length} students, ${presences.length} presences, ${activityLogs.length} logs, ${notes.length} notes`);
        return res.json({ 
            message: 'Synchronisation cloud réussie.',
            count: students.length,
            presencesCount: presences.length,
            logsCount: activityLogs.length
        });

    } catch (err) {
        console.error('💥 [Sync] Fatal error:', err.message);
        return res.status(500).json({ error: 'Échec de la synchronisation cloud: ' + err.message });
    }
}


/**
 * GET /api/sync
 * Fetches all data from Supabase to initialize/sync frontend store.
 */
async function syncToFrontend(req, res) {
    console.log('🔄 [Sync] Fetching data for frontend...');

    if (!req.user) {
        return res.status(401).json({ error: 'Authentification requise.' });
    }

    const { role } = req.user;
    if (!['admin', 'directeur', 'directeur_general', 'comptable'].includes(role)) {
        return res.status(403).json({ error: 'Permission refusée.' });
    }

    try {
        // Fetch students
        const { data: students, error: sErr } = await supabase
            .from('students')
            .select('*')
            .order('nom');

        if (sErr) throw sErr;

        // Fetch payments
        const { data: payments, error: pErr } = await supabase
            .from('payments')
            .select('*')
            .order('date', { ascending: false });

        if (pErr) throw pErr;

        // Fetch presences
        const { data: presences, error: prErr } = await supabase
            .from('presences')
            .select('*')
            .order('date', { ascending: false })
            .order('heure', { ascending: false });

        if (prErr) throw prErr;

        // Fetch activity logs
        const { data: logs, error: lErr } = await supabase
            .from('activity_logs')
            .select('*')
            .order('date_heure', { ascending: false })
            .limit(500);

        if (lErr) throw lErr;

        // Fetch parent-student links to check if a student is linked
        const { data: links, error: psErr } = await supabase
            .from('parent_student')
            .select('*');

        if (psErr) throw psErr;

        // Fetch app settings
        const { data: appSettings, error: asErr } = await supabase
            .from('app_settings')
            .select('*')
            .eq('id', 'global_settings')
            .single();

        // ignore error if settings don't exist yet

        // Fetch announcements for Admin (no reads table needed currently, or we leave reads local for Admin)
        const { data: announcements, error: aErr } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });

        if (aErr && aErr.code !== '42P01') { 
             console.warn('⚠️ Fetch announcements error (table may not exist):', aErr.message); 
        }

        // Fetch academic data
        const { data: dbMatieres, error: matErr } = await supabase.from('matieres').select('*');
        if (matErr && matErr.code !== '42P01') console.warn('⚠️ Fetch matieres error:', matErr.message);

        const { data: dbClasseMatieres, error: cmErr } = await supabase.from('classe_matieres').select('*');
        if (cmErr && cmErr.code !== '42P01') console.warn('⚠️ Fetch classe_matieres error:', cmErr.message);

        const { data: dbNotes, error: notErr } = await supabase.from('notes').select('*');
        if (notErr && notErr.code !== '42P01') console.warn('⚠️ Fetch notes error:', notErr.message);


        // Group payments by student
        const studentMap = new Map();
        students.forEach(s => {
            studentMap.set(s.id, {
                ...s,
                dejaPaye: s.deja_paye,
                telephone: s.telephone_parent,
                historiquesPaiements: []
            });
        });

        payments.forEach(p => {
            const s = studentMap.get(p.student_id);
            if (s) {
                s.historiquesPaiements.push({
                    id: p.id,
                    studentId: p.student_id,
                    montant: p.montant,
                    date: p.date,
                    recu: p.recu,
                    note: p.note
                });
            }
        });

        console.log(`✅ [Sync] Dispatched ${students.length} students and ${payments.length} payments`);

        return res.json({
            students: Array.from(studentMap.values()),
            presences: presences.map(pr => ({
                id: pr.id,
                eleveId: pr.student_id,
                eleveNom: pr.eleve_nom,
                elevePrenom: pr.eleve_prenom,
                eleveClasse: pr.eleve_classe,
                date: pr.date,
                heure: pr.heure,
                statut: pr.statut
            })),
            activityLogs: logs.map(l => ({
                id: l.id,
                utilisateur: l.utilisateur,
                utilisateurRole: l.utilisateur_role,
                action: l.action,
                description: l.description,
                dateHeure: l.date_heure
            })),
            links: links || [],
            appSettings: appSettings ? {
                appName: appSettings.app_name,
                schoolName: appSettings.school_name,
                schoolYear: appSettings.school_year,
                schoolLogo: appSettings.school_logo,
                schoolStamp: appSettings.school_stamp,
                messageRemerciement: appSettings.message_remerciement,
                messageRappel: appSettings.message_rappel
            } : null,
            announcements: (announcements || []).map(a => ({
                id: a.id,
                titre: a.titre,
                message: a.message,
                cible: a.cible,
                importance: a.importance,
                createdBy: a.created_by,
                createdAt: a.created_at,
                date: a.created_at ? a.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
            })),
            matieres: (dbMatieres || []).map(m => ({
                id: m.id,
                nom: m.nom,
                categorie: m.categorie
            })),
            classeMatieres: (dbClasseMatieres || []).map(cm => ({
                id: cm.id,
                classe: cm.classe,
                matiereId: cm.matiere_id,
                professeur: cm.professeur,
                coefficient: cm.coefficient
            })),
            notes: (dbNotes || []).map(n => ({
                id: n.id,
                eleveId: n.eleve_id,
                matiereId: n.matiere_id,
                periode: n.periode,
                noteClasse: n.note_classe,
                noteDevoir: n.note_devoir,
                noteCompo: n.note_compo
            }))
        });

    } catch (err) {
        console.error('💥 [Sync] Fetch error:', err.message);
        return res.status(500).json({ error: 'Échec de la récupération des données: ' + err.message });
    }
}

/**
 * DELETE /api/sync/presences
 * Vider tout l'historique des présences.
 */
async function clearPresences(req, res) {
    if (!req.user || !['admin', 'directeur', 'directeur_general', 'comptable'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Action non autorisée.' });
    }

    try {
        const { error } = await supabase.from('presences').delete().filter('id', 'neq', '_none_'); 
        if (error) throw error;
        return res.json({ message: 'Historique des présences vidé.' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * DELETE /api/sync/logs
 * Vider les logs d'activité.
 */
async function clearActivityLogs(req, res) {
    if (!req.user || !['admin', 'directeur', 'directeur_general', 'comptable'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Action non autorisée.' });
    }

    try {
        const { error } = await supabase.from('activity_logs').delete().filter('id', 'neq', '_none_');
        if (error) throw error;
        return res.json({ message: 'Logs d\'activité vidés.' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * DELETE /api/sync/students
 * Vider tous les élèves et paiements.
 */
async function clearStudents(req, res) {
    if (!req.user || !['admin', 'directeur', 'directeur_general', 'comptable'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Action non autorisée.' });
    }

    try {
        // Supprimer les liens parents-élèves d'abord
        await supabase.from('parent_student').delete().filter('student_id', 'neq', '_none_');
        
        // Supprimer paiements
        await supabase.from('payments').delete().filter('id', 'neq', '_none_');
        
        // Puis élèves
        const { error } = await supabase.from('students').delete().filter('id', 'neq', '_none_');
        
        if (error) throw error;
        return res.json({ message: 'Base de données des élèves vidée.' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { syncFromFrontend, syncToFrontend, clearPresences, clearActivityLogs, clearStudents };
