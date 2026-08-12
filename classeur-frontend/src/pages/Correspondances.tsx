import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { Match } from '../types';

const BAND_LABEL: Record<string, string> = { strong: 'Forte', to_verify: 'À vérifier', weak: 'Faible' };

function MatchCard({ match, onDone }: { match: Match; onDone: () => void }) {
    const [showEvidence, setShowEvidence] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const act = async (action: 'confirm' | 'reject') => {
        setBusy(true);
        setError(null);
        try {
            const res = await apiFetch(`/matches/${match.id}/${action}`, { method: 'POST' });
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || 'Erreur.');
            onDone();
        } catch (err: any) {
            setError(err.message);
            setBusy(false);
        }
    };

    const extracted = match.source_record?.raw_data.extracted || {};
    const preview = extracted.nom_complet || [extracted.prenom, extracted.nom].filter(Boolean).join(' ') || 'Ligne importée';

    return (
        <li className="match-card">
            <div className="match-card__header">
                <div>
                    <strong>{preview}</strong>
                    <span className="stub-page__note"> — {match.source_record?.sources?.original_filename}</span>
                </div>
                <span className={`band-badge band-badge--${match.confidence_band}`}>
                    {BAND_LABEL[match.confidence_band]} · {match.score.toFixed(0)}%
                </span>
            </div>

            <p className="match-card__candidate">
                Candidat : {match.person ? (
                    <Link to={`/personnes/${match.person.id}`}>{match.person.display_name}</Link>
                ) : '—'}
                {match.person?.origin_school_slug && <span className="stub-page__note"> — {match.person.origin_school_slug}</span>}
            </p>

            <button className="link-button" onClick={() => setShowEvidence((v) => !v)}>
                {showEvidence ? 'Masquer les preuves' : 'Voir le détail du score'}
            </button>

            {showEvidence && (
                <table className="evidence-table">
                    <thead>
                        <tr>
                            <th>Champ</th>
                            <th>Valeur importée</th>
                            <th>Valeur du dossier</th>
                            <th>Score</th>
                            <th>Contribution</th>
                        </tr>
                    </thead>
                    <tbody>
                        {match.match_evidence.map((e, i) => (
                            <tr key={i} className={e.notes ? 'evidence-row--veto' : ''}>
                                <td>{e.field_name}</td>
                                <td>{e.source_value ?? '—'}</td>
                                <td>{e.person_value ?? '—'}</td>
                                <td>{(e.field_score * 100).toFixed(0)}%</td>
                                <td>{e.notes || e.contribution.toFixed(1)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <div className="to-classify-actions">
                <button className="btn-primary" onClick={() => act('confirm')} disabled={busy}>Confirmer</button>
                <button className="btn-secondary" onClick={() => act('reject')} disabled={busy}>Rejeter</button>
            </div>
            {error && <p className="sso-status--error">{error}</p>}
        </li>
    );
}

export default function Correspondances() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [band, setBand] = useState('');
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        const params = band ? `?band=${band}` : '';
        apiFetch(`/matches${params}`)
            .then((r) => r.json())
            .then((body) => setMatches(body.matches || []))
            .finally(() => setLoading(false));
    };

    useEffect(load, [band]);

    const handleRun = async () => {
        setRunning(true);
        setMessage(null);
        try {
            const res = await apiFetch('/matches/run', { method: 'POST' });
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || 'Erreur.');
            setMessage(`Corrélation terminée : ${body.recordsScored} ligne(s) analysée(s), ${body.matchesCreated} correspondance(s) trouvée(s).`);
            load();
        } catch (err: any) {
            setMessage(err.message);
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="correspondances-page">
            <div className="dashboard__header">
                <h1>Correspondances</h1>
                <button className="btn-primary" onClick={handleRun} disabled={running}>
                    {running ? 'Corrélation en cours…' : 'Lancer la corrélation'}
                </button>
            </div>
            {message && <p className="sync-message">{message}</p>}

            <div className="personnes-filters">
                <select value={band} onChange={(e) => setBand(e.target.value)}>
                    <option value="">Toutes les bandes</option>
                    <option value="strong">Forte (≥90%)</option>
                    <option value="to_verify">À vérifier (70-89%)</option>
                    <option value="weak">Faible (&lt;70%)</option>
                </select>
            </div>

            {loading ? (
                <p className="stub-page__note">Chargement…</p>
            ) : matches.length === 0 ? (
                <p className="stub-page__note">
                    Aucune correspondance en attente. Importe des fichiers depuis Sources, puis clique « Lancer la corrélation ».
                </p>
            ) : (
                <ul className="to-classify-list">
                    {matches.map((m) => (
                        <MatchCard key={m.id} match={m} onDone={load} />
                    ))}
                </ul>
            )}
        </div>
    );
}
