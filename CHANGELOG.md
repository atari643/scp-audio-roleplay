# Journal des modifications

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le
projet adhère au [versionnage sémantique](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté

- **Un dossier s'écoute écran éteint, comme un podcast.** Sur téléphone, la lecture
  s'arrêtait au premier changement de réplique dès que l'écran se verrouillait : chaque
  segment créait son propre élément audio, que le navigateur refuse de lancer hors d'un
  geste, et le silence entre deux répliques était une minuterie, gelée en arrière-plan.
  La lecture passe désormais par un seul élément, déverrouillé par le premier appui sur
  lecture, qui joue les répliques ET les silences sans jamais se taire — il prolonge le
  silence si la réplique suivante n'est pas encore prête. L'écran de verrouillage et le
  casque affichent le dossier, qui parle et l'icône de l'application (en PNG : Android et
  iOS ignoraient l'icône SVG), avec lecture, pause, réplique précédente ou suivante, arrêt.
- **En français, chaque personnage a sa propre voix, et plus aucune ne bascule en
  anglais.** Les rôles étaient prêtés à des voix étrangères « Multilingual » (Andrew,
  Brian, Emma…) qui devinent la langue de chaque phrase : sur SCP-049, l'anomalie passait
  à l'anglais au milieu d'une réplique. Mesuré : Edge ignore la langue qu'on lui déclare et
  refuse la balise qui l'imposerait. Rémy et Vivienne jouent désormais tous les rôles, et
  chaque personnage devient une personne différente — hauteur et formants (la taille du
  conduit vocal) transformés juste après la synthèse par Signalsmith Stretch (MIT, WASM de
  92 Ko chargé seulement en français). Deux interlocuteurs d'un même dossier n'ont jamais
  la même personne.
- **Les répliques courtes ne partent plus en anglais.** Même Rémy et Vivienne devinent
  la langue sur le texte : « Dr Sherman : Guéri ? » était lu « Gary ? » (Whisper : 76 %
  anglais). En français, l'annonce du locuteur prend son article et son titre en toutes
  lettres (« Le docteur Sherman : », 99 % français) et les chiffres des désignations
  s'écrivent en lettres (« SCP zéro quarante-neuf » : de 2 % à 99 % de français sur le
  titre). Sur l'entretien de SCP-049, plus aucune réplique n'est reconnue en anglais.
  Même cause pour les titres de section : « Procédures de confinement spéciales : » perdait
  son deux-points au profit d'un point, et la phrase de trois mots ainsi isolée était lue
  en espagnol (98 %). Le deux-points d'étiquette est gardé (100 % de français), et une
  étiquette à sigle (« Objet : SCP cent soixante-treize. ») rejoint la phrase suivante.
- **On entend qui va parler.** L'annonce du locuteur collait à sa réplique, dite par la
  même voix : à l'écoute de SCP-049, on ne savait plus qui parlait. Elle est maintenant
  dite par l'Archiviste, suivie de 0,3 s de silence, puis le personnage parle avec sa
  propre voix. Les deux voix lisent le MÊME
  texte et l'on coupe aux frontières de mots (`composerAnnonce`, `timbres.ts`) : séparées,
  une annonce brève et une réplique courte repartiraient en anglais.

- **Le son d'un dossier se décide en un seul endroit**
  (`src/services/preparationLecture.ts`) : texte prononcé, voix, prosodie,
  pauses et caviardages sortent du moteur de lecture, dans un module sans
  dépendance au navigateur. Vérifié sur 272 segments réels : texte, voix et pauses
  identiques à l'ancien moteur, au caractère près.
- **Le hook `pre-commit` reconnaît davantage de clés d'API** (32 caractères
  hexadécimaux, un point, 16 caractères), et refuse tout fichier que les règles
  d'exclusion de git écartent, même ajouté de force.

- **L'interface suit la langue choisie, dans les dix branches.** Choisir
  l'anglais changeait le catalogue mais pas un mot autour : on lisait un dossier
  anglais entouré de boutons français, et le badge du locuteur annonçait
  « Archiviste » à chaque réplique. 223 clés, traduites en anglais, espagnol,
  allemand, italien, polonais, russe, japonais, coréen et chinois. Le socle est
  écrit à la main — pas de bibliothèque ajoutée — et chaque branche charge son
  seul dictionnaire, une dizaine de kilo-octets.
