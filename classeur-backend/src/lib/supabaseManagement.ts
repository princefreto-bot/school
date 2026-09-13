// ============================================================
// API MANAGEMENT SUPABASE — lecture seule, best-effort
// ============================================================
// Utilise le jeton Management (secret niveau compte) UNIQUEMENT côté serveur.
// Tout est optionnel et tolérant aux pannes : si le jeton est absent ou qu'un
// endpoint renvoie une erreur (403/404 selon la portée du jeton), on renvoie
// null pour ce bloc — le reste du tableau de bord infra continue de marcher.
import { config } from '../config';

const BASE = 'https://api.supabase.com';

async function mgmtGet(path: string): Promise<any | null> {
    const token = config.SUPABASE_MANAGEMENT_TOKEN;
    if (!token) return null;
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(`${BASE}${path}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export interface SupabaseLiveInfo {
    project: {
        name: string;
        region: string;
        status: string;
        postgresVersion: string | null;
        createdAt: string | null;
    } | null;
    // Addons payants actuellement activés (source de coût réel côté Supabase).
    activeAddons: { type: string; name: string; priceDescription: string | null }[];
    tokenConfigured: boolean;
}

/** Récupère ce que le jeton Management permet de lire de façon fiable :
 *  métadonnées projet + addons payants activés. Renvoie toujours un objet
 *  (jamais d'exception) pour ne pas casser le tableau de bord infra. */
export async function getSupabaseLiveInfo(): Promise<SupabaseLiveInfo> {
    const ref = config.SUPABASE_PROJECT_REF;
    const tokenConfigured = !!config.SUPABASE_MANAGEMENT_TOKEN;
    if (!tokenConfigured || !ref) {
        return { project: null, activeAddons: [], tokenConfigured };
    }

    const [proj, addons] = await Promise.all([
        mgmtGet(`/v1/projects/${ref}`),
        mgmtGet(`/v1/projects/${ref}/billing/addons`),
    ]);

    const project = proj
        ? {
              name: proj.name ?? 'Projet Supabase',
              region: proj.region ?? '',
              status: proj.status ?? '',
              postgresVersion: proj.database?.version ?? null,
              createdAt: proj.created_at ?? null,
          }
        : null;

    const activeAddons: SupabaseLiveInfo['activeAddons'] = [];
    for (const a of addons?.selected_addons || []) {
        activeAddons.push({
            type: a.type ?? '',
            name: a.variant?.name || a.name || a.type || 'Addon',
            priceDescription: a.variant?.price?.description ?? null,
        });
    }

    return { project, activeAddons, tokenConfigured };
}
