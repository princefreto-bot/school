import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { HistoryEntry } from '../types';

const ACTION_LABEL: Record<string, string> = {
    import: 'Import',
    extraction: 'Extraction',
    correlation: 'Corrélation',
    association: 'Association',
    validation: 'Validation',
    rejection: 'Rejet',
    merge: 'Fusion',
    modification: 'Modification',
    deletion: 'Suppression',
    login: 'Connexion',
    export: 'Export',
};

export default function Historique() {
    const [entries, setEntries] = useState<HistoryEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    const LIMIT = 40;

    const load = (newOffset: number) => {
        setLoading(true);
        apiFetch(`/history?limit=${LIMIT}&offset=${newOffset}`)
            .then((r) => r.json())
            .then((body) => {
                setEntries((prev) => (newOffset === 0 ? body.entries || [] : [...prev, ...(body.entries || [])]));
                setTotal(body.total || 0);
                setOffset(newOffset);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => load(0), []);

    return (
        <div className="historique-page">
            <h1>Historique</h1>
            <p className="stub-page__note">{total} action{total > 1 ? 's' : ''} enregistrée{total > 1 ? 's' : ''}.</p>

            <ul className="dossier-documents">
                {entries.map((e) => (
                    <li key={e.id}>
                        <strong>{ACTION_LABEL[e.action] || e.action}</strong>
                        {e.entity_type && <span className="stub-page__note"> — {e.entity_type}</span>}
                        {e.actor_name && <span className="stub-page__note"> · par {e.actor_name}</span>}
                        <span className="stub-page__note"> · {new Date(e.created_at).toLocaleString('fr-FR')}</span>
                    </li>
                ))}
            </ul>

            {loading ? (
                <p className="stub-page__note">Chargement…</p>
            ) : (
                entries.length < total && (
                    <button className="btn-secondary" onClick={() => load(offset + LIMIT)}>Voir plus</button>
                )
            )}
        </div>
    );
}
