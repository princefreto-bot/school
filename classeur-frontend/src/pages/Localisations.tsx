import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import ProbableBadge from '../components/ProbableBadge';
import { LocationListEntry } from '../types';

export default function Localisations() {
    const [locations, setLocations] = useState<LocationListEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        apiFetch('/locations')
            .then((r) => r.json())
            .then((body) => setLocations(body.locations || []))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleGenerate = async () => {
        setGenerating(true);
        setMessage(null);
        try {
            const res = await apiFetch('/locations/generate-staff', { method: 'POST' });
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || 'Erreur.');
            setMessage(`${body.locationsCreated} établissement(s), ${body.linksCreated} rattachement(s) créé(s).`);
            load();
        } catch (err: any) {
            setMessage(err.message);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="localisations-page">
            <div className="dashboard__header">
                <h1>Localisations</h1>
                <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
                    {generating ? 'Génération…' : 'Générer les zones professionnelles'}
                </button>
            </div>
            <p className="stub-page__note">
                Réservé au personnel adulte — jamais aux élèves (garde-fou appliqué en base de données, pas seulement ici).
                Une "zone probable" n'est jamais une position actuelle certaine.
            </p>
            {message && <p className="sync-message">{message}</p>}

            {loading ? (
                <p className="stub-page__note">Chargement…</p>
            ) : locations.length === 0 ? (
                <p className="stub-page__note">Aucune localisation pour l'instant.</p>
            ) : (
                <table className="source-table">
                    <thead>
                        <tr>
                            <th>Personne</th>
                            <th>Type</th>
                            <th>Zone</th>
                            <th>Confiance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {locations.map((loc) => (
                            <tr key={loc.id}>
                                <td>{loc.person ? <Link to={`/personnes/${loc.person.id}`}>{loc.person.display_name}</Link> : '—'}</td>
                                <td>{loc.relation_type === 'etablissement_travail' ? 'Zone professionnelle' : 'Zone trouvée dans un document'}</td>
                                <td>{loc.locations?.label || loc.locations?.address_text || '—'}</td>
                                <td>{loc.status === 'confirmed' ? 'Confirmée' : <ProbableBadge score={loc.confidence ?? undefined} />}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
