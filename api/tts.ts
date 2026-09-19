import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleTtsRequest } from '../server/ttsHandler';

/**
 * `/api/tts` en fonction serverless (Vercel, Netlify Functions, runtime Node).
 *
 * C'est la pièce qui rend l'hébergement statique viable sans perdre les voix. Le service de
 * synthèse d'Edge ne filtre que l'User-Agent : Chrome et Firefox sont refusés en direct,
 * Node passe. Sans cette fonction, le miroir GitHub Pages retombe sur `speechSynthesis`
 * pour la majorité des visiteurs — c'est-à-dire qu'il perd exactement ce qui fait l'intérêt
 * de l'application.
 *
 * Aucun secret n'est nécessaire : ni ce service, ni l'API Crom ne demandent de clé. Cette
 * fonction n'a donc aucune variable d'environnement à configurer.
 *
 * Toute la logique reste dans `server/ttsHandler.ts`, partagée avec le middleware de
 * développement (`vite.config.ts`) et le serveur autonome (`server/index.ts`) : les trois
 * chemins se comportent identiquement, par construction. Ce fichier n'ajoute que ce qui
 * n'a de sens QUE sur un point d'accès exposé au monde — les deux durcissements ci-dessous.
 */

/** Un an : les réponses sont immuables, la clé de cache étant le texte et la voix. */
const CACHE_RESEAU = 31_536_000;

/**
 * Mesuré sur dix dossiers et 1 413 segments : le plus long fait 903 caractères, la moyenne
 * 141, et aucun ne dépasse 1 200. Trois mille laisse plus de trois fois la marge nécessaire
 * tout en fermant la porte à qui voudrait faire lire un livre entier au relais.
 */
const LONGUEUR_MAX = 3000;

/**
 * Origines autorisées à appeler le relais.
 *
 * Un relais de synthèse ouvert est un service gratuit offert à qui le découvre, facturé au
 * quota de son propriétaire. On n'autorise donc que les origines du projet. Ce n'est pas
 * une sécurité contre un attaquant déterminé — rien n'empêche un script hors navigateur
 * d'omettre l'en-tête `Origin` — mais cela suffit à empêcher qu'un autre site web se
 * branche dessus, qui est le cas réel.
 *
 * `VERCEL_URL` est lue à l'exécution : l'URL change à chaque déploiement d'aperçu, et la
 * coder en dur casserait tous les aperçus.
 */
function origineAutorisee(origine: string): boolean {
  const autorisees = new Set<string>([
    'https://atari643.github.io',
    'http://localhost:5173',
    'http://localhost:4173',
    // La WebView Capacitor est servie depuis https://localhost. Elle joint normalement le
    // service en direct, mais si elle devait passer par ici, autant que ça marche.
    'https://localhost'
  ]);

  const surVercel = process.env.VERCEL_URL;
  if (surVercel) autorisees.add(`https://${surVercel}`);
  const canonique = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (canonique) autorisees.add(`https://${canonique}`);

  return autorisees.has(origine);
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const origine = req.headers.origin as string | undefined;

  // Pas d'en-tête `Origin` : appel hors navigateur (curl, un test, un client natif). Il n'y
  // a pas de CORS à jouer, donc rien à autoriser ni à refuser.
  // Origine présente mais inconnue : on refuse AVANT de synthétiser. Poser simplement un
  // en-tête absent laisserait le navigateur jeter la réponse, mais le quota serait déjà
  // consommé — ce qui est précisément ce qu'on veut éviter.
  const refusee = origine !== undefined && !origineAutorisee(origine);

  res.setHeader('Vary', 'Origin');

  if (refusee) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Origin not allowed' }));
    return;
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    if (origine) {
      res.setHeader('Access-Control-Allow-Origin', origine);
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Max-Age', '86400');
    }
    res.end();
    return;
  }

  await handleTtsRequest(req, res, {
    origineCors: origine ?? null,
    longueurMax: LONGUEUR_MAX,
    cacheReseau: CACHE_RESEAU
  });
}

/**
 * La synthèse d'un paragraphe prend le temps que le service met à le dire : le délai
 * d'attente d'`edgeTts.ts` est de 20 s, et la valeur par défaut de la plateforme (10 s)
 * couperait les segments longs en plein milieu.
 */
export const config = {
  maxDuration: 30
};
