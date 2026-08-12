import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { DuplicateCandidate } from '../types';

function Card({ dup, onDone }: { dup: DuplicateCandidate; onDone: () => void }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                <strong>Doublon potentiel</strong>
                <span className="band-badge band-badge--strong">{dup.score.toFixed(0)}%</span>
            </div>
            <div className="duplicate-compare">
                <div className="duplicate-compare__person">
                    <Link to={`/personnes/${dup.person_a.id}`}>{dup.person_a.display_name}</Link>
                    <span className="stub-page__note"> — {dup.person_a.origin_school_slug}</span>
                    <button className="btn-secondary" onClick={() => merge(dup.person_a.id)} disabled={busy}>
                        Conserver celle-ci
                    </button>
                </div>
                <div className="duplicate-compare__person">
                    <Link to={`/personnes/${dup.person_b.id}`}>{dup.person_b.display_name}</Link>
                    <span className="stub-page__note"> — {dup.person_b.origin_school_slug}</span>
                    <button className="btn-secondary" onClick={() => merge(dup.person_b.id)} disabled={busy}>
                        Conserver celle-ci
                    </button>
                </div>
            </div>
            <button className="btn-secondary" onClick={reject} disabled={busy}>Ce ne sont pas des doublons</button>
            {error && <p className="sso-status--error">{error}</p>}
        </li>
    );
}

export default function Doublons() {
    const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        apiFetch('/duplicates')
            .then((r) => r.json())
            .then((body) => setDuplicates(body.duplicates || []))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleRun = async () => {
        setRunning(true);
        setMessage(null);
        try {
            const res = await apiFetch('/duplicates/run', { method: 'POST' });
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || 'Erreur.');
            setMessage(`Détection terminée : ${body.pairsScored} paire(s) analysée(s), ${body.candidatesFlagged} doublon(s) potentiel(s).`);
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
                    {running ? 'Détection en cours…' : 'Détecter les doublons'}
                </button>
            </div>
            {message && <p className="sync-message">{message}</p>}

            {loading ? (
                <p className="stub-page__note">Chargement…</p>
            ) : duplicates.length === 0 ? (
                <p className="stub-page__note">Aucun doublon potentiel détecté pour l'instant.</p>
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
