# Journal des modifications

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le
projet adhère au [versionnage sémantique](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté

- Relais de synthèse verrouillé : `api/tts.ts` n'accepte que les origines du projet
  et refuse en `403` **avant** de synthétiser, plafonne les textes à 3 000
  caractères et fait mettre les réponses en cache par le réseau de diffusion. Sans
  ces verrous, un relais public serait un service de synthèse offert à qui le
  découvre, facturé sur le quota du propriétaire. Aucun effet sur un clone hébergé
  en local : les deux réglages vivent dans le seul fichier du relais.
- Repli vocal utilisable : quand le moteur neural est hors d'atteinte, les voix
  françaises installées sont classées par qualité probable et **réparties entre les
  rôles**. Jusqu'ici aucune voix n'était assignée, donc les sept personnages
  sortaient de la même bouche à la hauteur près — c'est ce qu'entendaient les
  visiteurs du miroir statique.
- Signalement discret du mode dégradé dans le lecteur (« VOIX DE SECOURS »), avec le
  bouton du studio des voix mis en évidence, puisque c'est là qu'on peut réessayer.

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
- Pavé de crédits au bas de chaque dossier, dans les deux lecteurs : auteur,
  traducteur, titre, source et licence. Les crédits viennent des `attributions`
  de Crom, et l'auteur de l'original est cité en plus du traducteur sur une
  page traduite. La licence CC BY-SA 3.0 exige les quatre (règle « TSAL ») ;
  l'application n'en affichait aucun.

### Modifié

- La détection d'appareil écoute `matchMedia` au lieu de mesurer la largeur à
  chaque `resize` : la barre d'URL d'un téléphone ne re-rend plus l'application
  entière à chaque pixel.
- Le mode d'affichage passe par `storageService` comme le reste de la
  persistance, au lieu d'appeler `localStorage` en direct.
- Lecteur audio : la piste de progression s'épaissit au survol et sort une tête de
  lecture, le code de canal du rôle (`ARCH-01`, `MTF-OPS`…) qui existait sans jamais
  être affiché apparaît enfin, les groupes de réglages partagent une même boîte, et
  tous les contrôles ont un anneau de focus — la barre se pilote au clavier.
- La bascule bureau ⇄ mobile passe du coin haut-droit, où elle occupait la place la
  plus visible de l'écran pour un réglage qu'on touche une fois, à une **pastille en
  bas à droite** : l'icône dit l'état, le libellé ne sort qu'au survol, et elle se
  soulève au-dessus du lecteur quand il est ouvert.
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
