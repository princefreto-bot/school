// ============================================================
// ÉCOLES — liste simple pour peupler les filtres du frontend
// ============================================================
import { Router } from 'express';
import { dghubschoolReadOnly } from '../lib/supabaseClasseur';
import { authenticateOperator } from '../middleware/auth';

const router = Router();
router.use(authenticateOperator);

router.get('/', async (_req, res) => {
    try {
        const schools = await dghubschoolReadOnly.getSchools();
        return res.json({ schools });
    } catch (err: any) {
        console.error('List schools error:', err);
        return res.status(500).json({ error: err.message || 'Erreur lors du chargement des établissements.' });
    }
});

export default router;