- **Les résumés d'entités arrivent dans la bonne langue.** Le wiki les publie
  dans chaque branche depuis toujours ; le script n'en gardait qu'un, l'anglais,
  parce qu'il est construit en premier. 1 508 résumés au lieu de 418, dont 223
  en français là où il n'y en avait aucun. Au passage, le morceau de données
  passe de 82 à 33 Ko compressés : les résumés sont désormais découpés par
  branche, donc on ne télécharge plus les dix langues pour n'en lire qu'une.
- **Des liens partageables** : `?scp=scp-173&lang=en` ouvre le dossier sur la
  bonne branche, `?lang=en` ouvre l'archive en anglais, et l'adresse se met à
  jour toute seule. Un lien qui vise un dossier saute la séquence de démarrage —
  dix secondes d'attente avant le dossier promis faisaient fuir le visiteur.
- **Un bouton « Partager » dans les deux lecteurs.** La barre d'adresse suffisait
  sur ordinateur ; l'application Android n'en a pas, et sur téléphone personne ne
  va la chercher. Feuille de partage du système sur téléphone, copie ailleurs. Le
  lien écrit toujours la langue, pour s'ouvrir chez l'autre dans celle qu'on avait
  sous les yeux.
- **Chaque lien partagé a son aperçu.** Discord, Reddit, X ou Google lisent la
  page sans exécuter son JavaScript : tous les dossiers s'y affichaient « SCP Audio
  Roleplay ». Un middleware Vercel leur sert désormais le titre du dossier, son
  auteur et la langue du lien — aux robots seulement, les visiteurs n'attendent
  pas une requête de plus.
