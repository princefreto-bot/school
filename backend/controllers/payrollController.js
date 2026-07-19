const { supabase } = require('../utils/supabase');

/**
 * Calcule l'IRPP annuel selon un barème progressif par tranches.
 * brackets: [{ min, max (null = illimité), rate (en %) }, ...]
 */
function calculateIRPP(taxableAnnual, brackets) {
    let tax = 0;
    for (const b of brackets) {
        if (taxableAnnual <= b.min) break;
        const upper = (b.max === null || taxableAnnual < b.max) ? taxableAnnual : b.max;
        tax += (upper - b.min) * (Number(b.rate) / 100);
    }
    return tax;
}

async function getTaxConfig() {
    const { data, error } = await supabase
        .from('payroll_tax_config')
        .select('*')
        .eq('id', 'default')
        .single();
    if (error) throw error;
    return data;
}

/**
 * Calcule un bulletin de paie complet à partir du salaire mensuel brut.
 * Toutes les valeurs viennent de payroll_tax_config — jamais codées en dur ici.
 */
function computePayslipAmounts({ salaireBase, primes, retenues, personnesACharge, config }) {
    const totalPrimes = (primes || []).reduce((sum, p) => sum + Number(p.montant || 0), 0);
    const totalRetenues = (retenues || []).reduce((sum, r) => sum + Number(r.montant || 0), 0);
    const brutMensuel = Number(salaireBase) + totalPrimes;

    const cnssSalarial = brutMensuel * (Number(config.cnss_employee_rate) / 100);
    const cnssPatronal = brutMensuel * (Number(config.cnss_employer_rate) / 100);
    const amuSalarial = brutMensuel * (Number(config.amu_employee_rate) / 100);
    const amuPatronal = brutMensuel * (Number(config.amu_employer_rate) / 100);

    // L'IRPP se calcule sur une base annuelle (barème progressif annuel), puis on
    // ramène le résultat au mois pour la retenue de ce bulletin.
    const brutAnnuel = brutMensuel * 12;
    const baseApresCotisations = brutAnnuel - (cnssSalarial * 12) - (amuSalarial * 12);
    const baseAbattement = Math.min(baseApresCotisations, Number(config.allowance_cap));
    const abattement = baseAbattement * (Number(config.allowance_rate) / 100);
    const deductionChargesAnnuelle = Math.min(personnesACharge || 0, config.max_dependents) * Number(config.dependent_deduction_monthly) * 12;

    let revenuImposable = baseApresCotisations - abattement - deductionChargesAnnuelle;
    revenuImposable = Math.max(0, Math.floor(revenuImposable / 1000) * 1000);

    const irppAnnuel = calculateIRPP(revenuImposable, config.irpp_brackets);
    const irppMensuel = irppAnnuel / 12;

    const netAPayer = brutMensuel - cnssSalarial - amuSalarial - irppMensuel - totalRetenues;

    return {
        salaireBase: Number(salaireBase),
        brutMensuel,
        cnssSalarial,
        cnssPatronal,
        amuSalarial,
        amuPatronal,
        irpp: irppMensuel,
        netAPayer
    };
}

/**
 * GET /api/payroll/config
 * Configuration légale (lecture pour tous les rôles autorisés à voir la paie).
 */
