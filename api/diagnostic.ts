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
  let importRelatif = 'non testé';
  try {
    const mod = await import('../server/ttsHandler');
    importRelatif = typeof mod.handleTtsRequest === 'function' ? 'ok' : 'chargé mais vide';
  } catch (err) {
    importRelatif = `ÉCHEC : ${err instanceof Error ? err.message : String(err)}`;
  }

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
        importRelatif
      },
      null,
      2
    )
  );
}
