const TOKEN_KEY = 'classeur_token';

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const token = getToken();
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(`/api${path}`, { ...options, headers });
}

/** Upload multipart : ne JAMAIS fixer Content-Type ici, le navigateur doit poser sa propre boundary. */
export async function apiUpload(path: string, formData: FormData): Promise<Response> {
    const token = getToken();
    const headers = new Headers();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(`/api${path}`, { method: 'POST', headers, body: formData });
}
