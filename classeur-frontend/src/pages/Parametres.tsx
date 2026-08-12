import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { RelationshipType, RoleType } from '../types';

const CATEGORY_LABEL: Record<string, string> = { staff: 'Personnel', student: 'Élève', family: 'Famille', other: 'Autre' };

export default function Parametres() {
    const [bands, setBands] = useState({ strong: 90, to_verify: 70 });
    const [roleTypes, setRoleTypes] = useState<RoleType[]>([]);
    const [relationshipTypes, setRelationshipTypes] = useState<RelationshipType[]>([]);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [newRole, setNewRole] = useState({ code: '', label_fr: '', category: 'other' });
    const [newRelType, setNewRelType] = useState({ code: '', label_fr: '', inverse_code: '' });

    const load = () => {
        apiFetch('/settings')
            .then((r) => r.json())
            .then((body) => {
                if (body.settings?.confidence_bands) setBands(body.settings.confidence_bands);
                setRoleTypes(body.roleTypes || []);
                setRelationshipTypes(body.relationshipTypes || []);
            })
            .catch(() => {});
    };

    useEffect(load, []);

    const saveBands = async () => {
        setMessage(null);
        setError(null);
        try {
            const res = await apiFetch('/settings/confidence-bands', { method: 'PATCH', body: JSON.stringify(bands) });
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || 'Erreur.');
            setMessage('Seuils mis à jour.');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const addRoleType = async () => {
        setError(null);
        try {
            const res = await apiFetch('/settings/role-types', { method: 'POST', body: JSON.stringify(newRole) });
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || 'Erreur.');
            setNewRole({ code: '', label_fr: '', category: 'other' });
            load();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const addRelationshipType = async () => {
        setError(null);
        try {
            const res = await apiFetch('/settings/relationship-types', { method: 'POST', body: JSON.stringify(newRelType) });
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || 'Erreur.');
            setNewRelType({ code: '', label_fr: '', inverse_code: '' });
            load();
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="parametres-page">
            <h1>Paramètres</h1>
            {message && <p className="sync-message">{message}</p>}
            {error && <p className="sso-status--error">{error}</p>}

            <section>
                <h2>Bandes de confiance</h2>
                <div className="field-grid">
                    <label className="param-field">
                        Forte à partir de
                        <input
                            type="number"
                            value={bands.strong}
                            onChange={(e) => setBands({ ...bands, strong: Number(e.target.value) })}
                        />
                    </label>
                    <label className="param-field">
                        À vérifier à partir de
                        <input
                            type="number"
                            value={bands.to_verify}
                            onChange={(e) => setBands({ ...bands, to_verify: Number(e.target.value) })}
                        />
                    </label>
                </div>
                <button className="btn-primary" onClick={saveBands} style={{ marginTop: '0.75rem' }}>Enregistrer</button>
            </section>

            <section>
                <h2>Types de rôle</h2>
                <ul className="dossier-documents">
                    {roleTypes.map((rt) => (
                        <li key={rt.code}>{rt.label_fr} <span className="stub-page__note">({CATEGORY_LABEL[rt.category]})</span></li>
                    ))}
                </ul>
                <div className="add-relation-form">
                    <input placeholder="Code (ex: infirmier)" value={newRole.code} onChange={(e) => setNewRole({ ...newRole, code: e.target.value })} />
                    <input placeholder="Libellé (ex: Infirmier)" value={newRole.label_fr} onChange={(e) => setNewRole({ ...newRole, label_fr: e.target.value })} />
                    <select value={newRole.category} onChange={(e) => setNewRole({ ...newRole, category: e.target.value })}>
                        <option value="staff">Personnel</option>
                        <option value="student">Élève</option>
                        <option value="family">Famille</option>
                        <option value="other">Autre</option>
                    </select>
                    <button className="btn-secondary" onClick={addRoleType}>Ajouter un type de rôle</button>
                </div>
            </section>

            <section>
                <h2>Types de relation</h2>
                <ul className="dossier-documents">
                    {relationshipTypes.map((rt) => (
                        <li key={rt.code}>{rt.label_fr}</li>
                    ))}
                </ul>
                <div className="add-relation-form">
                    <input placeholder="Code (ex: PARRAIN_DE)" value={newRelType.code} onChange={(e) => setNewRelType({ ...newRelType, code: e.target.value })} />
                    <input placeholder="Libellé (ex: Parrain de)" value={newRelType.label_fr} onChange={(e) => setNewRelType({ ...newRelType, label_fr: e.target.value })} />
                    <input placeholder="Code inverse (optionnel)" value={newRelType.inverse_code} onChange={(e) => setNewRelType({ ...newRelType, inverse_code: e.target.value })} />
                    <button className="btn-secondary" onClick={addRelationshipType}>Ajouter un type de relation</button>
                </div>
            </section>
        </div>
    );
}
