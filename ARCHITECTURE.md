# 🏛️ Architecture du Projet SCP Audio Roleplay (Desktop & Mobile)

> **CONSIGNE POUR LES ASSISTANTS IA (GEMINI & CLAUDE) :**
> Cette application est intentionnellement et strictement scindée en **deux espaces de travail distincts** :
> 1. **Version Bureau (Desktop)** : localisée dans `src/desktop/`
> 2. **Version Mobile (Smartphone)** : localisée dans `src/mobile/`
> 3. **Logique Partagée (Shared)** : localisée dans `src/shared/`, `src/services/`, `src/types/`
>
> ⚠️ **Règle d'or pour toute modification future :**
> - Si l'utilisateur demande une modification pour **Ordinateur / Desktop**, modifiez **UNIQUEMENT** `src/desktop/`.
> - Si l'utilisateur demande une modification pour **Mobile / Smartphone**, modifiez **UNIQUEMENT** `src/mobile/`.
> - Ne touchez à `src/shared/` ou `src/services/` que si l'ajout concerne une logique métier commune aux deux plateformes (moteur audio, requêtes API CROM, favoris, etc.).

---

## 📁 Arborescence des Dossiers

```
scp-app/
├── src/
│   ├── desktop/                      # 🖥️ ESPACE BUREAU (DÉDIÉ DESKTOP)
│   │   ├── DesktopApp.tsx            # Composant racine de la vue Bureau
│   │   └── components/               # Composants spécifiques à l'expérience Bureau
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
│   │       └── DeviceSwitcherBadge.tsx # Badge tactique permettant de basculer Bureau ⇄ Mobile
│   │
│   ├── components/                   # Modales et composants graphiques partagés
│   │   ├── VoiceStudioModal.tsx      # Studio de personnalisation des voix Edge Neural
│   │   ├── FavoritesModal.tsx        # Modale de gestion des favoris
│   │   ├── ScipnetExplorerModal.tsx  # Explorateur SCiPNET style rétro
│   │   ├── EntityDetailModal.tsx     # Dossier détaillé des entités de départements
│   │   ├── BandeauEntites.tsx        # Rattachements d'un dossier (site, FIM, GdI, personnel)
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
   - Un bouton flottant discret en haut à droite `[SWITCH ⇄]` permet de forcer la vue Bureau sur mobile ou la vue Mobile sur un grand écran pour faciliter le test et le débogage.
   - Le choix est sauvegardé dans le `localStorage` sous la clé `scp_device_mode`.

---

## 🛠️ Instructions de maintenance pour Gemini et Claude

### Pour ajouter une fonctionnalité sur Desktop :
- Ouvrir `src/desktop/DesktopApp.tsx` ou créer des sous-composants dans `src/desktop/components/`.
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
- Les deux versions (Desktop et Mobile) bénéficieront automatiquement de l'amélioration sans régression visuelle !
