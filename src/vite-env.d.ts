/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * URL complète du point d'accès de synthèse, quand il n'est pas servi par le même
   * hôte que le site (cas du miroir GitHub Pages, qui appelle la fonction Vercel).
   * Vide ⇒ « /api/tts ». Voir `src/services/speechEngine.ts`.
   */
  readonly VITE_TTS_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
