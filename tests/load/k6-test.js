import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Montée en charge à 50 utilisateurs simultanés
    { duration: '1m', target: 50 },   // Maintien à 50 utilisateurs
    { duration: '30s', target: 0 },   // Descente à 0 utilisateur
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% des requêtes doivent répondre en moins de 500ms
    http_req_failed: ['rate<0.01'],   // Le taux d'erreur doit être inférieur à 1%
  },
};

const BASE_URL = 'http://localhost:3000/api';

export default function () {
  // 1. Test du health check
  const resHealth = http.get(`${BASE_URL}/health`);
  check(resHealth, {
    'health status is 200': (r) => r.status === 200,
  });

  // 2. Test des statistiques publiques (Mise en cache Redis)
  const resStats = http.get(`${BASE_URL}/public/stats`);
  check(resStats, {
    'public stats is 200': (r) => r.status === 200,
  });

  // Pause simulant un utilisateur réel
  sleep(1);
}
