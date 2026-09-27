# Faire connaître le projet

Ce document ne relève pas de la technique : c'est la marche à suivre pour que le
dépôt soit trouvé, et les textes prêts à coller. Il complète
[PUBLICATION.md](PUBLICATION.md), qui traite du *déployer*, là où celui-ci traite
du *faire savoir*.

> **Un avertissement d'abord.** N'achetez jamais d'étoiles. Les comptes qui les
> produisent sont des bots, GitHub les détecte et les retire, et la pratique
> viole les conditions d'utilisation. Le seul coût réel n'est pas le compte
> supprimé : c'est la crédibilité du projet auprès des gens qui vérifient.

---

## 1. Ce qui est déjà fait

| Élément | État |
|---|---|
| Lien vers l'application en tête du README | ✅ premier élément visible |
| Sujets (*topics*) du dépôt | ✅ 15, dont `scp`, `text-to-speech`, `edge-tts` |
| Description et site dans « About » | ✅ |
| Licence, guide de contribution, code de conduite | ✅ |
| Gabarits d'issue | ✅ trois |
| Intégration continue visible (badge) | ✅ |
| Discussions | ✅ activées |
| Bannière d'aperçu social 1280 × 640 | ✅ générée — **reste à téléverser**, voir §2 |
| Release avec APK installable | ✅ à partir de `v1.1.0` |
| Aperçu d'un lien vers l'application | ✅ bannière en adresse absolue, grande carte (`summary_large_image`) |
| Aperçu propre à chaque dossier et à chaque langue | ✅ `middleware.ts` — titre, auteur, langue du lien |
| Bouton « Partager » dans les deux lecteurs | ✅ feuille native sur téléphone, copie ailleurs |
| `robots.txt`, `sitemap.xml`, lien canonique | ✅ générés au build, 650 adresses dans le plan |
| Mesure d'audience de l'application | ⚙️ en place — **reste à activer**, voir §2 |

## 2. Les gestes qui demandent une interface web

Aucun de ceux-là ne passe par une API : ils se font à la main, une fois.

