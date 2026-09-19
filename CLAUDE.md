# SCP Audio Roleplay — instructions projet

App React 19 + Vite qui lit les dossiers SCP à voix haute avec plusieurs voix
(narrateur, chercheur, anomalie, classe-D…), en mode roleplay Fondation.

## Commandes

```bash
npm run dev       # développement, avec /api/tts
npm run build     # tsc -b && vite build
npm run serve     # sert dist/ AVEC /api/tts — c'est la vraie version de production
npm run preview   # sert dist/ SANS /api/tts : voix du navigateur uniquement

# Audit de fidélité audio : compare la page officielle à ce qui sera lu.
npm run audit                                          # échantillon
node scripts/audit-coverage.mjs --prefix scp-6 --limit 50
node scripts/audit-coverage.mjs --slugs scp-5618,scp-6747

# Répertoire d'entités : départements, personnel, factions, sites, zones, FIM.
npm run entities:profil                                # tags de type des 10 branches
npm run entities:repertoire                            # src/data/entities.json
npm run entities                                       # arêtes en puis fr
node scripts/build-entities.mjs --lang ru              # une autre branche
node scripts/build-entities.mjs --lang fr --limit 800  # échantillon, pour vérifier
node scripts/build-entities.mjs --reconcilier          # rapport sur departmentsData.ts
node scripts/build-entities.mjs --iconiques --lang fr  # régénère ICONIC_SCPS

# Sonde de prononciation : le moteur lit-il DÉJÀ cette forme correctement ?
node scripts/probe-speech.mjs                          # toute la table
node scripts/probe-speech.mjs --only titre/            # un groupe de sondes
node scripts/probe-speech.mjs --acronyms               # balayage des sigles
node scripts/probe-speech.mjs --voices --only titre/   # la même table sur les 12 voix
node scripts/probe-speech.mjs --homographs             # mots à double prononciation
node scripts/probe-speech.mjs --keep tmp/audio         # garder les MP3 pour écouter
```

**N'ajoute jamais une règle de prononciation sans l'avoir mesurée avec
`probe-speech.mjs`.** Il fait lire au moteur la forme écrite puis la forme voulue
et compare la durée des deux audios : durées égales ⇒ le moteur prononçait déjà
bien ⇒ la règle serait du code mort. C'est ainsi qu'on a établi que les dates,
les heures composées, les ordinaux, les unités, les pourcentages et `n°` n'ont
besoin de rien — et que `SCP-608-FR` était, lui, prononcé « SCP tiret 608 tiret
FR ». Les verdicts sont consignés dans `src/services/speechLexicon.ts`.

**Une mesure sur Rémy ne vaut pas pour les douze voix.** Dix des douze voix du catalogue
ne sont pas nativement françaises. `--voices` rejoue la table sur toutes et liste les
divergences : c'est ainsi qu'on a découvert que « Dr », « Dre », « Lt », « Mme » et
« Col. », écartés d'après Rémy seul, sont mal lus par une partie du catalogue. Quand une
règle diverge, applique-la partout plutôt que de la conditionner à une voix — un verdict
« déjà lu » signifie que les deux formes produisent le même audio, donc la forme développée
ne coûte rien à celles qui savaient déjà.

L'audit compte aussi les **défauts de prononciation** (tiret de désignation,
abréviation de titre, bloc caviardé, heure sans minutes qui atteindraient encore
le moteur). Vise zéro : c'est le filet des règles de `speechText.ts`, que ni la
couverture ni la duplication ne voient, puisque le mot est bien lu — seulement
mal dit.

**Lance l'audit après toute modification de `scriptParser.ts` ou `cromApi.ts`.**
Il sort en code ≠ 0 s'il détecte une duplication ou un défaut de parsing, et son
cache disque (`scripts/.audit-cache/`) fait que le second passage ne refait
aucun appel réseau — c'est prévu pour itérer. Il a déjà attrapé deux régressions
que le typecheck ne voyait pas.

Vise **zéro duplication et zéro défaut de parsing**, pas 100 % de couverture des
mots : le bandeau de navigation, le bloc crédits et les noms de fichiers d'images
ne *doivent pas* être lus. C'est pourquoi le rapport sépare « contenu » de
« chrome ».

Il n'y a **ni tests, ni ESLint, ni Prettier**. Avant de dire qu'un changement est
terminé, lance `npm run build` : `tsc -b` en mode `strict` est le seul filet.
N'ajoute pas de framework de test sans que ce soit demandé.

