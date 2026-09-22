if (import.meta.env.PROD) {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
  console.warn = () => {};
  console.error = () => {};
}

// ── Récupération automatique après un déploiement (chunk JS obsolète) ──
// Chaque build Vite change les noms de fichiers des morceaux de code (hash de contenu).
// Un onglet resté ouvert depuis AVANT le dernier déploiement peut donc échouer à charger
// un composant chargé à la demande (React.lazy) dont l'ancien fichier n'existe plus sur
// le serveur — "Failed to fetch dynamically imported module" suivi d'un plantage de l'app
// (401 en cascade sur les appels API qui suivent, l'état React étant cassé). Un simple
// rechargement de page résout toujours ce cas puisqu'il récupère le nouvel index.html
// avec les bonnes références de fichiers. Un seul rechargement automatique par onglet
// (sessionStorage) évite une boucle infinie si le souci est en réalité un vrai problème
// réseau plutôt qu'un déploiement.
(function setupStaleChunkRecovery() {
  const isStaleChunkError = (reason: unknown): boolean => {
    const msg = String((reason as { message?: string } | undefined)?.message ?? reason ?? '');
    return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i.test(msg);
  };
  const reloadOnce = () => {
    if (sessionStorage.getItem('chunk-reload-attempted')) return;
    sessionStorage.setItem('chunk-reload-attempted', '1');
    window.location.reload();
  };
  window.addEventListener('unhandledrejection', (event) => {
    if (isStaleChunkError(event.reason)) reloadOnce();
  });
  window.addEventListener('error', (event) => {
    if (isStaleChunkError(event.error ?? event.message)) reloadOnce();
  });
})();

// Empêche les transitions de s'exécuter lors du chargement initial
document.documentElement.classList.add('no-transition');
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.documentElement.classList.remove('no-transition');
  });
});

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

const isCapacitor = Capacitor.isNativePlatform();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isCapacitor ? (
      <HashRouter>
        <App />
      </HashRouter>
    ) : (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )}
  </StrictMode>
);
