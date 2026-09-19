import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/queryClient';
import { App } from './App';
import './styles/main.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);

/**
 * Service worker : l'application se relance sans réseau et s'installe sur
 * l'écran d'accueil (voir `public/sw.js`).
 *
 * Deux garde-fous. En développement, un service worker sert des fichiers périmés
 * et fait perdre un temps considérable à chercher pourquoi une modification ne
 * s'affiche pas. Dans la WebView Capacitor, les fichiers sont déjà locaux : le
 * cache n'apporterait rien et ne ferait qu'ajouter une couche où une version
 * figée peut se coincer.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator && !('Capacitor' in window)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch(() => {
        // Un enregistrement refusé (mode privé, origine non sécurisée) n'est pas
        // une panne : l'application fonctionne, simplement sans cache hors ligne.
      });
  });
}
