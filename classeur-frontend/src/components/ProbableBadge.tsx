/** Habille toute valeur estimée (relation non validée, localisation probable, score non-fort).
 *  Ne jamais afficher une valeur estimée sans ce badge : c'est le garde-fou visuel qui empêche
 *  d'inventer une certitude que les données ne permettent pas. */
export default function ProbableBadge({ score }: { score?: number }) {
    return <span className="probable-badge">PROBABLE{typeof score === 'number' ? ` · ${score.toFixed(0)}%` : ''}</span>;
}