async function getConfig(req, res) {
    try {
        const config = await getTaxConfig();
        return res.json(config);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * GET /api/payroll/staff
 * Liste du personnel avec son salaire de base actuel (le plus récent par date_effet).
 */
async function getStaffSalaries(req, res) {
    const { schoolSlug } = req.user;
    try {
        const { data: personnel, error: pErr } = await supabase
            .from(`profiles_${schoolSlug}`)
            .select('id, nom, role')
            .neq('role', 'parent')
            .order('nom', { ascending: true });
        if (pErr) throw pErr;

        const { data: salaries, error: sErr } = await supabase
            .from(`staff_salaries_${schoolSlug}`)
            .select('*')
            .order('date_effet', { ascending: false });
        if (sErr) throw sErr;

        const latestByPersonnel = {};
        for (const s of (salaries || [])) {
            if (!latestByPersonnel[s.personnel_id]) latestByPersonnel[s.personnel_id] = s;
        }

        const result = (personnel || []).map(p => ({
            ...p,
            salaireBase: latestByPersonnel[p.id] ? Number(latestByPersonnel[p.id].salaire_base) : null,
            dateEffet: latestByPersonnel[p.id] ? latestByPersonnel[p.id].date_effet : null
        }));

        return res.json(result);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * POST /api/payroll/staff/:personnelId/salary
 * Définit/met à jour le salaire de base d'un membre du personnel.
 */
async function setStaffSalary(req, res) {
    const { schoolSlug } = req.user;
    const { personnelId } = req.params;
    const { salaireBase, dateEffet } = req.body;

    if (!salaireBase || salaireBase <= 0) {
        return res.status(400).json({ error: 'Salaire de base invalide.' });
    }

    try {
        const { data, error } = await supabase
            .from(`staff_salaries_${schoolSlug}`)
            .insert({
                personnel_id: personnelId,
                salaire_base: salaireBase,
                date_effet: dateEffet || new Date().toISOString().slice(0, 10)
            })
            .select('*')
            .single();
        if (error) throw error;
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * POST /api/payroll/payslips
 * Génère (ou remplace) le bulletin d'un membre du personnel pour une période.
 */
async function generatePayslip(req, res) {
    const { schoolSlug, id: userId } = req.user;
    const { personnelId, periode, salaireBase, primes, retenues, personnesACharge } = req.body;

    if (!personnelId || !periode || !salaireBase || salaireBase <= 0) {
        return res.status(400).json({ error: 'Personnel, période et salaire de base requis.' });
    }
    if (!/^\d{4}-\d{2}$/.test(periode)) {
        return res.status(400).json({ error: 'Format de période invalide (attendu AAAA-MM).' });
    }

    try {
        const config = await getTaxConfig();
        const amounts = computePayslipAmounts({
            salaireBase,
            primes: primes || [],
            retenues: retenues || [],
            personnesACharge: personnesACharge || 0,
            config
        });

        const { data, error } = await supabase
            .from(`payslips_${schoolSlug}`)
            .upsert({
                personnel_id: personnelId,
                periode,
                salaire_base: amounts.salaireBase,
                primes: primes || [],
                retenues: retenues || [],
                personnes_a_charge: personnesACharge || 0,
                cnss_salarial: amounts.cnssSalarial,
                cnss_patronal: amounts.cnssPatronal,
                amu_salarial: amounts.amuSalarial,
                amu_patronal: amounts.amuPatronal,
                irpp: amounts.irpp,
                net_a_payer: amounts.netAPayer,
                created_by: userId
            }, { onConflict: 'personnel_id,periode' })
            .select('*')
            .single();

        if (error) throw error;
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * GET /api/payroll/payslips?periode=AAAA-MM
 * Historique des bulletins (filtrable par période).
 */
async function getPayslips(req, res) {
    const { schoolSlug } = req.user;
    const { periode } = req.query;

    try {
        let query = supabase
            .from(`payslips_${schoolSlug}`)
            .select(`*, personnel:personnel_id ( nom, role )`)
            .order('generated_at', { ascending: false });

        if (periode) query = query.eq('periode', periode);

        const { data, error } = await query;
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * PATCH /api/superadmin/payroll-config
 * Réservé SuperAdmin : ce sont des taux légaux nationaux, pas des réglages école.
 */
async function updateConfig(req, res) {
    const {
        cnss_employer_rate, cnss_employee_rate, amu_employer_rate, amu_employee_rate,
        irpp_brackets, allowance_rate, allowance_cap, dependent_deduction_monthly, max_dependents
    } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (cnss_employer_rate !== undefined) updates.cnss_employer_rate = cnss_employer_rate;
    if (cnss_employee_rate !== undefined) updates.cnss_employee_rate = cnss_employee_rate;
    if (amu_employer_rate !== undefined) updates.amu_employer_rate = amu_employer_rate;
    if (amu_employee_rate !== undefined) updates.amu_employee_rate = amu_employee_rate;
    if (irpp_brackets !== undefined) updates.irpp_brackets = irpp_brackets;
    if (allowance_rate !== undefined) updates.allowance_rate = allowance_rate;
    if (allowance_cap !== undefined) updates.allowance_cap = allowance_cap;
    if (dependent_deduction_monthly !== undefined) updates.dependent_deduction_monthly = dependent_deduction_monthly;
    if (max_dependents !== undefined) updates.max_dependents = max_dependents;

    try {
        const { data, error } = await supabase
            .from('payroll_tax_config')
            .update(updates)
            .eq('id', 'default')
            .select('*')
            .single();
        if (error) throw error;
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = {
    getConfig,
    updateConfig,
    getStaffSalaries,
    setStaffSalary,
    generatePayslip,
    getPayslips,
    computePayslipAmounts // exporté pour les tests
};