**L'anglais classe, les traductions héritent.** `build-entities.mjs` construit le
répertoire d'entités sur la branche anglaise, puis chaque autre branche hérite des
rattachements de son original via `translationOf`. Ce n'est pas une commodité : mesuré
sur les dix branches, **44 à 72 % des arêtes viennent de l'héritage**, et il est le
SEUL rattachement de 863 dossiers français, 1 398 russes, 2 865 chinois. La raison est
que les motifs d'extraction sont écrits dans la langue de la branche — « Зона-19 »
n'est pas « Site-19 ». D'où l'ordre imposé : `--lang en` d'abord, le script refuse les
autres branches sans lui plutôt que de produire un index appauvri en silence.

**Le tag `scp` n'existe pas sur toutes les branches.** La branche russe compte 4 653
dossiers tagués `объект` et `tags: { eq: 'scp' }` y renvoie **0**. C'est pourquoi
`branchProfiles.json` est découvert (`--profil`) et non supposé. `build-index.mjs`
code encore `scp` en dur : ne lui passe pas `--lang ru` sans lire le profil d'abord.

**Ne réintroduis pas de liste de dossiers écrite à la main.** `iconicScps` et
`ICONIC_SCPS` étaient saisis — notes à 12 850 pour un corpus dont le 95e centile est à
33. Tout vient maintenant de Crom ou du wiki. `src/data/departmentsData.ts` reste le
calque **éditorial** (lore, devise, directeur, couleurs), relié au répertoire par
`entiteId` ; ses listes de dossiers, elles, viennent de `entityService`.

**Les quatre certitudes ne se mélangent pas.** `t` (tag), `a` (annuaire) et `o`
(origine) sont des liens que la communauté a écrits ; `m` (mention) est une inférence
sur le texte. L'UI les distingue, et c'est ce qui l'empêche de redevenir une liste
d'apparence factuelle qui ne l'est pas. Environ la moitié des dossiers n'a aucune
entité : c'est une propriété du corpus, pas un défaut du pipeline.

## Règle d'or : trois espaces séparés

L'app est volontairement scindée. Respecte la frontière, c'est la contrainte
structurante du projet :

| Demande de l'utilisateur | Tu modifies UNIQUEMENT |
|---|---|
| « sur ordinateur / desktop » | `src/desktop/` |
| « sur mobile / téléphone » | `src/mobile/` |
| logique métier commune (audio, API, favoris) | `src/shared/`, `src/services/`, `src/types/` |

`src/components/` contient les modales et effets visuels partagés par les deux
vues. Une modification là-dedans se voit sur desktop **et** mobile — vérifie les
deux avant de conclure.

Une correction dans `src/services/` profite aux deux plateformes : préfère-la à
un patch dupliqué dans `desktop/` puis `mobile/`.

## Pièges qui ont déjà coûté du temps

**Le service de synthèse d'Edge ne filtre QUE l'User-Agent.** C'est la contrainte qui
commande toute l'architecture audio, et elle a été mesurée par poignée de main TLS sur le
vrai service : un UA contenant `Edg/` obtient `101`, ceux de Chrome, de Firefox et de la
WebView Android obtiennent `403`. L'origine, les client hints et l'absence d'origine ne
changent rien. Comme une page ne peut pas falsifier son User-Agent sur un WebSocket, il en
découle trois chemins, tous implémentés dans `src/services/edgeTts.ts` :

| Contexte | Chemin | Pourquoi |
|---|---|---|
| Chrome, Firefox | `/api/tts` | le navigateur serait refusé en direct |
| Edge, WebView Android | WebSocket direct | l'UA passe déjà (`canSynthesizeDirectly()`) |
| Node (dev et serveur) | WebSocket direct | Node accepte `new WebSocket(url, { headers })` |

`capacitor.config.ts` force `overrideUserAgent` sur la WebView Android : c'est *la* ligne
qui rend les voix neurales possibles sur téléphone. Ne la retire pas.

**`npm run preview` n'a pas de `/api/tts`.** C'est le seul mode où la version buildée
retombe sur `speechSynthesis`. Pour tester la production, utilise `npm run serve`, qui sert
`dist/` et le point d'accès avec le même code que le mode développement
(`server/ttsHandler.ts`, partagé avec `ttsPlugin`).

