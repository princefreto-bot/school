import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { PersonSummary, SourceRecord } from '../types';

function RecordCard({ record, onDone }: { record: SourceRecord; onDone: () => void }) {
    const [q, setQ] = useState('');
    const [results, setResults] = useState<PersonSummary[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (q.trim().length < 2) {
            setResults([]);
            return;
        }
        const timeout = setTimeout(() => {
            apiFetch(`/persons?q=${encodeURIComponent(q)}&limit=6`)
                .then((r) => r.json())
                .then((body) => setResults(body.persons || []))
                .catch(() => {});
        }, 250);
        return () => clearTimeout(timeout);
    }, [q]);

    const act = async (action: 'associate' | 'reject' | 'ignore', personId?: string) => {
        setBusy(true);
        setError(null);
        try {
            const res = await apiFetch(`/to-classify/${record.id}/${action}`, {
                method: 'POST',
                body: personId ? JSON.stringify({ personId }) : undefined,
            });
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || 'Erreur.');
            onDone();
        } catch (err: any) {
            setError(err.message);
            setBusy(false);
        }
    };

    const { extracted } = record.raw_data;
    const previewName = extracted.nom_complet || [extracted.prenom, extracted.nom].filter(Boolean).join(' ') || `Ligne ${(record.row_index ?? 0) + 1}`;

    return (
        <li className="to-classify-card">
            <div className="to-classify-card__header">
                <strong>{previewName}</strong>
                <span className="stub-page__note">{record.sources?.original_filename || record.sources?.name}</span>
            </div>
            <div className="to-classify-card__fields">
                {Object.entries(extracted).map(([key, value]) => (
                    <span key={key} className="to-classify-field">
                        <span className="to-classify-field__key">{key}</span> {value}
                    </span>
                ))}
                {Object.keys(extracted).length === 0 && (
                    <span className="stub-page__note">Aucun champ reconnu automatiquement — voir les données brutes du fichier.</span>
                )}
            </div>

            <div className="to-classify-actions">
                <div className="person-search">
                    <input
                        type="text"
                        placeholder="Rechercher une personne existante à associer…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        disabled={busy}
                    />
                    {results.length > 0 && (
                        <ul className="person-search__results">
                            {results.map((p) => (
                                <li key={p.id}>
                                    <button onClick={() => act('associate', p.id)} disabled={busy}>
                                        {p.display_name}
                                        <span className="stub-page__note"> — {p.origin_school_slug}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <button onClick={() => act('reject')} disabled={busy} className="btn-secondary">Rejeter</button>
                <button onClick={() => act('ignore')} disabled={busy} className="btn-secondary">Ignorer</button>
            </div>
            {error && <p className="sso-status--error">{error}</p>}
        </li>
    );
}

export default function AClasser() {
    const [records, setRecords] = useState<SourceRecord[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const load = () => {
        setLoading(true);
        apiFetch('/to-classify')
            .then((r) => r.json())
            .then((body) => {
                setRecords(body.records || []);
                setTotal(body.total || 0);
            })
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    return (
        <div className="a-classer-page">
            <h1>À classer</h1>
            <p className="stub-page__note">
                {total} ligne{total > 1 ? 's' : ''} importée{total > 1 ? 's' : ''} sans association fiable pour l'instant. Une
                nouvelle personne ne peut jamais être créée depuis ici — associe à une personne existante, ou rejette/ignore.
            </p>

            {loading ? (
                <p className="stub-page__note">Chargement…</p>
            ) : records.length === 0 ? (
                <p className="stub-page__note">Rien à classer — importe un fichier depuis la page Sources.</p>
            ) : (
                <ul className="to-classify-list">
                    {records.map((r) => (
                        <RecordCard key={r.id} record={r} onDone={load} />
                    ))}
                </ul>
            )}
        </div>
    );
}
