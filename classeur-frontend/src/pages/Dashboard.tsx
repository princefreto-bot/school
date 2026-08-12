import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { DashboardStats } from '../types';

function StatCard({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="stat-card">
            <span className="stat-card__value">{value}</span>
            <span className="stat-card__label">{label}</span>
        </div>
    );
}

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadStats = () => {
        apiFetch('/dashboard')
            .then(async (r) => {
                const body = await r.json();
                if (!r.ok) throw new Error(body.error || 'Erreur de chargement');
                setStats(body);
            })
            .catch((err) => setError(err.message));
    };

    useEffect(loadStats, []);

    const handleSync = async () => {
        setSyncing(true);
        setSyncMessage(null);
        setError(null);
        try {
            const res = await apiFetch('/sync/dghubschool', { method: 'POST' });
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || 'Erreur de synchronisation');
            setSyncMessage(`Synchronisation terminée : ${body.totalPersons} personnes traitées sur ${body.results.length} établissement(s).`);
            loadStats();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="dashboard">
            <div className="dashboard__header">
                <h1>Tableau de bord</h1>
                <button className="btn-primary" onClick={handleSync} disabled={syncing}>
                    {syncing ? 'Synchronisation…' : 'Synchroniser DGhubschool'}
                </button>
            </div>

            {error && <p className="sso-status--error">{error}</p>}
            {syncMessage && <p className="sync-message">{syncMessage}</p>}

            {stats ? (
                <>
                    <div className="stat-grid">
                        <StatCard label="Personnes" value={stats.totalPersons} />
                        <StatCard label="Élèves" value={stats.totalEleves} />
                        <StatCard label="Personnel & parents" value={stats.totalPersonnel} />
                        <StatCard label="Sources" value={stats.totalSources} />
                    </div>
                    <div className="stat-grid stat-grid--muted">
                        <StatCard label="Correspondances fortes" value={stats.matchesStrong} />
                        <StatCard label="À vérifier" value={stats.matchesToVerify} />
                        <StatCard label="À classer" value={stats.toClassify} />
                        <StatCard label="Doublons potentiels" value={stats.duplicateCandidates} />
                    </div>
                    <p className="stub-page__note">
                        Dernière synchronisation :{' '}
                        {stats.lastSyncAt ? new Date(stats.lastSyncAt).toLocaleString('fr-FR') : 'jamais — clique sur « Synchroniser »'}
                    </p>
                </>
            ) : (
                <p className="stub-page__note">Chargement…</p>
            )}
        </div>
    );
}
