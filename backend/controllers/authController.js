const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../utils/supabase');
const { JWT_SECRET, JWT_EXPIRES } = require('../config');
const Joi = require('joi');
const crypto = require('crypto');

// Joi validation schema for Parent registration
const parentRegisterSchema = Joi.object({
    nom: Joi.string().trim().required().messages({
        'any.required': 'Le nom complet est requis.'
    }),
    telephone: Joi.string().trim().required().messages({
        'any.required': 'Le numéro de téléphone est requis.'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Le mot de passe doit contenir au moins 6 caractères.',
        'any.required': 'Le mot de passe est requis.'
    }),
    school_slug: Joi.string().trim().required().messages({
        'any.required': 'Le code de l\'établissement (school_slug) est requis.'
    }),
    accepted_terms: Joi.boolean().valid(true).required().messages({
        'any.only': 'Vous devez accepter les conditions d\'utilisation.'
    }),
    accepted_privacy_policy: Joi.boolean().valid(true).required().messages({
        'any.only': 'Vous devez accepter le traitement de vos données scolaires.'
    }),
    marketing_consent: Joi.boolean().default(false),
    parent_photo_authorization: Joi.boolean().default(false)
});

// Joi validation schema for School registration
const schoolRegisterSchema = Joi.object({
    name: Joi.string().trim().required().messages({
        'any.required': 'Le nom de l\'établissement est requis.'
    }),
    slug: Joi.string().trim().lowercase().required().messages({
        'any.required': 'Le code de l\'établissement (slug) est requis.'
    }),
    address: Joi.string().allow('', null),
    phone: Joi.string().allow('', null),
    email: Joi.string().email().required().messages({
        'string.email': 'L\'adresse email est invalide.',
        'any.required': 'L\'adresse email de l\'établissement est requise.'
    }),
    admin_nom: Joi.string().trim().required().messages({
        'any.required': 'Le nom du directeur est requis.'
    }),
    admin_telephone: Joi.string().trim().required().messages({
        'any.required': 'Le numéro de téléphone du directeur est requis.'
    }),
    admin_password: Joi.string().min(6).required().messages({
        'string.min': 'Le mot de passe doit contenir au moins 6 caractères.',
        'any.required': 'Le mot de passe est requis.'
    }),
    accepted_terms: Joi.boolean().valid(true).required().messages({
        'any.only': 'Vous devez accepter les conditions d\'utilisation.'
    }),
    accepted_privacy_policy: Joi.boolean().valid(true).required().messages({
        'any.only': 'Vous devez accepter la politique de confidentialité.'
    }),
    marketing_consent: Joi.boolean().default(false)
});

function getIpHash(req) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '127.0.0.1';
    const clientIp = typeof ip === 'string' ? ip.split(',')[0].trim() : String(ip);
    return crypto.createHash('sha256').update(clientIp).digest('hex');
}

