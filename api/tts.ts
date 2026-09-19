import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleTtsRequest } from '../server/ttsHandler';

/**
 * `/api/tts` en fonction serverless (Vercel, Netlify Functions, runtime Node).
 *
 * C'est la pièce qui rend l'hébergement statique viable sans perdre les voix. Le
 * service de synthèse d'Edge ne filtre que l'User-Agent : Chrome et Firefox sont
 * refusés en direct, Node passe. Sans cette fonction, l'application déployée sur
 * un hébergement sans back-end retombe sur `speechSynthesis` pour la majorité des
 * visiteurs — c'est-à-dire qu'elle perd exactement ce qui fait son intérêt.
 *
 * Aucun secret n'est nécessaire : ni ce service, ni l'API Crom ne demandent de
 * clé. Cette fonction n'a donc aucune variable d'environnement à configurer.
 *
 * Toute la logique reste dans `server/ttsHandler.ts`, partagée avec le middleware
 * de développement (`vite.config.ts`) et le serveur autonome (`server/index.ts`) :
 * les trois chemins se comportent identiquement, par construction.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // Le miroir statique (GitHub Pages) appelle cette fonction depuis une autre
  // origine. `handleTtsRequest` pose déjà l'en-tête sur les réponses réussies ;
  // on le pose ici aussi pour que les erreurs restent lisibles côté navigateur.
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.end();
    return;
  }

  await handleTtsRequest(req, res);
}

/**
 * La synthèse d'un paragraphe prend le temps que le service met à le dire : le
 * délai d'attente d'`edgeTts.ts` est de 20 s, et la valeur par défaut de la
 * plateforme (10 s) couperait les segments longs en plein milieu.
 */
export const config = {
  maxDuration: 30
};
