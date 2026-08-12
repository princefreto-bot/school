import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import ProbableBadge from '../components/ProbableBadge';
import { PersonDetail as PersonDetailType, PersonDocument, PersonImage, PersonLocationEntry, PersonSummary, Relation, RelationshipType, School } from '../types';

interface DossierResponse {
    person: PersonDetailType;
    live: Record<string, any> | null;
    school: School | null;
    documents: PersonDocument[];
    images: PersonImage[];
    relations: Relation[];
    locations: PersonLocationEntry[];
}

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
    if (value === undefined || value === null || value === '') return null;
    return (
        <div className="field">
            <span className="field__label">{label}</span>
            <span className="field__value">{value}</span>
        </div>
    );
}

function AddRelationForm({ personId, onDone }: { personId: string; onDone: () => void }) {
    const [mode, setMode] = useState<'existing' | 'new'>('existing');
    const [relationshipTypes, setRelationshipTypes] = useState<RelationshipType[]>([]);
    const [typeId, setTypeId] = useState('');
    const [q, setQ] = useState('');
    const [results, setResults] = useState<PersonSummary[]>([]);
    const [selectedPerson, setSelectedPerson] = useState<PersonSummary | null>(null);
    const [newName, setNewName] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        apiFetch('/relations/types')
            .then((r) => r.json())
            .then((body) => setRelationshipTypes(body.relationshipTypes || []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (mode !== 'existing' || q.trim().length < 2) {
            setResults([]);
            return;
        }
        const timeout = setTimeout(() => {
            apiFetch(`/persons?q=${encodeURIComponent(q)}&limit=6`)
                .then((r) => r.json())
                .then((body) => setResults((body.persons || []).filter((p: PersonSummary) => p.id !== personId)))
                .catch(() => {});
        }, 250);
        return () => clearTimeout(timeout);
    }, [q, mode, personId]);

    const submit = async () => {
        if (!typeId) return setError('Choisis un type de relation.');
        setBusy(true);
        setError(null);
        try {
            if (mode === 'existing') {
                if (!selectedPerson) return setError('Recherche et sélectionne une personne.');
                const res = await apiFetch('/relations', {
                    method: 'POST',
                    body: JSON.stringify({ personAId: personId, personBId: selectedPerson.id, relationshipTypeId: typeId }),
                });
                const body = await res.json();
                if (!res.ok) throw new Error(body.error || 'Erreur.');
            } else {
                if (!newName.trim()) return setError('Indique le nom de la nouvelle personne.');
                const res = await apiFetch('/relations/new-person', {
                    method: 'POST',
                    body: JSON.stringify({ displayName: newName.trim(), relatedPersonId: personId, relationshipTypeId: typeId }),
                });
                const body = await res.json();
                if (!res.ok) throw new Error(body.error || 'Erreur.');
            }
            setSelectedPerson(null);
            setQ('');
            setNewName('');
            onDone();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="add-relation-form">
            <div className="add-relation-form__tabs">
                <button className={mode === 'existing' ? 'tab-active' : ''} onClick={() => setMode('existing')}>Personne existante</button>
                <button className={mode === 'new' ? 'tab-active' : ''} onClick={() => setMode('new')}>Nouvelle personne</button>
            </div>

            {mode === 'existing' ? (
                <>
                    <p className="stub-page__note">Cette personne est…</p>
                    <select value={typeId} onChange={(e) => setTypeId(e.target.value)}>
                        <option value="">— type de relation —</option>
                        {relationshipTypes.map((t) => <option key={t.id} value={t.id}>{t.label_fr}</option>)}
                    </select>
                    <p className="stub-page__note">…de :</p>
                    <div className="person-search">
                        <input
                            type="text"
                            placeholder="Rechercher une personne…"
                            value={selectedPerson ? selectedPerson.display_name : q}
                            onChange={(e) => { setSelectedPerson(null); setQ(e.target.value); }}
                        />
                        {results.length > 0 && !selectedPerson && (
                            <ul className="person-search__results">
                                {results.map((p) => (
                                    <li key={p.id}>
                                        <button onClick={() => { setSelectedPerson(p); setResults([]); }}>{p.display_name}</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <p className="stub-page__note">Nouvelle personne :</p>
                    <input type="text" placeholder="Nom complet" value={newName} onChange={(e) => setNewName(e.target.value)} />
                    <p className="stub-page__note">…est, envers cette personne :</p>
                    <select value={typeId} onChange={(e) => setTypeId(e.target.value)}>
                        <option value="">— type de relation —</option>
                        {relationshipTypes.map((t) => <option key={t.id} value={t.id}>{t.label_fr}</option>)}
                    </select>
                </>
            )}

            <button className="btn-primary" onClick={submit} disabled={busy}>{busy ? 'Ajout…' : 'Ajouter la relation'}</button>
            {error && <p className="sso-status--error">{error}</p>}
        </div>
    );
}

export default function PersonDetail() {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<DossierResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showAddRelation, setShowAddRelation] = useState(false);

    const load = () => {
        if (!id) return;
        apiFetch(`/persons/${id}`)
            .then(async (r) => {
                const body = await r.json();
                if (!r.ok) throw new Error(body.error || 'Erreur de chargement');
                setData(body);
            })
            .catch((err) => setError(err.message));
    };

    useEffect(load, [id]);

    if (error) return <p className="sso-status--error">{error}</p>;
    if (!data) return <p className="stub-page__note">Chargement…</p>;

    const { person, live, school, documents, images, relations, locations } = data;
    const isStaff = person.origin_source_table === 'profiles';
    const roleLabels = Array.from(new Set(person.person_roles.map((r) => r.role_types?.label_fr).filter(Boolean)));
    const hasStaffRole = person.person_roles.some((r) => r.role_types?.category === 'staff');

    const removeRelation = async (relationId: string) => {
        if (!confirm('Supprimer cette relation ?')) return;
        await apiFetch(`/relations/${relationId}`, { method: 'DELETE' });
        load();
    };

    return (
        <div className="dossier">
            <Link to="/personnes" className="dossier__back">&larr; Retour aux personnes</Link>

            <header className="dossier__header">
                <span className="person-avatar person-avatar--lg">{initials(person.display_name)}</span>
                <div>
                    <h1>{person.display_name}</h1>
                    <p className="dossier__roles">{roleLabels.join(' • ') || 'Rôle non renseigné'}</p>
                </div>
            </header>

            <section>
                <h2>Identité</h2>
                <div className="field-grid">
                    <Field label="Nom complet" value={person.display_name} />
                    <Field label="Sexe" value={live?.sexe} />
                    <Field label="Date de naissance" value={live?.date_naissance} />
                    <Field label="Matricule" value={live?.matricule} />
                </div>
            </section>

            <section>
                <h2>Contact</h2>
                <div className="field-grid">
                    <Field label="Téléphone" value={live?.telephone || live?.telephone_parent} />
                    <Field label="Email" value={live?.email} />
                </div>
                {!live?.telephone && !live?.telephone_parent && !live?.email && (
                    <p className="stub-page__note">Aucune coordonnée renseignée dans DGhubschool pour l'instant.</p>
                )}
            </section>

            <section>
                <h2>Fonction / Activité</h2>
                <div className="field-grid">
                    <Field label="Établissement" value={school?.name} />
                    <Field label="Département" value={live?.departement} />
                    <Field label="Date d'embauche" value={live?.date_embauche} />
                </div>
            </section>

            {!isStaff && person.origin_source_table === 'students' && (
                <section>
                    <h2>Scolarité</h2>
                    <div className="field-grid">
                        <Field label="Classe" value={live?.classe} />
                        <Field label="Cycle" value={live?.cycle} />
                        <Field label="Statut" value={live?.status} />
                        <Field label="École de provenance" value={live?.ecole_provenance} />
                    </div>
                </section>
            )}

            <section>
                <h2>Relations</h2>
                {relations.length === 0 ? (
                    <p className="stub-page__note">Aucune relation renseignée pour l'instant.</p>
                ) : (
                    <ul className="dossier-documents">
                        {relations.map((r) => (
                            <li key={r.id}>
                                <strong>{r.label || '—'}</strong>{' '}
                                {r.otherPerson ? <Link to={`/personnes/${r.otherPerson.id}`}>{r.otherPerson.display_name}</Link> : '—'}
                                {r.status !== 'validated' && <ProbableBadge />}
                                <button className="link-button" onClick={() => removeRelation(r.id)} style={{ marginLeft: '0.5rem' }}>
                                    supprimer
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                <button className="link-button" onClick={() => setShowAddRelation((v) => !v)}>
                    {showAddRelation ? 'Annuler' : '+ Ajouter une relation'}
                </button>
                {showAddRelation && <AddRelationForm personId={person.id} onDone={() => { setShowAddRelation(false); load(); }} />}
            </section>

            <section>
                <h2>Documents &amp; images</h2>
                {documents.length === 0 && images.length === 0 ? (
                    <p className="stub-page__note">Aucun document importé pour l'instant.</p>
                ) : (
                    <>
                        {images.length > 0 && (
                            <div className="dossier-images">
                                {images.map((img) =>
                                    img.url ? (
                                        <a key={img.id} href={img.url} target="_blank" rel="noreferrer">
                                            <img src={img.url} alt="" className="dossier-image" />
                                        </a>
                                    ) : null
                                )}
                            </div>
                        )}
                        {documents.length > 0 && (
                            <ul className="dossier-documents">
                                {documents.map((doc) => (
                                    <li key={doc.id}>
                                        {doc.url ? (
                                            <a href={doc.url} target="_blank" rel="noreferrer">{doc.title || 'Document'}</a>
                                        ) : (
                                            <span>{doc.title || 'Document'}</span>
                                        )}
                                        <span className="stub-page__note"> — {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </section>

            {hasStaffRole && !person.is_minor && (
                <section>
                    <h2>Localisation</h2>
                    {locations.length === 0 ? (
                        <p className="stub-page__note">
                            Aucune zone connue pour l'instant — génère les zones professionnelles depuis la page Localisations.
                        </p>
                    ) : (
                        <ul className="dossier-documents">
                            {locations.map((loc) => (
                                <li key={loc.id}>
                                    {loc.relation_type === 'etablissement_travail' ? '📍 Zone professionnelle' : '📄 Zone trouvée dans un document'}
                                    {' — '}{loc.locations?.label || loc.locations?.address_text}
                                    {loc.status === 'probable' && <ProbableBadge score={loc.confidence ?? undefined} />}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}

            <section>
                <h2>Sources</h2>
                {person.origin_type === 'validated_relation' ? (
                    <p><span className="source-badge">Relation validée</span> — créée via une relation confirmée par un opérateur.</p>
                ) : (
                    <p>
                        <span className="source-badge">DGhubschool</span> — fiche {isStaff ? 'personnel/parent' : 'élève'} de{' '}
                        {school?.name || person.origin_school_slug}
                    </p>
                )}
            </section>

            <section>
                <h2>Historique</h2>
                <p className="stub-page__note">
                    Créé le {new Date(person.created_at).toLocaleDateString('fr-FR')}, dernière mise à jour le{' '}
                    {new Date(person.updated_at).toLocaleDateString('fr-FR')}.
                </p>
            </section>
        </div>
    );
}
