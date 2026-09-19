# Journal des modifications

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le
projet adhère au [versionnage sémantique](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté

- Découpage du paquet : les interfaces ordinateur et téléphone sont désormais
  chargées à la demande, de même que les fenêtres (studio vocal, explorateur
  SCiPNET, fiche d'entité, terminal RAISA) et l'écran des entités sur mobile.
- Catalogue mobile virtualisé : seules les cartes visibles existent dans le DOM,
  quel que soit le nombre de dossiers de la branche.
- Application installable : manifeste complété, icônes 192/512 et masquable,
  service worker minimal pour le démarrage hors ligne.
- Génération automatique des icônes et des écrans de démarrage depuis le sceau
  de la Fondation (`npm run icones`), sans dépendance.
- Fonction serverless `api/tts.ts` : les voix neurales fonctionnent sur un
  hébergement statique, dans tous les navigateurs.
- Point d'accès de synthèse configurable par `VITE_TTS_ENDPOINT`, et chemin de
  base configurable par `VITE_BASE` pour le miroir GitHub Pages.
- Dépôt public : README, licence MIT, attribution CC BY-SA, guide de
  contribution, code de conduite, gabarits d'issue, intégration continue.
- Lien « Source » vers la page d'origine du wiki dans le lecteur mobile — il
  n'existait que sur ordinateur, alors que la licence CC BY-SA l'impose.

### Modifié

- La détection d'appareil écoute `matchMedia` au lieu de mesurer la largeur à
  chaque `resize` : la barre d'URL d'un téléphone ne re-rend plus l'application
  entière à chaque pixel.
- Le mode d'affichage passe par `storageService` comme le reste de la
  persistance, au lieu d'appeler `localStorage` en direct.
- Ergonomie tactile : cibles portées à 44 px dans l'en-tête, le tiroir et la
  barre de recherche ; champ de recherche à 16 px pour éviter le zoom
  automatique d'iOS ; retrait d'encoche sur l'en-tête, le tiroir et le
  mini-lecteur ; suppression du délai de 300 ms au tap.
- Les polices ne bloquent plus le premier rendu.
- Icônes et écrans de démarrage Android : le gabarit Capacitor par défaut est
  remplacé par le sceau de la Fondation sur fond sombre.

## [1.0.0]

- Première version complète : lecture multi-voix des dossiers SCP en dix
  branches, répertoire d'entités, interfaces ordinateur et téléphone,
  empaquetage Android.
