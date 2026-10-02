import { Capacitor } from '@capacitor/core';

const isProd = import.meta.env.PROD;
const isCapacitor = Capacitor.isNativePlatform();

// Sur dghubschool.com (et tous ses sous-domaines d'écoles) l'API vit sur son
// propre sous-domaine. Ailleurs (ex. URL Render de secours) on reste en même origine.
const API_ORIGIN = 'https://api.dghubschool.com';
const onOwnDomain = !isCapacitor && isProd && /(^|\.)dghubschool\.com$/.test(window.location.hostname);

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (
  isCapacitor || onOwnDomain
    ? API_ORIGIN
    : (isProd ? window.location.origin : 'http://localhost:3001')
);
export const API_BASE_URL = `${BACKEND_URL}/api`;

export const CLASSEUR_FRONTEND_URL = import.meta.env.VITE_CLASSEUR_FRONTEND_URL || 'https://data.dghubschool.com';