**Seules les voix « Multilingual » sont utilisées.** Les voix Neural de première génération
(Henri, Denise, Eloise, Antoine, Gerard…) ont été retirées du projet : elles sonnent
nettement plus synthétiques. N'en réintroduis pas. Le catalogue français
(`src/types/neuralVoices.ts`) compte **12 voix**, dont seulement **deux nativement
françaises** (Rémy, Vivienne) — les dix autres sont des voix multilingues d'autres locales,
qui lisent le français avec une possible coloration d'accent. C'est pourquoi Rémy et
Vivienne sont réservées au narrateur et à l'intercom, les rôles les plus entendus.

Les voix sont référencées à **cinq** endroits : le catalogue et `DEFAULT_AI_ROLES_FR`
(`neuralVoices.ts`), les pools de timbres par personnage (`characterVoiceService.ts`), les
préréglages de `VoiceStudioModal.tsx`, le repli de `speechEngine.ts` et le défaut serveur
de `vite.config.ts`. Change-les toutes ou aucune.

**Toute note de bas de page est annoncée « Note : » à voix haute**, mais uniquement dans
le texte prononcé (`speechTextFor()` dans `speechEngine.ts`), jamais dans `segment.text`.
À l'écran le badge du locuteur suffit ; à l'oreille il n'existe pas, et sans cette annonce
la note s'enchaîne au paragraphe précédent sans qu'on puisse l'en distinguer.

