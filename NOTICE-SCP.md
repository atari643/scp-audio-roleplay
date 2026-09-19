# Attribution du contenu — Fondation SCP

> La [licence MIT](LICENSE) de ce dépôt couvre **le code, et lui seul**. Le
> contenu des dossiers SCP que l'application lit à voix haute appartient au wiki
> communautaire et reste publié sous **CC BY-SA 3.0** — c'est l'objet de cette
> page.

Cette application **ne contient aucun dossier SCP**. Elle les récupère à la
demande sur le wiki communautaire de la Fondation SCP, via l'API publique
[Crom](https://api.crom.avn.sh/graphql), et les met en voix.

## Licence du contenu

Tout le contenu du wiki SCP — texte des dossiers, contes, noms d'entités — est
publié sous licence
**[Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0)](https://creativecommons.org/licenses/by-sa/3.0/deed.fr)**.
Le [guide de licence](https://scp-wiki.wikidot.com/licensing-guide) du wiki et
les [informations légales](http://fondationscp.wikidot.com/legal) de la branche
française font foi ; aucune migration vers la version 4.0 n'a eu lieu.

La branche française résume l'obligation d'attribution par l'acronyme **TSAL** :
**T**itre, **S**ource, **A**uteur, **L**icence. Un lien vers la page d'origine
couvre les trois premiers, pas l'auteur — c'est pourquoi l'application affiche
un pavé de crédits au bas de chaque dossier, dans les deux lecteurs :

| Obligation | Comment elle est remplie |
|---|---|
| **Titre** | Le titre du dossier tel que le wiki l'écrit, repris dans le pavé de crédits. |
| **Source** | Lien vers la page d'origine, dans le pavé de crédits et dans le bouton « Source » de la barre d'outils. |
| **Auteur** | Les crédits sont demandés à Crom (`attributions`) et affichés avec leur rôle : auteur, traducteur, réécriture… Pour une traduction, **l'auteur de l'original est cité en plus du traducteur**, comme la licence l'exige. Si Crom ne connaît pas les crédits d'une page, l'application le dit et renvoie à la page d'origine plutôt que de laisser croire qu'il n'y a pas d'auteur. |
| **Licence** | Nommée et liée dans le pavé de crédits de chaque dossier, ainsi que sur cette page. |
| **Indication des modifications** | L'application ne modifie pas le texte. Elle le découpe en répliques, attribue une voix à chaque personnage et normalise certaines formes **pour la prononciation uniquement** (« SCP-173 » lu « SCP cent soixante-treize ») : le texte affiché à l'écran reste celui du wiki. |

### Et la clause « partage dans les mêmes conditions » ?

CC BY-SA impose qu'une **œuvre dérivée** soit republiée sous la même licence.
Ce dépôt ne contient ni ne redistribue aucun texte SCP : le code est un lecteur,
écrit indépendamment, et il est publié sous [licence MIT](LICENSE). La lecture
audio d'un dossier est produite à la demande sur l'appareil de l'utilisateur et
n'est stockée nulle part ailleurs que dans son propre navigateur.

Si vous réutilisez une capture, un enregistrement ou un extrait de dossier
produit avec cette application, **c'est CC BY-SA 3.0 qui s'applique à ce que
vous publiez**, et la règle TSAL avec.

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
