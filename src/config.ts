import { Capacitor } from '@capacitor/core';

// Remplacez cette URL par l'URL publique de votre backend (ex: https://votre-app.onrender.com)
const REMOTE_BACKEND_URL = 'https://school-t79e.onrender.com';


// Sur mobile (Capacitor), window.location.origin est 'http://localhost'
// Il faut donc utiliser l'URL distante pour que l'application trouve la base de données.
export const BACKEND_URL = Capacitor.isNativePlatform() 
  ? REMOTE_BACKEND_URL 
  : window.location.origin;

export const API_BASE_URL = Capacitor.isNativePlatform() 
  ? `${REMOTE_BACKEND_URL}/api` 
  : '/api';
