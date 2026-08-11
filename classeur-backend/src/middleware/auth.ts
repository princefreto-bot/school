// ============================================================
// AUTH MIDDLEWARE — classeur-backend
// ============================================================
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface ClasseurJwtPayload {
    operatorId: string;
    superadminId: string;
    nom: string;
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            operator?: ClasseurJwtPayload;
        }
    }
}

export function authenticateOperator(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: 'Accès refusé. Token manquant.' });
    }
    try {
        const payload = jwt.verify(token, config.CLASSEUR_JWT_SECRET) as ClasseurJwtPayload;
        req.operator = payload;
        return next();
    } catch {
        return res.status(401).json({ error: 'Session expirée ou invalide.' });
    }
}
