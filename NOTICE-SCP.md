# Attribution du contenu — Fondation SCP

Cette application **ne contient aucun dossier SCP**. Elle les récupère à la
demande sur le wiki communautaire de la Fondation SCP, via l'API publique
[Crom](https://api.crom.avn.sh/graphql), et les met en voix.

## Licence du contenu

Tout le contenu du wiki SCP — texte des dossiers, contes, noms d'entités — est
publié sous licence
**[Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0)](https://creativecommons.org/licenses/by-sa/3.0/)**.

Cette licence impose trois choses, que l'application respecte ainsi :

| Obligation | Comment elle est remplie |
|---|---|
| **Attribution** | Chaque dossier affiche un bouton « Source » qui ouvre la page d'origine sur le wiki, seule source faisant foi pour la liste des auteurs. Présent dans le lecteur de bureau comme dans le lecteur mobile. |
| **Lien vers la licence** | Cette page, référencée depuis le README et depuis le dépôt. |
| **Indication des modifications** | L'application ne modifie pas le texte. Elle le découpe en répliques, attribue une voix à chaque personnage et normalise certaines formes **pour la prononciation uniquement** (« SCP-173 » lu « SCP cent soixante-treize ») : le texte affiché à l'écran reste celui du wiki. |

## Branches couvertes

Les dossiers sont lus dans la langue de leur branche d'origine. Les branches
interrogées sont les wikis officiels de chaque communauté, notamment :

- <http://fondationscp.wikidot.com> (français)
- <http://scp-wiki.wikidot.com> (anglais)
- et les branches allemande, espagnole, italienne, japonaise, coréenne,
  polonaise, russe et chinoise.

## Marques et identité visuelle

« SCP », le logo de la Fondation et l'univers associé sont l'œuvre collective de
la communauté SCP. Ce projet est un **projet de fan, non officiel**, sans aucun
lien avec les administrateurs du wiki, et il n'en tire aucun revenu.

## Voix

La synthèse vocale utilise le service de lecture à voix haute d'Edge, sans clé
d'API. Les voix produites sont celles de Microsoft ; aucun enregistrement n'est
stocké côté serveur — l'audio est mis en cache dans le navigateur de
l'utilisateur (IndexedDB) et nulle part ailleurs.

## Une erreur d'attribution ?

Si vous êtes l'auteur d'un dossier et que la façon dont il est présenté ici vous
pose problème, [ouvrez une issue](https://github.com/atari643/scp-audio-roleplay/issues)
— le sujet sera traité en priorité.