// ── Register (Uniquement Parents) ──────────────────────────────
async function register(req, res) {
    const { value: validatedData, error: validationError } = parentRegisterSchema.validate(req.body, { abortEarly: false });
    
    if (validationError) {
        return res.status(400).json({ error: validationError.details.map(d => d.message).join(', ') });
    }

    const { nom, telephone, password, school_slug, accepted_terms, accepted_privacy_policy, marketing_consent, parent_photo_authorization } = validatedData;

    try {
        const { data: school } = await supabase
            .from('schools')
            .select('status')
            .eq('slug', school_slug)
            .single();
            
        if (!school) {
            return res.status(404).json({ error: "Établissement inconnu." });
        }
        if (school.status === 'suspended') {
            return res.status(403).json({ error: "L'établissement est suspendu." });
        }

        // Vérifier si existant
        const { data: existing } = await supabase
            .from(`profiles_${school_slug}`)
            .select('id')
            .eq('telephone', telephone.trim())
            .single();

        if (existing) {
            return res.status(409).json({ error: 'Ce numéro de téléphone est déjà enregistré.' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const ipHash = getIpHash(req);

        // Mass assignment protection
        const insertPayload = {
            nom: nom.trim(),
            telephone: telephone.trim(),
            password: hashed,
            role: 'parent',
            accepted_terms,
            accepted_privacy_policy,
            marketing_consent,
            consented_at: new Date().toISOString(),
            signup_ip_hash: ipHash,
            parent_photo_authorization
        };

        const { data: parent, error } = await supabase
            .from(`profiles_${school_slug}`)
            .insert(insertPayload)
            .select()
            .single();

        if (error) throw error;

        const token = jwt.sign(
            { id: parent.id, nom: parent.nom, role: parent.role, schoolSlug: school_slug },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        return res.status(201).json({
            message: 'Compte créé avec succès.',
            token,
            parent: { id: parent.id, nom: parent.nom, telephone: parent.telephone, role: parent.role, schoolSlug: school_slug },
        });
    } catch (err) {
        console.error('Register Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la création du compte : ' + err.message });
    }
}

// ── Login (Séparé par Portail) ──────────────────────────
async function login(req, res) {
    const { telephone, password, schoolSlug, portal } = req.body; // portal: 'parent' ou 'school'

    if (!telephone || !password) {
        return res.status(400).json({ error: 'Champs requis : telephone, password.' });
    }

    try {
        const input = telephone.trim();
        console.log(`🔍 [Auth] Tentative login pour: ${input} (Portail: ${portal || 'non spécifié'})`);

        // ── 1. Vérifier si c'est le SuperAdmin ──
        const { data: superadmin } = await supabase
            .from('superadmins')
            .select('*')
            .or(`telephone.eq.${input}`) // Supporte login téléphone
            .maybeSingle();

        if (superadmin) {
            // Le SuperAdmin ne peut se connecter que via le portail école
            if (portal === 'parent') {
                return res.status(403).json({ error: 'Ce portail est réservé exclusivement aux parents.' });
            }
            const valid = await bcrypt.compare(password, superadmin.password);
            if (valid) {
                console.log(`✅ [Auth] SuperAdmin identifié !`);
                const token = jwt.sign(
                    { id: superadmin.id, nom: superadmin.nom, role: 'superadmin', schoolSlug: null },
                    JWT_SECRET,
                    { expiresIn: JWT_EXPIRES }
                );
                return res.json({
                    message: 'Connexion globale réussie.',
                    token,
                    user: { id: superadmin.id, nom: superadmin.nom, telephone: superadmin.telephone, role: 'superadmin' }
                });
            } else {
                return res.status(401).json({ error: 'Mot de passe SuperAdmin incorrect.' });
            }
        }

        // ── 1b. Vérifier si c'est un Créateur de contenu ──
        const { data: creator } = await supabase
            .from('creators')
            .select('*')
            .or(`telephone.eq.${input}`)
            .maybeSingle();

        if (creator) {
            // Le Créateur ne peut se connecter que via le portail école
            if (portal === 'parent') {
                return res.status(403).json({ error: 'Ce portail est réservé exclusivement aux parents.' });
            }
            const valid = await bcrypt.compare(password, creator.password);
            if (valid) {
                console.log(`✅ [Auth] Créateur identifié !`);
                const token = jwt.sign(
                    { id: creator.id, nom: creator.nom, role: 'creator', schoolSlug: null },
                    JWT_SECRET,
                    { expiresIn: JWT_EXPIRES }
                );
                return res.json({
                    message: 'Connexion Créateur réussie.',
                    token,
                    user: { id: creator.id, nom: creator.nom, telephone: creator.telephone, role: 'creator' }
                });
            } else {
                return res.status(401).json({ error: 'Mot de passe Créateur incorrect.' });
            }
        }
        
        // ── 2. Sinon, l'utilisateur DOIT avoir sélectionné une école ──
        if (!schoolSlug) {
            return res.status(400).json({ error: 'Veuillez sélectionner votre établissement pour vous connecter.' });
        }

        // Vérification accès école
        const { data: school, error: schoolErr } = await supabase
            .from('schools')
            .select('id, name, slug, status, trial_ends_at, logo_url, is_email_verified, is_approved')
            .eq('slug', schoolSlug)
            .single();

        if (schoolErr || !school) {
            return res.status(404).json({ error: 'Établissement introuvable.' });
        }

        if (school.is_email_verified === false) {
            return res.status(403).json({ error: "L'adresse email de cet établissement n'a pas encore été vérifiée. Veuillez d'abord valider votre inscription." });
        }

        if (school.status === 'suspended') {
            return res.status(403).json({ error: "L'accès à cet établissement est suspendu." });
        }
        if (school.status === 'trial' && new Date(school.trial_ends_at) < new Date()) {
            return res.status(402).json({ error: 'trial_expired', message: "La période d'essai est terminée." });
        }

        // ── 3. Chercher l'utilisateur dans la table de l'établissement (par téléphone OU email) ──
        const { data: user, error } = await supabase
            .from(`profiles_${schoolSlug}`)
            .select('*')
            .or(`telephone.eq.${input},email.eq.${input}`)
            .maybeSingle();

        if (error || !user) {
            return res.status(401).json({ error: 'Identifiants (téléphone/email ou mot de passe) incorrects.' });
        }

        // Vérification de la compatibilité avec le portail choisi
        if (portal === 'parent' && user.role !== 'parent') {
            return res.status(403).json({ error: 'Ce portail est réservé exclusivement aux parents d\'élèves.' });
        }
        if (portal === 'school' && user.role === 'parent') {
            return res.status(403).json({ error: 'Ce portail est réservé exclusivement aux personnels scolaires.' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Identifiants (téléphone/email ou mot de passe) incorrects.' });
        }

        console.log(`✅ [Auth] Utilisateur trouvé: ${user.nom} (Rôle: ${user.role}) - École: ${schoolSlug}`);

        const token = jwt.sign(
            { id: user.id, nom: user.nom, role: user.role, schoolSlug },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        // Update last login de façon asynchrone
        supabase.from(`profiles_${schoolSlug}`).update({ last_login: new Date().toISOString() }).eq('id', user.id).then(() => {});

        return res.json({
            message: 'Connexion réussie.',
            token,
            user: {
                id: user.id,
                nom: user.nom,
                telephone: user.telephone,
                role: user.role,
                school_name: school.name,
                school_slug: school.slug,
                school_logo: school.logo_url,
                school_approved: school.is_approved
            },
        });
    } catch (err) {
        console.error('Login Error:', err.message);
        return res.status(500).json({ error: 'Erreur de connexion serveur.' });
    }
}

// ── Delete Account (Self) ─────────────────────────────────────
async function deleteSelfAccount(req, res) {
    const { id, role, schoolSlug } = req.user;

    if (role === 'superadmin') {
        return res.status(403).json({ error: "Le compte superadmin ne peut être supprimé ici." });
    }

    const table = role === 'creator' ? 'creators' : `profiles_${schoolSlug}`;

    try {
        const { error } = await supabase
            .from(table)
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
    const { id, role, schoolSlug } = req.user;
    const { push_token } = req.body;
    
    if (role === 'superadmin' || role === 'creator') {
        return res.json({ success: true, message: 'Push non supporté pour ce rôle.' });
    }

    const table = `profiles_${schoolSlug}`;

    try {
        console.log(`📲 Tentative de mise à jour du push_token pour l'utilisateur ${id}`);

        const { error } = await supabase
            .from(table)
            .update({ push_token })
            .eq('id', id);

        if (error) throw error;
        return res.json({ success: true, message: 'Token de notification mis à jour.' });
    } catch (err) {
        console.error('Update Push Token Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la mise à jour du token.' });
    }
}

// ── Inscription Établissement (Demande + Validation) ──────────────────────────

async function registerSchoolRequest(req, res) {
    const { value: validatedData, error: validationError } = schoolRegisterSchema.validate(req.body, { abortEarly: false });
    
    if (validationError) {
        return res.status(400).json({ error: validationError.details.map(d => d.message).join(', ') });
    }

    const { name, slug, address, phone, email, admin_nom, admin_telephone, admin_password, accepted_terms, accepted_privacy_policy, marketing_consent } = validatedData;

    try {
        const cleanSlug = slug.trim().toLowerCase();
        
        // 1. Vérifier si le slug est déjà utilisé par une école vérifiée
        const { data: existingSchool } = await supabase
            .from('schools')
            .select('id, is_email_verified')
            .eq('slug', cleanSlug)
            .maybeSingle();

        if (existingSchool) {
            if (existingSchool.is_email_verified) {
                return res.status(409).json({ error: `Le code d'établissement "${cleanSlug}" est déjà utilisé.` });
            } else {
                // Nettoyer la demande d'inscription non vérifiée existante
                await supabase.from('schools').delete().eq('id', existingSchool.id);
            }
        }

        // 2. Vérifier si l'email est déjà enregistré pour une école active/vérifiée
        const { data: existingEmail } = await supabase
            .from('schools')
            .select('id')
            .eq('email', email.trim().toLowerCase())
            .eq('is_email_verified', true)
            .maybeSingle();

        if (existingEmail) {
            return res.status(409).json({ error: 'Cette adresse email est déjà enregistrée pour un autre établissement.' });
        }

        // 2b. Nettoyer les demandes d'inscription non vérifiées existantes pour cet email
        await supabase
            .from('schools')
            .delete()
            .eq('email', email.trim().toLowerCase())
            .eq('is_email_verified', false);

        // 3. Préparer le code à 6 chiffres
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins
        const ipHash = getIpHash(req);
        const consentedAt = new Date().toISOString();

        // 4. Crypter le mot de passe directeur
        const hashedPassword = await bcrypt.hash(admin_password, 10);

        const schoolPayload = {
            name: name.trim(),
            slug: cleanSlug,
            address: address || null,
            phone: phone || null,
            email: email.trim().toLowerCase(),
            status: 'trial',
            is_email_verified: false,
            email_verification_code: code,
            email_verification_expires: expiresAt,
            temp_admin_nom: admin_nom.trim(),
            temp_admin_telephone: admin_telephone.trim(),
            temp_admin_password: hashedPassword,
            accepted_terms,
            accepted_privacy_policy,
            marketing_consent,
            consented_at: consentedAt,
            signup_ip_hash: ipHash
        };

        const { error: schoolErr } = await supabase
            .from('schools')
            .insert(schoolPayload);

        if (schoolErr) throw schoolErr;

        // 5. Envoyer l'email
        const { sendVerificationEmail } = require('../utils/mailer');
        try {
            await sendVerificationEmail(email.trim(), name.trim(), code);
        } catch (mailErr) {
            console.warn(`⚠️ [Mailer Warning] Échec de l'envoi de l'e-mail de validation :`, mailErr.message);
            console.log(`🔑 [CODE DE VALIDATION] E-mail: ${email.trim()} | Code: ${code}`);
            // En mode développement, on ne bloque pas la demande d'inscription si le serveur SMTP n'est pas configuré.
            if (process.env.NODE_ENV === 'production') {
                await supabase.from('schools').delete().eq('slug', cleanSlug);
                throw mailErr;
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Un code de confirmation a été envoyé à votre adresse email.'
        });
    } catch (err) {
        console.error('RegisterSchoolRequest Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la demande d\'inscription : ' + err.message });
    }
}

async function verifySchoolEmail(req, res) {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ error: 'Champs requis : email, code.' });
    }

    try {
        // 1. Trouver les demandes d'inscription en attente pour cet email (la plus récente en premier)
        const { data: pendingSchools, error: fetchErr } = await supabase
            .from('schools')
            .select('*')
            .eq('email', email.trim().toLowerCase())
            .eq('is_email_verified', false)
            .order('created_at', { ascending: false });

        if (fetchErr || !pendingSchools || pendingSchools.length === 0) {
            return res.status(404).json({ error: 'Aucune demande d\'inscription en attente trouvée pour cet email.' });
        }

        const school = pendingSchools[0];

        // 2. Vérifier le code et sa validité temporelle
        if (school.email_verification_code !== code) {
            return res.status(400).json({ error: 'Code de validation incorrect.' });
        }

        if (new Date(school.email_verification_expires) < new Date()) {
            return res.status(400).json({ error: 'Le code de validation a expiré.' });
        }

        // 3. Exécuter l'initialisation des tables spécifiques via RPC Supabase
        const { error: rpcErr } = await supabase.rpc('create_school_tables', { school_slug: school.slug });
        if (rpcErr) throw rpcErr;

        // Attente de 1s pour le rechargement de schéma REST de Supabase
        await new Promise(r => setTimeout(r, 1000));

        // 4. Créer le compte directeur (admin principal) de l'école dans sa table dédiée
        const adminPayload = {
            nom: school.temp_admin_nom,
            telephone: school.temp_admin_telephone,
            email: school.email,
            password: school.temp_admin_password,
            role: 'directeur',
            accepted_terms: school.accepted_terms,
            accepted_privacy_policy: school.accepted_privacy_policy,
            marketing_consent: school.marketing_consent,
            consented_at: school.consented_at,
            signup_ip_hash: school.signup_ip_hash
        };

        const { data: admin, error: adminErr } = await supabase
            .from(`profiles_${school.slug}`)
            .insert(adminPayload)
            .select()
            .single();

        if (adminErr) throw adminErr;

        // 5. Activer l'école définitivement (email vérifié, mais reste is_approved = false)
        const trialEndsAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(); // +2 mois d'essai gratuit
        const { error: updateErr } = await supabase
            .from('schools')
            .update({
                status: 'trial',
                trial_ends_at: trialEndsAt,
                is_email_verified: true,
                email_verification_code: null,
                email_verification_expires: null,
                temp_admin_nom: null,
                temp_admin_telephone: null,
                temp_admin_password: null,
                is_approved: false
            })
            .eq('id', school.id);

        if (updateErr) throw updateErr;

        // Nettoyer les autres demandes d'inscription non vérifiées pour cet email
        await supabase
            .from('schools')
            .delete()
            .eq('email', email.trim().toLowerCase())
            .eq('is_email_verified', false)
            .neq('id', school.id);

        console.log(`🏫 Nouvelle école enregistrée et validée par e-mail : ${school.name} (${school.slug})`);

        // Signer directement un token JWT pour connecter l'utilisateur
        const token = jwt.sign(
            { id: admin.id, nom: admin.nom, role: admin.role, schoolSlug: school.slug },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        return res.json({
            success: true,
            message: 'Votre adresse email a été validée avec succès.',
            token,
            user: {
                id: admin.id,
                nom: admin.nom,
                telephone: admin.telephone,
                role: admin.role,
                school_name: school.name,
                school_slug: school.slug,
                school_logo: school.logo_url || null,
                school_approved: false
            }
        });
    } catch (err) {
        console.error('VerifySchoolEmail Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la validation du code : ' + err.message });
    }
}

async function resendVerificationEmail(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'L\'adresse email est requise.' });
    }

    try {
        const cleanEmail = email.trim().toLowerCase();

        // 1. Trouver la demande d'inscription la plus récente en attente
        const { data: pendingSchools, error: fetchErr } = await supabase
            .from('schools')
            .select('*')
            .eq('email', cleanEmail)
            .eq('is_email_verified', false)
            .order('created_at', { ascending: false });

        if (fetchErr || !pendingSchools || pendingSchools.length === 0) {
            return res.status(404).json({ error: 'Aucune demande d\'inscription en attente trouvée pour cet email.' });
        }

        const school = pendingSchools[0];

        // 2. Générer un nouveau code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

        // 3. Mettre à jour la demande avec le nouveau code et expiration
        const { error: updateErr } = await supabase
            .from('schools')
            .update({
                email_verification_code: code,
                email_verification_expires: expiresAt
            })
            .eq('id', school.id);

        if (updateErr) throw updateErr;

        // 4. Renvoyer l'e-mail
        const { sendVerificationEmail } = require('../utils/mailer');
        try {
            await sendVerificationEmail(cleanEmail, school.name, code);
        } catch (mailErr) {
            console.warn(`⚠️ [Mailer Warning] Échec du renvoi de l'e-mail de validation :`, mailErr.message);
            console.log(`🔑 [CODE DE VALIDATION - RENVOI] E-mail: ${cleanEmail} | Code: ${code}`);
            
            if (process.env.NODE_ENV === 'production') {
                throw mailErr;
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Un nouveau code de confirmation a été envoyé à votre adresse email.'
        });
    } catch (err) {
        console.error('ResendVerificationEmail Error:', err.message);
        return res.status(500).json({ error: 'Erreur lors du renvoi du code : ' + err.message });
    }
}

module.exports = { register, login, deleteSelfAccount, updatePushToken, registerSchoolRequest, verifySchoolEmail, resendVerificationEmail };
