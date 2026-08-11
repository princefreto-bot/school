import { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';

export default function RequireAuth({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return (
            <div className="sso-status">
                <p>Accès réservé aux opérateurs du classeur.</p>
                <p>Connectez-vous depuis dghubschool.com via le lien « Classeur Intelligent ».</p>
            </div>
        );
    }

    return <>{children}</>;
}