**Un texte sans lettre ni chiffre fait échouer la synthèse** : « . », « , » et « … »
suffisent, le service ne renvoie alors aucun audio. `hasSpeakableContent()` garde les trois
couches (normalisation, moteur, point d'accès) — ne les retire pas.

**Python n'est plus nécessaire à l'application.** Le protocole d'edge-tts est réimplémenté
en TypeScript (`src/services/edgeTts.ts`), donc `/api/tts` ne lance plus de processus.
Seul `scripts/probe-speech.mjs` peut encore servir à comparer avec l'implémentation de
référence ; l'application, elle, n'a besoin de rien d'autre que Node.

**Les frontières de mots viennent avec l'audio.** Le service les renvoie dans le même flux
dès qu'on les demande (`wordBoundaries: true`). Elles servent à deux choses, et les deux
cesseraient de fonctionner si on repassait à un point d'accès qui ne renvoie que le MP3 :
le bip de censure placé à l'instant exact du caviardage (`censorSpansFrom`), et le suivi de
lecture mot à mot à l'écran (`wordAlignment.ts`, classe CSS `.mot-lu`).

**Crom veut des URLs en `http://`.** L'API GraphQL (`https://api.crom.avn.sh/graphql`)
indexe les pages Wikidot en `http://`. `cromApi.ts` fait un
`.replace(/^https:\/\//, 'http://')` avant chaque requête — ne le « corrige » pas,
la requête renverrait `null`.

**Le parseur de script est réglé au cas par cas.** `parseScpScript()`
(`src/services/scriptParser.ts`) contient des regex ajustées pour des plaintes
précises (répétition du numéro SCP, légendes d'images lues à voix haute…). Avant
de simplifier une regex, vérifie sur un vrai dossier que tu ne réintroduis pas le
bug qu'elle corrige. Teste au minimum un SCP français et un anglais : le parseur
prend `lang` et se comporte différemment.

**Certains dossiers ne sont pas une seule page.** Quand la source contient un
`[[module ListPages … offset="@URL|0"]]`, l'article est paginé et CROM ne rend que
la page 1 (cas de référence : SCP-5618). `cromApi.fetchFragments()` récupère les
pages restantes, gardées **séparées** dans `ScpItemDetail.fragments` : chaque page
a son propre bloc de notes numéroté à partir de 1, donc les concaténer avant de
parser enfouit la page 2 dans les notes de la page 1. Utilise `parseScpDossier()`,
jamais `parseScpScript()` directement, sauf pour une page unique.

**Les notes de bas de page doivent être lues à leur place.** CROM aplatit les
`[[footnote]]` en un chiffre nu collé au texte plus un pavé final. Le repérage des
marqueurs est un **balayage séquentiel** (note 1, puis 2, …), pas une regex
globale — un chiffre nu est indiscernable de « Site-19 » ou « 1 000 ». Ne
« simplifie » pas ça en regex. Une note dont le marqueur ne se place nulle part est
dite en fin de page, jamais perdue.

**La structure ne survit que dans la source : on l'ancre, on ne la devine pas.**
`textContent` aplatit tout ; `parseScpDossier()` relit la source (page 0) et
replace la structure dans les lignes par des **lignes marqueurs** `@@…@@`
(`@@NOTE`, `@@TABLEAU`, `@@ONGLET`, `@@TERMINAL`, `@@SAISIE`), ancrées par suites
de mots, **tout ou rien** : un ancrage raté laisse la lecture d'avant, jamais une
perte. Aucune passe de fusion ne touche une ligne `estMarqueur()`. Pour un nouveau
format de dossier, **ajoute** une extraction de ce type plutôt que de modifier les
règles existantes. Les cas couverts :

- `[[tabview]]` : CROM liste tous les titres d'un bloc puis les contenus ; chaque
  titre est replacé devant son onglet (SCP-2317, 97 dossiers FR). Le script YUI
  `//<![CDATA[…//]]>` qu'il laisse en fin de page est retiré **avant** le repérage
  des notes : ses identifiants hexadécimaux volaient des marqueurs.
- Terminal : citations `>` = système (voix « Terminal »), lignes `{{…}}` = saisies,
  dites par l'utilisateur de `NOM D'UTILISATEUR :`. Au moins 3 saisies, aucune entre
  crochets — SCP-482-FR met des `{{[DÉTAILS SUPPRIMÉS]}}` dans un entretien.
- Itérations : un dossier répété d'onglet en onglet se lit en entier (décision
  produit). L'audit tolère une répétition que la **même page** contient déjà.
- `[[html]]` : servi en iframe, **absent de textContent**. SCP-3125 y écrit tout son
  dossier ; l'app n'en lisait que l'aperçu caché. `lignesDuHtml()` garde le contenu
  révélable au clic (`collapsed`, `display:none` visé par un `onclick`), déchiffre
  le digicode (clé relue dans le script du bloc) et ignore boutons et scripts.
- `[[include component:preview]]` est en `display: none` mais présent dans
  textContent : retiré (`retirerApercuCache`).

**Les notes signées `[AF]` / `[SZ]` sont résolues automatiquement** en personnes
via `resolveInitialSignatories()`, pour que chaque annotateur ait sa propre voix.
La résolution ne s'appuie que sur ce que le document dit — n'ajoute jamais de
correspondance codée en dur pour un SCP précis. Si les initiales ne se résolvent
pas, on retombe sur « Note de bas de page » : c'est voulu, ça évite de prendre un
acronyme d'organisation (`[ACS]`, `[DAT]`) pour un personnage.

**Le contenu des dossiers vient d'un wiki communautaire**, pas d'une base figée.
Un dossier peut être vide, non traduit, ou avoir un balisage inattendu. Tout code
qui lit `textContent` doit tolérer l'absence de contenu.

## Conventions

- Le code, l'UI et les commentaires sont **en français**. Garde cette langue.
- État global : le hook `useScpApp()` (`src/shared/hooks/useScpApp.ts`). Pas de
  Redux/Zustand — n'en ajoute pas.
- Données distantes : **TanStack Query uniquement**. Pas de `fetch` dans un
  `useEffect` pour charger des données SCP.
- `speechEngine` et `sfx` sont des **singletons** exportés, pas des hooks. Ils
  gardent l'état de lecture hors de React ; ne les instancie pas dans un composant.
- Persistance : passe par `storageService`, jamais `localStorage` en direct.
  Clés existantes (`scp_audio_favorites_v1`, `scp_voice_profiles_v1`,
  `scp_recent_history_v1`, `scp_device_mode`) — versionnées : si tu changes la
  forme des données, incrémente le suffixe et gère l'ancienne valeur.
- Mobile : cibles tactiles ≥ 44×44 px, pas de débordement horizontal, actions
  principales dans `MobileBottomNav` ou `MobileMiniPlayer`.

## Orientation dans le code

Ce repo est indexé par **graft** (`graft/`). Pour trouver où vit un
comportement, qui appelle un symbole, ou ce qu'une modification casse, utilise
`graft ask` / `graft callers` / `graft grep` avant de lire les fichiers bruts —
c'est plus rapide et ça donne les arêtes que la lecture rate.

`ARCHITECTURE.md` décrit l'arborescence en détail si tu en as besoin.

## À ne pas faire

- Ne casse pas la séparation desktop/mobile pour « factoriser ».
- Ne commit pas `graft/` ni `dist/` (déjà ignorés).
- Ne mets pas de clé d'API dans le code client — tout ici est public.
- Ne remplace pas Edge TTS par un service payant sans qu'on te le demande.
