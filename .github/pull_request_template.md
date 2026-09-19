# Ce que change cette PR

<!-- Une ou deux phrases sur l'effet, pas sur la solution. -->

## Pourquoi

<!-- Le bug rencontré, ou le manque comblé. Lien vers l'issue s'il y en a une. -->

## Espace touché

- [ ] `src/mobile/` — interface téléphone
- [ ] `src/desktop/` — interface ordinateur
- [ ] `src/shared/`, `src/services/`, `src/types/` — logique commune
- [ ] `src/components/` — partagé : **vérifié sur les deux plateformes**
- [ ] Dépôt, documentation, CI

## Vérifications

- [ ] `npm run build` passe (c'est le seul filet du projet)
- [ ] `npm run audit` lancé **si** `scriptParser.ts` ou `cromApi.ts` a été touché
- [ ] `probe-speech.mjs` a mesuré la règle **si** une prononciation a été ajoutée
- [ ] Aucune clé, aucun keystore, aucun `dist/` dans le diff

## Comment vous l'avez essayé

<!-- Quel dossier SCP, quelle langue, quelle plateforme. -->
