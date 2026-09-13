import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';
import { InfraOverview, InfraSubscription, UsageSnapshotPoint } from '../types';

const MB = 1024 * 1024;
const GB = MB * 1024;

function formatBytes(b: number | null | undefined): string {
    if (b == null) return '—';
    if (b >= GB) return `${(b / GB).toFixed(2)} Go`;
    if (b >= MB) return `${(b / MB).toFixed(1)} Mo`;
    if (b >= 1024) return `${(b / 1024).toFixed(0)} Ko`;
    return `${b} o`;
}

function formatBytesSigned(b: number | null | undefined): string {
    if (b == null) return '—';
    const sign = b > 0 ? '+' : '';
    return sign + formatBytes(Math.abs(b)).replace(/^/, b < 0 ? '-' : '');
}

const EMPTY_FORM = {
    id: 0,
    provider: 'supabase',
    label: '',
    monthly_cost: '',
    currency: 'USD',
    billing_cycle: 'monthly',
    renewal_date: '',
    quota_label: '',
    quota_limit_mb: '',
    notes: '',
    is_active: true,
};

// Graphique de progression (SVG inline, aucune dépendance)
function GrowthChart({ points }: { points: UsageSnapshotPoint[] }) {
    if (points.length < 2) {
        return <p className="stub-page__note">Le graphique de progression apparaîtra après quelques jours de mesures (un point par jour).</p>;
    }
    const W = 720;
    const H = 200;
    const P = 32;
    const xs = points.map((p) => new Date(p.captured_on).getTime());
    const ys = points.map((p) => p.db_size_bytes);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = 0, maxY = Math.max(...ys) * 1.1 || 1;
    const sx = (x: number) => P + ((x - minX) / (maxX - minX || 1)) * (W - 2 * P);
    const sy = (y: number) => H - P - ((y - minY) / (maxY - minY || 1)) * (H - 2 * P);
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(xs[i]).toFixed(1)} ${sy(ys[i]).toFixed(1)}`).join(' ');
    const area = `${line} L ${sx(maxX).toFixed(1)} ${(H - P).toFixed(1)} L ${sx(minX).toFixed(1)} ${(H - P).toFixed(1)} Z`;
    const first = points[0], last = points[points.length - 1];
    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label="Progression de la taille de la base">
            <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="#d1d5db" strokeWidth="1" />
            <line x1={P} y1={P} x2={P} y2={H - P} stroke="#d1d5db" strokeWidth="1" />
            <path d={area} fill="#6366f11a" />
            <path d={line} fill="none" stroke="#6366f1" strokeWidth="2" />
            <text x={P} y={P - 10} fontSize="11" fill="#6b7280">{formatBytes(maxY)}</text>
            <text x={P} y={H - 8} fontSize="10" fill="#6b7280">{new Date(first.captured_on).toLocaleDateString('fr-FR')}</text>
            <text x={W - P} y={H - 8} fontSize="10" fill="#6b7280" textAnchor="end">{new Date(last.captured_on).toLocaleDateString('fr-FR')}</text>
        </svg>
    );
}

export default function Infrastructure() {
    const [data, setData] = useState<InfraOverview | null>(null);
    const [history, setHistory] = useState<UsageSnapshotPoint[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const load = () => {
        apiFetch('/infrastructure')
            .then(async (r) => {
                const body = await r.json();
                if (!r.ok) throw new Error(body.error || 'Erreur de chargement');
                setData(body);
            })
            .catch((err) => setError(err.message));
        apiFetch('/infrastructure/history?days=90')
            .then(async (r) => {
                const body = await r.json();
                if (r.ok) setHistory(body.snapshots || []);
            })
            .catch(() => {});
    };

    useEffect(load, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        setError(null);
        try {
            const res = await apiFetch('/infrastructure/snapshot', { method: 'POST' });
            if (!res.ok) throw new Error((await res.json()).error || 'Erreur');
            load();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setRefreshing(false);
        }
    };

    const startEdit = (s: InfraSubscription) => {
        setForm({
            id: s.id,
            provider: s.provider,
            label: s.label,
            monthly_cost: s.monthly_cost != null ? String(s.monthly_cost) : '',
            currency: s.currency,
            billing_cycle: s.billing_cycle,
            renewal_date: s.renewal_date || '',
            quota_label: s.quota_label || '',
            quota_limit_mb: s.quota_limit_mb != null ? String(s.quota_limit_mb) : '',
            notes: s.notes || '',
            is_active: s.is_active,
        });
        setEditing(true);
    };

    const cancelEdit = () => {
        setForm(EMPTY_FORM);
        setEditing(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.label.trim()) {
            setError('Le libellé est requis.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const path = editing ? `/infrastructure/subscriptions/${form.id}` : '/infrastructure/subscriptions';
            const method = editing ? 'PUT' : 'POST';
            const res = await apiFetch(path, { method, body: JSON.stringify(form) });
            if (!res.ok) throw new Error((await res.json()).error || 'Erreur');
            cancelEdit();
            load();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Supprimer cet abonnement du suivi ?')) return;
        try {
            const res = await apiFetch(`/infrastructure/subscriptions/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error((await res.json()).error || 'Erreur');
            load();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const costSummary = useMemo(() => {
        if (!data) return '—';
        const parts = Object.entries(data.monthlyCostByCurrency).map(([cur, amt]) => `${amt.toFixed(2)} ${cur}`);
        return parts.length ? parts.join(' + ') + ' / mois' : 'Aucun coût saisi';
    }, [data]);

    if (error && !data) return <div className="dashboard"><p className="sso-status--error">{error}</p></div>;
    if (!data) return <div className="dashboard"><p className="stub-page__note">Chargement…</p></div>;

    return (
        <div className="dashboard">
            <div className="dashboard__header">
                <h1>Infrastructure &amp; abonnements</h1>
                <button className="btn-primary" onClick={handleRefresh} disabled={refreshing}>
                    {refreshing ? 'Mesure…' : 'Rafraîchir la mesure'}
                </button>
            </div>

            {error && <p className="sso-status--error">{error}</p>}

            {/* Alertes */}
            {data.alerts.length > 0 && (
                <div className="infra-alerts">
                    {data.alerts.map((a, i) => (
                        <div key={i} className={`infra-alert infra-alert--${a.level}`}>{a.message}</div>
                    ))}
                </div>
            )}

            {/* Indicateurs clés */}
            <div className="stat-grid">
                <div className="stat-card"><span className="stat-card__value">{formatBytes(data.currentBytes)}</span><span className="stat-card__label">Taille base de données</span></div>
                <div className="stat-card"><span className="stat-card__value">{formatBytesSigned(data.growth30dBytes)}</span><span className="stat-card__label">Sur 30 jours</span></div>
                <div className="stat-card"><span className="stat-card__value">{formatBytes(data.dailyGrowthBytes)}<span style={{ fontSize: '0.5em' }}>/j</span></span><span className="stat-card__label">Croissance moyenne / jour</span></div>
                <div className="stat-card"><span className="stat-card__value">{costSummary}</span><span className="stat-card__label">Coût mensuel suivi</span></div>
            </div>

            {/* Graphique de progression */}
            <section className="infra-section">
                <h2>Progression de la base ({data.snapshotCount} mesure{data.snapshotCount > 1 ? 's' : ''})</h2>
                <GrowthChart points={history} />
            </section>

            {/* Projections */}
            {data.projections.length > 0 && (
                <section className="infra-section">
                    <h2>Projection — quand la limite sera atteinte</h2>
                    <table className="source-table">
                        <thead><tr><th>Offre</th><th>Usage</th><th>Limite atteinte dans</th><th>Date estimée</th></tr></thead>
                        <tbody>
                            {data.projections.map((p) => (
                                <tr key={p.subscriptionId}>
                                    <td>{p.label}</td>
                                    <td>{p.usagePct.toFixed(1)}% de {p.quotaLimitMb >= 1024 ? (p.quotaLimitMb / 1024).toFixed(0) + ' Go' : p.quotaLimitMb + ' Mo'}</td>
                                    <td>{p.daysToLimit != null ? `~${p.daysToLimit} jours` : 'Croissance nulle/insuffisante'}</td>
                                    <td>{p.limitDate ? new Date(p.limitDate).toLocaleDateString('fr-FR') : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="stub-page__note">Estimation au rythme de croissance moyen actuel — plus il y a de jours de mesures, plus elle est fiable.</p>
                </section>
            )}

            {/* Supabase live */}
            {data.supabaseLive.project && (
                <section className="infra-section">
                    <h2>Supabase — projet (live)</h2>
                    <div className="field-grid">
                        <div className="field"><span className="field__label">Projet</span><span className="field__value">{data.supabaseLive.project.name}</span></div>
                        <div className="field"><span className="field__label">Région</span><span className="field__value">{data.supabaseLive.project.region}</span></div>
                        <div className="field"><span className="field__label">Statut</span><span className="field__value">{data.supabaseLive.project.status}</span></div>
                        <div className="field"><span className="field__label">PostgreSQL</span><span className="field__value">{data.supabaseLive.project.postgresVersion || '—'}</span></div>
                    </div>
                    {data.supabaseLive.activeAddons.length > 0 ? (
                        <div style={{ marginTop: 12 }}>
                            <strong>Addons payants activés :</strong>
                            <ul>{data.supabaseLive.activeAddons.map((a, i) => <li key={i}>{a.name}{a.priceDescription ? ` — ${a.priceDescription}` : ''}</li>)}</ul>
                        </div>
                    ) : (
                        <p className="stub-page__note">Aucun addon payant activé côté Supabase.</p>
                    )}
                </section>
            )}

            {/* Tables les plus volumineuses */}
            <section className="infra-section">
                <h2>Tables les plus volumineuses</h2>
                <table className="source-table">
                    <thead><tr><th>Schéma</th><th>Table</th><th>Taille</th></tr></thead>
                    <tbody>
                        {data.topTables.slice(0, 10).map((t, i) => (
                            <tr key={i}><td>{t.schema}</td><td>{t.table}</td><td>{formatBytes(t.bytes)}</td></tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* Abonnements */}
            <section className="infra-section">
                <div className="dashboard__header">
                    <h2>Abonnements suivis</h2>
                    {!editing && <button className="btn-secondary" onClick={() => { setForm(EMPTY_FORM); setEditing(false); setForm({ ...EMPTY_FORM }); }}>Nouvel abonnement</button>}
                </div>

                <form className="infra-form" onSubmit={handleSave}>
                    <div className="field-grid">
                        <label className="param-field"><span>Fournisseur</span>
                            <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
                                <option value="supabase">Supabase</option>
                                <option value="render">Render</option>
                                <option value="autre">Autre</option>
                            </select>
                        </label>
                        <label className="param-field"><span>Libellé *</span>
                            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Ex : Supabase Pro" />
                        </label>
                        <label className="param-field"><span>Coût</span>
                            <input type="number" step="0.01" value={form.monthly_cost} onChange={(e) => setForm({ ...form, monthly_cost: e.target.value })} placeholder="25" />
                        </label>
                        <label className="param-field"><span>Devise</span>
                            <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="USD" />
                        </label>
                        <label className="param-field"><span>Cycle</span>
                            <select value={form.billing_cycle} onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })}>
                                <option value="monthly">Mensuel</option>
                                <option value="yearly">Annuel</option>
                            </select>
                        </label>
                        <label className="param-field"><span>Renouvellement</span>
                            <input type="date" value={form.renewal_date} onChange={(e) => setForm({ ...form, renewal_date: e.target.value })} />
                        </label>
                        <label className="param-field"><span>Quota (texte)</span>
                            <input value={form.quota_label} onChange={(e) => setForm({ ...form, quota_label: e.target.value })} placeholder="8 Go base incluse" />
                        </label>
                        <label className="param-field"><span>Limite base (Mo)</span>
                            <input type="number" value={form.quota_limit_mb} onChange={(e) => setForm({ ...form, quota_limit_mb: e.target.value })} placeholder="8192" />
                        </label>
                    </div>
                    <label className="param-field"><span>Notes</span>
                        <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    </label>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Ajouter'}</button>
                        {editing && <button className="btn-secondary" type="button" onClick={cancelEdit}>Annuler</button>}
                    </div>
                </form>

                {data.subscriptions.length > 0 && (
                    <table className="source-table" style={{ marginTop: 16 }}>
                        <thead><tr><th>Fournisseur</th><th>Libellé</th><th>Coût</th><th>Renouvellement</th><th>Quota</th><th></th></tr></thead>
                        <tbody>
                            {data.subscriptions.map((s) => (
                                <tr key={s.id} style={{ opacity: s.is_active ? 1 : 0.5 }}>
                                    <td>{s.provider}</td>
                                    <td>{s.label}</td>
                                    <td>{s.monthly_cost != null ? `${s.monthly_cost} ${s.currency}/${s.billing_cycle === 'yearly' ? 'an' : 'mois'}` : '—'}</td>
                                    <td>{s.renewal_date ? new Date(s.renewal_date).toLocaleDateString('fr-FR') : '—'}</td>
                                    <td>{s.quota_label || '—'}</td>
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                        <button className="link-button" onClick={() => startEdit(s)}>Modifier</button>
                                        {' · '}
                                        <button className="link-button" onClick={() => handleDelete(s.id)}>Suppr.</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}
