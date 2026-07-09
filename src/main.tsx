if (import.meta.env.PROD) {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
}

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
