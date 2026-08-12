import { useEffect, useRef, useState } from 'react';
import { apiFetch, apiUpload } from '../lib/api';
import { Source } from '../types';

const STATUS_LABEL: Record<string, string> = {
    pending: 'En attente',
    processing: 'En cours',
    processed: 'Traité',
    failed: 'Échec',
};

export default function Sources() {
    const [sources, setSources] = useState<Source[]>([]);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);

    const loadSources = () => {
        apiFetch('/sources')
            .then((r) => r.json())
            .then((body) => setSources(body.sources || []))
            .catch(() => {});
    };

    useEffect(loadSources, []);

    const handleUpload = async () => {
        const file = fileInput.current?.files?.[0];
        if (!file) {
            setError('Choisis un fichier (.xlsx, .xls, .csv ou .json) avant de lancer l\'import.');
            return;
        }
        setUploading(true);
        setError(null);
        setMessage(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await apiUpload('/sources', formData);
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || "Erreur lors de l'import.");
            setMessage(`${file.name} importé : ${body.rowCount} ligne(s) ajoutée(s) à la file « À classer ».`);
            if (fileInput.current) fileInput.current.value = '';
            loadSources();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="sources-page">
            <h1>Sources</h1>
            <p className="stub-page__note">
                Choisis un fichier Excel, CSV ou JSON à importer. Rien n'est scanné automatiquement — c'est toi qui sélectionnes
                chaque fichier. Le PDF et l'image (OCR) arrivent dans une phase ultérieure.
            </p>

            <div className="upload-box">
                <input ref={fileInput} type="file" accept=".xlsx,.xls,.csv,.json" />
                <button className="btn-primary" onClick={handleUpload} disabled={uploading}>
                    {uploading ? 'Import en cours…' : 'Importer'}
                </button>
            </div>

            {error && <p className="sso-status--error">{error}</p>}
            {message && <p className="sync-message">{message}</p>}

            <table className="source-table">
                <thead>
                    <tr>
                        <th>Fichier</th>
                        <th>Type</th>
                        <th>Statut</th>
                        <th>Lignes</th>
                        <th>Importé le</th>
                    </tr>
                </thead>
                <tbody>
                    {sources.map((s) => (
                        <tr key={s.id}>
                            <td>{s.original_filename || s.name}</td>
                            <td>{s.source_type.replace('import_', '').replace('dghubschool_live', 'Synchro DGhubschool')}</td>
                            <td>
                                <span className={`status-pill status-pill--${s.status}`}>{STATUS_LABEL[s.status] || s.status}</span>
                            </td>
                            <td>{s.row_count ?? '—'}</td>
                            <td>{new Date(s.imported_at).toLocaleString('fr-FR')}</td>
                        </tr>
                    ))}
                    {sources.length === 0 && (
                        <tr>
                            <td colSpan={5} className="stub-page__note">Aucune source pour l'instant.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
