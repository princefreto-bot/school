import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { PersonDetail as PersonDetailType, PersonDocument, PersonImage, School } from '../types';

interface DossierResponse {
    person: PersonDetailType;
    live: Record<string, any> | null;
    school: School | null;
    documents: PersonDocument[];
    images: PersonImage[];
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

export default function PersonDetail() {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<DossierResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        apiFetch(`/persons/${id}`)
            .then(async (r) => {
                const body = await r.json();
                if (!r.ok) throw new Error(body.error || 'Erreur de chargement');
                setData(body);
            })
            .catch((err) => setError(err.message));
    }, [id]);

    if (error) return <p className="sso-status--error">{error}</p>;
    if (!data) return <p className="stub-page__note">Chargement…</p>;

    const { person, live, school, documents, images } = data;
    const isStaff = person.origin_source_table === 'profiles';
    const roleLabels = Array.from(new Set(person.person_roles.map((r) => r.role_types?.label_fr).filter(Boolean)));

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

            {!isStaff && (
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
                <p className="stub-page__note">Aucune relation renseignée pour l'instant (arrive avec la corrélation, phase M5).</p>
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

            {person.is_minor ? null : (
                <section>
                    <h2>Localisation</h2>
                    <p className="stub-page__note">
                        Aucune zone probable calculée pour l'instant (arrive en phase M5, réservée au personnel).
                    </p>
                </section>
            )}

            <section>
                <h2>Sources</h2>
                <p>
                    <span className="source-badge">DGhubschool</span> — fiche {isStaff ? 'personnel/parent' : 'élève'} de{' '}
                    {school?.name || person.origin_school_slug}
                </p>
            </section>

            <section>
                <h2>Historique</h2>
                <p className="stub-page__note">
                    Créé le {new Date(person.created_at).toLocaleDateString('fr-FR')}, dernière synchronisation le{' '}
                    {new Date(person.updated_at).toLocaleDateString('fr-FR')}.
                </p>
            </section>
        </div>
    );
}