1. **Aperçu social du dépôt.** Réglages → *Social preview* → *Edit* → téléverser
   `public/icones/banniere-sociale.png`. Sans lui, un lien vers le dépôt collé
   dans une conversation affiche l'avatar générique de GitHub ; avec lui, la
   bannière. (Les liens vers l'*application*, eux, ont déjà la leur.)
2. **Issues « good first issue ».** Ouvrez-en trois ou quatre, petites et
   décrites (une correction de prononciation, une amélioration d'affichage
   mobile, une branche linguistique à vérifier). Un dépôt sans porte d'entrée
   pour un premier contributeur n'en reçoit pas.
3. **Mesure d'audience.** Vercel → le projet → *Analytics* → *Enable*. Le script
   est déjà posé dans les builds faits par Vercel, et seulement là ; tant que ce
   bouton n'est pas pressé, il répond 404 et rien n'est compté. Sans cookie, donc
   sans bandeau de consentement. C'est la seule façon de savoir quel canal a
   amené des visiteurs à l'**application** : GitHub ne compte que le dépôt.
4. **Moteurs de recherche.** [Google Search Console](https://search.google.com/search-console)
   → propriété « Préfixe de l'URL » `https://scp-audio-roleplay.vercel.app/` →
   vérification par balise HTML (collez-moi la balise, je l'ajoute) → *Sitemaps* →
   `sitemap.xml`. Puis [Bing Webmaster Tools](https://www.bing.com/webmasters),
   qui sait importer la propriété depuis Google en un clic. Bing alimente aussi
   DuckDuckGo et la recherche de plusieurs assistants IA.
5. **Vérifier l'aperçu une fois déployé**, avant de poster quoi que ce soit :

   ```bash
   curl -s -A Discordbot "https://scp-audio-roleplay.vercel.app/?scp=scp-3008" | grep og:title
   ```

   doit répondre « SCP-3008 — A Perfectly Normal, Regular Old IKEA ». Puis collez
   le même lien dans une conversation Discord avec vous-même : la carte doit
   montrer la bannière, ce titre et l'auteur. Un aperçu raté au moment de
   l'annonce ne se rattrape pas — la plupart des plateformes le gardent en cache.

## 3. Où le dire, et quand

L'algorithme de GitHub Trending classe sur les étoiles gagnées dans une **fenêtre
courte**. Quatre-vingts étoiles en un jour pèsent plus que trois cents étalées sur
un mois : **groupez les annonces le même jour** plutôt que de les espacer.

| Endroit | Quand | Remarque |
|---|---|---|
| **Hacker News** (*Show HN*) | mardi à jeudi, 8 h–10 h à New York (14 h–16 h à Paris) | le titre ne doit pas être une accroche publicitaire |
| **Reddit** — r/SCP, r/scpsecretlab | en soirée européenne | c'est le public le plus directement concerné |
| **Reddit** — r/webdev, r/reactjs, r/opensource | même jour | l'angle y est technique, pas thématique |
| **Dev.to / Hashnode** | le même jour, article de fond | le contenu continue de ramener du monde des mois après |
| **Communautés SCP francophones** (Discord de la branche FR) | à part | demandez d'abord aux modérateurs |
| **Awesome-lists** | quand le projet a quelques étoiles | `awesome-tts`, `awesome-react-components` |

Sur Reddit, lisez les règles de chaque sous-forum : plusieurs interdisent
l'autopromotion sans participation préalable, et un lien supprimé par un
modérateur coûte plus qu'il ne rapporte.

---

## 4. Les textes, prêts à coller

### Show HN (titre puis premier commentaire)

> **Show HN: I built a multi-voice audiobook reader for the SCP wiki**

> Every SCP file is written by several people — a containment procedure, an
> interview transcript, a handwritten margin note, an incident report. Reading
> them aloud with one voice flattens all of that, so I wrote a reader that
> assigns a different neural voice to each role: narrator, researcher, the
> anomaly itself, the D-class, the site intercom.
>
> A few things I did not expect going in:
>
> - Microsoft's Edge speech service filters on **User-Agent alone**. I measured
>   it with TLS handshakes: a UA containing `Edg/` gets a `101`, Chrome, Firefox
>   and the Android WebView all get `403`. Origin and client hints change
>   nothing. A web page cannot forge its User-Agent on a WebSocket, so the whole
>   audio architecture follows from that one fact — three code paths, and an
>   `overrideUserAgent` line in the Capacitor config is the only reason neural
>   voices work on a phone at all.
> - Redacted blocks needed to *sound* redacted. The service returns word
>   boundaries in the same stream as the audio, so the censor beep lands on the
>   exact millisecond the text goes black.
> - Footnotes are the hard part. The API flattens them into a bare digit glued to
>   the text plus a block at the end — and a bare digit is indistinguishable from
>   "Site-19" or "1,000". It has to be a sequential scan, never a regex.
>
> No API key anywhere, no account, no cookies, the wiki text is fetched live
> in ten languages. Code is MIT, the SCP content stays CC BY-SA 3.0 and every
> file carries its author credit — which the licence requires and which I had
> initially got wrong.
>
> Live: https://scp-audio-roleplay.vercel.app
> Code: https://github.com/atari643/scp-audio-roleplay

### Avant de poster sur r/SCP — quatre règles qui touchent ce projet

| Règle | Ce qu'elle impose ici |
|---|---|
| **9 — No AI generated content** | « images, text, etc. » et « AI-edited text », sous peine de bannissement permanent. **Réécris le texte ci-dessous avec tes mots** : tel quel, c'est du texte écrit par une IA. Et surtout, l'application *est* de la synthèse vocale neurale — envoie un modmail aux modérateurs avant de poster, la réponse coûte deux phrases et évite un bannissement. |
| **4 — No roleplaying** | La règle s'ouvre sur « This is not the subreddit for SCP Roleplay! ». N'écris jamais le mot dans le post : c'est un **lecteur multi-voix**. Ne montre pas non plus de capture de la séquence de démarrage ou de l'avertissement mémétique. |
| **3 — Overdone** | Les posts non artistiques sur 049, 096, 173 et 682 vont dans un fil dédié. Le lien de démonstration vise donc **SCP-3008**, qui contient des entretiens — c'est lui qui montre ce que l'app fait de particulier. |
| **8 — Pas de média le jeudi** | Un lien avec vignette compte comme média. Poste mardi, mercredi ou du vendredi au dimanche, **heure de New York**. |

Les règles 1, 2, 5, 6, 7 et 10 ne posent pas de problème : une adaptation du wiki
est explicitement autorisée, les branches internationales aussi, un site web n'est
pas un « social space », et l'application crédite déjà chaque auteur.

### Reddit — r/SCP (anglais)

> **I built a free site that reads SCP articles out loud, with a different voice for each speaker**

> Not one flat TTS voice for the whole article. The narrator reads the file, the
> researcher reads the containment procedure, the anomaly answers in the
> interview logs, the Class-D panics, the site intercom cuts in.
>
> Three things I spent most of the time on:
>
> - **Redacted blocks are never read.** They become a censor beep, on the exact
>   millisecond the text goes black.
> - **Footnotes are spoken where their marker sits**, not dumped at the end.
> - **Tab blocks, terminal logs and interview transcripts keep their structure**,
>   which is normally lost the moment the article is flattened into plain text.
>
> Ten branches — EN, FR, ES, DE, IT, PL, RU, JA, KO, ZH — with articles pulled
> live from the wikis, so nothing is a stale copy.
>
> Free, no account, no ads, nothing to install, source is open.
>
> → https://scp-audio-roleplay.vercel.app
> → Straight into SCP-3008: https://scp-audio-roleplay.vercel.app/?scp=scp-3008
>
> Unofficial fan project, no money in it. The voices are Microsoft's neural
> text-to-speech; no article text is generated, the wiki's own words are read as
> written. Every article shows its author, its translator, the source link and
> the CC BY-SA 3.0 licence.
>
> If one reads badly, tell me the number — that's usually all I need.

### Reddit — communauté francophone

> **J'ai fait un site gratuit qui lit les dossiers SCP à voix haute, une voix par personnage**

> Pas une voix de synthèse qui débite tout d'un bloc. Le narrateur pose le
> dossier, le chercheur donne la procédure de confinement, l'anomalie répond dans
> les entretiens, le Classe-D panique, l'intercom du site coupe la parole.
>
> Trois choses qui m'ont pris l'essentiel du temps :
>
> - **Les blocs caviardés ne sont jamais lus.** Ils deviennent un bip, placé
>   exactement là où le texte est noirci.
> - **Les notes de bas de page sont dites à leur place**, pas entassées à la fin.
> - **Les onglets, les journaux de terminal et les entretiens gardent leur
>   structure**, normalement perdue dès que l'article est aplati en texte brut.
>
> Dix branches — FR, EN, ES, DE, IT, PL, RU, JA, KO, ZH — les dossiers sont lus
> en direct depuis les wikis, rien n'est une copie figée.
>
> Gratuit, sans compte, sans publicité, rien à installer, code ouvert.
>
> → https://scp-audio-roleplay.vercel.app/?lang=fr
> → Directement SCP-3008 : https://scp-audio-roleplay.vercel.app/?scp=scp-3008&lang=fr
>
> Projet de fan, non officiel, sans revenu. Les voix sont de la synthèse neurale
> Microsoft ; aucun texte d'article n'est généré, ce sont les mots du wiki lus
> tels quels. Chaque dossier affiche son auteur, son traducteur, le lien vers la
> source et la licence CC BY-SA 3.0.
>
> Si un dossier se lit mal, dites-moi lequel — le numéro suffit en général.

### Dev.to — angle technique (titre suggéré)

> **The speech service that only checks your User-Agent — and the three code
> paths that follow**

Racontez la mesure, pas le produit : la poignée de main TLS, le `101` contre le
`403`, pourquoi une page ne peut pas mentir sur un WebSocket, et comment la
WebView Android le peut. Le lien vers le dépôt se place à la fin, une seule fois.
Un article qui apprend quelque chose est lu ; une annonce ne l'est pas.

---

## 5. Après l'annonce

- **Insights → Traffic** donne les vues, les visiteurs uniques et les sites
  référents sur quatorze jours. C'est la seule façon de savoir quel canal a
  réellement rapporté au **dépôt**, et la fenêtre est glissante : relevez-la,
  elle s'efface.
- **Vercel → Analytics** donne la même chose pour l'**application** : pages,
  sites référents, pays, appareils. C'est là qu'on voit si Reddit a amené plus
  d'auditeurs que Hacker News.
- **Vercel → Usage**, le jour même : chaque phrase lue est un appel au relais de
  synthèse. Le plan gratuit se met en pause s'il est dépassé — il ne facture
  rien. Pointer toutes les annonces vers le **même** dossier aide : ses phrases,
  déjà synthétisées une fois, sont servies depuis le cache du réseau.
- Répondez à **toutes** les issues dans les 24 h, même par « pas tout de suite ».
- Une annonce sans suite retombe. Un rythme de publication, même lent, retient
  les gens qui ont mis une étoile.

## 6. Les liens à partager

Depuis les liens profonds, **un lien ouvre la bonne branche**. C'est la
différence entre un anglophone qui tombe sur un catalogue français et un
anglophone qui tombe sur ce qu'il cherchait.

| À partager | Lien |
|---|---|
| Accueil, **anglais** (défaut) | `https://scp-audio-roleplay.vercel.app` |
| Accueil, français | `https://scp-audio-roleplay.vercel.app/?lang=fr` |
| Un dossier précis, anglais | `…/?scp=scp-3008` |
| Un dossier précis, français | `…/?scp=scp-3008&lang=fr` |

Un lien qui **vise un dossier** saute la séquence de démarrage et ouvre
directement le dossier : c'est celui qu'il faut poster, parce que le visiteur
entend l'application dans les deux secondes au lieu d'attendre dix.

**L'anglais est la langue par défaut** : l'adresse nue ouvre l'application en
anglais, interface comprise. C'est le français qui doit désormais se déclarer.
La langue choisie est ensuite mémorisée, mais un `?lang=` dans le lien prime
toujours sur elle — un lien partagé s'ouvre dans SA langue, pas dans celle du
visiteur. Le bouton « Partager » des lecteurs écrit donc toujours la langue, même
l'anglais (`?scp=scp-3008&lang=en`) : sans elle, la langue mémorisée du visiteur
l'emporterait.

Ces liens ont **leur propre aperçu** : collé dans Discord ou Reddit, `?scp=scp-3008`
affiche le titre du dossier et son auteur, `?lang=fr` un titre et une description
en français. C'est le middleware (`middleware.ts`) qui les écrit pour les robots
d'aperçu, qui n'exécutent pas le JavaScript.

## 7. Ce qui manque encore au produit

- **Une démonstration visuelle.** Les dépôts qui montrent le produit en
  mouvement — un GIF de trente secondes, pas davantage — obtiennent nettement
  plus d'engagement qu'une description, si bonne soit-elle. Il en faut un dans le
  README, au-dessus du pli. C'est l'issue #12.
