import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { DuplicateCandidate } from '../types';

function Card({ dup, onDone }: { dup: DuplicateCandidate; onDone: () => void }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isSibling = dup.candidate_type === 'sibling';

    const reject = async () => {
        setBusy(true);
        setError(null);
        try {
            const res = await apiFetch(`/duplicates/${dup.id}/reject`, { method: 'POST' });
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || 'Erreur.');
            onDone();
        } catch (err: any) {
            setError(err.message);
            setBusy(false);
        }
    };

    const merge = async (survivorId: string) => {
        if (!confirm('Fusionner ces deux fiches ? Cette action réassigne tout le contenu vers la fiche conservée — la seconde sera archivée, pas supprimée.')) return;
        setBusy(true);
        setError(null);
        try {
            const res = await apiFetch(`/duplicates/${dup.id}/merge`, { method: 'POST', body: JSON.stringify({ survivorId }) });
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || 'Erreur.');
            onDone();
        } catch (err: any) {
            setError(err.message);
            setBusy(false);
        }
    };

    return (
        <li className="match-card">
            <div className="match-card__header">
                <strong>{isSibling ? 'Fratrie possible' : 'Doublon potentiel'}</strong>
                <span className={`band-badge band-badge--${isSibling ? 'to_verify' : 'strong'}`}>{dup.score.toFixed(0)}%</span>
            </div>

            {isSibling && (
                <p className="stub-page__note">
                    Même nom de famille, même téléphone parent — probablement deux personnes distinctes de la même
                    famille, pas un doublon. Ouvre les deux dossiers pour créer une relation « Frère de » / « Sœur de »
                    si c'est confirmé.
                </p>
            )}

            <div className="duplicate-compare">
                <div className="duplicate-compare__person">
                    <Link to={`/personnes/${dup.person_a.id}`}>{dup.person_a.display_name}</Link>
                    <span className="stub-page__note"> — {dup.person_a.origin_school_slug}</span>
                    {!isSibling && (
                        <button className="btn-secondary" onClick={() => merge(dup.person_a.id)} disabled={busy}>
                            Conserver celle-ci
                        </button>
                    )}
                </div>
                <div className="duplicate-compare__person">
                    <Link to={`/personnes/${dup.person_b.id}`}>{dup.person_b.display_name}</Link>
                    <span className="stub-page__note"> — {dup.person_b.origin_school_slug}</span>
                    {!isSibling && (
                        <button className="btn-secondary" onClick={() => merge(dup.person_b.id)} disabled={busy}>
                            Conserver celle-ci
                        </button>
                    )}
                </div>
            </div>
            <button className="btn-secondary" onClick={reject} disabled={busy}>
                {isSibling ? "Ce n'est pas une fratrie" : 'Ce ne sont pas des doublons'}
            </button>
            {error && <p className="sso-status--error">{error}</p>}
        </li>
    );
}

export default function Doublons() {
    const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        const params = filter ? `?type=${filter}` : '';
        apiFetch(`/duplicates${params}`)
            .then((r) => r.json())
            .then((body) => setDuplicates(body.duplicates || []))
            .finally(() => setLoading(false));
    };

    useEffect(load, [filter]);

    const handleRun = async () => {
        setRunning(true);
        setMessage(null);
        try {
            const res = await apiFetch('/duplicates/run', { method: 'POST' });
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || 'Erreur.');
            setMessage(
                `Détection terminée : ${body.duplicates.candidatesFlagged} doublon(s) potentiel(s), ` +
                    `${body.siblings.candidatesFlagged} fratrie(s) possible(s).`
            );
            load();
        } catch (err: any) {
            setMessage(err.message);
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="doublons-page">
            <div className="dashboard__header">
                <h1>Doublons</h1>
                <button className="btn-primary" onClick={handleRun} disabled={running}>
                    {running ? 'Détection en cours…' : 'Détecter les doublons et fratries'}
                </button>
            </div>
            {message && <p className="sync-message">{message}</p>}

            <div className="personnes-filters">
                <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="">Tout</option>
                    <option value="duplicate">Doublons potentiels</option>
                    <option value="sibling">Fratries possibles</option>
                </select>
            </div>

            {loading ? (
                <p className="stub-page__note">Chargement…</p>
            ) : duplicates.length === 0 ? (
                <p className="stub-page__note">Rien à examiner pour l'instant.</p>
            ) : (
                <ul className="to-classify-list">
                    {duplicates.map((d) => (
                        <Card key={d.id} dup={d} onDone={load} />
                    ))}
                </ul>
            )}
        </div>
    );
}
