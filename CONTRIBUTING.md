# Contribuer

Merci de passer par ici. Ce projet est un projet de fan, en français, et toute
aide est la bienvenue — y compris un simple rapport de bug, qui est souvent la
contribution la plus utile.

## Signaler un problème

Trois gabarits d'issue existent ; choisissez celui qui correspond. Pour un
problème de **lecture audio**, les quatre informations qui permettent presque
toujours de reproduire sont :

1. le **numéro du SCP** (par exemple `SCP-173` ou `SCP-5618`) ;
2. la **langue** de la branche ;
3. la **voix** et le rôle concernés ;
4. la **plateforme** : navigateur et version, ou application Android.

Une phrase sur ce que vous entendiez et ce que vous attendiez suffit pour le
reste.

## Mettre en place l'environnement

```bash
npm install
npm run dev
```

Node 20 minimum. Aucune clé d'API n'est nécessaire, et aucune ne doit jamais
arriver dans ce dépôt : tout le code ici est public.

## Les règles du projet

Elles viennent toutes d'un bug déjà payé au moins une fois.

### La séparation en trois espaces

| Ce que vous changez | Où vous écrivez |
|---|---|
| l'interface ordinateur | `src/desktop/` |
| l'interface téléphone | `src/mobile/` |
| la logique métier (audio, API, favoris) | `src/shared/`, `src/services/`, `src/types/` |

`src/components/` est partagé : une modification là se voit sur les deux
plateformes, vérifiez les deux. Ne cassez pas la frontière pour « factoriser » —
et préférez une correction dans `src/services/`, qui profite aux deux, à un
correctif dupliqué.

### `npm run build` est le seul filet

Il n'y a **ni tests, ni ESLint, ni Prettier**, et ce n'est pas un oubli.
`tsc -b` tourne en mode `strict` : lancez `npm run build` avant d'annoncer qu'un
changement est terminé. N'ajoutez pas de cadriciel de test sans que ce soit
demandé.

### Lancez `npm run audit` si vous touchez au parsing

Toute modification de `src/services/scriptParser.ts` ou de
`src/services/cromApi.ts` doit être suivie de `npm run audit`. Le script compare
la page officielle du wiki à ce que l'application lira réellement, et il sort en
code ≠ 0 s'il détecte une duplication ou une perte. Il a déjà attrapé deux
régressions que le typecheck ne voyait pas. Son cache disque fait que le second
passage ne refait aucun appel réseau.

Visez **zéro duplication et zéro défaut de parsing** — pas 100 % de couverture
des mots : le bandeau de navigation et le bloc de crédits ne *doivent pas* être
lus.

### Ne jamais ajouter une règle de prononciation sans l'avoir mesurée

`node scripts/probe-speech.mjs` fait lire au moteur la forme écrite puis la forme
voulue et compare les deux audios. Durées égales ⇒ le moteur prononçait déjà
correctement ⇒ la règle serait du code mort. C'est ainsi qu'on sait que les
dates, les heures, les ordinaux et les pourcentages n'ont besoin de rien.

Et une mesure sur une seule voix ne vaut pas pour les douze : `--voices` rejoue
la table sur tout le catalogue. Dix des douze voix ne sont pas nativement
françaises.

### Conventions

- Le code, l'interface et les commentaires sont **en français**.
- État global : le hook `useScpApp()`. Pas de Redux, pas de Zustand.
- Données distantes : **TanStack Query uniquement**, jamais un `fetch` dans un
  `useEffect`.
- `speechEngine` et `sfx` sont des **singletons** exportés, pas des hooks.
- Persistance : toujours via `storageService`, jamais `localStorage` en direct.
  Les clés sont versionnées : si la forme des données change, incrémentez le
  suffixe et gérez l'ancienne valeur.
- Mobile : cibles tactiles de 44 × 44 px minimum, aucun débordement horizontal,
  actions principales dans la barre basse ou le mini-lecteur.

## Pull requests

- Une PR par sujet, avec un titre en français décrivant l'effet, pas la solution.
- Dites comment vous avez vérifié : quel dossier SCP, quelle langue, quelle
  plateforme.
- `npm run build` doit passer ; la CI le relance de toute façon.
- Ne committez ni `dist/`, ni `graft/`, ni de clé, ni de keystore. Un hook
  `pre-commit` est fourni, activez-le une fois pour toutes :

  ```bash
  git config core.hooksPath .githooks
  ```

## Code de conduite

Ce projet suit le [code de conduite](CODE_OF_CONDUCT.md). En participant, vous
acceptez de le respecter.
