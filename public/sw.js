/* eslint-disable no-restricted-globals */
/**
 * Service worker de l'archive.
 *
 * Objectif volontairement étroit : que l'application se lance sans réseau et ne
 * reparte pas de zéro à chaque ouverture sur un téléphone. Il ne met en cache
 * que ce qui vient de l'application elle-même.
 *
 * Ce qu'il ne touche JAMAIS :
 *  · `/api/tts` — chaque phrase est unique, et le cache audio a déjà son propre
 *    magasin IndexedDB (`src/services/audioCache.ts`) qui, lui, garde les
 *    frontières de mots avec le son ;
 *  · l'API Crom — les dossiers sont du contenu vivant, et TanStack Query gère
 *    déjà leur fraîcheur en mémoire ;
 *  · toute requête qui n'est pas un GET de même origine.
 *
 * Écrit à la main, sans Workbox : soixante lignes lisibles valent mieux qu'une
 * dépendance de build de plus pour ce que l'application demande ici.
 */

const VERSION = 'scp-audio-v1';
const COQUILLE = `${VERSION}-coquille`;

self.addEventListener('install', () => {
  // Rien à précharger : les noms de fichiers portent une empreinte que ce
  // fichier ne connaît pas. Le cache se remplit à la première visite.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((noms) =>
        Promise.all(noms.filter((nom) => !nom.startsWith(VERSION)).map((nom) => caches.delete(nom)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const requete = event.request;
  if (requete.method !== 'GET') return;

  const url = new URL(requete.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes('/api/')) return;

  // Navigation : le réseau d'abord, pour ne jamais servir une version périmée de
  // l'application ; le cache seulement quand il n'y a pas de réseau.
  if (requete.mode === 'navigate') {
    event.respondWith(
      fetch(requete)
        .then((reponse) => {
          const copie = reponse.clone();
          caches.open(COQUILLE).then((cache) => cache.put(requete, copie));
          return reponse;
        })
        .catch(() => caches.match(requete).then((c) => c || caches.match('./index.html')))
    );
    return;
  }

  // Ressources : servies depuis le cache et rafraîchies en arrière-plan. Les noms
  // portant une empreinte, une version servie depuis le cache est toujours la
  // bonne pour la page qui la demande.
  event.respondWith(
    caches.match(requete).then((enCache) => {
      const reseau = fetch(requete)
        .then((reponse) => {
          if (reponse && reponse.status === 200 && reponse.type === 'basic') {
            const copie = reponse.clone();
            caches.open(COQUILLE).then((cache) => cache.put(requete, copie));
          }
          return reponse;
        })
        .catch(() => enCache);
      return enCache || reseau;
    })
  );
});