- **Ce que lisent les moteurs de recherche** : `robots.txt`, un plan du site de
  650 adresses (l'accueil des dix branches et leur catalogue de démarrage), un
  lien canonique qui désigne Vercel depuis le miroir Pages, un titre d'onglet par
  dossier, et quelques lignes de texte dans `index.html` pour les robots qui
  n'exécutent pas le JavaScript — ils indexaient un `<div>` vide.
- **Mesure d'audience** (Vercel Web Analytics, sans cookie), dans la seule version
  construite par Vercel. À activer dans le tableau de bord.

### Corrigé

- **Plus d'erreur JavaScript à chaque chargement sur Vercel.** Tant que la mesure
  d'audience n'est pas activée dans le tableau de bord, son script
  (`/_vercel/insights/script.js`) tombait sur la réécriture vers `index.html` : le
  navigateur recevait une page HTML à la place d'un script. Les chemins `/_vercel/` sont
  désormais laissés à Vercel.
- **Le narrateur s'affiche dans la langue choisie.** Un dossier anglais montrait
  « ARCHIVISTE » au-dessus de chaque paragraphe, dans le lecteur, le mini-lecteur et
  l'écran de verrouillage : c'est le nom interne du rôle, désormais traduit à l'affichage.
- **Les personnages ne disent plus les didascalies.** « SCP-049 : (L'interrompt, en colère)
  Pas mort ! » faisait dire « L'interrompt, en colère » à SCP-049. Une indication de jeu
  (ton, souffle, rire, silence, à qui l'on parle) quitte le texte prononcé : elle s'affiche en
  italique au-dessus de la réplique — sur mobile aussi — et se traduit en silence, en volume
  ou en débit (la colère se dit plus fort, une interruption entre plus tôt). Une didascalie
  qui raconte un geste ou un bruit (« (Parcourt la pièce du regard) », « (Coups de feu) »)
  est dite par l'Archiviste. Les parenthèses de contenu (« (D-4581) », noms latins, sigles)
  restent lues ; au passage, « (War Relocation Authority) » ou « priorité » ne sont plus
  avalés parce qu'ils contenaient « rit ».
- **« No fewer than 3 may enter » se lit enfin « three ».** Le service prenait « 3 may »
  pour une date — le 3 mai — et avalait le nombre (SCP-173, en anglais). Un nombre suivi
  de « may » ou « march » s'écrit désormais en lettres, ce qui lève l'ambiguïté.
- **Le moteur de lecture pouvait planter dès son chargement** quand le navigateur
  connaissait déjà ses voix système (Edge, deuxième visite) : il les répartissait entre
  les rôles avant d'avoir chargé les profils de ces rôles.
- **L'image d'aperçu était une adresse relative**, que le protocole Open Graph
  interdit : Facebook, LinkedIn ou Reddit publiaient le lien sans vignette. C'est
  maintenant la bannière 1280 × 640, en adresse absolue et en grande carte.
- **`robots.txt` et `sitemap.xml` renvoyaient la page d'accueil**, avalés par la
  réécriture de l'application monopage.
- **La page se déclarait en français** (`<html lang="fr">`, description,
  `og:locale`) alors que l'anglais est la langue par défaut ; `lang` suit
  maintenant la langue choisie.

### Sécurité

- **Injection SSML par le nom de voix.** `buildSsml()` posait la voix dans un
  attribut XML sans l'échapper, là où le texte, lui, passe par `escapeXml`. Une
  apostrophe suffisait à en sortir. Ce n'est pas un XSS — la sortie est du MP3 —
  mais un contournement du plafond du relais public : seul `text` est limité à
  3 000 caractères, donc un texte de longueur arbitraire logé dans `voice` était
  synthétisé aux frais du quota. Corrigé sur deux couches, `rate`, `pitch` et
  `volume` compris.

## [1.1.0] — 2026-09-19

Première version publiée sur le web : l'application tourne sur Vercel, le miroir
GitHub Pages l'accompagne, et le dépôt est ouvert.

### Ajouté

- Attribution du répertoire d'entités. Le dépôt embarque **418 résumés repris
  verbatim des annuaires du wiki**, affichés jusqu'ici sans source ni licence —
  et `NOTICE-SCP.md` affirmait même que rien de tel n'y figurait. Chaque fiche
  d'entité porte maintenant, dans les deux vues, un lien vers sa page d'origine
  et la mention CC BY-SA 3.0. La source était déjà dans les données
  (`Entite.pages`), elle n'était simplement jamais affichée. Vérifié : 418 sur
  418 sont crédités, dans les dix branches, avec repli sur l'anglais quand la
  branche affichée n'a pas la page. La notice a été corrigée en conséquence.
- Filet d'erreur (`LimiteErreur`). Une exception de rendu vidait le DOM : page
  blanche, sans message. Le cas le plus probable était un `import()` de chunk en
  échec — onglet resté ouvert pendant un redéploiement — qui traverse
  `<Suspense>`, lequel ne rattrape que l'attente. L'écran de confinement propose
  désormais de relancer l'archive.
- Signalement du repli vocal sur téléphone. Le badge « VOIX DE SECOURS »
  n'existait que sur ordinateur, alors que le mobile est précisément la cible où
  le repli se déclenche : on y entendait sept personnages en voix système sans
  savoir pourquoi. La feuille audio affiche un bouton qui ouvre le studio des
  voix, le mini-lecteur une pastille « SECOURS ».
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

- Le débogage de la WebView Android (`chrome://inspect`) ne part plus dans le
  paquet destiné au Play Store : `npm run android:release` le coupe, tout le
  reste — dont `npm run android:debug` — le garde, puisque c'est le seul moyen de
  lire la console d'un téléphone.
- `ARCHITECTURE.md` décrivait un `src/desktop/components/` qui n'existe pas,
  plaçait la bascule d'affichage dans le mauvais coin de l'écran et s'adressait à
  des assistants IA plutôt qu'aux contributeurs — le dépôt est public depuis.

### Retiré

- `clsx` et `tailwind-merge`, aucune des deux n'étant importée nulle part.
  (`@capacitor/core` reste : c'est une dépendance pair exigée par
  `@capacitor/android`.)

### Sécurité

- `.github/dependabot.yml` : l'avis `uuid` remonte de `@capacitor/cli` → `xcode`,
  dépendance de développement absente du paquet web comme de l'APK, et son seul
  chemin de correction rétrograderait `@capacitor/cli`. Il est explicitement
  ignoré plutôt que de laisser le bot échouer en boucle sur un dépôt public.

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
