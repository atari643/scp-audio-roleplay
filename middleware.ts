/**
 * Middleware Vercel : l'aperçu d'un lien de dossier, pour les robots.
 *
 * Toute la logique vit dans `server/apercuPartage.ts`, partagée avec `npm run serve`
 * (même principe que `api/tts.ts` → `server/ttsHandler.ts`). Ce fichier ne fait
 * que trier les requêtes, et il est écrit pour **ne jamais casser l'accueil** :
 *
 *  · il ne s'exécute que sur `/` (`config.matcher`) ;
 *  · sans `?scp=` ni `?lang=`, il rend la main avant tout travail ;
 *  · il n'a AUCUN import statique. Le module d'aperçu est chargé à la demande, dans
 *    le `try` : si son chargement échouait sur le runtime de Vercel — c'est arrivé
 *    au relais TTS pour une simple extension d'import —, l'erreur serait rattrapée
 *    et la page ordinaire servie, au lieu d'une erreur 500 sur la page d'accueil ;
 *  · rendre `undefined`, c'est laisser Vercel servir `index.html` comme avant.
 *
 * Le HTML est relu depuis le déploiement lui-même (`/index.html`, que le matcher
 * n'intercepte pas) : ses noms de fichiers portent une empreinte qui change à
 * chaque build, et le middleware n'a pas accès au disque.
 */

export const config = {
  matcher: '/'
};

/** Au-delà, on sert la page sans aperçu plutôt que de faire attendre le robot. */
const DELAI_PAGE = 2000;

export default async function middleware(requete: Request): Promise<Response | undefined> {
  const adresse = new URL(requete.url);
  if (!adresse.searchParams.has('scp') && !adresse.searchParams.has('lang')) return undefined;

  try {
    const { estRobotDApercu, pageAvecApercu } = await import('./server/apercuPartage.js');
    if (!estRobotDApercu(requete.headers.get('user-agent'))) return undefined;

    const controleur = new AbortController();
    const minuterie = setTimeout(() => controleur.abort(), DELAI_PAGE);
    let html: string;
    try {
      const page = await fetch(new URL('/index.html', adresse), { signal: controleur.signal });
      if (!page.ok) return undefined;
      html = await page.text();
    } finally {
      clearTimeout(minuterie);
    }

    const avecApercu = await pageAvecApercu(adresse, html);
    if (!avecApercu) return undefined;

    return new Response(avecApercu, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // Pas de cache partagé : la même adresse sert les humains sans aperçu.
        'Cache-Control': 'private, no-cache',
        Vary: 'User-Agent'
      }
    });
  } catch {
    return undefined;
  }
}
