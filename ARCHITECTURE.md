# 🏛️ Architecture du Projet SCP Audio Roleplay (Desktop & Mobile)

> **La contrainte structurante du projet.**
> Cette application est intentionnellement et strictement scindée en **deux espaces de travail distincts** :
> 1. **Version Bureau (Desktop)** : localisée dans `src/desktop/`
> 2. **Version Mobile (Smartphone)** : localisée dans `src/mobile/`
> 3. **Logique Partagée (Shared)** : localisée dans `src/shared/`, `src/services/`, `src/types/`
>
> ⚠️ **Règle d'or pour toute modification future :**
> - Une modification qui vise **l'ordinateur** ne touche que `src/desktop/`.
> - Une modification qui vise **le téléphone** ne touche que `src/mobile/`.
> - `src/shared/` et `src/services/` n'accueillent que la logique métier commune aux
>   deux plateformes (moteur audio, requêtes API CROM, favoris, persistance).
> - `src/components/` est partagé par les deux vues : ce qu'on y change se voit
>   **des deux côtés**, à vérifier avant de conclure.

---

## 📁 Arborescence des Dossiers

```
scp-app/
├── src/
│   ├── desktop/                      # 🖥️ ESPACE BUREAU (DÉDIÉ DESKTOP)
│   │   └── DesktopApp.tsx            # Composant racine de la vue Bureau — seul fichier
│   │                                 #   à ce jour ; un `components/` s'y crée au besoin
│   │
│   ├── mobile/                       # 📱 ESPACE MOBILE (DÉDIÉ SMARTPHONE)
│   │   ├── MobileApp.tsx             # Composant racine de la vue Mobile
│   │   └── components/               # Composants tactiles spécifiques Mobile
│   │       ├── MobileHeader.tsx          # En-tête tactique compact
│   │       ├── MobileBottomNav.tsx       # Barre de navigation inférieure (Thumb Zone)
│   │       ├── MobileMiniPlayer.tsx      # Mini-lecteur audio flottant rétractable
│   │       ├── MobileAudioSheet.tsx      # Lecteur audio plein écran tactile
│   │       ├── MobileScpCard.tsx         # Carte SCP adaptée au tactile
│   │       ├── MobileScpReader.tsx       # Lecteur de dossier épuré (taille police A-/A+)
│   │       ├── MobileSearchFilters.tsx   # Recherche & carrousel horizontal de filtres
│   │       ├── MobileEntitesScreen.tsx   # Répertoire de la Fondation, navigation au pouce
│   │       ├── MobileTacticalDrawer.tsx  # Menu tiroir latéral (SFX, CRT, RAISA, etc.)
│   │       └── MobileBiometricScanner.tsx# Scanner d'empreinte tactile avec vibration
│   │
│   ├── shared/                       # 🔄 SOCLE COMMUN ET LOGIQUE MÉTIER
│   │   ├── hooks/
│   │   │   ├── useScpApp.ts          # État global partagé (API CROM, TTS, Favoris, etc.)
│   │   │   └── useDeviceMode.ts      # Détection d'appareil & gestion de la bascule
│   │   └── components/
│   │       ├── DeviceSwitcherBadge.tsx # Pastille permettant de basculer Bureau ⇄ Mobile
│   │       ├── EcranAttente.tsx        # Attente pendant le chargement de la vue (lazy)
│   │       └── LimiteErreur.tsx        # Filet : évite la page blanche si le rendu casse
│   │
│   ├── components/                   # Modales et composants graphiques partagés
│   │   ├── VoiceStudioModal.tsx      # Studio de personnalisation des voix Edge Neural
│   │   ├── FavoritesModal.tsx        # Modale de gestion des favoris
│   │   ├── ScipnetExplorerModal.tsx  # Explorateur SCiPNET style rétro
│   │   ├── EntityDetailModal.tsx     # Dossier détaillé des entités de départements
│   │   ├── BandeauEntites.tsx        # Rattachements d'un dossier (site, FIM, GdI, personnel)
│   │   ├── CreditsDossier.tsx        # Pavé TSAL d'un dossier : auteur, source, licence
│   │   ├── MentionSourceWiki.tsx     # La ligne « page d'origine, sous CC BY-SA 3.0 »
│   │   ├── RaisaTerminal.tsx         # Terminal RAISA dockable
│   │   ├── BootSequence.tsx          # Séquence de démarrage BIOS rétro
│   │   └── MemeticWarning.tsx        # Écran d'inoculation mémétique
│   │
│   ├── services/                     # Moteurs audio, API et stockage
│   │   ├── cromApi.ts                # API GraphQL CROM pour les dossiers SCP multilingues
│   │   ├── entityService.ts          # Répertoire d'entités et arêtes dossier ⇄ entité
│   │   ├── speechEngine.ts           # Moteur TTS multi-voix et synchronisation
│   │   ├── scriptParser.ts           # Analyseur de script & détection des dialogues
│   │   ├── sfxService.ts             # Synthétiseur d'effets sonores et bruit blanc
│   │   └── storageService.ts         # Persistance localStorage (favoris, historique)
│   │
│   ├── data/                         # Données construites hors ligne, chargées à la demande
│   │   ├── entities.json             # Répertoire des entités (généré, 10 branches)
│   │   ├── entityIndex.<lang>.json   # Arêtes dossier ⇄ entité, une par branche (généré)
│   │   ├── branchProfiles.json       # Tags de type par branche (généré, --profil)
│   │   ├── corpusIndex.fr.json       # Durées, ambiances, notoriété (généré, npm run index)
│   │   ├── departmentsData.ts        # Calque ÉDITORIAL des entités (lore, couleurs)
│   │   ├── entityPresentation.ts     # Pont répertoire → forme attendue par l'affichage
│   │   └── seriesData.ts             # Séries et sous-tranches SCP
│   │
│   ├── types/                        # Définitions TypeScript partagées
│   ├── styles/                       # Styles SCSS et Tailwind
│   ├── App.tsx                       # Routeur d'aiguillage Bureau / Mobile
│   └── main.tsx                      # Point d'entrée React 19
│
├── scripts/
│   ├── build-entities.mjs            # Construit répertoire, profils et arêtes depuis Crom
│   ├── entities-lib.mjs              # Transport Crom, normalisation, lecture d'annuaires
│   ├── build-index.mjs               # Construit l'index de corpus (durées, ambiances)
│   ├── audit-coverage.mjs            # Audit de fidélité audio
│   └── probe-speech.mjs              # Sonde de prononciation
├── package.json
└── vite.config.ts
```

