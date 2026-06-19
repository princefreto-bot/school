const isProd = import.meta.env.PROD;
export const BACKEND_URL = isProd ? window.location.origin : 'http://localhost:3001';
export const API_BASE_URL = `${BACKEND_URL}/api`;
