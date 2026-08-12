import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { PersonSummary, School } from '../types';

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

function roleLabel(person: PersonSummary): string {
    const labels = Array.from(new Set(person.person_roles.map((r) => r.role_types?.label_fr).filter(Boolean)));
    return labels.join(' • ') || '—';
}

export default function Personnes() {
    const [persons, setPersons] = useState<PersonSummary[]>([]);
    const [total, setTotal] = useState(0);
    const [schools, setSchools] = useState<School[]>([]);
    const [q, setQ] = useState('');
    const [school, setSchool] = useState('');
    const [type, setType] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        apiFetch('/schools')
            .then((r) => r.json())
            .then((body) => setSchools(body.schools || []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams();
            if (q) params.set('q', q);
            if (school) params.set('school', school);
            if (type) params.set('type', type);

            apiFetch(`/persons?${params.toString()}`)
                .then(async (r) => {
                    const body = await r.json();
                    if (!r.ok) throw new Error(body.error || 'Erreur de chargement');
                    setPersons(body.persons || []);
                    setTotal(body.total || 0);
                })
                .catch((err) => setError(err.message))
                .finally(() => setLoading(false));
        }, 250);
        return () => clearTimeout(timeout);
    }, [q, school, type]);

    const schoolNameBySlug = useMemo(() => Object.fromEntries(schools.map((s) => [s.slug, s.name])), [schools]);

    return (
        <div className="personnes-page">
            <h1>Personnes</h1>
            <p className="stub-page__note">{total} personne{total > 1 ? 's' : ''} — synchronisées depuis DGhubschool.</p>

            <div className="personnes-filters">
                <input
                    type="text"
                    placeholder="Rechercher un nom…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="personnes-search"
                />
                <select value={school} onChange={(e) => setSchool(e.target.value)}>
                    <option value="">Tous les établissements</option>
                    {schools.map((s) => (
                        <option key={s.slug} value={s.slug}>{s.name}</option>
                    ))}
                </select>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="">Tous les types</option>
                    <option value="eleves">Élèves</option>
                    <option value="personnel">Personnel &amp; parents</option>
                </select>
            </div>

            {error && <p className="sso-status--error">{error}</p>}
            {loading ? (
                <p className="stub-page__note">Chargement…</p>
            ) : persons.length === 0 ? (
                <p className="stub-page__note">Aucune personne trouvée. Lance une synchronisation depuis le tableau de bord si c'est la première visite.</p>
            ) : (
                <ul className="person-list">
                    {persons.map((p) => (
                        <li key={p.id}>
                            <Link to={`/personnes/${p.id}`} className="person-card">
                                <span className="person-avatar">{initials(p.display_name)}</span>
                                <span className="person-card__info">
                                    <span className="person-card__name">{p.display_name}</span>
                                    <span className="person-card__role">{roleLabel(p)}</span>
                                    {p.origin_school_slug && (
                                        <span className="person-card__school">{schoolNameBySlug[p.origin_school_slug] || p.origin_school_slug}</span>
                                    )}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
