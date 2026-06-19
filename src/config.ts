const isProd = import.meta.env.PROD;
const isCapacitor = typeof window !== 'undefined' && (
  window.location.origin.startsWith('capacitor://') ||
  (window.location.origin.startsWith('http://localhost') && (window as any).Capacitor)
);

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (
  isCapacitor
    ? (isProd ? 'https://dghubschool.com' : 'http://10.0.2.2:3001')
    : (isProd ? window.location.origin : 'http://localhost:3001')
);
export const API_BASE_URL = `${BACKEND_URL}/api`;
