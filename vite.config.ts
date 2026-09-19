import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { handleTtsRequest } from './server/ttsHandler';

/**
 * `/api/tts` en développement.
 *
 * Toute la logique vit dans `server/ttsHandler.ts`, partagée avec le serveur autonome
 * (`npm run serve`) et avec la fonction serverless `api/tts.ts` : c'est ce qui garantit que
 * la version buildée se comporte comme le mode développement. Auparavant ce plugin lançait
 * `python -m edge_tts` et n'existait que dans Vite, ce qui rendait le TTS neural absent de
 * tout ce qui n'était pas `npm run dev`.
 */
function ttsPlugin(): Plugin {
  return {
    name: 'tts-api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/tts', handleTtsRequest);
    }
  };
}

/**
 * Chemin de base du site.
 *
 * Vaut « / » partout sauf sur le miroir GitHub Pages, servi sous `/<dépôt>/` : le workflow
 * `.github/workflows/pages.yml` y pose `VITE_BASE`. Les chemins absolus du HTML (favicon,
 * manifeste, entrée JS) suivent automatiquement. L'appel `/api/tts`, lui, ne doit PAS suivre :
 * il pointe soit sur la racine du domaine (Vercel), soit sur une URL complète donnée par
 * `VITE_TTS_ENDPOINT` — voir `speechEngine.buildNeuralAudioUrl()`.
 */
const base = process.env.VITE_BASE ?? '/';

// https://vitejs.dev/config/
export default defineConfig({
  base,
  plugins: [react(), ttsPlugin()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    // Le paquet d'entrée ne doit porter que l'aiguilleur : les deux vues sont en `lazy`
    // (`src/App.tsx`). Ce découpage-ci sépare en plus ce qui ne change jamais (React, les
    // bibliothèques) de ce qui change à chaque commit, pour que le cache du navigateur
    // survive aux mises à jour.
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('scheduler')) return 'react';
            if (id.includes('@tanstack')) return 'tanstack';
            if (id.includes('lucide-react')) return 'icones';
            return 'vendor';
          }
          // 69 Ko de SVG en ligne, inutiles tant qu'aucune carte n'est affichée.
          if (id.includes('ScpIllustrations')) return 'illustrations';
          return undefined;
        }
      }
    },
    chunkSizeWarningLimit: 900
  }
});