> **Les fichiers `.json` de `src/data/` sont générés, jamais édités à la main.** Ils
> sont chargés par `import()` dynamique (voir `corpusFilters.ts` et `entityService.ts`)
> pour rester hors du bundle principal : ensemble ils pèsent plus lourd que
> l'application elle-même.

---

## 🧭 Comment fonctionne la bascule d'affichage ?

1. **Détection automatique (`auto`)** :
   - Si la largeur d'écran est `< 768px` : l'application charge automatiquement `<MobileApp />`.
   - Si la largeur d'écran est `>= 768px` : l'application charge automatiquement `<DesktopApp />`.

2. **Bascule manuelle (`DeviceSwitcherBadge`)** :
   - Une pastille flottante **en bas à droite** force la vue Bureau sur un téléphone, ou la vue Mobile sur un grand écran. Elle occupait le coin haut-droit — la place la plus visible de l'écran pour un réglage qu'on touche une fois — et se soulève maintenant au-dessus du lecteur quand il est ouvert.
   - Le choix est sauvegardé via `storageService` sous la clé `scp_device_mode`.

3. **Filet d'erreur (`LimiteErreur`)** :
   - Les deux vues sont chargées en `lazy()`. Un `import()` de chunk qui échoue —
     typiquement un onglet resté ouvert pendant un redéploiement — traverse
     `<Suspense>`, qui ne rattrape que l'attente. `LimiteErreur` entoure donc l'arbre
     dans `main.tsx` **et** l'aiguillage dans `App.tsx`, faute de quoi l'utilisateur
     n'obtient qu'une page blanche.

---

## 🛠️ Où écrire quoi

### Pour ajouter une fonctionnalité sur Desktop :
- Ouvrir `src/desktop/DesktopApp.tsx`, ou créer un `src/desktop/components/` si le fichier devient trop gros (il n'existe pas encore).
- Vérifier que l'affichage sur grand écran reste optimal.

### Pour ajouter une fonctionnalité sur Mobile :
- Ouvrir `src/mobile/MobileApp.tsx` ou créer des sous-composants dans `src/mobile/components/`.
- Respecter les principes d'ergonomie mobile :
  - Cibles tactiles d'au moins 44x44px.
  - Pas de débordement horizontal (`overflow-x-hidden`).
  - Utilisation de la barre de navigation inférieure (`MobileBottomNav`) pour les actions principales.
  - Intégration dans le mini-lecteur (`MobileMiniPlayer`) ou la feuille audio (`MobileAudioSheet`).

### Pour modifier le moteur audio ou les données :
- Modifier `src/shared/hooks/useScpApp.ts` ou les fichiers dans `src/services/`.
- Les deux vues en bénéficient d'un coup : préférez toujours une correction ici à un
  patch dupliqué dans `desktop/` puis `mobile/`.

### Avant de dire que c'est fini :
- `npm run build` (`tsc -b` en mode `strict`) est **le seul filet** : il n'y a ni tests,
  ni ESLint, ni Prettier.
- `npm run audit` après toute modification qui approche `scriptParser.ts` ou
  `cromApi.ts` — il sort en code ≠ 0 sur une duplication ou un défaut de parsing.
- Les pièges déjà payés une fois sont consignés dans [`CLAUDE.md`](CLAUDE.md) :
  filtrage par User-Agent d'Edge TTS, pagination des dossiers, notes de bas de page,
  URLs `http://` de Crom. Les lire évite d'en repayer un.
