import type { CapacitorConfig } from '@capacitor/cli';
import { EDGE_USER_AGENT } from './src/services/edgeTts';

/**
 * Empaquetage Android de l'app (vue mobile) via Capacitor.
 *
 * `webDir` pointe sur la sortie de `vite build`. Le middleware `/api/tts` de
 * `vite.config.ts` n'existe PAS dans ce paquet — et contrairement à ce que ce commentaire
 * affirmait, il n'existe aucun pont natif `EdgeTts` : ni `src/services/edgeTts/`, ni plugin
 * dans `android/app/src/main/java/`, qui ne contient que `MainActivity.java`. Le TTS neural
 * était donc mort sur téléphone, `buildNeuralAudioUrl()` tombait en 404 et l'application
 * parlait avec la voix par défaut d'Android.
 *
 * La solution tient dans `overrideUserAgent` ci-dessous. Le service de synthèse d'Edge est
 * un simple WebSocket sans clé, et le seul filtre qu'il applique est l'User-Agent : mesuré
 * sur le vrai service, un UA Edge passe (101), ceux de Chrome, de Firefox et de la WebView
 * Android sont refusés (403), tandis que l'origine et les client hints sont ignorés. Une
 * page ne peut pas falsifier son User-Agent sur un WebSocket — mais la WebView qui l'héberge
 * le peut, et c'est ce qu'on fait ici. `src/services/edgeTts.ts` détecte alors, via
 * `canSynthesizeDirectly()`, qu'il peut joindre le service en direct.
 *
 * Conséquence à connaître : cet User-Agent vaut pour TOUTES les requêtes de l'application,
 * y compris celles vers l'API Crom. Crom n'en tient pas compte.
 */
const config: CapacitorConfig = {
  appId: 'fr.fondation.scpaudio',
  appName: 'SCP Audio',
  webDir: 'dist',
  android: {
    // Laisse `chrome://inspect` s'attacher à la WebView pour lire la console.
    webContentsDebuggingEnabled: true,
    // Voir plus haut : c'est ce qui rend les voix neurales possibles sur téléphone.
    overrideUserAgent: EDGE_USER_AGENT
  },
  server: {
    // Sert la WebView depuis https://localhost : contexte sécurisé, donc
    // `speechSynthesis`, l'audio et le stockage se comportent comme sur desktop.
    androidScheme: 'https'
  }
};

export default config;
