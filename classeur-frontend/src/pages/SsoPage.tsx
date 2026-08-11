import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function SsoPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const code = params.get('code');
        if (!code) {
            setError('Lien de connexion invalide (code manquant).');
            return;
        }
        fetch('/api/sso/redeem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        })
            .then(async (res) => {
                const body = await res.json();
                if (!res.ok) throw new Error(body.error || 'Échec de connexion.');
                login(body.token, body.operator);
                navigate('/', { replace: true });
            })
            .catch((err) => setError(err.message));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params]);

    if (error) {
        return (
            <div className="sso-status sso-status--error">
                <p>{error}</p>
                <p>Retournez sur dghubschool.com et réessayez depuis le lien « Classeur Intelligent ».</p>
            </div>
        );
    }

    return <div className="sso-status">Connexion en cours…</div>;
}
