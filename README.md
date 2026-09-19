<div align="center">

<img src="public/icones/icone-192.png" alt="" width="96" height="96">

# SCP Audio Roleplay

**Les dossiers de la Fondation SCP, lus à voix haute — avec une voix par personnage.**

### ▶︎ [Ouvrir l'application](https://scp-audio-roleplay.vercel.app)

*Rien à installer, rien à créer : un dossier s'ouvre et se met à parler.*

[![CI](https://github.com/atari643/scp-audio-roleplay/actions/workflows/ci.yml/badge.svg)](https://github.com/atari643/scp-audio-roleplay/actions/workflows/ci.yml)
[![Licence MIT](https://img.shields.io/badge/licence-MIT-informational)](LICENSE)
[![Contenu CC BY-SA 3.0](https://img.shields.io/badge/contenu-CC%20BY--SA%203.0-lightgrey)](NOTICE-SCP.md)
[![React 19](https://img.shields.io/badge/React-19-61dafb)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646cff)](https://vitejs.dev)

</div>

---

Un dossier SCP n'est pas un texte lisse : c'est une procédure de confinement, un
entretien, une note manuscrite en marge et un rapport d'incident, écrits par des
gens différents. Cette application le lit comme tel. Le narrateur pose le
dossier, le chercheur donne la procédure, l'anomalie répond dans l'entretien, le
Classe-D crie, l'intercom du Site-19 coupe la parole à tout le monde.

Elle ne stocke aucun dossier : elle interroge le wiki SCP en direct, dans dix
branches linguistiques, et met le résultat en voix.

## Ce que ça donne à l'oreille

Un extrait d'entretien, tel que l'application le découpe et le distribue — chaque
ligne sort d'une voix différente, et le badge du locuteur suit à l'écran :

| Voix | Ce qu'on entend |
|---|---|
| **Narrateur** (Rémy) | « Objet SCP cent soixante-treize. Classe : Euclide. » |
| **Intercom du Site-19** (Vivienne) | « Procédure de confinement en cours. Personnel non essentiel, évacuez. » |
| **Chercheur** | « Le sujet est animé et extrêmement hostile… » |
| **Classe-D** | « Vous voulez que j'entre **là-dedans** ? » |
| **Terminal** | *bip* « Accès refusé. Accréditation ██ requise. » *bip* |

Le caviardage n'est pas lu : il devient un **bip de censure**, placé à la
milliseconde exacte où le texte est noirci. Les notes de bas de page sont dites
**à l'endroit de leur appel**, pas reléguées à la fin, et annoncées « Note : »
pour qu'on les distingue du paragraphe.

## Ce qu'elle fait

- **Douze voix neurales françaises** attribuées par rôle — narrateur, chercheur,
  anomalie, Classe-D, agent de terrain, intercom, terminal.
- **Découpage automatique du dossier** : les onglets, les tableaux, les terminaux,
  les notes de bas de page et les blocs caviardés sont reconnus dans la source du
  wiki et lus à leur place, pas à la fin.
- **Suivi de lecture mot à mot** à l'écran, calé sur les frontières de mots que
  renvoie le service de synthèse.
- **Bip de censure** placé à l'instant exact du caviardage.
- **Dix branches linguistiques** et un répertoire d'entités (départements, sites,
  factions, FIM, personnel) construit depuis le wiki, jamais saisi à la main.
- **Deux interfaces distinctes**, une pour l'ordinateur et une pour le téléphone,
  qui partagent la même logique métier.
- **Application Android** empaquetée avec Capacitor, voix neurales incluses.

## Démarrer

```bash
git clone https://github.com/atari643/scp-audio-roleplay.git
cd scp-audio-roleplay
npm install
npm run dev            # http://localhost:5173
```

Node 20 ou plus récent. **Aucune clé d'API à fournir** : ni le service de
synthèse, ni l'API Crom n'en demandent, et le dépôt ne contient aucun secret.

### Les commandes qui comptent

| Commande | Ce qu'elle fait |
|---|---|
| `npm run dev` | Développement, avec `/api/tts` — voix neurales. |
| `npm run build` | `tsc -b` en mode strict puis `vite build`. **C'est le seul filet du projet.** |
| `npm run serve` | Sert `dist/` **avec** `/api/tts` : la vraie version de production. |
| `npm run preview` | Sert `dist/` **sans** `/api/tts` : voix du navigateur uniquement. |
| `npm run audit` | Compare la page officielle à ce qui sera lu (pertes, duplications, défauts de prononciation). |
| `npm run icones` | Régénère toutes les icônes et les écrans de démarrage depuis le sceau. |
| `npm run cap:sync` | Build + synchronisation du projet Android. |

> **`preview` n'est pas `serve`.** `vite preview` ne connaît pas le point d'accès
> `/api/tts`, donc la version buildée y retombe sur `speechSynthesis` et toutes
> les voix se ressemblent. Pour entendre ce que l'application fait vraiment,
> utilisez `npm run serve`.

## Comment la voix arrive jusqu'à l'oreille

C'est la contrainte qui commande toute l'architecture audio, et elle a été
mesurée sur le vrai service : **la synthèse d'Edge ne filtre que l'User-Agent.**
Un agent contenant `Edg/` obtient une connexion ; ceux de Chrome, de Firefox et
de la WebView Android sont refusés. Une page web ne peut pas mentir sur son
User-Agent dans un WebSocket — d'où trois chemins, tous dans
[`src/services/edgeTts.ts`](src/services/edgeTts.ts) :

| Contexte | Chemin | Pourquoi |
|---|---|---|
| Chrome, Firefox, en local | `/api/tts` | le navigateur serait refusé en direct |
| Chrome, Firefox, sur le miroir Pages | relais Vercel, via `VITE_TTS_ENDPOINT` | Pages est statique : il n'exécute aucune fonction |
| Edge, WebView Android | WebSocket direct | l'agent passe déjà |
| Node (dev, serveur, fonction serverless) | WebSocket direct | Node peut poser ses en-têtes |

Quand aucun de ces chemins n'aboutit, l'application retombe sur les voix du
navigateur, le signale dans le lecteur (« VOIX DE SECOURS ») et répartit malgré tout
des voix **différentes** entre les rôles — au lieu de lire les sept personnages avec
la même.

Sur Android, c'est `overrideUserAgent` dans
[`capacitor.config.ts`](capacitor.config.ts) qui rend les voix neurales
possibles. C'est une ligne, et sans elle le téléphone parle avec la voix système.

## Déploiement

### Vercel — recommandé

La fonction [`api/tts.ts`](api/tts.ts) réexporte le même gestionnaire que le
serveur local, donc **les voix neurales fonctionnent dans tous les navigateurs**.
Rien à configurer : pas de variable d'environnement, pas de secret.

```bash
npm i -g vercel
vercel          # aperçu
vercel --prod   # production
```

La configuration vit dans [`vercel.json`](vercel.json).

### GitHub Pages — miroir de démonstration

Pages ne sait pas exécuter de fonction. Le site y est donc publié avec
`VITE_TTS_ENDPOINT` pointant sur le déploiement Vercel, ce qui lui rend les voix
neurales ; sans cette variable, Chrome et Firefox retombent sur les voix du
navigateur (Edge, lui, garde le neural). Tout est dans
[`.github/workflows/pages.yml`](.github/workflows/pages.yml).

### Android

```bash
npm run cap:sync        # build web + synchronisation
npm run android:debug   # APK de test
```

La marche à suivre complète jusqu'au Play Store — keystore, AAB, fiche, politique
de confidentialité — est dans **[PUBLICATION.md](PUBLICATION.md)**.

## Architecture en trois espaces

La séparation est volontaire et c'est la contrainte structurante du projet :

```
src/
├── desktop/     interface ordinateur
├── mobile/      interface téléphone
├── shared/      état et composants communs aux deux
├── components/  modales et effets visuels partagés
├── services/    métier : synthèse, parsing, API Crom, stockage
└── data/        index de corpus et répertoires d'entités (générés)
```

Une modification « sur mobile » ne touche que `src/mobile/`. Une correction dans
`src/services/` profite aux deux. [`ARCHITECTURE.md`](ARCHITECTURE.md) détaille
l'arborescence, [`CLAUDE.md`](CLAUDE.md) les pièges déjà rencontrés.

## Contribuer

Les retours sont la raison d'être de ce dépôt public. Trois gabarits d'issue sont
prêts : **problème de lecture audio**, **problème d'affichage mobile**,
**idée de fonctionnalité**. Un rapport utile mentionne le numéro du SCP, la
langue, la voix et la plateforme — c'est presque toujours reproductible avec ça.

Avant d'ouvrir une pull request, lisez [CONTRIBUTING.md](CONTRIBUTING.md) : le
projet n'a ni tests ni ESLint, `npm run build` est le seul filet, et quelques
règles précises évitent de réintroduire des bugs déjà corrigés.

Une **question**, une idée, un dossier qui se lit mal sans que ce soit un bug ?
Les [Discussions](https://github.com/atari643/scp-audio-roleplay/discussions) sont
ouvertes.

## Licence et attribution

Le **code** est sous [licence MIT](LICENSE).

Le **contenu** des dossiers appartient au wiki communautaire de la Fondation SCP
et reste sous licence **CC BY-SA 3.0** : voir [NOTICE-SCP.md](NOTICE-SCP.md).
Projet de fan, non officiel, sans revenu.
