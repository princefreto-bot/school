import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { DocumentItem } from '../types';

export default function Documents() {
    const [items, setItems] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/documents')
            .then((r) => r.json())
            .then((body) => setItems(body.items || []))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="documents-page">
            <h1>Documents</h1>
            <p className="stub-page__note">Documents et images rattachés à un dossier personne, issus des imports PDF/image.</p>

            {loading ? (
                <p className="stub-page__note">Chargement…</p>
            ) : items.length === 0 ? (
                <p className="stub-page__note">Aucun document pour l'instant — importe un PDF ou une image depuis Sources, puis associe-le à une personne.</p>
            ) : (
                <table className="source-table">
                    <thead>
                        <tr>
                            <th>Fichier</th>
                            <th>Type</th>
                            <th>Personne</th>
                            <th>Ajouté le</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id}>
                                <td>
                                    {item.url ? (
                                        <a href={item.url} target="_blank" rel="noreferrer">
                                            {item.title || (item.kind === 'image' ? 'Image' : 'Document')}
                                        </a>
                                    ) : (
                                        item.title || (item.kind === 'image' ? 'Image' : 'Document')
                                    )}
                                </td>
                                <td>{item.kind === 'image' ? 'Image' : item.document_type || 'Document'}</td>
                                <td>{item.person ? <Link to={`/personnes/${item.person.id}`}>{item.person.display_name}</Link> : '—'}</td>
                                <td>{new Date(item.uploaded_at).toLocaleDateString('fr-FR')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
