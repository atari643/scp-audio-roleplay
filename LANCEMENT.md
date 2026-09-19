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

## 2. Les deux gestes qui demandent l'interface web

GitHub n'expose pas d'API pour ces deux-là.

1. **Aperçu social.** Réglages → *Social preview* → *Edit* → téléverser
   `public/icones/banniere-sociale.png`. Sans lui, un lien collé dans une
   conversation n'affiche qu'une URL nue ; avec lui, il affiche la bannière, le
   titre et la description. C'est la différence entre un lien qu'on ignore et un
   lien qu'on ouvre.
2. **Issues « good first issue ».** Ouvrez-en trois ou quatre, petites et
   décrites (une correction de prononciation, une amélioration d'affichage
   mobile, une branche linguistique à vérifier). Un dépôt sans porte d'entrée
   pour un premier contributeur n'en reçoit pas.

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
> No API key anywhere, nothing stored server-side, the wiki text is fetched live
> in ten languages. Code is MIT, the SCP content stays CC BY-SA 3.0 and every
> file carries its author credit — which the licence requires and which I had
> initially got wrong.
>
> Live: https://scp-audio-roleplay.vercel.app
> Code: https://github.com/atari643/scp-audio-roleplay

### Reddit — r/SCP

> **J'ai fait un lecteur audio des dossiers SCP, avec une voix par personnage**
>
> Pas une synthèse vocale qui lit tout d'une traite : le narrateur pose le
> dossier, le chercheur donne la procédure, l'anomalie répond dans l'entretien,
> le Classe-D crie, l'intercom du Site-19 coupe la parole à tout le monde.
>
> Le caviardage devient un bip placé à l'instant exact où le texte est noirci.
> Les notes de bas de page sont dites à leur place, pas entassées à la fin. Les
> dossiers sont lus en direct depuis le wiki, dans dix branches linguistiques.
>
> Rien à installer, rien à créer : https://scp-audio-roleplay.vercel.app
>
> C'est un projet de fan, non officiel, sans revenu. Le contenu reste CC BY-SA
> 3.0 et chaque dossier affiche son auteur, son traducteur et sa source.
> Retours bienvenus, surtout sur les dossiers qui se lisent mal — c'est
> reproductible avec le numéro, la langue et la voix.

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
  réellement rapporté, et la fenêtre est glissante : relevez-la, elle s'efface.
- Répondez à **toutes** les issues dans les 24 h, même par « pas tout de suite ».
- Une annonce sans suite retombe. Un rythme de publication, même lent, retient
  les gens qui ont mis une étoile.

## 6. Ce qui manque encore au produit, et qui compte pour la diffusion

- **Les liens profonds.** L'application n'a pas de routeur : impossible de
  partager « écoute SCP-173 ici ». Chaque partage est aujourd'hui un lien vers
  l'accueil. C'est la fonctionnalité qui rendrait le projet réellement
  partageable, et sans doute le meilleur investissement avant une annonce.
- **Une démonstration visuelle.** Les dépôts qui montrent le produit en
  mouvement — un GIF de trente secondes, pas davantage — obtiennent nettement
  plus d'engagement qu'une description, si bonne soit-elle. Il en faut un dans le
  README, au-dessus du pli.
