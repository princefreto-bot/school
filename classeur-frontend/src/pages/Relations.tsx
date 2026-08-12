import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { GlobalRelation } from '../types';

export default function Relations() {
    const [relations, setRelations] = useState<GlobalRelation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/relations')
            .then((r) => r.json())
            .then((body) => setRelations(body.relations || []))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="relations-page">
            <h1>Relations</h1>
            <p className="stub-page__note">
                Toutes les relations validées entre personnes. Pour en ajouter une, ouvre le dossier d'une personne.
            </p>

            {loading ? (
                <p className="stub-page__note">Chargement…</p>
            ) : relations.length === 0 ? (
                <p className="stub-page__note">Aucune relation pour l'instant.</p>
            ) : (
                <ul className="dossier-documents">
                    {relations.map((r) => (
                        <li key={r.id}>
                            {r.person_a ? <Link to={`/personnes/${r.person_a.id}`}>{r.person_a.display_name}</Link> : '—'}
                            {' '}<strong>{r.relationship_types?.label_fr}</strong>{' '}
                            {r.person_b ? <Link to={`/personnes/${r.person_b.id}`}>{r.person_b.display_name}</Link> : '—'}
                            <span className="stub-page__note"> — {new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
