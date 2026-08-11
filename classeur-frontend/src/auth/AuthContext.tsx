import { createContext, ReactNode, useContext, useState } from 'react';
import { clearToken, getToken, setToken as persistToken } from '../lib/api';

interface Operator {
    id: string;
    displayName: string;
}

interface AuthState {
    isAuthenticated: boolean;
    operator: Operator | null;
    login: (token: string, operator: Operator) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [operator, setOperator] = useState<Operator | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getToken());

    function login(token: string, op: Operator) {
        persistToken(token);
        setOperator(op);
        setIsAuthenticated(true);
    }

    function logout() {
        clearToken();
        setOperator(null);
        setIsAuthenticated(false);
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, operator, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthState {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
    return ctx;
}
