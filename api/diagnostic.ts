import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Sonde temporaire.
 *
 * Sans accès aux journaux de la plateforme, c'est le seul moyen de savoir ce que le
 * runtime offre réellement : version de Node, présence du `WebSocket` global (dont
 * dépend toute la synthèse), et si une fonction SANS import relatif démarre — ce qui
 * dirait que le plantage de `api/tts.ts` vient de sa chaîne d'imports.
 *
 * À supprimer une fois le relais opérationnel.
 */
export default async function handler(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  const essayer = async (charger: () => Promise<{ handleTtsRequest?: unknown }>) => {
    try {
      const mod = await charger();
      return typeof mod.handleTtsRequest === 'function' ? 'ok' : 'chargé mais vide';
    } catch (err) {
      return `ÉCHEC : ${err instanceof Error ? err.message : String(err)}`;
    }
  };

  // Les deux formes, pour trancher : sans extension (ce que le relais faisait, et qui
  // n'existe pas en ESM) et avec « .js » (la forme ESM correcte, que esbuild, Vite et
  // tsc résolvent vers le .ts voisin).
  const sansExtension = await essayer(() => import('../server/ttsHandler'));
  const avecExtension = await essayer(() => import('../server/ttsHandler.js'));

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(
    JSON.stringify(
      {
        node: process.version,
        websocketGlobal: typeof (globalThis as { WebSocket?: unknown }).WebSocket,
        cryptoSubtle: typeof globalThis.crypto?.subtle,
        vercelUrl: process.env.VERCEL_URL ?? null,
        sansExtension,
        avecExtension
      },
      null,
      2
    )
  );
}
