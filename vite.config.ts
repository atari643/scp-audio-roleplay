import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { handleTtsRequest } from './server/ttsHandler';

/**
 * `/api/tts` en développement.
 *
 * Toute la logique vit dans `server/ttsHandler.ts`, partagée avec le serveur autonome
 * (`npm run serve`) : c'est ce qui garantit que la version buildée se comporte comme le
 * mode développement. Auparavant ce plugin lançait `python -m edge_tts` et n'existait que
 * dans Vite, ce qui rendait le TTS neural absent de tout ce qui n'était pas `npm run dev`.
 */
function ttsPlugin(): Plugin {
  return {
    name: 'tts-api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/tts', handleTtsRequest);
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), ttsPlugin()],
  server: {
    port: 5173,
    host: true
  }
});
